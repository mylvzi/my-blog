'use strict';

const { renderHeatmap } = require('./heatmap-helper');

// Mark reading note posts so Stellar's index.ejs skips them (line 25: post.indexing != false)
hexo.extend.filter.register('before_post_render', function(data) {
  if (data.reading_note === true) {
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
  // key = "2026-05" -> display as "2026-5-阅读思考合集"
  var parts = key.split('-');
  return parts[0] + '-' + parseInt(parts[1], 10) + '-阅读思考合集';
}

function excerpt(post) {
  if (post.summary) return post.summary;
  if (post.excerpt) return post.excerpt;
  return '';
}

function renderReadingIndex(months) {
  let html = '<h1>阅读思考合集</h1>';
  html += '<p style="color: var(--text-muted, #888); margin-bottom: 2rem;">每日阅读后的思考与摘录，按月归档。</p>';
  html += '<ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem;">';
  months.forEach(function(m) {
    html += '<li>';
    html += '<a href="' + hexo.config.root + 'reading/' + m.key + '/" style="font-size: 1.05rem; text-decoration: none; color: var(--text-primary, #222);">';
    html += monthLabel(m.key);
    html += '</a>';
    html += '<span style="color: var(--text-muted, #aaa); font-size: 0.85rem; margin-left: 0.5rem;">（' + m.posts.length + ' 篇）</span>';
    html += '</li>';
  });
  html += '</ul>';

  // Collect all posts for heatmap
  const allPosts = [];
  months.forEach(function(m) {
    allPosts.push.apply(allPosts, m.posts);
  });
  html += renderHeatmap(allPosts, hexo.config.root + 'reading/');

  return html;
}

function renderMonthPage(month) {
  var html = '';
  html += '<p><a href="' + hexo.config.root + 'reading/" style="color: var(--text-muted, #666); text-decoration: none;">← 返回阅读思考合集</a></p>';
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

// Generator for /reading/ and /reading/{YYYY-MM}/ pages
hexo.extend.generator.register('reading_notes', function(locals) {
  const Post = hexo.database.model('Post');
  const readingPosts = Post.find({reading_note: true}).data;

  if (!readingPosts || readingPosts.length === 0) {
    return [];
  }

  // Group by month (YYYY-MM)
  const monthsMap = new Map();
  readingPosts.forEach(post => {
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

  // Reading index
  const pages = [{
    path: 'reading/index.html',
    layout: 'page',
    data: {
      layout: 'page',
      title: '阅读思考合集',
      content: renderReadingIndex(months),
      menu_id: 'reading',
      date: new Date(),
      comment: false,
      type: 'reading-index'
    }
  }];

  // Per-month pages
  months.forEach(month => {
    pages.push({
      path: 'reading/' + month.key + '/index.html',
      layout: 'page',
      data: {
        layout: 'page',
        title: monthLabel(month.key),
        content: renderMonthPage(month),
        menu_id: 'reading',
        date: new Date(),
        comment: false,
        type: 'reading-month'
      }
    });
  });

  return pages;
});
