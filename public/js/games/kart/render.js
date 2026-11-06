/**
 * PIPPO KART — disegno in finto 3D ("Mode 7", come i kart del Super Nintendo).
 *
 * Per ogni riga dello schermo sotto l'orizzonte si calcola a che distanza cade sul
 * terreno, e per ogni pixel di quella riga si legge il colore dalla texture della pista.
 * Sopra si disegnano gli sprite (kart, alberi, cartelli) rimpiccioliti con la distanza.
 * Lo schermo si divide in 1, 2 o 4 riquadri a seconda dei giocatori umani.
 */
(function () {
  'use strict';
  const W = 384, H = 216;
  const K = '#1b1b26';
  const CAM_BACK = 30, CAM_H = 15;
  let ctx = null;
  const buffers = new Map();

  function init(canvas) {
    canvas.width = W; canvas.height = H;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  /** Riquadri dello schermo per n giocatori umani */
  function viewports(n) {
    if (n <= 1) return [{ x: 0, y: 0, w: W, h: H }];
    if (n === 2) return [{ x: 0, y: 0, w: W, h: 107 }, { x: 0, y: 109, w: W, h: 107 }];
    return [{ x: 0, y: 0, w: 191, h: 107 }, { x: 193, y: 0, w: 191, h: 107 }, { x: 0, y: 109, w: 191, h: 107 }, { x: 193, y: 109, w: 191, h: 107 }];
  }

  function hexToABGR(hex) {
    const n = parseInt(hex.slice(1), 16);
    return (0xff000000 | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff)) >>> 0;
  }

  function buffer(w, h) {
    const key = w + 'x' + h;
    if (!buffers.has(key)) {
      const img = ctx.createImageData(w, h);
      buffers.set(key, { img, d32: new Uint32Array(img.data.buffer) });
    }
    return buffers.get(key);
  }

  // ------------------------------------------------------------------
  function draw(race, focus, opts) {
    opts = opts || {};
    ctx.imageSmoothingEnabled = false;   // (si azzera quando il canvas cambia dimensione)
    ctx.fillStyle = K;
    ctx.fillRect(0, 0, W, H);
    const vps = viewports(focus.length);
    focus.forEach((k, i) => drawView(race, k, vps[i]));
    if (opts.demo) return;
    // minimappa: angolo in basso a destra (1 giocatore) o al centro (schermo diviso)
    const mm = race.world.minimap;
    const mx = focus.length <= 1 ? W - 70 : (focus.length === 2 ? W - 70 : W / 2 - 32), my = focus.length <= 1 ? H - 70 : (focus.length === 2 ? H / 2 - 32 : H / 2 - 32);
    ctx.globalAlpha = 0.85; ctx.drawImage(mm, mx, my); ctx.globalAlpha = 1;
    for (const k of race.karts) {
      const pc = ROOM.PLAYERS[k.slot];
      const ms = race.world.size / 64;
      ctx.fillStyle = K; ctx.fillRect(Math.round(mx + k.x / ms) - 2, Math.round(my + k.y / ms) - 2, 5, 5);
      ctx.fillStyle = pc.color; ctx.fillRect(Math.round(mx + k.x / ms) - 1, Math.round(my + k.y / ms) - 1, 3, 3);
    }
    drawLights(race);
    if (race.banner) {
      const b = race.banner;
      PixelFont.draw(ctx, b.text, W / 2, H / 2 - 10, { color: b.color, scale: b.t < 0.08 ? 5 : 4, align: 'center', shadow: K });
    }
    if (opts.roomCode && focus.length > 2) PixelFont.draw(ctx, opts.roomCode, W / 2, H - 8, { color: '#6b6f7a', align: 'center', outline: null });
  }

  function drawView(race, me, vp) {
    const world = race.world, tr = world.track;
    const { w, h } = vp;
    const buf = buffer(w, h);
    const d32 = buf.d32, tex = world.tex, TS = world.texSize;
    // telecamera dietro al kart
    const a = me.heading;
    const fx = Math.cos(a), fy = Math.sin(a);
    const camX = me.x - fx * CAM_BACK, camY = me.y - fy * CAM_BACK;
    const F = w * 0.78;
    // il sali-e-scendi sposta l'orizzonte (Spa: Eau Rouge / Raidillon)
    const pitch = (me.hill || 0) * h * 0.06 + (me.bumpT > 0 ? Math.sin(race.clock * 60) * 1.5 : 0);
    const hy = Math.round(h * 0.36 + pitch);
    const sky0 = hexToABGR(tr.sky[0]), sky1 = hexToABGR(tr.sky[1]);
    const outside = hexToABGR(tr.walls ? '#6b6f7a' : tr.ground);
    const fog = hexToABGR(tr.sky[1]);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      if (y <= hy) {
        const c = y < hy * 0.55 ? sky0 : sky1;
        d32.fill(c, row, row + w);
        continue;
      }
      const dist = CAM_H * F / (y - hy);
      const k = dist / F;
      const rx = -fy, ry = fx;
      let wx = camX + fx * dist - rx * (w / 2) * k;
      let wy = camY + fy * dist - ry * (w / 2) * k;
      const sx = rx * k, sy = ry * k;
      const fogged = dist > 700;
      for (let x = 0; x < w; x++) {
        const tx = (wx * 0.5) | 0, ty = (wy * 0.5) | 0;    // 1 pixel di texture = 2 unità di mondo
        let c = (wx >= 0 && wy >= 0 && tx < TS && ty < TS) ? tex[ty * TS + tx] : outside;
        if (fogged) c = ((((c & 0xfefefe) >>> 1) + ((fog & 0xfefefe) >>> 1)) | 0xff000000) >>> 0;
        d32[row + x] = c;
        wx += sx; wy += sy;
      }
    }
    ctx.putImageData(buf.img, vp.x, vp.y);

    ctx.save();
    ctx.beginPath(); ctx.rect(vp.x, vp.y, w, h); ctx.clip();
    // panorama sull'orizzonte (scorre girando)
    const pan = world.panorama;
    const off = ((-a / (Math.PI * 2)) * pan.width * 2) % pan.width;
    for (let px = off - pan.width; px < w; px += pan.width) ctx.drawImage(pan, Math.round(vp.x + px), vp.y + hy - pan.height + 1);

    // sprite: decorazioni + kart, dal più lontano al più vicino
    const list = [];
    const project = (x, y) => {
      const dx = x - camX, dy = y - camY;
      const f = dx * fx + dy * fy;
      if (f < 6) return null;
      const s = -dx * fy + dy * fx;
      const sxp = w / 2 + s * F / f;
      if (sxp < -60 || sxp > w + 60) return null;
      return { f, sx: sxp, sy: hy + CAM_H * F / f, scale: F / f };
    };
    for (const d of world.deco) {
      const p = project(d.x, d.y);
      if (!p || p.f > 800) continue;
      list.push({ p, img: KartArt.decoImage(d), ws: KartArt.DECO_SCALE[d.kind] || 2 });
    }
    for (const k of race.karts) {
      if (k === me) continue;
      const p = project(k.x, k.y);
      if (!p) continue;
      // quale vista del kart mostrare, rispetto alla telecamera
      const rel = Math.atan2(Math.sin(k.heading - a), Math.cos(k.heading - a));
      const view = Math.abs(rel) < Math.PI / 4 ? 'back' : Math.abs(rel) > Math.PI * 3 / 4 ? 'front' : rel > 0 ? 'right' : 'left';
      list.push({ p, img: k.sprites[view], ws: 0.75, kart: k });
    }
    list.sort((A, B) => B.p.f - A.p.f);
    for (const it of list) {
      const s = it.p.scale * it.ws;
      const iw = Math.max(1, Math.round(it.img.width * s)), ih = Math.max(1, Math.round(it.img.height * s));
      if (ih > h * 0.9 || iw > w * 1.2) continue;   // troppo vicino alla telecamera: lo saltiamo
      ctx.drawImage(it.img, Math.round(vp.x + it.p.sx - iw / 2), Math.round(vp.y + it.p.sy - ih), iw, ih);
      if (it.kart && it.p.f < 260) {
        const pc = ROOM.PLAYERS[it.kart.slot];
        PixelFont.draw(ctx, it.kart.isBot ? 'CPU' : 'P' + (it.kart.slot + 1), vp.x + it.p.sx, vp.y + it.p.sy - ih - 9, { color: pc.color, align: 'center' });
      }
    }

    // il mio kart, fisso in basso al centro, che si inclina sterzando
    const steer = me.input.steer || 0;
    const myView = Math.abs(steer) > 0.55 && me.speed > 30 ? (steer > 0 ? 'right' : 'left') : 'back';
    const ks = Math.max(2, Math.floor(h / 54));
    const kw = 24 * ks, kh = 18 * ks;
    const kx = Math.round(vp.x + w / 2 - kw / 2 + steer * ks * 2), ky = Math.round(vp.y + h - kh - 4 * ks / 2 + (me.surf === 0 || me.surf === 3 ? (Math.floor(race.clock * 30) % 2) : 0));
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(kx + 2 * ks, ky + kh - ks, kw - 4 * ks, ks * 2);
    if (me.turboT > 0) {
      // fiammata del turbo
      const fl = Math.floor(race.clock * 20) % 2;
      ctx.fillStyle = fl ? '#ffe14a' : '#ff9c3b';
      ctx.fillRect(kx + 9 * ks, ky + kh - ks, 2 * ks, (3 + fl * 2) * ks);
      ctx.fillRect(kx + 13 * ks, ky + kh - ks, 2 * ks, (3 + (1 - fl) * 2) * ks);
    }
    ctx.drawImage(me.sprites[myView], kx, ky, kw, kh);
    // polvere fuori pista
    if ((me.surf === 0 || me.surf === 3) && me.speed > 30) {
      ctx.fillStyle = me.surf === 3 ? '#e8c983' : '#7dcf4a';
      for (let i = 0; i < 4; i++) ctx.fillRect(kx + Math.random() * kw, ky + kh - Math.random() * 3 * ks, ks, ks);
    }

    // galleria di Monaco: tutto più buio, con le luci al soffitto
    if (me.tunnel) {
      ctx.fillStyle = 'rgba(10,10,20,0.55)'; ctx.fillRect(vp.x, vp.y, w, h);
      ctx.fillStyle = '#ffe14a';
      for (let i = 0; i < 6; i++) {
        const t = ((race.clock * me.speed / 40 + i / 6) % 1);
        const yy = vp.y + hy - t * t * hy, xx = w / 2 + (t * t) * w * 0.45;
        ctx.fillRect(Math.round(vp.x + xx), Math.round(yy), 1 + Math.floor(t * 3), 1);
        ctx.fillRect(Math.round(vp.x + w - xx), Math.round(yy), 1 + Math.floor(t * 3), 1);
      }
    }

    drawHUD(race, me, vp);
    ctx.restore();
  }

  function drawHUD(race, me, vp) {
    const pc = ROOM.PLAYERS[me.slot];
    const big = vp.h > 150 ? 3 : 2;
    // posizione
    const pos = me.pos || 1;
    PixelFont.draw(ctx, String(pos), vp.x + 4, vp.y + vp.h - 7 * big - 4, { color: pos === 1 ? '#ffd23b' : '#ffffff', scale: big, shadow: K });
    PixelFont.draw(ctx, '/' + race.karts.length, vp.x + 6 + 6 * big, vp.y + vp.h - 11, { color: '#ffffff' });
    // giro
    const lap = Math.max(1, Math.min(race.laps, me.lap));
    PixelFont.draw(ctx, 'GIRO ' + lap + '/' + race.laps, vp.x + 4, vp.y + 4, { color: '#ffffff' });
    // nome
    PixelFont.draw(ctx, me.name, vp.x + 4, vp.y + 13, { color: pc.color });
    // turbo rimasti
    for (let i = 0; i < KART.TURBOS; i++) {
      const x = vp.x + vp.w - 10 - i * 9, y = vp.y + 4;
      ctx.fillStyle = K; ctx.fillRect(x - 1, y - 1, 8, 9);
      ctx.fillStyle = i < me.turbos ? '#ff9c3b' : '#3a3d48'; ctx.fillRect(x, y, 6, 7);
      if (i < me.turbos) { ctx.fillStyle = '#ffe14a'; ctx.fillRect(x + 2, y + 1, 2, 4); }
    }
    // tachimetro
    const sp = Math.max(0, Math.min(1, me.speed / (KART.MAX_SPEED * KART.TURBO_MULT)));
    ctx.fillStyle = K; ctx.fillRect(vp.x + vp.w - 34, vp.y + vp.h - 8, 30, 5);
    ctx.fillStyle = me.turboT > 0 ? '#ff9c3b' : '#3fe05a'; ctx.fillRect(vp.x + vp.w - 33, vp.y + vp.h - 7, Math.round(28 * sp), 3);
    if (me.wrongT > 1 && Math.floor(race.clock * 4) % 2) PixelFont.draw(ctx, 'CONTROMANO!', vp.x + vp.w / 2, vp.y + vp.h / 2 - 20, { color: '#ff3b3b', scale: 2, align: 'center' });
    if (me.msg) PixelFont.draw(ctx, me.msg.text, vp.x + vp.w / 2, vp.y + vp.h * 0.3, { color: '#ffd23b', scale: big, align: 'center', shadow: K });
    if (me.finished) PixelFont.draw(ctx, 'ARRIVATO ' + me.place + ' SU ' + race.karts.length, vp.x + vp.w / 2, vp.y + vp.h * 0.55, { color: '#ffffff', align: 'center' });
    if (!me.isBot && !me.connected && Math.floor(race.clock * 2) % 2) PixelFont.draw(ctx, 'OFFLINE', vp.x + vp.w / 2, vp.y + 30, { color: '#ffffff', align: 'center' });
  }

  /** Semaforo di partenza stile F1: 5 luci rosse che si accendono, poi si spengono tutte */
  function drawLights(race) {
    if (race.state !== 'lights') return;
    const n = KART.LIGHTS, bw = 16;
    const x0 = Math.round(W / 2 - (n * bw) / 2), y0 = 30;
    ctx.fillStyle = K; ctx.fillRect(x0 - 4, y0 - 4, n * bw + 8, 26);
    for (let i = 0; i < n; i++) {
      const on = i < race.lightsOn;
      ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x0 + i * bw + 1, y0, bw - 2, 18);
      ctx.fillStyle = on ? '#ff3b3b' : '#4a1010';
      ctx.fillRect(x0 + i * bw + 4, y0 + 3, bw - 8, 5); ctx.fillRect(x0 + i * bw + 4, y0 + 10, bw - 8, 5);
      if (on) { ctx.fillStyle = '#ff9c8a'; ctx.fillRect(x0 + i * bw + 5, y0 + 4, 2, 1); }
    }
  }

  window.KartRender = { init, draw, W, H };
})();
