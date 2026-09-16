/**
 * TOURNAMENTS MANAGEMENT JS
 */

// Load Tournaments List (For tournaments.html or index.html)
async function loadTournamentsList(isFeatured = false) {
  const container = document.getElementById('tournaments-container');
  if (!container) return;

  const search = document.getElementById('search-input')?.value || '';
  const game = document.getElementById('game-filter')?.value || '';
  const format = document.getElementById('format-filter')?.value || '';
  const sortBy = document.getElementById('sort-filter')?.value || '';

  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="text-muted mt-2">Loading Tournaments...</p>
    </div>
  `;

  try {
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (game) queryParams.append('game', game);
    if (format) queryParams.append('format', format);
    if (sortBy) queryParams.append('sortBy', sortBy);

    const data = await apiRequest(`/tournaments?${queryParams.toString()}`, 'GET', null, false);
    let tournaments = data.tournaments;

    if (isFeatured) {
      tournaments = tournaments.slice(0, 3);
    }

    if (tournaments.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fas fa-trophy fa-3x text-muted mb-3"></i>
          <h4 class="text-muted">No Tournaments Found</h4>
          <p class="text-dim">Try adjusting your search or filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = tournaments
      .map((t) => {
        const status = t.status || 'REGISTRATION_OPEN';
        let badgeClass = 'badge-open';
        let statusText = status.replace('_', ' ');

        if (status === 'REGISTRATION_CLOSED') badgeClass = 'badge-closed';
        if (status === 'UPCOMING') badgeClass = 'badge-upcoming';
        if (status === 'LIVE') badgeClass = 'badge-live';
        if (status === 'COMPLETED') badgeClass = 'badge-completed';

        const feePerPlayer = t.entryFeePerPlayer !== undefined ? t.entryFeePerPlayer : 50;
        const totalFee = t.entryFee !== undefined ? t.entryFee : ((t.teamSize || 4) * feePerPlayer);
        const feeDisplay = totalFee === 0 ? 'FREE' : `₹${feePerPlayer}/Player (₹${totalFee})`;
        const prizePoolStr = (t.prizePool || 0).toLocaleString();
        const gameStr = t.game || 'Esports';
        const titleStr = t.title || 'Tournament';
        const bannerStr = t.banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80';
        const formatStr = t.format || 'Squad';
        const teamSizeVal = t.teamSize || 4;
        const regCount = t.registeredTeamsCount !== undefined ? t.registeredTeamsCount : 0;
        const maxTeamsVal = t.maxTeams || 16;
        const deadlineStr = t.registrationDeadline || '';

        return `
          <div class="col-lg-4 col-md-6 mb-4">
            <div class="card-glass tournament-card">
              <img src="${bannerStr}" class="tournament-banner-img" alt="${titleStr}">
              <div class="tournament-card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge bg-dark border border-secondary text-success">${gameStr}</span>
                  <span class="badge-status ${badgeClass}">${statusText}</span>
                </div>
                <h3 class="tournament-title">${titleStr}</h3>
                <div class="tournament-meta">
                  <div class="tournament-meta-item">
                    <span class="meta-label">Entry Fee Rate</span>
                    <span class="meta-val">${feeDisplay}</span>
                  </div>
                  <div class="tournament-meta-item">
                    <span class="meta-label">Prize Pool</span>
                    <span class="meta-val text-warning">₹${prizePoolStr}</span>
                  </div>
                  <div class="tournament-meta-item">
                    <span class="meta-label">Format</span>
                    <span class="text-light fw-bold">${formatStr} (${teamSizeVal}P)</span>
                  </div>
                  <div class="tournament-meta-item">
                    <span class="meta-label">Slots</span>
                    <span class="text-light fw-bold">${regCount}/${maxTeamsVal}</span>
                  </div>
                </div>
                
                <div class="mt-auto">
                  <a href="/tournament-details.html?id=${t._id}" class="btn-outline-neon w-100 justify-content-center">
                    View Details <i class="fas fa-arrow-right ms-1"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error loading tournaments: ${error.message}</div>`;
  }
}

// Load Single Tournament Detail (For tournament-details.html)
async function loadTournamentDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) return (window.location.href = '/tournaments.html');

  try {
    const data = await apiRequest(`/tournaments/${id}`, 'GET', null, false);
    const t = data.tournament;
    const teams = data.registeredTeams;

    const feePerPlayer = t.entryFeePerPlayer !== undefined ? t.entryFeePerPlayer : 50;
    const totalFee = t.entryFee || (t.teamSize * feePerPlayer);
    const feeText = totalFee === 0 ? 'FREE' : `₹${feePerPlayer} / Player (Total ₹${totalFee} for ${t.teamSize} Players)`;

    document.getElementById('t-title').textContent = t.title;
    document.getElementById('t-game').textContent = t.game;
    document.getElementById('t-banner').src = t.banner;
    document.getElementById('t-entry').textContent = feeText;
    document.getElementById('t-prize').textContent = `₹${t.prizePool.toLocaleString()}`;
    document.getElementById('t-format').textContent = `${t.format} (${t.teamSize} Players)`;
    document.getElementById('t-slots').textContent = `${t.registeredTeamsCount} / ${t.maxTeams} (${t.slotsLeft} slots left)`;
    document.getElementById('t-deadline').textContent = new Date(t.registrationDeadline).toLocaleString();
    document.getElementById('t-start').textContent = new Date(t.startDate).toLocaleString();
    document.getElementById('t-organizer').textContent = t.organizer;
    document.getElementById('t-description').textContent = t.description;
    document.getElementById('t-rules').innerHTML = t.rules.replace(/\n/g, '<br>');

    // Status Badge
    const badgeEl = document.getElementById('t-status-badge');
    badgeEl.textContent = t.status.replace('_', ' ');
    if (t.status === 'REGISTRATION_OPEN') badgeEl.className = 'badge-status badge-open';
    else if (t.status === 'REGISTRATION_CLOSED') badgeEl.className = 'badge-status badge-closed';
    else if (t.status === 'LIVE') badgeEl.className = 'badge-status badge-live';

    // Register Button
    const btnContainer = document.getElementById('register-btn-container');
    if (t.status === 'REGISTRATION_OPEN' && t.slotsLeft > 0) {
      btnContainer.innerHTML = `
        <button class="btn-neon btn-lg w-100 justify-content-center" onclick="openRegisterModal('${t._id}', '${t.game}')">
          <i class="fas fa-gamepad me-2"></i> Register Your Team Now
        </button>
      `;
    } else if (t.slotsLeft === 0) {
      btnContainer.innerHTML = `<button class="btn btn-secondary btn-lg w-100 disabled" disabled>Slots Full</button>`;
    } else {
      btnContainer.innerHTML = `<button class="btn btn-secondary btn-lg w-100 disabled" disabled>Registration Closed</button>`;
    }

    // Registered Teams List
    const teamsContainer = document.getElementById('registered-teams-list');
    if (teamsContainer) {
      if (teams.length === 0) {
        teamsContainer.innerHTML = `<p class="text-muted">No teams registered yet. Be the first!</p>`;
      } else {
        teamsContainer.innerHTML = teams
          .map(
            (r) => `
            <div class="col-md-4 col-6 mb-3">
              <div class="d-flex align-items-center gap-3 p-2 rounded bg-dark border border-secondary">
                <img src="${r.team.logo}" class="rounded-circle" width="40" height="40">
                <div>
                  <h6 class="mb-0 text-light fw-bold">${r.team.name}</h6>
                  <small class="text-muted">Reg ID: ${r.registrationId}</small>
                </div>
              </div>
            </div>
          `
          )
          .join('');
      }
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Open Register Team Modal & Populate Captain's Teams
async function openRegisterModal(tournamentId, game) {
  const user = getUser();
  if (!user) {
    showToast('Please login to register for tournaments', 'warning');
    setTimeout(() => (window.location.href = '/login.html'), 1500);
    return;
  }

  try {
    const data = await apiRequest('/teams/my', 'GET', null, true);
    const captainTeams = data.teams.filter((t) => t.captain._id === user.id);

    const teamSelect = document.getElementById('select-team');
    if (captainTeams.length === 0) {
      teamSelect.innerHTML = `<option value="">No teams found where you are captain</option>`;
      showToast('You must create a team where you are Captain first!', 'warning');
      setTimeout(() => (window.location.href = '/create-team.html'), 2000);
      return;
    }

    teamSelect.innerHTML = captainTeams
      .map((t) => `<option value="${t._id}">${t.name} (${t.members.length} members)</option>`)
      .join('');

    document.getElementById('modal-tournament-id').value = tournamentId;

    const modal = new bootstrap.Modal(document.getElementById('registerTeamModal'));
    modal.show();

    // Trigger initial fee preview calculation
    updateModalFeePreview();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Update Registration Modal Fee Preview (Rate Per Player * Player Count)
async function updateModalFeePreview() {
  const tournamentId = document.getElementById('modal-tournament-id')?.value;
  const teamId = document.getElementById('select-team')?.value;
  if (!tournamentId || !teamId) return;

  try {
    const data = await apiRequest(`/tournaments/${tournamentId}/check-eligibility`, 'POST', { teamId }, true);
    if (data.eligible) {
      const count = data.playerCount || 4;
      const rate = data.entryFeePerPlayer !== undefined ? data.entryFeePerPlayer : 50;
      const total = data.calculatedTotal !== undefined ? data.calculatedTotal : (count * rate);

      if (document.getElementById('modal-player-count')) {
        document.getElementById('modal-player-count').textContent = `${count} Players`;
      }
      if (document.getElementById('modal-rate-per-player')) {
        document.getElementById('modal-rate-per-player').textContent = total === 0 ? 'FREE' : `₹${rate} / Player`;
      }
      if (document.getElementById('modal-total-calculated-fee')) {
        document.getElementById('modal-total-calculated-fee').textContent = total === 0 
          ? 'FREE ENTRY' 
          : `${count} × ₹${rate} = ₹${total}`;
      }
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}
