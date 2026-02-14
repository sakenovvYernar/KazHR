// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Inject CSS if not exists
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease;
      }
      .toast-success { background-color: #10b981; }
      .toast-error { background-color: #ef4444; }
      .toast-info { background-color: #2563eb; }
      .toast-warning { background-color: #f59e0b; }
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Show loading state
function showLoading(element) {
  element.disabled = true;
  element.dataset.originalText = element.textContent;
  element.innerHTML = '<span class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></span>';
}

// Hide loading state
function hideLoading(element) {
  element.disabled = false;
  element.textContent = element.dataset.originalText;
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format relative time
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) return formatDate(dateString);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

// Validate email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Truncate text
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Get status badge class
function getStatusBadgeClass(status) {
  const statusMap = {
    'applied': 'badge-primary',
    'interview_invited': 'badge-warning',
    'rejected': 'badge-danger',
    'hired': 'badge-success',
    'active': 'badge-success',
    'closed': 'badge-danger',
    'scheduled': 'badge-warning',
    'completed': 'badge-success'
  };
  return statusMap[status] || 'badge-primary';
}

// Get status text
function getStatusText(status) {
  const statusMap = {
    'applied': 'Applied',
    'interview_invited': 'Interview Invited',
    'rejected': 'Rejected',
    'hired': 'Hired',
    'active': 'Active',
    'closed': 'Closed',
    'scheduled': 'Scheduled',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status;
}

// Protect page (redirect if not authenticated)
function protectPage() {
  if (!API.helpers.isAuthenticated()) {
    window.location.href = '../pages/login.html';
  }
}

// Protect role (redirect if wrong role)
function protectRole(requiredRole) {
  const user = API.helpers.getUser();
  if (!user || user.role !== requiredRole) {
    showToast('Access denied', 'error');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  }
}

// Redirect if authenticated
function redirectIfAuthenticated() {
  if (API.helpers.isAuthenticated()) {
    window.location.href = 'dashboard.html';
  }
}

// Logout
function logout() {
  API.helpers.clearAuthData();
  window.location.href = '../pages/login.html';
}

// Create element helper
function createElement(tag, className, textContent) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  return el;
}

// Export to global scope
window.utils = {
  showToast,
  showLoading,
  hideLoading,
  formatDate,
  formatRelativeTime,
  isValidEmail,
  truncateText,
  getStatusBadgeClass,
  getStatusText,
  protectPage,
  protectRole,
  redirectIfAuthenticated,
  logout,
  createElement
};
