// Protect page
utils.protectPage();

const user = API.helpers.getUser();

// Display welcome message
document.getElementById('userWelcome').textContent = `Welcome, ${user.name}!`;

// Load appropriate dashboard based on role
if (user.role === 'jobseeker') {
  loadJobSeekerDashboard();
} else if (user.role === 'employer') {
  loadEmployerDashboard();
}

// ========== JOB SEEKER DASHBOARD ==========
async function loadJobSeekerDashboard() {
  const content = document.getElementById('dashboardContent');
  
  content.innerHTML = `
    <div class="dashboard-header mb-4">
      <h1>Job Seeker Dashboard</h1>
      <p class="text-secondary">Find your perfect match</p>
    </div>

    <!-- Quick Actions -->
    <div class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">Quick Actions</h3>
      </div>
      <div class="quick-actions">
        <a href="jobs.html" class="btn btn-primary">Browse Jobs</a>
        <a href="profile.html" class="btn btn-outline">Edit Profile</a>
        <button onclick="showJoinVideoCallModal()" class="btn btn-success">📹 Join Video Call</button>
      </div>
    </div>

    <!-- Upcoming Interviews -->
    <div class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">📹 Предстоящие собеседования</h3>
      </div>
      <div id="interviewsContainer">
        <div class="text-center p-4">
          <div class="spinner mx-auto"></div>
          <p class="mt-2">Загрузка собеседований...</p>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-3 mb-4">
      <div class="stat-card card text-center">
        <div class="stat-number" id="applicationsCount">0</div>
        <div class="stat-label">Applications</div>
      </div>
      <div class="stat-card card text-center">
        <div class="stat-number" id="interviewsCount">0</div>
        <div class="stat-label">Interviews</div>
      </div>
      <div class="stat-card card text-center">
        <div class="stat-number" id="skillsCount">0</div>
        <div class="stat-label">Skills</div>
      </div>
    </div>

    <!-- My Applications -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">My Applications</h3>
      </div>
      <div id="applicationsContainer">
        <div class="text-center p-4">
          <div class="spinner mx-auto"></div>
          <p class="mt-2">Loading applications...</p>
        </div>
      </div>
    </div>
  `;

  // Load data
  try {
    const [applications, interviews] = await Promise.all([
      API.applications.getMine(),
      API.interviews.getMine()
    ]);

    // Update stats
    document.getElementById('applicationsCount').textContent = applications.data.length;
    document.getElementById('interviewsCount').textContent = interviews.data.length;
    document.getElementById('skillsCount').textContent = user.skills?.length || 0;

    // Display applications and interviews
    displayApplications(applications.data);
    displayInterviews(interviews.data);
  } catch (error) {
    console.error('Error loading dashboard:', error);
    utils.showToast('Failed to load dashboard data', 'error');
  }
}

// Display applications list
function displayApplications(applications) {
  const container = document.getElementById('applicationsContainer');

  if (applications.length === 0) {
    container.innerHTML = `
      <div class="empty-state text-center p-4">
        <p class="text-secondary">No applications yet</p>
        <a href="jobs.html" class="btn btn-primary mt-2">Browse Jobs</a>
      </div>
    `;
    return;
  }

  container.innerHTML = applications.map(app => `
    <div class="application-item">
      <div class="flex-between">
        <div>
          <h4>${app.jobId?.title || 'Job Title'}</h4>
          <p class="text-secondary">${app.jobId?.companyName || 'Company'}</p>
          <p class="text-sm text-secondary mt-1">Applied ${utils.formatRelativeTime(app.createdAt)}</p>
        </div>
        <div class="text-right">
          <span class="badge ${utils.getStatusBadgeClass(app.status)}">
            ${utils.getStatusText(app.status)}
          </span>
          <div class="mt-2">
            <span class="match-score">Match: ${app.matchScore}%</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Display interviews list
function displayInterviews(interviews) {
  const container = document.getElementById('interviewsContainer');

  if (interviews.length === 0) {
    container.innerHTML = `
      <div class="empty-state text-center p-4">
        <p class="text-secondary">У вас нет запланированных собеседований</p>
        <p class="text-sm">Используйте кнопку "📹 Join Video Call" чтобы присоединиться к собеседованию по коду</p>
      </div>
    `;
    return;
  }

  container.innerHTML = interviews.map(interview => `
    <div class="interview-item">
      <div class="flex-between">
        <div>
          <h4>${interview.jobId?.title || 'Собеседование'}</h4>
          <p class="text-secondary">${interview.jobId?.companyName || 'Компания'}</p>
          <p class="text-sm text-secondary mt-1">
            📅 ${interview.date || 'Дата'} в ${interview.time || 'Время'}
          </p>
          <p class="text-sm text-primary">
            📹 Код для входа: <strong>${interview.code || 'XXXXXX'}</strong>
          </p>
        </div>
        <div class="text-right">
          <button onclick="joinInterviewByCode('${interview.code}')" class="btn btn-success btn-sm">
            Присоединиться
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Join interview by code
function joinInterviewByCode(code) {
  if (!code) {
    utils.showToast('Код собеседования не найден', 'error');
    return;
  }
  
  // Show join modal with pre-filled code
  showJoinVideoCallModal();
  setTimeout(() => {
    const codeInput = document.getElementById('videoCallCode');
    if (codeInput) {
      codeInput.value = code.toUpperCase();
    }
  }, 100);
}

// ========== EMPLOYER DASHBOARD ==========
async function loadEmployerDashboard() {
  const content = document.getElementById('dashboardContent');
  
  content.innerHTML = `
    <div class="dashboard-header mb-4">
      <h1>Employer Dashboard</h1>
      <p class="text-secondary">Manage your hiring process</p>
    </div>

    <!-- Quick Actions -->
    <div class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">Quick Actions</h3>
      </div>
      <div class="quick-actions">
        <button onclick="window.location.href='create-job.html'" class="btn btn-primary">
          + Post New Job
        </button>
        <a href="my-jobs.html" class="btn btn-outline">View My Jobs</a>
        <a href="candidates.html" class="btn btn-outline">View Candidates</a>
        <button onclick="showStartVideoCallModal()" class="btn btn-success">📹 Start Video Call</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-3 mb-4">
      <div class="stat-card card text-center">
        <div class="stat-number" id="activeJobsCount">0</div>
        <div class="stat-label">Active Jobs</div>
      </div>
      <div class="stat-card card text-center">
        <div class="stat-number" id="totalApplicationsCount">0</div>
        <div class="stat-label">Total Applications</div>
      </div>
      <div class="stat-card card text-center">
        <div class="stat-number" id="interviewsCount">0</div>
        <div class="stat-label">Interviews</div>
      </div>
    </div>

    <!-- My Jobs -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">My Recent Jobs</h3>
      </div>
      <div id="jobsContainer">
        <div class="text-center p-4">
          <div class="spinner mx-auto"></div>
          <p class="mt-2">Loading jobs...</p>
        </div>
      </div>
    </div>
  `;

  // Load data
  try {
    const [jobs, interviews] = await Promise.all([
      API.jobs.getMyJobs(),
      API.interviews.getMine()
    ]);

    // Calculate stats
    const activeJobs = jobs.data.filter(j => j.status === 'active');
    const totalApplications = jobs.data.reduce((sum, job) => sum + (job.applicationsCount || 0), 0);

    // Update stats
    document.getElementById('activeJobsCount').textContent = activeJobs.length;
    document.getElementById('totalApplicationsCount').textContent = totalApplications;
    document.getElementById('interviewsCount').textContent = interviews.data.length;

    // Display jobs
    displayJobs(jobs.data);
  } catch (error) {
    console.error('Error loading dashboard:', error);
    utils.showToast('Failed to load dashboard data', 'error');
  }
}

// Display jobs list
function displayJobs(jobs) {
  const container = document.getElementById('jobsContainer');

  if (jobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state text-center p-4">
        <p class="text-secondary">No jobs posted yet</p>
        <button onclick="window.location.href='create-job.html'" class="btn btn-primary mt-2">
          Post Your First Job
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = jobs.slice(0, 5).map(job => `
    <div class="job-item">
      <div class="flex-between">
        <div>
          <h4>${job.title}</h4>
          <p class="text-secondary">${job.location}</p>
          <p class="text-sm text-secondary mt-1">Posted ${utils.formatRelativeTime(job.createdAt)}</p>
        </div>
        <div class="text-right">
          <span class="badge ${utils.getStatusBadgeClass(job.status)}">
            ${utils.getStatusText(job.status)}
          </span>
          <div class="mt-2">
            <span class="applications-count">${job.applicationsCount || 0} applications</span>
          </div>
          <div class="mt-2">
            <a href="job-details.html?id=${job._id}" class="btn btn-sm btn-outline">View Details</a>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Show join video call modal for job seekers
function showJoinVideoCallModal() {
  const modalHtml = `
    <div id="videoCallModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>📹 Присоединиться к видеозвонку</h3>
          <button onclick="closeVideoCallModal()" class="btn btn-outline btn-sm">✕</button>
        </div>
        <div class="modal-body">
          <p>Введите код комнаты для присоединения к видеозвонку:</p>
          <div class="form-group">
            <input type="text" id="videoCallCode" class="form-control" placeholder="XXXXXX" 
                   maxlength="6" style="text-transform: uppercase; letter-spacing: 2px; text-align: center; font-size: 1.5rem;">
          </div>
          <div class="form-group">
            <input type="text" id="participantName" class="form-control" placeholder="Ваше имя" value="${user.name}">
          </div>
          <div class="modal-actions">
            <button onclick="joinVideoCall()" class="btn btn-primary btn-lg">Присоединиться</button>
            <button onclick="closeVideoCallModal()" class="btn btn-outline">Отмена</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop" onclick="closeVideoCallModal()"></div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Add styles for modal
  if (!document.getElementById('videoCallModalStyles')) {
    const styles = document.createElement('style');
    styles.id = 'videoCallModalStyles';
    styles.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      
      .modal-content {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
        position: relative;
        z-index: 10000;
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      
      .modal-header h3 {
        margin: 0;
        color: #1f2937;
      }
      
      .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
      }
      
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        z-index: 9998;
      }
      
      @media (max-width: 768px) {
        .modal-content {
          width: 95%;
          padding: 1.5rem;
        }
        
        .modal-actions {
          flex-direction: column;
        }
        
        .modal-actions .btn {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(styles);
  }
  
  // Focus on code input
  setTimeout(() => {
    document.getElementById('videoCallCode').focus();
  }, 100);
}

// Show start video call modal
function showStartVideoCallModal() {
  const modalHtml = `
    <div id="videoCallModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>📹 Начать видеозвонок</h3>
          <button onclick="closeVideoCallModal()" class="btn btn-outline btn-sm">✕</button>
        </div>
        <div class="modal-body">
          <p>Введите код комнаты для присоединения к видеозвонку:</p>
          <div class="form-group">
            <input type="text" id="videoCallCode" class="form-control" placeholder="XXXXXX" 
                   maxlength="6" style="text-transform: uppercase; letter-spacing: 2px; text-align: center; font-size: 1.5rem;">
          </div>
          <div class="form-group">
            <input type="text" id="participantName" class="form-control" placeholder="Ваше имя">
          </div>
          <div class="modal-actions">
            <button onclick="joinVideoCall()" class="btn btn-primary btn-lg">Присоединиться</button>
            <button onclick="closeVideoCallModal()" class="btn btn-outline">Отмена</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop" onclick="closeVideoCallModal()"></div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Add styles for modal
  if (!document.getElementById('videoCallModalStyles')) {
    const styles = document.createElement('style');
    styles.id = 'videoCallModalStyles';
    styles.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      
      .modal-content {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
        position: relative;
        z-index: 10000;
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      
      .modal-header h3 {
        margin: 0;
        color: #1f2937;
      }
      
      .modal-body {
        text-align: center;
      }
      
      .modal-body p {
        margin-bottom: 1.5rem;
        color: #6b7280;
      }
      
      .form-group {
        margin-bottom: 1.5rem;
      }
      
      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 1rem;
      }
      
      .form-control:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
      }
      
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        z-index: 9998;
      }
      
      @media (max-width: 768px) {
        .modal-content {
          width: 95%;
          padding: 1.5rem;
        }
        
        .modal-actions {
          flex-direction: column;
        }
      }
    `;
    document.head.appendChild(styles);
  }
  
  // Auto-format code input
  const codeInput = document.getElementById('videoCallCode');
  codeInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });
  
  // Focus on code input
  setTimeout(() => {
    codeInput.focus();
  }, 100);
}

// Close video call modal
function closeVideoCallModal() {
  const modal = document.getElementById('videoCallModal');
  if (modal) {
    modal.remove();
  }
}

// Join video call
function joinVideoCall() {
  const code = document.getElementById('videoCallCode').value.trim();
  const name = document.getElementById('participantName').value.trim();
  
  if (!code || !name) {
    utils.showToast('Пожалуйста, введите код и имя', 'error');
    return;
  }
  
  // Redirect to interview room
  window.location.href = `interview-room.html?code=${code}`;
}
