/**
 * Disegno della partita sul canvas a bassa risoluzione (384x216).
 * Il canvas viene poi ingrandito via CSS con image-rendering: pixelated.
 */
(function () {
  'use strict';
  const C = CFG;
  const { W, H, HUD_TOP, TILE } = C;
  const K = '#1b1b26';

  let ctx = null;
  const soldierArt = [];   // fotogrammi per ciascun colore

  function init(canvas) {
    canvas.width = W; canvas.height = H;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < 4; i++) soldierArt[i] = Sprites.buildSoldier(C.PLAYERS[i]);
  }

  // --- primitive pixel ---
  const R = Math.round;
  function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(R(x), R(y), w, h); }
  function px(x, y, c) { ctx.fillStyle = c; ctx.fillRect(R(x), R(y), 1, 1); }
  /** Disco pieno disegnato a righe orizzontali (niente antialiasing) */
  function disc(cx, cy, r, c, squash) {
    ctx.fillStyle = c;
    cx = R(cx); cy = R(cy);
    const sq = squash || 1;
    const ry = Math.max(1, Math.round(r * sq));
    for (let dy = -ry; dy <= ry; dy++) {
      const w = Math.round(Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))) * r);
      ctx.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
    }
  }
  /** Anello (contorno di cerchio) — usato per lo scudo */
  function ring(cx, cy, r, c, c2) {
    cx = R(cx); cy = R(cy);
    const n = Math.ceil(r * 7);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      px(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9, (c2 && i % 4 === 0) ? c2 : c);
    }
  }
  function shadow(x, y, w) { rect(x - w, y, w * 2 + 1, 2, 'rgba(40,20,10,0.4)'); rect(x - w + 1, y + 2, w * 2 - 1, 1, 'rgba(40,20,10,0.25)'); }

  // ------------------------------------------------------------------
  function draw(game, opts) {
    opts = opts || {};
    const g = game;
    ctx.fillStyle = '#20152a';
    ctx.fillRect(0, 0, W, H);

    // scossone dello schermo
    const sh = g.shake > 0.1 ? g.shake : 0;
    const ox = sh ? R((Math.random() * 2 - 1) * sh) : 0;
    const oy = sh ? R((Math.random() * 2 - 1) * sh) : 0;
    ctx.save();
    ctx.translate(ox, HUD_TOP + oy);

    ctx.drawImage(g.mapCanvas, 0, 0);

    // --- oggetti a terra ---
    for (const p of g.pickups) drawPickup(p, g.clock);

    // --- entità ordinate per profondità (y) ---
    const ents = [];
    for (const s of g.soldiers) ents.push({ y: s.y, f: () => drawSoldier(s, g) });
    for (const gr of g.grenades) ents.push({ y: gr.y, f: () => drawGrenade(gr) });
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) e.f();

    // --- proiettili ---
    for (const b of g.bullets) {
      const a = Math.atan2(b.vy, b.vx);
      px(b.x, b.y, 'rgba(40,20,10,0.35)');
      const bx = b.x, by = b.y - 7;
      rect(bx - 1, by - 1, 3, 3, '#ffd23b');
      px(bx, by, '#ffffff');
      px(bx - Math.cos(a) * 2, by - Math.sin(a) * 2, '#ff9c3b');
      px(bx - Math.cos(a) * 3, by - Math.sin(a) * 3, '#ff5a2e');
    }

    // --- particelle ---
    for (const p of g.particles) drawParticle(p);

    // --- esplosioni ---
    for (const b of g.blasts) drawBlast(b);

    // --- scritte fluttuanti ---
    for (const t of g.texts) {
      if (t.t > t.dur * 0.7 && Math.floor(t.t * 20) % 2) continue;
      PixelFont.draw(ctx, t.text, t.x, t.y, { color: t.color, align: 'center' });
    }
    ctx.restore();

    // lampo bianco delle esplosioni
    if (g.flashScreen > 0.2) {
      ctx.fillStyle = `rgba(255,240,200,${(g.flashScreen - 0.2) * 0.5})`;
      ctx.fillRect(0, HUD_TOP, W, C.MAP_H);
    }

    drawFeed(g);
    drawHUD(g, opts);
    drawCenterText(g);
  }

  // ------------------------------------------------------------------
  function drawSoldier(s, g) {
    const art = soldierArt[s.slot];
    if (s.lastLeft === undefined) s.lastLeft = Math.cos(s.face) < 0;
    const cx = Math.cos(s.face);
    if (cx < -0.15) s.lastLeft = true; else if (cx > 0.15) s.lastLeft = false;
    const left = s.lastLeft;
    const dir = left ? art.left : art.right;

    // --- morto: vola in aria girando, poi lampeggia e sparisce ---
    if (s.dead) {
      if (s.deadT > 1.7) return;
      if (s.deadT > 0.9 && Math.floor(s.deadT * 16) % 2) return;
      shadow(s.x, s.y, 4);
      const rot = s.z > 0 ? Math.floor(s.spin) % 4 : (left ? 3 : 1);
      const img = art.deadRot[rot];
      ctx.drawImage(img, R(s.x - img.width / 2), R(s.y - img.height + (s.z > 0 ? 0 : 3) - s.z));
      return;
    }

    // scia del Flash
    for (const t of s.trail) {
      ctx.globalAlpha = Math.max(0, t.life / 0.25) * 0.55;
      ctx.drawImage(t.left ? art.trail.left : art.trail.right, R(t.x - 6), R(t.y - 16));
    }
    ctx.globalAlpha = 1;

    shadow(s.x, s.y, 4);

    // fotogramma della camminata
    let frame = 'stand';
    let bob = 0;
    if (s.moving) {
      const f = Math.floor(s.walkT * 10) % 4;
      frame = ['walkA', 'stand', 'walkB', 'stand'][f];
      bob = f % 2 ? -1 : 0;
    }
    const sx = R(s.x - 6), sy = R(s.y - 16 + bob);

    const aimUp = Math.sin(s.face) < -0.45;
    if (aimUp) drawGun(s, sy);

    // lampeggio di protezione dopo il respawn / colpo sullo scudo
    const blink = (s.protectT > 0 && Math.floor(g.clock * 16) % 2) || s.hurtT > 0.15;
    ctx.drawImage(blink ? (left ? art.white.left : art.white.right) : dir[frame], sx, sy);

    if (!aimUp) drawGun(s, sy);

    // scudo luminoso
    if (s.shieldT > 0 && !(s.shieldT < 2 && Math.floor(g.clock * 10) % 2)) {
      const pr = 11 + Math.sin(g.clock * 8) * 0.8;
      ring(s.x, s.y - 7, pr, '#5ff2ff', '#ffffff');
      ring(s.x, s.y - 7, pr - 1, 'rgba(95,242,255,0.45)');
    }

    // etichetta sopra la testa (P1..P4 / CPU) per riconoscersi da lontano
    const col = C.PLAYERS[s.slot].color;
    const label = s.isBot ? 'CPU' : 'P' + (s.slot + 1);
    const ty = sy - 10;
    PixelFont.draw(ctx, label, s.x, ty, { color: col, align: 'center' });
    // freccetta
    rect(s.x - 1, ty + 8, 3, 1, col);
    px(s.x, ty + 9, col);

    if (!s.isBot && !s.connected && Math.floor(g.clock * 2) % 2) {
      PixelFont.draw(ctx, 'OFFLINE', s.x, ty - 9, { color: '#ffffff', align: 'center' });
    }
  }

  function drawGun(s, sy) {
    const cx = Math.cos(s.face), cy = Math.sin(s.face);
    // le mani sono all'altezza della pancia
    const hx = s.x + (cx < 0 ? -1 : 1), hy = sy + 11;
    const len = 7;
    for (let i = 0; i <= len; i++) {
      const x = hx + cx * i, y = hy + cy * i * 0.85;
      px(x, y, i < 2 ? '#5a3a22' : (i === len ? '#9aa0ad' : '#3a3d48'));
      px(x, y + 1, K);
    }
    if (s.muzzleT > 0) {
      // fiammata allo sparo
      const mx = hx + cx * (len + 3), my = hy + cy * (len + 3) * 0.85;
      const big = s.muzzleT > 0.035;
      disc(mx, my, big ? 3 : 2, '#ff9c3b');
      disc(mx, my, big ? 2 : 1, '#ffe14a');
      px(mx, my, '#ffffff');
      if (big) {
        px(mx + cx * 4, my + cy * 4, '#ffe14a');
        px(mx - cy * 3, my + cx * 3, '#ff9c3b');
        px(mx + cy * 3, my - cx * 3, '#ff9c3b');
      }
    }
  }

  function drawGrenade(gr) {
    shadow(gr.x, gr.y, 2);
    const y = gr.y - 3 - gr.z;
    rect(gr.x - 2, y - 2, 4, 4, K);
    rect(gr.x - 1, y - 1, 2, 2, '#6fae3a');
    px(gr.x - 1, y - 1, '#a6e06a');
    // lucina rossa che lampeggia sempre più veloce
    const rate = 6 + gr.t * 14;
    if (Math.floor(gr.t * rate) % 2) px(gr.x, y - 3, '#ff3b3b');
  }

  function drawPickup(p, clock) {
    const bob = Math.round(Math.sin(p.t * 4) * 1.5);
    shadow(p.x, p.y + 1, 4);
    const x = R(p.x - 4), y = R(p.y - 10 + bob);
    if (p.type !== 'ammo') {
      // alone che pulsa intorno ai powerup
      const glow = Math.floor(clock * 6) % 2 ? '#ffffff' : '#5ff2ff';
      rect(x - 2, y - 2, 13, 1, glow); rect(x - 2, y + 10, 13, 1, glow);
      rect(x - 2, y - 2, 1, 13, glow); rect(x + 10, y - 2, 1, 13, glow);
    }
    if (p.t < 0.6 && Math.floor(p.t * 20) % 2) return; // appare lampeggiando
    Icons.drawIcon(ctx, p.type, x, y, 1);
  }

  function drawParticle(p) {
    const k = Math.max(0, p.life / p.max);
    if (p.kind === 'smoke') {
      const r = (p.size || 3) * (p.dusty ? 1 : (1.4 - k * 0.6));
      let c;
      if (p.dusty) c = 'rgba(217,181,106,' + (k * 0.8) + ')';
      else if (k > 0.85) c = '#ffd23b';
      else if (k > 0.72) c = '#ff7a2e';
      else c = k > 0.4 ? '#4a4652' : '#7e7a86';
      if (!p.dusty && k < 0.3 && Math.floor(p.life * 30) % 2) return; // dissolvenza "a pixel"
      disc(p.x, p.y - p.z, Math.max(1, r), c);
    } else if (p.kind === 'debris') {
      if (p.z > 2) px(p.x, p.y, 'rgba(40,20,10,0.35)');
      rect(p.x, p.y - p.z, 2, 2, p.color);
    } else if (p.kind === 'casing') {
      if (k < 0.25 && Math.floor(p.life * 20) % 2) return;
      rect(p.x, p.y - p.z, 2, 1, p.color);
    } else if (p.kind === 'star') {
      const x = p.x, y = p.y - p.z;
      px(x, y, p.color); px(x - 1, y, p.color); px(x + 1, y, p.color); px(x, y - 1, p.color); px(x, y + 1, p.color);
    } else {
      px(p.x, p.y - p.z, p.color);
    }
  }

  function drawBlast(b) {
    const k = b.t / b.max;               // 0 -> 1
    const grow = 1 - Math.pow(1 - Math.min(1, k * 2.2), 3);
    const r = b.r * (0.35 + 0.65 * grow);
    if (k < 0.12) {
      disc(b.x, b.y - 4, r * 0.9, '#ffffff', 0.8);
      return;
    }
    if (k < 0.7) {
      disc(b.x, b.y - 4, r, k < 0.4 ? '#ff5a2e' : '#c2381f', 0.8);
      disc(b.x, b.y - 6, r * 0.75, '#ff9c3b', 0.8);
      disc(b.x, b.y - 8, r * (0.5 - k * 0.4), '#ffe14a', 0.8);
      if (k < 0.3) disc(b.x, b.y - 9, r * 0.25, '#ffffff', 0.8);
    } else {
      // anello di fumo che si allarga
      ring(b.x, b.y - 4, r, '#4a4652');
      ring(b.x, b.y - 4, r - 1, '#7e7a86');
    }
  }

  // ------------------------------------------------------------------
  // HUD
  // ------------------------------------------------------------------
  function drawHUD(g, opts) {
    // barre in alto e in basso
    rect(0, 0, W, HUD_TOP, K);
    rect(0, HUD_TOP - 1, W, 1, '#3a3d48');
    rect(0, H - C.HUD_BOTTOM, W, C.HUD_BOTTOM, K);
    rect(0, H - C.HUD_BOTTOM, W, 1, '#3a3d48');

    const pos = [[2, 2], [W - 134, 2], [2, H - 10], [W - 134, H - 10]];
    for (const s of g.soldiers) {
      const [x, y] = pos[s.slot];
      drawPanel(s, x, y, g);
    }

    // timer al centro
    const t = Math.ceil(g.time);
    const mm = Math.floor(t / 60), ss = String(t % 60).padStart(2, '0');
    let col = '#ffffff';
    if (g.time <= 30) col = Math.floor(g.clock * 4) % 2 ? '#ff3b3b' : '#ffd23b';
    if (g.suddenDeath) {
      PixelFont.draw(ctx, 'SUDDEN DEATH', W / 2, 3, { color: Math.floor(g.clock * 4) % 2 ? '#ff3b3b' : '#ffffff', align: 'center' });
    } else {
      PixelFont.draw(ctx, mm + ':' + ss, W / 2, 3, { color: col, align: 'center' });
    }
    // codice stanza in basso (per chi entra in ritardo o deve rientrare)
    if (opts.roomCode) {
      PixelFont.draw(ctx, 'STANZA ' + opts.roomCode, W / 2, H - 9, { color: '#9aa0ad', align: 'center', outline: null });
    }
  }

  function drawPanel(s, x, y, g) {
    const pc = C.PLAYERS[s.slot];
    // riquadro colore con numero
    rect(x, y, 9, 8, pc.color);
    rect(x, y + 7, 9, 1, pc.dark);
    PixelFont.draw(ctx, String(s.slot + 1), x + 2, y + 1, { color: K, outline: null });
    // nome
    const name = s.name.slice(0, 9);
    const dim = s.dead || (!s.isBot && !s.connected);
    PixelFont.draw(ctx, name, x + 12, y + 1, { color: dim ? '#6b6f7a' : pc.color, outline: null });
    // eliminazioni
    Icons.drawIcon(ctx, 'skull', x + 68, y + 1, 1);
    PixelFont.draw(ctx, String(s.kills), x + 77, y + 1, { color: '#ffffff', outline: null });
    // munizioni: 10 piccoli proiettili
    if (s.dead) {
      PixelFont.draw(ctx, 'KO ' + Math.max(1, Math.ceil(s.respawnT)), x + 92, y + 1, { color: '#ff5a5a', outline: null });
    } else {
      for (let i = 0; i < C.MAX_AMMO; i++) {
        const bx = x + 91 + i * 3;
        if (i < s.ammo) { rect(bx, y + 1, 2, 1, '#fff1a0'); rect(bx, y + 2, 2, 5, '#d9a441'); }
        else rect(bx, y + 2, 2, 5, '#3a3d48');
      }
      if (s.ammo === 0 && Math.floor(g.clock * 4) % 2) rect(x + 90, y + 1, 31, 7, 'rgba(255,59,59,0.5)');
    }
    // casella powerup
    const bx = x + 123;
    rect(bx - 1, y - 1, 11, 10, '#3a3d48');
    rect(bx, y, 9, 8, K);
    if (s.power) Icons.drawIcon(ctx, s.power, bx, y - 1, 1);
    else if (s.shieldT > 0) PixelFont.draw(ctx, String(Math.ceil(s.shieldT)), bx + 2, y + 1, { color: '#5ff2ff', outline: null });
    else if (s.flashT > 0) PixelFont.draw(ctx, String(Math.ceil(s.flashT)), bx + 2, y + 1, { color: '#ffe14a', outline: null });
  }

  function drawFeed(g) {
    let y = HUD_TOP + 3;
    for (const f of g.feed) {
      if (f.t < 0.5 && Math.floor(f.t * 12) % 2) { y += 9; continue; }
      const icon = f.cause === 'grenade' ? '*' : f.cause === 'barrel' ? '*' : '>';
      const right = W - 3;
      if (f.cause === 'self') {
        PixelFont.draw(ctx, f.vn + ' OOPS', right, y, { color: C.PLAYERS[f.v].color, align: 'right' });
      } else {
        const vw = PixelFont.width(f.vn) + 2;
        PixelFont.draw(ctx, f.vn, right, y, { color: C.PLAYERS[f.v].color, align: 'right' });
        PixelFont.draw(ctx, icon, right - vw - 6, y, { color: '#ffffff', align: 'right' });
        PixelFont.draw(ctx, f.an, right - vw - 14, y, { color: C.PLAYERS[f.a].color, align: 'right' });
      }
      y += 9;
    }
  }

  function drawCenterText(g) {
    const cy = HUD_TOP + C.MAP_H / 2;
    if (g.state === 'countdown') {
      const n = Math.ceil(g.countdown);
      const frac = g.countdown - Math.floor(g.countdown);
      const scale = frac > 0.85 ? 8 : frac > 0.75 ? 7 : 6;
      if (n >= 1 && n <= 3) {
        PixelFont.draw(ctx, String(n), W / 2, cy - (7 * scale) / 2, { color: '#ffd23b', scale, align: 'center', shadow: '#a3172a' });
      }
      PixelFont.draw(ctx, 'PREPARATI!', W / 2, cy + 34, { color: '#ffffff', scale: 2, align: 'center' });
    }
    if (g.banner) {
      const b = g.banner;
      if (b.t > b.dur - 0.3 && Math.floor(b.t * 16) % 2) return;
      let scale = b.t < 0.06 ? 5 : b.t < 0.12 ? 4 : 3;
      if (PixelFont.width(b.text, scale) > W - 16) scale = 2;
      const wob = b.t < 0.4 ? Math.round(Math.sin(b.t * 40) * 2) : 0;
      PixelFont.draw(ctx, b.text, W / 2, cy - 12 + wob, { color: b.color, scale, align: 'center', shadow: K });
    }
  }

  window.Render = { init, draw, soldierArt: () => soldierArt };
})();
