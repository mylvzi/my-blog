'use strict';

function getTime(value) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value.valueOf === 'function') {
    const timestamp = value.valueOf();
    if (Number.isFinite(timestamp)) return timestamp;
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

hexo.extend.filter.register('after_render:html', function(html, data) {
  // Skip non-HTML and feeds
  if (!html || typeof html !== 'string') return html;
  if (!/<widget class="widget-wrapper recent post-list"/.test(html)) return html;

  const allPosts = Array.from(hexo.locals.get('posts').data || []);

  const posts = allPosts
    .filter(post => post.title && post.title.length > 0)
    .filter(post => !post.reading_note && !post.practice_log)
    .sort((a, b) => {
      const aTime = getTime(a.date) || getTime(a.updated);
      const bTime = getTime(b.date) || getTime(b.updated);
      if (aTime !== bTime) {
        return bTime - aTime;
      }
      return String(b.path || '').localeCompare(String(a.path || ''));
    });

  const limit = Number(hexo.theme.config?.widgets?.recent?.limit) || 4;
  const linksHtml = posts.slice(0, limit).map(post => {
    const href = '/' + String(post.link || post.path || '').replace(/^\/+/, '');
    return `<a class="item title" href="${href}"><span class="title">${escapeHtml(post.title)}</span></a>`;
  }).join('');

  const widgetPattern = /(<widget class="widget-wrapper recent post-list"><div class="widget-header dis-select">.*?<\/div><div class="widget-body fs14">)(.*?)(<\/div><\/widget>)/s;
  return html.replace(widgetPattern, `$1${linksHtml}$3`);
});
