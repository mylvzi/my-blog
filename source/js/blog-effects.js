(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INTRO_TEXT = "Welcome To Lvzi's Blog";

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateProgress() {
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    var progress = scrollable > 0 ? clamp(window.scrollY / scrollable, 0, 1) : 0;
    root.style.setProperty('--reading-progress', progress.toFixed(4));
  }

  function ensureProgressBar() {
    if (document.querySelector('.reading-progress')) return;
    var progress = document.createElement('div');
    progress.className = 'reading-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.innerHTML = '<span class="reading-progress__bar"></span>';
    document.body.appendChild(progress);
  }

  function syncPointer(event) {
    root.style.setProperty('--cursor-x', event.clientX + 'px');
    root.style.setProperty('--cursor-y', event.clientY + 'px');
  }

  function isHomePage() {
    var path = window.location.pathname.replace(/\/index\.html$/, '/');
    return path === '/';
  }

  function showIntroCover() {
    if (!isHomePage() || document.querySelector('.blog-intro-cover')) return;

    var cover = document.createElement('div');
    cover.className = 'blog-intro-cover';
    cover.setAttribute('aria-hidden', 'true');

    var title = document.createElement('div');
    title.className = 'blog-intro-title';
    title.textContent = INTRO_TEXT;
    cover.appendChild(title);
    document.body.appendChild(cover);
    document.body.classList.add('blog-intro-active');

    var hold = reduceMotion ? 450 : 1550;
    var exitDuration = reduceMotion ? 240 : 820;

    window.setTimeout(function () {
      cover.classList.add('is-leaving');
      document.body.classList.remove('blog-intro-active');
    }, hold);

    window.setTimeout(function () {
      cover.remove();
    }, hold + exitDuration);
  }

  function init() {
    showIntroCover();
    ensureProgressBar();
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);

    if (!reduceMotion && window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', syncPointer, { passive: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
