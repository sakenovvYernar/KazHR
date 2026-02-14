// Redirect if already authenticated
utils.redirectIfAuthenticated();

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Validate
  if (!utils.isValidEmail(email)) {
    showAlert('Please enter a valid email address', 'error');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  utils.showLoading(submitBtn);

  try {
    const response = await API.auth.login({ email, password });

    if (response.success) {
      // Save auth data
      API.helpers.saveAuthData(response.data.token, response.data);

      utils.showToast('Login successful!', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    }
  } catch (error) {
    showAlert(error.message || 'Login failed. Please try again.', 'error');
    utils.hideLoading(submitBtn);
  }
});

// Show alert helper
function showAlert(message, type) {
  const alertContainer = document.getElementById('alert-container');
  alertContainer.innerHTML = `
    <div class="alert alert-${type}">
      ${message}
    </div>
  `;

  setTimeout(() => {
    alertContainer.innerHTML = '';
  }, 5000);
}
