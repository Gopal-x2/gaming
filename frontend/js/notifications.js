/**
 * NOTIFICATIONS JS
 */

async function loadNotifications() {
  const container = document.getElementById('notifications-container');
  if (!container) return;

  try {
    const data = await apiRequest('/notifications', 'GET', null, true);
    const notifications = data.notifications;

    if (notifications.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-bell-slash fa-3x text-muted mb-3"></i>
          <h4 class="text-muted">No Notifications</h4>
          <p class="text-dim">You're all caught up!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = notifications
      .map(
        (n) => `
        <div class="card-glass mb-3 ${n.isRead ? 'opacity-75' : 'border-start border-4 border-success'}">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h5 class="mb-1 text-light">${n.title} ${!n.isRead ? '<span class="badge bg-success ms-2">NEW</span>' : ''}</h5>
              <p class="text-muted mb-2">${n.message}</p>
              <small class="text-dim"><i class="fas fa-clock me-1"></i> ${new Date(n.createdAt).toLocaleString()}</small>
            </div>
            ${
              !n.isRead
                ? `<button class="btn btn-sm btn-outline-secondary" onclick="markNotificationRead('${n._id}')"><i class="fas fa-check"></i> Mark Read</button>`
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

async function markNotificationRead(id) {
  try {
    await apiRequest(`/notifications/${id}/read`, 'PUT', null, true);
    loadNotifications();
    fetchUnreadCount();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleMarkAllRead() {
  try {
    await apiRequest('/notifications/read-all', 'PUT', null, true);
    showToast('All notifications marked as read');
    loadNotifications();
    fetchUnreadCount();
  } catch (error) {
    showToast(error.message, 'error');
  }
}
