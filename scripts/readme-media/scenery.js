/**
 * Browser script for scripts/readme-media/record.mjs: draws deterministic landscapes
 * (sky, sun or moon, layered mountains, sometimes a lake and pines) for the demo albums.
 * Defines window.drawScenery(seed, width, height) → JPEG data URL.
 */
(function () {
  function rng(seed) {
    let x = (seed * 2654435761) >>> 0 || 1;
    return function () {
      x ^= x << 13; x >>>= 0;
      x ^= x >>> 17;
      x ^= x << 5; x >>>= 0;
      return x / 4294967296;
    };
  }

  // Sky gradient (top → horizon), sun/moon colour, mountain layers far → near.
  const PALETTES = [
    { sky: ['#24345f', '#c97b84', '#ffcf9d'], sun: '#fff1c9', land: ['#9a7d97', '#6c5579', '#43355a', '#221a35'] },
    { sky: ['#2f6fc4', '#77aee8', '#d6ecff'], sun: '#fffbe8', land: ['#a7bfd0', '#7395aa', '#456f60', '#24463b'] },
    { sky: ['#2a1a4d', '#b8476e', '#ffb169'], sun: '#ffe3a6', land: ['#a75c74', '#713c60', '#45294b', '#1f1530'] },
    { sky: ['#0d1f2b', '#2b5466', '#86aab0'], sun: '#eef4f2', land: ['#46626d', '#2e4856', '#1b2f3b', '#0d1a22'], moon: true },
    { sky: ['#030719', '#0c1e4c', '#2d4a85'], sun: '#f6f2e0', land: ['#203265', '#172650', '#0f1938', '#070d20'], moon: true, stars: true },
    { sky: ['#93aac0', '#c6d4de', '#eef2f3'], sun: '#ffffff', land: ['#b6c4ce', '#91a5b3', '#687f8e', '#3f5465'] },
    { sky: ['#f2b85b', '#f69a7c', '#ffe6c7'], sun: '#fff6dc', land: ['#d99079', '#b0645a', '#7b3f46', '#46222f'] },
    { sky: ['#1b4b5a', '#4e9a9a', '#c8e6d9'], sun: '#f7fff6', land: ['#7fb3a8', '#4f8a80', '#2d5f58', '#163a36'] },
  ];

  /** Mountain ridge by midpoint displacement: y values across the width. */
  function ridge(rand, n, amp, rough) {
    const pts = new Array(n + 1).fill(0);
    pts[0] = (rand() - 0.5) * amp;
    pts[n] = (rand() - 0.5) * amp;
    for (let step = n; step > 1; step /= 2) {
      for (let i = step / 2; i < n; i += step) {
        pts[i] = (pts[i - step / 2] + pts[i + step / 2]) / 2 + (rand() - 0.5) * amp;
      }
      amp *= rough;
    }
    return pts;
  }

  function drawPine(ctx, x, baseY, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let tier = 0; tier < 3; tier++) {
      const ty = baseY - tier * h * 0.28;
      const tw = h * (0.34 - tier * 0.08);
      ctx.moveTo(x - tw, ty);
      ctx.lineTo(x, ty - h * 0.5);
      ctx.lineTo(x + tw, ty);
    }
    ctx.fill();
    ctx.fillRect(x - h * 0.03, baseY, h * 0.06, h * 0.12);
  }

  window.drawScenery = function (seed, w, h) {
    const rand = rng(seed);
    const pal = PALETTES[seed % PALETTES.length];
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const horizon = h * (0.55 + rand() * 0.12);
    const lake = rand() < 0.4;
    const pines = !lake && rand() < 0.6;

    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, pal.sky[0]);
    sky.addColorStop(0.6, pal.sky[1]);
    sky.addColorStop(1, pal.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    if (pal.stars) {
      for (let i = 0; i < 140; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.7})`;
        const r = rand() < 0.1 ? 1.4 : 0.8;
        ctx.fillRect(rand() * w, rand() * horizon * 0.8, r, r);
      }
    }

    const sx = w * (0.2 + rand() * 0.6);
    const sy = horizon * (pal.moon ? 0.28 + rand() * 0.15 : 0.35 + rand() * 0.4);
    const sr = Math.min(w, h) * (pal.moon ? 0.05 : 0.07);
    const glow = ctx.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 6);
    glow.addColorStop(0, pal.sun + 'aa');
    glow.addColorStop(1, pal.sun + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = pal.sun;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
    if (pal.moon) {
      ctx.fillStyle = pal.sky[1];
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(sx + sr * 0.45, sy - sr * 0.2, sr * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Mountains, far to near, each layer lower, darker and less hazy.
    const layers = pal.land.length;
    const bottom = lake ? horizon + h * 0.04 : h;
    let nearRidge = null;
    for (let l = 0; l < layers; l++) {
      const t = l / (layers - 1);
      const base = horizon - h * (0.2 - t * 0.17) + (lake ? 0 : t * h * 0.22);
      const pts = ridge(rand, 64, h * (0.32 - t * 0.14), 0.55 + rand() * 0.07);
      ctx.fillStyle = pal.land[l];
      ctx.beginPath();
      ctx.moveTo(0, h);
      pts.forEach((p, i) => ctx.lineTo((i / 64) * w, base + p));
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      if (l < layers - 1) {
        // Haze between layers.
        ctx.fillStyle = pal.sky[2];
        ctx.globalAlpha = 0.12;
        ctx.fillRect(0, 0, w, bottom);
        ctx.globalAlpha = 1;
      }
      if (l === layers - 1) nearRidge = { pts, base };
    }

    if (pines && nearRidge) {
      const dark = pal.land[layers - 1];
      for (let i = 0; i < 26; i++) {
        const fx = rand();
        const idx = Math.round(fx * 64);
        drawPine(ctx, fx * w, nearRidge.base + nearRidge.pts[idx] + h * 0.02, h * (0.08 + rand() * 0.1), dark);
      }
    }

    if (lake) {
      const water = ctx.createLinearGradient(0, horizon, 0, h);
      water.addColorStop(0, pal.sky[2]);
      water.addColorStop(1, pal.sky[0]);
      ctx.fillStyle = water;
      ctx.fillRect(0, bottom, w, h - bottom);
      // Mirror the scene above the waterline, faded.
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.translate(0, bottom * 2);
      ctx.scale(1, -1);
      ctx.drawImage(canvas, 0, bottom - (h - bottom), w, h - bottom, 0, bottom - (h - bottom), w, h - bottom);
      ctx.restore();
      ctx.fillStyle = pal.sun;
      for (let i = 0; i < 18; i++) {
        const y = bottom + (h - bottom) * (i / 18) + rand() * 4;
        const len = (1 - i / 18) * sr * 2.2 + rand() * sr;
        ctx.globalAlpha = 0.25 + rand() * 0.3;
        ctx.fillRect(sx - len / 2, y, len, 1.5);
      }
      ctx.globalAlpha = 1;
    }

    return canvas.toDataURL('image/jpeg', 0.86);
  };
})();
