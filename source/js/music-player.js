(function () {
  function initPlayer() {
    if (typeof window.APlayer !== 'function') {
      return;
    }

    var existing = document.getElementById('aplayer');
    var container = existing || document.createElement('div');
    container.id = 'aplayer';

    if (!existing) {
      document.body.appendChild(container);
    }

    window.lvziMusicPlayer = new window.APlayer({
      container: container,
      fixed: true,
      autoplay: false,
      audio: [
        {
          name: '歌曲名',
          artist: '歌手',
          url: '/music/song.mp3',
          cover: '/music/cover.jpg'
        }
      ]
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayer, { once: true });
  } else {
    initPlayer();
  }
})();
