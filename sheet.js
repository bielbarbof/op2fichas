import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import { CHARACTERS, SKILL_ORDER, labelSkill, stepDie } from './characters.js';
import { ROOM_STATE_KEY, SYNC_CHANNEL, CHAT_CHANNEL, normalizeRuntimeState, isAuthorized } from './core.js';
import { rollOp2Test } from './roll.js';

const params = new URLSearchParams(location.search);
const characterId = params.get('id') || 'alan';
const character = CHARACTERS[characterId];
const state = { role:'PLAYER', playerId:'preview', party:[], roomState:normalizeRuntimeState(null), toastTimer:null, rollTimer:null };
const $ = s => document.querySelector(s);

function escapeHtml(value=''){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function runtime(){return state.roomState.characters[characterId]}
function assignment(){return state.roomState.assignments?.[characterId] || null}
function controllerName(){const a=assignment();if(!a)return 'Não atribuído';return state.party.find(p=>p.id===a.playerId)?.name || a.playerName || 'Jogador'}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.remove('hidden');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.add('hidden'),3200)}

function sendMutation(operation){
  if (!OBR.isAvailable) { state.roomState = localApply(operation); renderDynamic(); return Promise.resolve(); }
  return OBR.broadcast.sendMessage(SYNC_CHANNEL,{type:'mutation',requestId:crypto.randomUUID?.()||String(Date.now()),operation:{...operation,characterId}},{destination:'ALL'});
}

function localApply(op){
  const next=structuredClone(state.roomState);const rt=next.characters[characterId];
  if(op.type==='adjust-resource')rt[op.resource]=Math.max(0,Math.min(op.resource==='pv'?character.maxPV:character.maxPD,rt[op.resource]+Number(op.delta||0)));
  if(op.type==='impulse-set')rt.impulse=Math.max(0,Math.min(3,Number(op.value)||0));
  if(op.type==='impulse-adjust')rt.impulse=Math.max(0,Math.min(3,rt.impulse+Number(op.delta||0)));
  return next;
}

function renderStatic(){
  document.documentElement.style.setProperty('--accent',character.accent);
  $('#name').textContent=character.name;$('#profile').textContent=character.profile;$('#occupation').textContent=character.occupation;$('#level').textContent=character.level;$('#portrait').src=character.portrait;$('#portrait').alt=character.name;
}

function renderAttributes(){
  const rt=runtime();
  $('#attributes').innerHTML=Object.entries(character.attributes).map(([key,base],i)=>{
    const sides=stepDie(base,rt.stepMods[key]);const delta=rt.stepMods[key];
    return `<div class="attribute-card"><div><span class="label">${key==='fisico'?'Físico':key==='mente'?'Mente':'Emoção'}</span>${delta?`<span class="step-note">${delta>0?'+':''}${delta} passo${Math.abs(delta)>1?'s':''} temporário</span>`:''}</div><span class="die-badge ${i===1?'':'square'}">${sides}</span></div>`;
  }).join('');
}

function renderSkills(){
  const rt=runtime();
  $('#skills').innerHTML=SKILL_ORDER.map(key=>{
    const skill=character.skills[key];const attr=skill.attribute;const attrSides=stepDie(character.attributes[attr],rt.stepMods[attr]);
    return `<div class="skill-row"><span class="skill-name" title="${escapeHtml(labelSkill(character,key))}">${escapeHtml(labelSkill(character,key))}</span><span class="skill-die">d<b>${skill.die}</b></span><span class="plus">+</span><span class="attr-die">d<b>${attrSides}</b></span><button class="roll-skill" data-skill="${key}">${attr==='fisico'?'FÍS':attr==='mente'?'MEN':'EMO'} // ROLAR</button></div>`;
  }).join('');
  $('#skills').querySelectorAll('[data-skill]').forEach(btn=>btn.addEventListener('click',()=>rollSkill(btn.dataset.skill)));
}

function pips(value,max){return Array.from({length:max},(_,i)=>`<span class="pip ${i<value?'on':''}"></span>`).join('')}

function renderResources(){
  const rt=runtime();$('#pvValue').textContent=rt.pv;$('#pvMax').textContent=character.maxPV;$('#pdValue').textContent=rt.pd;$('#pdMax').textContent=character.maxPD;$('#pvPips').innerHTML=pips(rt.pv,character.maxPV);$('#pdPips').innerHTML=pips(rt.pd,character.maxPD);
}

function abilityActions(ability){
  const rt=runtime();
  if(ability.id==='foco-mental') return `<div class="ability-actions"><button class="primary" data-action="focus-mental" ${rt.pd<2?'disabled':''}>GASTAR 2 PD // +d4 PRÓXIMO TESTE MENTAL</button></div>`;
  if(ability.id==='foco-emocional') return `<div class="ability-actions"><button class="primary" data-action="focus-emotional" ${rt.pd<2?'disabled':''}>GASTAR 2 PD // +d4 PRÓXIMO TESTE EMOCIONAL</button></div>`;
  if(ability.id==='avaliacao') return `<div class="ability-actions"><button class="primary" data-action="evaluation" ${rt.pd<2?'disabled':''}>GASTAR 2 PD // AVALIAR</button>${rt.evaluationDice?`<button data-eval-use="1">USAR 1d4 (${rt.evaluationDice})</button>${rt.evaluationDice>1?'<button data-eval-use="2">USAR 2d4</button>':''}`:''}</div>${rt.evaluationDice?`<span class="active-flag">AVALIAÇÃO // ${rt.evaluationDice}d4 disponível${rt.evaluationDice>1?'is':''}</span>`:''}`;
  if(ability.id==='prontidao') return `<div class="ability-actions">${rt.readiness?'<button class="primary" data-action="readiness-clear">PRONTIDÃO ATIVA // ENCERRAR</button>':`<button class="primary" data-action="readiness" ${rt.pd<3?'disabled':''}>GASTAR 3 PD // ATIVAR PRONTIDÃO</button>`}</div>`;
  if(ability.id==='impeto') return `<div class="impulse">${[1,2,3].map(n=>`<button class="impulse-slot ${rt.impulse>=n?'on':''}" data-impulse="${n}" aria-label="Ímpeto ${n}"></button>`).join('')}</div><div class="ability-actions"><button data-action="impulse-one" ${rt.impulse<1?'disabled':''}>GASTAR 1 // +d4</button><button data-impulse-three="fisico" ${rt.impulse<3?'disabled':''}>3 // +1 PASSO FÍSICO</button><button data-impulse-three="mente" ${rt.impulse<3?'disabled':''}>3 // +1 PASSO MENTE</button><button data-impulse-three="emocao" ${rt.impulse<3?'disabled':''}>3 // +1 PASSO EMOÇÃO</button>${Object.values(rt.stepMods).some(Boolean)?'<button data-action="step-reset">FIM DA CENA // LIMPAR PASSOS</button>':''}</div>`;
  return '';
}

function renderAbilities(){
  $('#abilities').innerHTML=character.abilities.map(a=>`<article class="ability-card"><div class="ability-title"><h2>${escapeHtml(a.name)}</h2></div><p>${escapeHtml(a.text)}</p>${abilityActions(a)}</article>`).join('');
  $('#abilities').querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>handleAbility(btn.dataset.action)));
  $('#abilities').querySelectorAll('[data-impulse]').forEach(btn=>btn.addEventListener('click',()=>sendMutation({type:'impulse-set',value:Number(btn.dataset.impulse)})));
  $('#abilities').querySelectorAll('[data-impulse-three]').forEach(btn=>btn.addEventListener('click',()=>sendMutation({type:'impulse-spend-three',attribute:btn.dataset.impulseThree})));
  $('#abilities').querySelectorAll('[data-eval-use]').forEach(btn=>btn.addEventListener('click',()=>sendMutation({type:'evaluation-use',count:Number(btn.dataset.evalUse)})));
}

function renderPending(){
  const rt=runtime();const chips=[];
  for(const d of rt.pendingDice)chips.push(`<div class="pending-chip"><b>+d${d.sides}</b> preparado // ${escapeHtml(d.source)}${d.scope!=='any'?` // ${d.scope.toUpperCase()}`:''}</div>`);
  if(rt.readiness)chips.push('<div class="pending-chip"><b>PRONTIDÃO ATIVA</b> // rodada antecipada</div>');
  if(!chips.length)chips.push('<div class="pending-chip">SEM EFEITOS TEMPORÁRIOS PREPARADOS</div>');
  $('#pending').innerHTML=chips.join('');
}

function renderDynamic(){
  if(!character)return;
  $('#controller').textContent=`CONTROLADOR // ${controllerName()}`;
  renderAttributes();renderSkills();renderResources();renderAbilities();renderPending();
}

function render(){
  if(!character){$('#unauthorized').textContent='Personagem inexistente.';$('#unauthorized').classList.remove('hidden');return}
  renderStatic();
  const auth=!OBR.isAvailable||isAuthorized(state.roomState,characterId,state.playerId,state.role);
  $('#unauthorized').classList.toggle('hidden',auth);$('#sheetBody').classList.toggle('hidden',!auth);
  if(auth)renderDynamic();
}

async function handleAbility(action){
  const rt=runtime();
  try{
    if(action==='focus-mental'){if(rt.pd<2)throw new Error('PD insuficiente.');await sendMutation({type:'ability-focus',source:'Foco Mental',scope:'mente'});toast('FOCO MENTAL PREPARADO // +d4 no próximo teste mental.');}
    if(action==='focus-emotional'){if(rt.pd<2)throw new Error('PD insuficiente.');await sendMutation({type:'ability-focus',source:'Foco Emocional',scope:'emocao'});toast('FOCO EMOCIONAL PREPARADO // +d4 no próximo teste emocional.');}
    if(action==='evaluation'){if(rt.pd<2)throw new Error('PD insuficiente.');await sendMutation({type:'ability-evaluation'});toast('AVALIAÇÃO // 2d4 disponíveis.');}
    if(action==='readiness'){if(rt.pd<3)throw new Error('PD insuficiente.');await sendMutation({type:'ability-readiness'});toast('PRONTIDÃO ATIVA.');}
    if(action==='readiness-clear')await sendMutation({type:'readiness-set',value:false});
    if(action==='impulse-one')await sendMutation({type:'impulse-spend-one'});
    if(action==='step-reset')await sendMutation({type:'step-reset'});
  }catch(e){toast(e.message||String(e))}
}

function showRoll(result){
  const el=$('#rollResult');
  const status=result.criticalSuccess?'SUCESSO CRÍTICO':result.criticalFailure?'FALHA CRÍTICA':result.success===true?'SUCESSO':result.success===false?'FALHA':'ROLAGEM';
  const cls=result.criticalSuccess||result.criticalFailure?'crit':result.success===true?'ok':result.success===false?'fail':'';
  el.innerHTML=`<div class="rr-head"><b>${escapeHtml(result.label)}</b><button class="rr-close">×</button></div><div class="rr-dice">${result.dice.map((d,i)=>`<div class="rr-die"><span>${escapeHtml(d.source)} // d${d.sides}</span><b>${d.value}</b></div>`).join('')}</div><div class="rr-total"><div><span>RESULTADO</span><strong>${result.total}</strong></div><div><span>RA</span><strong>${result.ra}</strong></div><div><span>RB</span><strong>${result.rb}</strong></div></div><div class="rr-meta">DT ${result.dt??'—'} // ${result.dice.length>3?'soma dos 3 maiores // ':''}<span class="rr-status ${cls}">${status}</span></div>`;
  el.classList.remove('hidden');el.querySelector('.rr-close').addEventListener('click',()=>el.classList.add('hidden'));clearTimeout(state.rollTimer);state.rollTimer=setTimeout(()=>el.classList.add('hidden'),9000);
}

async function rollSkill(key){
  const skill=character.skills[key];if(!skill)return;
  const rt=runtime();const override=$('#attributeOverride').value;const attr=override==='base'?skill.attribute:override;const attrSides=stepDie(character.attributes[attr],rt.stepMods[attr]);
  const eligible=rt.pendingDice.filter(d=>d.scope==='any'||d.scope===attr).slice(0,2);
  const dice=[{sides:attrSides,source:attr==='fisico'?'Físico':attr==='mente'?'Mente':'Emoção',kind:'attribute'},{sides:skill.die,source:labelSkill(character,key),kind:'skill'},...eligible.map(d=>({sides:d.sides,source:d.source,kind:'bonus'}))];
  const dt=Number($('#dtInput').value||7);const result=rollOp2Test({dice,dt,label:`${labelSkill(character,key)} + ${attr==='fisico'?'Físico':attr==='mente'?'Mente':'Emoção'}`});
  showRoll(result);
  if(eligible.length)await sendMutation({type:'consume-pending',ids:eligible.map(d=>d.id)}).catch(()=>{});
  if(character.profile==='Executor'&&result.success===false&&rt.impulse<3)await sendMutation({type:'impulse-adjust',delta:1}).catch(()=>{});
  const entry={id:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,type:'test',createdAt:Date.now(),authorId:state.playerId,authorName:character.name,characterId:character.id,accent:character.accent,result};
  if(OBR.isAvailable)OBR.broadcast.sendMessage(CHAT_CHANNEL,{type:'submit',entry},{destination:'ALL'}).catch(()=>{});
}

async function setup(){
  $('#close').addEventListener('click',()=>OBR.isAvailable?OBR.modal.close('com.op2.playtest.fichas/sheet').catch(()=>history.back()):history.back());
  document.querySelectorAll('[data-res]').forEach(btn=>btn.addEventListener('click',()=>sendMutation({type:'adjust-resource',resource:btn.dataset.res,delta:Number(btn.dataset.delta)})));
  if(!OBR.isAvailable){render();return}
  await new Promise(resolve=>OBR.onReady(resolve));
  [state.role,state.party]=await Promise.all([OBR.player.getRole(),OBR.party.getPlayers()]);state.playerId=OBR.player.id;
  const meta=await OBR.room.getMetadata();state.roomState=normalizeRuntimeState(meta[ROOM_STATE_KEY]);render();
  OBR.room.onMetadataChange(meta=>{if(meta[ROOM_STATE_KEY]){state.roomState=normalizeRuntimeState(meta[ROOM_STATE_KEY]);render();}});
  OBR.party.onChange(p=>{state.party=p;renderDynamic();});
  OBR.broadcast.onMessage(SYNC_CHANNEL,event=>{const d=event.data||{};if(d.type==='mutation-result'&&!d.ok&&d.error)toast(d.error)});
}
setup().catch(e=>{console.error(e);toast(e.message||String(e))});
