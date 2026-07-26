/*!
 * intro-animation.js — Homepage intro cover for Lvzi's Blog.
 *
 * A STATIC, ORIGINAL poster-style splash: a stylized black-and-red basketball
 * hero (silhouette, no real likeness), inspired by a fan "Toronto / 2019"
 * poster the site owner referenced. It uses NO real photographs, NO team /
 * league / brand logos (Raptors, NBA, Nike, Sun Life...), NO trademarked
 * slogans, and NO third-party watermark — all artwork here is original vector.
 *
 * Behaviour:
 *   - Homepage only, once per browser session (sessionStorage).
 *   - Respects prefers-reduced-motion (shows instantly, no transitions).
 *   - Auto-dismisses after a few seconds; skippable (button / Esc / click).
 *   - Self-contained: injects its own <style> + overlay. Loaded via one line
 *     in _config.stellar.yml -> inject.head.
 *
 * Test hook: window.__RAP_INTRO_FORCE__ = true (or ?introtest=1) bypasses the
 * homepage / once-per-session guards.
 */
(function () {
  'use strict';

  var FORCE = (typeof window !== 'undefined' && window.__RAP_INTRO_FORCE__) ||
              /[?&]introtest=1/.test(location.search || '');

  /* -------------------------------------------------------------- guards */
  if (!FORCE) {
    try {
      var p = (location.pathname || '/').replace(/index\.html?$/, '');
      if (p !== '/' && p !== '') return;                 // homepage only
    } catch (e) {}
    try {
      if (sessionStorage.getItem('lvziSplashSeen') === '1') return;
    } catch (e) {}
  }
  try { sessionStorage.setItem('lvziSplashSeen', '1'); } catch (e) {}

  var reduce = false;
  try { reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var HOLD = 4200;          // how long the poster stays before auto-entering

  /* ---- Customisable ----------------------------------------------------
   * BG_IMAGE: drop your own full-screen background here. Save an image to
   *   source/images/intro-bg.jpg (or change the path/extension below) and it
   *   is shown full-bleed, cover-cropped. If the file is missing, the built-in
   *   original illustration is shown instead. Use an image you have the rights
   *   to — do not use copyrighted press photos, team logos, or watermarked art.
   * SHOW_TEXT: set false to show ONLY the image (no blog name / scrim). */
  var BG_IMAGE  = '/images/intro-bg.jpg';
  var SHOW_TEXT = true;

  /* -------------------------------------------------------------- styles */
  var css = '' +
  '.lvx-lock{overflow:hidden!important}' +
  '.lvx{position:fixed;inset:0;z-index:2147483000;background:#0a0a0c;cursor:pointer;' +
    'font-family:"Arial Narrow","Helvetica Neue",Helvetica,Arial,sans-serif;overflow:hidden;' +
    'opacity:0;transition:opacity .55s ease}' +
  '.lvx.in{opacity:1}' +
  '.lvx.out{opacity:0}' +
  '.lvx-svg{position:absolute;inset:0;width:100%;height:100%;display:block}' +
  '.lvx-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none}' +
  '.lvx.notext .lvx-scrim,.lvx.notext .lvx-kick,.lvx.notext .lvx-foot{display:none}' +
  /* text overlay */
  '.lvx-kick{position:absolute;top:6.5%;left:0;right:0;text-align:center;color:#c9002e;' +
    'font-size:clamp(11px,1.9vw,15px);letter-spacing:.4em;text-transform:uppercase;' +
    'font-weight:700;opacity:0;transform:translateY(-8px);transition:opacity .7s ease .25s,transform .7s ease .25s}' +
  '.lvx.in .lvx-kick{opacity:.95;transform:none}' +
  '.lvx-foot{position:absolute;left:0;right:0;bottom:8.5%;text-align:center;padding:0 20px;' +
    'color:#fff}' +
  '.lvx-name{font-size:clamp(34px,8vw,74px);font-weight:800;letter-spacing:.04em;line-height:1;' +
    'text-shadow:0 6px 34px rgba(0,0,0,.8);opacity:0;transform:translateY(20px);' +
    'transition:opacity .7s ease .45s,transform .7s cubic-bezier(.2,.9,.25,1.25) .45s}' +
  '.lvx-name .r{color:#e01839}' +
  '.lvx-tag{margin-top:14px;font-size:clamp(12px,2.3vw,17px);letter-spacing:.14em;color:#cfcfd4;' +
    'opacity:0;transform:translateY(14px);transition:opacity .7s ease .62s,transform .7s ease .62s}' +
  '.lvx-tribute{margin-top:10px;font-size:clamp(9px,1.5vw,11.5px);letter-spacing:.32em;' +
    'text-transform:uppercase;color:#8a8a90;opacity:0;transition:opacity .7s ease .8s}' +
  '.lvx.in .lvx-name,.lvx.in .lvx-tag{opacity:1;transform:none}' +
  '.lvx.in .lvx-tribute{opacity:.9}' +
  /* skip + hint */
  '.lvx-skip{position:absolute;top:20px;right:20px;z-index:5;background:rgba(0,0,0,.35);color:#fff;' +
    'border:1px solid rgba(255,255,255,.3);border-radius:20px;padding:7px 16px;font-family:inherit;' +
    'font-size:12px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;' +
    'transition:background .2s,border-color .2s}' +
  '.lvx-skip:hover{background:rgba(255,255,255,.16);border-color:#fff}' +
  '.lvx-hint{position:absolute;bottom:20px;right:22px;z-index:5;color:rgba(255,255,255,.5);' +
    'font-size:11px;letter-spacing:.2em;text-transform:uppercase;opacity:0;transition:opacity 1s ease 1.1s}' +
  '.lvx.in .lvx-hint{opacity:1}' +
  '.lvx-scrim{position:absolute;left:0;right:0;bottom:0;height:46%;pointer-events:none;' +
    'background:linear-gradient(to top,rgba(6,6,8,.94),rgba(6,6,8,.55) 42%,rgba(6,6,8,0))}' +
  '@media (max-width:600px){.lvx-skip{top:12px;right:12px}.lvx-hint{display:none}.lvx-foot{bottom:11%}}';

  var styleEl = document.createElement('style');
  styleEl.setAttribute('data-lvx', '');
  styleEl.textContent = css;
  (document.head || document.documentElement).appendChild(styleEl);

  /* ---------------------------------------------------------- SVG poster
   * viewBox 1000x1250 (portrait), sliced to cover. All original artwork. */
  var faint = '';
  for (var i = 0; i < 9; i++) {
    faint += '<text x="1012" y="' + (150 + i * 128) + '" text-anchor="end" ' +
      'font-size="112" font-weight="900" fill="#ffffff" fill-opacity="' +
      (i % 2 ? 0.035 : 0.06) + '" letter-spacing="4">TORONTO</text>';
  }

  var svg =
  '<svg class="lvx-svg" viewBox="0 0 1000 1250" preserveAspectRatio="xMidYMid slice" ' +
    'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs>' +
      '<linearGradient id="lvbg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#141016"/><stop offset="0.55" stop-color="#0c0a0d"/>' +
        '<stop offset="1" stop-color="#080709"/></linearGradient>' +
      '<radialGradient id="lvspot" cx="0.5" cy="0.32" r="0.6">' +
        '<stop offset="0" stop-color="#f7e9df" stop-opacity="0.20"/>' +
        '<stop offset="0.55" stop-color="#f7e9df" stop-opacity="0.04"/>' +
        '<stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="lvjersey" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#e01839"/><stop offset="1" stop-color="#a5102a"/></linearGradient>' +
      '<linearGradient id="lvbody" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#26262c"/><stop offset="1" stop-color="#121216"/></linearGradient>' +
      '<radialGradient id="lvvig" cx="0.5" cy="0.42" r="0.75">' +
        '<stop offset="0.55" stop-color="#000" stop-opacity="0"/>' +
        '<stop offset="1" stop-color="#000" stop-opacity="0.72"/></radialGradient>' +
    '</defs>' +

    '<rect width="1000" height="1250" fill="url(#lvbg)"/>' +
    '<rect width="1000" height="1250" fill="url(#lvspot)"/>' +

    /* repeated faint TORONTO type (right side) */
    '<g>' + faint + '</g>' +

    /* torn-paper red diagonals (original jagged shapes) */
    '<polygon points="-40,250 300,140 250,420 -40,560" fill="#c8102e" fill-opacity="0.9"/>' +
    '<polygon points="-40,250 300,140 250,420 -40,560" fill="none"/>' +
    '<polygon points="1040,150 720,60 800,470 1040,600" fill="#9d0c22" fill-opacity="0.85"/>' +
    '<polygon points="-40,900 260,1000 -40,1250 -40,1250" fill="#c8102e" fill-opacity="0.5"/>' +
    '<polygon points="1040,980 780,1080 1040,1250 1040,1250" fill="#9d0c22" fill-opacity="0.5"/>' +

    /* ---- HERO: original low-angle silhouette in a red #2 jersey ---- */
    '<g>' +
      /* shoulders + torso mass */
      '<path d="M500 570 C 305 570 252 650 238 768 C 224 905 252 1060 300 1250 L 700 1250 ' +
        'C 748 1060 776 905 762 768 C 748 650 695 570 500 570 Z" fill="url(#lvbody)"/>' +
      /* neck */
      '<path d="M460 505 L 464 578 L 536 578 L 540 505 C 526 542 474 542 460 505 Z" fill="#17171d"/>' +
      /* head — clean silhouette, slight upward tilt (no facial detail) */
      '<ellipse cx="500" cy="392" rx="112" ry="135" fill="url(#lvbody)" transform="rotate(-6 500 392)"/>' +
      /* thin red rim light, left edge of head */
      '<path d="M388 400 C 392 328 436 280 500 277 L 500 294 C 444 300 406 342 404 405 Z" ' +
        'fill="#e01839" fill-opacity="0.72"/>' +
      /* soft red rim, lower-left body edge */
      '<path d="M300 1250 C 254 1060 228 905 240 782 L 262 786 C 252 905 280 1060 324 1250 Z" ' +
        'fill="#e01839" fill-opacity="0.4"/>' +
      /* jersey tank top */
      '<path d="M500 592 C 374 592 326 656 316 774 C 304 905 330 1080 368 1250 L 632 1250 ' +
        'C 670 1080 696 905 684 774 C 674 656 626 592 500 592 Z" fill="url(#lvjersey)"/>' +
      /* white V-neck */
      '<path d="M426 598 L 500 694 L 574 598 L 552 592 L 500 656 L 448 592 Z" fill="#f5f5f5"/>' +
      /* white shoulder trims */
      '<path d="M334 694 C 326 732 322 772 320 800 L 304 796 C 310 744 320 702 334 664 Z" fill="#f0f0f0" fill-opacity="0.85"/>' +
      '<path d="M666 694 C 674 732 678 772 680 800 L 696 796 C 690 744 680 702 666 664 Z" fill="#f0f0f0" fill-opacity="0.85"/>' +
      /* number 2, upper chest (kept clear of the title) */
      '<text x="500" y="852" text-anchor="middle" font-size="250" font-weight="800" ' +
        'fill="#ffffff" fill-opacity="0.94" font-family="Arial Narrow,Impact,sans-serif">2</text>' +
    '</g>' +

    '<rect width="1000" height="1250" fill="url(#lvvig)"/>' +
  '</svg>';

  /* ------------------------------------------------------------------ DOM */
  var root = document.createElement('div');
  root.className = 'lvx';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Welcome — Lvzi\'s Blog');
  root.innerHTML =
    svg +
    '<img class="lvx-bg" alt="" />' +
    '<div class="lvx-scrim"></div>' +
    '<div class="lvx-kick">Toronto &middot; 2019</div>' +
    '<div class="lvx-foot">' +
      '<div class="lvx-name">Lvzi&#39;s <span class="r">Blog</span></div>' +
      '<div class="lvx-tag">内驭专注，外抱好奇 &middot; 事上磨练，终身进化</div>' +
      '<div class="lvx-tribute">Kawhi Leonard &middot; Game 7 &middot; 92&ndash;90</div>' +
    '</div>' +
    '<button class="lvx-skip" type="button">进入 &#8594;</button>' +
    '<div class="lvx-hint">点击任意处进入</div>';
  (document.body || document.documentElement).appendChild(root);
  document.documentElement.classList.add('lvx-lock');

  if (!SHOW_TEXT) root.classList.add('notext');

  /* Use a user-supplied background image if one exists; otherwise keep the
   * built-in original illustration as the fallback. */
  if (BG_IMAGE) {
    var bg = root.querySelector('.lvx-bg');
    bg.onload = function () { bg.style.display = 'block'; };
    bg.onerror = function () { bg.parentNode && bg.parentNode.removeChild(bg); };
    bg.src = BG_IMAGE;
  }

  /* --------------------------------------------------------------- run/out */
  var done = false, timer = 0;
  function enter() {
    if (done) return; done = true;
    clearTimeout(timer);
    document.removeEventListener('keydown', onKey);
    if (reduce) { teardown(); return; }
    root.classList.add('out');
    setTimeout(teardown, 600);
  }
  function teardown() {
    document.documentElement.classList.remove('lvx-lock');
    if (root && root.parentNode) root.parentNode.removeChild(root);
  }
  function onKey(e) { if (e.key === 'Escape' || e.key === 'Esc') enter(); }

  root.querySelector('.lvx-skip').addEventListener('click', function (e) { e.stopPropagation(); enter(); });
  root.addEventListener('click', enter);
  document.addEventListener('keydown', onKey);

  if (reduce) {
    root.classList.add('in');            // show instantly, no transitions
    timer = setTimeout(enter, HOLD);
  } else {
    // next frame -> trigger the fade/entrance transitions
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('in'); }); });
    timer = setTimeout(enter, HOLD);
  }
})();
