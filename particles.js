/**
 * 4 MORE Labs — Hero Effect
 * Two-layer system:
 *   1. Sparkle star field (bottom half, drifting dots with twinkle)
 *   2. Steering-based particle text that forms "4 MORE Labs"
 * Ported from the Next.js/React reference project to vanilla JS.
 */
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let animId;

  /* ─── SIZING ─── */
  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    W = r.width;
    H = r.height;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    initStars();
    spawnWord();
  }

  /* ═══════════════════════════════════════════
     LAYER 1 — SPARKLE STAR FIELD
     Twinkling dots in the bottom portion
     ═══════════════════════════════════════════ */
  let stars = [];

  function initStars() {
    const count = Math.floor((W * H) / 320);
    stars = new Array(count);
    const fieldTop = H * 0.45;
    for (let i = 0; i < count; i++) {
      stars[i] = {
        x: Math.random() * W,
        y: fieldTop + Math.random() * (H - fieldTop),
        size: 0.3 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.1,
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 2 + Math.random() * 4,
        baseAlpha: 0.15 + Math.random() * 0.6,
      };
    }
  }

  function drawStars(t) {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x += s.vx;
      s.y += s.vy;

      // Wrap
      if (s.x < -5) s.x = W + 5;
      if (s.x > W + 5) s.x = -5;
      if (s.y < H * 0.45) s.vy = Math.abs(s.vy);
      if (s.y > H + 5) s.y = H * 0.45;

      // Twinkle
      const alpha = s.baseAlpha * (0.3 + 0.7 * ((Math.sin(t * s.twinkleSpeed + s.phase) + 1) * 0.5));
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, 6.283);
      ctx.fill();
    }
  }

  /* ─── Event horizon glow lines ─── */
  function drawEventHorizon() {
    const cy = H * 0.62;
    const midX = W / 2;

    // Wide indigo line
    const g1 = ctx.createLinearGradient(midX - W * 0.3, cy, midX + W * 0.3, cy);
    g1.addColorStop(0, 'transparent');
    g1.addColorStop(0.5, 'rgba(99,102,241,0.5)');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(midX - W * 0.3, cy - 1, W * 0.6, 2);

    // Blurred version
    ctx.save();
    ctx.filter = 'blur(4px)';
    const g1b = ctx.createLinearGradient(midX - W * 0.3, cy, midX + W * 0.3, cy);
    g1b.addColorStop(0, 'transparent');
    g1b.addColorStop(0.5, 'rgba(99,102,241,0.3)');
    g1b.addColorStop(1, 'transparent');
    ctx.fillStyle = g1b;
    ctx.fillRect(midX - W * 0.3, cy - 2, W * 0.6, 4);
    ctx.restore();

    // Narrow sky-blue center line
    const g2 = ctx.createLinearGradient(midX - W * 0.12, cy, midX + W * 0.12, cy);
    g2.addColorStop(0, 'transparent');
    g2.addColorStop(0.5, 'rgba(56,189,248,0.6)');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(midX - W * 0.12, cy - 1.5, W * 0.24, 3);

    // Blurred version
    ctx.save();
    ctx.filter = 'blur(3px)';
    const g2b = ctx.createLinearGradient(midX - W * 0.12, cy, midX + W * 0.12, cy);
    g2b.addColorStop(0, 'transparent');
    g2b.addColorStop(0.5, 'rgba(56,189,248,0.25)');
    g2b.addColorStop(1, 'transparent');
    ctx.fillStyle = g2b;
    ctx.fillRect(midX - W * 0.12, cy - 3, W * 0.24, 6);
    ctx.restore();
  }

  /* ─── Radial mask for star field (soft edges) ─── */
  function drawStarMask() {
    const cy = H * 0.62;
    const g = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, Math.max(W * 0.45, 250));
    g.addColorStop(0, 'rgba(5,5,6,0)');
    g.addColorStop(0.6, 'rgba(5,5,6,0)');
    g.addColorStop(1, 'rgba(5,5,6,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.4, W, H * 0.6);
  }

  /* ═══════════════════════════════════════════
     LAYER 2 — STEERING PARTICLE TEXT
     Particles steer toward text pixel targets
     with color blending and proximity slow-down
     ═══════════════════════════════════════════ */
  let textParticles = [];

  // Accent color: #a77df9 → rgb(167, 125, 249)
  const ACCENT = { r: 167, g: 125, b: 249 };

  function spawnWord() {
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const c = off.getContext('2d');

    c.fillStyle = '#fff';
    c.textAlign = 'center';

    if (W < 500) {
      const fs = W * 0.14;
      c.font = '800 ' + fs + 'px "Inter", system-ui, sans-serif';
      c.textBaseline = 'middle';
      c.fillText('4 MORE', W / 2, H * 0.35);
      c.fillText('Labs', W / 2, H * 0.35 + fs * 1.15);
    } else {
      const fs = Math.min(W * 0.1, 130);
      c.font = '800 ' + fs + 'px "Inter", system-ui, sans-serif';
      c.textBaseline = 'middle';
      c.fillText('4 MORE Labs', W / 2, H * 0.42);
    }

    const img = c.getImageData(0, 0, W, H).data;
    const step = W < 500 ? 4 : 6;

    // Collect target coordinates
    const coords = [];
    for (let i = 0; i < img.length; i += step * 4) {
      if (img[i + 3] > 0) {
        const idx = i / 4;
        coords.push({ x: idx % W, y: Math.floor(idx / W) });
      }
    }

    // Shuffle for organic reveal
    for (let i = coords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = coords[i]; coords[i] = coords[j]; coords[j] = tmp;
    }

    let pi = 0;
    for (const coord of coords) {
      let p;
      if (pi < textParticles.length) {
        p = textParticles[pi];
        p.isKilled = false;
        pi++;
      } else {
        p = {
          x: Math.random() * W,
          y: H + Math.random() * 100,
          vx: 0, vy: 0,
          tx: 0, ty: 0,
          maxSpeed: Math.random() * 5 + 3,
          maxForce: 0,
          closeEnough: 100,
          cr: 0, cg: 0, cb: 0,       // current color
          sr: 0, sg: 0, sb: 0,       // start color
          tr: ACCENT.r, tg: ACCENT.g, tb: ACCENT.b, // target color
          cw: 0,                       // color weight
          blendRate: Math.random() * 0.025 + 0.003,
          isKilled: false,
        };
        p.maxForce = p.maxSpeed * 0.05;
        textParticles.push(p);
        pi++;
      }

      // Blend current color forward
      p.sr = p.sr + (p.tr - p.sr) * p.cw;
      p.sg = p.sg + (p.tg - p.sg) * p.cw;
      p.sb = p.sb + (p.tb - p.sb) * p.cw;
      p.tr = ACCENT.r; p.tg = ACCENT.g; p.tb = ACCENT.b;
      p.cw = 0;

      p.tx = coord.x;
      p.ty = coord.y;
    }

    // Kill excess particles
    for (let i = pi; i < textParticles.length; i++) {
      killParticle(textParticles[i]);
    }
  }

  function killParticle(p) {
    if (!p.isKilled) {
      p.tx = p.x + (Math.random() - 0.5) * 300;
      p.ty = H + 100 + Math.random() * 200;
      p.sr = p.sr + (p.tr - p.sr) * p.cw;
      p.sg = p.sg + (p.tg - p.sg) * p.cw;
      p.sb = p.sb + (p.tb - p.sb) * p.cw;
      p.tr = 0; p.tg = 0; p.tb = 0;
      p.cw = 0;
      p.isKilled = true;
    }
  }

  function stepParticle(p) {
    // Steering toward target with proximity slow-down
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const proximity = dist < p.closeEnough ? dist / p.closeEnough : 1;

    // Desired velocity
    let dvx = 0, dvy = 0;
    if (dist > 0) {
      dvx = (dx / dist) * p.maxSpeed * proximity;
      dvy = (dy / dist) * p.maxSpeed * proximity;
    }

    // Steering force
    let sx = dvx - p.vx;
    let sy = dvy - p.vy;
    const sm = Math.sqrt(sx * sx + sy * sy);
    if (sm > 0) {
      sx = (sx / sm) * p.maxForce;
      sy = (sy / sm) * p.maxForce;
    }

    p.vx += sx;
    p.vy += sy;
    p.x += p.vx;
    p.y += p.vy;

    // Color blend
    if (p.cw < 1) p.cw = Math.min(p.cw + p.blendRate, 1);
    p.cr = Math.round(p.sr + (p.tr - p.sr) * p.cw);
    p.cg = Math.round(p.sg + (p.tg - p.sg) * p.cw);
    p.cb = Math.round(p.sb + (p.tb - p.sb) * p.cw);
  }

  function drawTextParticles() {
    for (let i = textParticles.length - 1; i >= 0; i--) {
      const p = textParticles[i];
      stepParticle(p);

      ctx.fillStyle = 'rgb(' + p.cr + ',' + p.cg + ',' + p.cb + ')';
      ctx.fillRect(p.x, p.y, 2, 2);

      // Remove killed particles that exit the canvas
      if (p.isKilled) {
        if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
          textParticles.splice(i, 1);
        }
      }
    }
  }

  /* ─── Mouse / Touch interaction ─── */
  let mouse = { x: -9999, y: -9999, active: false };

  canvas.addEventListener('mousemove', function (e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener('mouseleave', function () { mouse.x = -9999; mouse.y = -9999; });
  canvas.addEventListener('touchmove', function (e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - r.left;
    mouse.y = e.touches[0].clientY - r.top;
  }, { passive: true });
  canvas.addEventListener('touchend', function () { mouse.x = -9999; mouse.y = -9999; });

  /* ─── Mouse repulsion on text particles ─── */
  function applyMouseRepulsion() {
    const RADIUS = 80;
    const mx = mouse.x, my = mouse.y;
    if (mx < -100) return;

    for (let i = 0; i < textParticles.length; i++) {
      const p = textParticles[i];
      if (p.isKilled) continue;
      const dx = p.x - mx;
      const dy = p.y - my;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < RADIUS && d > 0) {
        const force = (RADIUS - d) / RADIUS;
        p.vx += (dx / d) * force * 4;
        p.vy += (dy / d) * force * 4;
      }
    }
  }

  /* ═══════════════════════════════════════════
     MAIN LOOP
     ═══════════════════════════════════════════ */
  function animate() {
    animId = requestAnimationFrame(animate);
    const t = performance.now() * 0.001;

    ctx.clearRect(0, 0, W, H);

    // Layer 1: Stars + event horizon
    drawStars(t);
    drawStarMask();
    drawEventHorizon();

    // Layer 2: Particle text
    applyMouseRepulsion();
    drawTextParticles();
  }

  window.addEventListener('resize', function () {
    cancelAnimationFrame(animId);
    resize();
    animate();
  });
  document.fonts.ready.then(function () {
    resize();
    animate();
  });
})();
