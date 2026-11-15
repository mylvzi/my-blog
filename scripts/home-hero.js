'use strict';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

hexo.extend.filter.register('after_render:html', function(html, data) {
  const title = escapeHtml(hexo.config.title || '');
  const subtitle = escapeHtml(hexo.config.subtitle || '');
  const brand = `<a class="site-brand" href="/">${title}</a>`;

  // Move the theme search field into the shared top navigation before hiding
  // its original sidebar. Balance div tags so the whole search panel moves.
  const searchStart = html.indexOf('<div class="search-wrapper" id="search-wrapper">');
  let searchMarkup = '';
  if (searchStart >= 0) {
    let depth = 0;
    let cursor = searchStart;
    const tagPattern = /<div\b[^>]*>|<\/div>/g;
    tagPattern.lastIndex = searchStart;
    let match;
    while ((match = tagPattern.exec(html))) {
      if (match[0].startsWith('</')) depth -= 1;
      else depth += 1;
      if (depth === 0) {
        cursor = tagPattern.lastIndex;
        break;
      }
    }
    if (cursor > searchStart) {
      searchMarkup = html.slice(searchStart, cursor);
      html = html.slice(0, searchStart) + html.slice(cursor);
    }
  }

  const navbarContainer = '<div class="navbar-container">';
  if (html.includes(navbarContainer)) {
    html = html.replace(navbarContainer, `${navbarContainer}${brand}${searchMarkup}`);
  } else {
    const links = [
      ['Blog', '/'],
      ['About', '/about/'],
      ['Reading Notes', '/reading/'],
      ['Musings', '/musing/']
    ].map(([label, href]) => `<a href="${href}">${label}</a>`).join('');
    const topbar = `<div class="navbar top"><div class="navbar-blur"><div class="navbar-container">${brand}${searchMarkup}<nav class="post">${links}</nav></div></div></div>`;
    html = html.replace('<div class="l_main"', `${topbar}<div class="l_main"`);
  }

  // Keep the homepage menu limited to the requested sections. Stellar adds
  // its own recent/category/archive links before the custom tabs.
  html = html.replace(/<a class="active" href="\/">[^<]*<\/a>/, '<a class="active" href="/">Blog</a>');
  html = html.replace(/<a[^>]*href="\/archives\/"[^>]*>[^<]*<\/a>/g, '');
  html = html.replace(/<a[^>]*href="\/categories\/"[^>]*>[^<]*<\/a>/g, '');

  if (!data) return html;

  const banners = {
    'index.html': [hexo.config.title || "Lvzi's Blog", hexo.config.subtitle || 'Curiosity drives everything.'],
    'about/index.html': ['About', 'A little about the person behind the notes.'],
    'reading/index.html': ['Reading Notes', 'Ideas worth keeping, one page at a time.'],
    'musing/index.html': ['Musings', 'Small thoughts on things that catch my attention.']
  };
  const bannerCopy = banners[data.path];
  if (!bannerCopy) return html;

  const bannerTitle = escapeHtml(bannerCopy[0]);
  const bannerSubtitle = escapeHtml(bannerCopy[1]);
  const hero = `<header class="site-hero"><div class="site-hero-inner"><h1>${bannerTitle}</h1><p>${bannerSubtitle}</p></div></header>`;
  const pageLayoutClass = data.path === 'index.html' ? 'hero-home' : 'hero-interior';
  html = html.replace('<div class="l_main"', `<div class="l_main ${pageLayoutClass}"`);
  let bannerInsertAt = -1;
  if (data.path === 'index.html') {
    const navStart = html.indexOf('<div class="navbar top">');
    if (navStart >= 0) {
      let depth = 0;
      const divPattern = /<div\b[^>]*>|<\/div>/g;
      divPattern.lastIndex = navStart;
      let divMatch;
      while ((divMatch = divPattern.exec(html))) {
        if (divMatch[0].startsWith('</')) depth -= 1;
        else depth += 1;
        if (depth === 0) {
          bannerInsertAt = divPattern.lastIndex;
          break;
        }
      }
    }
  } else {
    const mainStart = html.search(/<div class="l_main\b[^>]*>/);
    if (mainStart >= 0) bannerInsertAt = html.indexOf('>', mainStart) + 1;
  }
  if (bannerInsertAt < 0) return html;
  html = html.slice(0, bannerInsertAt) + hero + html.slice(bannerInsertAt);

  if (data.path !== 'index.html') {
    const duplicateStart = html.indexOf('<div class="article-banner-wrap');
    if (duplicateStart >= 0) {
      let duplicateEnd = -1;
      let depth = 0;
      const divPattern = /<div\b[^>]*>|<\/div>/g;
      divPattern.lastIndex = duplicateStart;
      let divMatch;
      while ((divMatch = divPattern.exec(html))) {
        if (divMatch[0].startsWith('</')) depth -= 1;
        else depth += 1;
        if (depth === 0) {
          duplicateEnd = divPattern.lastIndex;
          break;
        }
      }
      if (duplicateEnd > duplicateStart) html = html.slice(0, duplicateStart) + html.slice(duplicateEnd);
    }
    return html;
  }

  const posts = hexo.locals.get('posts').data
    .filter(post => post.indexing !== false && post.reading_note !== true)
    .sort((a, b) => (b.date.valueOf() || 0) - (a.date.valueOf() || 0));
  const groups = [
    ['all', 'All'],
    ['tech', 'Technical Sharing'],
    ['life', 'Life'],
    ['thinking', 'Thinking']
  ];
  const groupFor = post => {
    const value = String(post.blog_category || 'tech').toLowerCase();
    if (value === 'life') return 'life';
    if (value === 'thinking') return 'thinking';
    return 'tech';
  };
  const fmtDate = post => post.date && post.date.format ? post.date.format('YYYY-MM-DD') : '';
  const filters = [
    ['all', 'All'],
    ['tech', 'Technical Sharing'],
    ['life', 'Life'],
    ['thinking', 'Thinking']
  ].map(([key, label], index) => `<button type="button" class="blog-filter${index === 0 ? ' active' : ''}" data-blog-filter="${key}" aria-pressed="${index === 0}">${label}</button>`).join('');
  let blogList = `<section class="blog-index" aria-label="Blog posts"><nav class="blog-filters" aria-label="Post categories">${filters}</nav>`;
  for (const [key, label] of groups) {
    const entries = key === 'all' ? posts : posts.filter(post => groupFor(post) === key);
    if (!entries.length) continue;
    blogList += `<section class="blog-group" data-blog-group="${key}"><h2>${label}<span>${entries.length}</span></h2><ul>`;
    for (const post of entries) {
      const url = '/' + String(post.path || '').replace(/^\//, '');
      blogList += `<li data-blog-category="${key}"><a href="${escapeHtml(url)}">${escapeHtml(post.title)}</a><time datetime="${escapeHtml(fmtDate(post))}">${escapeHtml(fmtDate(post))}</time></li>`;
    }
    blogList += '</ul></section>';
  }
  blogList += '<p class="blog-empty" hidden>There are no posts in this category yet.</p></section><script>(function(){var root=document.querySelector(".blog-index");if(!root)return;root.addEventListener("click",function(event){var button=event.target.closest("[data-blog-filter]");if(!button)return;var selected=button.getAttribute("data-blog-filter");root.querySelectorAll(".blog-filter").forEach(function(item){var active=item===button;item.classList.toggle("active",active);item.setAttribute("aria-pressed",String(active));});var visible=0;root.querySelectorAll(".blog-group").forEach(function(group){var show=selected==="all"||group.getAttribute("data-blog-group")===selected;group.hidden=!show;if(show)visible++;});root.querySelector(".blog-empty").hidden=visible>0;});})();</script>';
  const start = html.indexOf('<div class="post-list post">');
  if (start < 0) return html;
  let end = -1;
  let depth = 0;
  const divPattern = /<div\b[^>]*>|<\/div>/g;
  divPattern.lastIndex = start;
  let divMatch;
  while ((divMatch = divPattern.exec(html))) {
    if (divMatch[0].startsWith('</')) depth -= 1;
    else depth += 1;
    if (depth === 0) {
      end = divPattern.lastIndex;
      break;
    }
  }
  if (end < 0) return html;
  html = html.slice(0, start) + blogList + html.slice(end);

  const paginatorStart = html.indexOf("<div class='paginator-wrap", start);
  if (paginatorStart < 0) return html;
  let paginatorEnd = -1;
  depth = 0;
  divPattern.lastIndex = paginatorStart;
  while ((divMatch = divPattern.exec(html))) {
    if (divMatch[0].startsWith('</')) depth -= 1;
    else depth += 1;
    if (depth === 0) {
      paginatorEnd = divPattern.lastIndex;
      break;
    }
  }
  if (paginatorEnd > paginatorStart) html = html.slice(0, paginatorStart) + html.slice(paginatorEnd);
  return html;
});
