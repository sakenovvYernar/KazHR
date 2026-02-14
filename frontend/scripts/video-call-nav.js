// Add video call button to navigation for all users
function addVideoCallToNavigation() {
  const user = API.helpers.getUser();
  if (!user) return;

  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  // Check if video call button already exists
  if (navLinks.querySelector('.video-call-btn')) return;

  const videoCallBtn = document.createElement('button');
  videoCallBtn.className = 'btn btn-success btn-sm video-call-btn';
  videoCallBtn.innerHTML = '📹 Video Call';
  
  // Set click handler based on user role
  if (typeof showStartVideoCallModal === 'function' && typeof showJoinVideoCallModal === 'function') {
    videoCallBtn.onclick = user.role === 'employer' ? showStartVideoCallModal : showJoinVideoCallModal;
  } else {
    // Fallback - just redirect to dashboard
    videoCallBtn.onclick = () => {
      window.location.href = 'dashboard.html';
    };
  }
  
  // Insert before logout button
  const logoutBtn = navLinks.querySelector('button[onclick="utils.logout()"]');
  if (logoutBtn) {
    navLinks.insertBefore(videoCallBtn, logoutBtn);
  } else {
    // If no logout button, just append
    navLinks.appendChild(videoCallBtn);
  }
}

// Add video call button when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit for user data to be available
  setTimeout(addVideoCallToNavigation, 100);
});
