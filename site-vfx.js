// KillanderRRY — общие визуалы (site-vfx.css). Подключается на все страницы.
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ===== 7. Счётчики: анимированный наброс чисел при попадании в зону ===== */
  function startCounters() {
    var els = $all('.count-up');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || e.target.dataset.done) return;
        e.target.dataset.done = '1';
        var target = parseFloat(e.target.dataset.to) || 0;
        var suf = e.target.dataset.suf || '';
        var dur = parseInt(e.target.dataset.dur, 10) || 1200;
        var t0 = performance.now();
        (function tick(t) {
          var k = Math.min(1, (t - t0) / dur);
          var eased = 1 - Math.pow(1 - k, 3);
          e.target.textContent = Math.round(target * eased) + suf;
          if (k < 1) requestAnimationFrame(tick);
          else e.target.textContent = target + suf;
        })(t0);
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ===== 8. Печатающийся текст ===== */
  function startTypewriter() {
    var el = $('.typewriter');
    if (!el || reduce) return;
    var full = el.getAttribute('data-text') || el.textContent;
    var speed = parseInt(el.getAttribute('data-speed'), 10) || 45;
    var caret = document.createElement('span');
    caret.className = 'tw-caret';
    el.textContent = '';
    el.classList.add('tw-wrap');
    el.appendChild(document.createTextNode(''));
    el.appendChild(caret);
    var i = 0;
    (function type() {
      if (i <= full.length) {
        el.firstChild.nodeValue = full.slice(0, i);
        i++;
        setTimeout(type, speed);
      }
    })();
  }

  /* ===== 5. Лёгкий параллакс для элементов [data-parallax] ===== */
  // Применяем transform раз в кадр (requestAnimationFrame), а не на каждое событие mousemove —
  // иначе непрерывная перекомпоновка больших блоков (hero) даёт лаги.
  function startParallax() {
    var els = $all('[data-parallax]');
    if (!els.length || reduce) return;
    var mq = window.matchMedia('(hover:hover) and (pointer:fine)');
    if (!mq.matches) return;
    var cx = 0, cy = 0, raf = null;
    window.addEventListener('mousemove', function (e) {
      cx = e.clientX / (innerWidth || 1) - 0.5;
      cy = e.clientY / (innerHeight || 1) - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    function apply() {
      raf = null;
      els.forEach(function (el) {
        var d = parseFloat(el.getAttribute('data-parallax')) || 20;
        el.style.transform = 'translate3d(' + (-cx * d).toFixed(1) + 'px,' + (-cy * d).toFixed(1) + 'px,0)';
      });
    }
    apply();
    window.addEventListener('resize', function () { apply(); });
  }

  /* ===== 15. Тряска экрана: window.shake() DATA trigger / метод ===== */
  function screenShake() {
    var b = document.body;
    b.classList.remove('shake');
    void b.offsetWidth;
    b.classList.add('shake');
  }

  /* ===== 18. Толчок кнопки ===== */
  function bindPush() {
    $all('[data-push]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.classList.remove('push-btn'); void btn.offsetWidth; btn.classList.add('push-btn');
      });
    });
  }

  /* ===== 19. Бегущая машинка по скролл-шкале ===== */
  function startCar() {
    if (!$('.scroll-progress')) return;
    var car = document.createElement('div');
    car.className = 'k-car';
    car.setAttribute('aria-hidden', 'true');
    car.innerHTML = '<svg viewBox="0 0 24 14"><path d="M3 10 L5 3 Q6 1 8 1 L15 1 Q18 1 21 6 L22 8 Q23 10 21 11 L3 11 Z" fill="currentColor"/><circle cx="7" cy="11.5" r="2" fill="#000"/><circle cx="17" cy="11.5" r="2" fill="#000"/></svg>';
    document.body.appendChild(car);
    function upd() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight || 1;
      var p = Math.min(1, Math.max(0, h.scrollTop / max));
      car.style.left = (p * 100) + '%';
    }
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  /* ===== 17. Конфетти (золото/искры) при успехе ===== */
  function confettiBurst(origin) {
    var count = 60;
    var host = document.createElement('div');
    host.className = 'fx-confetti';
    document.body.appendChild(host);
    var o = origin || { x: innerWidth / 2, y: innerHeight / 2 };
    for (var i = 0; i < count; i++) {
      var p = document.createElement('span');
      p.style.left = o.x + 'px';
      p.style.top = o.y + 'px';
      var ang = Math.random() * Math.PI * 2;
      var dist = 60 + Math.random() * 160;
      var dx = Math.cos(ang) * dist;
      var dy = Math.sin(ang) * dist - 40;
      var dur = 700 + Math.random() * 500;
      p.style.setProperty('--dx', dx + 'px');
      p.style.setProperty('--dy', dy + 'px');
      p.style.setProperty('--dur', dur + 'ms');
      var c = ['var(--red)', 'var(--red-2)', '#ffd94a', '#ff9f2e', '#ff5f6b'][i % 5];
      p.style.background = c;
      host.appendChild(p);
      setTimeout(function (el) { if (el.parentNode) el.parentNode.removeChild(el); }, dur, p);
    }
    setTimeout(function () { if (host.parentNode) host.parentNode.removeChild(host); }, 1300);
  }

  /* ===== 20. Плавный переход между страницами ===== */
  function bindTransitions() {
    document.body.classList.add('page-fade');
    $all('a[href$=".html"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (a.target === '_blank') return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        var href = a.getAttribute('href');
        document.body.classList.add('page-fade-out');
        setTimeout(function () { window.location.href = href; }, 240);
      });
    });
  }

  /* ===== 26. Кнопка «наверх» ===== */
  function makeToTop() {
    var btn = document.createElement('button');
    btn.className = 'to-top';
    btn.setAttribute('aria-label', 'Наверх');
    btn.innerHTML = '↑';
    document.body.appendChild(btn);
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      btn.classList.toggle('show', y > 400);
    }, { passive: true });
  }

  /* ===== 28. Индикатор онлайн/оффлайн ===== */
  function makeLiveDot() {
    var el = document.querySelector('[data-live]');
    if (!el) return;
    var dot = document.createElement('span');
    dot.className = 'live-dot';
    el.appendChild(dot);
    function upd() { dot.classList.toggle('off', !navigator.onLine); }
    upd();
    window.addEventListener('online', upd);
    window.addEventListener('offline', upd);
  }

  /* ===== 14. Фон-скорость при скролле ===== */
  function makeSpeedBg() {
    var layer = document.createElement('div');
    layer.className = 'speed-bg';
    layer.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 8; i++) {
      var s = document.createElement('i');
      s.style.left = (i * 13 + 5) + '%';
      s.style.height = (80 + Math.random() * 80) + 'px';
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    var throttle = null;
    function onScroll() {
      if (throttle) return;
      throttle = setTimeout(function () { throttle = null; }, 150);
      var y = window.pageYOffset || document.documentElement.scrollTop;
      layer.classList.toggle('on', y > 60);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ===== 22. Авто-тема по времени (внешний apply) ===== */
  function applyAutoTheme() {
    var cur = (function(){ try { return localStorage.getItem('kr-theme') || 'dark'; } catch(e){ return 'dark'; } })();
    if (cur !== 'auto') return;
    var h = new Date().getHours();
    var dark = (h >= 20 || h < 7);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }

  /* ===== 2. Spotlight-hover: свечение поверхности под курсором ===== */
  function initSpotlight() {
    var els = $all('[data-spotlight]');
    if (!els.length) return;
    var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (!fine) return;
    els.forEach(function (card) {
      var inner = document.createElement('div');
      inner.className = 'spot';
      inner.setAttribute('aria-hidden', 'true');
      card.style.position = 'relative';
      card.style.overflow = 'hidden';
      card.appendChild(inner);
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        inner.style.background = 'radial-gradient(220px circle at ' + (e.clientX - r.left) + 'px ' + (e.clientY - r.top) + 'px, rgba(var(--a),.18), transparent 70%)';
      });
      card.addEventListener('mouseleave', function () { inner.style.background = 'transparent'; });
    });
  }

  /* ===== 5. Магнит кнопок: [data-magnet] притягивается к курсору ===== */
  function initMagnet() {
    var els = $all('[data-magnet]');
    if (!els.length) return;
    var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (!fine) return;
    els.forEach(function (el) {
      var strength = parseFloat(el.getAttribute('data-magnet')) || 0.4;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * strength;
        var dy = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ===== 15. Блик на лого при ховере (комета по буквам) ===== */
  function initLogoShine() {
    var logos = $all('.logo-shine');
    logos.forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width) * 100;
        el.style.setProperty('--shine-x', x + '%');
      });
    });
  }

  /* ===== 19. Глитч-эффект на заголовке [data-glitch] ===== */
  function initGlitch() {
    var els = $all('[data-glitch]');
    els.forEach(function (el) {
      var text = el.textContent;
      el.setAttribute('data-text', text);
    });
  }

  /* ===== 22. Полосы-заголовки [data-bartitle]: заполняется при скролле ===== */
  function initBarTitles() {
    var els = $all('[data-bartitle]');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var el = e.target;
        if (!e.isIntersecting) { el.style.setProperty('--bar', '0%'); return; }
        var r = el.getBoundingClientRect();
        var vis = Math.max(0, Math.min(1, (innerHeight - r.top) / (r.height || 1)));
        el.style.setProperty('--bar', (vis * 100).toFixed(0) + '%');
      });
    }, { threshold: [0, 0.2, 0.5, 0.8, 1] });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ===== 25. Наклон карточек [data-tilt3d] (отдельно от .tilt) ===== */
  function initTilt3d() {
    var els = $all('[data-tilt3d]');
    if (!els.length) return;
    var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (!fine) return;
    els.forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(700px) rotateY(' + (px * 10) + 'deg) rotateX(' + (-py * 10) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ===== 31. Спидометр скролла: полоса-тахометр [data-speedo] ===== */
  function initSpeedo() {
    var wrap = $('[data-speedo]');
    if (!wrap) return;
    var bar = document.createElement('div');
    bar.className = 'speedo-bar';
    var num = document.createElement('div');
    num.className = 'speedo-num';
    wrap.appendChild(bar); wrap.appendChild(num);
    var raf = null;
    function upd() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight || 1;
      var p = Math.min(1, Math.max(0, (h.scrollTop || 0) / max));
      var kmh = Math.round(p * 340);
      bar.style.width = (p * 100) + '%';
      num.textContent = kmh + ' км/ч';
      raf = null;
    }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    upd();
  }

  /* ===== 37. Подсветка найденного текста querySelector-хелпер (без ломки Ctrl+F) ===== */
  function initSearchHint() {
    // Лёгкий помощник: по Ctrl+F показываем подсказку «используй нативный поиск браузера».
    var shown = false;
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && !shown) {
        shown = true;
        var tip = document.createElement('div');
        tip.className = 'search-tip';
        tip.textContent = 'Ctrl+F работает встроенным поиском браузера';
        document.body.appendChild(tip);
        setTimeout(function () { if (tip.parentNode) tip.parentNode.removeChild(tip); }, 2200);
      }
    });
  }

  /* ===== 27 / 38. Лёгкий зум-модал по [data-zoom] и scroll-snap ===== */
  function initZoomModal() {
    var els = $all('[data-zoom]');
    if (!els.length) return;
    var dim = document.createElement('div');
    dim.className = 'modal-dim';
    document.body.appendChild(dim);
    var img = document.createElement('div');
    img.className = 'zoom-panel';
    document.body.appendChild(img);
    function close() { dim.classList.remove('show'); img.classList.remove('show'); }
    dim.addEventListener('click', close);
    els.forEach(function (el) {
      el.addEventListener('click', function () {
        var txt = el.getAttribute('data-zoom');
        img.textContent = txt || el.textContent;
        // near content: put content inline via innerHTML fallback
        img.classList.add('show'); dim.classList.add('show');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    startCounters();
    startTypewriter();
    startParallax();
    bindPush();
    startCar();
    bindTransitions();
    makeToTop();
    makeLiveDot();
    makeSpeedBg();
    applyAutoTheme();
    initSpotlight();
    initMagnet();
    initLogoShine();
    initGlitch();
    initTilt3d();
    initSpeedo();
    initZoomModal();
    initBarTitles();
    initSearchHint();
    window.krScreenShake = screenShake;
    window.krConfetti = confettiBurst;
  });
})();