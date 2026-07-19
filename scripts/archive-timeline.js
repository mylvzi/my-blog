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

function pad(n) { return String(n).padStart(2, '0'); }

hexo.extend.filter.register('after_render:html', function(html, data) {
  if (!html || typeof html !== 'string') return html;

  // Only target archive pages
  const archiveMarker = '<div class="post-list archives">';
  const idx = html.indexOf(archiveMarker);
  if (idx === -1) return html;

  // Access all posts
  const allPosts = Array.from(hexo.locals.get('posts').data || []);
  if (allPosts.length === 0) return html;

  const posts = allPosts
    .filter(p => (p.title || p.date) && !p.reading_note && !p.practice_log)
    .sort((a, b) => {
      const aTime = getTime(a.date) || getTime(a.updated);
      const bTime = getTime(b.date) || getTime(b.updated);
      return bTime - aTime;
    });

  // Build year → month → posts tree
  const tree = {};
  const years = [];
  posts.forEach(post => {
    const d = new Date(getTime(post.date));
    if (isNaN(d.getTime())) return;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    if (!tree[y]) { tree[y] = {}; years.push(y); }
    if (!tree[y][m]) { tree[y][m] = []; }
    tree[y][m].push(post);
  });

  // Build timeline HTML
  let el = '<div class="archive-page">';
  el += '<h1 class="archive-title">文章归档</h1>';
  el += '<p class="archive-desc">时间轴上的所有文章（共 ' + posts.length + ' 篇）</p>';
  el += '<div class="timeline">';

  years.forEach(year => {
    const months = Object.keys(tree[year]).sort((a, b) => b - a);
    let yearCount = 0;
    months.forEach(m => { yearCount += tree[year][m].length; });

    el += '<section class="timeline-year">';
    el += '<div class="year-header">';
    el += '<h2 class="year-title">' + year + '</h2>';
    el += '<span class="year-count">' + yearCount + ' 篇文章</span>';
    el += '</div>';

    months.forEach(month => {
      const monthPosts = tree[year][month];
      el += '<div class="timeline-month">';
      el += '<h3 class="month-title">' + month + '月</h3>';
      el += '<ul class="timeline-posts">';

      monthPosts.forEach(post => {
        const d = new Date(getTime(post.date));
        const dateStr = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        const href = '/' + String(post.link || post.path || '').replace(/^\/+/, '');
        const title = post.title || dateStr;
        el += '<li class="timeline-post">';
        el += '<time>' + dateStr + '</time>';
        el += '<a href="' + href + '">' + escapeHtml(title) + '</a>';
        el += '</li>';
      });

      el += '</ul>';
      el += '</div>';
    });

    el += '</section>';
  });

  el += '</div>';
  el += '</div>';

  // Replace the original archive list
  const start = html.substring(0, idx);
  // Find end of post-list archives div
  let depth = 0;
  let end = idx;
  for (let i = idx; i < html.length; i++) {
    if (html.substring(i, i + 5) === '<div ') depth++;
    else if (html.substring(i, i + 6) === '</div>') {
      depth--;
      if (depth === -1) { end = i + 6; break; }
    }
  }

  return start + el + html.substring(end);
});
