// Protect page - only employers can access
utils.protectPage();
utils.protectRole('employer');

let allCandidates = [];

// Load candidates on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Candidates page loaded');
  console.log('API object available:', !!window.API);
  console.log('API.users available:', !!(window.API && window.API.users));
  console.log('API.users.getCandidates available:', !!(window.API && window.API.users && window.API.users.getCandidates));
  
  loadCandidates();
});

// Load candidates
async function loadCandidates() {
  console.log('Starting to load candidates...');
  
  // Check API availability first
  const apiAvailable = await API.checkAPIAvailability();
  if (!apiAvailable) {
    console.error('API is not available');
    const container = document.getElementById('candidatesContainer');
    container.innerHTML = `
      <div class="empty-state text-center p-4">
        <p class="text-secondary">❌ Сервер недоступен</p>
        <p class="text-secondary">Пожалуйста, проверьте:</p>
        <ul class="text-left" style="text-align: left; display: inline-block;">
          <li>Запущен ли сервер на порту 3000</li>
          <li>Доступен ли API по адресу ${API_BASE_URL}</li>
          <li>Нет ли проблем с сетью</li>
        </ul>
        <button onclick="loadCandidates()" class="btn btn-primary mt-2">Повторить проверку</button>
      </div>
    `;
    return;
  }
  
  try {
    console.log('Making API call to /users/candidates...');
    // Load candidates from API only
    const response = await API.users.getCandidates();
    console.log('API response:', response);
    
    allCandidates = response.data;
    console.log('Candidates loaded:', allCandidates);
    
    updateStats();
    displayCandidates(allCandidates);
    
  } catch (error) {
    console.error('Error loading candidates:', error);
    console.error('Error details:', error.message, error.stack);
    utils.showToast('Ошибка загрузки кандидатов. Пожалуйста, проверьте подключение к серверу.', 'error');
    
    // Show error state with more details
    const container = document.getElementById('candidatesContainer');
    container.innerHTML = `
      <div class="empty-state text-center p-4">
        <p class="text-secondary">Не удалось загрузить кандидатов</p>
        <p class="text-secondary">Ошибка: ${error.message || 'Неизвестная ошибка'}</p>
        <p class="text-secondary">Пожалуйста, проверьте:</p>
        <ul class="text-left" style="text-align: left; display: inline-block;">
          <li>Подключение к серверу</li>
          <li>Работа API эндпоинта</li>
          <li>Наличие кандидатов в базе данных</li>
        </ul>
        <button onclick="loadCandidates()" class="btn btn-primary mt-2">Обновить</button>
      </div>
    `;
  }
}

// Update statistics
function updateStats() {
  const totalCandidates = allCandidates.length;
  const newCandidates = allCandidates.filter(c => {
    const daysSinceCreated = (Date.now() - c.createdAt) / (1000 * 60 * 60 * 24);
    return daysSinceCreated <= 7;
  }).length;
  const highMatchCandidates = allCandidates.filter(c => c.matchScore >= 80).length;
  const interviewsCount = Math.floor(totalCandidates * 0.3); // Simulated
  
  document.getElementById('totalCandidatesCount').textContent = totalCandidates;
  document.getElementById('newCandidatesCount').textContent = newCandidates;
  document.getElementById('highMatchCount').textContent = highMatchCandidates;
  document.getElementById('interviewsCount').textContent = interviewsCount;
}

// Display candidates
function displayCandidates(candidates) {
  const container = document.getElementById('candidatesContainer');
  
  if (candidates.length === 0) {
    container.innerHTML = `
      <div class="empty-state text-center p-4">
        <p class="text-secondary">Кандидаты не найдены</p>
        <button onclick="loadCandidates()" class="btn btn-primary mt-2">Обновить</button>
      </div>
    `;
    return;
  }
  
  const candidatesGrid = document.createElement('div');
  candidatesGrid.className = 'candidates-grid';
  
  candidatesGrid.innerHTML = candidates.map(candidate => {
    const initials = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const statusClass = `status-${candidate.status}`;
    const statusText = getStatusText(candidate.status);
    
    return `
      <div class="candidate-card" onclick="viewCandidate('${candidate._id}')">
        <div class="candidate-header">
          <div class="candidate-avatar">${initials}</div>
          <div class="candidate-info">
            <h3>${candidate.name}</h3>
            <p class="title">${candidate.title}</p>
            <p class="location">📍 ${candidate.location}</p>
          </div>
        </div>
        
        <div class="candidate-meta">
          <span class="candidate-status ${statusClass}">${statusText}</span>
          <span class="match-score">${candidate.matchScore}% совпадение</span>
        </div>
        
        <div class="candidate-skills">
          ${candidate.skills.slice(0, 4).map(skill => 
            `<span class="skill-tag">${skill}</span>`
          ).join('')}
          ${candidate.skills.length > 4 ? 
            `<span class="skill-tag">+${candidate.skills.length - 4}</span>` : ''
          }
        </div>
        
        <p class="candidate-bio">${candidate.bio}</p>
        
        <div class="candidate-actions">
          <button onclick="event.stopPropagation(); viewCandidate('${candidate._id}')" class="btn btn-primary">
            Посмотреть профиль
          </button>
          <button onclick="event.stopPropagation(); inviteToInterview('${candidate._id}')" class="btn btn-success">
            Пригласить
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = '';
  container.appendChild(candidatesGrid);
}

// Get status text
function getStatusText(status) {
  const statusMap = {
    'available': 'Доступен',
    'busy': 'Занят',
    'offline': 'Не в сети'
  };
  return statusMap[status] || status;
}

// Filter candidates
function filterCandidates() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const skillsFilter = document.getElementById('skillsFilter').value;
  const experienceFilter = document.getElementById('experienceFilter').value;
  const locationFilter = document.getElementById('locationFilter').value;
  
  let filteredCandidates = allCandidates;
  
  // Filter by search term
  if (searchTerm) {
    filteredCandidates = filteredCandidates.filter(candidate =>
      candidate.name.toLowerCase().includes(searchTerm) ||
      candidate.title.toLowerCase().includes(searchTerm) ||
      candidate.bio.toLowerCase().includes(searchTerm) ||
      candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm))
    );
  }
  
  // Filter by skills
  if (skillsFilter) {
    filteredCandidates = filteredCandidates.filter(candidate =>
      candidate.skills.some(skill => skill.toLowerCase().includes(skillsFilter))
    );
  }
  
  // Filter by experience
  if (experienceFilter) {
    filteredCandidates = filteredCandidates.filter(candidate =>
      candidate.experience === experienceFilter
    );
  }
  
  // Filter by location
  if (locationFilter) {
    filteredCandidates = filteredCandidates.filter(candidate =>
      candidate.location.toLowerCase().includes(locationFilter.toLowerCase())
    );
  }
  
  displayCandidates(filteredCandidates);
}

// View candidate profile
function viewCandidate(candidateId) {
  window.location.href = `candidate-profile.html?id=${candidateId}`;
}

// Invite to interview
function inviteToInterview(candidateId) {
  window.location.href = `invite-interview.html?candidate=${candidateId}`;
}
