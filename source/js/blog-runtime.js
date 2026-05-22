(function () {
  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) {
      node.textContent = String(value);
    }
  }

  function updateRuntime(container) {
    var sinceValue = container.getAttribute('data-blog-since');
    var since = new Date(sinceValue);
    if (!sinceValue || Number.isNaN(since.getTime())) {
      return;
    }

    var diff = Math.max(0, Date.now() - since.getTime());
    var totalSeconds = Math.floor(diff / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    setText('blog_runtime_days', days);
    setText('blog_runtime_hours', hours);
    setText('blog_runtime_minutes', minutes);
    setText('blog_runtime_seconds', seconds);
  }

  function init() {
    var container = document.querySelector('[data-blog-since]');
    if (!container) {
      return;
    }
    updateRuntime(container);
    window.setInterval(function () {
      updateRuntime(container);
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
