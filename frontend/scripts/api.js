// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Mock data for demonstration
const MOCK_DATA = {
  candidates: [
    {
      _id: 'candidate1',
      name: 'Айдар Сапаров',
      email: 'aidar@example.com',
      role: 'jobseeker',
      title: 'Senior Frontend Developer',
      location: 'Алматы',
      bio: 'Восторженный разработчик с 5-летним опытом в веб-разработке. Специализируюсь на React и Node.js.',
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'HTML', 'CSS'],
      experience: '5-plus',
      createdAt: new Date('2024-01-15')
    },
    {
      _id: 'candidate2',
      name: 'Динара Амирова',
      email: 'dinara@example.com',
      role: 'jobseeker',
      title: 'Backend Developer',
      location: 'Астана',
      bio: 'Разработчик серверной части с опытом в создании масштабируемых API и микросервисов.',
      skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'AWS'],
      experience: '3-5',
      createdAt: new Date('2024-01-20')
    },
    {
      _id: 'candidate3',
      name: 'Бекзат Нурлыбаев',
      email: 'bekzat@example.com',
      role: 'jobseeker',
      title: 'Full Stack Developer',
      location: 'Шымкент',
      bio: 'Full-stack разработчик с опытом работы над различными проектами от стартапов до крупных предприятий.',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Vue.js'],
      experience: '3-5',
      createdAt: new Date('2024-01-10')
    },
    {
      _id: 'candidate4',
      name: 'Айгуль Касымова',
      email: 'aigul@example.com',
      role: 'jobseeker',
      title: 'UI/UX Designer',
      location: 'Алматы',
      bio: 'Дизайнер с фокусом на создание интуитивных и красивых пользовательских интерфейсов.',
      skills: ['Figma', 'Adobe XD', 'Sketch', 'CSS', 'JavaScript'],
      experience: '1-3',
      createdAt: new Date('2024-01-25')
    },
    {
      _id: 'candidate5',
      name: 'Ерлан Жумабаев',
      email: 'erlan@example.com',
      role: 'jobseeker',
      title: 'DevOps Engineer',
      location: 'Удаленно',
      bio: 'Специалист по DevOps с опытом в автоматизации и оптимизации инфраструктуры.',
      skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux'],
      experience: '5-plus',
      createdAt: new Date('2024-01-18')
    },
    {
      _id: 'candidate6',
      name: 'Мадина Сулейменова',
      email: 'madina@example.com',
      role: 'jobseeker',
      title: 'Mobile Developer',
      location: 'Алматы',
      bio: 'Разработчик мобильных приложений с опытом в iOS и Android разработке.',
      skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase'],
      experience: '1-3',
      createdAt: new Date('2024-01-12')
    }
  ],
  
  applications: [
    {
      _id: 'app1',
      userId: {
        _id: 'candidate1',
        name: 'Айдар Сапаров',
        email: 'aidar@example.com',
        phone: '+7 701 234 56 78'
      },
      jobId: 'job1',
      status: 'pending',
      matchScore: 92,
      createdAt: new Date('2024-01-20')
    },
    {
      _id: 'app2',
      userId: {
        _id: 'candidate2',
        name: 'Динара Амирова',
        email: 'dinara@example.com',
        phone: '+7 702 345 67 89'
      },
      jobId: 'job1',
      status: 'pending',
      matchScore: 87,
      createdAt: new Date('2024-01-21')
    },
    {
      _id: 'app3',
      userId: {
        _id: 'candidate3',
        name: 'Бекзат Нурлыбаев',
        email: 'bekzat@example.com',
        phone: '+7 703 456 78 90'
      },
      jobId: 'job1',
      status: 'reviewing',
      matchScore: 78,
      createdAt: new Date('2024-01-19')
    }
  ],
  
  jobs: [
    {
      _id: 'job1',
      title: 'Senior Frontend Developer',
      companyName: 'Tech Company',
      location: 'Алматы',
      type: 'full-time',
      status: 'active',
      description: 'Ищем опытного Frontend разработчика для работы над инновационными проектами.',
      requirements: '5+ лет опыта с React, TypeScript, Node.js',
      skills: ['JavaScript', 'React', 'TypeScript', 'Node.js'],
      experience: '5-plus',
      applicationsCount: 3,
      interviewsCount: 1,
      createdAt: new Date('2024-01-10')
    },
    {
      _id: 'job2',
      title: 'Backend Developer',
      companyName: 'Startup Inc',
      location: 'Астана',
      type: 'full-time',
      status: 'active',
      description: 'Нужен Backend разработчик для создания API и микросервисов.',
      requirements: 'Опыт с Python, Django, PostgreSQL',
      skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
      experience: '3-5',
      applicationsCount: 2,
      interviewsCount: 0,
      createdAt: new Date('2024-01-15')
    }
  ]
};

// Check API availability
const checkAPIAvailability = async () => {
  try {
    console.log('Checking API availability at:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ API is available');
      return true;
    } else {
      console.log('❌ API responded with status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ API is not available:', error.message);
    console.log('🔄 Using mock data for demonstration');
    return false;
  }
};

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Get user data from localStorage
const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Save auth data
const saveAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

// Clear auth data
const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!getAuthToken();
};

// API Request wrapper
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
const authAPI = {
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  getMe: () => apiRequest('/auth/me'),

  updateProfile: (profileData) => apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
};

// Jobs API
const jobsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/jobs${queryString ? '?' + queryString : ''}`);
  },

  getById: (id) => apiRequest(`/jobs/${id}`),

  create: (jobData) => apiRequest('/jobs', {
    method: 'POST',
    body: JSON.stringify(jobData),
  }),

  update: (id, jobData) => apiRequest(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(jobData),
  }),

  delete: (id) => apiRequest(`/jobs/${id}`, {
    method: 'DELETE',
  }),

  getMyJobs: () => apiRequest('/jobs/employer/mine'),
};

// Applications API
const applicationsAPI = {
  apply: (applicationData) => apiRequest('/applications', {
    method: 'POST',
    body: JSON.stringify(applicationData),
  }),

  getMine: () => apiRequest('/applications/mine'),

  getForJob: (jobId) => apiRequest(`/applications/job/${jobId}`),

  getById: (id) => apiRequest(`/applications/${id}`),

  updateStatus: (id, status) => apiRequest(`/applications/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),

  getApplicationsByUser: (userId) => apiRequest(`/applications/user/${userId}`),
};

// Interviews API
const interviewsAPI = {
  create: (interviewData) => apiRequest('/interviews', {
    method: 'POST',
    body: JSON.stringify(interviewData),
  }),

  analyze: (id, transcript) => apiRequest(`/interviews/${id}/analyze`, {
    method: 'POST',
    body: JSON.stringify({ transcript }),
  }),

  getMine: () => apiRequest('/interviews/mine'),

  getById: (id) => apiRequest(`/interviews/${id}`),
};

// Users API
const usersAPI = {
  getProfile: () => apiRequest('/auth/profile'),
  
  updateProfile: (profileData) => apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
  
  updateResume: (resumeData) => apiRequest('/auth/resume', {
    method: 'PUT',
    body: JSON.stringify(resumeData),
  }),
  
  getCandidates: () => apiRequest('/auth/candidates'),
  
  getById: (id) => apiRequest(`/auth/candidates/${id}`),
  
  getAssessment: (userId) => apiRequest(`/auth/assessment/${userId}`),
  
  generateAssessment: (userId) => apiRequest(`/auth/assessment/${userId}/generate`, {
    method: 'POST',
  }),
};

// Notifications API
const notificationsAPI = {
  getMine: () => apiRequest('/notifications/mine'),
  
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, {
    method: 'PUT',
  }),
  
  markAllAsRead: () => apiRequest('/notifications/read-all', {
    method: 'PUT',
  }),
  
  create: (notificationData) => apiRequest('/notifications', {
    method: 'POST',
    body: JSON.stringify(notificationData),
  }),
};

// Extended Interviews API
const interviewsAPIExtended = {
  ...interviewsAPI,
  
  getByCode: (code) => apiRequest(`/interviews/code/${code}`),
  
  inviteCandidate: (interviewData) => apiRequest('/interviews/invite', {
    method: 'POST',
    body: JSON.stringify(interviewData),
  }),
  
  updateStatus: (id, status) => apiRequest(`/interviews/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  
  getForJob: (jobId) => apiRequest(`/interviews/job/${jobId}`),
};

// Export all
window.API = {
  auth: authAPI,
  jobs: jobsAPI,
  applications: applicationsAPI,
  interviews: interviewsAPIExtended,
  users: usersAPI,
  notifications: notificationsAPI,
  helpers: {
    getAuthToken,
    getUser,
    saveAuthData,
    clearAuthData,
    isAuthenticated,
  },
  checkAPIAvailability
};
