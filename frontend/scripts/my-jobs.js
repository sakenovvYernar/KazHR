// Protect page - only employers can access
utils.protectPage();
utils.protectRole('employer');

let allJobs = [];

// Load jobs on page load
document.addEventListener('DOMContentLoaded', function() {
  loadJobs();
});

// Load all jobs
async function loadJobs() {
  try {
    const response = await API.jobs.getMyJobs();
    allJobs = response.data;
    
    updateStats();
    displayJobs(allJobs);
  } catch (error) {
    console.error('Error loading jobs:', error);
    utils.showToast('Ошибка загрузки объявлений', 'error');
  }
}

// Update statistics
function updateStats() {
  const activeJobs = allJobs.filter(job => job.status === 'active');
  const closedJobs = allJobs.filter(job => job.status === 'closed');
  const totalApplications = allJobs.reduce((sum, job) => sum + (job.applicationsCount || 0), 0);
  const interviews = allJobs.reduce((sum, job) => sum + (job.interviewsCount || 0), 0);
  
  document.getElementById('activeJobsCount').textContent = activeJobs.length;
  document.getElementById('closedJobsCount').textContent = closedJobs.length;
  document.getElementById('totalApplicationsCount').textContent = totalApplications;
  document.getElementById('interviewsCount').textContent = interviews;
}

// Display jobs
function displayJobs(jobs) {
  const container = document.getElementById('jobsContainer');
  
  if (jobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state text-center p-4">
        <p class="text-secondary">У вас пока нет объявлений</p>
        <button onclick="window.location.href='create-job.html'" class="btn btn-primary mt-2">
          Создать первое объявление
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = jobs.map(job => `
    <div class="job-card card mb-4">
      <div class="card-body">
        <div class="flex-between">
          <div class="job-info">
            <h3>${job.title}</h3>
            <p class="text-secondary">${job.companyName}</p>
            <p class="text-secondary">${job.location} • ${job.type || 'Полная занятость'}</p>
            <p class="text-sm text-secondary mt-1">
              Опубликовано ${utils.formatRelativeTime(job.createdAt)}
            </p>
          </div>
          <div class="job-actions">
            <span class="badge ${utils.getStatusBadgeClass(job.status)}">
              ${utils.getStatusText(job.status)}
            </span>
            <div class="mt-2">
              <span class="applications-count">${job.applicationsCount || 0} откликов</span>
            </div>
            <div class="mt-2">
              <a href="job-details.html?id=${job._id}" class="btn btn-sm btn-outline">Подробнее</a>
            </div>
            <div class="mt-2">
              <button onclick="viewApplications('${job._id}')" class="btn btn-sm btn-primary">Отклики</button>
            </div>
            <div class="mt-2">
              <button onclick="editJob('${job._id}')" class="btn btn-sm btn-outline">Редактировать</button>
              ${job.status === 'active' ? 
                `<button onclick="closeJob('${job._id}')" class="btn btn-sm btn-danger">Закрыть</button>` :
                `<button onclick="reopenJob('${job._id}')" class="btn btn-sm btn-success">Активировать</button>`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Filter jobs
function filterJobs() {
  const statusFilter = document.getElementById('statusFilter').value;
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  let filteredJobs = allJobs;
  
  if (statusFilter) {
    filteredJobs = filteredJobs.filter(job => job.status === statusFilter);
  }
  
  if (searchTerm) {
    filteredJobs = filteredJobs.filter(job => 
      job.title.toLowerCase().includes(searchTerm) ||
      job.description.toLowerCase().includes(searchTerm)
    );
  }
  
  displayJobs(filteredJobs);
}

// View applications
async function viewApplications(jobId) {
  console.log('Loading applications for job:', jobId);
  
  try {
    console.log('Making API call to /applications/job/' + jobId);
    const response = await API.applications.getForJob(jobId);
    console.log('API response:', response);
    
    const applications = response.data || [];
    console.log('Applications loaded:', applications);
    
    if (applications.length === 0) {
      utils.showToast('На эту вакансию еще нет откликов', 'info');
      return;
    }
    
    // Create modal to show applications
    const modalHtml = `
      <div id="applicationsModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>📋 Отклики на вакансию</h3>
            <button onclick="closeApplicationsModal()" class="btn btn-outline btn-sm">✕</button>
          </div>
          <div class="modal-body">
            <div class="applications-list">
              ${applications.map(app => `
                <div class="application-item" data-job-id="${jobId}" data-application-id="${app._id}">
                  <div class="applicant-info">
                    <div class="applicant-header">
                      <div class="applicant-avatar">${app.userId?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'К'}</div>
                      <div class="applicant-details">
                        <h4>${app.userId?.name || 'Кандидат'}</h4>
                        <p>📧 ${app.userId?.email || 'email@example.com'}</p>
                        <p>📱 ${app.userId?.phone || 'Не указан'}</p>
                        <p class="application-date">Отклик: ${utils.formatRelativeTime(app.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <div class="application-actions">
                    <div class="match-score">Совпадение: ${app.matchScore || 0}%</div>
                    <div class="action-buttons">
                      <button onclick="viewCandidate('${app.userId?._id}')" class="btn btn-primary btn-sm">Профиль</button>
                      <button onclick="inviteToInterview('${app._id}', '${app.userId?._id}')" class="btn btn-success btn-sm">Пригласить</button>
                      <button onclick="updateApplicationStatus('${app._id}', 'rejected')" class="btn btn-danger btn-sm">Отклонить</button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="modal-backdrop" onclick="closeApplicationsModal()"></div>
      </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add styles for applications modal
    if (!document.getElementById('applicationsModalStyles')) {
      const styles = document.createElement('style');
      styles.id = 'applicationsModalStyles';
      styles.textContent = `
        .applications-modal {
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .applications-list {
          max-height: 60vh;
          overflow-y: auto;
        }
        
        .application-item {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
          background: white;
        }
        
        .application-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .applicant-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .applicant-avatar {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
        }
        
        .applicant-details {
          flex: 1;
        }
        
        .applicant-details h4 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }
        
        .applicant-details p {
          margin: 0.25rem 0;
          color: #6b7280;
          font-size: 0.9rem;
        }
        
        .application-date {
          font-size: 0.8rem;
          color: #9ca3af;
          margin-top: 0.5rem;
        }
        
        .application-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }
        
        .match-score {
          background: #10b981;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          font-weight: 600;
          font-size: 0.9rem;
        }
        
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .action-buttons .btn {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
          .application-item {
            flex-direction: column;
            gap: 1rem;
          }
          
          .application-actions {
            flex-direction: column;
            align-items: stretch;
          }
          
          .action-buttons {
            flex-direction: column;
            gap: 0.5rem;
          }
          .action-buttons .btn {
            width: 100%;
          }
        }
      `;
      document.head.appendChild(styles);
    }
    
  } catch (error) {
    console.error('Error loading applications:', error);
    console.error('Error details:', error.message, error.stack);
    utils.showToast('Ошибка загрузки откликов', 'error');
  }
}

// Close applications modal
function closeApplicationsModal() {
  const modal = document.getElementById('applicationsModal');
  if (modal) {
    modal.remove();
  }
}

// Update application status
async function updateApplicationStatus(applicationId, status) {
  try {
    await API.applications.updateStatus(applicationId, status);
    utils.showToast(`Статус обновлен: ${utils.getStatusText(status)}`, 'success');
    
    // Reload applications if modal is open
    const modal = document.getElementById('applicationsModal');
    if (modal) {
      const jobTitle = document.querySelector('.modal-header h3').textContent.replace('📋 Отклики на вакансию', '');
      const jobId = Array.from(document.querySelectorAll('.application-item')).find(item => 
        item.querySelector('.action-buttons button[onclick*="' + applicationId + '"]')
      )?.closest('.application-item')?.dataset.jobId;
      
      if (jobId) {
        viewApplications(jobId);
      }
    }
  } catch (error) {
    console.error('Error updating application status:', error);
    utils.showToast('Ошибка обновления статуса', 'error');
  }
}

// Invite to interview
function inviteToInterview(applicationId, candidateId) {
  window.location.href = `invite-interview.html?application=${applicationId}&candidate=${candidateId}`;
}

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
    loadJobs();
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
    loadJobs();
  } catch (error) {
    console.error('Error reopening job:', error);
    utils.showToast('Ошибка активации вакансии', 'error');
  }
}
