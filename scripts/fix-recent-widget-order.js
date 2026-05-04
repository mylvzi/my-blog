'use strict';

const fs = require('fs');
const path = require('path');

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

hexo.extend.filter.register('after_generate', function() {
  const publicDir = hexo.public_dir;
  const posts = Array.from(hexo.locals.get('posts').data || [])
    .filter(post => post.title && post.title.length > 0)
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

  const widgetPattern = /(<widget class="widget-wrapper recent post-list"><div class="widget-header dis-select">.*?<\/div><div class="widget-body fs14">)(.*?)(<\/div><\/widget>)/gs;

  function updateHtmlFile(filePath) {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = original.replace(widgetPattern, `$1${linksHtml}$3`);
    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
    }
  }

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && fullPath.endsWith('.html')) {
        updateHtmlFile(fullPath);
      }
    }
  }

  if (fs.existsSync(publicDir)) {
    walk(publicDir);
  }
});
