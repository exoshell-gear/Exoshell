/* =====================================================================
   FIREMOTO COMMAND CENTER — live app layer
===================================================================== */

const NOW = new Date();
const Q4_START = new Date('2026-10-01T00:00:00');
let fronts = [];

const STATUS_OPTIONS = [
  'Not started','Planned','Needs action','In progress','Building',
  'Exploring options','Waiting on execution','Mixed','Nearly finished','Done'
];
const PRIORITY_OPTIONS = ['NOW','HIGH','MEDIUM','LOW'];
const PRIORITY_ORDER = { NOW:0, HIGH:1, MEDIUM:2, LOW:3 };

let state = { query:'', filter:'ALL', openId:null, isNew:false, showDone:false };

async function apiCall(action, payload = {}){
  const res = await fetch('/api/fronts', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ action, ...payload })
  });
  if (res.status === 401){
    showLogin('Session expired. Enter the dashboard password again.');
    throw new Error('Unauthorized');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function loadFronts(){
  const main = document.getElementById('main');
  main.innerHTML = '<div class="empty-state"><div class="big">Syncing command center…</div>Loading the latest Firemoto state.</div>';
  const data = await apiCall('list');
  fronts = Array.isArray(data.fronts) ? data.fronts : [];
  render();
}

function showLogin(message=''){
  document.getElementById('authGate').classList.remove('hidden');
  document.getElementById('app').classList.add('auth-pending');
  document.getElementById('authError').textContent = message;
  setTimeout(() => document.getElementById('authPassword').focus(), 0);
}
function hideLogin(){
  document.getElementById('authGate').classList.add('hidden');
  document.getElementById('app').classList.remove('auth-pending');
  document.getElementById('authError').textContent = '';
  document.getElementById('authPassword').value = '';
}
async function login(password){
  const res = await fetch('/api/login', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || 'Wrong password');
}
async function boot(){
  try{
    const session = await fetch('/api/session', { cache:'no-store' });
    if (!session.ok){ showLogin(); return; }
    hideLogin();
    await loadFronts();
  }catch(err){
    hideLogin();
    document.getElementById('main').innerHTML = `<div class="empty-state"><div class="big">Could not load Command Center</div>${escapeHtml(err.message || 'Unknown error')}</div>`;
  }
}

function daysBetween(a,b){ return Math.round((b-a)/86400000); }
function computeAlert(f){
  if (f.status === 'Done') return { type:null };
  if (f.deadlineDate){
    const d = new Date(f.deadlineDate + 'T00:00:00');
    const diff = daysBetween(NOW,d);
    if (diff < 0) return { type:'overdue', label:'OVERDUE', days:Math.abs(diff) };
    if (diff <= 5) return { type:'due', label:`DUE IN ${diff}D`, days:diff };
  }
  if (f.lastUpdated){
    const lu = new Date(f.lastUpdated + 'T00:00:00');
    const staleDays = daysBetween(lu,NOW);
    if (f.staleAfterDays && staleDays >= Number(f.staleAfterDays)) return { type:'stale', label:`STALE ${staleDays}D`, days:staleDays };
  }
  return { type:null };
}
function pulseState(f){
  const alert = computeAlert(f);
  if (f.status === 'Done') return { color:'var(--sage)', ratio:1 };
  if (alert.type === 'overdue') return { color:'var(--red)', ratio:1 };
  if (alert.type === 'due') return { color:'var(--amber)', ratio:1-(alert.days/5) };
  if (alert.type === 'stale') return { color:'var(--text-faint)', ratio:.3 };
  return { color:'var(--cyan)', ratio:.65 };
}
function statusColor(status){
  if (status === 'Done') return { bg:'var(--sage-dim)', fg:'#a8e0bf' };
  if (['Needs action','Not started'].includes(status)) return { bg:'var(--red-dim)', fg:'#ff9d9d' };
  if (['Nearly finished','In progress','Building'].includes(status)) return { bg:'var(--cyan-dim)', fg:'#a6e3f0' };
  return { bg:'var(--amber-dim)', fg:'#ffd591' };
}
function sortFronts(list){
  return [...list].sort((a,b) => {
    const pa=PRIORITY_ORDER[a.priority]??9, pb=PRIORITY_ORDER[b.priority]??9;
    if (pa!==pb) return pa-pb;
    const aa=computeAlert(a), ab=computeAlert(b);
    const weight=t=>t==='overdue'?0:t==='due'?1:t==='stale'?2:3;
    return weight(aa.type)-weight(ab.type);
  });
}
function matchesQuery(f,q){
  if(!q) return true;
  return [f.front,f.goal,f.nextAction,f.blocker,f.updateNote].join(' ').toLowerCase().includes(q.toLowerCase());
}
function matchesFilter(f,filter){
  if(filter==='ALL') return true;
  if(filter==='DONE') return f.status==='Done';
  return f.priority===filter;
}
function timeAgo(iso){
  if(!iso) return 'unknown';
  const d=new Date(iso+'T00:00:00'), days=daysBetween(d,NOW);
  if(days<=0) return 'today';
  if(days===1) return '1 day ago';
  return `${days} days ago`;
}
function renderReadouts(){
  const daysToQ4=daysBetween(NOW,Q4_START);
  const active=fronts.filter(f=>f.status!=='Done').length;
  const urgent=fronts.filter(f=>f.status!=='Done'&&(f.priority==='NOW'||computeAlert(f).type==='overdue')).length;
  const warnings=fronts.filter(f=>['overdue','stale'].includes(computeAlert(f).type)).length;
  document.getElementById('readouts').innerHTML=`
    <div class="readout"><div class="n">${daysToQ4}</div><div class="l">Days to Q4</div></div>
    <div class="readout"><div class="n">${active}</div><div class="l">Active fronts</div></div>
    <div class="readout"><div class="n ${urgent>0?'crit':''}">${urgent}</div><div class="l">Urgent</div></div>
    <div class="readout"><div class="n ${warnings>0?'warn':''}">${warnings}</div><div class="l">Warnings</div></div>`;
}
function renderPills(){
  const defs=[['ALL','All'],['NOW','Now'],['HIGH','High'],['MEDIUM','Medium'],['LOW','Low'],['DONE','Done']];
  const el=document.getElementById('filterPills');
  el.innerHTML=defs.map(([key,label])=>`<button class="pill ${state.filter===key?'active':''}" data-filter="${key}">${label}</button>`).join('');
  el.querySelectorAll('.pill').forEach(btn=>btn.addEventListener('click',()=>{state.filter=btn.dataset.filter;render();}));
}
let cardIndex=0;
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s??''; return d.innerHTML; }
function frontCardHTML(f,compact){
  const delay=Math.min(cardIndex++*22,220), alert=computeAlert(f), pulse=pulseState(f), sc=statusColor(f.status);
  const alertHTML=alert.type?`<span class="alert-chip alert-${alert.type}">${alert.label}</span>`:'';
  const blockerHTML=f.blocker?`<span class="blocker-flag" title="${escapeHtml(f.blocker)}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>Blocked</span>`:'<span></span>';
  return `<div class="front is-${(f.priority||'LOW').toLowerCase()} ${f.status==='Done'?'is-done':''} ${compact?'compact':''}" data-id="${escapeHtml(f.id)}" style="animation-delay:${delay}ms">
    <div class="front-top"><div><p class="front-name">${escapeHtml(f.front)}</p><p class="front-goal">${escapeHtml(f.goal)}</p></div>
    <div class="front-meta">${alertHTML}<span class="status-chip" style="background:${sc.bg};color:${sc.fg}">${escapeHtml(f.status)}</span></div></div>
    <div class="front-bottom"><div class="next-action"><b>Next</b>${escapeHtml(f.nextAction||'—')}</div>
    <div class="pulse" title="Last updated ${timeAgo(f.lastUpdated)}"><div class="pulse-track"><div class="pulse-fill" style="width:${Math.round(pulse.ratio*100)}%;background:${pulse.color}"></div></div><div class="pulse-dot" style="background:${pulse.color};box-shadow:0 0 6px ${pulse.color}"></div></div>${blockerHTML}</div></div>`;
}
function render(){
  cardIndex=0; renderReadouts(); renderPills();
  const q=state.query.trim();
  const visible=fronts.filter(f=>matchesQuery(f,q)&&matchesFilter(f,state.filter));
  const groups=[['NOW','Right now','dot-now'],['HIGH','High','dot-high'],['MEDIUM','Medium','dot-medium'],['LOW','Low','dot-low']];
  const main=document.getElementById('main');
  if(visible.length===0){main.innerHTML='<div class="empty-state"><div class="big">Nothing here</div>Clear the search or filter.</div>';return;}
  let html=''; const activeVisible=visible.filter(f=>f.status!=='Done'), doneVisible=visible.filter(f=>f.status==='Done');
  groups.forEach(([key,label,dot])=>{
    const items=sortFronts(activeVisible.filter(f=>f.priority===key)); if(!items.length)return;
    const compact=key==='MEDIUM'||key==='LOW';
    html+=`<div class="group"><div class="group-head"><span class="dot ${dot}"></span><h2>${label}</h2><span class="count">${items.length}</span><span class="rule"></span></div>${items.map(f=>frontCardHTML(f,compact)).join('')}</div>`;
  });
  if(doneVisible.length||state.filter==='DONE') html+=`<div class="group"><div class="done-toggle ${state.showDone?'open':''}" id="doneToggle"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg><span class="dot dot-done"></span> Completed (${doneVisible.length})</div><div class="done-list ${state.showDone||state.filter==='DONE'?'open':''}" id="doneList">${sortFronts(doneVisible).map(f=>frontCardHTML(f,true)).join('')}</div></div>`;
  main.innerHTML=html;
  main.querySelectorAll('.front').forEach(card=>card.addEventListener('click',()=>openFront(card.dataset.id)));
  const dt=document.getElementById('doneToggle'); if(dt)dt.addEventListener('click',()=>{state.showDone=!state.showDone;render();});
}
function populateSelects(){
  document.getElementById('f-status').innerHTML=STATUS_OPTIONS.map(o=>`<option value="${o}">${o}</option>`).join('');
  document.getElementById('f-priority').innerHTML=PRIORITY_OPTIONS.map(o=>`<option value="${o}">${o}</option>`).join('');
}
populateSelects();
function openFront(id){
  state.openId=id; state.isNew=false; const f=fronts.find(x=>x.id===id); if(!f)return;
  fillPanel(f); document.getElementById('panelEyebrow').textContent='Front detail';
  document.getElementById('panelMeta').textContent=`Last updated ${timeAgo(f.lastUpdated)} · ${f.updatedBy||'unknown'}`; showPanel();
}
function openNewFront(){
  state.openId=null; state.isNew=true; fillPanel({front:'',goal:'',status:'Not started',priority:'MEDIUM',nextAction:'',deadline:'',deadlineDate:'',blocker:'',updateNote:''});
  document.getElementById('panelEyebrow').textContent='New front'; document.getElementById('panelMeta').textContent=''; showPanel();
}
function fillPanel(f){
  document.getElementById('panelTitle').textContent=f.front||'New front';
  document.getElementById('f-name').value=f.front||''; document.getElementById('f-goal').value=f.goal||'';
  document.getElementById('f-status').value=f.status||'Not started'; document.getElementById('f-priority').value=f.priority||'MEDIUM';
  document.getElementById('f-next').value=f.nextAction||''; document.getElementById('f-deadline').value=f.deadline||'';
  document.getElementById('f-deadlineDate').value=f.deadlineDate||''; document.getElementById('f-blocker').value=f.blocker||'';
  document.getElementById('f-note').value=f.updateNote||'';
}
function showPanel(){document.getElementById('panel').classList.add('open');document.getElementById('scrim').classList.add('open');}
function hidePanel(){document.getElementById('panel').classList.remove('open');document.getElementById('scrim').classList.remove('open');}
async function saveFront(){
  const data={front:document.getElementById('f-name').value.trim(),goal:document.getElementById('f-goal').value.trim(),status:document.getElementById('f-status').value,priority:document.getElementById('f-priority').value,nextAction:document.getElementById('f-next').value.trim(),deadline:document.getElementById('f-deadline').value.trim(),deadlineDate:document.getElementById('f-deadlineDate').value||null,blocker:document.getElementById('f-blocker').value.trim(),updateNote:document.getElementById('f-note').value.trim(),updatedBy:'Dashboard'};
  if(!data.front){showToast('Name it first');return;} if(!state.isNew)data.id=state.openId;
  const btn=document.getElementById('btnSave'), original=btn.textContent; btn.disabled=true; btn.textContent='Saving…';
  try{
    const result=await apiCall('save',{front:data}), saved=result.front;
    if(state.isNew){fronts.push(saved);showToast('Front added');}else{const i=fronts.findIndex(x=>x.id===state.openId);if(i>=0)fronts[i]=saved;showToast('Changes saved');}
    hidePanel();render();
  }catch(err){showToast(err.message||'Save failed');}
  finally{btn.disabled=false;btn.textContent=original;}
}
let toastTimer;
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2200);}

document.getElementById('search').addEventListener('input',e=>{state.query=e.target.value;render();});
document.getElementById('btnAdd').addEventListener('click',openNewFront);
document.getElementById('panelClose').addEventListener('click',hidePanel);
document.getElementById('btnCancel').addEventListener('click',hidePanel);
document.getElementById('btnSave').addEventListener('click',saveFront);
document.getElementById('scrim').addEventListener('click',hidePanel);
document.addEventListener('keydown',e=>{if(e.key==='Escape')hidePanel();});
document.getElementById('authForm').addEventListener('submit',async e=>{
  e.preventDefault(); const password=document.getElementById('authPassword').value, btn=document.getElementById('authSubmit'), err=document.getElementById('authError');
  err.textContent='';btn.disabled=true;btn.textContent='Checking…';
  try{await login(password);hideLogin();await loadFronts();}catch(ex){err.textContent=ex.message||'Could not sign in';}
  finally{btn.disabled=false;btn.textContent='Enter command center';}
});
boot();
