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

  items.forEach(item => {
    const image = escapeHtml(item.image);
    if (image) {
      html += '<figure class="collection-item"><img src="' + image + '" alt="收藏图片" loading="lazy"></figure>';
    }
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
      comments: false
    }
  }];
});
