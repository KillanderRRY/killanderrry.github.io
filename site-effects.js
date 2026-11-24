// KillanderRRY — общие декоративные эффекты сайта.
// Управляются через localStorage (ключи kr-*), выставляются на странице "Настройки".
// Подключается на все страницы перед закрывающим </body>.
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function get(key, def) {
    try { var v = localStorage.getItem(key); return v === null ? def : v; } catch (e) { return def; }
  }
  function accentRGB() {
    var cs = getComputedStyle(document.documentElement);
    return (cs.getPropertyValue('--a') || '225,29,46').trim().split(/\s+/).join(',');
  }

  var fx = {
    grain: get('kr-fx-grain', 'on'),      // плёночное зерно
    grainInt: parseFloat(get('kr-fx-grainInt', '0.05')), // сила зернистости
    stars: get('kr-fx-stars', 'on'),      // мерцающие звёзды
    smoke: get('kr-fx-smoke', 'on'),      // дым/туман
    click: get('kr-fx-click', 'on')       // вспышка при клике
  };

  // ===== Зерно (film grain) =====
  function makeGrain() {
    if (fx.grain === 'off' || reduce) return;
    var c = document.createElement('canvas');
    c.className = 'fx-grain';
    document.body.appendChild(c);
    var g = c.getContext('2d');
    var w, h;
    function resize() {
      w = c.width = Math.min(window.innerWidth, 720);
      h = c.height = Math.min(window.innerHeight, 720);
    }
    resize();
    window.addEventListener('resize', resize);
    var last = 0;
    function draw(t) {
      if (t - last > 120) {
        last = t;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, w, h);
        var img = g.createImageData(w, h);
        for (var i = 0; i < img.data.length; i += 4) {
          var n = (Math.random() * 255) | 0;
          img.data[i] = n; img.data[i + 1] = n; img.data[i + 2] = n;
          img.data[i + 3] = 255;
        }
        g.putImageData(img, 0, 0);
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ===== 9. Звёздный водопад (настраиваемый: вкл/выкл, скорость, кол-во, направление) =====
  function makeStars() {
    if (fx.stars === 'off' || reduce) return;
    var speed = parseFloat(get('kr-stars-speed', '1')) || 1;
    var count = parseInt(get('kr-stars-count', '60'), 10) || 60;
    var dir = get('kr-stars-dir', 'down');
    var c = document.createElement('canvas');
    c.className = 'fx-stars';
    document.body.appendChild(c);
    var ctx = c.getContext('2d');
    var dpr = Math.min(devicePixelRatio || 1, 2);
    var stars = [];
    var dx = 0, dy = 0;
    if (dir === 'down') dy = 1; else if (dir === 'up') dy = -1;
    else if (dir === 'left') dx = -1; else if (dir === 'right') dx = 1;
    function resize() {
      c.width = innerWidth * dpr; c.height = innerHeight * dpr;
      var n = Math.max(5, Math.min(180, count));
      stars = Array.from({ length: n }, function () {
        return {
          x: Math.random() * innerWidth, y: Math.random() * innerHeight,
          r: 0.4 + Math.random() * 1.6, a: 0.15 + Math.random() * 0.5,
          s: (0.15 + Math.random() * 0.6) * speed, p: Math.random() * Math.PI * 2,
          drift: (Math.random() - 0.5) * 0.3
        };
      });
    }
    resize(); window.addEventListener('resize', resize);
    var t = 0;
    (function loop() {
      t += 0.02;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      stars.forEach(function (s) {
        s.x += dx * s.s + s.drift * (Math.abs(dy) < 1 ? 1 : 0.3);
        s.y += dy * s.s;
        // wrap around
        if (dy > 0 && s.y > innerHeight + 6) { s.y = -6; s.x = Math.random() * innerWidth; }
        if (dy < 0 && s.y < -6) { s.y = innerHeight + 6; s.x = Math.random() * innerWidth; }
        if (dx > 0 && s.x > innerWidth + 6) { s.x = -6; s.y = Math.random() * innerHeight; }
        if (dx < 0 && s.x < -6) { s.x = innerWidth + 6; s.y = Math.random() * innerHeight; }
        var a = s.a * (0.6 + 0.4 * Math.sin(t + s.p));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + accentRGB() + ',' + a + ')';
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(loop);
    })();
  }

  // ===== Дым / туман (реагирует на мышь) =====
  function makeSmoke() {
    if (fx.smoke === 'off' || reduce) return;
    var layer = document.createElement('div');
    layer.className = 'fx-smoke';
    var blobs = ['a', 'b', 'c', 'd'];
    var spans = [];
    blobs.forEach(function (k) {
      var s = document.createElement('span');
      s.className = 'smoke-' + k;
      layer.appendChild(s);
      spans.push(s);
    });
    document.body.appendChild(layer);
    // лёгкий параллакс дыма к курсору
    var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (!fine) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    window.addEventListener('mousemove', function (e) {
      cx = e.clientX / (innerWidth || 1) - 0.5;
      cy = e.clientY / (innerHeight || 1) - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    function apply() {
      raf = null;
      tx += (cx * 3 - tx) * 0.06;
      ty += (cy * 3 - ty) * 0.06;
      layer.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
      if (Math.abs(tx - cx * 3) > 0.1 || Math.abs(ty - cy * 3) > 0.1) raf = requestAnimationFrame(apply);
    }
  }

  // ===== Вспышка при клике =====
  function makeClick() {
    if (fx.click === 'off' || reduce) return;
    var host = document.createElement('div');
    host.className = 'fx-click';
    document.body.appendChild(host);
    document.addEventListener('click', function (e) {
      var r = document.createElement('span');
      r.style.left = e.clientX + 'px';
      r.style.top = e.clientY + 'px';
      host.appendChild(r);
      setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 600);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    makeGrain();
    makeStars();
    makeSmoke();
    makeClick();
  });
})();