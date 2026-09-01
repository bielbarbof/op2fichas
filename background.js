import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import { ROOM_STATE_KEY, SYNC_CHANNEL, normalizeRuntimeState, applyOperation, validateStateSize } from './core.js';

let role='PLAYER', playerId='', connectionId='';
let mutationQueue=Promise.resolve();

async function readState(){const meta=await OBR.room.getMetadata();return normalizeRuntimeState(meta[ROOM_STATE_KEY])}
async function writeState(state){const size=validateStateSize(state);if(!size.ok)throw new Error(`Estado excede ${(size.bytes/1024).toFixed(1)} KB.`);await OBR.room.setMetadata({[ROOM_STATE_KEY]:state})}
async function ensureState(){if(role!=='GM')return;const meta=await OBR.room.getMetadata();if(!meta[ROOM_STATE_KEY])await writeState(normalizeRuntimeState(null))}
async function resolveSender(event){if(event.connectionId===connectionId)return{playerId,role};const players=await OBR.party.getPlayers();const p=players.find(x=>x.connectionId===event.connectionId);return p?{playerId:p.id,role:p.role}:null}

async function processSync(event){
  const data=event.data||{};if(role!=='GM'||data.type!=='mutation'||!data.operation)return;
  const sender=await resolveSender(event);if(!sender)return;
  try{const current=await readState();const next=applyOperation(current,data.operation,sender);await writeState(next);await OBR.broadcast.sendMessage(SYNC_CHANNEL,{type:'mutation-result',requestId:data.requestId||null,ok:true,characterId:data.operation.characterId},{destination:'ALL'})}
  catch(error){await OBR.broadcast.sendMessage(SYNC_CHANNEL,{type:'mutation-result',requestId:data.requestId||null,ok:false,error:error?.message||String(error)},{destination:'ALL'})}
}
function onSync(event){mutationQueue=mutationQueue.then(()=>processSync(event)).catch(console.error)}

async function setup(){if(!OBR.isAvailable)return;await new Promise(resolve=>OBR.onReady(resolve));[role,connectionId]=await Promise.all([OBR.player.getRole(),OBR.player.getConnectionId()]);playerId=OBR.player.id;await ensureState();OBR.broadcast.onMessage(SYNC_CHANNEL,onSync)}
setup().catch(console.error);
