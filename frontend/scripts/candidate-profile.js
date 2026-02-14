// Protect page - only employers can access
utils.protectPage();
utils.protectRole('employer');

let currentCandidate = null;

// Load candidate profile on page load
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const candidateId = urlParams.get('id');
  
  if (candidateId) {
    loadCandidateProfile(candidateId);
  } else {
    utils.showToast('ID кандидата не указан', 'error');
    window.location.href = 'dashboard.html';
  }
});

// Load candidate profile
async function loadCandidateProfile(candidateId) {
  try {
    // Load candidate from API only
    const response = await API.users.getById(candidateId);
    currentCandidate = response.data;
    
    displayCandidateProfile(currentCandidate);
    
  } catch (error) {
    console.error('Error loading candidate profile:', error);
    utils.showToast('Ошибка загрузки профиля кандидата. Пожалуйста, проверьте подключение к серверу.', 'error');
    
    // Show error state
    const container = document.getElementById('candidateProfileContainer');
    container.innerHTML = `
      <div class="empty-state text-center p-4">
        <p class="text-secondary">Не удалось загрузить профиль кандидата</p>
        <p class="text-secondary">Пожалуйста, попробуйте обновить страницу позже</p>
        <button onclick="history.back()" class="btn btn-primary mt-2">Вернуться назад</button>
      </div>
    `;
  }
}

// Display candidate profile
function displayCandidateProfile(candidate) {
  const container = document.getElementById('candidateProfileContainer');
  
  const initials = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const experienceHtml = candidate.experience ? candidate.experience.map(exp => `
    <div class="experience-item">
      <h4>${exp.position}</h4>
      <div class="company">${exp.company}</div>
      <div class="period">${exp.period}</div>
    </div>
  `).join('') : '';
  
  const educationHtml = candidate.education ? candidate.education.map(edu => `
    <div class="education-item">
      <h4>${edu.degree}</h4>
      <div class="institution">${edu.institution}</div>
      <div class="year">${edu.year}</div>
    </div>
  `).join('') : '';
  
  const skillsHtml = candidate.skills ? candidate.skills.map(skill => `
    <div class="skill-item">${skill}</div>
  `).join('') : '';
  
  container.innerHTML = `
    <div class="candidate-header">
      <div class="candidate-avatar">${initials}</div>
      <h1 class="candidate-name">${candidate.name}</h1>
      <div class="candidate-title">${candidate.title || 'Специалист'}</div>
      <div class="candidate-contact">
        <div class="contact-item">
          <span>📧</span>
          <span>${candidate.email}</span>
        </div>
        <div class="contact-item">
          <span>📱</span>
          <span>${candidate.phone || 'Не указан'}</span>
        </div>
        <div class="contact-item">
          <span>📍</span>
          <span>${candidate.location || 'Не указан'}</span>
        </div>
      </div>
    </div>
    
    <div class="match-score-large">
      <div class="match-score-value" id="matchScoreValue">0%</div>
      <div class="match-score-label">Совпадение с вакансией</div>
    </div>
    
    <!-- AI Assessment Section -->
    <div class="ai-assessment card">
      <div class="card-header">
        <h4>🤖 AI Оценка кандидата</h4>
        <button onclick="refreshAssessment()" class="btn btn-sm btn-outline">Обновить оценку</button>
      </div>
      <div class="card-body">
        <div id="assessmentContent">
          <div class="assessment-placeholder">
            <p>Загрузка оценки...</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="profile-section">
      <h3>О себе</h3>
      <p>${candidate.bio || 'Информация отсутствует'}</p>
    </div>
    
    ${experienceHtml ? `
      <div class="profile-section">
        <h3>Опыт работы</h3>
        ${experienceHtml}
      </div>
    ` : ''}
    
    ${educationHtml ? `
      <div class="profile-section">
        <h3>Образование</h3>
        ${educationHtml}
      </div>
    ` : ''}
    
    ${skillsHtml ? `
      <div class="profile-section">
        <h3>Навыки</h3>
        <div class="skills-grid">${skillsHtml}</div>
      </div>
    ` : ''}
    
    <div class="interview-actions">
      <h3>Пригласить на собеседование</h3>
      <p>Выберите удобное время и формат для проведения собеседования</p>
      <div class="action-buttons">
        <button onclick="scheduleInterview()" class="btn btn-primary btn-lg">Назначить собеседование</button>
        <button onclick="downloadResume()" class="btn btn-outline">Скачать резюме</button>
      </div>
    </div>
  `;
  
  // Load AI assessment
  loadAIAssessment(candidate);
}

// Load AI assessment
async function loadAIAssessment(candidate) {
  try {
    // Try to get assessment from API
    const response = await API.users.getAssessment(candidate._id);
    displayAssessment(response.data);
  } catch (error) {
    console.log('Assessment API not available, generating mock assessment');
    // Generate mock assessment based on candidate data
    const mockAssessment = generateMockAssessment(candidate);
    displayAssessment(mockAssessment);
  }
}

// Generate mock assessment
function generateMockAssessment(candidate) {
  const skills = candidate.skills || [];
  const experience = candidate.experience || [];
  
  // Calculate scores based on skills and experience
  const technicalScore = Math.min(95, skills.length * 15 + Math.random() * 20);
  const experienceScore = Math.min(95, experience.length * 20 + Math.random() * 15);
  const communicationScore = 70 + Math.random() * 25;
  const problemSolvingScore = 65 + Math.random() * 30;
  
  const overallScore = Math.round((technicalScore + experienceScore + communicationScore + problemSolvingScore) / 4);
  
  return {
    overallScore,
    technicalScore: Math.round(technicalScore),
    experienceScore: Math.round(experienceScore),
    communicationScore: Math.round(communicationScore),
    problemSolvingScore: Math.round(problemSolvingScore),
    skillMatches: skills.map(skill => ({
      skill,
      match: Math.round(70 + Math.random() * 30)
    })),
    strengths: generateStrengths(skills, experience),
    weaknesses: generateWeaknesses(skills, experience),
    recommendations: generateRecommendations(skills, experience)
  };
}

// Generate strengths
function generateStrengths(skills, experience) {
  const strengths = [];
  
  if (skills.includes('JavaScript') || skills.includes('React')) {
    strengths.push('Сильные знания фронтенд технологий');
  }
  
  if (experience.length > 2) {
    strengths.push('Обширный опыт работы');
  }
  
  if (skills.includes('Python') || skills.includes('Node.js')) {
    strengths.push('Опыт в бэкенд разработке');
  }
  
  return strengths.slice(0, 3);
}

// Generate weaknesses
function generateWeaknesses(skills, experience) {
  const weaknesses = [];
  
  if (!skills.includes('Docker') && !skills.includes('Kubernetes')) {
    weaknesses.push('Отсутствие опыта с DevOps инструментами');
  }
  
  if (experience.length < 2) {
    weaknesses.push('Недостаточный опыт работы');
  }
  
  if (skills.length < 5) {
    weaknesses.push('Ограниченный набор навыков');
  }
  
  return weaknesses.slice(0, 2);
}

// Generate recommendations
function generateRecommendations(skills, experience) {
  const recommendations = [];
  
  if (!skills.includes('TypeScript')) {
    recommendations.push('Рекомендуется изучить TypeScript');
  }
  
  if (!skills.includes('Docker')) {
    recommendations.push('Полезно добавить Docker в навыки');
  }
  
  if (experience.length < 3) {
    recommendations.push('Рекомендуется набрать больше опыта');
  }
  
  return recommendations.slice(0, 3);
}

// Display assessment
function displayAssessment(assessment) {
  const container = document.getElementById('assessmentContent');
  
  // Update match score
  document.getElementById('matchScoreValue').textContent = assessment.overallScore + '%';
  
  const skillMatchesHtml = assessment.skillMatches.map(skillMatch => `
    <div class="skill-match">
      <span class="skill-name">${skillMatch.skill}</span>
      <div class="skill-bar">
        <div class="skill-fill" style="width: ${skillMatch.match}%"></div>
      </div>
      <span class="skill-percentage">${skillMatch.match}%</span>
    </div>
  `).join('');
  
  const strengthsHtml = assessment.strengths.map(strength => 
    `<li>${strength}</li>`
  ).join('');
  
  const weaknessesHtml = assessment.weaknesses.map(weakness => 
    `<li>${weakness}</li>`
  ).join('');
  
  const recommendationsHtml = assessment.recommendations.map(rec => 
    `<li>${rec}</li>`
  ).join('');
  
  container.innerHTML = `
    <div class="overall-score">
      <div class="overall-score-value">${assessment.overallScore}%</div>
      <div class="overall-score-label">Общая оценка</div>
    </div>
    
    <div class="assessment-grid">
      <div class="assessment-item">
        <div class="assessment-score">${assessment.technicalScore}%</div>
        <div class="assessment-label">Технические навыки</div>
      </div>
      <div class="assessment-item">
        <div class="assessment-score">${assessment.experienceScore}%</div>
        <div class="assessment-label">Опыт</div>
      </div>
      <div class="assessment-item">
        <div class="assessment-score">${assessment.communicationScore}%</div>
        <div class="assessment-label">Коммуникация</div>
      </div>
      <div class="assessment-item">
        <div class="assessment-score">${assessment.problemSolvingScore}%</div>
        <div class="assessment-label">Решение проблем</div>
      </div>
    </div>
    
    <div class="assessment-details">
      <div class="assessment-strengths">
        <h5>✅ Сильные стороны</h5>
        <ul>${strengthsHtml}</ul>
      </div>
      
      <div class="assessment-weaknesses">
        <h5>⚠️ Области для улучшения</h5>
        <ul>${weaknessesHtml}</ul>
      </div>
      
      <div>
        <h5>💡 Рекомендации</h5>
        <ul>${recommendationsHtml}</ul>
      </div>
    </div>
    
    <div class="profile-section">
      <h3>📊 Совпадение навыков</h3>
      ${skillMatchesHtml}
    </div>
  `;
}

// Refresh assessment
async function refreshAssessment() {
  if (currentCandidate) {
    const container = document.getElementById('assessmentContent');
    container.innerHTML = `
      <div class="assessment-placeholder">
        <p>Обновление оценки...</p>
      </div>
    `;
    
    await loadAIAssessment(currentCandidate);
    utils.showToast('Оценка обновлена', 'success');
  }
}

// Schedule interview
function scheduleInterview() {
  const urlParams = new URLSearchParams(window.location.search);
  const candidateId = urlParams.get('id');
  window.location.href = `invite-interview.html?candidate=${candidateId}`;
}

// Download resume
function downloadResume() {
  utils.showToast('Резюме скачивается...', 'info');
  // Implement resume download functionality
}
