/* ══════════════════════════════════════════
   FinFlow — Complete App Logic
   Storage: localStorage (simulated DB)
   Charts: Chart.js 4
══════════════════════════════════════════ */

'use strict';

// ══════════════════════ CONSTANTS ══════════════════════

const CATEGORIES = [
  { id: 'food',        label: 'Food',        emoji: '🍔', color: '#ff6b6b' },
  { id: 'transport',   label: 'Transport',   emoji: '🚌', color: '#feca57' },
  { id: 'shopping',    label: 'Shopping',    emoji: '🛍️', color: '#48dbfb' },
  { id: 'bills',       label: 'Bills',       emoji: '⚡', color: '#ff9ff3' },
  { id: 'health',      label: 'Health',      emoji: '💊', color: '#54a0ff' },
  { id: 'entertainment',label:'Fun',         emoji: '🎮', color: '#5f27cd' },
  { id: 'education',   label: 'Education',   emoji: '📚', color: '#00d2d3' },
  { id: 'travel',      label: 'Travel',      emoji: '✈️', color: '#ff9f43' },
  { id: 'groceries',   label: 'Groceries',   emoji: '🛒', color: '#1dd1a1' },
  { id: 'dining',      label: 'Dining',      emoji: '🍽️', color: '#ee5a24' },
  { id: 'gym',         label: 'Gym',         emoji: '💪', color: '#c56cf0' },
  { id: 'other',       label: 'Other',       emoji: '📦', color: '#8395a7' },
];

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDec = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const catById = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

// ══════════════════════ STATE ══════════════════════

let state = {
  currentUser: null,
  currentPage: 'dashboard',
  chartPeriod: 'month',
};

let charts = {};

// ══════════════════════ STORAGE ══════════════════════

const DB = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  del: (key) => localStorage.removeItem(key),

  getUsers: () => DB.get('ff_users') || {},
  saveUsers: (u) => DB.set('ff_users', u),

  getUserData: (uid) => DB.get(`ff_data_${uid}`) || { expenses: [], budgets: {}, income: 0 },
  saveUserData: (uid, d) => DB.set(`ff_data_${uid}`, d),

  currentUID: () => state.currentUser?.id,
  getData: () => DB.getUserData(DB.currentUID()),
  saveData: (d) => DB.saveUserData(DB.currentUID(), d),
};

// Seed demo account
(function seedDemo() {
  const users = DB.getUsers();
  if (!users['demo@finflow.app']) {
    users['demo@finflow.app'] = { id: 'demo', name: 'Demo User', email: 'demo@finflow.app', password: 'demo123' };
    DB.saveUsers(users);
    // Seed transactions
    const now = new Date();
    const expenses = [];
    const pairs = [
      ['Swiggy Dinner','food',420],['Uber Ride','transport',180],['Netflix Sub','entertainment',649],
      ['Milk & Eggs','groceries',220],['Protein Powder','gym',1800],['Electricity','bills',1400],
      ['Book: Atomic Habits','education',399],['Movie Tickets','entertainment',600],
      ['Pharmacy','health',340],['Dinner Out','dining',850],['Amazon Purchase','shopping',1299],
      ['Bus Pass','transport',200],['Zomato Lunch','food',380],['Internet Bill','bills',799],
      ['Gym Membership','gym',999],['Coffee Shop','dining',220],['Vegetables','groceries',350],
      ['Flight Booking','travel',4200],['Doctor Visit','health',500],['T-Shirt','shopping',699],
    ];
    pairs.forEach(([desc, cat, amt], i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 1.3);
      expenses.push({ id: uid(), desc, category: cat, amount: amt, date: d.toISOString().split('T')[0], notes: '' });
    });
    DB.saveUserData('demo', {
      expenses,
      income: 75000,
      budgets: {
        food: { monthly: 4000, weekly: 1000, threshold: 80 },
        transport: { monthly: 2000, weekly: 500, threshold: 80 },
        shopping: { monthly: 3000, weekly: 750, threshold: 80 },
        bills: { monthly: 5000, weekly: 1250, threshold: 80 },
        entertainment: { monthly: 2000, weekly: 500, threshold: 80 },
        health: { monthly: 3000, weekly: 750, threshold: 80 },
        groceries: { monthly: 6000, weekly: 1500, threshold: 80 },
        gym: { monthly: 2000, weekly: 500, threshold: 80 },
      }
    });
  }
})();

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

// ══════════════════════ AUTH ══════════════════════

function switchAuth(mode) {
  document.getElementById('login-card').classList.toggle('hidden', mode !== 'login');
  document.getElementById('register-card').classList.toggle('hidden', mode !== 'register');
}

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');

  const users = DB.getUsers();
  const user = users[email];
  if (!user || user.password !== pass) {
    err.textContent = 'Invalid email or password.';
    return;
  }
  err.textContent = '';
  state.currentUser = user;
  DB.set('ff_session', user);
  bootApp();
}

function handleRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-password').value;
  const err = document.getElementById('reg-error');

  if (!name || !email || !pass) { err.textContent = 'All fields required.'; return; }
  if (pass.length < 6) { err.textContent = 'Password must be 6+ characters.'; return; }

  const users = DB.getUsers();
  if (users[email]) { err.textContent = 'Email already registered.'; return; }

  const user = { id: uid(), name, email, password: pass };
  users[email] = user;
  DB.saveUsers(users);
  DB.saveUserData(user.id, { expenses: [], budgets: {}, income: 0 });

  err.textContent = '';
  state.currentUser = user;
  DB.set('ff_session', user);
  bootApp();
}

function handleLogout() {
  DB.del('ff_session');
  state.currentUser = null;
  Object.values(charts).forEach(c => { try { c.destroy(); } catch {} });
  charts = {};
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  switchAuth('login');
}

function checkSession() {
  const session = DB.get('ff_session');
  if (session) {
    state.currentUser = session;
    bootApp();
  }
}

// ══════════════════════ BOOT ══════════════════════

function bootApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('sidebar-username').textContent = state.currentUser.name;
  document.getElementById('user-avatar').textContent = state.currentUser.name[0].toUpperCase();

  setGreeting();
  buildCategoryPicker();
  populateCategorySelects();
  navigate('dashboard', document.querySelector('.nav-item[data-page="dashboard"]'));
}

function setGreeting() {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = greet + ' ' + state.currentUser.name.split(' ')[0] + ' ✦';
}

// ══════════════════════ NAVIGATION ══════════════════════

function navigate(page, linkEl) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');
  else {
    const t = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (t) t.classList.add('active');
  }

  closeSidebarMobile();

  const renders = {
    dashboard: renderDashboard,
    transactions: renderTransactions,
    budgets: renderBudgets,
    analytics: renderAnalytics,
  };
  if (renders[page]) renders[page]();
  return false;
}

// ══════════════════════ HELPERS ══════════════════════

function getExpenses(period = 'month') {
  const data = DB.getData();
  const expenses = data.expenses || [];
  const now = new Date();

  if (period === 'all') return expenses;

  return expenses.filter(e => {
    const d = new Date(e.date);
    if (period === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return d >= startOfWeek;
    }
    return true;
  });
}

function sumByCategory(expenses) {
  const sums = {};
  CATEGORIES.forEach(c => sums[c.id] = 0);
  expenses.forEach(e => { sums[e.category] = (sums[e.category] || 0) + e.amount; });
  return sums;
}

// ══════════════════════ DASHBOARD ══════════════════════

function renderDashboard() {
  const data = DB.getData();
  const expenses = getExpenses('month');
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const income = data.income || 0;
  const remaining = income - totalSpent;

  // KPIs
  document.getElementById('kpi-income').textContent = income ? fmt(income) : '—';
  document.getElementById('kpi-spent').textContent = fmt(totalSpent);
  document.getElementById('kpi-remaining').textContent = fmt(Math.max(0, remaining));
  document.getElementById('kpi-spent-pct').textContent = income ? `${Math.round(totalSpent / income * 100)}% of income` : '—';
  document.getElementById('kpi-remaining-status').textContent = remaining < 0 ? '⚠️ Over budget' : remaining < income * .1 ? '⚠️ Almost depleted' : '✦ On track';

  const savingsRate = income > 0 ? Math.max(0, Math.round((remaining / income) * 100)) : 0;
  document.getElementById('kpi-savings-rate').textContent = `${savingsRate}%`;
  document.getElementById('kpi-savings-label').textContent = savingsRate > 20 ? '🎉 Great job!' : savingsRate > 0 ? 'This month' : '⚠️ Over budget';

  renderAlerts(data, expenses);
  renderBarChart(expenses);
  renderDonutChart(expenses);
  renderBudgetProgress(data, expenses);
  renderRecentTransactions(data);
}

// ══════════════════════ ALERTS ══════════════════════

function renderAlerts(data, expenses) {
  const container = document.getElementById('alerts-container');
  container.innerHTML = '';
  const budgets = data.budgets || {};
  const catSums = sumByCategory(expenses);

  const alerts = [];

  CATEGORIES.forEach(cat => {
    const budget = budgets[cat.id];
    if (!budget || !budget.monthly) return;
    const spent = catSums[cat.id] || 0;
    const pct = spent / budget.monthly * 100;
    const threshold = budget.threshold || 80;

    if (pct >= 100) {
      alerts.push({ type: 'danger', msg: `🚨 You've exceeded your ${cat.label} budget! Spent ${fmt(spent)} of ${fmt(budget.monthly)}` });
    } else if (pct >= threshold) {
      alerts.push({ type: 'warn', msg: `⚠️ ${cat.label} is at ${Math.round(pct)}% of your monthly budget (${fmt(spent)} / ${fmt(budget.monthly)})` });
    }
  });

  // Income warning
  const totalSpent = Object.values(catSums).reduce((a, b) => a + b, 0);
  if (data.income && totalSpent > data.income * .9) {
    alerts.unshift({ type: 'danger', msg: `🚨 Total spending is over 90% of your monthly income!` });
  }

  alerts.slice(0, 5).forEach(a => {
    const el = document.createElement('div');
    el.className = `alert-item alert-${a.type}`;
    el.innerHTML = `<span>${a.msg}</span><button class="alert-close" onclick="this.parentElement.remove()">✕</button>`;
    container.appendChild(el);
  });
}

// ══════════════════════ CHARTS ══════════════════════

function renderBarChart(expenses) {
  const ctx = document.getElementById('bar-chart').getContext('2d');
  const catSums = sumByCategory(expenses);

  const labels = CATEGORIES.map(c => c.label);
  const values = CATEGORIES.map(c => catSums[c.id] || 0);
  const colors = CATEGORIES.map(c => c.color);

  if (charts.bar) charts.bar.destroy();

  charts.bar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.map(c => c + '99'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: '#181b23',
        borderColor: 'rgba(255,255,255,.1)',
        borderWidth: 1,
        titleColor: '#e8e9f0',
        bodyColor: '#8a8fa8',
        callbacks: { label: (c) => ' ' + fmt(c.raw) }
      }},
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#8a8fa8', font: { family: 'DM Sans', size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#8a8fa8', font: { family: 'DM Sans', size: 11 }, callback: v => fmt(v) }, beginAtZero: true }
      }
    }
  });
}

function renderDonutChart(expenses) {
  const ctx = document.getElementById('donut-chart').getContext('2d');
  const catSums = sumByCategory(expenses);
  const filled = CATEGORIES.filter(c => catSums[c.id] > 0);

  const total = Object.values(catSums).reduce((a, b) => a + b, 0);
  document.getElementById('donut-center').textContent = total ? fmt(total) : '—';

  if (charts.donut) charts.donut.destroy();

  if (!filled.length) return;

  charts.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: filled.map(c => c.label),
      datasets: [{ data: filled.map(c => catSums[c.id]), backgroundColor: filled.map(c => c.color), borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      cutout: '68%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: '#8a8fa8', font: { family: 'DM Sans', size: 11 }, padding: 12, boxWidth: 10, boxHeight: 10 }},
        tooltip: {
          backgroundColor: '#181b23',
          borderColor: 'rgba(255,255,255,.1)',
          borderWidth: 1,
          callbacks: { label: (c) => ` ${c.label}: ${fmt(c.raw)}` }
        }
      }
    }
  });
}

function setChartPeriod(period, btn) {
  state.chartPeriod = period;
  document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const expenses = getExpenses(period);
  renderBarChart(expenses);
  renderDonutChart(expenses);
}

// ══════════════════════ BUDGET PROGRESS ══════════════════════

function renderBudgetProgress(data, expenses) {
  const container = document.getElementById('budget-progress-list');
  const budgets = data.budgets || {};
  const catSums = sumByCategory(expenses);
  const entries = Object.entries(budgets).filter(([, b]) => b.monthly > 0);

  if (!entries.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">◎</div><p>No budgets set. <a href="#" onclick="navigate('budgets',null)">Set one →</a></p></div>`;
    return;
  }

  container.innerHTML = entries.map(([catId, b]) => {
    const cat = catById(catId);
    const spent = catSums[catId] || 0;
    const pct = Math.min(100, (spent / b.monthly) * 100);
    const fillColor = pct >= 100 ? '#ff5f5f' : pct >= (b.threshold || 80) ? '#ffb547' : cat.color;
    const status = pct >= 100 ? `<span class="color-danger">⚠️ Exceeded by ${fmt(spent - b.monthly)}</span>`
      : pct >= (b.threshold || 80) ? `<span class="color-warn">⚠️ ${Math.round(pct)}% used</span>`
      : `<span class="color-success">✦ ${fmt(b.monthly - spent)} remaining</span>`;

    return `<div class="budget-progress-item">
      <div class="bp-header">
        <div class="bp-name">
          <span class="cat-dot" style="background:${cat.color}"></span>
          ${cat.emoji} ${cat.label}
        </div>
        <div class="bp-amounts"><strong>${fmt(spent)}</strong> / ${fmt(b.monthly)}</div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%;background:${fillColor}"></div>
      </div>
      <div class="bp-status">${status}</div>
    </div>`;
  }).join('');
}

// ══════════════════════ RECENT TRANSACTIONS ══════════════════════

function renderRecentTransactions(data) {
  const container = document.getElementById('recent-transactions');
  const expenses = (data.expenses || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  if (!expenses.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">≋</div><p>No transactions yet. Add your first expense!</p></div>`;
    return;
  }

  container.innerHTML = expenses.map(e => txRow(e, true)).join('');
}

function txRow(e, mini = false) {
  const cat = catById(e.category);
  const date = new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `<div class="tx-row">
    <div class="tx-icon" style="background:${cat.color}22;color:${cat.color}">${cat.emoji}</div>
    <div class="tx-info">
      <div class="tx-desc">${e.desc || '—'}</div>
      <div class="tx-meta">${cat.label} • ${date}${e.notes ? ' • ' + e.notes : ''}</div>
    </div>
    <div class="tx-amount">${fmt(e.amount)}</div>
    ${mini ? '' : `<div class="tx-actions">
      <button class="action-btn" onclick="editExpense('${e.id}')">Edit</button>
      <button class="action-btn del" onclick="deleteExpense('${e.id}')">Del</button>
    </div>`}
  </div>`;
}

// ══════════════════════ TRANSACTIONS PAGE ══════════════════════

function renderTransactions() {
  populateCategorySelects();
  const data = DB.getData();
  let expenses = [...(data.expenses || [])];

  // Period filter
  const period = document.getElementById('tx-period-filter')?.value || 'month';
  if (period !== 'all') expenses = expenses.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === 'week') {
      const s = new Date(now); s.setDate(now.getDate() - now.getDay()); s.setHours(0,0,0,0);
      return d >= s;
    }
    return true;
  });

  // Category filter
  const catFilter = document.getElementById('tx-cat-filter')?.value || '';
  if (catFilter) expenses = expenses.filter(e => e.category === catFilter);

  // Search
  const q = (document.getElementById('tx-search')?.value || '').toLowerCase();
  if (q) expenses = expenses.filter(e =>
    (e.desc || '').toLowerCase().includes(q) ||
    (e.notes || '').toLowerCase().includes(q) ||
    catById(e.category).label.toLowerCase().includes(q)
  );

  // Sort
  const sort = document.getElementById('tx-sort')?.value || 'date-desc';
  expenses.sort((a, b) => {
    if (sort === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sort === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sort === 'amount-desc') return b.amount - a.amount;
    if (sort === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  // Summary bar
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const summaryBar = document.getElementById('tx-summary-bar');
  if (summaryBar) {
    summaryBar.innerHTML = `
      <div class="tx-stat"><strong>${expenses.length}</strong> transactions</div>
      <div class="tx-stat">Total: <strong>${fmt(total)}</strong></div>
      <div class="tx-stat">Average: <strong>${expenses.length ? fmt(total / expenses.length) : '—'}</strong></div>
    `;
  }

  const list = document.getElementById('transactions-list');
  if (!list) return;

  if (!expenses.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">≋</div><p>No transactions found.</p></div>`;
    return;
  }

  list.innerHTML = expenses.map(e => txRow(e, false)).join('');
}

// ══════════════════════ BUDGETS PAGE ══════════════════════

function renderBudgets() {
  const data = DB.getData();
  document.getElementById('income-display').textContent = data.income ? fmt(data.income) : 'Not set';
  if (document.getElementById('income-input')) document.getElementById('income-input').value = data.income || '';

  const budgets = data.budgets || {};
  const expenses = getExpenses('month');
  const catSums = sumByCategory(expenses);
  const grid = document.getElementById('budgets-grid');

  if (!Object.keys(budgets).length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">◎</div><p>No budgets yet. Click "+ Set Budget" to create your first one.</p></div>`;
    return;
  }

  grid.innerHTML = Object.entries(budgets).map(([catId, b]) => {
    if (!b.monthly && !b.weekly) return '';
    const cat = catById(catId);
    const spent = catSums[catId] || 0;
    const pct = b.monthly ? Math.min(100, (spent / b.monthly) * 100) : 0;
    const fillColor = pct >= 100 ? '#ff5f5f' : pct >= (b.threshold || 80) ? '#ffb547' : cat.color;

    const status = pct >= 100
      ? `<span class="color-danger">Exceeded by ${fmt(spent - b.monthly)}</span>`
      : pct >= (b.threshold || 80)
      ? `<span class="color-warn">${Math.round(pct)}% used — approach limit</span>`
      : `<span class="color-success">${fmt(b.monthly - spent)} remaining</span>`;

    return `<div class="budget-card">
      <div class="budget-card-header">
        <div class="budget-cat-info">
          <div class="budget-cat-icon">${cat.emoji}</div>
          <div>
            <div class="budget-cat-name">${cat.label}</div>
            <div class="budget-cat-sub">Alert at ${b.threshold || 80}%</div>
          </div>
        </div>
        <button class="budget-del-btn" onclick="deleteBudget('${catId}')">✕</button>
      </div>
      <div class="budget-amounts">
        <div>
          <div class="budget-spent" style="color:${fillColor}">${fmt(spent)}</div>
          <div style="font-size:11px;color:var(--text2)">spent this month</div>
        </div>
        <div class="budget-limit" style="text-align:right">
          <div>Monthly: <span>${fmt(b.monthly)}</span></div>
          ${b.weekly ? `<div>Weekly: <span>${fmt(b.weekly)}</span></div>` : ''}
        </div>
      </div>
      <div class="progress-track" style="margin:10px 0">
        <div class="progress-fill" style="width:${pct}%;background:${fillColor}"></div>
      </div>
      <div class="budget-status">${status}</div>
    </div>`;
  }).join('');
}

// ══════════════════════ ANALYTICS PAGE ══════════════════════

function renderAnalytics() {
  const expenses = getExpenses('month');

  // Line chart — daily spending
  const dailyMap = {};
  expenses.forEach(e => {
    dailyMap[e.date] = (dailyMap[e.date] || 0) + e.amount;
  });

  const now = new Date();
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: dailyMap[key] || 0 });
  }

  const lineCtx = document.getElementById('line-chart').getContext('2d');
  if (charts.line) charts.line.destroy();
  charts.line = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: days.map(d => d.label),
      datasets: [{
        data: days.map(d => d.value),
        borderColor: '#c8f066',
        backgroundColor: 'rgba(200,240,102,.08)',
        fill: true,
        tension: .4,
        pointRadius: 3,
        pointBackgroundColor: '#c8f066',
        pointBorderColor: '#0a0b0f',
        pointBorderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#181b23', borderColor: 'rgba(255,255,255,.1)', borderWidth: 1, callbacks: { label: c => ' ' + fmt(c.raw) } } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#8a8fa8', maxTicksLimit: 10, font: { family: 'DM Sans', size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#8a8fa8', callback: v => fmt(v), font: { family: 'DM Sans', size: 10 } }, beginAtZero: true }
      }
    }
  });

  // Pie chart
  const catSums = sumByCategory(expenses);
  const filled = CATEGORIES.filter(c => catSums[c.id] > 0);

  const pieCtx = document.getElementById('pie-chart').getContext('2d');
  if (charts.pie) charts.pie.destroy();

  if (filled.length) {
    charts.pie = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: filled.map(c => c.label),
        datasets: [{ data: filled.map(c => catSums[c.id]), backgroundColor: filled.map(c => c.color), borderWidth: 0, hoverOffset: 8 }]
      },
      options: {
        plugins: {
          legend: { display: true, position: 'right', labels: { color: '#8a8fa8', font: { family: 'DM Sans', size: 11 }, boxWidth: 10, boxHeight: 10 } },
          tooltip: { backgroundColor: '#181b23', borderColor: 'rgba(255,255,255,.1)', borderWidth: 1, callbacks: { label: c => ` ${c.label}: ${fmt(c.raw)}` } }
        }
      }
    });
  }

  // Comparison chart
  const data = DB.getData();
  const budgets = data.budgets || {};
  const budgetedCats = Object.entries(budgets).filter(([, b]) => b.monthly > 0);

  const compCtx = document.getElementById('comparison-chart').getContext('2d');
  if (charts.comp) charts.comp.destroy();

  if (budgetedCats.length) {
    const compLabels = budgetedCats.map(([id]) => catById(id).label);
    const compActual = budgetedCats.map(([id]) => catSums[id] || 0);
    const compBudget = budgetedCats.map(([, b]) => b.monthly);

    charts.comp = new Chart(compCtx, {
      type: 'bar',
      data: {
        labels: compLabels,
        datasets: [
          { label: 'Actual', data: compActual, backgroundColor: '#ff6b6b99', borderColor: '#ff6b6b', borderWidth: 2, borderRadius: 6 },
          { label: 'Budget', data: compBudget, backgroundColor: '#c8f06633', borderColor: '#c8f066', borderWidth: 2, borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#8a8fa8', font: { family: 'DM Sans', size: 12 }, boxWidth: 12, boxHeight: 12 } }, tooltip: { backgroundColor: '#181b23', borderColor: 'rgba(255,255,255,.1)', borderWidth: 1, callbacks: { label: c => ` ${c.dataset.label}: ${fmt(c.raw)}` } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#8a8fa8', font: { family: 'DM Sans', size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#8a8fa8', callback: v => fmt(v), font: { family: 'DM Sans', size: 11 } }, beginAtZero: true }
        }
      }
    });
  }

  // Top spending days
  const sortedDays = Object.entries(dailyMap).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const maxDay = sortedDays[0]?.[1] || 1;
  const topDaysList = document.getElementById('top-days-list');
  topDaysList.innerHTML = sortedDays.map(([date, amt]) => {
    const d = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
    return `<div class="top-day-item">
      <div class="top-day-date">${d}</div>
      <div class="top-day-bar-wrap"><div class="top-day-bar" style="width:${amt/maxDay*100}%"></div></div>
      <div class="top-day-amt">${fmt(amt)}</div>
    </div>`;
  }).join('') || '<p style="color:var(--text3);font-size:13px">No data yet.</p>';
}

// ══════════════════════ EXPENSE CRUD ══════════════════════

function buildCategoryPicker() {
  const picker = document.getElementById('category-picker');
  if (!picker) return;
  picker.innerHTML = CATEGORIES.map(c => `
    <button type="button" class="cat-btn" data-cat="${c.id}" onclick="selectCategory('${c.id}')">
      <span class="cat-emoji">${c.emoji}</span>${c.label}
    </button>
  `).join('');
}

function selectCategory(id) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
  const btn = document.querySelector(`.cat-btn[data-cat="${id}"]`);
  if (btn) btn.classList.add('selected');
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  if (id === 'add-expense-modal') {
    document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
    if (!document.getElementById('edit-expense-id').value) {
      document.getElementById('expense-modal-title').textContent = 'Add Expense';
      document.getElementById('exp-desc').value = '';
      document.getElementById('exp-amount').value = '';
      document.getElementById('exp-notes').value = '';
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
    }
    document.getElementById('exp-error').textContent = '';
  }
  if (id === 'set-income-modal') {
    const data = DB.getData();
    document.getElementById('income-input').value = data.income || '';
  }
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  if (id === 'add-expense-modal') {
    document.getElementById('edit-expense-id').value = '';
    document.getElementById('expense-modal-title').textContent = 'Add Expense';
  }
}

function saveExpense() {
  const desc = document.getElementById('exp-desc').value.trim();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const date = document.getElementById('exp-date').value;
  const notes = document.getElementById('exp-notes').value.trim();
  const selectedCat = document.querySelector('.cat-btn.selected');
  const category = selectedCat?.dataset.cat || '';
  const err = document.getElementById('exp-error');

  if (!desc) { err.textContent = 'Please enter a description.'; return; }
  if (!amount || amount <= 0) { err.textContent = 'Please enter a valid amount.'; return; }
  if (!date) { err.textContent = 'Please select a date.'; return; }
  if (!category) { err.textContent = 'Please select a category.'; return; }

  err.textContent = '';
  const data = DB.getData();
  const editId = document.getElementById('edit-expense-id').value;

  if (editId) {
    const idx = data.expenses.findIndex(e => e.id === editId);
    if (idx !== -1) data.expenses[idx] = { ...data.expenses[idx], desc, amount, date, category, notes };
    toast('Expense updated ✓', 'success');
  } else {
    data.expenses.unshift({ id: uid(), desc, amount, date, category, notes });
    toast('Expense added ✓', 'success');
    checkBudgetOnAdd(data, category, amount);
  }

  DB.saveData(data);
  closeModal('add-expense-modal');

  if (state.currentPage === 'dashboard') renderDashboard();
  else if (state.currentPage === 'transactions') renderTransactions();
  else if (state.currentPage === 'budgets') renderBudgets();
}

function checkBudgetOnAdd(data, category, amount) {
  const budget = (data.budgets || {})[category];
  if (!budget?.monthly) return;
  const expenses = getExpenses('month');
  const catSpent = expenses.filter(e => e.category === category).reduce((s, e) => s + e.amount, 0) + amount;
  const pct = catSpent / budget.monthly * 100;
  const threshold = budget.threshold || 80;
  const cat = catById(category);

  if (pct >= 100) toast(`🚨 ${cat.label} budget exceeded!`, 'error');
  else if (pct >= threshold) toast(`⚠️ ${cat.label} is at ${Math.round(pct)}% of budget`, 'warn');
}

function editExpense(id) {
  const data = DB.getData();
  const e = data.expenses.find(x => x.id === id);
  if (!e) return;

  document.getElementById('edit-expense-id').value = id;
  document.getElementById('expense-modal-title').textContent = 'Edit Expense';
  document.getElementById('exp-desc').value = e.desc;
  document.getElementById('exp-amount').value = e.amount;
  document.getElementById('exp-date').value = e.date;
  document.getElementById('exp-notes').value = e.notes || '';

  openModal('add-expense-modal');
  setTimeout(() => selectCategory(e.category), 10);
}

function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  const data = DB.getData();
  data.expenses = data.expenses.filter(e => e.id !== id);
  DB.saveData(data);
  toast('Expense deleted', 'success');
  if (state.currentPage === 'dashboard') renderDashboard();
  else if (state.currentPage === 'transactions') renderTransactions();
  else if (state.currentPage === 'budgets') renderBudgets();
}

// ══════════════════════ BUDGET CRUD ══════════════════════

function populateCategorySelects() {
  const budgetSel = document.getElementById('budget-cat');
  const txSel = document.getElementById('tx-cat-filter');

  if (budgetSel) {
    const data = DB.getData();
    const existing = Object.keys(data.budgets || {});
    budgetSel.innerHTML = '<option value="">Choose category…</option>' +
      CATEGORIES.map(c => `<option value="${c.id}" ${existing.includes(c.id) ? '(set)' : ''}>${c.emoji} ${c.label}${existing.includes(c.id) ? ' ✓' : ''}</option>`).join('');
  }

  if (txSel) {
    txSel.innerHTML = '<option value="">All Categories</option>' +
      CATEGORIES.map(c => `<option value="${c.id}">${c.emoji} ${c.label}</option>`).join('');
  }
}

function saveBudget() {
  const catId = document.getElementById('budget-cat').value;
  const monthly = parseFloat(document.getElementById('budget-monthly').value) || 0;
  const weekly = parseFloat(document.getElementById('budget-weekly').value) || 0;
  const threshold = parseInt(document.getElementById('budget-threshold').value) || 80;
  const err = document.getElementById('budget-error');

  if (!catId) { err.textContent = 'Please select a category.'; return; }
  if (!monthly && !weekly) { err.textContent = 'Set at least one limit.'; return; }

  err.textContent = '';
  const data = DB.getData();
  data.budgets = data.budgets || {};
  data.budgets[catId] = { monthly, weekly, threshold };
  DB.saveData(data);

  toast(`${catById(catId).label} budget saved ✓`, 'success');
  closeModal('set-budget-modal');
  renderBudgets();
  populateCategorySelects();
}

function deleteBudget(catId) {
  if (!confirm(`Remove ${catById(catId).label} budget?`)) return;
  const data = DB.getData();
  delete data.budgets[catId];
  DB.saveData(data);
  toast('Budget removed', 'success');
  renderBudgets();
}

function saveIncome() {
  const income = parseFloat(document.getElementById('income-input').value) || 0;
  const data = DB.getData();
  data.income = income;
  DB.saveData(data);
  toast('Income updated ✓', 'success');
  closeModal('set-income-modal');
  renderBudgets();
  if (state.currentPage === 'dashboard') renderDashboard();
}

// ══════════════════════ MOBILE SIDEBAR ══════════════════════

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('hidden');
}

function closeSidebarMobile() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.add('hidden');
}

// ══════════════════════ TOAST ══════════════════════

function toast(msg, type = 'success') {
  const icons = { success: '✓', error: '⚠', warn: '◉' };
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span> ${msg}`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ══════════════════════ INIT ══════════════════════

document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
        document.getElementById('edit-expense-id').value = '';
        document.getElementById('expense-modal-title').textContent = 'Add Expense';
      }
    });
  });

  // ESC to close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
    }
  });
});