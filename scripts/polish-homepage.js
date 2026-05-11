'use strict';

const cheerio = require('cheerio');

function normalizeHref(href) {
  const clean = String(href || '')
    .replace(/^https?:\/\/[^/]+/i, '')
    .split('#')[0]
    .split('?')[0]
    .replace(/index\.html$/i, '');
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
  if (text.includes('lru') || text.includes('lfu') || tags.includes('os') || tags.includes('cache')) {
    return '系统 / 缓存策略';
  }
  if (text.includes('二分') || tags.includes('binary-search')) return '算法 / 二分查找';
  if (text.includes('前缀') || tags.includes('prefix-sum')) return '算法 / 前缀和';
  if (text.includes('递归') || tags.includes('recursion')) return '算法 / 递归';
  if (tags.includes('algorithm')) return '算法 / 题解';
  return '技术 / 学习笔记';
}

function inferClass(title, tags) {
  const text = String(title || '').toLowerCase();
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

function hasCodeSample(post) {
  const raw = String(post.raw || post._content || post.content || '');
  return raw.includes('```') || raw.includes('<pre') || raw.includes('<figure class="highlight"');
}

function learningPathHtml() {
  return `
<section class="learning-path">
  <div class="learning-path__header">
    <span class="learning-path__eyebrow">推荐阅读路径</span>
    <h2>从算法直觉到系统策略</h2>
    <p>按主题顺序阅读，比单纯追最新文章更容易把知识串起来。</p>
  </div>
  <div class="learning-path__tracks">
    <div class="learning-track">
      <span class="learning-track__title">算法入门</span>
      <a href="/2026/03/30/binary-search-boundaries/">二分查找</a>
      <span class="learning-track__arrow">→</span>
      <a href="/2026/04/28/2026-4-28-preFixSum/">前缀和</a>
      <span class="learning-track__arrow">→</span>
      <a href="/2026/04/29/recursion-intuition/">递归</a>
    </div>
    <div class="learning-track">
      <span class="learning-track__title">系统与工程</span>
      <a href="/2026/04/27/lru-lfu-cache-design/">页面置换</a>
      <span class="learning-track__arrow">→</span>
      <a href="/2026/04/27/lru-lfu-cache-design/">LRU / LFU</a>
      <span class="learning-track__arrow">→</span>
      <span>缓存设计</span>
    </div>
  </div>
</section>`;
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

  if ($('.learning-path').length === 0) {
    $('.navbar.top').first().after(learningPathHtml());
  }

  $('.post-list.post > a.post-card.post').each((_, card) => {
    const $card = $(card);
    const post = postsByHref.get(normalizeHref($card.attr('href')));
    if (!post) return;

    const title = String(post.title || $card.find('.post-title').first().text() || '');
    const tags = collectNames(post.tags);
    const $article = $card.find('article.md-text').first();
    if ($article.length === 0) return;

    $article.addClass(`enhanced-post ${inferClass(title, tags)}`);

    if ($article.find('.post-card-kicker').length === 0) {
      const $kicker = $('<div class="post-card-kicker"></div>');
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
      const suffix = hasCodeSample(post) ? ' · 含代码示例' : '';
      $('<span class="cap reading-meta"></span>')
        .text(`约 ${readingMinutes(post)} 分钟阅读 · 适合初学者${suffix}`)
        .appendTo($meta);
    }
  });

  return $.html();
});
