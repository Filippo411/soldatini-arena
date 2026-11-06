/**
 * Generazione casuale della mappa.
 *
 * Idea: si riempie a caso un QUARTO della mappa con dei "blocchi prefabbricati"
 * (muretti a L, file di sacchi di sabbia, casse, barili, filo spinato, rottami)
 * e poi lo si specchia in orizzontale e in verticale: così i 4 angoli di
 * partenza sono identici e la mappa è bilanciata.
 *
 * Poi un "flood fill" controlla che ogni casella libera sia raggiungibile:
 * le sacche chiuse piccole vengono riempite, se ce ne sono di grandi si rigenera.
 */
(function () {
  'use strict';
  const { COLS, ROWS, TILE, T } = CFG;

  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Caselle che bloccano il movimento / i proiettili
  const blocksMove = (t) => t !== T.FLOOR;
  const blocksShot = (t) => t !== T.FLOOR && t !== T.WIRE;

  /** Restituisce l'elenco di caselle [dx,dy,tipo] di un prefabbricato casuale. */
  function randomPrefab() {
    const cells = [];
    const kind = pick(['wallL', 'wallL', 'wallLine', 'sand', 'sand', 'crates', 'crates', 'barrels', 'wire', 'wreck', 'bunker']);
    if (kind === 'wallL') {
      const a = rnd(3, 5), b = rnd(2, 3);
      for (let i = 0; i < a; i++) cells.push([i, 0, T.WALL]);
      for (let j = 1; j < b; j++) cells.push([0, j, T.WALL]);
    } else if (kind === 'wallLine') {
      const n = rnd(3, 5);
      const horiz = Math.random() < 0.5;
      for (let i = 0; i < n; i++) cells.push(horiz ? [i, 0, T.WALL] : [0, i, T.WALL]);
    } else if (kind === 'sand') {
      const n = rnd(3, 5);
      const horiz = Math.random() < 0.65;
      for (let i = 0; i < n; i++) cells.push(horiz ? [i, 0, T.SAND] : [0, i, T.SAND]);
    } else if (kind === 'crates') {
      const shape = pick([[[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 0]]]);
      for (const [x, y] of shape) cells.push([x, y, T.CRATE]);
    } else if (kind === 'barrels') {
      const shape = pick([[[0, 0]], [[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 1]]]);
      for (const [x, y] of shape) cells.push([x, y, T.BARREL]);
    } else if (kind === 'wire') {
      const n = rnd(3, 4);
      const horiz = Math.random() < 0.5;
      for (let i = 0; i < n; i++) cells.push(horiz ? [i, 0, T.WIRE] : [0, i, T.WIRE]);
    } else if (kind === 'wreck') {
      for (let y = 0; y < 2; y++) for (let x = 0; x < 3; x++) cells.push([x, y, T.WRECK]);
    } else if (kind === 'bunker') {
      // piccolo bunker: sacchi a U con una cassa
      cells.push([0, 0, T.SAND], [1, 0, T.SAND], [2, 0, T.SAND], [0, 1, T.SAND], [2, 1, T.CRATE]);
    }
    return cells;
  }

  function tryGenerate() {
    const g = [];
    for (let y = 0; y < ROWS; y++) g.push(new Array(COLS).fill(T.FLOOR));
    const wrecks = []; // angolo in alto a sinistra di ogni rottame 3x2

    // Quarto in alto a sinistra: x 1..23, y 1..11
    const QW = COLS / 2, QH = ROWS / 2;
    const free = (x, y) => x >= 1 && y >= 1 && x < QW && y < QH && g[y][x] === T.FLOOR;
    const inSpawnZone = (x, y) => x <= 5 && y <= 5;

    const target = rnd(9, 12);
    let placed = 0;
    for (let attempt = 0; attempt < 300 && placed < target; attempt++) {
      const cells = randomPrefab();
      // Specchiamo a caso il prefabbricato per varietà
      const fx = Math.random() < 0.5, fy = Math.random() < 0.5;
      const w = Math.max(...cells.map((c) => c[0])) + 1;
      const h = Math.max(...cells.map((c) => c[1])) + 1;
      const ox = rnd(2, QW - w), oy = rnd(2, QH - h);
      const abs = cells.map(([x, y, t]) => [ox + (fx && t !== T.WRECK ? w - 1 - x : x), oy + (fy && t !== T.WRECK ? h - 1 - y : y), t]);

      // Ogni casella e i suoi vicini devono essere liberi (corridoi di almeno 1 casella)
      let ok = true;
      for (const [x, y] of abs) {
        if (inSpawnZone(x, y) || x >= QW || y >= QH) { ok = false; break; }
        for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 1 || yy < 1 || xx >= QW || yy >= QH) continue;
          if (!free(xx, yy)) { ok = false; break; }
        }
        if (!ok) break;
      }
      if (!ok) continue;
      for (const [x, y, t] of abs) g[y][x] = t;
      if (abs[0][2] === T.WRECK) wrecks.push([ox, oy]);
      placed++;
    }

    // Specchiatura nei 4 quadranti
    for (let y = 0; y < QH; y++) for (let x = 0; x < QW; x++) {
      const t = g[y][x];
      g[y][COLS - 1 - x] = t;
      g[ROWS - 1 - y][x] = t;
      g[ROWS - 1 - y][COLS - 1 - x] = t;
    }
    const allWrecks = [];
    for (const [x, y] of wrecks) {
      allWrecks.push([x, y], [COLS - 3 - x, y], [x, ROWS - 2 - y], [COLS - 3 - x, ROWS - 2 - y]);
    }

    // Bordo esterno: muro
    for (let x = 0; x < COLS; x++) { g[0][x] = T.WALL; g[ROWS - 1][x] = T.WALL; }
    for (let y = 0; y < ROWS; y++) { g[y][0] = T.WALL; g[y][COLS - 1] = T.WALL; }

    // Controllo raggiungibilità (flood fill dal primo spawn)
    const seen = [];
    for (let y = 0; y < ROWS; y++) seen.push(new Array(COLS).fill(false));
    const stack = [[3, 3]];
    seen[3][3] = true;
    let reached = 0;
    while (stack.length) {
      const [x, y] = stack.pop();
      reached++;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= COLS || yy >= ROWS) continue;
        if (seen[yy][xx] || blocksMove(g[yy][xx])) continue;
        seen[yy][xx] = true;
        stack.push([xx, yy]);
      }
    }
    let freeCount = 0, lost = 0;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (g[y][x] === T.FLOOR) {
        freeCount++;
        if (!seen[y][x]) { lost++; g[y][x] = T.CRATE; } // sacca chiusa: riempita
      }
    }
    if (lost > 8) return null; // troppe zone chiuse: meglio rifare

    const interior = (COLS - 2) * (ROWS - 2);
    const density = 1 - freeCount / interior;
    if (density < 0.12 || density > 0.26) return null;

    return { grid: g, wrecks: allWrecks.filter(([x, y]) => g[y][x] === T.WRECK) };
  }

  function generate() {
    for (let i = 0; i < 200; i++) {
      const m = tryGenerate();
      if (m) return finish(m);
    }
    // Ripiego improbabile: arena vuota con il solo bordo
    const g = [];
    for (let y = 0; y < ROWS; y++) {
      g.push(new Array(COLS).fill(T.FLOOR).map((_, x) => (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1 ? T.WALL : T.FLOOR)));
    }
    return finish({ grid: g, wrecks: [] });
  }

  function finish(m) {
    const map = m;
    // Punti di partenza: i 4 angoli (lontani tra loro)
    map.spawns = [
      [3, 3], [COLS - 4, ROWS - 4], [COLS - 4, 3], [3, ROWS - 4],
    ].map(([x, y]) => ({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 }));
    map.seed = Math.floor(Math.random() * 1e9); // per i dettagli decorativi
    map.tileAt = (px, py) => {
      const x = Math.floor(px / TILE), y = Math.floor(py / TILE);
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return T.WALL;
      return map.grid[y][x];
    };
    map.solidMove = (px, py) => blocksMove(map.tileAt(px, py));
    map.solidShot = (px, py) => blocksShot(map.tileAt(px, py));
    /** Linea di tiro libera tra due punti? (per i bot) */
    map.lineOfSight = (x0, y0, x1, y1) => {
      const d = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.ceil(d / 3);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        if (map.solidShot(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
      }
      return true;
    };
    /** Caselle libere con un po' di spazio intorno (per spawn e oggetti) */
    map.openTiles = () => {
      const out = [];
      for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) {
        if (map.grid[y][x] !== T.FLOOR) continue;
        let n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (map.grid[y + dy][x + dx] === T.FLOOR) n++;
        if (n >= 3) out.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, tx: x, ty: y });
      }
      return out;
    };
    return map;
  }

  window.MapGen = { generate, blocksMove, blocksShot };
})();
