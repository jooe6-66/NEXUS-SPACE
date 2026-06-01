/* DARK MODE TOGGLE */

(function () {
  const STORAGE_KEY = 'nexus-theme';
  const html        = document.documentElement;
  const toggleBtn   = document.getElementById('darkModeToggle');

  const saved = localStorage.getItem(STORAGE_KEY) || 'light';
  html.setAttribute('data-theme', saved);
  updateIcon(saved);

  toggleBtn?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY, next);
    updateIcon(next);
  });

  function updateIcon(theme) {
    if (!toggleBtn) return;
    const icon  = toggleBtn.querySelector('i');
    icon.className = theme === 'light' ? 'ti ti-moon' : 'ti ti-sun';
  }
})();
