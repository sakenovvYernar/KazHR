// Redirect if already authenticated
utils.redirectIfAuthenticated();

// Pre-select role from URL params
const urlParams = new URLSearchParams(window.location.search);
const roleParam = urlParams.get('role');
if (roleParam === 'jobseeker' || roleParam === 'employer') {
  document.querySelector(`input[name="role"][value="${roleParam}"]`).checked = true;
  toggleRoleFields(roleParam);
}

// Handle role selection
const roleInputs = document.querySelectorAll('input[name="role"]');
roleInputs.forEach(input => {
  input.addEventListener('change', (e) => {
    toggleRoleFields(e.target.value);
  });
});

// Toggle role-specific fields
function toggleRoleFields(role) {
  const jobseekerFields = document.getElementById('jobseekerFields');
  const employerFields = document.getElementById('employerFields');

  if (role === 'jobseeker') {
    jobseekerFields.classList.remove('hidden');
    employerFields.classList.add('hidden');
  } else if (role === 'employer') {
    employerFields.classList.remove('hidden');
    jobseekerFields.classList.add('hidden');
  }
}

// Register form handler
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const role = document.querySelector('input[name="role"]:checked')?.value;

  // Validate
  if (!role) {
    showAlert('Please select your role', 'error');
    return;
  }

  if (!utils.isValidEmail(email)) {
    showAlert('Please enter a valid email address', 'error');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters', 'error');
    return;
  }

  // Build user data
  const userData = {
    name,
    email,
    password,
    role
  };

  // Add role-specific data
  if (role === 'jobseeker') {
    const skillsInput = document.getElementById('skills').value.trim();
    userData.skills = skillsInput ? skillsInput.split(',').map(s => s.trim()) : [];
    userData.experience = parseInt(document.getElementById('experience').value) || 0;
  } else if (role === 'employer') {
    userData.companyName = document.getElementById('companyName').value.trim();
    userData.companyDescription = document.getElementById('companyDescription').value.trim();
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  utils.showLoading(submitBtn);

  try {
    const response = await API.auth.register(userData);

    if (response.success) {
      // Save auth data
      API.helpers.saveAuthData(response.data.token, response.data);

      utils.showToast('Registration successful!', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    }
  } catch (error) {
    showAlert(error.message || 'Registration failed. Please try again.', 'error');
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
