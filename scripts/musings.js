'use strict';

// Generator for /musing/ — timeline-style page like archives
hexo.extend.generator.register('musings', function(locals) {
  const musings = hexo.locals.get('data').musings || [];

  if (musings.length === 0) {
    return [{
      path: 'musing/index.html',
      layout: 'page',
      data: {
        layout: 'page',
        title: '碎碎念',
        content: '<div class="archive-page"><h1 class="archive-title">碎碎念</h1><p class="archive-desc">这里记录一些零散的碎碎念。</p><p style="color:var(--text-muted)">还没有碎碎念。</p></div>',
        menu_id: 'musing',
        date: new Date(),
        comment: false
      }
    }];
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Group by year → month
  const tree = {};
  musings.forEach(m => {
    const d = new Date(m.date);
    if (isNaN(d.getTime())) return;
    const y = d.getFullYear();
    const month = d.getMonth() + 1;
    if (!tree[y]) tree[y] = {};
    if (!tree[y][month]) tree[y][month] = [];
    tree[y][month].push(m);
  });

  const years = Object.keys(tree).sort((a, b) => b - a);

  // Build timeline HTML
  let html = '<div class="archive-page">';
  html += '<h1 class="archive-title">碎碎念</h1>';
  html += '<p class="archive-desc">这里记录一些零散的碎碎念。</p>';
  html += '<div class="timeline">';

  years.forEach(year => {
    const months = Object.keys(tree[year]).sort((a, b) => b - a);
    let yearCount = 0;
    months.forEach(m => { yearCount += tree[year][m].length; });

    html += '<section class="timeline-year">';
    html += '<div class="year-header">';
    html += '<h2 class="year-title">' + year + '</h2>';
    html += '<span class="year-count">' + yearCount + ' 条碎碎念</span>';
    html += '</div>';

    months.forEach(month => {
      const items = tree[year][month];
      html += '<div class="timeline-month">';
      html += '<h3 class="month-title">' + month + '月</h3>';
      html += '<ul class="timeline-posts">';

      items.forEach(item => {
        const d = new Date(item.date);
        const dateStr = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        html += '<li class="timeline-post">';
        html += '<time>' + dateStr + '</time>';
        html += '<span>' + escapeHtml(item.content) + '</span>';
        html += '</li>';
      });

      html += '</ul>';
      html += '</div>';
    });

    html += '</section>';
  });

  html += '</div>';
  html += '</div>';

  return [{
    path: 'musing/index.html',
    layout: 'page',
    data: {
      layout: 'page',
      title: '碎碎念',
      content: html,
      menu_id: 'musing',
      date: new Date(),
      comment: false
    }
  }];
});
