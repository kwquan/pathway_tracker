/* ============================================================
   PATHWAYS — app logic
   ============================================================ */

const STORAGE_KEY = 'pathways_state_v1';

/* ---------- DATA MODEL ----------
   Each pathway has one or more "chains" (mini-paths). Objectives
   within a chain unlock sequentially. A chain can override the
   pathway's default "special" (no end-date) behaviour.
------------------------------------------------------------- */

const PATHWAYS = {
  ds: {
    name: 'Data Science',
    icon: '📊',
    special: false,
    chains: [
      {
        id: 'ds-main',
        title: null,
        objectives: [
          { id: 'ds-1', name: 'Read Fluent Python (2nd Edition)', icon: '🐍' },
          { id: 'ds-2', name: 'Read Effective Python (3rd Edition)', icon: '🐍' },
          { id: 'ds-3', name: 'Read Effective Pandas 2', icon: '🐼' },
          { id: 'ds-4', name: 'Read High Performance Python (3rd Edition)', icon: '⚡' },
          { id: 'ds-5', name: 'Complete Kaggle Playground Series [Aug]', icon: '🏆' },
        ],
      },
    ],
  },

  rl: {
    name: 'Reinforcement Learning',
    icon: '🤖',
    special: true, // no end-date required anywhere in this pathway
    chains: [
      {
        id: 'rl-papers',
        title: 'Papers',
        objectives: [
          { id: 'rl-p1', name: 'REINFORCE', icon: '📄' },
          { id: 'rl-p2', name: 'DQN', icon: '📄' },
          { id: 'rl-p3', name: 'A2C', icon: '📄' },
          { id: 'rl-p4', name: 'PPO', icon: '📄' },
          { id: 'rl-p5', name: 'DDPG', icon: '📄' },
        ],
      },
      {
        id: 'rl-projects',
        title: 'Projects',
        objectives: [
          { id: 'rl-j1', name: 'Autolift (Liftoff)', icon: '🚀' },
          { id: 'rl-j2', name: 'Autolift (Flight)', icon: '🛰️' },
          { id: 'rl-j3', name: 'Autolift (Landing)', icon: '🪂' },
          { id: 'rl-j4', name: 'Humanoid Standup', icon: '🤸' },
          { id: 'rl-j5', name: 'Car Racing DQN', icon: '🏎️' },
          { id: 'rl-j6', name: 'Inverted Pendulum REINFORCE', icon: '🎯' },
        ],
      },
    ],
  },

  jp: {
    name: '日本語',
    icon: '🇯🇵',
    special: false,
    chains: [
      {
        id: 'jp-vocab',
        title: 'N2 単語',
        objectives: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => ({
          id: `jp-vocab-${n}`, name: `Chapter ${n}`, icon: '🈶',
        })),
      },
      {
        id: 'jp-grammar',
        title: 'N2 文法',
        objectives: [
          [5, 6], [7, 8], [9, 10], [11, 12], [13, 14],
          [15, 16], [17, 18], [19, 20], [21, 22], [23, 24], [25, 26],
        ].map(([a, b]) => ({
          id: `jp-grammar-${a}-${b}`, name: `第${a},${b}課`, icon: '📝',
        })),
      },
      {
        id: 'jp-books',
        title: '本',
        objectives: [
          { id: 'jp-book-1', name: '君の不在の夜を歩く（雛倉さりえ）', icon: '📘' },
          { id: 'jp-book-2', name: 'コンビニ人間（村田沙耶香）', icon: '📗' },
          { id: 'jp-book-3', name: '殺戮に至る病（我孫子武丸）', icon: '📕' },
        ],
      },
      {
        id: 'jp-anime',
        title: 'アニメ',
        special: true, // override: no end date needed
        objectives: [
          { id: 'jp-anime-1', name: 'Witch Watch', icon: '📺' },
          { id: 'jp-anime-2', name: 'Medalist', icon: '📺' },
          { id: 'jp-anime-3', name: "The Style of Hiroshi Nohara's Lunch", icon: '🍱' },
        ],
      },
    ],
    // permanent, non-interactive, always-on objectives — not part of progress tracking
    permanent: {
      title: '聴解',
      note: 'ongoing — not tracked toward completion',
      objectives: [
        { id: 'jp-listen-1', name: 'Todaii News', icon: '📰' },
        { id: 'jp-listen-2', name: 'Japanese Podcast', icon: '🎙️' },
        { id: 'jp-listen-3', name: 'Waku Waku Drama', icon: '📻' },
        { id: 'jp-listen-4', name: 'NHK News Transcribe', icon: '🖊️' },
      ],
    },
  },
};

/* ---------- STATE ---------- */

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
let state = loadState(); // objectiveId -> { status, startDate, endDate, completedDate }

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
function daysBetween(fromISO, toISO) {
  const a = new Date(fromISO + 'T00:00:00');
  const b = new Date(toISO + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

/* Compute the *effective* status of an objective given chain position + saved state */
function getObjectiveStatus(chain, index) {
  const obj = chain.objectives[index];
  const saved = state[obj.id];

  if (saved && saved.status === 'completed') return 'completed';
  if (saved && saved.status === 'skipped') return 'skipped';

  if (saved && saved.status === 'in-progress') {
    if (saved.endDate) {
      const remaining = daysBetween(todayISO(), saved.endDate);
      if (remaining < 0) return 'late';
    }
    return 'in-progress';
  }

  // not started yet — is it unlocked?
  if (index === 0) return 'available';
  const prevStatus = getObjectiveStatus(chain, index - 1);
  if (prevStatus === 'completed' || prevStatus === 'skipped') return 'available';
  return 'locked';
}

/* ---------- PROGRESS ---------- */

function pathwayObjectiveList(pathway) {
  // flattened list of all trackable (non-permanent) objectives
  const list = [];
  pathway.chains.forEach(chain => {
    chain.objectives.forEach((obj, i) => list.push({ chain, obj, i }));
  });
  return list;
}

function pathwayProgress(pathway) {
  const list = pathwayObjectiveList(pathway);
  let completed = 0;
  list.forEach(({ chain, i }) => {
    if (getObjectiveStatus(chain, i) === 'completed') completed++;
  });
  return { completed, total: list.length };
}

function pathwayIsComplete(pathway) {
  const list = pathwayObjectiveList(pathway);
  return list.every(({ chain, i }) => {
    const s = getObjectiveStatus(chain, i);
    return s === 'completed' || s === 'skipped';
  });
}

function chainProgress(chain) {
  let completed = 0;
  chain.objectives.forEach((obj, i) => {
    if (getObjectiveStatus(chain, i) === 'completed') completed++;
  });
  return { completed, total: chain.objectives.length };
}

function chainIsComplete(chain) {
  return chain.objectives.every((obj, i) => {
    const s = getObjectiveStatus(chain, i);
    return s === 'completed' || s === 'skipped';
  });
}

/* ---------- RENDER: HOME ---------- */

const pathGrid = document.getElementById('pathGrid');

function renderHome() {
  pathGrid.innerHTML = '';
  Object.entries(PATHWAYS).forEach(([key, pathway]) => {
    const { completed, total } = pathwayProgress(pathway);
    const pct = total ? Math.round((completed / total) * 100) : 0;
    const complete = pathwayIsComplete(pathway);

    const card = document.createElement('div');
    card.className = `path-card ${key}`;
    card.innerHTML = `
      <div class="path-icon">${pathway.icon}</div>
      <div class="path-info">
        <div class="path-name-row">
          <p class="path-name">${pathway.name}</p>
          ${complete ? '<span class="mini-stamp">DONE</span>' : ''}
        </div>
        <div class="path-progress-line">
          <div class="mini-track"><div class="mini-fill" style="width:${pct}%"></div></div>
          <span class="mini-count">${completed}/${total}</span>
        </div>
      </div>
      <svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    `;
    card.addEventListener('click', () => openPathway(key));
    pathGrid.appendChild(card);
  });
}

/* ---------- RENDER: DETAIL ---------- */

let currentPathwayKey = null;

const screenHome = document.getElementById('screen-home');
const screenDetail = document.getElementById('screen-detail');
const detailIcon = document.getElementById('detailIcon');
const detailTitle = document.getElementById('detailTitle');
const detailStamp = document.getElementById('detailStamp');
const detailProgressFill = document.getElementById('detailProgressFill');
const detailProgressLabel = document.getElementById('detailProgressLabel');
const chainsWrap = document.getElementById('chainsWrap');

function openPathway(key) {
  currentPathwayKey = key;
  renderDetail();
  screenHome.classList.remove('active');
  screenDetail.classList.add('active');
  window.scrollTo(0, 0);
}
function closeDetail() {
  screenDetail.classList.remove('active');
  screenHome.classList.add('active');
  renderHome();
}
document.getElementById('backBtn').addEventListener('click', closeDetail);

function statusLabel(status) {
  return {
    locked: 'LOCKED',
    available: 'AVAILABLE',
    'in-progress': 'IN PROGRESS',
    late: 'LATE',
    completed: 'COMPLETED',
    skipped: 'SKIPPED',
  }[status];
}

function renderDetail() {
  const pathway = PATHWAYS[currentPathwayKey];
  const { completed, total } = pathwayProgress(pathway);
  const pct = total ? Math.round((completed / total) * 100) : 0;

  detailIcon.textContent = pathway.icon;
  detailTitle.textContent = pathway.name;
  detailStamp.classList.toggle('show', pathwayIsComplete(pathway));
  detailProgressFill.style.width = pct + '%';
  detailProgressLabel.textContent = `${completed} / ${total} completed`;

  chainsWrap.innerHTML = '';

  pathway.chains.forEach(chain => {
    const block = document.createElement('div');
    block.className = 'chain-block';

    let headerHtml = '';
    if (chain.title) {
      const cp = chainProgress(chain);
      const done = chainIsComplete(chain);
      headerHtml = `
        <div class="chain-title-row">
          <p class="chain-title" style="margin-bottom:0;">${chain.title} — ${cp.completed}/${cp.total}</p>
          ${done ? '<span class="chain-stamp">COMPLETED</span>' : ''}
        </div>`;
    }
    block.innerHTML = headerHtml;

    const list = document.createElement('div');
    list.className = 'node-list';
    chain.objectives.forEach((obj, i) => {
      list.appendChild(renderNode(pathway, chain, obj, i));
    });
    block.appendChild(list);
    chainsWrap.appendChild(block);
  });

  // permanent section (e.g. 聴解)
  if (pathway.permanent) {
    const block = document.createElement('div');
    block.className = 'chain-block';
    block.innerHTML = `<p class="chain-title">${pathway.permanent.title}</p>
      <p class="permanent-note">${pathway.permanent.note}</p>`;
    const list = document.createElement('div');
    list.className = 'node-list';
    pathway.permanent.objectives.forEach(obj => {
      const node = document.createElement('div');
      node.className = 'node';
      node.dataset.status = 'permanent';
      node.innerHTML = `
        <div class="node-rail"><div class="node-dot" style="background:var(--text-faint); box-shadow:none;"></div></div>
        <div class="node-card">
          <div class="node-top">
            <span class="node-icon">${obj.icon}</span>
            <span class="node-name">${obj.name}</span>
          </div>
        </div>`;
      list.appendChild(node);
    });
    block.appendChild(list);
    chainsWrap.appendChild(block);
  }
}

function renderNode(pathway, chain, obj, index) {
  const status = getObjectiveStatus(chain, index);
  const saved = state[obj.id];
  const isSpecial = chain.special !== undefined ? chain.special : pathway.special;

  const node = document.createElement('div');
  node.className = 'node';
  node.dataset.status = status;

  let statusRow = `<span class="status-tag ${status}">${statusLabel(status)}</span>`;
  let datesRow = '';
  let actionsRow = '';

  if (status === 'in-progress' || status === 'late') {
    if (saved.endDate) {
      const remaining = daysBetween(todayISO(), saved.endDate);
      const hourglass = status === 'late' ? '⌛' : '⏳';
      const remText = status === 'late'
        ? `${Math.abs(remaining)}d overdue`
        : (remaining === 0 ? 'due today' : `${remaining}d left`);
      statusRow = `<span class="status-tag ${status}">${hourglass} ${statusLabel(status)}</span><span class="node-dates">${remText}</span>`;
      datesRow = `<div class="node-dates">${saved.startDate} → ${saved.endDate}</div>`;
    } else {
      statusRow = `<span class="status-tag in-progress">⏳ IN PROGRESS</span>`;
      datesRow = `<div class="node-dates">started ${saved.startDate}</div>`;
    }
    actionsRow = `
      <div class="node-actions">
        <button class="btn btn-complete" data-action="complete" data-id="${obj.id}">Complete</button>
        <button class="btn btn-skip" data-action="skip" data-id="${obj.id}">Skip</button>
      </div>`;
  }

  if (status === 'completed') {
    const late = saved.endDate && saved.completedDate && daysBetween(saved.endDate, saved.completedDate) > 0;
    statusRow = `<span class="status-tag completed">✓ COMPLETED</span>${late ? '<span class="status-tag late-suffix">[late]</span>' : ''}`;
    datesRow = `<div class="node-dates">${saved.startDate || ''}${saved.endDate ? ' → ' + saved.endDate : ''}${saved.completedDate ? ' · done ' + saved.completedDate : ''}</div>`;
  }

  if (status === 'skipped') {
    statusRow = `<span class="status-tag skipped">SKIPPED</span>`;
    datesRow = saved && saved.startDate ? `<div class="node-dates">${saved.startDate}</div>` : '';
  }

  node.innerHTML = `
    <div class="node-rail"><div class="node-dot"></div></div>
    <div class="node-card">
      <div class="node-top">
        <span class="node-icon">${obj.icon}</span>
        <span class="node-name">${obj.name}</span>
      </div>
      <div class="node-status-row">${statusRow}</div>
      ${datesRow}
      ${actionsRow}
    </div>
  `;

  if (status === 'available') {
    node.querySelector('.node-card').addEventListener('click', () => openScheduleModal(obj, isSpecial));
  }

  node.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action === 'complete') completeObjective(obj.id);
      if (action === 'skip') skipObjective(obj.id);
    });
  });

  return node;
}

/* ---------- ACTIONS ---------- */

function completeObjective(id) {
  const s = state[id] || {};
  s.status = 'completed';
  s.completedDate = todayISO();
  state[id] = s;
  saveState();
  renderDetail();
}

function skipObjective(id) {
  const s = state[id] || {};
  s.status = 'skipped';
  state[id] = s;
  saveState();
  renderDetail();
}

function startObjective(id, endDate) {
  state[id] = {
    status: 'in-progress',
    startDate: todayISO(),
    endDate: endDate || null,
  };
  saveState();
  renderDetail();
}

/* ---------- MODAL ---------- */

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const dateFields = document.getElementById('dateFields');
const modalNote = document.getElementById('modalNote');
const startDateInput = document.getElementById('startDateInput');
const endDateInput = document.getElementById('endDateInput');
const modalConfirm = document.getElementById('modalConfirm');
const modalCancel = document.getElementById('modalCancel');

let pendingObjId = null;
let pendingIsSpecial = false;

function openScheduleModal(obj, isSpecial) {
  pendingObjId = obj.id;
  pendingIsSpecial = isSpecial;
  modalTitle.textContent = obj.name;
  startDateInput.value = todayISO();

  if (isSpecial) {
    dateFields.style.display = 'none';
    modalNote.style.display = 'block';
    endDateInput.value = '';
    endDateInput.required = false;
  } else {
    dateFields.style.display = 'flex';
    modalNote.style.display = 'none';
    endDateInput.min = todayISO();
    endDateInput.value = '';
  }
  modalOverlay.classList.add('show');
}

function closeModal() {
  modalOverlay.classList.remove('show');
  pendingObjId = null;
}

modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

modalConfirm.addEventListener('click', () => {
  if (!pendingObjId) return;
  if (!pendingIsSpecial && !endDateInput.value) {
    endDateInput.focus();
    return;
  }
  startObjective(pendingObjId, pendingIsSpecial ? null : endDateInput.value);
  closeModal();
});

/* ---------- INIT ---------- */

renderHome();
