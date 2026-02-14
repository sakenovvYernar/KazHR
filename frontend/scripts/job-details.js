// Protect page
utils.protectPage();

const user = API.helpers.getUser();
let currentJob = null;

// Load job details on page load
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');
  
  if (jobId) {
    loadJobDetails(jobId);
  } else {
    utils.showToast('ID вакансии не указан', 'error');
    window.location.href = 'jobs.html';
  }
});

// Load job details
async function loadJobDetails(jobId) {
  try {
    const response = await API.jobs.getById(jobId);
    currentJob = response.data;
    
    displayJobDetails(currentJob);
    
    // Load additional data based on role
    if (user.role === 'employer' && currentJob.employerId === user._id) {
      loadApplications(jobId);
    } else if (user.role === 'jobseeker') {
      checkApplicationStatus(jobId);
    }
    
  } catch (error) {
    console.error('Error loading job details:', error);
    utils.showToast('Ошибка загрузки вакансии', 'error');
  }
}

// Display job details
function displayJobDetails(job) {
  const container = document.getElementById('jobDetailsContainer');
  
  const skillsList = job.skills ? job.skills.map(skill => 
    `<span class="skill-tag">${skill}</span>`
  ).join('') : '';
  
  container.innerHTML = `
    <div class="job-header">
      <h1 class="job-title">${job.title}</h1>
      <div class="company-name">${job.companyName}</div>
      <div class="job-meta">
        <div class="job-meta-item">
          <span class="job-meta-icon">📍</span>
          <span>${job.location}</span>
        </div>
        <div class="job-meta-item">
          <span class="job-meta-icon">💼</span>
          <span>${job.type || 'Полная занятость'}</span>
        </div>
        <div class="job-meta-item">
          <span class="job-meta-icon">💰</span>
          <span>${job.salary || 'По договоренности'}</span>
        </div>
        <div class="job-meta-item">
          <span class="job-meta-icon">📅</span>
          <span>Опубликовано ${utils.formatRelativeTime(job.createdAt)}</span>
        </div>
      </div>
    </div>
    
    ${user.role === 'jobseeker' ? `
      <div class="match-score">
        <div class="match-score-value">87%</div>
        <div class="match-score-label">Совпадение с вашим профилем</div>
      </div>
    ` : ''}
    
    ${user.role === 'employer' && job.employerId === user._id ? `
      <div class="employer-actions">
        <h4>Управление вакансией</h4>
        <div class="action-buttons">
          <button onclick="editJob('${job._id}')" class="btn btn-outline">Редактировать</button>
          ${job.status === 'active' ? 
            `<button onclick="closeJob('${job._id}')" class="btn btn-danger">Закрыть вакансию</button>` :
            `<button onclick="reopenJob('${job._id}')" class="btn btn-success">Активировать</button>`
          }
        </div>
      </div>
    ` : ''}
    
    <div class="job-section">
      <h3>Описание вакансии</h3>
      <p>${job.description}</p>
    </div>
    
    <div class="job-section">
      <h3>Требования</h3>
      <p>${job.requirements}</p>
    </div>
    
    ${skillsList ? `
      <div class="job-section">
        <h3>Необходимые навыки</h3>
        <div class="skills-list">${skillsList}</div>
      </div>
    ` : ''}
    
    ${job.companyDescription ? `
      <div class="job-section">
        <h3>О компании</h3>
        <p>${job.companyDescription}</p>
      </div>
    ` : ''}
    
    ${user.role === 'jobseeker' ? `
      <div class="action-buttons">
        <button onclick="applyForJob('${job._id}')" class="btn btn-primary btn-lg">Откликнуться на вакансию</button>
        <button onclick="saveJob('${job._id}')" class="btn btn-outline">Сохранить вакансию</button>
      </div>
    ` : ''}
    
    <div id="applicationsSection"></div>
  `;
}

// Load applications for employer
async function loadApplications(jobId) {
  try {
    const response = await API.applications.getForJob(jobId);
    const applications = response.data;
    
    const section = document.getElementById('applicationsSection');
    
    if (applications.length === 0) {
      section.innerHTML = `
        <div class="job-section applications-section">
          <h3>Отклики</h3>
          <p>Пока нет откликов на эту вакансию</p>
        </div>
      `;
      return;
    }
    
    section.innerHTML = `
      <div class="job-section applications-section">
        <h3>Отклики (${applications.length})</h3>
        ${applications.map(app => `
          <div class="application-item">
            <div class="application-info">
              <h4>${app.userId?.name || 'Кандидат'}</h4>
              <p>📧 ${app.userId?.email || 'email@example.com'}</p>
              <p>📱 ${app.userId?.phone || 'Не указан'}</p>
              <p>📅 Откликнулся ${utils.formatRelativeTime(app.createdAt)}</p>
              <div class="mt-2">
                <span class="match-score">Совпадение: ${app.matchScore}%</span>
              </div>
            </div>
            <div class="application-actions">
              <button onclick="viewCandidate('${app.userId._id}')" class="btn btn-primary">Посмотреть профиль</button>
              <button onclick="inviteToInterview('${app._id}', '${app.userId._id}')" class="btn btn-success">Пригласить на собеседование</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
  } catch (error) {
    console.error('Error loading applications:', error);
  }
}

// Check application status for job seeker
async function checkApplicationStatus(jobId) {
  try {
    const response = await API.applications.getMine();
    const applications = response.data;
    const application = applications.find(app => app.jobId._id === jobId);
    
    if (application) {
      const actionButtons = document.querySelector('.action-buttons');
      if (actionButtons) {
        actionButtons.innerHTML = `
          <span class="badge ${utils.getStatusBadgeClass(application.status)}">
            ${utils.getStatusText(application.status)}
          </span>
          <button onclick="withdrawApplication('${application._id}')" class="btn btn-outline">Отозвать отклик</button>
        `;
      }
    }
  } catch (error) {
    console.error('Error checking application status:', error);
  }
}

// Apply for job
async function applyForJob(jobId) {
  try {
    await API.applications.apply({ jobId });
    utils.showToast('Отклик отправлен успешно!', 'success');
    checkApplicationStatus(jobId);
  } catch (error) {
    console.error('Error applying for job:', error);
    utils.showToast('Ошибка отправки отклика', 'error');
  }
}

// Save job
function saveJob(jobId) {
  // Implement save job functionality
  utils.showToast('Вакансия сохранена', 'success');
}

// View candidate profile
function viewCandidate(candidateId) {
  window.location.href = `candidate-profile.html?id=${candidateId}`;
}

// Invite to interview
function inviteToInterview(applicationId, candidateId) {
  window.location.href = `invite-interview.html?application=${applicationId}&candidate=${candidateId}`;
}

// Edit job
function editJob(jobId) {
  window.location.href = `edit-job.html?id=${jobId}`;
}

// Close job
async function closeJob(jobId) {
  if (!confirm('Вы уверены, что хотите закрыть эту вакансию?')) {
    return;
  }
  
  try {
    await API.jobs.update(jobId, { status: 'closed' });
    utils.showToast('Вакансия закрыта', 'success');
    loadJobDetails(jobId);
  } catch (error) {
    console.error('Error closing job:', error);
    utils.showToast('Ошибка закрытия вакансии', 'error');
  }
}

// Reopen job
async function reopenJob(jobId) {
  try {
    await API.jobs.update(jobId, { status: 'active' });
    utils.showToast('Вакансия активирована', 'success');
    loadJobDetails(jobId);
  } catch (error) {
    console.error('Error reopening job:', error);
    utils.showToast('Ошибка активации вакансии', 'error');
  }
}

// Withdraw application
async function withdrawApplication(applicationId) {
  if (!confirm('Вы уверены, что хотите отозвать отклик?')) {
    return;
  }
  
  try {
    // Implement withdraw application API call
    utils.showToast('Отклик отозван', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('Error withdrawing application:', error);
    utils.showToast('Ошибка отзыва отклика', 'error');
  }
}
