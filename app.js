import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import { CHARACTERS } from './characters.js';
import { ROOM_STATE_KEY, SHEET_MODAL_ID, normalizeRuntimeState, validateStateSize, assignedCharacterId } from './core.js';

const content = document.querySelector('#content');
const notice = document.querySelector('#notice');
const roleBadge = document.querySelector('#roleBadge');
const state = { role:'PLAYER', playerId:'', party:[], roomState:normalizeRuntimeState(null) };

function escapeHtml(value=''){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function showNotice(text){notice.textContent=text;notice.classList.remove('hidden');setTimeout(()=>notice.classList.add('hidden'),3200)}

async function loadRoomState(){
  const meta = await OBR.room.getMetadata();
  state.roomState = normalizeRuntimeState(meta[ROOM_STATE_KEY]);
}

async function saveRoomState(next){
  const size = validateStateSize(next);
  if (!size.ok) throw new Error(`Estado excederia ${(size.bytes/1024).toFixed(1)} KB.`);
  await OBR.room.setMetadata({ [ROOM_STATE_KEY]: next });
  state.roomState = normalizeRuntimeState(next);
}

async function assignCharacter(characterId, playerId){
  if (state.role !== 'GM') return;
  const next = normalizeRuntimeState(state.roomState);
  for (const id of Object.keys(CHARACTERS)) {
    if (next.assignments[id]?.playerId === playerId && playerId) delete next.assignments[id];
  }
  if (!playerId) delete next.assignments[characterId];
  else {
    const p = state.party.find(x=>x.id===playerId);
    next.assignments[characterId] = { playerId, playerName:p?.name || 'Jogador' };
  }
  await saveRoomState(next);
  render();
}

async function openSheet(id){
  await OBR.modal.open({ id:SHEET_MODAL_ID, url:`/sheet.html?id=${encodeURIComponent(id)}`, fullScreen:true });
}

function playerOptions(currentId=''){
  const players = state.party.filter(p=>p.role==='PLAYER');
  let html = `<option value="">Não atribuído</option>`;
  const current = Object.values(state.roomState.assignments||{}).find(a=>a.playerId===currentId);
  if (currentId && !players.some(p=>p.id===currentId)) html += `<option value="${escapeHtml(currentId)}">${escapeHtml(current?.playerName || 'Jogador desconectado')} (offline)</option>`;
  for (const p of players) html += `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`;
  return html;
}

function renderGM(){
  const cards = Object.values(CHARACTERS).map(c=>{
    const assignment = state.roomState.assignments?.[c.id];
    const rt = state.roomState.characters[c.id];
    return `<article class="character-card" style="--accent:${c.accent}">
      <img class="thumb" src="${c.portrait}" alt="${escapeHtml(c.name)}" />
      <div class="card-main">
        <div class="card-head"><strong class="card-name">${escapeHtml(c.name)}</strong><span class="profile-tag">${escapeHtml(c.profile)}</span></div>
        <div class="meta">${escapeHtml(c.occupation)} · Nível ${c.level}</div>
        <div class="resource-line"><span>PV <b>${rt.pv}/${c.maxPV}</b></span><span>PD <b>${rt.pd}/${c.maxPD}</b></span></div>
        <div class="assignment">
          <select data-assign="${c.id}" aria-label="Atribuir ${escapeHtml(c.name)}">${playerOptions(assignment?.playerId || '')}</select>
          <button class="open-btn" data-open="${c.id}">Abrir</button>
        </div>
      </div>
    </article>`;
  }).join('');
  content.innerHTML = `
    <div class="section-title"><span>Preparação rápida</span></div>
    <div class="presets">
      <div class="preset"><b>3 jogadores</b><span>Alan · Victor · Eloísa</span></div>
      <div class="preset"><b>4 jogadores</b><span>Alan · Edgar · Eloísa · Victor</span></div>
      <div class="preset"><b>5 jogadores</b><span>Alan · Edgar · Eloísa · Kênia · Victor</span></div>
    </div>
    <div class="help-card"><strong>O mestre só precisa atribuir cada sobrevivente.</strong><p>As fichas já vêm preenchidas com atributos, perícias, PV, PD e habilidades do Ato I. A atribuição usa o ID da conta do jogador, então continua válida ao trocar de navegador ou computador.</p></div>
    <div class="section-title"><span>Sobreviventes</span></div>
    <div class="roster">${cards}</div>`;
  content.querySelectorAll('[data-assign]').forEach(select=>{
    const assignment = state.roomState.assignments?.[select.dataset.assign];
    select.value = assignment?.playerId || '';
    select.addEventListener('change', async()=>{
      try{await assignCharacter(select.dataset.assign, select.value);showNotice(select.value?'PERSONAGEM ATRIBUÍDO.':'ATRIBUIÇÃO REMOVIDA.')}catch(e){showNotice(e.message||String(e))}
    });
  });
  content.querySelectorAll('[data-open]').forEach(btn=>btn.addEventListener('click',()=>openSheet(btn.dataset.open)));
}

function renderPlayer(){
  const id = assignedCharacterId(state.roomState, state.playerId);
  if (!id) {
    content.innerHTML = `<div class="help-card"><strong>Nenhum personagem atribuído.</strong><p>O mestre precisa escolher qual sobrevivente você controlará. Assim que a atribuição for feita, a ficha aparecerá aqui automaticamente.</p></div>`;
    return;
  }
  const c = CHARACTERS[id], rt = state.roomState.characters[id];
  content.innerHTML = `<article class="player-sheet-card" style="--accent:${c.accent}">
    <div class="player-hero">
      <img src="${c.portrait}" alt="${escapeHtml(c.name)}" />
      <div><h2>${escapeHtml(c.name)}</h2><div class="bigmeta">${escapeHtml(c.profile)} · ${escapeHtml(c.occupation)} · Nível ${c.level}</div>
      <div class="stats"><div class="stat"><span>FÍSICO</span><b>d${c.attributes.fisico}</b></div><div class="stat"><span>MENTE</span><b>d${c.attributes.mente}</b></div><div class="stat"><span>EMOÇÃO</span><b>d${c.attributes.emocao}</b></div></div></div>
    </div>
    <div class="resource-line" style="margin:10px 0 12px;font-size:11px"><span>PV <b>${rt.pv}/${c.maxPV}</b></span><span>PD <b>${rt.pd}/${c.maxPD}</b></span></div>
    <button id="playerOpen" class="primary-open">ABRIR FICHA COMPLETA</button>
  </article>`;
  document.querySelector('#playerOpen').addEventListener('click',()=>openSheet(id));
}

function render(){
  roleBadge.textContent = state.role === 'GM' ? 'MESTRE' : 'JOGADOR';
  state.role === 'GM' ? renderGM() : renderPlayer();
}

async function setup(){
  if (!OBR.isAvailable){ roleBadge.textContent='PRÉVIA'; renderGM(); return; }
  await new Promise(resolve=>OBR.onReady(resolve));
  [state.role,state.party] = await Promise.all([OBR.player.getRole(),OBR.party.getPlayers()]);
  state.playerId = OBR.player.id;
  await loadRoomState();
  if (state.role === 'GM') {
    const meta = await OBR.room.getMetadata();
    if (!meta[ROOM_STATE_KEY]) await saveRoomState(state.roomState);
  }
  render();
  OBR.room.onMetadataChange(meta=>{ if(meta[ROOM_STATE_KEY]){state.roomState=normalizeRuntimeState(meta[ROOM_STATE_KEY]);render();} });
  OBR.party.onChange(p=>{state.party=p;render();});
}
setup().catch(e=>{console.error(e);content.innerHTML=`<div class="notice">${escapeHtml(e.message||String(e))}</div>`});
