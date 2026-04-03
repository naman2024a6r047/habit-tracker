// ===== api.js — All API calls centralised =====

const API_BASE = window.ENV_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('ht_token');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// Auth
const Auth = {
  signup: (name, email, password) => request('POST', '/auth/signup', { name, email, password }),
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),
};

// Habits
const Habits = {
  list: () => request('GET', '/habits'),
  create: (data) => request('POST', '/habits', data),
  update: (id, data) => request('PUT', `/habits/${id}`, data),
  delete: (id) => request('DELETE', `/habits/${id}`),
  toggle: (id, date) => request('POST', `/habits/${id}/toggle`, { date }),
  analytics: () => request('GET', '/habits/analytics/summary'),
};

// Expenses
const Expenses = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/expenses${q ? '?' + q : ''}`);
  },
  create: (data) => request('POST', '/expenses', data),
  update: (id, data) => request('PUT', `/expenses/${id}`, data),
  delete: (id) => request('DELETE', `/expenses/${id}`),
  analytics: () => request('GET', '/expenses/analytics/summary'),
};

window.API = { Auth, Habits, Expenses };