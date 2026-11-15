hexo.extend.filter.register('after_render:html', function(str, data) {
  // Keep topical tag pages available without adding a tag tab to the top navigation.
  // Hide either localized label; topical tag pages remain directly accessible.
  str = str.replace(/<a[^>]*href="\/tags\/"[^>]*>[^<]*(?:标签|Tags)[^<]*<\/a>/g, '');
  return str;
});
