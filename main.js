/* ══════════════════════════════════════
   SCROLL REVEAL
   ══════════════════════════════════════
   Fades in sections as they enter the viewport.
*/

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.reveal').forEach((el) => {
  observer.observe(el);
});


/* ══════════════════════════════════════
   SMOOTH SCROLL
   ══════════════════════════════════════
   Handles anchor links for smooth navigation.
*/

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});


/* ══════════════════════════════════════
   BADGE — LANYARD PHYSICS SIMULATION
   ══════════════════════════════════════
   Interactive draggable Syracuse badge with
   verlet-integration rope physics.
*/

(function () {
  const badgeCanvas = document.getElementById('badgeCanvas');
  if (!badgeCanvas) return;
  const bCtx2 = badgeCanvas.getContext('2d');
  const wrap = badgeCanvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  let bW, bH;

  function badgeResize() {
    const cssW = wrap.clientWidth + 500;
    const cssH = wrap.clientHeight + 300;
    badgeCanvas.width = cssW * dpr;
    badgeCanvas.height = cssH * dpr;
    badgeCanvas.style.width = cssW + 'px';
    badgeCanvas.style.height = cssH + 'px';
    bCtx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    bW = cssW;
    bH = cssH;
    badgeAnchor.x = bW / 2;
    badgeAnchor.y = 140;
  }

  // Physics constants
  const BGRAVITY = 0.7;
  const BDAMPING = 0.975;
  const BROPE_SEGMENTS = 12;
  const BROPE_LENGTH = 18;
  const badgeAnchor = { x: 0, y: 140 };
  const bPoints = [];

  for (let i = 0; i <= BROPE_SEGMENTS; i++) {
    bPoints.push({
      x: 0,
      y: 140 + i * BROPE_LENGTH,
      oldX: 0,
      oldY: 140 + i * BROPE_LENGTH,
    });
  }

  const BBADGE_W = 180;
  const BBADGE_H = 250;
  let bDragging = false;
  let bDragPoint = null;
  let bMouseX = -1000;
  let bMouseY = -1000;
  let bSmoothAngle = 0;

  // Off-screen texture canvas for the badge face
  const texCanvas = document.createElement('canvas');
  const tCtx = texCanvas.getContext('2d');
  const texScale = Math.max(2, dpr);
  texCanvas.width = BBADGE_W * texScale;
  texCanvas.height = BBADGE_H * texScale;

  // Optional photo loading
  const badgePhoto = new Image();
  const photoExts = ['png', 'jpg', 'jpeg', 'webp'];
  let photoExtIdx = 0;

  function tryNextPhoto() {
    if (photoExtIdx < photoExts.length) {
      badgePhoto.src = 'assets/photo.' + photoExts[photoExtIdx];
      photoExtIdx++;
    }
  }

  badgePhoto.onload = function () {
    drawBadgeTex();
  };
  badgePhoto.onerror = function () {
    tryNextPhoto();
  };
  tryNextPhoto();

  // Draw the badge texture
  function drawBadgeTex() {
    const s = texScale;
    const w = BBADGE_W * s;
    const h = BBADGE_H * s;
    const r = 16 * s;

    tCtx.clearRect(0, 0, w, h);
    tCtx.save();

    // Badge body
    tCtx.beginPath();
    tCtx.roundRect(0, 0, w, h, r);
    tCtx.fillStyle = '#ffffff';
    tCtx.fill();

    // Header bar
    const headerH = h * 0.28;
    tCtx.beginPath();
    tCtx.roundRect(0, 0, w, headerH, [r, r, 0, 0]);
    tCtx.fillStyle = '#F47721';
    tCtx.fill();

    // Accent triangle
    tCtx.beginPath();
    tCtx.moveTo(w * 0.6, 0);
    tCtx.lineTo(w, 0);
    tCtx.lineTo(w, headerH * 0.6);
    tCtx.closePath();
    tCtx.fillStyle = 'rgba(0,51,102,0.25)';
    tCtx.fill();

    // Header text
    tCtx.fillStyle = '#ffffff';
    tCtx.font = `bold ${11 * s}px 'Source Sans 3', sans-serif`;
    tCtx.textAlign = 'center';
    tCtx.fillText('SYRACUSE UNIVERSITY', w / 2, headerH * 0.42);
    tCtx.font = `bold ${34 * s}px 'Source Sans 3', sans-serif`;
    tCtx.fillText('SU', w / 2, headerH * 0.85);

    // Photo area
    const photoSize = 62 * s;
    const photoX = (w - photoSize) / 2;
    const photoY = headerH + 16 * s;
    tCtx.save();
    tCtx.beginPath();
    tCtx.roundRect(photoX, photoY, photoSize, photoSize, 8 * s);
    tCtx.clip();

    if (badgePhoto.complete && badgePhoto.naturalWidth > 0) {
      const imgW = badgePhoto.naturalWidth;
      const imgH = badgePhoto.naturalHeight;
      const cropSize = Math.min(imgW, imgH);
      const sx = (imgW - cropSize) / 2;
      const sy = (imgH - cropSize) / 2;
      tCtx.drawImage(badgePhoto, sx, sy, cropSize, cropSize, photoX, photoY, photoSize, photoSize);
    } else {
      tCtx.fillStyle = '#003366';
      tCtx.fillRect(photoX, photoY, photoSize, photoSize);
      tCtx.fillStyle = 'rgba(255,255,255,0.15)';
      const cx = photoX + photoSize / 2;
      const cy = photoY + photoSize * 0.38;
      tCtx.beginPath();
      tCtx.arc(cx, cy, 14 * s, 0, Math.PI * 2);
      tCtx.fill();
      tCtx.beginPath();
      tCtx.ellipse(cx, cy + 32 * s, 22 * s, 16 * s, 0, Math.PI, 0, true);
      tCtx.fill();
    }
    tCtx.restore();

    // Photo border
    tCtx.strokeStyle = '#003366';
    tCtx.lineWidth = 2 * s;
    tCtx.beginPath();
    tCtx.roundRect(photoX, photoY, photoSize, photoSize, 8 * s);
    tCtx.stroke();

    // Name and details
    const textY = photoY + photoSize + 24 * s;
    tCtx.fillStyle = '#1a1a2e';
    tCtx.font = `bold ${13 * s}px 'Source Sans 3', sans-serif`;
    tCtx.textAlign = 'center';
    tCtx.fillText('REID WEBSTER', w / 2, textY);

    tCtx.fillStyle = '#666';
    tCtx.font = `${9 * s}px 'Source Sans 3', sans-serif`;
    tCtx.fillText('Spring 2026', w / 2, textY + 18 * s);

    tCtx.fillStyle = '#003366';
    tCtx.font = `600 ${9 * s}px 'Source Sans 3', sans-serif`;
    tCtx.fillText('College of Engineering & Computer Science', w / 2, textY + 36 * s);

    // Bottom bar
    const barH2 = 16 * s;
    tCtx.beginPath();
    tCtx.roundRect(0, h - barH2, w, barH2, [0, 0, r, r]);
    tCtx.fillStyle = '#003366';
    tCtx.fill();

    // Barcode
    tCtx.fillStyle = '#ddd';
    const bcY = textY + 52 * s;
    const bcW2 = w * 0.5;
    const bcX = (w - bcW2) / 2;
    for (let i = 0; i < 30; i++) {
      const lw = i % 3 === 0 ? 3 * s : 1.5 * s;
      tCtx.fillRect(bcX + i * (bcW2 / 30), bcY, lw, 16 * s);
    }

    // Lanyard hole
    tCtx.fillStyle = '#e0e0e0';
    tCtx.beginPath();
    tCtx.arc(w / 2, 12 * s, 6 * s, 0, Math.PI * 2);
    tCtx.fill();
    tCtx.fillStyle = '#F47721';
    tCtx.beginPath();
    tCtx.arc(w / 2, 12 * s, 3 * s, 0, Math.PI * 2);
    tCtx.fill();

    tCtx.restore();
  }

  drawBadgeTex();
  badgeResize();

  // Initialize rope points at anchor
  for (let i = 0; i <= BROPE_SEGMENTS; i++) {
    bPoints[i].x = badgeAnchor.x;
    bPoints[i].oldX = badgeAnchor.x;
    bPoints[i].y = badgeAnchor.y + i * BROPE_LENGTH;
    bPoints[i].oldY = badgeAnchor.y + i * BROPE_LENGTH;
  }

  window.addEventListener('resize', badgeResize);

  // Physics simulation
  function bSimulate() {
    for (let i = 1; i < bPoints.length; i++) {
      const p = bPoints[i];
      let vx = (p.x - p.oldX) * BDAMPING;
      let vy = (p.y - p.oldY) * BDAMPING;
      const maxV = 28;
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > maxV) {
        vx = (vx / speed) * maxV;
        vy = (vy / speed) * maxV;
      }
      p.oldX = p.x;
      p.oldY = p.y;
      p.x += vx;
      p.y += vy + BGRAVITY;
      if (i >= bPoints.length - 3) p.y += 0.3;
      if (!bDragging) {
        const dmx = p.x - bMouseX;
        const dmy = p.y - bMouseY;
        const md = Math.sqrt(dmx * dmx + dmy * dmy);
        if (md < 80 && md > 0) {
          const str = (1 - md / 80) * 1.8;
          p.x += (dmx / md) * str;
          p.y += (dmy / md) * str;
        }
      }
    }

    bPoints[0].x = badgeAnchor.x;
    bPoints[0].y = badgeAnchor.y;

    if (bDragging && bDragPoint !== null) {
      const idx = bDragPoint.ropeIndex !== undefined ? bDragPoint.ropeIndex : bPoints.length - 1;
      bPoints[idx].x = bDragPoint.x;
      bPoints[idx].y = bDragPoint.y;
    }

    // Constraint solving
    for (let iter = 0; iter < 8; iter++) {
      for (let i = 0; i < bPoints.length - 1; i++) {
        const a = bPoints[i];
        const b = bPoints[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d === 0) continue;
        const diff = ((BROPE_LENGTH - d) / d) * 0.5;
        const ox = dx * diff;
        const oy = dy * diff;
        if (i === 0) {
          b.x += ox * 2;
          b.y += oy * 2;
        } else if (bDragging && bDragPoint && bDragPoint.ropeIndex === undefined && i === bPoints.length - 2) {
          a.x -= ox * 2;
          a.y -= oy * 2;
        } else {
          a.x -= ox;
          a.y -= oy;
          b.x += ox;
          b.y += oy;
        }
      }
      bPoints[0].x = badgeAnchor.x;
      bPoints[0].y = badgeAnchor.y;
      if (bDragging && bDragPoint !== null) {
        const idx = bDragPoint.ropeIndex !== undefined ? bDragPoint.ropeIndex : bPoints.length - 1;
        bPoints[idx].x = bDragPoint.x;
        bPoints[idx].y = bDragPoint.y;
      }
    }
  }

  // Rendering
  let bSmoothTwist = 0;

  function bRender() {
    bCtx2.clearRect(0, 0, bW, bH);

    // Clip / anchor
    bCtx2.save();
    bCtx2.fillStyle = '#aaa';
    bCtx2.beginPath();
    bCtx2.roundRect(badgeAnchor.x - 8, badgeAnchor.y - 10, 16, 24, 4);
    bCtx2.fill();
    bCtx2.fillStyle = '#888';
    bCtx2.beginPath();
    bCtx2.roundRect(badgeAnchor.x - 5, badgeAnchor.y - 6, 10, 16, 2);
    bCtx2.fill();
    bCtx2.restore();

    // Lanyard ribbon
    const LANYARD_BASE_W = 14;
    const LANYARD_MIN_W = 3;
    for (let i = 0; i < bPoints.length - 1; i++) {
      const a = bPoints[i];
      const b = bPoints[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      if (segLen === 0) continue;
      const nx = -dy / segLen;
      const ny = dx / segLen;
      const horizontalness = Math.abs(dx) / (segLen + 1);
      const wA = LANYARD_MIN_W + (LANYARD_BASE_W - LANYARD_MIN_W) * (1 - horizontalness * 0.6);
      let wB = wA;
      if (i + 2 < bPoints.length) {
        const c = bPoints[i + 2];
        const dx2 = c.x - b.x;
        const dy2 = c.y - b.y;
        const sl2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        wB = LANYARD_MIN_W + (LANYARD_BASE_W - LANYARD_MIN_W) * (1 - (Math.abs(dx2) / (sl2 + 1)) * 0.6);
      }
      const hA = wA / 2;
      const hB = wB / 2;

      // Outer ribbon (orange)
      bCtx2.beginPath();
      bCtx2.moveTo(a.x + nx * hA, a.y + ny * hA);
      bCtx2.lineTo(b.x + nx * hB, b.y + ny * hB);
      bCtx2.lineTo(b.x - nx * hB, b.y - ny * hB);
      bCtx2.lineTo(a.x - nx * hA, a.y - ny * hA);
      bCtx2.closePath();
      bCtx2.fillStyle = '#F47721';
      bCtx2.fill();

      // Inner stripe (navy)
      const shA = hA * 0.25;
      const shB = hB * 0.25;
      bCtx2.beginPath();
      bCtx2.moveTo(a.x + nx * shA, a.y + ny * shA);
      bCtx2.lineTo(b.x + nx * shB, b.y + ny * shB);
      bCtx2.lineTo(b.x - nx * shB, b.y - ny * shB);
      bCtx2.lineTo(a.x - nx * shA, a.y - ny * shA);
      bCtx2.closePath();
      bCtx2.fillStyle = '#003366';
      bCtx2.fill();

      // Highlight edge
      bCtx2.beginPath();
      bCtx2.moveTo(a.x + nx * hA, a.y + ny * hA);
      bCtx2.lineTo(b.x + nx * hB, b.y + ny * hB);
      bCtx2.strokeStyle = 'rgba(255,180,80,0.5)';
      bCtx2.lineWidth = 1;
      bCtx2.stroke();
    }

    // Badge card
    const tip = bPoints[bPoints.length - 1];
    let avgDx = 0;
    let avgDy = 0;
    const sc = Math.min(5, bPoints.length - 1);
    for (let s2 = 0; s2 < sc; s2++) {
      const idx = bPoints.length - 1 - s2;
      const idxP = idx - 1;
      if (idxP < 0) break;
      const wt = (sc - s2) / sc;
      avgDx += (bPoints[idx].x - bPoints[idxP].x) * wt;
      avgDy += (bPoints[idx].y - bPoints[idxP].y) * wt;
    }

    const tAngle = Math.atan2(avgDx, avgDy);
    let aDiff = tAngle - bSmoothAngle;
    while (aDiff > Math.PI) aDiff -= Math.PI * 2;
    while (aDiff < -Math.PI) aDiff += Math.PI * 2;
    bSmoothAngle += aDiff * 0.12;

    const tipVx = tip.x - (tip.oldX || tip.x);
    const targetTwist = tipVx * 0.04;
    bSmoothTwist += (targetTwist - bSmoothTwist) * 0.08;

    const twist = Math.max(-0.85, Math.min(0.85, bSmoothTwist));
    const scaleX = Math.cos(twist * Math.PI * 0.5);
    const showBack = Math.abs(twist) > 0.5;

    bCtx2.save();
    bCtx2.translate(tip.x, tip.y);
    bCtx2.rotate(bSmoothAngle);
    bCtx2.scale(scaleX, 1);

    // Shadow
    bCtx2.save();
    bCtx2.shadowColor = 'rgba(0,0,0,0.35)';
    bCtx2.shadowBlur = 20;
    bCtx2.shadowOffsetX = 4 * scaleX;
    bCtx2.shadowOffsetY = 8;
    bCtx2.beginPath();
    bCtx2.roundRect(-BBADGE_W / 2, -10, BBADGE_W, BBADGE_H, 16);
    bCtx2.fillStyle = 'rgba(0,0,0,0)';
    bCtx2.fill();
    bCtx2.restore();

    // Badge face
    bCtx2.save();
    bCtx2.beginPath();
    bCtx2.roundRect(-BBADGE_W / 2, -10, BBADGE_W, BBADGE_H, 16);
    bCtx2.clip();

    if (showBack) {
      bCtx2.fillStyle = '#e8e8e8';
      bCtx2.fillRect(-BBADGE_W / 2, -10, BBADGE_W, BBADGE_H);
      bCtx2.fillStyle = '#1a1a2e';
      bCtx2.fillRect(-BBADGE_W / 2, 40, BBADGE_W, 36);
      bCtx2.fillStyle = '#ccc';
      bCtx2.font = 'bold 28px "Source Sans 3", sans-serif';
      bCtx2.textAlign = 'center';
      bCtx2.fillText('SU', 0, BBADGE_H / 2 + 20);
    } else {
      bCtx2.drawImage(texCanvas, -BBADGE_W / 2, -10, BBADGE_W, BBADGE_H);
    }

    // Twist shadow overlay
    if (Math.abs(twist) > 0.1) {
      bCtx2.fillStyle = 'rgba(0,0,0,' + Math.abs(twist) * 0.3 + ')';
      bCtx2.fillRect(-BBADGE_W / 2, -10, BBADGE_W, BBADGE_H);
    }

    bCtx2.restore();
    bCtx2.restore();
  }

  // Animation loop
  function bLoop() {
    bSimulate();
    bRender();
    requestAnimationFrame(bLoop);
  }
  bLoop();

  // Hit testing
  function bGetPos(e) {
    const rect = badgeCanvas.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function bHitTest(mx, my) {
    const tip = bPoints[bPoints.length - 1];
    const angle = bSmoothAngle;
    const dmx = mx - tip.x;
    const dmy = my - tip.y;
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const lx = dmx * cos - dmy * sin;
    const ly = dmx * sin + dmy * cos;
    return lx >= -BBADGE_W / 2 && lx <= BBADGE_W / 2 && ly >= -10 && ly <= BBADGE_H - 10;
  }

  function bHitLanyard(mx, my) {
    for (let i = 1; i < bPoints.length; i++) {
      const p = bPoints[i];
      if (Math.abs(p.x - mx) < 25 && Math.abs(p.y - my) < 25) return i;
    }
    return -1;
  }

  // Proximity detection for pointer-events toggling
  function isNearBadge(pageX, pageY) {
    const rect = badgeCanvas.getBoundingClientRect();
    const cx = pageX - rect.left;
    const cy = pageY - rect.top;
    const proximity = 60;
    if (Math.abs(cx - badgeAnchor.x) < proximity && Math.abs(cy - badgeAnchor.y) < proximity) return true;
    for (let i = 0; i < bPoints.length; i++) {
      if (Math.abs(cx - bPoints[i].x) < proximity && Math.abs(cy - bPoints[i].y) < proximity) return true;
    }
    if (bHitTest(cx, cy)) return true;
    const tip = bPoints[bPoints.length - 1];
    const dmx = cx - tip.x;
    const dmy = cy - tip.y;
    const cos = Math.cos(-bSmoothAngle);
    const sin = Math.sin(-bSmoothAngle);
    const lx = dmx * cos - dmy * sin;
    const ly = dmx * sin + dmy * cos;
    const pad = 40;
    if (lx >= -BBADGE_W / 2 - pad && lx <= BBADGE_W / 2 + pad && ly >= -10 - pad && ly <= BBADGE_H - 10 + pad) return true;
    return false;
  }

  // Toggle pointer-events based on proximity
  document.addEventListener('mousemove', function (e) {
    if (bDragging) return;
    if (isNearBadge(e.clientX, e.clientY)) {
      badgeCanvas.classList.add('near-badge');
    } else {
      badgeCanvas.classList.remove('near-badge');
    }
  });

  // Drag handlers
  function bOnDown(e) {
    const pos = bGetPos(e);
    const isTouch = !!e.touches;
    if (bHitTest(pos.x, pos.y)) {
      if (isTouch) e.preventDefault();
      bDragging = true;
      bDragPoint = { x: pos.x, y: pos.y };
      const p = bPoints[bPoints.length - 1];
      p.oldX = p.x;
      p.oldY = p.y;
      badgeCanvas.classList.add('dragging');
      return;
    }
    const ropeIdx = bHitLanyard(pos.x, pos.y);
    if (ropeIdx > 0) {
      if (isTouch) e.preventDefault();
      bDragging = true;
      bDragPoint = { x: pos.x, y: pos.y, ropeIndex: ropeIdx };
      const p = bPoints[ropeIdx];
      p.oldX = p.x;
      p.oldY = p.y;
      badgeCanvas.classList.add('dragging');
      return;
    }
  }

  function bOnMove(e) {
    const pos = bGetPos(e);
    bMouseX = pos.x;
    bMouseY = pos.y;
    if (!bDragging) return;
    e.preventDefault();
    const lerp = 0.6;
    if (bDragPoint.ropeIndex !== undefined) {
      const p = bPoints[bDragPoint.ropeIndex];
      bDragPoint.x += (pos.x - bDragPoint.x) * lerp;
      bDragPoint.y += (pos.y - bDragPoint.y) * lerp;
      p.x = bDragPoint.x;
      p.y = bDragPoint.y;
    } else {
      bDragPoint.x += (pos.x - bDragPoint.x) * lerp;
      bDragPoint.y += (pos.y - bDragPoint.y) * lerp;
    }
  }

  function bOnUp() {
    bDragging = false;
    bDragPoint = null;
    badgeCanvas.classList.remove('dragging');
  }

  // Mouse events
  badgeCanvas.addEventListener('mousedown', bOnDown);
  badgeCanvas.addEventListener('mousemove', bOnMove);
  badgeCanvas.addEventListener('mouseup', bOnUp);
  badgeCanvas.addEventListener('mouseleave', bOnUp);

  // Touch events
  badgeCanvas.addEventListener(
    'touchstart',
    function (e) {
      badgeCanvas.classList.add('near-badge');
      bOnDown(e);
    },
    { passive: false }
  );
  badgeCanvas.addEventListener('touchmove', bOnMove, { passive: false });
  badgeCanvas.addEventListener('touchend', function () {
    bOnUp();
    badgeCanvas.classList.remove('near-badge');
  });
})();