/**
 * Particle Text — glowing particles form "4 MORE Labs"
 * with light beam and floor sparkles.
 */
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], floaters = [], textPixels = [];
  let mouse = { x: -9999, y: -9999 };
  const MOUSE_R = 90;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let animId;

  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    W = r.width;
    H = r.height;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    sampleText();
    buildParticles();
    buildFloaters();
  }

  // ── Sample every pixel of the text ──
  function sampleText() {
    const off = document.createElement('canvas');
    const c = off.getContext('2d');
    off.width = W;
    off.height = H;

    // Scale font to always fit with padding
    let fs = Math.min(W * 0.1, 130);
    if (W < 600) fs = W * 0.11;

    c.fillStyle = '#fff';
    c.font = `800 ${fs}px "Inter", system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('4 MORE Labs', W / 2, H * 0.42);

    const img = c.getImageData(0, 0, W, H).data;
    textPixels = [];

    // Adaptive gap — tighter on large screens for full coverage
    const gap = W > 1200 ? 2 : W > 800 ? 3 : W > 500 ? 3 : 4;

    for (let y = 0; y < H; y += gap) {
      for (let x = 0; x < W; x += gap) {
        if (img[(y * W + x) * 4 + 3] > 100) {
          textPixels.push({ x, y });
        }
      }
    }
  }

  // ── Build particles — one per sampled pixel ──
  function buildParticles() {
    const count = Math.min(textPixels.length, 12000);
    particles = new Array(count);

    for (let i = 0; i < count; i++) {
      const tp = textPixels[i % textPixels.length];
      // Start scattered above
      const startX = tp.x + (Math.random() - 0.5) * W * 0.5;
      const startY = -Math.random() * H * 0.8 - 50;
      // #a77df9 = hsl(263, 91%, 73%)
      const hue = 255 + Math.random() * 20;
      const light = 60 + Math.random() * 20;

      particles[i] = {
        x: startX, y: startY,
        tx: tp.x, ty: tp.y,
        vx: 0, vy: 0,
        size: 0.8 + Math.random() * 1.2,
        alpha: 0,
        maxAlpha: 0.5 + Math.random() * 0.5,
        settled: false,
        hue, light,
      };
    }
  }

  function buildFloaters() {
    floaters = [];
    const n = Math.floor(W * 0.12);
    const baseY = H * 0.58;
    for (let i = 0; i < n; i++) {
      floaters.push({
        x: Math.random() * W,
        y: baseY + Math.random() * H * 0.35,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.1,
        size: 0.4 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.015,
        baseAlpha: 0.1 + Math.random() * 0.35,
      });
    }
  }

  // ── Mouse ──
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  function drawBeam() {}

  // ── Reflection ──
  function drawReflection() {
    const by = H * 0.56;
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.translate(0, by * 2);
    ctx.scale(1, -1);
    for (let i = 0; i < particles.length; i += 2) {
      const p = particles[i];
      if (!p.settled) continue;
      ctx.fillStyle = `hsla(${p.hue},80%,${p.light}%,${p.alpha * 0.4})`;
      ctx.fillRect(p.x - p.size * 0.35, p.y - p.size * 0.35, p.size * 0.7, p.size * 0.7);
    }
    ctx.restore();
  }

  // ── Floaters ──
  function drawFloaters(t) {
    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i];
      f.x += f.vx;
      f.y += f.vy;
      if (f.x < -10) f.x = W + 10;
      if (f.x > W + 10) f.x = -10;
      if (f.y < H * 0.55) f.vy = Math.abs(f.vy);
      if (f.y > H * 0.95) f.vy = -Math.abs(f.vy);
      const a = f.baseAlpha * ((Math.sin(t * 60 * f.speed + f.phase) + 1) * 0.5);
      ctx.fillStyle = `rgba(180,200,240,${a})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, 6.283);
      ctx.fill();
    }
  }

  // ── Main loop ──
  function animate() {
    animId = requestAnimationFrame(animate);
    const t = performance.now() * 0.001;

    ctx.clearRect(0, 0, W, H);
    drawBeam();

    // Smooth spring-based settling
    const ease = 0.065;
    const damp = 0.82;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      if (!p.settled) {
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        p.vx += dx * ease;
        p.vy += dy * ease;
        p.vx *= damp;
        p.vy *= damp;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += (p.maxAlpha - p.alpha) * 0.03;

        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(p.vx) < 0.2 && Math.abs(p.vy) < 0.2) {
          p.settled = true;
          p.x = p.tx;
          p.y = p.ty;
          p.alpha = p.maxAlpha;
        }
      } else {
        // Alive float — multi-wave drift
        const drift1 = Math.sin(t * 1.8 + i * 0.05) * 1.0;
        const drift2 = Math.cos(t * 0.7 + i * 0.13) * 0.5;
        const drift3 = Math.sin(t * 3.2 + i * 0.31) * 0.3;
        p.x = p.tx + drift1 + drift2 + drift3;

        const driftY1 = Math.cos(t * 1.4 + i * 0.08) * 0.8;
        const driftY2 = Math.sin(t * 0.6 + i * 0.11) * 0.4;
        const driftY3 = Math.cos(t * 2.5 + i * 0.23) * 0.25;
        p.y = p.ty + driftY1 + driftY2 + driftY3;

        // Flicker — layered frequencies with sparkle bursts
        const f1 = Math.sin(t * 5 + i * 1.7) * 0.10;
        const f2 = Math.sin(t * 13 + i * 3.1) * 0.06;
        const f3 = Math.sin(t * 29 + i * 7.3) * 0.04;
        // Occasional sparkle — sharp bright pulse on random particles
        const spark = Math.pow(Math.max(0, Math.sin(t * 2.3 + i * 5.7)), 16) * 0.25;
        p.alpha = p.maxAlpha * (0.82 + f1 + f2 + f3 + spark);
      }

      // Mouse push
      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const md = Math.sqrt(mdx * mdx + mdy * mdy);
      if (md < MOUSE_R && md > 0) {
        const f = (MOUSE_R - md) / MOUSE_R;
        p.vx += (mdx / md) * f * 5;
        p.vy += (mdy / md) * f * 5;
        p.settled = false;
      }

      // Draw — use fillRect for performance (no arc overhead)
      ctx.fillStyle = `hsla(${p.hue},80%,${p.light}%,${p.alpha})`;
      const s = p.size;
      ctx.fillRect(p.x - s * 0.5, p.y - s * 0.5, s, s);
    }

    // Subtle glow pass for brighter particles (every 4th for perf)
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i += 4) {
      const p = particles[i];
      if (p.alpha < 0.6 || p.size < 1.2) continue;
      ctx.fillStyle = `hsla(${p.hue},80%,${p.light}%,${p.alpha * 0.04})`;
      const gs = p.size * 4;
      ctx.fillRect(p.x - gs * 0.5, p.y - gs * 0.5, gs, gs);
    }
    ctx.globalCompositeOperation = 'source-over';

    drawReflection();
    drawFloaters(t);
  }

  window.addEventListener('resize', () => { cancelAnimationFrame(animId); resize(); animate(); });
  document.fonts.ready.then(() => { resize(); animate(); });
})();
