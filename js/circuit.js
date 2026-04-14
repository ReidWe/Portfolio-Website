/* ══════════════════════════════════════
   CIRCUIT — DC CURRENT FLOW ANIMATION
   ══════════════════════════════════════
   Draws animated particles showing conventional
   current from Vcc, splitting at junctions,
   and flowing to ground through each branch.

   Self-contained: requires <canvas id="circuitCanvas">
   inside .circuit-deco. Fails silently if missing.
*/

(function () {
  var canvas = document.getElementById('circuitCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var wrapper = canvas.parentElement;

  // Sizing
  function resize() {
    var w = wrapper.clientWidth;
    var h = wrapper.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Map SVG viewBox coords (420x420) to actual pixel size
  function sx(x) { return (x / 420) * wrapper.clientWidth; }
  function sy(y) { return (y / 420) * wrapper.clientHeight; }

  // ── Path definitions ───────────────────────
  // All paths start from Vcc (210,30) and flow DOWN to ground.
  // Current splits at junctions, so multiple paths share
  // the same starting segment then diverge.

  var paths = {
    // Vcc → RL → collector → through transistor → emitter → RE → ground
    // (main collector current path)
    collector: [
      [210,30],[250,30],[250,55],
      [242,61],[258,70],[242,79],[258,88],[242,97],
      [250,100],[250,155],
      [220,183],[220,209],
      [250,235],[250,280],
      [242,286],[258,295],[242,304],[258,313],[242,322],
      [250,330],[250,355]
    ],

    // Vcc → R1 → bias junction → base → (into transistor)
    // (base current — smaller, feeds into collector path inside BJT)
    base: [
      [210,30],[170,30],[170,68],
      [162,74],[178,83],[162,92],[178,101],[162,110],
      [170,118],[170,200],[207,200]
    ],

    // Vcc → R1 → bias junction → R2 → ground
    // (bias divider bleed current)
    bias: [
      [210,30],[170,30],[170,68],
      [162,74],[178,83],[162,92],[178,101],[162,110],
      [170,118],[170,200],[170,248],
      [162,254],[178,263],[162,272],[178,281],[162,290],
      [170,298],[170,355]
    ],

    // Collector junction → Vout (output signal)
    output: [
      [250,155],[350,155]
    ]
  };

  // ── Compute cumulative distances ───────────

  function computeLengths(pts) {
    var lengths = [0];
    for (var i = 1; i < pts.length; i++) {
      var dx = pts[i][0] - pts[i - 1][0];
      var dy = pts[i][1] - pts[i - 1][1];
      lengths.push(lengths[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    return lengths;
  }

  function getPointOnPath(pts, lengths, t) {
    var totalLen = lengths[lengths.length - 1];
    var target = (t % 1) * totalLen;
    for (var i = 1; i < lengths.length; i++) {
      if (lengths[i] >= target) {
        var segStart = lengths[i - 1];
        var segEnd = lengths[i];
        var segT = (target - segStart) / (segEnd - segStart);
        return {
          x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * segT,
          y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * segT
        };
      }
    }
    var last = pts[pts.length - 1];
    return { x: last[0], y: last[1] };
  }

  // Pre-compute
  var pathData = {};
  for (var key in paths) {
    pathData[key] = {
      pts: paths[key],
      lengths: computeLengths(paths[key])
    };
  }

  // ── Particle definitions ───────────────────
  // Multiple particles per path, staggered offsets.
  // All green (DC current), different sizes for depth.

  var particles = [
    // Collector current (main path — most current, 4 dots)
    { path: 'collector', speed: 0.40, offset: 0.00, r: 3.0, color: [61,240,192], alpha: 0.85 },
    { path: 'collector', speed: 0.40, offset: 0.25, r: 3.0, color: [61,240,192], alpha: 0.70 },
    { path: 'collector', speed: 0.40, offset: 0.50, r: 3.0, color: [61,240,192], alpha: 0.60 },
    { path: 'collector', speed: 0.40, offset: 0.75, r: 2.5, color: [61,240,192], alpha: 0.50 },

    // Base current (small — only a fraction enters the base)
    { path: 'base', speed: 0.35, offset: 0.00, r: 2.0, color: [61,240,192], alpha: 0.55 },
    { path: 'base', speed: 0.35, offset: 0.50, r: 2.0, color: [61,240,192], alpha: 0.40 },

    // Bias divider bleed (R1 → R2 → ground)
    { path: 'bias', speed: 0.30, offset: 0.00, r: 2.2, color: [61,240,192], alpha: 0.50 },
    { path: 'bias', speed: 0.30, offset: 0.50, r: 2.2, color: [61,240,192], alpha: 0.40 },

    // Output (signal leaving to Vout)
    { path: 'output', speed: 0.70, offset: 0.00, r: 2.5, color: [61,240,192], alpha: 0.65 },
    { path: 'output', speed: 0.70, offset: 0.50, r: 2.0, color: [61,240,192], alpha: 0.45 }
  ];

  // ── Animation loop ─────────────────────────

  var startTime = null;

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    var elapsed = (timestamp - startTime) / 1000;

    var w = wrapper.clientWidth;
    var h = wrapper.clientHeight;
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var data = pathData[p.path];
      var t = (elapsed * p.speed + p.offset) % 1;
      var pos = getPointOnPath(data.pts, data.lengths, t);

      var px = sx(pos.x);
      var py = sy(pos.y);
      var r = p.r * (w / 400);

      // Glow halo
      var grad = ctx.createRadialGradient(px, py, 0, px, py, r * 4);
      grad.addColorStop(0, 'rgba(' + p.color[0] + ',' + p.color[1] + ',' + p.color[2] + ',' + (p.alpha * 0.4) + ')');
      grad.addColorStop(1, 'rgba(' + p.color[0] + ',' + p.color[1] + ',' + p.color[2] + ',0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r * 4, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.fillStyle = 'rgba(' + p.color[0] + ',' + p.color[1] + ',' + p.color[2] + ',' + p.alpha + ')';
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  // Delay start until the circuit fade-in completes (~2.2s)
  setTimeout(function() {
    requestAnimationFrame(draw);
  }, 2200);
})();