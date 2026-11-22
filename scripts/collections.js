'use strict';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

hexo.extend.generator.register('collections', function() {
  const items = hexo.locals.get('data').collections || [];
  let html = '<div class="collections-page">';

  if (!items.length) {
    html += '<p class="collections-empty">还没有收藏的内容。</p>';
  }

  items.forEach(item => {
    const image = escapeHtml(item.image);
    html += '<article class="collection-card">';
    html += '<header class="collection-header">';
    html += '<h2>' + escapeHtml(item.title) + '</h2>';
    html += '<div class="collection-meta"><time datetime="' + escapeHtml(item.date) + '">' + escapeHtml(item.date) + '</time>';
    if (item.source) html += '<span>' + escapeHtml(item.source) + '</span>';
    if (item.source_note) html += '<span>' + escapeHtml(item.source_note) + '</span>';
    html += '</div></header>';
    if (item.excerpt) html += '<blockquote class="collection-excerpt">' + escapeHtml(item.excerpt) + '</blockquote>';
    if (item.note) html += '<p class="collection-note">' + escapeHtml(item.note) + '</p>';
    if (image) {
      html += '<a class="collection-image-link" href="' + image + '" target="_blank" rel="noopener">';
      html += '<img class="collection-image" src="' + image + '" alt="' + escapeHtml(item.title) + ' 的原始收藏截图" loading="lazy">';
      html += '</a>';
    }
    html += '</article>';
  });

  html += '</div>';
  return [{
    path: 'collections/index.html',
    layout: 'page',
    data: {
      layout: 'page',
      title: 'Collections',
      content: html,
      menu_id: 'collections',
      date: new Date(),
      comment: false
    }
  }];
});
