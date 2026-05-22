'use strict';

const cheerio = require('cheerio');

function countSymbols(post) {
  return String(post.content || post.raw || '')
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, '')
    .length;
}

function formatSymbols(count) {
  if (count >= 1000000) return `${Math.round(count / 100000) / 10}m`;
  if (count >= 1000) return `${Math.round(count / 100) / 10}k`;
  return String(count);
}

function runtimeNumber(id) {
  return `<span class="blog-stat-number" id="${id}">0</span>`;
}

function normalizeSince(value) {
  if (value instanceof Date) return value.toISOString();
  return String(value || '2026-03-30T00:00:00+08:00');
}

function renderFooterStats(hexo) {
  const posts = Array.from(hexo.locals.get('posts').data || []).filter(post => post.title);
  const totalSymbols = posts.reduce((sum, post) => sum + countSymbols(post), 0);
  const stats = (hexo.theme && hexo.theme.config && hexo.theme.config.footer && hexo.theme.config.footer.stats) || {};
  const since = normalizeSince(stats.since);

  return `
    <div class="blog-footer-stats">
      <div class="blog-writing">
        <span>共撰写了 <strong>${posts.length}</strong> 篇文章</span>
        <span>共 <strong>${formatSymbols(totalSymbols)}</strong> 字</span>
      </div>
      <div class="blog-visits">
        <span id="busuanzi_container_site_uv">访问人数 <strong id="busuanzi_value_site_uv">0</strong></span>
        <span id="busuanzi_container_site_pv">总访问量 <strong id="busuanzi_value_site_pv">0</strong></span>
      </div>
      <div class="blog-running" data-blog-since="${since}">
        <span class="blog-stat-label">博客已运行</span>
        <span class="blog-runtime">
          ${runtimeNumber('blog_runtime_days')}<span class="blog-stat-unit">天</span>
          ${runtimeNumber('blog_runtime_hours')}<span class="blog-stat-unit">小时</span>
          ${runtimeNumber('blog_runtime_minutes')}<span class="blog-stat-unit">分钟</span>
          ${runtimeNumber('blog_runtime_seconds')}<span class="blog-stat-unit">秒</span>
        </span>
      </div>
    </div>`;
}

hexo.extend.filter.register('after_render:html', function(html) {
  if (!html.includes('page-footer') || html.includes('blog-footer-stats')) return html;

  const $ = cheerio.load(html, {
    decodeEntities: false
  });

  $('.page-footer .text').first().html(renderFooterStats(hexo));
  return $.html();
});
