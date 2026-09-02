import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import { CHARACTERS, SKILL_ORDER, labelSkill, stepDie } from './characters.js';
import { ROOM_STATE_KEY, SYNC_CHANNEL, CHAT_CHANNEL, SHEET_MODAL_ID, normalizeRuntimeState, isAuthorized, makeBonusDie, applyOperation, validateStateSize } from './core.js';
import { rollOp2Test } from './roll.js';

const params = new URLSearchParams(location.search);
const characterId = params.get('id') || 'alan';
const character = CHARACTERS[characterId];
const openedFromChat = params.get('from') === 'chat';
const desktopPortraitQuery = matchMedia('(min-width: 1121px)');
const state = { role:'PLAYER', playerId:'preview', party:[], roomState:normalizeRuntimeState(null), toastTimer:null, rollTimer:null, pendingMutations:new Map(), mutationQueue:Promise.resolve() };
const $ = s => document.querySelector(s);
const attrLabel = key => key==='fisico'?'Físico':key==='mente'?'Mente':'Emoção';

function escapeHtml(value=''){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function runtime(){return state.roomState.characters[characterId]}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.remove('hidden');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.add('hidden'),3200)}
function dieImg(sides,cls=''){return `<img class="die-asset ${cls}" src="./assets/dice/d${Number(sides)}.png" alt="d${Number(sides)}" />`}
function inlineDie(sides=4,cls=''){return `<span class="inline-die ${cls}" aria-label="d${sides}">${dieImg(sides)}</span>`}
function mechanicDieImg(sides){const profile=character.profile.toLowerCase();return `<img class="die-asset mechanic-die-asset" src="./assets/dice/profile/${profile}/d${Number(sides)}.png" alt="d${Number(sides)}" />`}
function inlineMechanicDie(sides=4){return `<span class="inline-die mechanic-die" aria-label="d${sides}">${mechanicDieImg(sides)}</span>`}

async function writeDirect(operation){
  const meta=await OBR.room.getMetadata();
  const current=normalizeRuntimeState(meta[ROOM_STATE_KEY]);
  const next=applyOperation(current,{...operation,characterId},{playerId:state.playerId,role:state.role});
  const size=validateStateSize(next);
  if(!size.ok)throw new Error(`Estado das fichas excederia ${(size.bytes/1024).toFixed(1)} KB.`);
  await OBR.room.setMetadata({[ROOM_STATE_KEY]:next});
  state.roomState=normalizeRuntimeState(next);
  renderDynamic();
  return state.roomState;
}

function requestMutationFromGM(operation){
  const requestId=crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{state.pendingMutations.delete(requestId);reject(new Error('A alteração não foi confirmada pelo Owlbear. Tente novamente.'))},4500);
    state.pendingMutations.set(requestId,{resolve,reject,timer});
    OBR.broadcast.sendMessage(SYNC_CHANNEL,{type:'mutation',requestId,senderPlayerId:state.playerId,operation:{...operation,characterId}},{destination:'ALL'}).catch(error=>{
      clearTimeout(timer);state.pendingMutations.delete(requestId);reject(error);
    });
  });
}

function sendMutation(operation){
  const execute=async()=>{
    if(!OBR.isAvailable){state.roomState=localApply(operation);renderDynamic();return state.roomState}
    // Serialize mutations so rapid clicks cannot overwrite resource updates from the same stale state.
    if(state.role==='GM')return writeDirect(operation);
    return requestMutationFromGM(operation);
  };
  const queued=state.mutationQueue.then(execute,execute);
  state.mutationQueue=queued.catch(()=>{});
  return queued;
}

function safeMutation(operation){return sendMutation(operation).catch(error=>{toast(error?.message||String(error));return null})}

function localApply(op){
  const next=structuredClone(state.roomState),rt=next.characters[characterId];
  if(op.type==='adjust-resource')rt[op.resource]=Math.max(0,Math.min(op.resource==='pv'?character.maxPV:character.maxPD,rt[op.resource]+Number(op.delta||0)));
  if(op.type==='impulse-set')rt.impulse=Math.max(0,Math.min(3,Number(op.value)||0));
  if(op.type==='impulse-adjust')rt.impulse=Math.max(0,Math.min(3,rt.impulse+Number(op.delta||0)));
  if(op.type==='impulse-spend-one'&&rt.impulse>0){rt.impulse--;rt.pendingDice.push(makeBonusDie('Ímpeto','any',{effectKey:`impulse-${Date.now()}`}))}
  if(op.type==='impulse-spend-three'&&rt.impulse>=3){rt.impulse-=3;rt.stepMods[op.attribute]=Math.min(4,(rt.stepMods[op.attribute]||0)+1)}
  if(op.type==='ability-focus'&&rt.pd>=2){const key=`focus:${op.scope}`;if(!rt.pendingDice.some(d=>d.effectKey===key)){rt.pd-=2;rt.pendingDice.push(makeBonusDie(op.source,op.scope,{effectKey:key}))}}
  if(op.type==='ability-evaluation'&&rt.pd>=2&&rt.evaluationDice===0&&!rt.pendingDice.some(d=>d.source==='Avaliação')){rt.pd-=2;rt.evaluationDice=2}
  if(op.type==='evaluation-use'&&rt.evaluationDice>=Number(op.count||1)){const count=Number(op.count||1);rt.evaluationDice-=count;for(let i=0;i<count;i++)rt.pendingDice.push(makeBonusDie('Avaliação','any',{effectKey:`evaluation-${Date.now()}-${i}`}))}
  if(op.type==='ability-readiness'&&rt.pd>=3&&!rt.readiness){rt.pd-=3;rt.readiness=true}
  if(op.type==='readiness-set')rt.readiness=Boolean(op.value);
  if(op.type==='consume-pending'){const ids=new Set(op.ids||[]);rt.pendingDice=rt.pendingDice.filter(d=>!ids.has(d.id))}
  if(op.type==='resolve-roll'){const ids=new Set(op.consumedIds||[]);rt.pendingDice=rt.pendingDice.filter(d=>!ids.has(d.id));if(character.profile==='Executor'&&op.failed===true)rt.impulse=Math.min(3,rt.impulse+1)}
  if(op.type==='step-reset')rt.stepMods={fisico:0,mente:0,emocao:0};
  return normalizeRuntimeState(next);
}

function syncPortraitAsset(){const stage=$('.portrait-stage');if(!stage||!character)return;let img=$('#portrait');if(desktopPortraitQuery.matches){if(!img){img=document.createElement('img');img.id='portrait';stage.appendChild(img)}if(img.getAttribute('src')!==character.portrait)img.src=character.portrait;img.alt=character.name}else if(img){img.remove()}}
function renderStatic(){
  document.documentElement.style.setProperty('--accent',character.accent);
  $('#name').textContent=character.name;$('#preloadName').textContent=character.name;$('#profile').textContent=character.profile;$('#occupation').textContent=character.occupation;$('#level').textContent=character.level;syncPortraitAsset();
  if(openedFromChat){const close=$('#close');close.querySelector('span').textContent='VOLTAR AO CHAT'}
}

function renderAttributes(){
  const rt=runtime();
  $('#attributes').innerHTML=Object.entries(character.attributes).map(([key,base])=>{
    const sides=stepDie(base,rt.stepMods[key]);const delta=rt.stepMods[key];
    return `<div class="attribute-card"><span class="label">${attrLabel(key)}</span><span class="attribute-die">${mechanicDieImg(sides)}</span>${delta?`<span class="step-note">${delta>0?'+':''}${delta} PASSO${Math.abs(delta)>1?'S':''}</span>`:''}</div>`;
  }).join('');
}

function renderSkills(){
  const rt=runtime();
  $('#skills').innerHTML=SKILL_ORDER.map(key=>{
    const skill=character.skills[key],attr=skill.attribute,attrSides=stepDie(character.attributes[attr],rt.stepMods[attr]);
    return `<div class="skill-row">
      <span class="skill-name" title="${escapeHtml(labelSkill(character,key))}">${escapeHtml(labelSkill(character,key))}</span>
      <span class="die-icon-wrap">${mechanicDieImg(skill.die)}</span>
      <span class="plus">+</span>
      <span class="die-icon-wrap">${mechanicDieImg(attrSides)}</span>
      <span class="attr-name">${attrLabel(attr)}</span>
      <button class="roll-skill" data-skill="${key}">ROLAR</button>
    </div>`;
  }).join('');
  $('#skills').querySelectorAll('[data-skill]').forEach(btn=>btn.addEventListener('click',()=>rollSkill(btn.dataset.skill)));
}

function pips(value,max){return Array.from({length:max},(_,i)=>`<span class="pip ${i<value?'on':''}"></span>`).join('')}
function renderResources(){const rt=runtime();$('#pvValue').textContent=rt.pv;$('#pvMax').textContent=character.maxPV;$('#pdValue').textContent=rt.pd;$('#pdMax').textContent=character.maxPD;$('#pvPips').innerHTML=pips(rt.pv,character.maxPV);$('#pdPips').innerHTML=pips(rt.pd,character.maxPD)}

function bolts(count){return `<span class="bolt-stack" aria-label="${count} espaço${count>1?'s':''} de ímpeto">${Array.from({length:count},()=>'<i class="bolt-icon"></i>').join('')}</span>`}
function abilityCost(ability){if(['foco-mental','foco-emocional','avaliacao'].includes(ability.id))return'2 PD';if(ability.id==='prontidao')return'3 PD';return''}
function formatAbilityText(ability){
  const text=ability?.text||'';
  const highlightTerms=[...(ability?.highlights||[])].sort((a,b)=>b.length-a.length);
  const highlightOnce=new Set((ability?.highlightOnce||[]).map(x=>String(x).toLocaleLowerCase('pt-BR')));
  const seenHighlights=new Map();
  const escapeRegex=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const termPattern=value=>`\\b${escapeRegex(value)}\\b`;
  const parts=[
    'dois dados d(?:4|6|8|10|12|20)',
    '\\+?2d(?:4|6|8|10|12|20)',
    '\\+?d(?:4|6|8|10|12|20)',
    ...highlightTerms.map(termPattern)
  ];
  const pattern=new RegExp(`(${parts.join('|')})`,'gi');
  let out='',last=0;
  for(const match of text.matchAll(pattern)){
    out+=escapeHtml(text.slice(last,match.index));const token=match[0];
    const dieMatch=token.match(/d(4|6|8|10|12|20)/i);
    if(dieMatch){
      const sides=Number(dieMatch[1]);
      const pair=/^\+?(?:dois dados|2d)/i.test(token);
      if(token.startsWith('+'))out+='<strong class="mechanic mechanic-symbol">+</strong>';
      out+=inlineMechanicDie(sides)+(pair?inlineMechanicDie(sides):'');
    } else {
      const key=token.toLocaleLowerCase('pt-BR');const seen=seenHighlights.get(key)||0;seenHighlights.set(key,seen+1);
      out+=highlightOnce.has(key)&&seen>0?escapeHtml(token):`<strong class="mechanic">${escapeHtml(token)}</strong>`;
    }
    last=match.index+token.length;
  }
  out+=escapeHtml(text.slice(last));return out;
}

function benefitButton(label,attrs=''){return `<button ${attrs}>${label}</button>`}
function evaluationControls(rt){
  const prepared=rt.pendingDice.filter(d=>d.source==='Avaliação').length;
  const slots=[];
  for(let i=0;i<prepared;i++)slots.push(`<button class="evaluation-die prepared" disabled aria-label="Dado de Avaliação preparado">${inlineMechanicDie(4)}<span>PREPARADO</span></button>`);
  for(let i=0;i<rt.evaluationDice;i++)slots.push(`<button class="evaluation-die" data-eval-use="1" aria-label="Preparar um d4 de Avaliação">${inlineMechanicDie(4)}<span>PREPARAR</span></button>`);
  while(slots.length<2)slots.push(`<span class="evaluation-die spent" aria-label="Dado de Avaliação consumido">${inlineMechanicDie(4)}<span>USADO</span></span>`);
  return slots.join('');
}
function abilityActions(ability){
  const rt=runtime();
  if(ability.id==='foco-mental'){
    const active=rt.pendingDice.some(d=>d.effectKey==='focus:mente'||(d.source==='Foco Mental'&&d.scope==='mente'));
    return `<div class="ability-actions">${benefitButton(`+${inlineMechanicDie(4)} NO PRÓXIMO TESTE MENTAL`,active?'disabled aria-disabled="true"':'data-action="focus-mental"')}</div>`;
  }
  if(ability.id==='foco-emocional'){
    const active=rt.pendingDice.some(d=>d.effectKey==='focus:emocao'||(d.source==='Foco Emocional'&&d.scope==='emocao'));
    return `<div class="ability-actions">${benefitButton(`+${inlineMechanicDie(4)} NO PRÓXIMO TESTE EMOCIONAL`,active?'disabled aria-disabled="true"':'data-action="focus-emotional"')}</div>`;
  }
  if(ability.id==='avaliacao'){
    const prepared=rt.pendingDice.filter(d=>d.source==='Avaliação').length;const active=rt.evaluationDice>0||prepared>0;
    return `<div class="ability-actions evaluation-actions"><button data-action="evaluation" ${rt.pd<2||active?'disabled':''}>ATIVAR AVALIAÇÃO</button>${active?`<div class="evaluation-resource"><span>DADOS DE AVALIAÇÃO</span><div class="evaluation-dice">${evaluationControls(rt)}</div></div>`:''}</div>`;
  }
  if(ability.id==='prontidao') return `<div class="ability-actions">${rt.readiness?'<button class="danger-action" data-action="readiness-clear">ENCERRAR PRONTIDÃO</button>':`<button data-action="readiness" ${rt.pd<3?'disabled':''}>ATIVAR RODADA ANTECIPADA</button>`}</div>`;
  if(ability.id==='impeto') return `<div class="impulse">${[1,2,3].map(n=>`<button class="impulse-slot ${rt.impulse>=n?'on':''}" data-impulse="${n}" aria-label="Ímpeto ${n}"></button>`).join('')}</div><div class="ability-actions impulse-actions"><button class="impulse-cost" data-action="impulse-one" ${rt.impulse<1?'disabled':''}>${bolts(1)}<span>+${inlineMechanicDie(4)} NO TESTE</span></button><button class="impulse-cost" data-impulse-three="fisico" ${rt.impulse<3?'disabled':''}>${bolts(3)}<span>+1 PASSO FÍSICO</span></button><button class="impulse-cost" data-impulse-three="mente" ${rt.impulse<3?'disabled':''}>${bolts(3)}<span>+1 PASSO MENTE</span></button><button class="impulse-cost" data-impulse-three="emocao" ${rt.impulse<3?'disabled':''}>${bolts(3)}<span>+1 PASSO EMOÇÃO</span></button>${Object.values(rt.stepMods).some(Boolean)?'<button data-action="step-reset">ENCERRAR AUMENTOS DE PASSO</button>':''}</div>`;
  return '';
}

function renderAbilities(){
  $('#abilities').innerHTML=character.abilities.map(a=>{const cost=abilityCost(a);return `<article class="ability-card"><div class="ability-title"><h2>${escapeHtml(a.name)}</h2>${cost?`<span class="ability-cost">${cost}</span>`:''}</div><p>${formatAbilityText(a)}</p>${abilityActions(a)}</article>`}).join('');
  $('#abilities').querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>handleAbility(btn.dataset.action)));
  $('#abilities').querySelectorAll('[data-impulse]').forEach(btn=>btn.addEventListener('click',()=>safeMutation({type:'impulse-set',value:Number(btn.dataset.impulse)})));
  $('#abilities').querySelectorAll('[data-impulse-three]').forEach(btn=>btn.addEventListener('click',()=>safeMutation({type:'impulse-spend-three',attribute:btn.dataset.impulseThree})));
  $('#abilities').querySelectorAll('[data-eval-use]').forEach(btn=>btn.addEventListener('click',()=>safeMutation({type:'evaluation-use',count:1})));
}

function repeatedDice(sides,count){return Array.from({length:count},()=>inlineMechanicDie(sides)).join('')}
function pendingGroup(diceMarkup,label){return `<span class="pending-group"><span class="pending-dice">${diceMarkup}</span><span class="pending-label">${label}</span></span>`}
function renderPending(){
  const rt=runtime(),chips=[];const seen=new Set();
  for(const d of rt.pendingDice){
    if(d.source==='Avaliação')continue;
    const key=d.effectKey||`${d.source}:${d.scope}`;if(seen.has(key))continue;seen.add(key);
    chips.push(`<div class="pending-chip"><b>${escapeHtml(d.source).toUpperCase()}</b><span class="separator">·</span>${pendingGroup(`+${inlineMechanicDie(d.sides)}`,d.scope!=='any'?`NO PRÓXIMO TESTE ${attrLabel(d.scope).toUpperCase()}`:'NO PRÓXIMO TESTE')}</div>`)
  }
  const evalPrepared=rt.pendingDice.filter(d=>d.source==='Avaliação').length;
  if(rt.evaluationDice||evalPrepared){
    const groups=[];
    if(rt.evaluationDice)groups.push(pendingGroup(repeatedDice(4,rt.evaluationDice),(rt.evaluationDice>1?'DISPONÍVEIS':'DISPONÍVEL')));
    if(evalPrepared)groups.push(pendingGroup(repeatedDice(4,evalPrepared),`PREPARADO${evalPrepared>1?'S':''}`));
    chips.push(`<div class="pending-chip evaluation-pending"><b>AVALIAÇÃO ATIVA</b><span class="separator">·</span>${groups.join('<span class="separator secondary">·</span>')}</div>`)
  }
  if(rt.readiness)chips.push('<div class="pending-chip"><b>PRONTIDÃO ATIVA</b><span class="separator">·</span><span class="pending-label">RODADA ANTECIPADA</span></div>');
  if(!chips.length)chips.push('<div class="pending-chip empty">SEM EFEITOS TEMPORÁRIOS</div>');
  $('#pending').innerHTML=chips.join('');
}

function renderDynamic(){if(!character)return;renderAttributes();renderSkills();renderResources();renderAbilities();renderPending()}
function render(){if(!character){$('#unauthorized').textContent='Personagem inexistente.';$('#unauthorized').classList.remove('hidden');return}renderStatic();const auth=!OBR.isAvailable||isAuthorized(state.roomState,characterId,state.playerId,state.role);$('#unauthorized').classList.toggle('hidden',auth);$('#sheetBody').classList.toggle('hidden',!auth);if(auth)renderDynamic()}

async function handleAbility(action){
  const rt=runtime();
  try{
    if(action==='focus-mental'){if(rt.pd<2)throw new Error('PD insuficiente.');await sendMutation({type:'ability-focus',source:'Foco Mental',scope:'mente'});toast('FOCO MENTAL PREPARADO.');}
    if(action==='focus-emotional'){if(rt.pd<2)throw new Error('PD insuficiente.');await sendMutation({type:'ability-focus',source:'Foco Emocional',scope:'emocao'});toast('FOCO EMOCIONAL PREPARADO.');}
    if(action==='evaluation'){if(rt.pd<2)throw new Error('PD insuficiente.');if(rt.evaluationDice>0||rt.pendingDice.some(d=>d.source==='Avaliação'))throw new Error('Avaliação já está ativa.');await sendMutation({type:'ability-evaluation'});toast('AVALIAÇÃO ATIVA · 2 DADOS DISPONÍVEIS.');}
    if(action==='readiness'){if(rt.pd<3)throw new Error('PD insuficiente.');await sendMutation({type:'ability-readiness'});toast('PRONTIDÃO ATIVA.');}
    if(action==='readiness-clear')await sendMutation({type:'readiness-set',value:false});
    if(action==='impulse-one')await sendMutation({type:'impulse-spend-one'});
    if(action==='step-reset')await sendMutation({type:'step-reset'});
  }catch(e){toast(e.message||String(e))}
}

function resultState(result){if(result.criticalFailure)return['FALHA CRÍTICA','critical-failure'];if(result.criticalSuccess)return['SUCESSO CRÍTICO','critical-success'];if(result.success===false)return['FALHA','failure'];if(result.success===true)return['SUCESSO','success'];return['ROLAGEM','neutral']}
function resultMarkup(result,author,closable=false){
  const [status,cls]=resultState(result);
  return `<article class="result-card ${cls}"><div class="result-head"><div><div class="result-author">${escapeHtml(author)}</div><div class="result-title">${escapeHtml(result.label)}</div></div>${closable?'<button class="rr-close" aria-label="Fechar resultado">×</button>':''}</div><div class="result-dice">${result.dice.map(d=>`<div class="result-die"><span class="result-die-source">${escapeHtml(d.source)}</span><div class="result-die-value">${dieImg(d.sides)}<strong>${d.value}</strong></div></div>`).join('')}</div><div class="result-summary"><div class="result-total"><span>RESULTADO</span><strong>${result.total}</strong></div><span class="result-status">${status}</span></div>${result.dice.length>3?'<div class="result-note">OS TRÊS MAIORES RESULTADOS FORAM SOMADOS.</div>':''}</article>`;
}
function showRoll(result){const el=$('#rollResult');el.innerHTML=resultMarkup(result,character.name,true);el.classList.remove('hidden');el.querySelector('.rr-close').addEventListener('click',()=>el.classList.add('hidden'));clearTimeout(state.rollTimer);state.rollTimer=setTimeout(()=>el.classList.add('hidden'),9000)}

async function rollSkill(key){
  const skill=character.skills[key];if(!skill)return;
  const rt=runtime(),attr=skill.attribute,attrSides=stepDie(character.attributes[attr],rt.stepMods[attr]);
  // Mandatory attribute-scoped bonuses take priority when the four-die limit is reached.
  const compatible=rt.pendingDice.filter(d=>d.scope==='any'||d.scope===attr);
  const eligible=[...compatible.filter(d=>d.scope===attr),...compatible.filter(d=>d.scope==='any')].slice(0,2);
  const dice=[{sides:attrSides,source:attrLabel(attr),kind:'attribute'},{sides:skill.die,source:labelSkill(character,key),kind:'skill'},...eligible.map(d=>({sides:d.sides,source:d.source,kind:'bonus'}))];
  const result=rollOp2Test({dice,dt:7,label:`${labelSkill(character,key)} + ${attrLabel(attr)}`});
  showRoll(result);
  const consumedIds=eligible.map(d=>d.id);
  const failed=result.success===false;
  if(consumedIds.length||failed){
    try{await sendMutation({type:'resolve-roll',consumedIds,failed})}
    catch(error){toast(`ROLAGEM FEITA · ${error?.message||'NÃO FOI POSSÍVEL ATUALIZAR OS EFEITOS.'}`)}
  }
  const entry={id:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,type:'test',createdAt:Date.now(),authorId:state.playerId,authorName:character.name,characterId:character.id,accent:character.accent,result};
  if(OBR.isAvailable)OBR.broadcast.sendMessage(CHAT_CHANNEL,{type:'submit',entry},{destination:'ALL'}).catch(()=>{});
}

function setPreloadProgress(value,complete=false){
  const bar=$('#preloadProgress');if(!bar)return;
  const pct=Math.max(0,Math.min(100,Math.round(Number(value)||0)));
  bar.setAttribute('aria-valuenow',String(pct));bar.querySelector('span').style.width=`${pct}%`;
  bar.classList.toggle('complete',complete||pct>=100);
}
function preloadImage(src){return new Promise(resolve=>{const img=new Image();img.onload=img.onerror=()=>resolve();img.src=src})}
async function preloadCharacterAssets(){
  if(!character)return;
  const profile=character.profile.toLowerCase();
  const urls=[character.portrait,character.token,'./assets/ui/community-license.png',...([4,6,8,10,12,20].map(s=>`./assets/dice/profile/${profile}/d${s}.png`))];
  await Promise.all(urls.map(preloadImage));
}
function dismissPreloader(){setPreloadProgress(100,true);setTimeout(()=>{const el=$('#preloader');if(!el)return;el.classList.add('hide');setTimeout(()=>el.remove(),360)},260)}
async function closeSheet(){if(!OBR.isAvailable){history.back();return}try{await OBR.modal.close(SHEET_MODAL_ID)}catch{history.back()}}
async function setup(){
  desktopPortraitQuery.addEventListener?.('change',syncPortraitAsset);
  $('#close').addEventListener('click',closeSheet);
  document.querySelectorAll('[data-res]').forEach(btn=>btn.addEventListener('click',()=>safeMutation({type:'adjust-resource',resource:btn.dataset.res,delta:Number(btn.dataset.delta)})));
  renderStatic();setPreloadProgress(18);
  await Promise.all([document.fonts?.ready||Promise.resolve(),preloadCharacterAssets()]);setPreloadProgress(72);
  if(!OBR.isAvailable){render();dismissPreloader();return}
  await new Promise(resolve=>OBR.onReady(resolve));setPreloadProgress(84);
  [state.role,state.party]=await Promise.all([OBR.player.getRole(),OBR.party.getPlayers()]);state.playerId=OBR.player.id;
  const meta=await OBR.room.getMetadata();state.roomState=normalizeRuntimeState(meta[ROOM_STATE_KEY]);setPreloadProgress(94);render();dismissPreloader();
  OBR.room.onMetadataChange(meta=>{if(meta[ROOM_STATE_KEY]){state.roomState=normalizeRuntimeState(meta[ROOM_STATE_KEY]);render()}});
  OBR.party.onChange(p=>{state.party=p;renderDynamic()});
  OBR.broadcast.onMessage(SYNC_CHANNEL,event=>{
    const d=event.data||{};
    if(d.type!=='mutation-result')return;
    const pending=state.pendingMutations.get(d.requestId);
    if(d.ok&&d.state){state.roomState=normalizeRuntimeState(d.state);renderDynamic()}
    if(!pending){if(!d.ok&&d.error)toast(d.error);return}
    clearTimeout(pending.timer);state.pendingMutations.delete(d.requestId);
    if(d.ok)pending.resolve(state.roomState);
    else{const error=new Error(d.error||'Não foi possível atualizar a ficha.');toast(error.message);pending.reject(error)}
  });
}
setup().catch(e=>{console.error(e);toast(e.message||String(e));dismissPreloader()});
