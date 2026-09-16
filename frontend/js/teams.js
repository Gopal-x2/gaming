/**
 * TEAMS & INVITATION SYSTEM JS
 */

// Create Team
async function handleCreateTeam(event) {
  event.preventDefault();
  const name = document.getElementById('teamName').value.trim();
  const game = document.getElementById('gameSelect').value;
  const logo = document.getElementById('teamLogo').value.trim();
  const contactPhone = document.getElementById('contactPhone').value.trim();
  const captainInGameId = document.getElementById('captainInGameId').value.trim();

  try {
    const data = await apiRequest('/teams', 'POST', {
      name,
      game,
      logo,
      contactPhone,
      captainInGameId,
    });

    showToast('Team created successfully!');
    setTimeout(() => (window.location.href = `/team-details.html?id=${data.team._id}`), 1000);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Load My Teams
async function loadMyTeams() {
  const container = document.getElementById('my-teams-container');
  if (!container) return;

  try {
    const data = await apiRequest('/teams/my', 'GET', null, true);
    const teams = data.teams;

    if (teams.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fas fa-users-slash fa-3x text-muted mb-3"></i>
          <h4 class="text-muted">No Teams Found</h4>
          <p class="text-dim mb-4">You haven't created or joined any teams yet.</p>
          <a href="/create-team.html" class="btn-neon"><i class="fas fa-plus me-1"></i> Create a Team</a>
        </div>
      `;
      return;
    }

    container.innerHTML = teams
      .map((t) => {
        const currentUser = getUser();
        const isCaptain = t.captain._id === currentUser.id;

        return `
          <div class="col-md-6 mb-4">
            <div class="card-glass">
              <div class="d-flex align-items-center gap-3 mb-3">
                <img src="${t.logo}" class="rounded-circle" width="55" height="55" style="object-fit:cover;">
                <div>
                  <h3 class="mb-0 text-light">${t.name} ${isCaptain ? '<span class="badge bg-warning text-dark ms-2">CAPTAIN</span>' : ''}</h3>
                  <span class="badge bg-dark border border-secondary text-success">${t.game}</span>
                </div>
              </div>
              <div class="p-2 rounded bg-dark border border-secondary mb-3">
                <div class="d-flex justify-content-between text-muted text-uppercase fs-7">
                  <span>Captain</span>
                  <span>Members</span>
                </div>
                <div class="d-flex justify-content-between text-light fw-bold">
                  <span>${t.captain.name}</span>
                  <span>${t.members.length} Players</span>
                </div>
              </div>
              <a href="/team-details.html?id=${t._id}" class="btn-outline-neon w-100 justify-content-center">
                Manage Team <i class="fas fa-arrow-right ms-1"></i>
              </a>
            </div>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Load Team Details & Invite Search
async function loadTeamDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('id');
  if (!teamId) return (window.location.href = '/my-teams.html');

  try {
    const data = await apiRequest(`/teams/${teamId}`, 'GET', null, true);
    const team = data.team;
    const currentUser = getUser();
    const isCaptain = team.captain._id === currentUser.id;

    document.getElementById('team-title').textContent = team.name;
    document.getElementById('team-game').textContent = team.game;
    document.getElementById('team-logo').src = team.logo;
    document.getElementById('captain-name').textContent = team.captain.name;
    document.getElementById('member-count').textContent = team.members.length;

    // Show/Hide Invite & Edit Buttons for Captain
    const inviteSection = document.getElementById('captain-invite-section');
    if (inviteSection) {
      if (isCaptain) {
        inviteSection.classList.remove('d-none');
        // Pre-fill edit modal inputs
        if (document.getElementById('edit-team-name')) document.getElementById('edit-team-name').value = team.name;
        if (document.getElementById('edit-team-game')) document.getElementById('edit-team-game').value = team.game;
        if (document.getElementById('edit-team-logo')) document.getElementById('edit-team-logo').value = team.logo;
        if (document.getElementById('edit-team-phone')) document.getElementById('edit-team-phone').value = team.contactPhone || '';
      } else {
        inviteSection.classList.add('d-none');
      }
    }

    // Render Members
    const membersContainer = document.getElementById('team-members-list');
    membersContainer.innerHTML = team.members
      .map(
        (m) => `
        <div class="col-md-6 mb-3">
          <div class="d-flex align-items-center justify-content-between p-3 rounded bg-dark border border-secondary">
            <div class="d-flex align-items-center gap-3">
              <img src="${m.user ? m.user.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&auto=format&fit=crop&q=80' : ''}" class="rounded-circle" width="45" height="45">
              <div>
                <h6 class="mb-0 text-light fw-bold">${m.user ? m.user.name : 'User'} (@${m.user ? m.user.username : ''}) ${m.user && m.user._id === team.captain._id ? '<i class="fas fa-crown text-warning ms-1" title="Captain"></i>' : ''}</h6>
                <small class="text-muted">In-Game ID: ${m.inGameId || 'N/A'}</small>
              </div>
            </div>
            ${
              isCaptain && m.user && m.user._id !== team.captain._id
                ? `<button class="btn btn-sm btn-outline-danger" onclick="removeTeamMember('${team._id}', '${m.user._id}')" title="Remove Member"><i class="fas fa-user-minus"></i></button>`
                : ''
            }
          </div>
        </div>
      `
      )
      .join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Update Team (Captain Only)
async function handleUpdateTeam(event) {
  event.preventDefault();
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('id');

  const name = document.getElementById('edit-team-name').value.trim();
  const game = document.getElementById('edit-team-game').value;
  const logo = document.getElementById('edit-team-logo').value.trim();
  const contactPhone = document.getElementById('edit-team-phone').value.trim();

  try {
    const data = await apiRequest(`/teams/${teamId}`, 'PUT', {
      name,
      game,
      logo,
      contactPhone,
    });

    showToast('Team updated successfully!');
    const modalEl = document.getElementById('editTeamModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Remove Team Member (Captain Only)
async function removeTeamMember(teamId, userId) {
  if (!confirm('Are you sure you want to remove this player from your squad?')) return;

  try {
    const data = await apiRequest(`/teams/${teamId}/members/${userId}`, 'DELETE');
    showToast(data.message);
    loadTeamDetails();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// User Search & Invitation Sending
let searchTimeout = null;
function searchUsersForInvite() {
  clearTimeout(searchTimeout);
  const query = document.getElementById('user-search-input').value.trim();
  const resultsContainer = document.getElementById('user-search-results');

  if (query.length < 2) {
    resultsContainer.innerHTML = '';
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      const data = await apiRequest(`/users/search?q=${encodeURIComponent(query)}`, 'GET', null, true);
      const users = data.users;

      if (users.length === 0) {
        resultsContainer.innerHTML = `<div class="p-2 text-muted">No users found.</div>`;
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const teamId = urlParams.get('id');

      resultsContainer.innerHTML = users
        .map(
          (u) => `
          <div class="d-flex justify-content-between align-items-center p-2 rounded bg-secondary mb-2">
            <div class="d-flex align-items-center gap-2">
              <img src="${u.avatar}" class="rounded-circle" width="30" height="30">
              <span class="text-light fw-bold">${u.name} (@${u.username})</span>
            </div>
            <button class="btn btn-sm btn-neon" onclick="sendInvite('${teamId}', '${u._id}')">
              Invite <i class="fas fa-paper-plane ms-1"></i>
            </button>
          </div>
        `
        )
        .join('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, 300);
}

async function sendInvite(teamId, inviteeId) {
  try {
    const data = await apiRequest(`/teams/${teamId}/invite`, 'POST', { inviteeId });
    showToast(data.message);
    document.getElementById('user-search-results').innerHTML = '';
    document.getElementById('user-search-input').value = '';
  } catch (error) {
    showToast(error.message, 'error');
  }
}
