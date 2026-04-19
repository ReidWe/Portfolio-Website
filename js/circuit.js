/* ══════════════════════════════════════
   CIRCUIT — OSCILLATOR CURRENT FLOW
   ══════════════════════════════════════
   Particle paths are derived directly from the
   wire <path> elements in assets/oscillator-circuit.svg.
   All coordinates are in the SVG viewBox space (805 x 581)
   and scale to the canvas via sx() and sy() — which use
   aspect-fit scaling to match how <object> renders the SVG.
*/

(function () {
  var canvas = document.getElementById('circuitCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var wrapper = canvas.parentElement;

  var VB_W = 805;
  var VB_H = 581;

  function resize() {
    var w = wrapper.clientWidth;
    var h = wrapper.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Aspect-fit mapping — matches how the <object> embeds the SVG
  function getFit() {
    var w = wrapper.clientWidth;
    var h = wrapper.clientHeight;
    var scale = Math.min(w / VB_W, h / VB_H);
    var offsetX = (w - VB_W * scale) / 2;
    var offsetY = (h - VB_H * scale) / 2;
    return { scale: scale, ox: offsetX, oy: offsetY };
  }

  function sx(x) { var f = getFit(); return f.ox + x * f.scale; }
  function sy(y) { var f = getFit(); return f.oy + y * f.scale; }

  // ══════════════════════════════════════
  // PATHS — follow real wires from the SVG
  // ══════════════════════════════════════

  var paths = {

    // Upper diode loop — flows in the direction of each diode's arrow:
    // right-to-left through the top diode (points left),
    // then left-to-right through the bottom diode (points right).
    upperLoop: [
      [502,65], [502,100],
      [533,100], [589,100], [613,100],  // through bottom diode, L → R
      [653,100], [653,60], [653,20],
      [613,20], [589,20], [533,20],     // through top diode, R → L
      [502,20], [502,60]
    ],

    // Top resistor (373,60) → through R → (473,60) → wire → junction at (502,60)
    topResistor: [
      [373,60], [473,60], [497,60], [502,60]
    ],

    // Left input resistor: (213,140) → (313,140) → junction (333,140)
    leftInput: [
      [213,140], [313,140], [333,140]
    ],

    // Middle down into op-amp + input: (333,140) → (333,180)
    middleDown: [
      [333,140], [333,180]
    ],

    // Right feedback resistor: (561,220) → (461,220) → (333,220) → (333,180)
    rightFeedback: [
      [561,220], [461,220], [333,220], [333,180]
    ],

    // Amp output to top-right junction, then down long vertical
    ampOutput: [
      [658,60], [699,60], [699,130], [699,135],
      [741,135], [741,325], [741,330]
    ],

    // Right-side down through feedback
    rightDown: [
      [699,140], [699,220], [561,220]
    ],

    // Output horizontal to Vout
    output: [
      [667,330], [736,330], [741,330], [745,330], [802,330]
    ],

    // Op-amp output across top: (476,330) → (657,330) → (662,330)
    bottomFeedback: [
      [476,330], [657,330], [662,330]
    ],

    // Bottom horizontal feedback through components
    bottomRight: [
      [402,431], [447,431], [457,431], [502,431], [542,431],
      [560,431], [642,431]
    ],

    // Right-up feedback column
    rightUp: [
      [662,431], [662,335], [662,330]
    ],

    // Second op-amp bottom down to ground area
    bottomAmpDown: [
      [327.5,436], [327.5,540], [327.5,550], [327.5,560]
    ],

    // Capacitor junction up to feedback node
    capToJunction: [
      [215.5,451], [215.5,431], [322.5,431], [327.5,431]
    ],

    // Left branch horizontal through inductor/resistor
    leftBranch: [
      [22.5,299], [62,299], [162,299], [182,299], [187,299]
    ],

    // Left branch up to op-amp input
    leftBranchUp: [
      [187,299], [187,140], [213,140]
    ],

    // Op-amp bottom-left horizontal feedback
    ampBottomLeft: [
      [378,299], [285,300], [192,299], [187,299]
    ],

    // Op-amp bottom-right to feedback junction
    ampBottomRight: [
      [378,360], [327.5,360], [327.5,426], [327.5,431]
    ]
  };

  // ══════════════════════════════════════
  // Distance computation + sampling
  // ══════════════════════════════════════

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

  var pathData = {};
  for (var key in paths) {
    pathData[key] = {
      pts: paths[key],
      lengths: computeLengths(paths[key])
    };
  }

  // ══════════════════════════════════════
  // Particle definitions
  // ══════════════════════════════════════
  // SPEED_MULT scales all particle speeds globally —
  // bump this up to make the flow faster, down to slow it.
  var SPEED_MULT = 3.0;

  var particles = [
    { path: 'upperLoop',      speed: 0.15, offset: 0.00, r: 2.5, alpha: 0.75 },
    { path: 'upperLoop',      speed: 0.15, offset: 0.50, r: 2.5, alpha: 0.60 },
    { path: 'topResistor',    speed: 0.45, offset: 0.00, r: 2.3, alpha: 0.70 },
    { path: 'leftInput',      speed: 0.40, offset: 0.00, r: 2.5, alpha: 0.75 },
    { path: 'leftInput',      speed: 0.40, offset: 0.50, r: 2.3, alpha: 0.55 },
    { path: 'middleDown',     speed: 0.80, offset: 0.00, r: 2.3, alpha: 0.65 },
    { path: 'rightFeedback',  speed: 0.30, offset: 0.00, r: 2.5, alpha: 0.70 },
    { path: 'rightFeedback',  speed: 0.30, offset: 0.50, r: 2.3, alpha: 0.55 },
    { path: 'ampOutput',      speed: 0.22, offset: 0.00, r: 2.8, alpha: 0.80 },
    { path: 'ampOutput',      speed: 0.22, offset: 0.50, r: 2.5, alpha: 0.60 },
    { path: 'rightDown',      speed: 0.35, offset: 0.00, r: 2.5, alpha: 0.65 },
    { path: 'output',         speed: 0.60, offset: 0.00, r: 2.8, alpha: 0.75 },
    { path: 'output',         speed: 0.60, offset: 0.50, r: 2.5, alpha: 0.55 },
    { path: 'bottomFeedback', speed: 0.40, offset: 0.00, r: 2.5, alpha: 0.70 },
    { path: 'bottomFeedback', speed: 0.40, offset: 0.50, r: 2.3, alpha: 0.55 },
    { path: 'bottomRight',    speed: 0.30, offset: 0.00, r: 2.5, alpha: 0.70 },
    { path: 'bottomRight',    speed: 0.30, offset: 0.50, r: 2.3, alpha: 0.55 },
    { path: 'rightUp',        speed: 0.55, offset: 0.00, r: 2.3, alpha: 0.65 },
    { path: 'bottomAmpDown',  speed: 0.50, offset: 0.00, r: 2.3, alpha: 0.60 },
    { path: 'capToJunction',  speed: 0.40, offset: 0.00, r: 2.3, alpha: 0.65 },
    { path: 'leftBranch',     speed: 0.35, offset: 0.00, r: 2.3, alpha: 0.65 },
    { path: 'leftBranchUp',   speed: 0.35, offset: 0.00, r: 2.3, alpha: 0.60 },
    { path: 'ampBottomLeft',  speed: 0.30, offset: 0.00, r: 2.3, alpha: 0.60 },
    { path: 'ampBottomRight', speed: 0.40, offset: 0.00, r: 2.3, alpha: 0.60 }
  ];

  // Apply the global speed multiplier
  for (var si = 0; si < particles.length; si++) {
    particles[si].speed *= SPEED_MULT;
  }

  var GREEN = [61, 240, 192];
  var WARM  = [240, 160, 61];

  // ══════════════════════════════════════
  // Oscillator — controls how fast the current
  // reverses direction. One full cycle = one
  // forward swing + one backward swing.
  // ══════════════════════════════════════
  var OSC_HZ = 0.35; // cycles per second

  // Per-particle phase accumulator. Updated each frame
  // based on dt * speed * sin(osc), so particles truly
  // reverse direction rather than being re-sampled from
  // a non-monotonic clock.
  var particlePhases = new Array(particles.length);
  for (var pi = 0; pi < particles.length; pi++) {
    particlePhases[pi] = particles[pi].offset;
  }

  // ══════════════════════════════════════
  // Render loop
  // ══════════════════════════════════════

  var startTime = null;
  var prevTimestamp = null;

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    var elapsed = (timestamp - startTime) / 1000;
    var dt = prevTimestamp == null ? 0 : (timestamp - prevTimestamp) / 1000;
    prevTimestamp = timestamp;

    // Oscillator signal in [-1, 1] — the instantaneous
    // magnitude + direction of current at this moment.
    var osc = Math.sin(2 * Math.PI * OSC_HZ * elapsed);

    var w = wrapper.clientWidth;
    var h = wrapper.clientHeight;
    ctx.clearRect(0, 0, w, h);

    var fit = getFit();
    var scale = fit.scale;

    // Color blend: green at osc = +1 (forward), warm at osc = -1 (reverse)
    var t01 = (osc + 1) / 2;
    var colR = Math.round(WARM[0] + (GREEN[0] - WARM[0]) * t01);
    var colG = Math.round(WARM[1] + (GREEN[1] - WARM[1]) * t01);
    var colB = Math.round(WARM[2] + (GREEN[2] - WARM[2]) * t01);

    // Fade particles near the zero-crossings (current → 0 mid-swing)
    var magAlpha = Math.abs(osc) * 0.7 + 0.3;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var data = pathData[p.path];

      // Advance phase by dt * speed * osc. When osc < 0, phase
      // decrements and the particle actually travels backward.
      particlePhases[i] += dt * p.speed * osc;
      var t = ((particlePhases[i] % 1) + 1) % 1;

      var pos = getPointOnPath(data.pts, data.lengths, t);
      var px = sx(pos.x);
      var py = sy(pos.y);
      var r = p.r * scale * 1.5;
      var a = p.alpha * magAlpha;

      // Glow halo
      var grad = ctx.createRadialGradient(px, py, 0, px, py, r * 4);
      grad.addColorStop(0, 'rgba(' + colR + ',' + colG + ',' + colB + ',' + (a * 0.4) + ')');
      grad.addColorStop(1, 'rgba(' + colR + ',' + colG + ',' + colB + ',0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r * 4, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.fillStyle = 'rgba(' + colR + ',' + colG + ',' + colB + ',' + a + ')';
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  // ══════════════════════════════════════
  // SVG DRAW-IN ANIMATION
  // ══════════════════════════════════════
  // Polls for the embedded SVG to be available, then
  // animates each <path> drawing itself in. If the SVG
  // document isn't reachable (timing, cross-origin, etc.)
  // we just skip the draw-in and start particles anyway.

  var particlesStarted = false;
  function startParticles() {
    if (particlesStarted) return;
    particlesStarted = true;
    requestAnimationFrame(draw);
  }

  function tryDrawIn() {
    var obj = document.querySelector('.circuit-svg-embed');
    if (!obj) { startParticles(); return; }

    var attempts = 0;
    var maxAttempts = 40; // ~4 seconds of polling

    function poll() {
      attempts++;
      var svgDoc = null;
      try {
        svgDoc = obj.contentDocument || (obj.getSVGDocument && obj.getSVGDocument());
      } catch (e) {
        svgDoc = null;
      }

      var paths = svgDoc ? svgDoc.querySelectorAll('path') : null;

      if (paths && paths.length > 0) {
        runAnimation(paths);
        return;
      }

      if (attempts >= maxAttempts) {
        startParticles();
        return;
      }

      setTimeout(poll, 100);
    }

    function runAnimation(paths) {
      var pathsWithLengths = [];
      for (var i = 0; i < paths.length; i++) {
        var p = paths[i];
        var len;
        try {
          len = p.getTotalLength();
        } catch (e) {
          continue;
        }
        if (len === 0 || !isFinite(len)) continue;

        // Use setAttribute — has higher specificity than inline style
        // and can't be overridden by other style properties on the element
        p.setAttribute('stroke-dasharray', len);
        p.setAttribute('stroke-dashoffset', len);
        pathsWithLengths.push({ el: p, len: len });
      }

      if (!pathsWithLengths.length) {
        startParticles();
        return;
      }

      // Force reflow so the initial invisible state is painted
      obj.getBoundingClientRect();

      var totalDuration = 2500;
      var staggerWindow = 1000;
      var perPathDuration = totalDuration - staggerWindow;
      var startTs = null;

      function step(ts) {
        if (!startTs) startTs = ts;
        var elapsed = ts - startTs;

        for (var i = 0; i < pathsWithLengths.length; i++) {
          var entry = pathsWithLengths[i];
          var pathStart = (i / pathsWithLengths.length) * staggerWindow;
          var localT = (elapsed - pathStart) / perPathDuration;
          if (localT < 0) localT = 0;
          if (localT > 1) localT = 1;
          var eased = 1 - Math.pow(1 - localT, 3);
          entry.el.setAttribute('stroke-dashoffset', entry.len * (1 - eased));
        }

        if (elapsed < totalDuration) {
          requestAnimationFrame(step);
        } else {
          for (var j = 0; j < pathsWithLengths.length; j++) {
            pathsWithLengths[j].el.removeAttribute('stroke-dasharray');
            pathsWithLengths[j].el.removeAttribute('stroke-dashoffset');
          }
          startParticles();
        }
      }

      requestAnimationFrame(step);
    }

    poll();
  }

  // Absolute safety net — if nothing else works after 5s, start particles
  setTimeout(startParticles, 5000);

  // Start the sequence
  if (document.readyState === 'complete') {
    tryDrawIn();
  } else {
    window.addEventListener('load', tryDrawIn);
  }
})();