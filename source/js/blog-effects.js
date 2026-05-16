(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  function init() {
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
