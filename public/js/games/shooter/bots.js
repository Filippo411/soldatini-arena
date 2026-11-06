/**
 * Bot semplici per la modalità a 1 giocatore.
 *
 * Ogni bot, a intervalli, sceglie un obiettivo:
 *   - senza munizioni -> il pacco munizioni più vicino
 *   - senza powerup e con un powerup vicino -> il powerup
 *   - altrimenti -> l'avversario più vicino
 * e ci arriva seguendo un percorso calcolato sulla griglia (ricerca in ampiezza).
 * Se vede un avversario a tiro, si ferma, prende la mira (con un po' di
 * imprecisione e tempo di reazione) e spara.
 * Come gli umani con lo stick di mira, possono spostarsi di lato continuando a mirare.
 */
(function () {
  'use strict';
  const { TILE, COLS, ROWS } = CFG;

  const rand = (a, b) => a + Math.random() * (b - a);

  /** Percorso più breve tra due caselle; restituisce lista di caselle [x,y] */
  function bfs(map, sx, sy, gx, gy) {
    if (sx === gx && sy === gy) return [];
    const prev = new Int32Array(COLS * ROWS).fill(-1);
    const start = sy * COLS + sx, goal = gy * COLS + gx;
    prev[start] = start;
    const q = [start];
    for (let qi = 0; qi < q.length; qi++) {
      const cur = q[qi];
      if (cur === goal) break;
      const cx = cur % COLS, cy = (cur / COLS) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        const n = ny * COLS + nx;
        if (prev[n] !== -1 || MapGen.blocksMove(map.grid[ny][nx])) continue;
        prev[n] = cur;
        q.push(n);
      }
    }
    if (prev[goal] === -1) return null;
    const path = [];
    for (let c = goal; c !== start; c = prev[c]) path.push([c % COLS, (c / COLS) | 0]);
    return path.reverse();
  }

  function initBot(s) {
    s.bot = {
      path: [],
      repath: 0,
      seenT: 0,          // da quanto tempo vede il bersaglio
      aimErr: 0,
      extraCooldown: rand(0.25, 0.4),
      reaction: rand(0.3, 0.5),
      wander: null,
      stuckT: 0,
      lastX: s.x, lastY: s.y,
    };
  }

  function think(game, s, dt) {
    if (!s.bot) initBot(s);
    const b = s.bot;
    const map = game.map;
    const inp = s.input;
    inp.fire = false;
    inp.x = 0; inp.y = 0;
    delete inp.aim;
    inp.aimStick = null; // come gli umani con lo stick di mira

    // --- Avversario visibile più vicino ---
    let target = null, td = 1e9;
    for (const o of game.soldiers) {
      if (o === s || o.dead || o.protectT > 0.5) continue;
      const d = Math.hypot(o.x - s.x, o.y - s.y);
      if (d < 160 && d < td && map.lineOfSight(s.x, s.y - 2, o.x, o.y - 2)) { target = o; td = d; }
    }

    // --- Uso dei powerup ---
    if (s.power === 'shield' && target) inp.pow = true;
    if (s.power === 'flash' && (!target || td > 110) && Math.random() < dt * 0.6) inp.pow = true;

    if (target && s.ammo > 0) {
      b.seenT += dt;
      const want = Math.atan2(target.y - s.y, target.x - s.x);
      if (b.seenT < dt * 1.5) b.aimErr = rand(-0.22, 0.22); // nuova "imprecisione" per ogni avvistamento
      const aim = want + b.aimErr * Math.max(0.3, 1 - b.seenT);
      // granata: se il bersaglio è a media distanza
      if (s.power === 'grenade' && td > 35 && td < 85) {
        inp.aimStick = want;
        inp.pow = { a: want, m: Math.min(1, td / 90) };
        return;
      }
      if (td > 100) {
        // troppo lontano: avvicinati
        followPath(game, s, target.x, target.y, dt);
      } else {
        // fermo, mira e spara dopo il tempo di reazione
        inp.aimStick = aim;
        if (b.seenT > b.reaction) inp.fire = true;
        // ogni tanto fa un passo laterale per non essere un bersaglio fisso
        if (Math.sin(game.clock * 2 + s.slot) > 0.75) {
          const side = want + Math.PI / 2 * (s.slot % 2 ? 1 : -1);
          inp.x = Math.cos(side) * 0.6; inp.y = Math.sin(side) * 0.6;
        }
      }
      return;
    }
    b.seenT = 0;

    // --- Nessun bersaglio a tiro: decidi dove andare ---
    let goal = null;
    if (s.ammo === 0) {
      goal = nearest(s, game.pickups.filter((p) => p.type === 'ammo'));
    }
    if (!goal && !s.power) {
      const pw = nearest(s, game.pickups.filter((p) => p.type !== 'ammo'));
      if (pw && Math.hypot(pw.x - s.x, pw.y - s.y) < 120) goal = pw;
    }
    if (!goal && s.ammo < 4) {
      const am = nearest(s, game.pickups.filter((p) => p.type === 'ammo'));
      if (am && Math.hypot(am.x - s.x, am.y - s.y) < 100) goal = am;
    }
    if (!goal && s.ammo > 0) goal = nearest(s, game.soldiers.filter((o) => o !== s && o.alive));
    if (!goal) {
      if (!b.wander || Math.hypot(b.wander.x - s.x, b.wander.y - s.y) < 8) {
        const open = map.openTiles();
        b.wander = open[Math.floor(Math.random() * open.length)];
      }
      goal = b.wander;
    }
    followPath(game, s, goal.x, goal.y, dt);
  }

  function nearest(s, list) {
    let best = null, bd = 1e9;
    for (const o of list) {
      const d = Math.hypot(o.x - s.x, o.y - s.y);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  function followPath(game, s, gx, gy, dt) {
    const b = s.bot;
    b.repath -= dt;
    const tx = Math.floor(s.x / TILE), ty = Math.floor(s.y / TILE);
    if (b.repath <= 0 || !b.path || !b.path.length) {
      b.repath = rand(0.35, 0.6);
      b.path = bfs(game.map, tx, ty, Math.floor(gx / TILE), Math.floor(gy / TILE)) || [];
    }
    // salta i punti già raggiunti
    while (b.path.length && b.path[0][0] === tx && b.path[0][1] === ty) b.path.shift();
    let wx = gx, wy = gy;
    if (b.path.length) { wx = b.path[0][0] * TILE + TILE / 2; wy = b.path[0][1] * TILE + TILE / 2; }
    const dx = wx - s.x, dy = wy - s.y, d = Math.hypot(dx, dy);
    if (d > 1) { s.input.x = dx / d; s.input.y = dy / d; }

    // se resta incastrato, prova una direzione a caso per un attimo
    if (Math.hypot(s.x - b.lastX, s.y - b.lastY) < 0.2) b.stuckT += dt; else b.stuckT = 0;
    b.lastX = s.x; b.lastY = s.y;
    if (b.stuckT > 0.4) {
      const a = rand(0, Math.PI * 2);
      s.input.x = Math.cos(a); s.input.y = Math.sin(a);
      b.repath = 0;
      if (b.stuckT > 0.8) b.stuckT = 0;
    }
  }

  window.Bots = { think, bfs };
})();
