/**
 * LIVE LEADERBOARD JS
 */

async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-body');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('tournamentId');

  if (!tournamentId) {
    container.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Please select a tournament to view standings.</td></tr>`;
    return;
  }

  try {
    const data = await apiRequest(`/matches/leaderboard/${tournamentId}`, 'GET', null, false);
    const leaderboard = data.leaderboard;

    if (leaderboard.length === 0) {
      container.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No standings available yet for this tournament.</td></tr>`;
      return;
    }

    container.innerHTML = leaderboard
      .map((item, index) => {
        const rank = index + 1;
        let rankBadge = `#${rank}`;
        let rowClass = '';

        if (rank === 1) {
          rankBadge = `<span class="badge bg-warning text-dark fs-6"><i class="fas fa-trophy me-1"></i> 1ST (WINNER)</span>`;
          rowClass = 'border-start border-4 border-warning';
        } else if (rank === 2) {
          rankBadge = `<span class="badge bg-secondary text-white fs-6"><i class="fas fa-medal me-1"></i> 2ND</span>`;
        } else if (rank === 3) {
          rankBadge = `<span class="badge bg-danger text-white fs-6"><i class="fas fa-award me-1"></i> 3RD</span>`;
        }

        return `
          <tr class="${rowClass}">
            <td class="fw-bold">${rankBadge}</td>
            <td>
              <div class="d-flex align-items-center gap-2">
                <img src="${item.team ? item.team.logo : ''}" class="rounded-circle" width="35" height="35">
                <span class="fw-bold text-light">${item.team ? item.team.name : 'Unknown Team'}</span>
              </div>
            </td>
            <td>${item.matchesPlayed}</td>
            <td class="text-success fw-bold">${item.wins}</td>
            <td class="text-info fw-bold">${item.kills}</td>
            <td class="text-warning fw-bold fs-5">${item.points} PTS</td>
            <td class="text-warning fw-bold">${item.prizeWon ? '₹' + item.prizeWon : '-'}</td>
          </tr>
        `;
      })
      .join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}
