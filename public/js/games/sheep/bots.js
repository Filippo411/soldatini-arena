/**
 * HOLY SHEEP — cani pastore guidati dal computer.
 *
 * Strategia semplice ma efficace:
 *   1. VA A PRENDERE: sceglie una pecora "conveniente" (vicina, lontana dagli altri recinti,
 *      meglio se d'oro) e ci va vicino
 *   2. ABBAIA e RIPORTA: abbaia e torna verso il proprio cancello, riabbaiando ogni tanto
 *      così le pecore continuano a seguirlo
 *   3. ENTRA nel recinto, poi ESCE e ricomincia
 * Se vede il lupo vicino, gli abbaia contro.
 */
(function () {
  'use strict';
  const S = SHEEP;
  const { TILE, COLS, ROWS } = S;
  const rand = (a, b) => a + Math.random() * (b - a);

  function bfs(map, sx, sy, gx, gy) {
    const prev = new Int32Array(COLS * ROWS).fill(-1);
    const start = sy * COLS + sx, goal = gy * COLS + gx;
    if (start === goal) return [];
    prev[start] = start;
    const q = [start];
    for (let i = 0; i < q.length; i++) {
      const c = q[i];
      if (c === goal) break;
      const cx = c % COLS, cy = (c / COLS) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        const n = ny * COLS + nx;
        if (prev[n] !== -1 || SheepMap.solid(map.grid[ny][nx])) continue;
        prev[n] = c; q.push(n);
      }
    }
    if (prev[goal] === -1) return null;
    const path = [];
    for (let c = goal; c !== start; c = prev[c]) path.push([c % COLS, (c / COLS) | 0]);
    return path.reverse();
  }

  function go(game, d, gx, gy, dt) {
    const b = d.bot;
    b.repath -= dt;
    const tx = Math.floor(d.x / TILE), ty = Math.floor(d.y / TILE);
    const gtx = Math.max(0, Math.min(COLS - 1, Math.floor(gx / TILE))), gty = Math.max(0, Math.min(ROWS - 1, Math.floor(gy / TILE)));
    if (b.repath <= 0 || !b.path) {
      b.repath = rand(0.3, 0.5);
      b.path = bfs(game.map, tx, ty, gtx, gty) || [];
    }
    while (b.path.length && b.path[0][0] === tx && b.path[0][1] === ty) b.path.shift();
    let wx = gx, wy = gy;
    if (b.path.length) { wx = b.path[0][0] * TILE + 4; wy = b.path[0][1] * TILE + 4; }
    const dx = wx - d.x, dy = wy - d.y, dist = Math.hypot(dx, dy);
    if (dist > 1.5) { d.input.x = dx / dist * b.pace; d.input.y = dy / dist * b.pace; }
    return Math.hypot(gx - d.x, gy - d.y);
  }

  function pickTarget(game, d) {
    const own = S.PENS[d.slot];
    let best = null, bs = 1e9;
    for (const s of game.sheep) {
      if (s.pen === d.slot) continue;
      if (s.followDog === d) continue;
      let score = Math.hypot(s.x - d.x, s.y - d.y) + 0.6 * Math.hypot(s.x - own.gateX, s.y - own.gateY);
      if (s.golden) score -= 80;
      if (s.pen >= 0) score += 120;                 // rubare dai recinti altrui: solo ogni tanto
      if (s.followDog && s.followDog !== d) score += 40;
      score += rand(0, 30);
      if (score < bs) { bs = score; best = s; }
    }
    return best;
  }

  function think(game, d, dt) {
    if (!d.bot) d.bot = { mode: 'fetch', target: null, retarget: 0, path: null, repath: 0, leadT: 0, barkWait: rand(0.6, 1.2), pace: rand(0.8, 0.95) };
    const b = d.bot;
    d.input.x = 0; d.input.y = 0;
    const own = S.PENS[d.slot];
    const inside = (x, y) => x >= own.x && x < own.x + own.w && y >= own.y && y < own.y + own.h;

    // lupo vicino: abbaia!
    const w = game.wolf;
    if (w && !w.leaving && Math.hypot(w.x - d.x, w.y - d.y) < S.BARK_R) d.input.bark = true;

    if (b.mode === 'fetch') {
      b.retarget -= dt;
      if (!b.target || b.retarget <= 0 || game.sheep.indexOf(b.target) < 0 || b.target.pen === d.slot) {
        b.target = pickTarget(game, d);
        b.retarget = 2.5;
      }
      if (!b.target) { go(game, d, own.gateX + own.dir * 30, own.gateY, dt); return; }
      const dist = go(game, d, b.target.x, b.target.y, dt);
      if (dist < S.BARK_R * 0.55) {
        d.input.bark = true;
        b.mode = 'lead';
        b.leadT = 9;
        b.barkWait = rand(0.8, 1.3);
      }
    } else if (b.mode === 'lead') {
      b.leadT -= dt;
      // quante pecore mi seguono?
      const followers = game.sheep.filter((s) => s.followDog === d);
      // cammina verso il fondo del recinto passando dal cancello
      const passedGate = (own.dir > 0 ? d.x < own.gateX : d.x > own.gateX);
      const gx = passedGate ? own.centerX - own.dir * 14 : own.gateX - own.dir * 4;
      const gy = passedGate ? own.centerY : own.gateY;
      // se le pecore restano indietro, rallenta
      const far = followers.length && followers.every((s) => Math.hypot(s.x - d.x, s.y - d.y) > 30);
      if (!far) go(game, d, gx, gy, dt);
      b.barkWait -= dt;
      if (b.barkWait <= 0) { b.barkWait = rand(0.9, 1.4); if (followers.length || !passedGate) d.input.bark = true; }
      if ((passedGate && inside(d.x, d.y) && Math.hypot(gx - d.x, gy - d.y) < 10) || b.leadT <= 0 || (!followers.length && b.leadT < 7)) {
        b.mode = 'exit';
      }
    } else if (b.mode === 'exit') {
      // esce dal recinto lungo il bordo, senza trascinarsi dietro le pecore
      const dist = go(game, d, own.gateX + own.dir * 22, own.gateY + (Math.random() < 0.5 ? -1 : 1), dt);
      if (dist < 8) { b.mode = 'fetch'; b.target = null; }
    }
  }

  window.SheepBots = { think };
})();
