(function () {
  var STORAGE_KEY = 'stellar-theme-preference';
  var root = document.documentElement;
  var mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function resolveTheme() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return mediaQuery && mediaQuery.matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  }

  function iconMarkup(theme) {
    if (theme === 'dark') {
      return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke-width="1.8"></circle><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" stroke-width="1.8" stroke-linecap="round"></path></svg>';
  }

  function nextLabel(theme) {
    return theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题';
  }

  function updateButton(button, theme) {
    button.innerHTML = iconMarkup(theme);
    button.setAttribute('aria-label', nextLabel(theme));
    button.setAttribute('title', nextLabel(theme));
    button.dataset.theme = theme;
  }

  function ensureButton() {
    var existing = document.querySelector('.theme-toggle');
    if (existing) {
      return existing;
    }
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    button.setAttribute('aria-live', 'polite');
    document.body.appendChild(button);
    return button;
  }

  function syncFromSystem() {
    if (localStorage.getItem(STORAGE_KEY)) {
      return;
    }
    var theme = mediaQuery && mediaQuery.matches ? 'dark' : 'light';
    applyTheme(theme);
    var button = document.querySelector('.theme-toggle');
    if (button) {
      updateButton(button, theme);
    }
  }

  function init() {
    var theme = resolveTheme();
    applyTheme(theme);

    var button = ensureButton();
    updateButton(button, theme);
    button.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      updateButton(button, next);
    });

    if (mediaQuery) {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', syncFromSystem);
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(syncFromSystem);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
