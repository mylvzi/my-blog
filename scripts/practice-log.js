'use strict';

// Mark practice log posts so Stellar's index.ejs skips them
hexo.extend.filter.register('before_post_render', function(data) {
  if (data.practice_log === true) {
    data.indexing = false;
  }
  return data;
});

function dateFmt(d) {
  if (!d) return '';
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthLabel(key) {
  var parts = key.split('-');
  return parts[0] + '-' + parseInt(parts[1], 10) + '-事上磨练日志';
}

function renderPracticeIndex(months) {
  let html = '<h1>事上磨练日志</h1>';
  html += '<p style="color: var(--text-muted, #888); margin-bottom: 2rem;">每日践行记录与反思，按月归档。</p>';
  html += '<ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem;">';
  months.forEach(function(m) {
    html += '<li>';
    html += '<a href="' + hexo.config.root + 'practice/' + m.key + '/" style="font-size: 1.05rem; text-decoration: none; color: var(--text-primary, #222);">';
    html += monthLabel(m.key);
    html += '</a>';
    html += '<span style="color: var(--text-muted, #aaa); font-size: 0.85rem; margin-left: 0.5rem;">（' + m.posts.length + ' 篇）</span>';
    html += '</li>';
  });
  html += '</ul>';
  return html;
}

function renderMonthPage(month) {
  var html = '';
  html += '<p><a href="' + hexo.config.root + 'practice/" style="color: var(--text-muted, #666); text-decoration: none;">← 回事上磨练日志</a></p>';
  html += '<h1>' + monthLabel(month.key) + '</h1>';
  html += '<ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem;">';
  month.posts.forEach(function(post) {
    html += '<li>';
    html += '<a href="' + hexo.config.root + (post.path || '').replace(/^\//, '') + '" style="font-size: 1.05rem; text-decoration: none; color: var(--text-primary, #222);">';
    html += dateFmt(post.date);
    html += '</a>';
    html += '</li>';
  });
  html += '</ul>';
  return html;
}

// Generator for /practice/ and /practice/{YYYY-MM}/ pages
hexo.extend.generator.register('practice_logs', function(locals) {
  const Post = hexo.database.model('Post');
  const practicePosts = Post.find({practice_log: true}).data;

  if (!practicePosts || practicePosts.length === 0) {
    return [];
  }

  // Group by month (YYYY-MM)
  const monthsMap = new Map();
  practicePosts.forEach(post => {
    const d = post.date;
    if (!d) return;
    const y = d.year ? d.year() : new Date(d).getFullYear();
    const m = d.month ? (d.month() + 1) : (new Date(d).getMonth() + 1);
    const key = y + '-' + String(m).padStart(2, '0');
    if (!monthsMap.has(key)) {
      monthsMap.set(key, { key: key, posts: [] });
    }
    monthsMap.get(key).posts.push(post);
  });

  // Sort posts within each month by date (ascending)
  for (const month of monthsMap.values()) {
    month.posts.sort((a, b) => (a.date?.valueOf() || 0) - (b.date?.valueOf() || 0));
  }

  // Sort months descending (newest first)
  const months = Array.from(monthsMap.values());
  months.sort((a, b) => b.key.localeCompare(a.key));

  // Practice index
  const pages = [{
    path: 'practice/index.html',
    layout: 'page',
    data: {
      layout: 'page',
      title: '事上磨练日志',
      content: renderPracticeIndex(months),
      menu_id: 'practice',
      date: new Date(),
      comment: false,
      type: 'practice-index'
    }
  }];

  // Per-month pages
  months.forEach(month => {
    pages.push({
      path: 'practice/' + month.key + '/index.html',
      layout: 'page',
      data: {
        layout: 'page',
        title: monthLabel(month.key),
        content: renderMonthPage(month),
        menu_id: 'practice',
        date: new Date(),
        comment: false,
        type: 'practice-month'
      }
    });
  });

  return pages;
});
