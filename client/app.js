/* ================================================================
   app.js — HabitFlow App Logic (Teal UI)
   ================================================================ */
'use strict';

// ── Constants ────────────────────────────────────────────────
const fmt = n => `₹${Math.round(n).toLocaleString('en-IN')}`;
const todayStr = () => new Date().toISOString().split('T')[0];
const DAY3  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY1  = ['S','M','T','W','T','F','S'];
const MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MON3  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ICONS = ['🌿','🔥','💪','🏃','🧘','📚','✍️','🎯','🥗','💧','😴','🧠','🎵','🏋️','🚴','🧹','🌱','✅','☕','🥤','🚶','🎨','💊','🛁','📝','⭐','🏆','🎸','🌊','🦋','🍎','🌙'];
const COLORS = ['#2dd4aa','#22c55e','#3b82f6','#a78bfa','#f59e0b','#ef4444','#ec4899','#06b6d4','#f97316','#14b8a6'];
const CAT_ICONS  = {Food:'🍔',Transport:'🚗',Shopping:'🛍️',Health:'💊',Entertainment:'🎬',Education:'📚',Bills:'🧾',Other:'📦'};
const CAT_COLORS = {Food:'#f59e0b',Transport:'#3b82f6',Shopping:'#ec4899',Health:'#22c55e',Entertainment:'#a78bfa',Bills:'#ef4444',Education:'#14b8a6',Other:'#94a3b8'};

const QUOTES = [
  'Every journey begins with a single step.',
  'Small daily improvements lead to stunning results.',
  'Consistency is the key to achievement.',
  'Your habits define your future self.',
  'Discipline is choosing what you want most over what you want now.',
  'The secret of getting ahead is getting started.',
  'One day or day one — you decide.',
];

// ── State ────────────────────────────────────────────────────
let currentUser = null;
let habits = [];
let expenses = [];
let selectedDate = todayStr();
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let selIcon = '🌿', selColor = '#2dd4aa', selDays = [];
let expFilter = 'all', expCatFilter = '';

// ── Utils ────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${{success:'✅',error:'❌',info:'ℹ️'}[type]||''}</span> ${msg}`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-8px)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 350); }, 3200);
}

function showErr(id, msg) { const e = document.getElementById(id); e.textContent = msg; e.style.display = 'block'; }
function hideErr(id) { const e = document.getElementById(id); if(e){e.textContent='';e.style.display='none';} }

function scheduledOnDay(habit, dateStr) {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  return habit.days.length === 0 || habit.days.includes(dow);
}

function isCompleted(habit, dateStr) {
  return !!(habit.logs?.find(l => l.date === dateStr && l.completed));
}

// ── Boot ─────────────────────────────────────────────────────
async function initApp() {
  const token = localStorage.getItem('ht_token');
  if (!token) return showAuth();
  //--------------------------------------------------------
 // if (!token) {
 // currentUser = { name: "Test User", email: "test@test.com" };
 // return showApp();
//}

//-----------------------------------------------------------
  try {
    const { user } = await API.Auth.me();
    currentUser = user; showApp();
  } catch { localStorage.removeItem('ht_token'); showAuth(); }
}

function showAuth() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app-screen').style.display = 'none';
}

function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'flex';
  document.getElementById('profile-avatar').textContent = currentUser.name[0].toUpperCase();
  document.getElementById('profile-name').textContent = currentUser.name;
  document.getElementById('profile-email').textContent = currentUser.email;

  const h = new Date().getHours();
  document.getElementById('topbar-greeting').textContent =
    h < 12 ? 'good morning.' : h < 17 ? 'good afternoon.' : 'good evening.';
  document.getElementById('topbar-month').textContent = MON3[new Date().getMonth()];

  // Random quote
  document.getElementById('daily-quote').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  navigateTo('dashboard');
}

// ── Auth Events ───────────────────────────────────────────────
document.getElementById('go-signup').addEventListener('click', () => {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('signup-form').style.display = 'block';
  hideErr('login-error');
});
document.getElementById('go-login').addEventListener('click', () => {
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  hideErr('signup-error');
});

document.getElementById('login-btn').addEventListener('click', async () => {
  hideErr('login-error');
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  if (!email || !pass) return showErr('login-error','Fill in all fields');
  const btn = document.getElementById('login-btn');
  btn.textContent = 'Signing in…'; btn.disabled = true;
  try {
    const { token, user } = await API.Auth.login(email, pass);
    localStorage.setItem('ht_token', token); currentUser = user; showApp();
  } catch(e) { showErr('login-error', e.message); }
  finally { btn.textContent = 'Sign In'; btn.disabled = false; }
});

document.getElementById('signup-btn').addEventListener('click', async () => {
  hideErr('signup-error');
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-password').value;
  if (!name || !email || !pass) return showErr('signup-error','Fill in all fields');
  const btn = document.getElementById('signup-btn');
  btn.textContent = 'Creating…'; btn.disabled = true;
  try {
    const { token, user } = await API.Auth.signup(name, email, pass);
    localStorage.setItem('ht_token', token); currentUser = user; showApp();
  } catch(e) { showErr('signup-error', e.message); }
  finally { btn.textContent = 'Create Account'; btn.disabled = false; }
});

['login-email','login-password'].forEach(id => document.getElementById(id).addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('login-btn').click(); }));
['signup-name','signup-email','signup-password'].forEach(id => document.getElementById(id).addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('signup-btn').click(); }));

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('ht_token'); currentUser = null; habits = []; expenses = [];
  closeModal('profile-modal'); showAuth();
});

// ── Theme ────────────────────────────────────────────────────
const themeBtn = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('ht_theme') || 'dark';
document.documentElement.dataset.theme = savedTheme;
themeBtn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
themeBtn.addEventListener('click', () => {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
  themeBtn.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('ht_theme', isDark ? 'light' : 'dark');
});

// Long-press theme-toggle → open profile
themeBtn.addEventListener('contextmenu', e => { e.preventDefault(); openModal('profile-modal'); });
document.getElementById('topbar-greeting').addEventListener('click', () => openModal('profile-modal'));

// ── Navigation ────────────────────────────────────────────────
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');
  document.querySelector(`.nav-tab[data-page="${page}"]`)?.classList.add('active');
  document.getElementById('topbar-title').textContent =
    {dashboard:'Habits',habits:'Habits',calendar:'Calendar',analytics:'Analytics',expenses:'Expenses'}[page] || 'HabitFlow';

  if (page === 'dashboard')  loadDashboard();
  else if (page === 'habits') loadHabitsList();
  else if (page === 'calendar') loadCalendar();
  else if (page === 'analytics') loadAnalytics();
  else if (page === 'expenses') loadExpenses();
}

document.querySelectorAll('.nav-tab').forEach(tab =>
  tab.addEventListener('click', () => navigateTo(tab.dataset.page)));

// ── Modal Helpers ────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(ov =>
  ov.addEventListener('click', e => { if(e.target === ov) ov.classList.remove('open'); }));
document.getElementById('habit-modal-close').addEventListener('click', () => closeModal('habit-modal'));
document.getElementById('habit-cancel-btn').addEventListener('click', () => closeModal('habit-modal'));
document.getElementById('expense-modal-close').addEventListener('click', () => closeModal('expense-modal'));
document.getElementById('expense-cancel-btn').addEventListener('click', () => closeModal('expense-modal'));
document.getElementById('profile-modal-close').addEventListener('click', () => closeModal('profile-modal'));

// ── Date Strip ───────────────────────────────────────────────
function buildDateStrip() {
  const strip = document.getElementById('date-strip');
  const today = todayStr();
  const now = new Date();
  // Show 14 days: 7 past + today + 6 future
  const dates = Array.from({length:14}, (_,i) => {
    const d = new Date(now); d.setDate(now.getDate() - 7 + i);
    return d.toISOString().split('T')[0];
  });

  strip.innerHTML = dates.map(d => {
    const dt = new Date(d + 'T00:00:00');
    const isToday = d === today;
    const isSelected = d === selectedDate;
    const hasData = habits.some(h => scheduledOnDay(h,d) && isCompleted(h,d));
    return `<div class="date-chip ${isSelected ? 'active' : ''} ${hasData ? 'has-data' : ''}" data-date="${d}">
      <span class="dc-day">${DAY3[dt.getDay()].slice(0,3)}</span>
      <span class="dc-num">${dt.getDate()}</span>
      <span class="dc-dot"></span>
    </div>`;
  }).join('');

  strip.querySelectorAll('.date-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      selectedDate = chip.dataset.date;
      strip.querySelectorAll('.date-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderDashHabits();
      updateDashLabel();
    });
  });

  // Scroll selected into view
  const sel = strip.querySelector('.date-chip.active');
  if (sel) setTimeout(() => sel.scrollIntoView({inline:'center',behavior:'smooth'}), 100);
}

function updateDashLabel() {
  const today = todayStr();
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; })();
  const dt = new Date(selectedDate + 'T00:00:00');
  let label = selectedDate === today ? "Today's Habits" :
              selectedDate === yesterday ? "Yesterday's Habits" :
              `${DAY3[dt.getDay()]}, ${dt.getDate()} ${MON3[dt.getMonth()]}`;
  document.getElementById('dash-section-label').textContent = label;
}

// ── Dashboard ────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const { habits: h } = await API.Habits.list();
    habits = h;
    buildDateStrip();
    renderDashHabits();
    updateDashLabel();
    updateStatsPanel();
    // Today's spend
    const { total } = await API.Expenses.list({ filter:'today' });
    // (optional: display somewhere)
  } catch(e) { toast('Error: '+e.message,'error'); }
}

function renderDashHabits() {
  const list = document.getElementById('dash-habits-list');
  const scheduled = habits.filter(h => scheduledOnDay(h, selectedDate));

  if (!scheduled.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🌱</div><h3>Nothing scheduled</h3><p>Add habits or pick another day</p></div>`;
    return;
  }

  list.innerHTML = scheduled.map(h => {
    const done = isCompleted(h, selectedDate);
    const totalLogs = h.logs?.filter(l=>l.completed).length || 0;
    const totalScheduled = Math.max(1, totalLogs + 1);
    const pct = Math.round((totalLogs / Math.max(totalLogs,1)) * 100);
    const displayPct = done ? 100 : Math.min(pct, 99);

    return `<div class="habit-card">
      <div class="habit-card-left-bar" style="background:${h.color}"></div>
      <div class="habit-card-row1">
        <div class="habit-name-wrap">
          <div class="habit-card-name">${h.icon} ${h.name}</div>
          <div class="habit-card-sub">${h.days.length===0?'Every day':h.days.map(d=>DAY3[d]).join(', ')} · 🔥 ${h.currentStreak} streak</div>
        </div>
        <div class="habit-pct-badge">${done?'100':'0'}%</div>
      </div>
      <div class="habit-card-row2">
        <div class="habit-big-val">${h.currentStreak}<small>days</small></div>
        <div class="habit-prog-bar"><div class="habit-prog-fill" style="width:${done?100:0}%"></div></div>
        <button class="habit-check ${done?'done':''}" onclick="toggleHabit('${h._id}','${selectedDate}',this)">✓</button>
      </div>
    </div>`;
  }).join('');
}

function updateStatsPanel() {
  const total = habits.length;
  const today = todayStr();
  const scheduled = habits.filter(h=>scheduledOnDay(h,today));
  const done = scheduled.filter(h=>isCompleted(h,today));
  const rate = scheduled.length ? Math.round((done.length/scheduled.length)*100) : 0;
  const bestStreak = habits.reduce((m,h)=>Math.max(m,h.currentStreak),0);
  document.getElementById('sm-tracked').textContent = total;
  document.getElementById('sm-rate').textContent = rate + '%';
  document.getElementById('sm-streak').textContent = bestStreak + 'd';
}

async function toggleHabit(habitId, dateStr, btn) {
  try {
    const { habit } = await API.Habits.toggle(habitId, dateStr);
    habits = habits.map(h => h._id === habitId ? habit : h);
    renderDashHabits();
    buildDateStrip();
    updateStatsPanel();
  } catch(e) { toast('Error: '+e.message,'error'); }
}
window.toggleHabit = toggleHabit;

// View toggle (Daily / Weekly)
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    // For now both views show the date strip
  });
});

// ── Habits List Page ──────────────────────────────────────────
async function loadHabitsList() {
  document.getElementById('habits-list-container').innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
  try {
    const { habits: h } = await API.Habits.list();
    habits = h;
    renderHabitsList();
  } catch(e) { toast('Error: '+e.message,'error'); }
}

function renderHabitsList() {
  const container = document.getElementById('habits-list-container');
  if (!habits.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🌿</div><h3>No habits yet</h3><p>Add your first habit above</p></div>`;
    return;
  }
  container.innerHTML = habits.map(h => `
    <div class="habits-list-item">
      <div class="hli-left">
        <div class="hli-icon" style="background:${h.color}20;border-color:${h.color}40">${h.icon}</div>
        <div>
          <div class="hli-name">${h.name}</div>
          <div class="hli-sub">${h.days.length===0?'Every day':h.days.map(d=>DAY3[d]).join(', ')}</div>
        </div>
      </div>
      <div class="hli-right">
        <div class="hli-streak">🔥 ${h.currentStreak}</div>
        <button class="btn-icon" onclick="openEditHabit('${h._id}')" style="font-size:13px">✏️</button>
        <button class="btn-icon" onclick="deleteHabit('${h._id}')" style="color:var(--red);font-size:13px">🗑️</button>
        <span class="hli-arrow">›</span>
      </div>
    </div>`).join('');
}

document.getElementById('habits-add-btn').addEventListener('click', openAddHabit);
document.getElementById('dash-add-btn').addEventListener('click', openAddHabit);

// ── Habit Modal ───────────────────────────────────────────────
function buildHabitModalUI() {
  document.getElementById('icon-grid').innerHTML = ICONS.map(ic =>
    `<div class="icon-opt ${ic===selIcon?'selected':''}" onclick="pickIcon('${ic}')">${ic}</div>`).join('');
  document.getElementById('color-grid').innerHTML = COLORS.map(c =>
    `<div class="color-swatch ${c===selColor?'selected':''}" style="background:${c}" onclick="pickColor('${c}')"></div>`).join('');
  document.getElementById('day-selector').innerHTML = DAY3.map((d,i) =>
    `<button class="day-btn ${selDays.includes(i)?'selected':''}" onclick="toggleDay(${i})">${d.slice(0,2)}</button>`).join('');
}

function openAddHabit() {
  selIcon='🌿'; selColor='#2dd4aa'; selDays=[];
  document.getElementById('habit-id').value='';
  document.getElementById('habit-name').value='';
  document.getElementById('habit-tag').value='';
  document.getElementById('habit-modal-title').textContent='Add Habit';
  buildHabitModalUI(); openModal('habit-modal');
}
window.openAddHabit = openAddHabit;

window.openEditHabit = id => {
  const h = habits.find(x=>x._id===id); if(!h) return;
  selIcon=h.icon; selColor=h.color; selDays=[...h.days];
  document.getElementById('habit-id').value=h._id;
  document.getElementById('habit-name').value=h.name;
  document.getElementById('habit-tag').value=h.tag||'';
  document.getElementById('habit-modal-title').textContent='Edit Habit';
  buildHabitModalUI(); openModal('habit-modal');
};

window.pickIcon = ic => { selIcon=ic; buildHabitModalUI(); };
window.pickColor = c => { selColor=c; buildHabitModalUI(); };
window.toggleDay = i => {
  const idx=selDays.indexOf(i); idx===-1?selDays.push(i):selDays.splice(idx,1);
  buildHabitModalUI();
};

document.getElementById('habit-save-btn').addEventListener('click', async () => {
  const name = document.getElementById('habit-name').value.trim();
  if (!name) return toast('Enter a habit name','error');
  const id = document.getElementById('habit-id').value;
  const btn = document.getElementById('habit-save-btn');
  btn.textContent='Saving…'; btn.disabled=true;
  try {
    const payload = { name, icon:selIcon, color:selColor, days:selDays };
    if (id) {
      const { habit } = await API.Habits.update(id, payload);
      habits = habits.map(h => h._id===id ? habit : h);
      toast('Habit updated!','success');
    } else {
      const { habit } = await API.Habits.create(payload);
      habits.push(habit);
      toast('Habit added!','success');
    }
    closeModal('habit-modal');
    renderHabitsList();
    renderDashHabits();
    buildDateStrip();
  } catch(e) { toast('Error: '+e.message,'error'); }
  finally { btn.textContent='Save'; btn.disabled=false; }
});

window.deleteHabit = async id => {
  if (!confirm('Delete this habit?')) return;
  try {
    await API.Habits.delete(id);
    habits = habits.filter(h=>h._id!==id);
    renderHabitsList(); renderDashHabits(); buildDateStrip();
    toast('Deleted','info');
  } catch(e) { toast('Error: '+e.message,'error'); }
};

// ── Calendar ──────────────────────────────────────────────────
async function loadCalendar() {
  try {
    const { habits: h } = await API.Habits.list();
    habits = h;
    renderCalendar();
    updateCalStats();
  } catch(e) { toast('Error: '+e.message,'error'); }
}

function renderCalendar() {
  const label = document.getElementById('cal-label');
  label.textContent = `${MONTH[calMonth]} ${calYear}`;

  const firstDay = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
  const today = todayStr();

  const hdrs = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  let html = hdrs.map(d=>`<div class="cal-hdr">${d}</div>`).join('');
  for (let i=0;i<startOffset;i++) html+=`<div class="cal-cell empty"></div>`;

  for (let d=1;d<=daysInMonth;d++) {
    const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const scheduled = habits.filter(h=>scheduledOnDay(h,ds));
    const done = scheduled.filter(h=>isCompleted(h,ds));
    const isToday = ds===today;
    const future = ds>today;
    let cls='cal-cell';
    if (isToday) cls+=' today-cell';
    else if (!future && scheduled.length) {
      if (done.length===scheduled.length && done.length>0) cls+=' has-check';
      else if (done.length>0) cls+=' partial';
    }
    html+=`<div class="${cls}" data-date="${ds}">${d}</div>`;
  }
  document.getElementById('cal-grid').innerHTML = html;

  document.querySelectorAll('.cal-cell:not(.empty)').forEach(cell => {
    cell.addEventListener('click', () => showCalDetail(cell.dataset.date));
  });
}

function showCalDetail(dateStr) {
  const dt = new Date(dateStr+'T00:00:00');
  const scheduled = habits.filter(h=>scheduledOnDay(h,dateStr));
  const area = document.getElementById('cal-detail-area');
  if (!scheduled.length) { area.innerHTML=''; return; }
  area.innerHTML = `<div class="cal-detail-card">
    <div class="cal-detail-date">${DAY3[dt.getDay()]}, ${dt.getDate()} ${MONTH[dt.getMonth()]}</div>
    ${scheduled.map(h=>{
      const done=isCompleted(h,dateStr);
      return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:18px">${h.icon}</span>
        <span style="flex:1;font-family:var(--font-d);font-size:13px;font-weight:600">${h.name}</span>
        <span style="font-size:15px">${done?'✅':'⬜'}</span>
      </div>`;
    }).join('')}
  </div>`;
}

function updateCalStats() {
  const today = todayStr();
  const best = habits.reduce((m,h)=>Math.max(m,h.longestStreak),0);
  document.getElementById('cal-milestone-sub').textContent = `Best streak: ${best} days`;
  // Count missed days this month
  const now = new Date();
  let missed = 0;
  for (let d=1; d<now.getDate(); d++) {
    const ds = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const scheduled = habits.filter(h=>scheduledOnDay(h,ds));
    const done = scheduled.filter(h=>isCompleted(h,ds));
    if (scheduled.length && done.length < scheduled.length) missed++;
  }
  document.getElementById('cal-missed-sub').textContent = `${missed} days missed this month`;
}

document.getElementById('cal-prev').addEventListener('click', () => {
  calMonth--; if(calMonth<0){calMonth=11;calYear--;} renderCalendar();
});
document.getElementById('cal-next').addEventListener('click', () => {
  calMonth++; if(calMonth>11){calMonth=0;calYear++;} renderCalendar();
});

document.querySelectorAll('.cal-view-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.cal-view-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// ── Analytics ─────────────────────────────────────────────────
async function loadAnalytics() {
  try {
    const [habData, expData] = await Promise.all([
      API.Habits.analytics(),
      API.Expenses.analytics()
    ]);
    renderHabitAnalytics(habData);
    renderFinanceAnalytics(expData);
    initMonthYearSelectors();
    loadMonthlyChart();
    loadHabitBarChart();
  } catch(e) { toast('Error: '+e.message,'error'); }
}

function renderHabitAnalytics({ analytics }) {
  if (!analytics?.length) {
    document.getElementById('ranking-list').innerHTML = `<div class="empty-state" style="padding:20px"><p>Add habits to see analytics</p></div>`;
    return;
  }
  const avgW = Math.round(analytics.reduce((s,a)=>s+a.weeklyCompletion,0)/analytics.length);
  const avgM = Math.round(analytics.reduce((s,a)=>s+a.monthlyCompletion,0)/analytics.length);
  document.getElementById('an-week-val').textContent = avgW+'%';
  document.getElementById('an-month-val').textContent = avgM+'%';

  // Week bar chart
  const now = new Date();
  const mon = new Date(now); mon.setDate(now.getDate()-((now.getDay()+6)%7));
  const weekDates = Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); return d.toISOString().split('T')[0]; });
  const weekData = weekDates.map(d => {
    const sched = habits.filter(h=>scheduledOnDay(h,d));
    const done = sched.filter(h=>isCompleted(h,d));
    return { day:DAY3[new Date(d+'T00:00:00').getDay()].slice(0,2), pct: sched.length?Math.round((done.length/sched.length)*100):0 };
  });
  const maxP = Math.max(...weekData.map(d=>d.pct),1);
  const todayDow = (new Date().getDay()+6)%7;
  document.getElementById('an-bar-chart').innerHTML = weekData.map((d,i)=>
    `<div class="bar-wrap">
      <div class="bar-val">${d.pct?d.pct+'%':''}</div>
      <div class="bar ${i<=todayDow?'hi':''}" style="height:${(d.pct/maxP)*90}%"></div>
      <div class="bar-label">${d.day}</div>
    </div>`).join('');

  // Ranking
  const rankClass = ['g1','g2','g3'];
  document.getElementById('ranking-list').innerHTML = analytics.map((a,i)=>
    `<div class="ranking-item">
      <div class="rank-num ${rankClass[i]||''}">${i+1}</div>
      <span style="font-size:18px">${a.icon}</span>
      <div class="rank-info">
        <div class="rank-name">${a.name}</div>
        <div class="rank-bar"><div class="rank-bar-fill" style="width:${a.monthlyCompletion}%;background:${a.color}"></div></div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px">🔥 ${a.currentStreak} · Best: ${a.bestDay}</div>
      </div>
      <div class="rank-pct">${a.monthlyCompletion}%</div>
    </div>`).join('');
}

function renderFinanceAnalytics({ weekTotal, monthTotal, categoryTotals, dailyTrend }) {
  // Finance bar
  const maxT = Math.max(...(dailyTrend||[]).map(d=>d.total),1);
  document.getElementById('fin-bar-chart').innerHTML = (dailyTrend||[]).map(d => {
    const day = DAY3[new Date(d.date+'T00:00:00').getDay()].slice(0,2);
    return `<div class="bar-wrap">
      <div class="bar-val" style="color:var(--finance2)">${d.total?fmt(d.total):''}</div>
      <div class="bar hi" style="height:${(d.total/maxT)*90}%;background:linear-gradient(to top,var(--finance),var(--finance2))"></div>
      <div class="bar-label">${day}</div>
    </div>`;
  }).join('');

  // Donut
  const cats = Object.entries(categoryTotals||{}).sort((a,b)=>b[1]-a[1]);
  const total = cats.reduce((s,[,v])=>s+v,0);
  const svg = document.getElementById('donut-svg');
  const leg = document.getElementById('donut-legend');
  if (!total) { svg.innerHTML='<text x="55" y="60" text-anchor="middle" fill="var(--text3)" font-size="11">No data</text>'; leg.innerHTML=''; return; }
  const cx=55,cy=55,r=38,sw=18,circ=2*Math.PI*r;
  let offset=0, paths='';
  leg.innerHTML='';
  cats.forEach(([cat,val])=>{
    const pct=val/total, dash=pct*circ;
    const color=CAT_COLORS[cat]||'#94a3b8';
    paths+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-dasharray="${dash} ${circ-dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset+=dash;
    leg.innerHTML+=`<div class="donut-legend-item"><div class="legend-dot" style="background:${color}"></div><span style="flex:1">${CAT_ICONS[cat]||'📦'} ${cat}</span><span style="font-weight:700;font-family:var(--font-d)">${fmt(val)}</span></div>`;
  });
  paths+=`<text x="${cx}" y="${cy-3}" text-anchor="middle" fill="var(--text)" font-size="10" font-weight="700">${fmt(total)}</text><text x="${cx}" y="${cy+9}" text-anchor="middle" fill="var(--text3)" font-size="8">Total</text>`;
  svg.innerHTML=paths;
}

// ── Expenses ──────────────────────────────────────────────────
async function loadExpenses() {
  try {
    const [tod, wk, mo] = await Promise.all([
      API.Expenses.list({filter:'today'}),
      API.Expenses.list({filter:'week'}),
      API.Expenses.list({filter:'month'})
    ]);
    document.getElementById('exp-today').textContent = fmt(tod.total);
    document.getElementById('exp-week').textContent  = fmt(wk.total);
    document.getElementById('exp-month').textContent = fmt(mo.total);
    fetchExpenseList();
  } catch(e) { toast('Error: '+e.message,'error'); }
}

async function fetchExpenseList() {
  document.getElementById('expense-list').innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
  try {
    const params = {};
    if (expFilter !== 'all') params.filter = expFilter;
    if (expCatFilter) params.category = expCatFilter;
    const { expenses: e } = await API.Expenses.list(params);
    expenses = e;
    if (!expenses.length) {
      document.getElementById('expense-list').innerHTML = `<div class="empty-state"><div class="empty-state-icon">💰</div><h3>No expenses</h3><p>Tap + Add to record one</p></div>`;
      return;
    }
    document.getElementById('expense-list').innerHTML = expenses.map(exp => `
      <div class="expense-item">
        <div class="exp-cat-bubble" style="background:${CAT_COLORS[exp.category]||'#94a3b8'}20">${CAT_ICONS[exp.category]||'📦'}</div>
        <div class="exp-info">
          <div class="exp-title">${exp.title}</div>
          <div class="exp-meta">${exp.category} · ${exp.date}${exp.note?' · '+exp.note:''}</div>
        </div>
        <div class="exp-amount">${fmt(exp.amount)}</div>
        <div class="exp-actions">
          <button class="btn-icon" onclick="openEditExpense('${exp._id}')" style="font-size:13px">✏️</button>
          <button class="btn-icon" onclick="deleteExpense('${exp._id}')" style="color:var(--red);font-size:13px">🗑️</button>
        </div>
      </div>`).join('');
  } catch(e) { toast('Error: '+e.message,'error'); }
}

// Filter pills
document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    expFilter = pill.dataset.filter;
    document.querySelectorAll('.filter-pill').forEach(p=>p.classList.remove('active'));
    pill.classList.add('active');
    fetchExpenseList();
  });
});

document.getElementById('exp-cat-filter').addEventListener('change', e => {
  expCatFilter = e.target.value; fetchExpenseList();
});

// Expense modal
document.getElementById('exp-add-btn').addEventListener('click', () => {
  document.getElementById('expense-id').value='';
  document.getElementById('expense-title').value='';
  document.getElementById('expense-amount').value='';
  document.getElementById('expense-category').value='';
  document.getElementById('expense-date').value=todayStr();
  document.getElementById('expense-note').value='';
  document.getElementById('expense-modal-title').textContent='Add Expense';
  openModal('expense-modal');
});

window.openEditExpense = id => {
  const exp = expenses.find(e=>e._id===id); if(!exp) return;
  document.getElementById('expense-id').value=exp._id;
  document.getElementById('expense-title').value=exp.title;
  document.getElementById('expense-amount').value=exp.amount;
  document.getElementById('expense-category').value=exp.category;
  document.getElementById('expense-date').value=exp.date;
  document.getElementById('expense-note').value=exp.note||'';
  document.getElementById('expense-modal-title').textContent='Edit Expense';
  openModal('expense-modal');
};

document.getElementById('expense-save-btn').addEventListener('click', async () => {
  const title    = document.getElementById('expense-title').value.trim();
  const amount   = parseInt(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const date     = document.getElementById('expense-date').value;
  const note     = document.getElementById('expense-note').value.trim();
  const id       = document.getElementById('expense-id').value;
  if (!title||!amount||!category||!date) return toast('Fill required fields','error');
  if (amount<1) return toast('Amount must be ≥ ₹1','error');
  const btn = document.getElementById('expense-save-btn');
  btn.textContent='Saving…'; btn.disabled=true;
  try {
    if (id) { await API.Expenses.update(id,{title,amount,category,date,note}); toast('Updated!','success'); }
    else     { await API.Expenses.create({title,amount,category,date,note}); toast('Added!','success'); }
    closeModal('expense-modal'); loadExpenses();
  } catch(e) { toast('Error: '+e.message,'error'); }
  finally { btn.textContent='Save'; btn.disabled=false; }
});

window.deleteExpense = async id => {
  if (!confirm('Delete expense?')) return;
  try { await API.Expenses.delete(id); toast('Deleted','info'); loadExpenses(); }
  catch(e) { toast('Error: '+e.message,'error'); }
};

// ── Boot ─────────────────────────────────────────────────────
initApp();

// ===== Monthly Chart =====
function initMonthYearSelectors() {
  const monthSel = document.getElementById('month-select');
  const yearSel = document.getElementById('year-select');

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  months.forEach((m,i)=>{
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = m;
    monthSel.appendChild(opt);
  });

  const currentYear = new Date().getFullYear();
  for(let y=currentYear-5; y<=currentYear; y++){
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSel.appendChild(opt);
  }

  monthSel.value = new Date().getMonth();
  yearSel.value = currentYear;

  monthSel.onchange = loadMonthlyChart;
  yearSel.onchange = loadMonthlyChart;
}

let monthlyChart;

function loadMonthlyChart() {
  const month = +document.getElementById('month-select').value;
  const year = +document.getElementById('year-select').value;

  const days = new Date(year, month+1, 0).getDate();

  const labels = [];
  const data = [];

  for(let d=1; d<=days; d++){
    const date = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const scheduled = habits.filter(h => scheduledOnDay(h,date));
    const done = scheduled.filter(h => isCompleted(h,date));
    const pct = scheduled.length ? Math.round((done.length/scheduled.length)*100) : 0;

    labels.push(d);
    data.push(pct);
  }

  if(monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(document.getElementById('monthlyChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Completion %',
        data,
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true
    }
  });
}

let habitBarChart;

function loadHabitBarChart() {
  const labels = habits.map(h => h.name);
  const data = habits.map(h => h.currentStreak * 10); // simple metric

  if(habitBarChart) habitBarChart.destroy();

  habitBarChart = new Chart(document.getElementById('habitBarChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Habit Score',
        data
      }]
    }
  });
}

