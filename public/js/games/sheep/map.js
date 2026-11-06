/**
 * HOLY SHEEP — generazione del pascolo.
 * Come in Soldatini Arena: si riempie a caso un quarto di mappa e lo si specchia,
 * così i quattro recinti sono in posizioni equivalenti. Poi si controlla che
 * tutto il prato sia raggiungibile.
 */
(function () {
  'use strict';
  const S = SHEEP;
  const { COLS, ROWS, TILE, T } = S;

  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const solid = (t) => t !== T.GRASS;

  function prefab() {
    const kind = pick(['bush', 'bush', 'bush', 'rock', 'rock', 'hay', 'pond', 'tree', 'tree']);
    const c = [];
    if (kind === 'bush') {
      const shape = pick([[[0, 0]], [[0, 0], [1, 0]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [1, 1]]]);
      shape.forEach(([x, y]) => c.push([x, y, T.BUSH]));
    } else if (kind === 'rock') {
      const shape = pick([[[0, 0]], [[0, 0], [1, 0]]]);
      shape.forEach(([x, y]) => c.push([x, y, T.ROCK]));
    } else if (kind === 'hay') {
      c.push([0, 0, T.HAY], [1, 0, T.HAY]);
    } else if (kind === 'pond') {
      for (let y = 0; y < 2; y++) for (let x = 0; x < 3; x++) c.push([x, y, T.WATER]);
    } else {
      c.push([0, 0, T.TREE]);
    }
    return c;
  }

  function tryGenerate(usedSlots) {
    const g = [];
    for (let y = 0; y < ROWS; y++) g.push(new Array(COLS).fill(T.GRASS));
    const QW = COLS / 2, QH = ROWS / 2;
    const reserved = (x, y) => (x <= 14 && y <= 9);   // recinto + spazio davanti al cancello

    let placed = 0;
    const target = rnd(5, 8);
    for (let i = 0; i < 300 && placed < target; i++) {
      const cells = prefab();
      const w = Math.max(...cells.map((c) => c[0])) + 1, h = Math.max(...cells.map((c) => c[1])) + 1;
      const ox = rnd(2, QW - w), oy = rnd(2, QH - h);
      const abs = cells.map(([x, y, t]) => [ox + x, oy + y, t]);
      let ok = true;
      for (const [x, y] of abs) {
        if (reserved(x, y)) { ok = false; break; }
        for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 1 || yy < 1 || xx >= QW || yy >= QH) continue;
          if (g[yy][xx] !== T.GRASS) { ok = false; break; }
        }
        if (!ok) break;
      }
      if (!ok) continue;
      for (const [x, y, t] of abs) g[y][x] = t;
      placed++;
    }
    // specchiatura nei 4 quarti
    for (let y = 0; y < QH; y++) for (let x = 0; x < QW; x++) {
      const t = g[y][x];
      g[y][COLS - 1 - x] = t; g[ROWS - 1 - y][x] = t; g[ROWS - 1 - y][COLS - 1 - x] = t;
    }
    // staccionata esterna
    for (let x = 0; x < COLS; x++) { g[0][x] = T.FENCE; g[ROWS - 1][x] = T.FENCE; }
    for (let y = 0; y < ROWS; y++) { g[y][0] = T.FENCE; g[y][COLS - 1] = T.FENCE; }
    // recinti
    S.PENS.forEach((p, slot) => {
      for (let y = p.ty; y < p.ty + p.th; y++) for (let x = p.tx; x < p.tx + p.tw; x++) g[y][x] = T.GRASS;
      const ys = p.wallY > p.ty ? [0, p.wallY] : [p.wallY, ROWS - 1];
      for (let y = ys[0]; y <= ys[1]; y++) {
        const isGate = p.gate.includes(y);
        g[y][p.wallX] = isGate ? (usedSlots.includes(slot) ? T.GRASS : T.GATE) : T.FENCE;
      }
      const xs = p.wallX > p.tx ? [0, p.wallX] : [p.wallX, COLS - 1];
      for (let x = xs[0]; x <= xs[1]; x++) g[p.wallY][x] = T.FENCE;
      // davanti al cancello sempre libero
      for (const y of p.gate) for (let k = 1; k <= 3; k++) {
        const x = p.wallX + p.dir * k;
        if (g[y][x] !== T.FENCE) g[y][x] = T.GRASS;
      }
    });

    // raggiungibilità dal cancello del primo recinto usato
    const p0 = S.PENS[usedSlots[0] || 0];
    const sx = p0.wallX + p0.dir * 2, sy = p0.gate[1];
    const seen = g.map((r) => r.map(() => false));
    const st = [[sx, sy]]; seen[sy][sx] = true;
    while (st.length) {
      const [x, y] = st.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= COLS || yy >= ROWS || seen[yy][xx] || solid(g[yy][xx])) continue;
        seen[yy][xx] = true; st.push([xx, yy]);
      }
    }
    let lost = 0;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (g[y][x] !== T.GRASS || seen[y][x]) continue;
      // i recinti chiusi (giocatori assenti) restano vuoti: va bene
      const inPen = S.PENS.some((p) => x >= p.tx && x < p.tx + p.tw && y >= p.ty && y < p.ty + p.th);
      if (!inPen) { lost++; g[y][x] = T.BUSH; }
    }
    if (lost > 6) return null;
    return g;
  }

  function generate(usedSlots) {
    let g = null;
    for (let i = 0; i < 100 && !g; i++) g = tryGenerate(usedSlots);
    if (!g) g = tryGenerate(usedSlots) || [];
    const map = { grid: g, seed: Math.floor(Math.random() * 1e6) };
    map.tileAt = (px, py) => {
      const x = Math.floor(px / TILE), y = Math.floor(py / TILE);
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return T.FENCE;
      return g[y][x];
    };
    map.solid = (px, py) => solid(map.tileAt(px, py));
    map.open = () => {
      const out = [];
      for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) {
        if (g[y][x] !== T.GRASS) continue;
        if (S.PENS.some((p) => x >= p.tx - 1 && x <= p.tx + p.tw && y >= p.ty - 1 && y <= p.ty + p.th)) continue;
        out.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, tx: x, ty: y });
      }
      return out;
    };
    return map;
  }

  window.SheepMap = { generate, solid };
})();
