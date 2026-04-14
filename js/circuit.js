/* ══════════════════════════════════════
   CIRCUIT — CURRENT FLOW ANIMATION
   ══════════════════════════════════════
   Draws animated particles (conventional current)
   along the paths of the common emitter amplifier.

   Self-contained: requires <canvas id="circuitCanvas">
   inside .circuit-deco. Fails silently if missing.
*/

(function () {
  const canvas = document.getElementById('circuitCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const wrapper = canvas.parentElement;

  // ── Sizing ─────────────────────────────────

  function resize() {
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // SVG viewBox is 420×420, map to actual pixel size
  function sx(x) { return (x / 420) * wrapper.clientWidth; }
  function sy(y) { return (y / 420) * wrapper.clientHeight; }

  // ── Path definitions (in SVG viewBox coords) ──

  // Each path is an array of [x, y] waypoints
  const paths = {
    // Main: Vcc → RL → collector → through transistor → emitter → RE → ground
    main: [
      [250,30],[250,55],
      [242,61],[258,70],[242,79],[258,88],[242,97],
      [250,100],[250,155],
      [220,183],[220,209],
      [250,235],[250,280],
      [242,286],[258,295],[242,304],[258,313],[242,322],
      [250,330],[250,355]
    ],
    // Bias: Vcc → R1 → junction → R2 → ground
    bias: [
      [170,30],[170,68],
      [162,74],[178,83],[162,92],[178,101],[162,110],
      [170,118],[170,200],[170,248],
      [162,254],[178,263],[162,272],[178,281],[162,290],
      [170,298],[170,355]
    ],
    // Output: collector → Vout
    output: [
      [250,155],[350,155]
    ],
    // Bypass: emitter junction → C2 → ground
    bypass: [
      [250,280],[308,280],[320,280],[320,355]
    ],
    // Input: Vin edge → C1 → base
    input: [
      [76,200],[125,200],[140,200],[207,200]
    ]
  };

  // ── Compute cumulative distances for each path ──

  function computeLengths(pts) {
    const lengths = [0];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0];
      const dy = pts[i][1] - pts[i - 1][1];
      lengths.push(lengths[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    return lengths;
  }

  // Get position along path at normalized t (0–1)
  function getPointOnPath(pts, lengths, t) {
    const totalLen = lengths[lengths.length - 1];
    const target = (t % 1) * totalLen;

    for (let i = 1; i < lengths.length; i++) {
      if (lengths[i] >= target) {
        const segStart = lengths[i - 1];
        const segEnd = lengths[i];
        const segT = (target - segStart) / (segEnd - segStart);
        return {
          x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * segT,
          y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * segT
        };
      }
    }
    const last = pts[pts.length - 1];
    return { x: last[0], y: last[1] };
  }

  // Pre-compute lengths
  const pathData = {};
  for (const key in paths) {
    pathData[key] = {
      pts: paths[key],
      lengths: computeLengths(paths[key])
    };
  }

  // ── Particle definitions ───────────────────

  const particles = [
    // Main current (3 particles, staggered)
    { path: 'main', speed: 0.45, offset: 0.0,  r: 3,   color: [61, 240, 192], alpha: 0.85 },
    { path: 'main', speed: 0.45, offset: 0.33, r: 3,   color: [61, 240, 192], alpha: 0.7  },
    { path: 'main', speed: 0.45, offset: 0.66, r: 3,   color: [61, 240, 192], alpha: 0.6  },

    // Bias current (2 particles)
    { path: 'bias', speed: 0.35, offset: 0.0,  r: 2.5, color: [61, 240, 192], alpha: 0.6  },
    { path: 'bias', speed: 0.35, offset: 0.5,  r: 2.5, color: [61, 240, 192], alpha: 0.5  },

    // Output signal
    { path: 'output', speed: 0.8, offset: 0.0,  r: 2.5, color: [61, 240, 192], alpha: 0.7 },

    // Bypass (blue tint)
    { path: 'bypass', speed: 0.6, offset: 0.0,  r: 2.2, color: [61, 142, 240], alpha: 0.6 },

    // Input signal (warm)
    { path: 'input', speed: 0.55, offset: 0.0,  r: 2.5, color: [240, 160, 61], alpha: 0.55 },
    { path: 'input', speed: 0.55, offset: 0.5,  r: 2,   color: [240, 160, 61], alpha: 0.4  },
  ];

  // ── Animation loop ─────────────────────────

  let startTime = null;

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000; // seconds

    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      const data = pathData[p.path];
      const t = (elapsed * p.speed + p.offset) % 1;
      const pos = getPointOnPath(data.pts, data.lengths, t);

      const px = sx(pos.x);
      const py = sy(pos.y);
      const r = p.r * (w / 400); // scale radius with container

      // Glow
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 4);
      grad.addColorStop(0, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.alpha * 0.4})`);
      grad.addColorStop(1, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r * 4, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  // Delay start until the circuit fade-in animation completes (~2.2s)
  setTimeout(() => {
    requestAnimationFrame(draw);
  }, 2200);
})();