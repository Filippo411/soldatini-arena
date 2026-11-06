/**
 * HOLY SHEEP — disegno sul canvas 384x216.
 */
(function () {
  'use strict';
  const S = SHEEP;
  const K = '#1b1b26';
  const R = Math.round;
  let ctx = null;

  function init(canvas) {
    canvas.width = S.W; canvas.height = S.H;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }
  function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(R(x), R(y), w, h); }
  function px(x, y, c) { ctx.fillStyle = c; ctx.fillRect(R(x), R(y), 1, 1); }
  function shadow(x, y, w) { rect(x - w, y, w * 2 + 1, 2, 'rgba(20,50,10,0.35)'); }
  function ring(cx, cy, r, c, step) {
    const n = Math.ceil(r * 6);
    for (let i = 0; i < n; i++) {
      if (step && i % step) continue;
      const a = (i / n) * Math.PI * 2;
      px(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.75, c);
    }
  }

  function draw(g, opts) {
    opts = opts || {};
    ctx.fillStyle = '#20152a';
    ctx.fillRect(0, 0, S.W, S.H);
    const sh = g.shake > 0.1 ? g.shake : 0;
    ctx.save();
    ctx.translate(sh ? R((Math.random() * 2 - 1) * sh) : 0, S.HUD_TOP + (sh ? R((Math.random() * 2 - 1) * sh) : 0));
    ctx.drawImage(g.mapCanvas, 0, 0);

    // punteggio scritto grande sul pavimento di ogni recinto
    for (const d of g.dogs) {
      const p = S.PENS[d.slot];
      PixelFont.draw(ctx, String(d.score), p.centerX, p.centerY - 7, { color: ROOM.PLAYERS[d.slot].light, scale: 2, align: 'center', outline: null });
    }

    // onde degli abbai
    for (const r of g.rings) {
      const k = r.t / 0.5;
      const col = ROOM.PLAYERS[r.slot].color;
      ring(r.x, r.y, 8 + k * S.BARK_R, col, 2);
      ring(r.x, r.y, 4 + k * S.BARK_R * 0.6, '#ffffff', 3);
    }

    // entità ordinate per profondità
    const ents = [];
    for (const s of g.sheep) ents.push([s.y, () => drawSheep(s, g)]);
    for (const d of g.dogs) ents.push([d.y, () => drawDog(d, g)]);
    if (g.wolf) ents.push([g.wolf.y, () => drawWolf(g.wolf, g)]);
    ents.sort((a, b) => a[0] - b[0]);
    for (const e of ents) e[1]();

    for (const p of g.particles) rect(p.x, p.y - p.z, p.big ? 2 : 1, p.big ? 2 : 1, p.color);
    for (const t of g.texts) {
      if (t.t > t.dur * 0.7 && Math.floor(t.t * 20) % 2) continue;
      PixelFont.draw(ctx, t.text, t.x, t.y, { color: t.color, align: 'center' });
    }
    ctx.restore();

    if (opts.demo) return;
    drawHUD(g, opts);
    drawCenter(g);
  }

  function drawSheep(s, g) {
    // nell'ultimo secondo prima di sparire dal recinto la pecora lampeggia
    if (s.pen >= 0 && s.penT > S.PEN_STAY - 0.9 && Math.floor(g.clock * 14) % 2) return;
    const art = s.golden ? SheepArt.gold : SheepArt.sheep;
    const moving = Math.hypot(s.vx, s.vy) > 3;
    const fr = moving && Math.floor(s.walkT * 8) % 2 ? art.b : art.a;
    const img = s.left ? fr.left : fr.right;
    shadow(s.x, s.y + 1, 4);
    const hop = moving && s.fleeT > 0 ? -(Math.floor(s.walkT * 8) % 2) : 0;   // saltella quando scappa
    ctx.drawImage(img, R(s.x - 5), R(s.y - 7 + hop));
    if (s.golden && Math.floor(g.clock * 6 + s.x) % 4 === 0) px(s.x + 3, s.y - 8, '#ffffff');
    // cuoricino del colore del cane che la sta guidando
    if (s.followDog) {
      const c = ROOM.PLAYERS[s.followDog.slot].color;
      const x = R(s.x), y = R(s.y - 12 + Math.sin(g.clock * 8 + s.x) * 1);
      px(x - 1, y, c); px(x + 1, y, c); rect(x - 1, y + 1, 3, 1, c); px(x, y + 2, c);
    } else if (s.alertT > 0) {
      rect(s.x, s.y - 14, 1, 3, '#ffffff'); px(s.x, s.y - 10, '#ffffff');   // "!"
    }
  }

  function drawDog(d, g) {
    const art = SheepArt.dogs[d.slot];
    const fr = d.moving && Math.floor(d.walkT * 10) % 2 ? art.b : art.a;
    const img = d.left ? fr.left : fr.right;
    shadow(d.x, d.y + 1, 5);
    ctx.drawImage(img, R(d.x - 6), R(d.y - 8 - (d.barkT > 0.2 ? 1 : 0)));
    // nuvoletta WOOF!
    if (d.barkT > 0) PixelFont.draw(ctx, 'WOOF!', d.x + (d.left ? -12 : 12), d.y - 20, { color: '#ffffff', align: 'center' });
    const pc = ROOM.PLAYERS[d.slot];
    const label = d.isBot ? 'CPU' : 'P' + (d.slot + 1);
    PixelFont.draw(ctx, label, d.x, d.y - 19 - (d.barkT > 0 ? 9 : 0), { color: pc.color, align: 'center' });
    if (!d.isBot && !d.connected && Math.floor(g.clock * 2) % 2) PixelFont.draw(ctx, 'OFFLINE', d.x, d.y - 30, { color: '#ffffff', align: 'center' });
  }

  function drawWolf(w, g) {
    const fr = Math.floor(w.walkT * 10) % 2 ? SheepArt.wolf.b : SheepArt.wolf.a;
    shadow(w.x, w.y + 1, 6);
    ctx.drawImage(w.left ? fr.left : fr.right, R(w.x - 7), R(w.y - 8));
    // durante lo scatto il "!" lampeggia veloce e diventa doppio
    if (!w.leaving && Math.floor(g.clock * (w.lungeT > 0 ? 12 : 4)) % 2) PixelFont.draw(ctx, w.lungeT > 0 ? '!!' : '!', w.x, w.y - 20, { color: '#ff3b3b', align: 'center' });
  }

  function drawHUD(g, opts) {
    rect(0, 0, S.W, S.HUD_TOP, K);
    rect(0, S.HUD_TOP - 1, S.W, 1, '#3a3d48');
    rect(0, S.H - S.HUD_BOTTOM, S.W, S.HUD_BOTTOM, K);
    rect(0, S.H - S.HUD_BOTTOM, S.W, 1, '#3a3d48');
    // stessi angoli dei recinti: 0 alto-sx, 1 basso-dx, 2 alto-dx, 3 basso-sx
    const corner = [[2, 2], [S.W - 112, S.H - 10], [S.W - 112, 2], [2, S.H - 10]];
    for (const d of g.dogs) {
      const [x, y] = corner[d.slot];
      const pc = ROOM.PLAYERS[d.slot];
      rect(x, y, 9, 8, pc.color); rect(x, y + 7, 9, 1, pc.dark);
      PixelFont.draw(ctx, String(d.slot + 1), x + 2, y + 1, { color: K, outline: null });
      PixelFont.draw(ctx, d.name.slice(0, 9), x + 12, y + 1, { color: (!d.isBot && !d.connected) ? '#6b6f7a' : pc.color, outline: null });
      Icons.drawIcon(ctx, 'sheep', x + 78, y, 1);
      PixelFont.draw(ctx, 'x' + d.score, x + 90, y + 1, { color: '#ffffff', outline: null });
    }
    const t = Math.ceil(g.time);
    const col = g.time <= 10 ? (Math.floor(g.clock * 4) % 2 ? '#ff3b3b' : '#ffd23b') : '#ffffff';
    PixelFont.draw(ctx, Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'), S.W / 2, 3, { color: col, align: 'center' });
    if (opts.roomCode) PixelFont.draw(ctx, 'STANZA ' + opts.roomCode, S.W / 2, S.H - 9, { color: '#9aa0ad', align: 'center', outline: null });
  }

  function drawCenter(g) {
    const cy = S.HUD_TOP + S.MAP_H / 2;
    if (g.state === 'countdown') {
      const n = Math.ceil(g.countdown);
      if (n >= 1 && n <= 3) PixelFont.draw(ctx, String(n), S.W / 2, cy - 21, { color: '#ffd23b', scale: 6, align: 'center', shadow: '#a3172a' });
      PixelFont.draw(ctx, 'PORTA LE PECORE NEL TUO RECINTO!', S.W / 2, cy + 30, { color: '#ffffff', align: 'center' });
      PixelFont.draw(ctx, 'ABBAIA = TI SEGUONO  CORRI = SCAPPANO', S.W / 2, cy + 42, { color: '#fff1a0', align: 'center' });
    }
    if (g.banner) {
      const b = g.banner;
      if (b.t > b.dur - 0.3 && Math.floor(b.t * 16) % 2) return;
      let scale = b.t < 0.06 ? 5 : b.t < 0.12 ? 4 : 3;
      if (PixelFont.width(b.text, scale) > S.W - 16) scale = 2;
      PixelFont.draw(ctx, b.text, S.W / 2, cy - 12, { color: b.color, scale, align: 'center', shadow: K });
    }
  }

  window.SheepRender = { init, draw };
})();
