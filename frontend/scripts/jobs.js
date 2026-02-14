// Protect page
utils.protectPage();

const user = API.helpers.getUser();

// Load jobs on page load
loadJobs();

// Search function
async function searchJobs() {
  const search = document.getElementById('searchInput').value.trim();
  const location = document.getElementById('locationInput').value.trim();

  const params = {};
  if (search) params.search = search;
  if (location) params.location = location;

  await loadJobs(params);
}

// Load jobs
async function loadJobs(params = {}) {
  const container = document.getElementById('jobsContainer');

  container.innerHTML = `
    <div class="text-center p-4">
      <div class="spinner mx-auto"></div>
      <p class="mt-2">Loading jobs...</p>
    </div>
  `;

  try {
    const response = await API.jobs.getAll(params);
    displayJobs(response.data);
  } catch (error) {
    console.error('Error loading jobs:', error);
    container.innerHTML = `
      <div class="alert alert-error">
        Failed to load jobs. Please try again.
      </div>
    `;
  }
}

// Calculate match score if user is job seeker
function calculateMatchScore(job) {
  if (user.role !== 'jobseeker' || !user.skills || !job.requiredSkills) {
    return null;
  }

  const userSkills = user.skills.map(s => s.toLowerCase());
  const requiredSkills = job.requiredSkills.map(s => s.toLowerCase());

  const matchingSkills = requiredSkills.filter(skill => 
    userSkills.includes(skill)
  );

  return Math.round((matchingSkills.length / requiredSkills.length) * 100);
}

// Display jobs
function displayJobs(jobs) {
  const container = document.getElementById('jobsContainer');

  if (jobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state text-center p-4">
        <p class="text-secondary">No jobs found matching your criteria</p>
      </div>
    `;
    return;
  }

  // Sort by match score if job seeker
  if (user.role === 'jobseeker') {
    jobs = jobs.map(job => ({
      ...job,
      matchScore: calculateMatchScore(job)
    })).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }

  container.innerHTML = `
    <div class="jobs-grid">
      ${jobs.map(job => renderJobCard(job)).join('')}
    </div>
  `;
}

// Render individual job card
function renderJobCard(job) {
  const matchScore = user.role === 'jobseeker' ? (job.matchScore || calculateMatchScore(job)) : null;
  const salaryText = job.salary ? 
    `${job.salary.min?.toLocaleString()} - ${job.salary.max?.toLocaleString()} ${job.salary.currency || 'KZT'}` : 
    'Salary not specified';

  return `
    <div class="job-card card">
      <div class="job-header">
        <h3>${job.title}</h3>
        <p class="company-name">${job.companyName}</p>
      </div>
      
      <div class="job-meta">
        <span>📍 ${job.location}</span>
        <span>💰 ${salaryText}</span>
        <span>📅 ${utils.formatRelativeTime(job.createdAt)}</span>
      </div>

      ${matchScore !== null ? `
        <div class="match-badge ${matchScore >= 70 ? 'high-match' : matchScore >= 50 ? 'medium-match' : 'low-match'}">
          🎯 ${matchScore}% Match
        </div>
      ` : ''}

      <div class="job-description">
        ${utils.truncateText(job.description, 150)}
      </div>

      <div class="job-skills">
        ${job.requiredSkills.slice(0, 5).map(skill => `
          <span class="skill-tag">${skill}</span>
        `).join('')}
        ${job.requiredSkills.length > 5 ? `<span class="skill-tag">+${job.requiredSkills.length - 5} more</span>` : ''}
      </div>

      <div class="job-footer">
        ${user.role === 'jobseeker' ? `
          <button onclick="applyForJob('${job._id}')" class="btn btn-primary btn-block">
            Apply Now
          </button>
        ` : `
          <a href="job-details.html?id=${job._id}" class="btn btn-outline btn-block">
            View Details
          </a>
        `}
      </div>
    </div>
  `;
}

// Apply for job
async function applyForJob(jobId) {
  if (!confirm('Are you sure you want to apply for this job?')) {
    return;
  }

  try {
    await API.applications.apply({ jobId });
    utils.showToast('Application submitted successfully!', 'success');
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  } catch (error) {
    if (error.message.includes('already applied')) {
      utils.showToast('You have already applied for this job', 'warning');
    } else {
      utils.showToast(error.message || 'Failed to apply', 'error');
    }
  }
}

// Make function global
window.applyForJob = applyForJob;
