---
title: Prompt合集
date: 2026-05-17 10:46:00
nav_tabs: true
comment: false
---

<section class="prompt-collection">
  <div class="prompt-grid">
    <article class="prompt-card">
      <p class="prompt-card__desc">用于通过犀利反问，把一个模糊想法拆到更清楚。</p>
      <div class="prompt-code">
        <button class="prompt-copy" type="button" data-copy-prompt>复制</button>
        <pre class="prompt-card__prompt" data-prompt-text="请你扮演我的辩论队友 / 苏格拉底，针对我这个模糊的想法提出 3 个犀利的反问，逼我自己把逻辑想清楚。"><code>请你扮演我的辩论队友 / 苏格拉底，针对我这个模糊的想法提出 3 个犀利的反问，逼我自己把逻辑想清楚。</code></pre>
      </div>
    </article>
  </div>
</section>

<script>
document.addEventListener('click', function (event) {
  var button = event.target.closest('[data-copy-prompt]');
  if (!button) return;

  var card = button.closest('.prompt-card');
  var prompt = card.querySelector('.prompt-card__prompt').dataset.promptText;
  var originalText = button.textContent;

  function markCopied() {
    button.textContent = '已复制';
    window.setTimeout(function () {
      button.textContent = originalText;
    }, 1600);
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(prompt).then(markCopied);
    return;
  }

  var textarea = document.createElement('textarea');
  textarea.value = prompt;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  markCopied();
});
</script>
