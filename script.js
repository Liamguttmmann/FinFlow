document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('themeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const dropdown = document.querySelector('.dashboard-dropdown');
  const dropdownToggle = document.querySelector('.dashboard-dropdown-toggle');

  const storedTheme = localStorage.getItem('finflow_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
    document.body.classList.add('theme-dark');
    themeToggleIcon.textContent = '🌙';
  } else {
    themeToggleIcon.textContent = '☀️';
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('theme-dark');
    const isDark = document.body.classList.contains('theme-dark');
    themeToggleIcon.textContent = isDark ? '🌙' : '☀️';
    localStorage.setItem('finflow_theme', isDark ? 'dark' : 'light');
  });

  if (dropdown && dropdownToggle) {
    dropdownToggle.addEventListener('click', () => {
      const expanded = dropdown.getAttribute('aria-expanded') === 'true';
      dropdown.setAttribute('aria-expanded', String(!expanded));
      dropdownToggle.setAttribute('aria-expanded', String(!expanded));
    });

    document.addEventListener('click', (event) => {
      if (!dropdown.contains(event.target)) {
        dropdown.setAttribute('aria-expanded', 'false');
        dropdownToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
});
