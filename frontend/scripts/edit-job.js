// Protect page - only employers can access
utils.protectPage();
utils.protectRole('employer');

let currentJob = null;

// Load job data on page load
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');
  
  if (jobId) {
    loadJobData(jobId);
  } else {
    utils.showToast('ID вакансии не указан', 'error');
    window.location.href = 'my-jobs.html';
  }
});

// Load job data
async function loadJobData(jobId) {
  try {
    const response = await API.jobs.getById(jobId);
    currentJob = response.data;
    
    // Fill form fields
    document.getElementById('title').value = currentJob.title || '';
    document.getElementById('location').value = currentJob.location || '';
    document.getElementById('type').value = currentJob.type || '';
    document.getElementById('salary').value = currentJob.salary || '';
    document.getElementById('description').value = currentJob.description || '';
    document.getElementById('requirements').value = currentJob.requirements || '';
    document.getElementById('skills').value = currentJob.skills ? currentJob.skills.join(', ') : '';
    document.getElementById('experience').value = currentJob.experience || '';
    document.getElementById('companyDescription').value = currentJob.companyDescription || '';
    document.getElementById('status').value = currentJob.status || 'active';
    
  } catch (error) {
    console.error('Error loading job data:', error);
    utils.showToast('Ошибка загрузки вакансии', 'error');
  }
}

// Handle form submission
document.getElementById('editJobForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const jobData = {
    title: formData.get('title'),
    location: formData.get('location'),
    type: formData.get('type'),
    salary: formData.get('salary'),
    description: formData.get('description'),
    requirements: formData.get('requirements'),
    skills: formData.get('skills') ? formData.get('skills').split(',').map(s => s.trim()) : [],
    experience: formData.get('experience'),
    companyDescription: formData.get('companyDescription'),
    status: formData.get('status')
  };
  
  try {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    utils.showLoading(submitBtn);
    
    await API.jobs.update(currentJob._id, jobData);
    
    utils.showToast('Вакансия успешно обновлена!', 'success');
    setTimeout(() => {
      window.location.href = 'my-jobs.html';
    }, 1500);
    
  } catch (error) {
    console.error('Error updating job:', error);
    utils.showToast('Ошибка обновления вакансии', 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    utils.hideLoading(submitBtn);
  }
});

// Delete job
async function deleteJob() {
  if (!confirm('Вы уверены, что хотите удалить эту вакансию? Это действие нельзя отменить.')) {
    return;
  }
  
  try {
    await API.jobs.delete(currentJob._id);
    utils.showToast('Вакансия удалена', 'success');
    setTimeout(() => {
      window.location.href = 'my-jobs.html';
    }, 1000);
  } catch (error) {
    console.error('Error deleting job:', error);
    utils.showToast('Ошибка удаления вакансии', 'error');
  }
}
