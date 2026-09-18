/**
 * RAZORPAY INTEGRATION & PAYMENT VERIFICATION JS
 */

async function initiateTournamentPayment(event) {
  event.preventDefault();

  const tournamentId = document.getElementById('modal-tournament-id').value;
  const teamId = document.getElementById('select-team').value;

  if (!teamId) {
    return showToast('Please select a team to register', 'warning');
  }

  try {
    showToast('Checking eligibility & creating payment order...', 'warning');

    const data = await apiRequest('/payments/create-order', 'POST', {
      tournamentId,
      teamId,
    });

    // Free tournament flow
    if (data.freeRegistration) {
      showToast('Registration successful for free tournament!');
      setTimeout(() => (window.location.href = '/my-tournaments.html'), 1500);
      return;
    }

    // Paid tournament flow via Manual UPI
    // 1. Hide the register modal
    const registerModalEl = document.getElementById('registerModal');
    if (registerModalEl) {
      const bsModal = bootstrap.Modal.getInstance(registerModalEl);
      if (bsModal) bsModal.hide();
    }

    // 2. Populate UPI Modal
    document.getElementById('upi-amount').textContent = `₹${data.amount}`;
    document.getElementById('upi-payment-id').value = data.paymentId;
    document.getElementById('upi-tournament-id').value = tournamentId;
    document.getElementById('upi-team-id').value = teamId;
    document.getElementById('upi-utr').value = '';

    // 3. Show UPI Modal
    const upiModalEl = document.getElementById('upiPaymentModal');
    if (upiModalEl) {
      const upiModal = new bootstrap.Modal(upiModalEl);
      upiModal.show();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Handle UPI Form Submission
document.addEventListener('DOMContentLoaded', () => {
  const upiForm = document.getElementById('upi-payment-form');
  if (upiForm) {
    upiForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const utr = document.getElementById('upi-utr').value.trim();
      const paymentId = document.getElementById('upi-payment-id').value;
      const tournamentId = document.getElementById('upi-tournament-id').value;
      const teamId = document.getElementById('upi-team-id').value;

      if (utr.length !== 12) return showToast('UTR must be exactly 12 digits', 'error');

      try {
        const res = await apiRequest('/payments/submit-upi', 'POST', {
          utrNumber: utr,
          paymentId,
          tournamentId,
          teamId
        });

        showToast(res.message, 'success');
        
        // Hide modal
        const upiModalEl = document.getElementById('upiPaymentModal');
        const upiModal = bootstrap.Modal.getInstance(upiModalEl);
        if (upiModal) upiModal.hide();

        setTimeout(() => (window.location.href = '/my-tournaments.html'), 2000);
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  }
});

async function verifyServerPayment(payload) {
  try {
    const res = await apiRequest('/payments/verify', 'POST', payload);
    showToast('Payment Verified! Registration ID: ' + res.registrationId);
    setTimeout(() => (window.location.href = '/my-tournaments.html'), 1500);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Load My Registered Tournaments (For my-tournaments.html)
async function loadMyTournaments() {
  const container = document.getElementById('my-tournaments-list');
  if (!container) return;

  try {
    const data = await apiRequest('/payments/my', 'GET', null, true);
    const payments = data.payments;

    if (payments.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fas fa-ticket-alt fa-3x text-muted mb-3"></i>
          <h4 class="text-muted">No Tournament Registrations</h4>
          <p class="text-dim mb-4">You haven't registered for any tournaments yet.</p>
          <a href="/tournaments.html" class="btn-neon"><i class="fas fa-trophy me-1"></i> Explore Tournaments</a>
        </div>
      `;
      return;
    }

    container.innerHTML = payments
      .map((p) => {
        if (!p.tournament || !p.team) return '';

        return `
          <div class="col-md-6 mb-4">
            <div class="card-glass">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-dark border border-secondary text-success">${p.tournament.game}</span>
                <span class="badge-status badge-open">${p.status}</span>
              </div>
              <h3 class="tournament-title">${p.tournament.title}</h3>
              <p class="text-muted mb-2">Team: <strong>${p.team.name}</strong></p>
              <div class="p-2 rounded bg-dark border border-secondary mb-3 fs-7">
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Order ID:</span>
                  <span class="text-light">${p.razorpayOrderId}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Amount Paid:</span>
                  <span class="text-warning fw-bold">₹${p.amount}</span>
                </div>
              </div>
              <a href="/matches.html?tournamentId=${p.tournament._id}" class="btn-outline-neon w-100 justify-content-center">
                View Matches & Room Credentials <i class="fas fa-gamepad ms-1"></i>
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
