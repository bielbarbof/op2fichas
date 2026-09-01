import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import { CHARACTERS, SKILL_ORDER, labelSkill, stepDie } from './characters.js';
import { ROOM_STATE_KEY, SYNC_CHANNEL, CHAT_CHANNEL, normalizeRuntimeState, isAuthorized } from './core.js';
import { rollOp2Test } from './roll.js';

const params = new URLSearchParams(location.search);
const characterId = params.get('id') || 'alan';
const character = CHARACTERS[characterId];
const state = { role:'PLAYER', playerId:'preview', party:[], roomState:normalizeRuntimeState(null), toastTimer:null, rollTimer:null };
const $ = s => document.querySelector(s);
const attrLabel = key => key==='fisico'?'Físico':key==='mente'?'Mente':'Emoção';

function escapeHtml(value=''){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function runtime(){return state.roomState.characters[characterId]}
function assignment(){return state.roomState.assignments?.[characterId] || null}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.remove('hidden');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.add('hidden'),3200)}
function dieImg(sides,cls=''){return `<span class="die-glyph ${cls}" style="--die:url('./assets/dice/d${Number(sides)}.svg')" aria-label="d${Number(sides)}"></span>`}

function sendMutation(operation){
  if (!OBR.isAvailable) { state.roomState = localApply(operation); renderDynamic(); return Promise.resolve(); }
  return OBR.broadcast.sendMessage(SYNC_CHANNEL,{type:'mutation',requestId:crypto.randomUUID?.()||String(Date.now()),operation:{...operation,characterId}},{destination:'ALL'});
}

function localApply(op){
  const next=structuredClone(state.roomState);const rt=next.characters[characterId];
  if(op.type==='adjust-resource')rt[op.resource]=Math.max(0,Math.min(op.resource==='pv'?character.maxPV:character.maxPD,rt[op.resource]+Number(op.delta||0)));
  if(op.type==='impulse-set')rt.impulse=Math.max(0,Math.min(3,Number(op.value)||0));
  if(op.type==='impulse-adjust')rt.impulse=Math.max(0,Math.min(3,rt.impulse+Number(op.delta||0)));
  if(op.type==='impulse-spend-one'&&rt.impulse>0){rt.impulse--;rt.pendingDice.push({id:String(Date.now()),sides:4,scope:'any',source:'Ímpeto'})}
  if(op.type==='step-reset')rt.stepMods={fisico:0,mente:0,emocao:0};
  return next;
}

function renderStatic(){
  document.documentElement.style.setProperty('--accent',character.accent);
  $('#name').textContent=character.name;$('#preloadName').textContent=character.name;$('#profile').textContent=character.profile;$('#occupation').textContent=character.occupation;$('#level').textContent=character.level;$('#portrait').src=character.portrait;$('#portrait').alt=character.name;
}

function renderAttributes(){
  const rt=runtime();
  $('#attributes').innerHTML=Object.entries(character.attributes).map(([key,base])=>{
    const sides=stepDie(base,rt.stepMods[key]);const delta=rt.stepMods[key];
    return `<div class="attribute-card"><span class="label">${attrLabel(key)}</span><span class="attribute-die">${dieImg(sides)}<b>${sides}</b></span>${delta?`<span class="step-note">${delta>0?'+':''}${delta} PASSO${Math.abs(delta)>1?'S':''}</span>`:''}</div>`;
  }).join('');
}

function renderSkills(){
  const rt=runtime();
  $('#skills').innerHTML=SKILL_ORDER.map(key=>{
    const skill=character.skills[key];const attr=skill.attribute;const attrSides=stepDie(character.attributes[attr],rt.stepMods[attr]);
    return `<div class="skill-row">
      <span class="skill-name" title="${escapeHtml(labelSkill(character,key))}">${escapeHtml(labelSkill(character,key))}</span>
      <span class="die-icon-wrap"><span class="die-icon">${dieImg(skill.die)}</span><span class="die-icon-value">${skill.die}</span></span>
      <span class="plus">+</span>
      <span class="die-icon-wrap"><span class="die-icon">${dieImg(attrSides)}</span><span class="die-icon-value">${attrSides}</span></span>
      <span class="attr-name">${attrLabel(attr)}</span>
      <button class="roll-skill" data-skill="${key}">ROLAR</button>
    </div>`;
  }).join('');
  $('#skills').querySelectorAll('[data-skill]').forEach(btn=>btn.addEventListener('click',()=>rollSkill(btn.dataset.skill)));
}

function pips(value,max){return Array.from({length:max},(_,i)=>`<span class="pip ${i<value?'on':''}"></span>`).join('')}
function renderResources(){const rt=runtime();$('#pvValue').textContent=rt.pv;$('#pvMax').textContent=character.maxPV;$('#pdValue').textContent=rt.pd;$('#pdMax').textContent=character.maxPD;$('#pvPips').innerHTML=pips(rt.pv,character.maxPV);$('#pdPips').innerHTML=pips(rt.pd,character.maxPD)}

function bolts(count){return `<span class="bolt-stack">${Array.from({length:count},()=>'<i class="bolt-icon"></i>').join('')}</span>`}
function abilityActions(ability){
  const rt=runtime();
  if(ability.id==='foco-mental') return `<div class="ability-actions"><button data-action="focus-mental" ${rt.pd<2?'disabled':''}>GASTAR 2 PD · +D4 NO PRÓXIMO TESTE MENTAL</button></div>`;
  if(ability.id==='foco-emocional') return `<div class="ability-actions"><button data-action="focus-emotional" ${rt.pd<2?'disabled':''}>GASTAR 2 PD · +D4 NO PRÓXIMO TESTE EMOCIONAL</button></div>`;
  if(ability.id==='avaliacao') return `<div class="ability-actions"><button data-action="evaluation" ${rt.pd<2?'disabled':''}>GASTAR 2 PD · AVALIAR</button>${rt.evaluationDice?`<button data-eval-use="1">USAR 1D4 (${rt.evaluationDice})</button>${rt.evaluationDice>1?'<button data-eval-use="2">USAR 2D4</button>':''}`:''}</div>${rt.evaluationDice?`<span class="active-flag">AVALIAÇÃO · ${rt.evaluationDice}D4 DISPONÍVEL${rt.evaluationDice>1?'IS':''}</span>`:''}`;
  if(ability.id==='prontidao') return `<div class="ability-actions">${rt.readiness?'<button data-action="readiness-clear">PRONTIDÃO ATIVA · ENCERRAR</button>':`<button data-action="readiness" ${rt.pd<3?'disabled':''}>GASTAR 3 PD · ATIVAR PRONTIDÃO</button>`}</div>`;
  if(ability.id==='impeto') return `<div class="impulse">${[1,2,3].map(n=>`<button class="impulse-slot ${rt.impulse>=n?'on':''}" data-impulse="${n}" aria-label="Ímpeto ${n}"></button>`).join('')}</div><div class="ability-actions"><button class="impulse-cost" data-action="impulse-one" ${rt.impulse<1?'disabled':''}>${bolts(1)}<span>+D4 NO TESTE</span></button><button class="impulse-cost" data-impulse-three="fisico" ${rt.impulse<3?'disabled':''}>${bolts(3)}<span>+1 PASSO FÍSICO</span></button><button class="impulse-cost" data-impulse-three="mente" ${rt.impulse<3?'disabled':''}>${bolts(3)}<span>+1 PASSO MENTE</span></button><button class="impulse-cost" data-impulse-three="emocao" ${rt.impulse<3?'disabled':''}>${bolts(3)}<span>+1 PASSO EMOÇÃO</span></button>${Object.values(rt.stepMods).some(Boolean)?'<button data-action="step-reset">FIM DA CENA · LIMPAR PASSOS</button>':''}</div>`;
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
  for(const d of rt.pendingDice)chips.push(`<div class="pending-chip"><b>${escapeHtml(d.source).toUpperCase()}</b><span class="separator">·</span><span>+D${d.sides}${d.scope!=='any'?` · ${attrLabel(d.scope).toUpperCase()}`:''}</span></div>`);
  if(rt.readiness)chips.push('<div class="pending-chip"><b>PRONTIDÃO ATIVA</b><span class="separator">·</span><span>RODADA ANTECIPADA</span></div>');
  if(!chips.length)chips.push('<div class="pending-chip empty">SEM EFEITOS TEMPORÁRIOS</div>');
  $('#pending').innerHTML=chips.join('');
}

function renderDynamic(){if(!character)return;renderAttributes();renderSkills();renderResources();renderAbilities();renderPending()}
function render(){if(!character){$('#unauthorized').textContent='Personagem inexistente.';$('#unauthorized').classList.remove('hidden');return}renderStatic();const auth=!OBR.isAvailable||isAuthorized(state.roomState,characterId,state.playerId,state.role);$('#unauthorized').classList.toggle('hidden',auth);$('#sheetBody').classList.toggle('hidden',!auth);if(auth)renderDynamic()}

async function handleAbility(action){
  const rt=runtime();
  try{
    if(action==='focus-mental'){if(rt.pd<2)throw new Error('PD insuficiente.');await sendMutation({type:'ability-focus',source:'Foco Mental',scope:'mente'});toast('FOCO MENTAL PREPARADO · +D4 NO PRÓXIMO TESTE MENTAL.');}
    if(action==='focus-emotional'){if(rt.pd<2)throw new Error('PD insuficiente.');await sendMutation({type:'ability-focus',source:'Foco Emocional',scope:'emocao'});toast('FOCO EMOCIONAL PREPARADO · +D4 NO PRÓXIMO TESTE EMOCIONAL.');}
    if(action==='evaluation'){if(rt.pd<2)throw new Error('PD insuficiente.');await sendMutation({type:'ability-evaluation'});toast('AVALIAÇÃO · 2D4 DISPONÍVEIS.');}
    if(action==='readiness'){if(rt.pd<3)throw new Error('PD insuficiente.');await sendMutation({type:'ability-readiness'});toast('PRONTIDÃO ATIVA.');}
    if(action==='readiness-clear')await sendMutation({type:'readiness-set',value:false});
    if(action==='impulse-one')await sendMutation({type:'impulse-spend-one'});
    if(action==='step-reset')await sendMutation({type:'step-reset'});
  }catch(e){toast(e.message||String(e))}
}

function resultState(result){if(result.criticalFailure)return['FALHA CRÍTICA','critical-failure'];if(result.criticalSuccess)return['SUCESSO CRÍTICO','critical-success'];if(result.success===false)return['FALHA','failure'];if(result.success===true)return['SUCESSO','success'];return['ROLAGEM','neutral']}
function showRoll(result){
  const el=$('#rollResult');const [status,cls]=resultState(result);
  el.innerHTML=`<article class="result-card ${cls}" style="${cls==='neutral'?`--result-accent:${character.accent}`:''}"><div class="result-head"><div><div class="result-author">${escapeHtml(character.name)}</div><div class="result-title">${escapeHtml(result.label)}</div></div><button class="rr-close">×</button></div><div class="result-dice">${result.dice.map(d=>`<div class="result-die"><div class="result-die-top">${dieImg(d.sides)}<span>${escapeHtml(d.source)}</span></div><strong>${d.value}</strong></div>`).join('')}</div><div class="result-main"><div class="result-total"><span>RESULTADO</span><strong>${result.total}</strong></div><div class="result-metric"><span>RA</span><strong>${result.ra}</strong></div><div class="result-metric"><span>RB</span><strong>${result.rb}</strong></div></div><div class="result-bottom"><span class="result-status">${status}</span><span class="result-dt">DT ${result.dt??'—'}</span></div>${result.dice.length>3?'<div class="result-note">Soma dos três maiores resultados.</div>':''}</article>`;
  el.classList.remove('hidden');el.querySelector('.rr-close').addEventListener('click',()=>el.classList.add('hidden'));clearTimeout(state.rollTimer);state.rollTimer=setTimeout(()=>el.classList.add('hidden'),9000);
}

async function rollSkill(key){
  const skill=character.skills[key];if(!skill)return;
  const rt=runtime();const override=$('#attributeOverride').value;const attr=override==='base'?skill.attribute:override;const attrSides=stepDie(character.attributes[attr],rt.stepMods[attr]);
  const eligible=rt.pendingDice.filter(d=>d.scope==='any'||d.scope===attr).slice(0,2);
  const dice=[{sides:attrSides,source:attrLabel(attr),kind:'attribute'},{sides:skill.die,source:labelSkill(character,key),kind:'skill'},...eligible.map(d=>({sides:d.sides,source:d.source,kind:'bonus'}))];
  const dt=Number($('#dtInput').value||7);const result=rollOp2Test({dice,dt,label:`${labelSkill(character,key)} + ${attrLabel(attr)}`});
  showRoll(result);
  if(eligible.length)await sendMutation({type:'consume-pending',ids:eligible.map(d=>d.id)}).catch(()=>{});
  if(character.profile==='Executor'&&result.success===false&&rt.impulse<3)await sendMutation({type:'impulse-adjust',delta:1}).catch(()=>{});
  const entry={id:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,type:'test',createdAt:Date.now(),authorId:state.playerId,authorName:character.name,characterId:character.id,accent:character.accent,result};
  if(OBR.isAvailable)OBR.broadcast.sendMessage(CHAT_CHANNEL,{type:'submit',entry},{destination:'ALL'}).catch(()=>{});
}

function dismissPreloader(){setTimeout(()=>$('#preloader')?.classList.add('hide'),850)}
async function setup(){
  $('#close').addEventListener('click',()=>OBR.isAvailable?OBR.modal.close('com.op2.playtest.fichas/sheet').catch(()=>history.back()):history.back());
  document.querySelectorAll('[data-res]').forEach(btn=>btn.addEventListener('click',()=>sendMutation({type:'adjust-resource',resource:btn.dataset.res,delta:Number(btn.dataset.delta)})));
  if(!OBR.isAvailable){render();dismissPreloader();return}
  await new Promise(resolve=>OBR.onReady(resolve));
  [state.role,state.party]=await Promise.all([OBR.player.getRole(),OBR.party.getPlayers()]);state.playerId=OBR.player.id;
  const meta=await OBR.room.getMetadata();state.roomState=normalizeRuntimeState(meta[ROOM_STATE_KEY]);render();dismissPreloader();
  OBR.room.onMetadataChange(meta=>{if(meta[ROOM_STATE_KEY]){state.roomState=normalizeRuntimeState(meta[ROOM_STATE_KEY]);render()}});
  OBR.party.onChange(p=>{state.party=p;renderDynamic()});
  OBR.broadcast.onMessage(SYNC_CHANNEL,event=>{const d=event.data||{};if(d.type==='mutation-result'&&!d.ok&&d.error)toast(d.error)});
}
setup().catch(e=>{console.error(e);toast(e.message||String(e));dismissPreloader()});
