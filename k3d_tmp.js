document.getElementById('year').textContent = new Date().getFullYear();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function accentRGB() {
    const cs = getComputedStyle(document.documentElement);
    return (cs.getPropertyValue('--a') || '225,29,46').trim().split(/\s+/).join(',');
  }

  if (!reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

    const hero = document.querySelector('.hero');

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-canvas';
    hero.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W, H, parts;
    const resize = () => {
      W = canvas.width = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
      parts = Array.from({ length: Math.min(70, Math.floor(W / 22)) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1 + Math.random() * 2.4,
        s: 0.15 + Math.random() * 0.5,
        o: 0.15 + Math.random() * 0.4,
        p: Math.random() * Math.PI * 2
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    let t = 0;
    (function loop() {
      t += 0.01;
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        p.y -= p.s;
        p.x += Math.sin(t + p.p) * 0.3;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + accentRGB() + ',' + (p.o * (0.7 + 0.3 * Math.sin(t * 2 + p.p))) + ')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(loop);
    })();

    const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (finePointer) {
      document.body.classList.add('has-cursor');
      const dot = document.createElement('div');
      dot.className = 'cursor-dot';
      const ring = document.createElement('div');
      ring.className = 'cursor-ring';
      document.body.appendChild(dot);
      document.body.appendChild(ring);

      let mx = -100, my = -100;
      let rx = mx, ry = my;
      window.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
        const t = e.target;
        ring.classList.toggle('is-hover', !!t.closest('a,button,.mod-card,input,select,textarea,label'));
      }, { passive: true });

      (function ringLoop() {
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
        requestAnimationFrame(ringLoop);
      })();

      const trailCv = document.createElement('canvas');
      trailCv.style.position = 'fixed';
      trailCv.style.inset = '0';
      trailCv.style.width = '100vw';
      trailCv.style.height = '100vh';
      trailCv.style.pointerEvents = 'none';
      trailCv.style.zIndex = '9997';
      document.body.appendChild(trailCv);
      const tctx = trailCv.getContext('2d');
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const tResize = () => { trailCv.width = innerWidth * dpr; trailCv.height = innerHeight * dpr; };
      tResize();
      window.addEventListener('resize', tResize);

      const trailGlow = makeGlow();
      const trailPos = [];
      (function trailLoop() {
        tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        tctx.clearRect(0, 0, trailCv.width, trailCv.height);
        for (let i = 0; i < trailPos.length; i++) {
          const p = trailPos[i];
          tctx.globalAlpha = p.a;
          tctx.drawImage(trailGlow, p.x - 8, p.y - 8, 16, 16);
        }
        tctx.globalAlpha = 1;
        if (trailPos.length) {
          const last = trailPos[trailPos.length - 1];
          trailPos.push({ x: last.x, y: last.y, a: last.a * 0.6 });
          if (trailPos.length > 22) trailPos.splice(0, trailPos.length - 22);
          trailPos.forEach((p) => { p.a *= 0.88; });
        }
        requestAnimationFrame(trailLoop);
      })();
      function makeGlow() {
        const tb = document.createElement('canvas');
        tb.width = tb.height = 20;
        const c = tb.getContext('2d');
        const g = c.createRadialGradient(10, 10, 0, 10, 10, 8);
        g.addColorStop(0, 'rgba(' + accentRGB() + ',0.6)');
        g.addColorStop(0.5, 'rgba(' + accentRGB() + ',0.22)');
        g.addColorStop(1, 'rgba(' + accentRGB() + ',0)');
        c.fillStyle = g;
        c.fillRect(0, 0, 20, 20);
        c.filter = 'blur(2px)';
        c.drawImage(tb, 0, 0);
        return tb;
      }
      let lastX = -999, lastY = -999;
      window.addEventListener('mousemove', (e) => {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        if (dx * dx + dy * dy > 3) { trailPos.push({ x: e.clientX, y: e.clientY, a: 0.5 }); lastX = e.clientX; lastY = e.clientY; }
      }, { passive: true });

      const gpCv = document.createElement('canvas');
      gpCv.className = 'global-particles';
      document.body.appendChild(gpCv);
      const gctx = gpCv.getContext('2d');
      const gdpr = Math.min(devicePixelRatio || 1, 2);
      let GW, GH, gparts;
      const gResize = () => {
        GW = gpCv.width = innerWidth * gdpr;
        GH = gpCv.height = innerHeight * gdpr;
        const n = Math.min(50, Math.floor(innerWidth / 28));
        gparts = Array.from({ length: n }, () => ({
          x: Math.random() * innerWidth,
          y: Math.random() * innerHeight,
          r: 0.6 + Math.random() * 1.8,
          s: 0.08 + Math.random() * 0.35,
          alpha: 0.1 + Math.random() * 0.3,
          drift: Math.random() * Math.PI * 2
        }));
      };
      gResize();
      window.addEventListener('resize', gResize);
      let gt = 0;
      (function gLoop() {
        gt += 0.01;
        gctx.setTransform(gdpr, 0, 0, gdpr, 0, 0);
        gctx.clearRect(0, 0, innerWidth, innerHeight);
        gparts.forEach((p) => {
          p.y -= p.s;
          p.x += Math.sin(gt + p.drift) * 0.2;
          if (p.y < -10) { p.y = innerHeight + 10; p.x = Math.random() * innerWidth; }
          gctx.beginPath();
          gctx.fillStyle = 'rgba(' + accentRGB() + ',' + p.alpha + ')';
          gctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          gctx.fill();
        });
        requestAnimationFrame(gLoop);
      })();
    }
  }

  const audio = new Audio('madk1d-so-pos.mp3');
  audio.preload = 'metadata';
  const btn = document.getElementById('p-btn');
  const cur = document.getElementById('pt-cur');
  const dur = document.getElementById('pt-dur');
  const bar = document.getElementById('p-bar');
  const fill = document.getElementById('p-fill');
  let playing = false;
  function fmt(s) {
    if (!isFinite(s) || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' + sec : sec);
  }
  audio.addEventListener('loadedmetadata', () => { dur.textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    cur.textContent = fmt(audio.currentTime);
    if (audio.duration) fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
  });
  btn.addEventListener('click', () => {
    if (playing) { audio.pause(); btn.textContent = '▶'; }
    else { audio.play().catch(()=>{}); btn.textContent = '❚❚'; }
    playing = !playing;
  });
  audio.addEventListener('ended', () => { playing = false; btn.textContent = '▶'; fill.style.width = '0'; cur.textContent = '0:00'; });
  bar.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const r = bar.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  });

  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine) {
    document.querySelectorAll('.tilt').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(700px) rotateY(' + (px * 8) + 'deg) rotateX(' + (-py * 8) + 'deg)';
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

(function () {
    const scene = document.getElementById('kScene');
    const canvas = document.getElementById('kCanvas');
    if (!scene || !canvas) return;
    const ctx = canvas.getContext('2d');
    const cs = window.getComputedStyle(document.documentElement);
    function accentRGB() { return (cs.getPropertyValue('--a') || '225,29,46').trim().split(/\s+/).join(','); }

    let rx = -0.3, ry = 0.6;
    let dragging = false, moved = false;
    let lastX = 0, lastY = 0;
    let clickTimer = null;
    let showName = false;
    let DPR = 1, W = 0, H = 0;
    let dprRaw = 1;

    function resize() {
      const r = scene.getBoundingClientRect();
      dprRaw = Math.min(window.devicePixelRatio || 1, 2);
      DPR = dprRaw;
      W = canvas.width = Math.max(20, Math.round(r.width * DPR));
      H = canvas.height = Math.max(20, Math.round(r.height * DPR));
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    // render the extruded string with real side faces
    function drawText(text) {
      if (typeof window.__kdebug === 'undefined') { window.__kdebug=[]; }
      window.__kdebug.push('draw:' + text + ' W=' + W + ' H=' + H + ' DPR=' + DPR);
      const cx = W / DPR / 2, cy = H / DPR / 2;
      const P = (H / DPR) * 0.75;
      const fontPx = showName
        ? Math.min((W / DPR) / (text.length * 0.58), (H / DPR) * 0.3)
        : (H / DPR) * 0.6;
      const depth = fontPx * 0.35;      // extrusion depth (side faces)

      // measure the string
      const probe = document.createElement('canvas').getContext('2d');
      probe.font = '900 ' + fontPx + 'px "Segoe UI",system-ui,Arial,sans-serif';
      const widths = [];
      let total = 0;
      for (let i = 0; i < text.length; i++) { const w = probe.measureText(text[i]).width || fontPx * 0.6; widths.push(w); total += w; }
      const gap = fontPx * 0.05;
      total += gap * (text.length - 1);
      const startX = cx - total / 2;

      // rasterize glyph mask (y grows down, match canvas)
      const mask = document.createElement('canvas');
      const mw = Math.ceil(W / DPR) + 10, mh = Math.ceil(H / DPR) + 10;
      mask.width = mw; mask.height = mh;
      const mctx = mask.getContext('2d');
      mctx.fillStyle = '#fff';
      mctx.font = '900 ' + fontPx + 'px "Segoe UI",system-ui,Arial,sans-serif';
      mctx.textBaseline = 'alphabetic';
      const baseY = cy + fontPx * 0.34;
      let accX = startX;
      for (let i = 0; i < text.length; i++) { mctx.fillText(text[i], accX, baseY); accX += widths[i] + gap; }

      // perspective projection
      function rot(x, y, z) {
        const cY = Math.cos(ry), sY = Math.sin(ry);
        const x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
        const cX = Math.cos(rx), sX = Math.sin(rx);
        const y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
        const f = P / (P + z2);
        return { x: -x1 * f + cx, y: y1 * f + cy, f: f, z: z2 };
      }

      const acc = accentRGB().split(',');
      const R = +acc[0] || 225, G = +acc[1] || 29, B = +acc[2] || 46;

      const step = 5;
      const cols = Math.floor(mw / step), rows = Math.floor(mh / step);
      const img = mctx.getImageData(0, 0, mw, mh).data;
      const cells = [];
      for (let py = 0; py < rows; py++) {
        for (let px = 0; px < cols; px++) {
          const sx = px * step, sy = py * step;
          if (img[(sy * mw + sx) * 4 + 3] < 40) continue;
          cells.push([sx, sy]);
        }
      }
      if (!cells.length) { if (typeof window.__kdebug === 'undefined') { window.__kdebug=[]; } window.__kdebug.push('no cells ' + text); return; }
      if (typeof window.__kdebug === 'undefined') { window.__kdebug=[]; }
      window.__kdebug.push(text + ':' + cells.length);

      // sort by depth (far to near)
      const ord = cells.map((c) => ({ c: c, z: rot(c[0] + step / 2, c[1] + step / 2, depth / 2).z }))
        .sort((a, b) => b.z - a.z);   // most negative (far) first

      const light = 0.55 + 0.45 * Math.max(-1, Math.min(1, Math.cos(ry) * Math.cos(rx)));

      for (let k = 0; k < ord.length; k++) {
        const vx = ord[k].c[0], vy = ord[k].c[1];
        const h = step / 2;
        const c0 = [[-h,-h],[h,-h],[h,h],[-h,h]];
        const fr = c0.map(([dx,dy]) => rot(vx+dx, vy+dy, 0));
        const bk = c0.map(([dx,dy]) => rot(vx+dx, vy+dy, depth));

        ctx.beginPath();
        ctx.moveTo(bk[3].x, bk[3].y); ctx.lineTo(bk[2].x, bk[2].y); ctx.lineTo(bk[1].x, bk[1].y); ctx.lineTo(bk[0].x, bk[0].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(' + Math.round(R*0.22) + ',' + Math.round(G*0.22) + ',' + Math.round(B*0.26) + ',0.95)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(fr[0].x, fr[0].y); ctx.lineTo(fr[1].x, fr[1].y); ctx.lineTo(fr[2].x, fr[2].y); ctx.lineTo(fr[3].x, fr[3].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(' + Math.round(R*light) + ',' + Math.round(G*light) + ',' + Math.round(B*light) + ',0.98)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(fr[1].x, fr[1].y); ctx.lineTo(fr[2].x, fr[2].y);
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.22 * light) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    function draw() {
      try {
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.clearRect(0, 0, W / DPR, H / DPR);
        drawText(showName ? 'KillanderRRY' : 'K');
      } catch (err) { if (typeof window.__kdebug !== 'undefined') window.__kdebug.push('DRAWERR:' + err.message); }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    function down(x, y) { dragging = true; moved = false; lastX = x; lastY = y; if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; } }
    function move(x, y) {
      if (!dragging) return;
      const dx = x - lastX, dy = y - lastY;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) moved = true;
      ry += dx * 0.012; rx -= dy * 0.012;
      rx = Math.max(-1.4, Math.min(1.4, rx));
      lastX = x; lastY = y;
    }
    function up() {
      dragging = false;
      if (!moved) {
        if (clickTimer) return;
        clickTimer = setTimeout(() => {
          showName = !showName;
          resize();
          clickTimer = null;
        }, 240);
      }
    }
    scene.addEventListener('mousedown', (e) => { e.preventDefault(); down(e.clientX, e.clientY); });
    window.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
    window.addEventListener('mouseup', up);

    scene.addEventListener('touchstart', (e) => { const t = e.touches[0]; down(t.clientX, t.clientY); }, { passive: true });
    scene.addEventListener('touchmove', (e) => { const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: true });
    scene.addEventListener('touchend', up);

    scene.addEventListener('dblclick', (e) => { e.preventDefault(); window.location.href = 'bonus.html'; });
  })();