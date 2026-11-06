/**
 * PIPPO KART — costruzione del "mondo" di una pista:
 *   - linea centrale smussata (spline) campionata ogni ~4 pixel, con lunghezze e direzioni
 *   - TEXTURE del suolo 1024x1024 (erba a scacchi, sabbia, cordoli, asfalto, griglia di partenza)
 *   - MAPPA DELLE SUPERFICI (asfalto / cordolo / erba / sabbia / muro) per la fisica
 *   - decorazioni a bordo pista (alberi, tribune, cartelli, yacht...)
 *   - panorama all'orizzonte e minimappa
 */
(function () {
  'use strict';

  const SIZE = 1024;
  const SURF = { GRASS: 0, ROAD: 1, KERB: 2, SAND: 3, WALL: 4 };

  function catmull(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }

  /** Campiona la spline chiusa: punti ogni ~4 px con x, y, direzione, pendenza, galleria */
  function sampleTrack(tr) {
    const P = tr.pts, n = P.length;
    const dense = [];
    for (let i = 0; i < n; i++) {
      const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n], d = P[(i + 2) % n];
      const ob = b[2] || {}, oc = c[2] || {};
      for (let t = 0; t < 1; t += 0.02) {
        dense.push({
          x: catmull(a[0], b[0], c[0], d[0], t), y: catmull(a[1], b[1], c[1], d[1], t),
          hill: (ob.hill || 0) * (1 - t) + (oc.hill || 0) * t,
          tunnel: !!(ob.tunnel && (oc.tunnel || t < 0.6)),
          pt: i,
        });
      }
    }
    // ricampionamento a passo costante
    const out = [];
    let acc = 0;
    out.push(Object.assign({}, dense[0]));
    for (let i = 1; i <= dense.length; i++) {
      const p = dense[i - 1], q = dense[i % dense.length];
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      acc += d;
      while (acc >= 4) {
        acc -= 4;
        const k = 1 - acc / (d || 1);
        out.push({ x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k, hill: q.hill, tunnel: q.tunnel, pt: q.pt });
      }
    }
    out.pop();
    for (let i = 0; i < out.length; i++) {
      const a = out[(i - 1 + out.length) % out.length], b = out[(i + 1) % out.length];
      out[i].dir = Math.atan2(b.y - a.y, b.x - a.x);
    }
    // il campione 0 è il traguardo: lo mettiamo sul punto di controllo 1 (sul rettilineo)
    const start = out.findIndex((s) => s.pt === 1);
    return out.slice(start).concat(out.slice(0, start));
  }

  function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

  function strokePath(g, S, width, color, dash) {
    g.strokeStyle = color; g.lineWidth = width; g.lineJoin = 'round'; g.lineCap = 'round';
    g.setLineDash(dash || []);
    g.beginPath();
    S.forEach((s, i) => (i ? g.lineTo(s.x, s.y) : g.moveTo(s.x, s.y)));
    g.closePath();
    g.stroke();
    g.setLineDash([]);
  }

  function build(tr) {
    const S = sampleTrack(tr);
    const W = tr.width;

    // ---------------- texture del suolo ----------------
    const tc = document.createElement('canvas'); tc.width = tc.height = SIZE;
    const g = tc.getContext('2d');
    // erba (o marciapiede a Monaco) a scacchi grandi: dà il senso della velocità
    for (let y = 0; y < SIZE; y += 32) for (let x = 0; x < SIZE; x += 32) {
      g.fillStyle = ((x + y) / 32) % 2 ? tr.ground : tr.ground2;
      g.fillRect(x, y, 32, 32);
    }
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = hash(i, 7) < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.10)';
      g.fillRect(Math.floor(hash(i, 1) * SIZE), Math.floor(hash(i, 2) * SIZE), 2, 2);
    }
    if (tr.id === 'monaco') {
      // il porto: acqua blu dentro l'anello, a destra
      g.fillStyle = '#2f8bff';
      g.fillRect(720, 160, 140, 560);
      g.fillStyle = '#5fb0ff';
      for (let y = 170; y < 710; y += 14) for (let x = 728; x < 852; x += 22) g.fillRect(x + (y % 28 ? 8 : 0), y, 8, 2);
      // e il mare in alto, oltre il tunnel
      g.fillStyle = '#2f8bff'; g.fillRect(0, 0, SIZE, 70);
    }
    if (!tr.walls) strokePath(g, S, W + 44, tr.runoff);                        // vie di fuga di sabbia
    else strokePath(g, S, W + 14, '#c9ccd4');                                   // guardrail
    if (tr.walls) strokePath(g, S, W + 14, '#ff3b3b', [10, 10]);
    strokePath(g, S, W + 8, '#ffffff');                                         // cordoli bianchi...
    strokePath(g, S, W + 8, '#e8202a', [8, 8]);                                 // ...e rossi
    strokePath(g, S, W, '#55565f');                                             // asfalto
    // gallerie più scure
    g.save();
    for (let i = 0; i < S.length; i++) {
      if (!S[i].tunnel) continue;
      g.fillStyle = '#3a3b42';
      g.beginPath(); g.arc(S[i].x, S[i].y, W / 2, 0, Math.PI * 2); g.fill();
    }
    g.restore();
    // puntini sull'asfalto (granulosità)
    for (let i = 0; i < 9000; i++) {
      const s = S[Math.floor(hash(i, 3) * S.length)];
      const off = (hash(i, 4) - 0.5) * W * 0.9;
      const nx = -Math.sin(s.dir), ny = Math.cos(s.dir);
      g.fillStyle = hash(i, 5) < 0.5 ? '#4a4b54' : '#62636d';
      g.fillRect(Math.round(s.x + nx * off), Math.round(s.y + ny * off), 2, 2);
    }
    // linea di mezzeria tratteggiata
    for (let i = 0; i < S.length; i += 6) {
      if (S[i].tunnel) continue;
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(Math.round(S[i].x) - 1, Math.round(S[i].y) - 1, 2, 2);
    }
    // traguardo a scacchi
    const s0 = S[0];
    const nx0 = -Math.sin(s0.dir), ny0 = Math.cos(s0.dir), tx0 = Math.cos(s0.dir), ty0 = Math.sin(s0.dir);
    for (let a = -W / 2; a < W / 2; a += 4) for (let b = 0; b < 8; b += 4) {
      g.fillStyle = ((a / 4 + b / 4) & 1) ? '#ffffff' : '#1b1b26';
      g.save(); g.translate(s0.x + nx0 * a + tx0 * b, s0.y + ny0 * a + ty0 * b); g.rotate(s0.dir); g.fillRect(0, 0, 4, 4); g.restore();
    }
    // caselle della griglia di partenza
    for (let k = 1; k <= 4; k++) {
      const s = S[(S.length - 6 * k) % S.length];
      const side = k % 2 ? -1 : 1;
      const nx = -Math.sin(s.dir), ny = Math.cos(s.dir);
      g.fillStyle = '#ffffff';
      g.save(); g.translate(s.x + nx * side * W * 0.22, s.y + ny * side * W * 0.22); g.rotate(s.dir); g.fillRect(-1, -6, 2, 12); g.restore();
    }
    const tex = new Uint32Array(g.getImageData(0, 0, SIZE, SIZE).data.buffer);

    // ---------------- mappa delle superfici ----------------
    const sc = document.createElement('canvas'); sc.width = sc.height = SIZE;
    const h = sc.getContext('2d');
    const col = (t) => `rgb(${t * 50},0,0)`;
    h.fillStyle = col(tr.walls ? SURF.WALL : SURF.GRASS); h.fillRect(0, 0, SIZE, SIZE);
    if (!tr.walls) strokePath(h, S, W + 44, col(SURF.SAND));
    strokePath(h, S, W + 8, col(SURF.KERB));
    strokePath(h, S, W, col(SURF.ROAD));
    const raw = h.getImageData(0, 0, SIZE, SIZE).data;
    const surf = new Uint8Array(SIZE * SIZE);
    for (let i = 0; i < surf.length; i++) surf[i] = Math.round(raw[i * 4] / 50);

    // ---------------- minimappa ----------------
    const mm = document.createElement('canvas'); mm.width = mm.height = 64;
    const m = mm.getContext('2d');
    m.scale(64 / SIZE, 64 / SIZE);
    strokePath(m, S, 70, '#1b1b26');
    strokePath(m, S, 40, '#ffffff');

    return {
      track: tr, samples: S, tex, surf, minimap: mm, deco: makeDeco(tr, S), panorama: makePanorama(tr),
      surfAt(x, y) {
        const ix = x | 0, iy = y | 0;
        if (ix < 0 || iy < 0 || ix >= SIZE || iy >= SIZE) return SURF.WALL;
        return surf[iy * SIZE + ix];
      },
      length: S.length * 4,
    };
  }

  // ------------------------------------------------------------------
  // Decorazioni a bordo pista
  // ------------------------------------------------------------------
  function makeDeco(tr, S) {
    const out = [];
    const W = tr.width;
    const near = (x, y, r) => S.some((s, i) => (i % 3 === 0) && Math.hypot(s.x - x, s.y - y) < r);
    const add = (kind, x, y, extra) => { if (x > 8 && y > 8 && x < SIZE - 8 && y < SIZE - 8) out.push(Object.assign({ kind, x, y }, extra || {})); };
    // cartelli con i nomi delle curve, all'esterno
    tr.pts.forEach((p) => {
      if (!p[2] || !p[2].sign) return;
      const s = S.reduce((best, q) => (Math.hypot(q.x - p[0], q.y - p[1]) < Math.hypot(best.x - p[0], best.y - p[1]) ? q : best), S[0]);
      const nx = -Math.sin(s.dir), ny = Math.cos(s.dir);
      const d = W / 2 + (tr.walls ? 20 : 34);
      add('sign', s.x + nx * d, s.y + ny * d, { text: p[2].sign });
    });
    // lungo la pista: alberi / palazzi / pubblico
    for (let i = 0; i < S.length; i += 7) {
      const s = S[i];
      const nx = -Math.sin(s.dir), ny = Math.cos(s.dir);
      for (const side of [-1, 1]) {
        if (hash(i, side + 5) < 0.45) continue;
        const d = W / 2 + (tr.walls ? 22 : 40) + hash(i, side + 9) * 40;
        const x = s.x + nx * side * d, y = s.y + ny * side * d;
        if (near(x, y, W / 2 + (tr.walls ? 18 : 30))) continue;
        if (tr.id === 'monza') add(hash(i, 11) < 0.7 ? 'tree' : 'pine', x, y);
        else if (tr.id === 'spa') add(hash(i, 11) < 0.75 ? 'pine' : 'tree', x, y);
        else if (s.tunnel) continue;
        else {
          if (x > 715 && x < 865 && y > 155 && y < 725) continue; // niente palazzi in mezzo al porto
          add(hash(i, 11) < 0.6 ? 'building' : 'palm', x, y, { c: Math.floor(hash(i, 13) * 5) });
        }
      }
    }
    // tribune sul rettilineo di partenza
    for (let k = 4; k < 40; k += 9) {
      const s = S[k];
      const nx = -Math.sin(s.dir), ny = Math.cos(s.dir);
      add('stand', s.x - nx * (W / 2 + (tr.walls ? 20 : 34)), s.y - ny * (W / 2 + (tr.walls ? 20 : 34)));
    }
    if (tr.id === 'monza') {
      // la vecchia sopraelevata: un muro curvo di cemento nel parco
      for (let a = 0; a < Math.PI; a += 0.12) add('banking', 520 + Math.cos(a + Math.PI) * 220, 640 + Math.sin(a + Math.PI) * 120);
    }
    if (tr.id === 'monaco') {
      // yacht nel porto
      for (let y = 200; y < 700; y += 55) for (let x = 745; x < 850; x += 50) if (hash(x, y) < 0.7) add('yacht', x + hash(y, x) * 10, y, { c: Math.floor(hash(x, y + 1) * 5) });
    }
    return out;
  }

  // ------------------------------------------------------------------
  // Panorama all'orizzonte (si ripete girando)
  // ------------------------------------------------------------------
  function makePanorama(tr) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 40;
    const g = c.getContext('2d');
    const rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    if (tr.scenery === 'alps') {
      for (let x = 0; x < 512; x++) {
        const h = 14 + Math.sin(x * 0.05) * 6 + Math.sin(x * 0.13 + 1) * 5 + Math.sin(x * 0.021) * 6;
        rect(x, 40 - h, 1, h, '#7a8fb8');
        if (h > 22) rect(x, 40 - h, 1, Math.min(4, h - 22), '#ffffff');
      }
      for (let x = 0; x < 512; x += 3) { const h = 5 + (hash(x, 1) * 5) | 0; rect(x, 40 - h, 3, h, '#2f7a24'); }
    } else if (tr.scenery === 'forest') {
      for (let x = 0; x < 512; x++) { const h = 10 + Math.sin(x * 0.03) * 6 + Math.sin(x * 0.09) * 3; rect(x, 40 - h, 1, h, '#3f6a4a'); }
      for (let x = 0; x < 512; x += 5) {
        const h = 10 + (hash(x, 2) * 14) | 0;
        for (let k = 0; k < h; k++) rect(x + 2 - Math.floor(k / 4), 40 - k, 1 + Math.floor(k / 2) % 5, 1, '#1f4a2a');
      }
    } else {
      // Monaco: palazzi sulla collina e mare
      rect(0, 32, 512, 8, '#2f8bff');
      for (let x = 0; x < 512; x++) { const h = 16 + Math.sin(x * 0.02) * 8; rect(x, 32 - h, 1, h, '#8a9a6a'); }
      for (let x = 0; x < 512; x += 9) {
        const h = 6 + (hash(x, 3) * 18) | 0, w = 6 + (hash(x, 4) * 4) | 0;
        const cols = ['#f2e6c9', '#ffd2a0', '#ffffff', '#ffb8a0', '#e8d8a8'];
        rect(x, 30 - h, w, h, cols[x % 5]);
        for (let yy = 32 - h; yy < 30; yy += 3) rect(x + 1, yy, w - 2, 1, '#c9a07a');
      }
    }
    return c;
  }

  /** Minimappa leggera (senza costruire le texture), per la schermata di scelta */
  function preview(tr, size) {
    size = size || 64;
    const S = sampleTrack(tr);
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    g.scale(size / SIZE, size / SIZE);
    strokePath(g, S, 80, '#1b1b26');
    strokePath(g, S, 44, '#ffffff');
    g.fillStyle = '#ff3b3b'; g.fillRect(S[0].x - 30, S[0].y - 30, 60, 60);
    return c;
  }

  window.KartWorld = { build, preview, SURF, SIZE };
})();
