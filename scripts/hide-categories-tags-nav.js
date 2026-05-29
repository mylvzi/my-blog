hexo.extend.filter.register('after_render:html', function(str, data) {
  // Remove 分类 and 标签 links from top navigation bar
  // Categories link: <a href="/categories/">分类</a> or <a class="active" href="/categories/">分类：xxx</a>
  // Tags link: <a href="/tags/">标签</a> or <a class="active" href="/tags/">标签：xxx</a>
  str = str.replace(/<a[^>]*href="\/categories\/"[^>]*>[^<]*分类[^<]*<\/a>/g, '');
  str = str.replace(/<a[^>]*href="\/tags\/"[^>]*>[^<]*标签[^<]*<\/a>/g, '');
  return str;
});
