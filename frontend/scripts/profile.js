// Protect page
utils.protectPage();

const user = API.helpers.getUser();
let isEditMode = false;
let isResumeEditMode = false;

// Load profile data on page load
document.addEventListener('DOMContentLoaded', function() {
  // Update page title based on role
  document.querySelector('.profile-header h1').textContent = 
    user.role === 'employer' ? 'Профиль компании' : 'Мой профиль';
  document.querySelector('.profile-header p').textContent = 
    user.role === 'employer' ? 'Управление информацией о компании' : 'Управление вашей информацией и резюме';
  
  // Load appropriate content based on role
  if (user.role === 'employer') {
    loadEmployerProfile();
  } else {
    loadJobSeekerProfile();
  }
  
  loadNotifications();
});

// Load job seeker profile
function loadJobSeekerProfile() {
  // Update labels for job seeker
  document.getElementById('nameLabel').textContent = 'Имя';
  document.getElementById('bioLabel').textContent = 'О себе';
  document.querySelector('.card-title').textContent = 'Личная информация';
  
  loadProfileData();
}

// Load employer profile  
function loadEmployerProfile() {
  // Update labels for employer
  document.getElementById('nameLabel').textContent = 'Название компании';
  document.getElementById('bioLabel').textContent = 'Описание компании';
  document.querySelector('.card-title').textContent = 'Информация о компании';
  
  // Hide job seeker specific sections
  const resumeSection = document.querySelector('#resumeForm').closest('.card');
  if (resumeSection) resumeSection.style.display = 'none';
  
  loadCompanyData();
}

// Load company data
async function loadCompanyData() {
  try {
    const response = await API.users.getProfile();
    const profile = response.data;
    
    // Fill form fields with company data
    document.getElementById('name').value = profile.companyName || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('location').value = profile.location || '';
    document.getElementById('bio').value = profile.companyDescription || '';
    
  } catch (error) {
    console.error('Error loading company profile:', error);
    utils.showToast('Ошибка загрузки профиля компании', 'error');
  }
}

// Load profile data
async function loadProfileData() {
  try {
    // Try to get from API first
    let profile = null;
    try {
      const response = await API.users.getProfile();
      profile = response.data;
    } catch (error) {
      console.log('API not available, using localStorage');
      // Fallback to localStorage
      profile = API.helpers.getUser();
    }
    
    // Fill form fields
    document.getElementById('name').value = profile.name || profile.companyName || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('location').value = profile.location || '';
    document.getElementById('bio').value = profile.bio || profile.companyDescription || '';
    document.getElementById('skills').value = profile.skills ? profile.skills.join(', ') : '';
    
    // Load experience
    if (profile.experience && profile.experience.length > 0) {
      loadExperience(profile.experience);
    }
    
    // Load education
    if (profile.education && profile.education.length > 0) {
      loadEducation(profile.education);
    }
    
  } catch (error) {
    console.error('Error loading profile:', error);
    utils.showToast('Ошибка загрузки профиля', 'error');
  }
}

// Load experience data
function loadExperience(experience) {
  const container = document.getElementById('experienceContainer');
  container.innerHTML = '';
  
  experience.forEach(exp => {
    const expItem = createExperienceField(exp.position, exp.company, exp.period);
    container.appendChild(expItem);
  });
}

// Load education data
function loadEducation(education) {
  const container = document.getElementById('educationContainer');
  container.innerHTML = '';
  
  education.forEach(edu => {
    const eduItem = createEducationField(edu.institution, edu.degree, edu.year);
    container.appendChild(eduItem);
  });
}

// Toggle edit mode for profile
function toggleEditMode() {
  isEditMode = !isEditMode;
  const formFields = ['name', 'email', 'phone', 'location', 'bio'];
  const editBtn = document.getElementById('editBtn');
  const formActions = document.getElementById('formActions');
  
  formFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    field.disabled = !isEditMode;
  });
  
  if (isEditMode) {
    editBtn.textContent = 'Отмена';
    formActions.style.display = 'flex';
  } else {
    editBtn.textContent = 'Редактировать';
    formActions.style.display = 'none';
  }
}

// Toggle edit mode for resume
function toggleResumeEditMode() {
  isResumeEditMode = !isResumeEditMode;
  const resumeFields = document.querySelectorAll('#resumeForm .form-control');
  const editBtn = document.getElementById('resumeEditBtn');
  const formActions = document.getElementById('resumeFormActions');
  const addExpBtn = document.getElementById('addExpBtn');
  const addEduBtn = document.getElementById('addEduBtn');
  
  resumeFields.forEach(field => {
    field.disabled = !isResumeEditMode;
  });
  
  if (isResumeEditMode) {
    editBtn.textContent = 'Отмена';
    formActions.style.display = 'flex';
    addExpBtn.style.display = 'block';
    addEduBtn.style.display = 'block';
  } else {
    editBtn.textContent = 'Редактировать';
    formActions.style.display = 'none';
    addExpBtn.style.display = 'none';
    addEduBtn.style.display = 'none';
  }
}

// Save profile
async function saveProfile() {
  try {
    const profileData = {
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      location: document.getElementById('location').value,
    };
    
    // Add role-specific fields
    if (user.role === 'employer') {
      profileData.companyName = document.getElementById('name').value;
      profileData.companyDescription = document.getElementById('bio').value;
    } else {
      profileData.name = document.getElementById('name').value;
      profileData.bio = document.getElementById('bio').value;
    }
    
    // Try to save via API first
    try {
      await API.users.updateProfile(profileData);
    } catch (error) {
      console.log('API not available, saving to localStorage');
      // Fallback to localStorage
      const currentUser = API.helpers.getUser();
      const updatedUser = { ...currentUser, ...profileData };
      API.helpers.saveAuthData(API.helpers.getAuthToken(), updatedUser);
    }
    
    utils.showToast('Профиль успешно обновлен', 'success');
    toggleEditMode();
  } catch (error) {
    console.error('Error saving profile:', error);
    utils.showToast('Ошибка сохранения профиля', 'error');
  }
}

// Save resume
async function saveResume() {
  try {
    const experience = [];
    const education = [];
    
    // Collect experience data
    document.querySelectorAll('.experience-item').forEach(item => {
      const inputs = item.querySelectorAll('input');
      if (inputs[0].value && inputs[1].value) {
        experience.push({
          position: inputs[0].value,
          company: inputs[1].value,
          period: inputs[2].value
        });
      }
    });
    
    // Collect education data
    document.querySelectorAll('.education-item').forEach(item => {
      const inputs = item.querySelectorAll('input');
      if (inputs[0].value && inputs[1].value) {
        education.push({
          institution: inputs[0].value,
          degree: inputs[1].value,
          year: inputs[2].value
        });
      }
    });
    
    const skills = document.getElementById('skills').value
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill);
    
    const resumeData = {
      experience,
      education,
      skills
    };
    
    // Try to save via API first
    try {
      await API.users.updateResume(resumeData);
    } catch (error) {
      console.log('API not available, saving to localStorage');
      // Fallback to localStorage
      const currentUser = API.helpers.getUser();
      const updatedUser = { ...currentUser, ...resumeData };
      API.helpers.saveAuthData(API.helpers.getAuthToken(), updatedUser);
    }
    
    utils.showToast('Резюме успешно обновлено', 'success');
    toggleResumeEditMode();
  } catch (error) {
    console.error('Error saving resume:', error);
    utils.showToast('Ошибка сохранения резюме', 'error');
  }
}

// Cancel edit
function cancelEdit() {
  loadProfileData();
  toggleEditMode();
}

// Cancel resume edit
function cancelResumeEdit() {
  loadProfileData();
  toggleResumeEditMode();
}

// Add experience field
function addExperienceField() {
  const container = document.getElementById('experienceContainer');
  const expItem = createExperienceField('', '', '');
  container.appendChild(expItem);
}

// Create experience field
function createExperienceField(position, company, period) {
  const div = document.createElement('div');
  div.className = 'experience-item mb-3';
  div.innerHTML = `
    <input type="text" placeholder="Должность" class="form-control mb-2" value="${position}" ${!isResumeEditMode ? 'disabled' : ''}>
    <input type="text" placeholder="Компания" class="form-control mb-2" value="${company}" ${!isResumeEditMode ? 'disabled' : ''}>
    <input type="text" placeholder="Период (например: 2020-2023)" class="form-control" value="${period}" ${!isResumeEditMode ? 'disabled' : ''}>
  `;
  return div;
}

// Add education field
function addEducationField() {
  const container = document.getElementById('educationContainer');
  const eduItem = createEducationField('', '', '');
  container.appendChild(eduItem);
}

// Create education field
function createEducationField(institution, degree, year) {
  const div = document.createElement('div');
  div.className = 'education-item mb-3';
  div.innerHTML = `
    <input type="text" placeholder="Учебное заведение" class="form-control mb-2" value="${institution}" ${!isResumeEditMode ? 'disabled' : ''}>
    <input type="text" placeholder="Специальность" class="form-control mb-2" value="${degree}" ${!isResumeEditMode ? 'disabled' : ''}>
    <input type="text" placeholder="Год окончания" class="form-control" value="${year}" ${!isResumeEditMode ? 'disabled' : ''}>
  `;
  return div;
}

// Load notifications
async function loadNotifications() {
  try {
    let notifications = [];
    try {
      const response = await API.notifications.getMine();
      notifications = response.data;
    } catch (error) {
      console.log('API not available, using localStorage');
      // Fallback to localStorage
      notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      // Filter notifications for current user
      const user = API.helpers.getUser();
      notifications = notifications.filter(n => n.userId === user._id);
    }
    
    const container = document.getElementById('notificationsContainer');
    const countBadge = document.getElementById('notificationCount');
    
    if (notifications.length === 0) {
      container.innerHTML = `
        <div class="empty-state text-center p-4">
          <p class="text-secondary">Нет новых уведомлений</p>
        </div>
      `;
      countBadge.textContent = '0';
      return;
    }
    
    const unreadCount = notifications.filter(n => !n.read).length;
    countBadge.textContent = unreadCount;
    
    container.innerHTML = notifications.map(notification => `
      <div class="notification-item ${!notification.read ? 'unread' : ''}">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-text">${notification.message}</div>
        <div class="notification-time">${utils.formatRelativeTime(notification.createdAt)}</div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}
