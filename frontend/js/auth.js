/**
 * AUTHENTICATION LOGIC (Login, Register, Forgot & Reset Password)
 */

// Handle Registration
async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('name').value.trim();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    return showToast('Passwords do not match', 'error');
  }

  try {
    const data = await apiRequest('/auth/register', 'POST', {
      name,
      username,
      email,
      phone,
      password,
    }, false);

    setAuth(data.token, data.user);
    showToast('Registration successful! Welcome to Nexus Esports.');
    setTimeout(() => {
      window.location.href = data.user.role === 'ADMIN' ? '/admin/dashboard.html' : '/index.html';
    }, 1200);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Handle Login
async function handleLogin(event) {
  event.preventDefault();
  const loginKey = document.getElementById('loginKey').value.trim();
  const password = document.getElementById('password').value;

  try {
    const data = await apiRequest('/auth/login', 'POST', {
      loginKey,
      password,
    }, false);

    setAuth(data.token, data.user);
    showToast('Login successful!');
    setTimeout(() => {
      window.location.href = data.user.role === 'ADMIN' ? '/admin/dashboard.html' : '/index.html';
    }, 1000);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Handle Forgot Password
async function handleForgotPassword(event) {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();

  try {
    const data = await apiRequest('/auth/forgot-password', 'POST', { email }, false);
    showToast(data.message);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Handle Reset Password
async function handleResetPassword(event) {
  event.preventDefault();
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!token) {
    return showToast('Reset token is missing or invalid', 'error');
  }

  if (password !== confirmPassword) {
    return showToast('Passwords do not match', 'error');
  }

  try {
    const data = await apiRequest('/auth/reset-password', 'POST', { token, password }, false);
    showToast(data.message);
    setTimeout(() => (window.location.href = '/login.html'), 1500);
  } catch (error) {
    showToast(error.message, 'error');
  }
}
