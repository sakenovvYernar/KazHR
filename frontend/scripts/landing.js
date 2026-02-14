// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.boxShadow = '0 4px 20px rgba(255, 107, 53, 0.2)';
  } else {
    navbar.style.boxShadow = '0 2px 10px rgba(255, 107, 53, 0.1)';
  }
});

// Animate elements on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-fadeIn');
      entry.target.style.opacity = '1';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe feature cards, process steps, and stats cards
setTimeout(() => {
  const elements = document.querySelectorAll('.feature-card, .process-step, .stats-card');
  elements.forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}, 100);

// Counter animation for stats
function animateCounter(element, target) {
  let current = 0;
  const increment = target / 100;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target.toString() + (element.textContent.includes('%') ? '%' : '');
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current).toString() + (element.textContent.includes('%') ? '%' : '');
    }
  }, 20);
}

// Animate counters when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
      entry.target.classList.add('counted');
      const numbers = entry.target.querySelectorAll('.stat-number, .stats-number');
      numbers.forEach(num => {
        const text = num.textContent;
        const value = parseInt(text);
        if (!isNaN(value)) {
          num.textContent = '0' + (text.includes('%') ? '%' : '');
          animateCounter(num, value);
        }
      });
    }
  });
}, { threshold: 0.5 });

setTimeout(() => {
  const statsSection = document.querySelector('.stats-section');
  const heroStats = document.querySelector('.hero-stats');
  if (statsSection) statsObserver.observe(statsSection);
  if (heroStats) statsObserver.observe(heroStats);
}, 100);
