/**
 * ADMIN DASHBOARD & MANAGEMENT JS
 */

// Verify Admin Role on Page Load
function checkAdminAccess() {
  const user = getUser();
  if (!user || user.role !== 'ADMIN') {
    showToast('Unauthorized access. Admin privileges required.', 'error');
    setTimeout(() => (window.location.href = '/index.html'), 1500);
  }
}

// Load Admin Dashboard Overview Stats & Chart.js
async function loadAdminStats() {
  checkAdminAccess();
  try {
    const data = await apiRequest('/admin/dashboard-stats', 'GET', null, true);
    const s = data.stats;

    if (document.getElementById('stat-users')) document.getElementById('stat-users').textContent = s.totalUsers;
    if (document.getElementById('stat-teams')) document.getElementById('stat-teams').textContent = s.totalTeams;
    if (document.getElementById('stat-active-tournaments')) document.getElementById('stat-active-tournaments').textContent = s.activeTournaments;
    if (document.getElementById('stat-completed-tournaments')) document.getElementById('stat-completed-tournaments').textContent = s.completedTournaments;
    if (document.getElementById('stat-registrations')) document.getElementById('stat-registrations').textContent = s.totalRegistrations;
    if (document.getElementById('stat-revenue')) document.getElementById('stat-revenue').textContent = `₹${s.totalRevenue.toLocaleString()}`;

    // Render Chart.js
    const chartCanvas = document.getElementById('revenueChart');
    if (chartCanvas && window.Chart) {
      const ctx = chartCanvas.getContext('2d');
      new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
            {
              label: 'Registrations',
              data: [5, 12, 18, 25, 30, 42, 55, 70, 88, 102, 120, 150],
              borderColor: '#00ff88',
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: '#f0f4f8' } },
          },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          },
        },
      });
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function updateCalculatedTotalFee() {
  const teamSize = parseInt(document.getElementById('t-teamSize')?.value || 4);
  const feePerPlayer = parseFloat(document.getElementById('t-feePerPlayer')?.value || 50);
  const total = teamSize * feePerPlayer;
  const badge = document.getElementById('calculated-total-fee-badge');
  if (badge) {
    badge.textContent = `${teamSize} Players × ₹${feePerPlayer} = ₹${total} / Squad`;
  }
}

// Create Tournament (Admin)
async function handleCreateTournament(event) {
  event.preventDefault();
  const title = document.getElementById('t-title').value.trim();
  const game = document.getElementById('t-game').value;
  const banner = document.getElementById('t-banner').value.trim(); // Base64 string from hidden input
  const format = document.getElementById('t-format').value;
  const teamSize = parseInt(document.getElementById('t-teamSize').value);
  const feePerPlayer = parseFloat(document.getElementById('t-feePerPlayer').value);
  const maxTeams = parseInt(document.getElementById('t-maxTeams').value);
  const prizePool = parseFloat(document.getElementById('t-prizePool').value);
  const registrationDeadline = document.getElementById('t-deadline').value;
  const startDate = document.getElementById('t-startDate').value;
  const description = document.getElementById('t-description').value.trim();
  const rules = document.getElementById('t-rules').value.trim();

  try {
    await apiRequest('/admin/tournaments', 'POST', {
      title,
      game,
      banner,
      format,
      teamSize,
      entryFeePerPlayer: feePerPlayer,
      feeType: 'PER_PLAYER',
      maxTeams,
      prizePool,
      registrationDeadline,
      startDate,
      description,
      rules,
    });

    showToast('Tournament created successfully!');
    setTimeout(() => (window.location.href = '/admin/tournaments.html'), 1200);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Load All Tournaments for Admin Management Table
async function loadAdminTournaments() {
  checkAdminAccess();
  const tbody = document.getElementById('admin-tournaments-tbody');
  if (!tbody) return;

  try {
    const data = await apiRequest('/tournaments?status=', 'GET', null, false);
    const tournaments = data.tournaments;

    tbody.innerHTML = tournaments
      .map(
        (t) => `
        <tr>
          <td class="fw-bold text-light">${t.title}</td>
          <td><span class="badge bg-dark border border-secondary text-success">${t.game}</span></td>
          <td>${t.entryFee === 0 ? 'FREE' : '₹' + t.entryFee}</td>
          <td class="text-warning">₹${t.prizePool}</td>
          <td>${t.registeredTeamsCount}/${t.maxTeams}</td>
          <td>
            <select class="form-select form-select-sm bg-dark text-light" onchange="updateTournamentStatus('${t._id}', this.value)">
              <option value="DRAFT" ${t.status === 'DRAFT' ? 'selected' : ''}>DRAFT</option>
              <option value="REGISTRATION_OPEN" ${t.status === 'REGISTRATION_OPEN' ? 'selected' : ''}>REGISTRATION OPEN</option>
              <option value="REGISTRATION_CLOSED" ${t.status === 'REGISTRATION_CLOSED' ? 'selected' : ''}>REGISTRATION CLOSED</option>
              <option value="UPCOMING" ${t.status === 'UPCOMING' ? 'selected' : ''}>UPCOMING</option>
              <option value="LIVE" ${t.status === 'LIVE' ? 'selected' : ''}>LIVE</option>
              <option value="COMPLETED" ${t.status === 'COMPLETED' ? 'selected' : ''}>COMPLETED</option>
              <option value="CANCELLED" ${t.status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
            </select>
          </td>
          <td>
            <div class="d-flex gap-1">
              <button class="btn btn-sm btn-outline-warning" onclick="cancelTournament('${t._id}')" title="Mark Status as Cancelled">
                <i class="fas fa-ban"></i> Cancel
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="permanentlyDeleteTournament('${t._id}', '${t.title.replace(/'/g, "\\'")}')" title="Permanently Delete Tournament">
                <i class="fas fa-trash-alt"></i> Delete
              </button>
            </div>
          </td>
        </tr>
      `
      )
      .join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function updateTournamentStatus(id, newStatus) {
  try {
    await apiRequest(`/admin/tournaments/${id}`, 'PUT', { status: newStatus });
    showToast(`Status updated to ${newStatus}`);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function cancelTournament(id) {
  if (!confirm('Are you sure you want to mark this tournament status as CANCELLED?')) return;
  try {
    await apiRequest(`/admin/tournaments/${id}`, 'DELETE');
    showToast('Tournament status updated to CANCELLED');
    loadAdminTournaments();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function permanentlyDeleteTournament(id, title) {
  if (!confirm(`⚠️ PERMANENT DELETE WARNING:\n\nAre you sure you want to PERMANENTLY DELETE "${title}"?\n\nThis will permanently erase the tournament along with all registered teams, matches, and leaderboard records!`)) return;

  try {
    const res = await apiRequest(`/admin/tournaments/${id}/permanent`, 'DELETE');
    showToast(res.message || 'Tournament permanently deleted!');
    loadAdminTournaments();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Load Admin Matches & Publish Room Credentials
async function loadAdminMatches() {
  checkAdminAccess();
  const tbody = document.getElementById('admin-matches-tbody');
  if (!tbody) return;

  try {
    const data = await apiRequest('/matches', 'GET', null, true);
    const matches = data.matches;

    tbody.innerHTML = matches
      .map(
        (m) => `
        <tr>
          <td>Match #${m.matchNumber}</td>
          <td class="fw-bold text-light">${m.tournament ? m.tournament.title : ''}</td>
          <td>${m.roundName}</td>
          <td>${new Date(m.matchTime).toLocaleString()}</td>
          <td>
            <input type="text" class="form-control form-control-sm bg-dark text-light" id="room-${m._id}" value="${m.roomId || ''}" placeholder="Room ID">
          </td>
          <td>
            <input type="text" class="form-control form-control-sm bg-dark text-light" id="pass-${m._id}" value="${m.roomPassword || ''}" placeholder="Password">
          </td>
          <td>
            <button class="btn btn-sm ${m.isPublished ? 'btn-success' : 'btn-neon'}" onclick="publishRoomCredentials('${m._id}')">
              ${m.isPublished ? '<i class="fas fa-check"></i> Published' : '<i class="fas fa-paper-plane"></i> Publish'}
            </button>
          </td>
        </tr>
      `
      )
      .join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function publishRoomCredentials(matchId) {
  const roomId = document.getElementById(`room-${matchId}`).value.trim();
  const roomPassword = document.getElementById(`pass-${matchId}`).value.trim();

  if (!roomId || !roomPassword) {
    return showToast('Please enter both Room ID and Password before publishing', 'warning');
  }

  try {
    const res = await apiRequest(`/admin/matches/${matchId}`, 'PUT', {
      roomId,
      roomPassword,
      isPublished: true,
    });

    showToast('Room Credentials Published & Notifications sent to players!');
    
    // Display broadcast modal
    if (res.broadcastText && document.getElementById('broadcast-textarea')) {
      document.getElementById('broadcast-textarea').value = res.broadcastText;
      const modalEl = document.getElementById('shareBroadcastModal');
      if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
      }
    }

    loadAdminMatches();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Load Admin Users List & Status Management
async function loadAdminUsers() {
  checkAdminAccess();
  const tbody = document.getElementById('admin-users-tbody');
  if (!tbody) return;

  try {
    const data = await apiRequest('/admin/users', 'GET', null, true);
    const users = data.users;

    tbody.innerHTML = users
      .map(
        (u) => `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              <img src="${u.avatar}" class="rounded-circle" width="35" height="35">
              <span class="fw-bold text-light">${u.name}</span>
            </div>
          </td>
          <td>@${u.username}</td>
          <td>${u.email}</td>
          <td>${u.phone}</td>
          <td><span class="badge ${u.role === 'ADMIN' ? 'bg-warning text-dark' : 'bg-secondary'}">${u.role}</span></td>
          <td><span class="badge ${u.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}">${u.status}</span></td>
          <td>
            <button class="btn btn-sm btn-outline-warning me-1" onclick="toggleUserStatus('${u._id}', '${u.status}')">
              ${u.status === 'ACTIVE' ? 'Block' : 'Unblock'}
            </button>
            <button class="btn btn-sm btn-outline-info" onclick="toggleUserRole('${u._id}', '${u.role}')">
              Make ${u.role === 'ADMIN' ? 'User' : 'Admin'}
            </button>
          </td>
        </tr>
      `
      )
      .join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function toggleUserStatus(id, currentStatus) {
  const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
  try {
    await apiRequest(`/admin/users/${id}/status`, 'PUT', { status: newStatus });
    showToast(`User status updated to ${newStatus}`);
    loadAdminUsers();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function toggleUserRole(id, currentRole) {
  const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
  try {
    await apiRequest(`/admin/users/${id}/status`, 'PUT', { role: newRole });
    showToast(`User role updated to ${newRole}`);
    loadAdminUsers();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Load Admin Payments Table
async function loadAdminPayments() {
  checkAdminAccess();
  const tbody = document.getElementById('admin-payments-tbody');
  if (!tbody) return;

  try {
    const data = await apiRequest('/admin/payments', 'GET', null, true);
    const payments = data.payments;

    tbody.innerHTML = payments
      .map(
        (p) => `
        <tr>
          <td><code>${p.utrNumber || 'N/A'}</code></td>
          <td class="fw-bold text-light">${p.user ? p.user.name : 'Unknown User'}</td>
          <td>${p.tournament ? p.tournament.title : ''}</td>
          <td>${p.team ? p.team.name : ''}</td>
          <td class="text-warning fw-bold">₹${p.amount}</td>
          <td><span class="badge ${p.status === 'SUCCESS' ? 'bg-success' : p.status === 'PENDING' ? 'bg-warning text-dark' : 'bg-danger'}">${p.status}</span></td>
          <td>${new Date(p.createdAt).toLocaleString()}</td>
          <td>
            ${p.status === 'PENDING' ? `
              <button class="btn btn-sm btn-success me-1" onclick="verifyPaymentAdmin('${p._id}', 'SUCCESS')">Approve</button>
              <button class="btn btn-sm btn-danger" onclick="verifyPaymentAdmin('${p._id}', 'FAILED')">Reject</button>
            ` : ''}
          </td>
        </tr>
      `
      )
      .join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function verifyPaymentAdmin(paymentId, status) {
  if (!confirm(`Are you sure you want to mark this payment as ${status}?`)) return;
  try {
    await apiRequest(`/admin/payments/${paymentId}/verify`, 'PUT', { status });
    showToast(`Payment marked as ${status}`);
    loadAdminPayments();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Handle Banner Image Upload & Preview in Base64
const bannerFileInput = document.getElementById('t-banner-file');
if (bannerFileInput) {
  bannerFileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    // Check size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be less than 2MB', 'error');
      this.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      const base64String = event.target.result;
      document.getElementById('t-banner').value = base64String;
      
      // Show Preview
      const previewContainer = document.getElementById('banner-preview-container');
      const previewImg = document.getElementById('banner-preview');
      if (previewContainer && previewImg) {
        previewImg.src = base64String;
        previewContainer.classList.remove('d-none');
      }
    };
    reader.readAsDataURL(file);
  });
}
