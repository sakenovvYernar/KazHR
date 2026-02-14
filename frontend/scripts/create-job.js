// Protect page - only employers can access
utils.protectPage();
utils.protectRole('employer');

// Handle form submission
document.getElementById('jobForm').addEventListener('submit', async function(e) {
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
    status: 'active'
  };
  
  try {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    utils.showLoading(submitBtn);
    
    await API.jobs.create(jobData);
    
    utils.showToast('Вакансия успешно опубликована!', 'success');
    setTimeout(() => {
      window.location.href = 'my-jobs.html';
    }, 1500);
    
  } catch (error) {
    console.error('Error creating job:', error);
    utils.showToast('Ошибка создания вакансии', 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    utils.hideLoading(submitBtn);
  }
});

// Save as draft
async function saveDraft() {
  const formData = new FormData(document.getElementById('jobForm'));
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
    status: 'draft'
  };
  
  try {
    await API.jobs.create(jobData);
    utils.showToast('Черновик сохранен', 'success');
    setTimeout(() => {
      window.location.href = 'my-jobs.html';
    }, 1000);
  } catch (error) {
    console.error('Error saving draft:', error);
    utils.showToast('Ошибка сохранения черновика', 'error');
  }
}
