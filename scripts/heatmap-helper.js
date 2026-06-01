'use strict';

// Shared heatmap generator — GitHub-contribution style.
// Used by reading-notes.js and practice-log.js.

function dateKey(d) {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function getColor(count, inRange) {
  if (!inRange || count === 0) return '#ebedf0';
  if (count === 1) return '#9be9a8';
  if (count === 2) return '#40c463';
  if (count === 3) return '#30a14e';
  return '#216e39';
}

function renderHeatmap(allPosts, baseUrl) {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  // Build date -> posts map
  const postsByDate = new Map();
  allPosts.forEach(post => {
    const key = dateKey(post.date);
    if (key) {
      if (!postsByDate.has(key)) postsByDate.set(key, []);
      postsByDate.get(key).push(post);
    }
  });

  // Snap start to Sunday, end to Saturday
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(endDate);
  end.setDate(end.getDate() + (6 - end.getDay()));

  // Build weeks grid
  const weeks = [];
  const current = new Date(start);
  while (current <= end) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const key = dateKey(current);
      const posts = postsByDate.get(key) || [];
      const inRange = current >= startDate && current <= endDate;
      week.push({
        date: key,
        count: posts.length,
        posts: posts,
        inRange: inRange
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month labels (above columns)
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach(week => {
    const midDay = week[3]; // Thursday ≈ middle of the week
    if (midDay) {
      const d = new Date(midDay.date);
      const m = d.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ label: monthNames[m], col: weeks.indexOf(week) });
        lastMonth = m;
      }
    }
  });

  // Generate HTML
  const cellSize = 12;
  const gap = 3;
  let html = '<div class="heatmap" style="margin-top: 2.5rem; overflow-x: auto; max-width: 100%;">';
  html += '<h3 style="margin-bottom: 0.75rem; font-size: 1rem;">记录热力图</h3>';

  // Month labels row
  html += '<div style="display: flex; margin-left: 30px; gap: ' + gap + 'px; height: 18px;">';
  weeks.forEach((week, wi) => {
    const ml = monthLabels.find(m => m.col === wi);
    html += '<div style="width: ' + cellSize + 'px; font-size: 10px; color: var(--text-muted, #888); line-height: 18px; text-align: center;">' + (ml ? ml.label : '') + '</div>';
  });
  html += '</div>';

  // Grid body
  html += '<div style="display: flex; gap: 0;">';
  // Day labels
  const dayLabels = ['', '一', '', '三', '', '五', ''];
  html += '<div style="display: flex; flex-direction: column; gap: ' + gap + 'px; margin-right: 6px; padding-top: 0;">';
  dayLabels.forEach((label, i) => {
    html += '<div style="width: 24px; height: ' + cellSize + 'px; font-size: 10px; color: var(--text-muted, #888); line-height: ' + cellSize + 'px; text-align: right;">' + label + '</div>';
  });
  html += '</div>';

  // Week columns
  html += '<div style="display: flex; gap: ' + gap + 'px;">';
  weeks.forEach(week => {
    html += '<div style="display: flex; flex-direction: column; gap: ' + gap + 'px;">';
    week.forEach(day => {
      const color = getColor(day.count, day.inRange);
      const title = day.inRange ? (day.date + ' — ' + day.count + ' 篇') : '';
      if (day.count > 0 && day.inRange && day.posts.length > 0) {
        const post = day.posts[0];
        // Use permalink pattern: baseUrl + YYYY-MM-DD + '/'
        const href = baseUrl + day.date + '/';
        html += '<a href="' + href + '" title="' + title + '" style="display: block; width: ' + cellSize + 'px; height: ' + cellSize + 'px; background: ' + color + '; border-radius: 2px;" aria-label="' + day.date + ': ' + day.count + ' 篇"></a>';
      } else {
        html += '<div title="' + title + '" style="width: ' + cellSize + 'px; height: ' + cellSize + 'px; background: ' + color + '; border-radius: 2px;"></div>';
      }
    });
    html += '</div>';
  });
  html += '</div>';
  html += '</div>';

  // Legend
  html += '<div style="display: flex; gap: 4px; align-items: center; margin-top: 0.5rem; font-size: 10px; color: var(--text-muted, #888);">';
  html += '<span>Less</span>';
  html += '<span style="width: ' + cellSize + 'px; height: ' + cellSize + 'px; background: #ebedf0; border-radius: 2px; display: inline-block;"></span>';
  html += '<span style="width: ' + cellSize + 'px; height: ' + cellSize + 'px; background: #9be9a8; border-radius: 2px; display: inline-block;"></span>';
  html += '<span style="width: ' + cellSize + 'px; height: ' + cellSize + 'px; background: #40c463; border-radius: 2px; display: inline-block;"></span>';
  html += '<span style="width: ' + cellSize + 'px; height: ' + cellSize + 'px; background: #30a14e; border-radius: 2px; display: inline-block;"></span>';
  html += '<span>More</span>';
  html += '</div>';

  html += '</div>';
  return html;
}

module.exports = { renderHeatmap };
