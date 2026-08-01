/* ============================================================
   DATA MODEL
   ============================================================ */
function chapterRange(from, to, prefix){
  const out = [];
  for(let n=from; n<=to; n++){
    out.push({ id:`${prefix}${n}`, name:`Chapter ${n}`, icon:'📖' });
  }
  return out;
}
function bunpouPairs(){
  const pairs = [[5,6],[7,8],[9,10],[11,12],[13,14],[15,16],[17,18],[19,20],[21,22],[23,24],[25,26]];
  return pairs.map(([a,b],i)=>({ id:`jp_bp${i+1}`, name:`第${a},${b}課`, icon:'📝' }));
}

const PATHWAYS = {
  ds: {
    key:'ds', name:'Data Science', icon:'📊', accent:'var(--ds)', accentDim:'var(--ds-dim)',
    groups:[
      { id:'main', title:null, sequential:false, requiresDate:true,
        objectives:[
          { id:'ds1', name:'Fluent Python (2nd ed.)', icon:'🐍' },
          { id:'ds2', name:'Effective Python (3rd ed.)', icon:'📘' },
          { id:'ds3', name:'Effective Pandas 2', icon:'🐼' },
          { id:'ds4', name:'High Performance Python (3rd ed.)', icon:'⚡' },
          { id:'ds5', name:'Kaggle Playground Series [Aug]', icon:'🏆' },
          { id:'ds6', name:'Explore AutoML', icon:'🤖' },
        ]
      }
    ]
  },
  rl: {
    key:'rl', name:'Reinforcement Learning', icon:'🎮', accent:'var(--rl)', accentDim:'var(--rl-dim)',
    groups:[
      { id:'papers', title:'Papers', sequential:false, requiresDate:false,
        objectives:[
          { id:'rl_p1', name:'REINFORCE', icon:'📄' },
          { id:'rl_p2', name:'DQN', icon:'🧩' },
          { id:'rl_p3', name:'A2C', icon:'🧠' },
          { id:'rl_p4', name:'PPO', icon:'🎯' },
          { id:'rl_p5', name:'DDPG', icon:'🔧' },
        ]
      },
      { id:'projects', title:'Projects', sequential:true, requiresDate:false,
        objectives:[
          { id:'rl_pr1', name:'Autolift — Liftoff', icon:'🛫' },
          { id:'rl_pr2', name:'Autolift — Flight', icon:'🚁' },
          { id:'rl_pr3', name:'Autolift — Landing', icon:'🛬' },
          { id:'rl_pr4', name:'Humanoid Standup', icon:'🤸' },
          { id:'rl_pr5', name:'Car Racing DQN', icon:'🏎️' },
          { id:'rl_pr6', name:'Inverted Pendulum REINFORCE', icon:'⚖️' },
        ]
      }
    ]
  },
  jp: {
    key:'jp', name:'日本語', icon:'<svg viewBox="0 0 30 20" width="26" height="17.3" xmlns="http://www.w3.org/2000/svg" style="border-radius:3px; display:block;"><rect width="30" height="20" fill="#ffffff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/></svg>', accent:'var(--jp)', accentDim:'var(--jp-dim)',
    groups:[
      { id:'tango', title:'N2 単語', sequential:true, requiresDate:true,
        objectives: chapterRange(3, 12, 'jp_tg') },
      { id:'bunpou', title:'N2 文法', sequential:true, requiresDate:true,
        objectives: bunpouPairs() },
      { id:'hon', title:'本', sequential:true, requiresDate:true,
        objectives:[
          { id:'jp_h1', name:'君の不在の夜を歩く（雛倉さりえ）', icon:'🌙' },
          { id:'jp_h2', name:'コンビニ人間（村田沙耶香）', icon:'🏪' },
          { id:'jp_h3', name:'妖怪怪談', icon:'👻' },
        ]
      },
      { id:'anime', title:'アニメ', sequential:true, requiresDate:false,
        objectives:[
          { id:'jp_a1', name:'Witch Watch', icon:'🧙' },
          { id:'jp_a2', name:'Medalist', icon:'🏅' },
          { id:'jp_a3', name:'クレヨンしんちゃん — 野原ひろしの弁当', icon:'🍱' },
        ]
      },
      { id:'choukai', title:'聴解', type:'counter',
        objectives:[
          { id:'jp_c1', name:'Todaii News', icon:'📰' },
          { id:'jp_c2', name:'Japanese Podcast', icon:'🎙️' },
          { id:'jp_c3', name:'Waku Waku Drama', icon:'📺' },
          { id:'jp_c4', name:'NHK News Transcribe', icon:'✍️' },
        ]
      },
    ]
  }
};

/* ============================================================
   STATE
   ============================================================ */
const STORAGE_KEY = 'pathways_tracker_state_v2';
let state = { objectives:{}, counters:{} };

function todayISO(){
  const d = new Date();
  return d.toISOString().slice(0,10);
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) state = JSON.parse(raw);
  }catch(e){ /* ignore */ }
  if(!state.objectives) state.objectives = {};
  if(!state.counters) state.counters = {};
  normalizeState();
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeState(){
  Object.values(PATHWAYS).forEach(pathway=>{
    pathway.groups.forEach(group=>{
      if(group.type === 'counter'){
        group.objectives.forEach(o=>{
          if(typeof state.counters[o.id] !== 'number') state.counters[o.id] = 0;
        });
        return;
      }
      group.objectives.forEach((o, idx)=>{
        if(!state.objectives[o.id]){
          let status = 'LOCKED';
          if(!group.sequential) status = 'AVAILABLE';
          else if(idx === 0) status = 'AVAILABLE';
          state.objectives[o.id] = { status, startDate:null, endDate:null, completedLate:false };
        } else if(!group.sequential && state.objectives[o.id].status === 'LOCKED'){
          // non-sequential groups: nothing should remain locked
          state.objectives[o.id].status = 'AVAILABLE';
        }
      });
    });
  });
}

/* ============================================================
   STATUS / DISPLAY HELPERS
   ============================================================ */
function daysBetween(a, b){
  const ms = new Date(b) - new Date(a);
  return Math.round(ms / 86400000);
}

function getEffectiveStatus(objState, requiresDate){
  if(objState.status === 'IN_PROGRESS' && requiresDate && objState.endDate){
    if(todayISO() > objState.endDate) return 'LATE';
  }
  return objState.status;
}

function statusMeta(effStatus){
  switch(effStatus){
    case 'LOCKED': return { pill:'locked', label:'LOCKED', icon:'🔒' };
    case 'AVAILABLE': return { pill:'available', label:'AVAILABLE', icon:'' };
    case 'IN_PROGRESS': return { pill:'inprogress', label:'IN PROGRESS', icon:'⏳' };
    case 'LATE': return { pill:'late', label:'LATE', icon:'⏳' };
    case 'COMPLETED': return { pill:'completed', label:'COMPLETED', icon:'✓' };
    case 'SKIPPED': return { pill:'skipped', label:'SKIPPED', icon:'⤼' };
  }
}

/* ============================================================
   PROGRESS CALC
   ============================================================ */
function pathwayProgress(pathway){
  let total=0, done=0;
  pathway.groups.forEach(group=>{
    if(group.type === 'counter') return; // not tracked toward completion
    group.objectives.forEach(o=>{
      total++;
      const st = state.objectives[o.id].status;
      if(st === 'COMPLETED' || st === 'SKIPPED') done++;
    });
  });
  return { done, total };
}

function isPathwayComplete(pathway){
  const p = pathwayProgress(pathway);
  return p.total > 0 && p.done === p.total;
}

/* ============================================================
   UNLOCK LOGIC
   ============================================================ */
function findGroupAndIndex(objId){
  for(const pathway of Object.values(PATHWAYS)){
    for(const group of pathway.groups){
      if(group.type === 'counter') continue;
      const idx = group.objectives.findIndex(o=>o.id===objId);
      if(idx !== -1) return { pathway, group, idx };
    }
  }
  return null;
}

function unlockNext(objId){
  const loc = findGroupAndIndex(objId);
  if(!loc || !loc.group.sequential) return;
  const next = loc.group.objectives[loc.idx+1];
  if(next && state.objectives[next.id].status === 'LOCKED'){
    state.objectives[next.id].status = 'AVAILABLE';
  }
}

/* ============================================================
   ACTIONS
   ============================================================ */
let pendingStartId = null;
let currentPathwayKey = null;
let counterModalId = null;

function startObjectiveFlow(objId, requiresDate){
  const objState = state.objectives[objId];
  if(objState.status !== 'AVAILABLE') return;
  if(requiresDate){
    openDateModal(objId);
  }else{
    objState.status = 'IN_PROGRESS';
    objState.startDate = todayISO();
    objState.endDate = null;
    saveState();
    renderDetail(currentPathwayKey);
  }
}

function openDateModal(objId){
  pendingStartId = objId;
  document.getElementById('date-start-display').textContent = formatDate(todayISO());
  const input = document.getElementById('date-end-input');
  input.value = '';
  input.min = todayISO();
  document.getElementById('date-confirm-btn').disabled = true;
  const loc = findGroupAndIndex(objId);
  const name = loc ? loc.group.objectives[loc.idx].name : '';
  document.getElementById('date-modal-title').textContent = name;
  document.getElementById('date-overlay').classList.add('open');
}
function closeDateModal(){
  document.getElementById('date-overlay').classList.remove('open');
  pendingStartId = null;
}
function confirmDateStart(){
  const input = document.getElementById('date-end-input');
  if(!input.value || !pendingStartId) return;
  const objState = state.objectives[pendingStartId];
  objState.status = 'IN_PROGRESS';
  objState.startDate = todayISO();
  objState.endDate = input.value;
  saveState();
  closeDateModal();
  renderDetail(currentPathwayKey);
}

document.getElementById('date-end-input').addEventListener('input', (e)=>{
  document.getElementById('date-confirm-btn').disabled = !e.target.value;
});

function completeObjective(objId){
  const objState = state.objectives[objId];
  const loc = findGroupAndIndex(objId);
  const requiresDate = loc && loc.group.requiresDate;
  let late = false;
  if(requiresDate && objState.endDate && todayISO() > objState.endDate) late = true;
  objState.status = 'COMPLETED';
  objState.completedLate = late;
  unlockNext(objId);
  saveState();
  renderDetail(currentPathwayKey);
}

function skipObjective(objId){
  const objState = state.objectives[objId];
  objState.status = 'SKIPPED';
  unlockNext(objId);
  saveState();
  renderDetail(currentPathwayKey);
}

function openCounterModal(objId, name){
  counterModalId = objId;
  document.getElementById('counter-modal-title').textContent = name;
  document.getElementById('counter-modal-sub').textContent = 'Log a completed session.';
  document.getElementById('counter-display').textContent = state.counters[objId] || 0;
  document.getElementById('counter-overlay').classList.add('open');
}
function closeCounterModal(){
  document.getElementById('counter-overlay').classList.remove('open');
  counterModalId = null;
  renderDetail(currentPathwayKey);
}
function adjustCounter(delta){
  if(!counterModalId) return;
  const cur = state.counters[counterModalId] || 0;
  const next = Math.max(0, cur + delta);
  state.counters[counterModalId] = next;
  document.getElementById('counter-display').textContent = next;
  saveState();
}

/* ============================================================
   DATE FORMAT
   ============================================================ */
function formatDate(iso){
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

/* ============================================================
   RENDER: HOME
   ============================================================ */
function renderHome(){
  const list = document.getElementById('pathway-list');
  list.innerHTML = '';
  Object.values(PATHWAYS).forEach(pathway=>{
    const { done, total } = pathwayProgress(pathway);
    const pct = total ? Math.round((done/total)*100) : 0;
    const complete = isPathwayComplete(pathway);
    const card = document.createElement('div');
    card.className = 'pcard';
    card.style.setProperty('--accent', pathway.accent);
    card.style.setProperty('--accent-dim', pathway.accentDim);
    card.onclick = ()=> openPathway(pathway.key);
    card.innerHTML = `
      <div class="icon-wrap">${pathway.icon}</div>
      <div class="info">
        <h3>${pathway.name}${complete ? '<span class="stamp-mini">DONE</span>' : ''}</h3>
        <div class="progress-row">
          <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
          <div class="frac">${done}/${total}</div>
        </div>
      </div>
      <div class="chev">›</div>
    `;
    list.appendChild(card);
  });
}

/* ============================================================
   RENDER: DETAIL
   ============================================================ */
function openPathway(key){
  currentPathwayKey = key;
  document.getElementById('view-home').classList.add('hidden');
  document.getElementById('view-detail').classList.remove('hidden');
  renderDetail(key);
  window.scrollTo(0,0);
}
function goHome(){
  currentPathwayKey = null;
  document.getElementById('view-detail').classList.add('hidden');
  document.getElementById('view-home').classList.remove('hidden');
  renderHome();
}

function renderDetail(key){
  if(!key) return;
  const pathway = PATHWAYS[key];
  document.getElementById('detail-icon').innerHTML = pathway.icon;
  document.getElementById('detail-icon').style.background = pathway.accentDim;
  document.getElementById('detail-title-text').textContent = pathway.name;
  const complete = isPathwayComplete(pathway);
  document.getElementById('detail-stamp').classList.toggle('hidden', !complete);

  const { done, total } = pathwayProgress(pathway);
  const pct = total ? Math.round((done/total)*100) : 0;
  document.getElementById('detail-bar').style.width = pct + '%';
  document.getElementById('detail-bar').style.background = pathway.accent;
  document.getElementById('detail-frac').textContent = `${done}/${total} completed`;

  const container = document.getElementById('groups-container');
  container.innerHTML = '';

  pathway.groups.forEach(group=>{
    const groupEl = document.createElement('div');
    groupEl.className = 'group';

    if(group.title){
      const titleEl = document.createElement('div');
      titleEl.className = 'group-title';
      titleEl.style.color = pathway.accent;
      let tag = '';
      if(group.type === 'counter') tag = 'reference';
      else if(!group.sequential) tag = 'parallel';
      titleEl.innerHTML = `${group.title}${tag ? `<span class="tag">${tag}</span>` : ''}`;
      groupEl.appendChild(titleEl);
    }

    if(group.type === 'counter'){
      const wrap = document.createElement('div');
      wrap.className = 'grid-nonseq';
      group.objectives.forEach(o=>{
        const count = state.counters[o.id] || 0;
        const cn = document.createElement('div');
        cn.className = 'counter-node';
        cn.onclick = ()=> openCounterModal(o.id, o.name);
        cn.innerHTML = `
          <div class="nicon">${o.icon}</div>
          <div class="cbody">
            <div class="cname">${o.name}</div>
            <div class="counter-hint">tap to log</div>
          </div>
          <div class="ccount"><b>${count}</b>×</div>
        `;
        wrap.appendChild(cn);
      });
      groupEl.appendChild(wrap);
      container.appendChild(groupEl);
      return;
    }

    const chain = document.createElement('div');
    chain.className = group.sequential ? 'chain linked' : 'grid-nonseq';

    group.objectives.forEach(o=>{
      const objState = state.objectives[o.id];
      const eff = getEffectiveStatus(objState, group.requiresDate);
      const meta = statusMeta(eff);

      const nodeWrap = document.createElement('div');
      if(group.sequential) nodeWrap.className = 'node-wrap';

      const node = document.createElement('div');
      node.className = `node ${eff.toLowerCase().replace('_','')}`;

      let statusRow = `<span class="status-pill ${meta.pill}">${meta.icon ? meta.icon+' ' : ''}${meta.label}</span>`;

      if(eff === 'IN_PROGRESS' || eff === 'LATE'){
        if(group.requiresDate && objState.endDate){
          const d = daysBetween(todayISO(), objState.endDate);
          if(eff === 'LATE'){
            statusRow += `<span class="late-tag">${Math.abs(d)}d overdue</span>`;
          }else{
            statusRow += `<span class="late-tag" style="color:var(--text-dim)">${d}d left</span>`;
          }
        }
      }
      if(eff === 'COMPLETED' && objState.completedLate){
        statusRow += `<span class="late-tag">[late]</span>`;
      }

      let actions = '';
      if(eff === 'IN_PROGRESS' || eff === 'LATE'){
        actions = `<div class="node-actions">
          <button class="btn primary" onclick="completeObjective('${o.id}')">Complete</button>
          <button class="btn ghost" onclick="skipObjective('${o.id}')">Skip</button>
        </div>`;
      }

      node.innerHTML = `
        <div class="nicon">${o.icon}</div>
        <div class="nbody">
          <div class="nname">${o.name}</div>
          <div class="nstatus-row">${statusRow}</div>
          ${actions}
        </div>
      `;

      if(eff === 'AVAILABLE'){
        node.onclick = ()=> startObjectiveFlow(o.id, group.requiresDate);
      }

      nodeWrap.appendChild(node);
      chain.appendChild(nodeWrap);
    });

    groupEl.appendChild(chain);
    container.appendChild(groupEl);
  });
}

/* ============================================================
   INIT
   ============================================================ */
loadState();
renderHome();
