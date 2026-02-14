// Protect page - only employers can access
utils.protectPage();
utils.protectRole('employer');

let currentCandidate = null;
let selectedDate = null;
let selectedTime = null;

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const candidateId = urlParams.get('candidate');
  const applicationId = urlParams.get('application');
  
  if (candidateId) {
    loadCandidateInfo(candidateId);
    setupCalendar();
    generateTimeSlots();
    setupFormHandler(applicationId, candidateId);
  } else {
    utils.showToast('ID кандидата не указан', 'error');
    window.location.href = 'dashboard.html';
  }
});

// Load candidate information
async function loadCandidateInfo(candidateId) {
  try {
    // Simulated candidate data - in real app this would be API call
    currentCandidate = {
      _id: candidateId,
      name: 'Айдар Сапаров',
      email: 'aidar@example.com',
      phone: '+7 701 234 56 78',
      position: 'Senior Frontend Developer'
    };
    
    displayCandidateInfo(currentCandidate);
    
  } catch (error) {
    console.error('Error loading candidate info:', error);
    utils.showToast('Ошибка загрузки информации о кандидате', 'error');
  }
}

// Display candidate information
function displayCandidateInfo(candidate) {
  const container = document.getElementById('candidateInfo');
  const initials = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  container.innerHTML = `
    <div class="candidate-info">
      <div class="candidate-avatar">${initials}</div>
      <div class="candidate-details">
        <h4>${candidate.name}</h4>
        <p>📧 ${candidate.email}</p>
        <p>📱 ${candidate.phone}</p>
        <p>💼 ${candidate.position}</p>
      </div>
    </div>
  `;
}

// Setup calendar
function setupCalendar() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Set minimum date to today
  const dateInput = document.getElementById('interviewDate');
  dateInput.min = today.toISOString().split('T')[0];
  
  // Generate calendar
  generateCalendar(currentMonth, currentYear);
}

// Generate calendar
function generateCalendar(month, year) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  
  const calendarGrid = document.querySelector('.calendar-grid');
  if (!calendarGrid) return;
  
  // Day headers
  const dayHeaders = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  let calendarHTML = dayHeaders.map(day => 
    `<div class="calendar-day-header">${day}</div>`
  ).join('');
  
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    calendarHTML += '<div class="calendar-day disabled"></div>';
  }
  
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today && !isToday;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    let classes = 'calendar-day';
    if (isToday) classes += ' today';
    if (isPast) classes += ' disabled';
    if (isWeekend) classes += ' disabled';
    
    calendarHTML += `<div class="${classes}" data-date="${date.toISOString().split('T')[0]}" 
                      onclick="selectDate('${date.toISOString().split('T')[0]}')" 
                      ${isPast ? 'disabled' : ''}>${day}</div>`;
  }
  
  calendarGrid.innerHTML = calendarHTML;
}

// Select date
function selectDate(date) {
  selectedDate = date;
  document.getElementById('interviewDate').value = date;
  
  // Update calendar selection
  document.querySelectorAll('.calendar-day').forEach(day => {
    day.classList.remove('selected');
    if (day.dataset.date === date) {
      day.classList.add('selected');
    }
  });
  
  // Regenerate time slots for selected date
  generateTimeSlots();
}

// Generate time slots
function generateTimeSlots() {
  const container = document.querySelector('.time-slots-grid');
  if (!container) return;
  
  const timeSlots = [];
  const startHour = 9;
  const endHour = 18;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }
  
  container.innerHTML = timeSlots.map(time => `
    <div class="time-slot" onclick="selectTime('${time}')" data-time="${time}">
      ${time}
    </div>
  `).join('');
}

// Select time
function selectTime(time) {
  selectedTime = time;
  document.getElementById('interviewTime').value = time;
  
  // Update time slot selection
  document.querySelectorAll('.time-slot').forEach(slot => {
    slot.classList.remove('selected');
    if (slot.dataset.time === time) {
      slot.classList.add('selected');
    }
  });
}

// Toggle location field
function toggleLocationField() {
  const interviewType = document.getElementById('interviewType').value;
  const locationGroup = document.getElementById('locationGroup');
  
  if (interviewType === 'office' || interviewType === 'hybrid') {
    locationGroup.style.display = 'block';
    document.getElementById('location').required = true;
  } else {
    locationGroup.style.display = 'none';
    document.getElementById('location').required = false;
  }
}

// Setup form handler
function setupFormHandler(applicationId, candidateId) {
  const form = document.getElementById('interviewForm');
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const interviewData = {
      applicationId: applicationId,
      candidateId: candidateId,
      date: formData.get('interviewDate'),
      time: formData.get('interviewTime'),
      type: formData.get('interviewType'),
      duration: formData.get('duration'),
      location: formData.get('location'),
      message: formData.get('message'),
      status: 'scheduled'
    };
    
    try {
      // Generate interview code
      const interviewCode = generateInterviewCode();
      interviewData.code = interviewCode;
      
      // Send invitation
      await sendInterviewInvitation(interviewData);
      
      utils.showToast('Приглашение на собеседование отправлено!', 'success');
      
      // Show interview details
      showInterviewDetails(interviewData);
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      utils.showToast('Ошибка отправки приглашения', 'error');
    }
  });
}

// Generate interview code
function generateInterviewCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Send interview invitation
async function sendInterviewInvitation(interviewData) {
  try {
    // Try to send via API first
    await API.interviews.inviteCandidate(interviewData);
  } catch (error) {
    console.log('API not available, saving to localStorage');
    // Fallback to localStorage
    const interviews = JSON.parse(localStorage.getItem('interviews') || '[]');
    interviews.push({
      ...interviewData,
      _id: 'interview_' + Date.now(),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('interviews', JSON.stringify(interviews));
  }
  
  // Create notification for candidate
  const notification = {
    _id: 'notification_' + Date.now(),
    userId: interviewData.candidateId,
    title: 'Приглашение на собеседование',
    message: `Вы приглашены на собеседование ${interviewData.date} в ${interviewData.time}. Код для входа: ${interviewData.code}`,
    type: 'interview_invitation',
    interviewId: interviewData.code,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  try {
    await API.notifications.create(notification);
  } catch (error) {
    console.log('API not available, saving notification to localStorage');
    // Fallback to localStorage
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.push(notification);
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }
  
  console.log('Interview invitation sent:', interviewData);
  return true;
}

// Show interview details
function showInterviewDetails(interviewData) {
  const form = document.getElementById('interviewForm');
  const detailsHTML = `
    <div class="interview-preview">
      <h4>📅 Собеседование назначено</h4>
      <div class="preview-item">
        <span class="preview-label">Дата:</span>
        <span class="preview-value">${interviewData.date}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">Время:</span>
        <span class="preview-value">${interviewData.time}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">Формат:</span>
        <span class="preview-value">${getInterviewTypeText(interviewData.type)}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">Код для входа:</span>
        <span class="preview-value" style="font-weight: bold; color: #3b82f6;">${interviewData.code}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">Продолжительность:</span>
        <span class="preview-value">${interviewData.duration} минут</span>
      </div>
      ${interviewData.location ? `
        <div class="preview-item">
          <span class="preview-label">Адрес:</span>
          <span class="preview-value">${interviewData.location}</span>
        </div>
      ` : ''}
      <div class="mt-3">
        <a href="my-jobs.html" class="btn btn-primary">Вернуться к вакансиям</a>
        <a href="interview-room.html?code=${interviewData.code}" class="btn btn-outline">Перейти к собеседованию</a>
      </div>
    </div>
  `;
  
  form.innerHTML = detailsHTML;
}

// Get interview type text
function getInterviewTypeText(type) {
  const types = {
    'online': 'Онлайн на платформе',
    'office': 'В офисе',
    'hybrid': 'Гибридный формат'
  };
  return types[type] || type;
}
