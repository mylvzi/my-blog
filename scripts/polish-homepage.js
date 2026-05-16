'use strict';

const cheerio = require('cheerio');

function normalizeHref(href) {
  const raw = String(href || '')
    .replace(/^https?:\/\/[^/]+/i, '')
    .split('#')[0]
    .split('?')[0]
    .replace(/index\.html$/i, '');
  let clean = raw;
  try {
    clean = decodeURIComponent(raw);
  } catch (error) {
    clean = raw;
  }
  const withLeadingSlash = '/' + clean.replace(/^\/+/, '');
  return withLeadingSlash.replace(/\/?$/, '/');
}

function postHref(post) {
  return normalizeHref(post.link || post.path || '');
}

function collectNames(collection) {
  const names = [];
  if (collection && collection.length > 0) {
    collection.forEach(item => {
      if (item && item.name) names.push(item.name);
    });
  }
  return names;
}

function slugName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '');
}

function inferTopic(title, tags) {
  const text = String(title || '').toLowerCase();
  if (text.includes('codex') || text.includes('ppt') || tags.includes('Codex') || tags.includes('PPT')) {
    return 'AI 工具 / PPT';
  }
  if (text.includes('lru') || text.includes('lfu') || tags.includes('os') || tags.includes('cache')) {
    return '系统 / 缓存策略';
  }
  if (text.includes('二分') || tags.includes('binary-search')) return '算法 / 二分查找';
  if (text.includes('前缀') || tags.includes('prefix-sum')) return '算法 / 前缀和';
  if (text.includes('递归') || tags.includes('recursion')) return '算法 / 递归';
  if (tags.includes('algorithm')) return '算法 / 题解';
  return '技术 / 学习笔记';
}

function inferIcon(title, tags) {
  const text = String(title || '').toLowerCase();
  if (text.includes('codex') || text.includes('ppt') || tags.includes('Codex') || tags.includes('PPT')) return 'fa-wand-magic-sparkles';
  if (text.includes('lru') || text.includes('lfu') || tags.includes('cache')) return 'fa-memory';
  if (text.includes('二分') || tags.includes('binary-search')) return 'fa-code-branch';
  if (text.includes('前缀') || tags.includes('prefix-sum')) return 'fa-table-cells';
  if (text.includes('递归') || tags.includes('recursion')) return 'fa-diagram-project';
  if (tags.includes('os')) return 'fa-microchip';
  return 'fa-pen-nib';
}

function inferClass(title, tags) {
  const text = String(title || '').toLowerCase();
  if (text.includes('codex') || text.includes('ppt') || tags.includes('Codex') || tags.includes('PPT')) return 'tag-technical';
  if (text.includes('lru') || text.includes('lfu') || tags.includes('cache')) return 'tag-cache';
  if (text.includes('二分') || tags.includes('binary-search')) return 'tag-binary-search';
  if (text.includes('前缀') || tags.includes('prefix-sum')) return 'tag-prefix-sum';
  if (text.includes('递归') || tags.includes('recursion')) return 'tag-recursion';
  if (tags.includes('os')) return 'tag-os';
  return 'tag-technical';
}

function readingMinutes(post) {
  if (post.readingTime && post.readingTime.minutes) {
    return Math.max(1, Math.ceil(post.readingTime.minutes));
  }
  if (post.symbols_count_time && post.symbols_count_time.time) {
    return Math.max(1, Math.ceil(post.symbols_count_time.time));
  }
  const raw = String(post.content || post.excerpt || post.summary || '').replace(/<[^>]+>/g, '');
  return Math.max(1, Math.ceil(raw.replace(/\s+/g, '').length / 500));
}

function isHomeHtml(html, data) {
  const outputPath = data && String(data.path || data.route || '');
  if (outputPath && outputPath.replace(/\\/g, '/') !== 'index.html') {
    return false;
  }
  return html.includes('<div class="navbar top">')
    && html.includes('<div class="post-list post">')
    && html.includes('<a class="active" href="/">近期发布</a>');
}

hexo.extend.filter.register('after_render:html', function(html, data) {
  if (!isHomeHtml(html, data)) return html;

  const postsByHref = new Map();
  const posts = Array.from(hexo.locals.get('posts').data || []);
  posts.forEach(post => postsByHref.set(postHref(post), post));

  const $ = cheerio.load(html, {
    decodeEntities: false
  });

  $('.post-list.post > a.post-card.post').each((_, card) => {
    const $card = $(card);
    const post = postsByHref.get(normalizeHref($card.attr('href')));
    if (!post) return;

    const title = String(post.title || $card.find('.post-title').first().text() || '');
    const tags = collectNames(post.tags);
    const $article = $card.find('article.md-text').first();
    if ($article.length === 0) return;

    $article.addClass(`enhanced-post ${inferClass(title, tags)}`);
    $card.addClass(inferClass(title, tags));

    if ($article.find('.post-card-kicker').length === 0) {
      const $kicker = $('<div class="post-card-kicker"></div>');
      $('<span class="post-icon"></span>')
        .html(`<i class="fa-solid ${inferIcon(title, tags)}"></i>`)
        .appendTo($kicker);
      $('<span class="post-topic"></span>').text(inferTopic(title, tags)).appendTo($kicker);
      tags.slice(0, 3).forEach(tag => {
        $('<span></span>')
          .addClass(`post-chip post-chip-${slugName(tag)}`)
          .text(tag)
          .appendTo($kicker);
      });
      $article.prepend($kicker);
    }

    if (post.summary) {
      $article.find('.excerpt > p').first().text(post.summary);
    }

    const $meta = $article.find('.meta.cap').first();
    if ($meta.length > 0 && $meta.find('.reading-meta').length === 0) {
      $('<span class="cap reading-meta"></span>')
        .text(`约 ${readingMinutes(post)} 分钟阅读`)
        .appendTo($meta);
    }
  });

  return $.html();
});
