/**
 * MATCHES & ROOM CREDENTIALS JS
 */

async function loadMatches() {
  const container = document.getElementById('matches-container');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('tournamentId') || '';

  try {
    const query = tournamentId ? `?tournamentId=${tournamentId}` : '';
    const data = await apiRequest(`/matches${query}`, 'GET', null, false);
    const matches = data.matches;

    if (matches.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
          <h4 class="text-muted">No Matches Scheduled Yet</h4>
          <p class="text-dim">Check back later once the admin publishes the match schedule.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = matches
      .map((m) => {
        let roomSection = '';
        if (m.isPublished && m.roomId) {
          roomSection = `
            <div class="p-3 rounded bg-dark border border-success mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="text-success fw-bold"><i class="fas fa-key me-1"></i> ROOM CREDENTIALS PUBLISHED</span>
                <span class="badge bg-success text-dark">LIVE ROOM</span>
              </div>
              <div class="row text-center mt-2">
                <div class="col-6">
                  <small class="text-muted text-uppercase d-block">Room ID</small>
                  <span class="fs-5 fw-bold text-light" id="room-id-${m._id}">${m.roomId}</span>
                  <button class="btn btn-sm btn-link text-success p-0 ms-1" onclick="copyToClipboard('${m.roomId}', 'Room ID')"><i class="fas fa-copy"></i></button>
                </div>
                <div class="col-6">
                  <small class="text-muted text-uppercase d-block">Password</small>
                  <span class="fs-5 fw-bold text-warning" id="room-pass-${m._id}">${m.roomPassword}</span>
                  <button class="btn btn-sm btn-link text-warning p-0 ms-1" onclick="copyToClipboard('${m.roomPassword}', 'Password')"><i class="fas fa-copy"></i></button>
                </div>
              </div>
            </div>
          `;
        } else {
          roomSection = `
            <div class="p-3 rounded bg-dark border border-secondary mb-3 text-center">
              <span class="text-muted"><i class="fas fa-lock me-1"></i> Room details will be available soon. (Admin will publish before match time)</span>
            </div>
          `;
        }

        return `
          <div class="col-lg-6 mb-4">
            <div class="card-glass">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-dark border border-secondary text-info">${m.roundName} - Match #${m.matchNumber}</span>
                <span class="badge-status badge-upcoming">${m.status}</span>
              </div>
              <h4 class="text-light mb-1">${m.tournament ? m.tournament.title : 'Tournament Match'}</h4>
              <p class="text-muted fs-7 mb-3"><i class="fas fa-clock me-1"></i> ${new Date(m.matchTime).toLocaleString()}</p>
              
              ${roomSection}
              
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted fs-7">${m.teams ? m.teams.length : 0} Teams Assigned</span>
                <a href="/leaderboard.html?tournamentId=${m.tournament ? m.tournament._id : ''}" class="btn-outline-neon btn-sm">
                  View Standings <i class="fas fa-list-ol ms-1"></i>
                </a>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text);
  showToast(`${label} copied to clipboard!`);
}
