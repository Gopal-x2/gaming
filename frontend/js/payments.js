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

    // Paid tournament flow via Razorpay
    const options = {
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: 'Nexus Esports Platform',
      description: `Registration for ${data.tournamentTitle} (${data.teamName})`,
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
      order_id: data.orderId,
      handler: async function (response) {
        showToast('Payment completed! Verifying signature with server...', 'warning');
        await verifyServerPayment({
          razorpayOrderId: response.razorpay_order_id || data.orderId,
          razorpayPaymentId: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
          razorpaySignature: response.razorpay_signature || 'mock_signature',
          tournamentId,
          teamId,
        });
      },
      prefill: {
        name: getUser() ? getUser().name : '',
        email: getUser() ? getUser().email : '',
        contact: getUser() ? getUser().phone : '',
      },
      theme: {
        color: '#00ff88',
      },
    };

    // If Razorpay SDK is available on window, open Checkout modal
    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        showToast('Payment failed: ' + resp.error.description, 'error');
      });
      rzp.open();
    } else {
      // Mock / Test Fallback mode when Razorpay script isn't loaded
      showToast('Opening Payment Sandbox Checkout...', 'warning');
      setTimeout(async () => {
        await verifyServerPayment({
          razorpayOrderId: data.orderId,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: 'mock_signature',
          tournamentId,
          teamId,
        });
      }, 1500);
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

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
