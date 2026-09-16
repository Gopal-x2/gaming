/**
 * NEXUS ESPORTS - CENTRAL API FETCH WRAPPER & TOAST ENGINE
 */

const API_BASE_URL = '/api';

// Toast Notification Utility
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#fff;cursor:pointer;margin-left:10px;"><i class="fas fa-times"></i></button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4000);
}

// Token Storage Helpers
function getToken() {
  return localStorage.getItem('nexus_token');
}

function getUser() {
  const user = localStorage.getItem('nexus_user');
  return user ? JSON.parse(user) : null;
}

function setAuth(token, user) {
  localStorage.setItem('nexus_token', token);
  localStorage.setItem('nexus_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('nexus_token');
  localStorage.removeItem('nexus_user');
}

// API Fetch Helper
async function apiRequest(endpoint, method = 'GET', body = null, requireAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && requireAuth) {
        clearAuth();
        if (!window.location.pathname.includes('login.html')) {
          showToast('Session expired. Please log in again.', 'error');
          setTimeout(() => (window.location.href = '/login.html'), 1500);
        }
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`[API Error ${endpoint}]:`, error.message);
    throw error;
  }
}

// Update Navbar Authentication UI
function updateNavbar() {
  const user = getUser();
  const authNav = document.getElementById('auth-nav');
  if (!authNav) return;

  if (user) {
    let adminLink = user.role === 'ADMIN' ? `<li class="nav-item"><a class="nav-link text-warning" href="/admin/dashboard.html"><i class="fas fa-user-shield me-1"></i> Admin</a></li>` : '';
    
    authNav.innerHTML = `
      <li class="nav-item">
        <a class="nav-link position-relative" href="/notifications.html" title="Notifications">
          <i class="fas fa-bell"></i>
          <span id="unread-count-badge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none" style="font-size:0.65rem;">0</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/my-tournaments.html"><i class="fas fa-trophy me-1"></i> My Tournaments</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/my-teams.html"><i class="fas fa-users me-1"></i> My Teams</a>
      </li>
      ${adminLink}
      <li class="nav-item dropdown ms-1">
        <a class="nav-link dropdown-toggle text-white d-flex align-items-center gap-1 py-1" href="#" role="button" data-bs-toggle="dropdown">
          <img src="${user.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&auto=format&fit=crop&q=80'}" class="rounded-circle" width="24" height="24" style="object-fit:cover;">
          <span style="font-size:0.82rem;">${user.name}</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
          <li><a class="dropdown-item" href="/profile.html"><i class="fas fa-user-circle me-2"></i> Profile</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" onclick="logoutUser()"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
        </ul>
      </li>
    `;
    
    fetchUnreadCount();
  } else {
    authNav.innerHTML = `
      <li class="nav-item"><a class="nav-link" href="/login.html">Login</a></li>
      <li class="nav-item"><a class="btn-neon ms-2" href="/register.html">Register</a></li>
    `;
  }
}

async function fetchUnreadCount() {
  try {
    const data = await apiRequest('/notifications', 'GET', null, true);
    const badge = document.getElementById('unread-count-badge');
    if (badge && data.unreadCount > 0) {
      badge.textContent = data.unreadCount;
      badge.classList.remove('d-none');
    }
  } catch (err) {
    // Ignore silent error
  }
}

function logoutUser() {
  clearAuth();
  showToast('Logged out successfully');
  setTimeout(() => (window.location.href = '/index.html'), 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
});
