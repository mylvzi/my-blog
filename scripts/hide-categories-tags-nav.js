hexo.extend.filter.register('after_render:html', function(str, data) {
  // Remove 标签 links from top navigation bar (分类 is now enabled)
  // Tags link: <a href="/tags/">标签</a> or <a class="active" href="/tags/">标签：xxx</a>
  str = str.replace(/<a[^>]*href="\/tags\/"[^>]*>[^<]*标签[^<]*<\/a>/g, '');
  return str;
});
