/**
 * Grafica pixel art generata in codice: soldatini, caselle della mappa,
 * effetti. Niente immagini esterne: ogni sprite è una griglia di caratteri
 * tradotta in pixel su un canvas al caricamento.
 */
(function () {
  'use strict';
  const { TILE, T, COLS, ROWS } = CFG;

  // Palette comune (colori saturi stile arcade anni '90)
  const P = {
    k: '#1b1b26', // contorno
    H: '#9fb04f', // elmetto chiaro
    h: '#66762f', // elmetto
    d: '#3f4a1d', // elmetto scuro
    s: '#ffc690', // pelle
    S: '#d58a5c', // pelle in ombra
    w: '#ffffff',
    p: '#c2a463', // pantaloni kaki
    P: '#86703c',
    b: '#5a3a22', // stivali
    m: '#b8343a', // bocca
  };

  // Soldatino tozzo visto di lato, rivolto a destra. 12 x 17 pixel.
  // c / C = colore del giocatore (bandana e divisa) chiaro / scuro.
  const BODY = [
    '...kkkkkk...',
    '..kHHHHhhk..',
    '.kHHhhhhhhk.',
    '.khhhhhhhdk.',
    'kdhhhhhhhhdk',
    'kkcccccccckk',
    '.ksssswkssk.',
    '.kSsssssssk.',
    '..kSSsssSk..',
    '..kcccccck..',
    '.kCcccccccCk',
    '.kCccCcccCk.',
    '..kPPPPPPk..',
  ];
  const BODY_DEAD = BODY.slice();
  BODY_DEAD[6] = '.ksssskksskk'.slice(0, 12);
  BODY_DEAD[7] = '.kSssssmmsk.';

  const LEGS = {
    stand: [
      '..kppk.kppk.',
      '..kpPk.kpPk.',
      '..kbbbkkbbbk',
      '..kkkk.kkkk.',
    ],
    walkA: [
      '.kppk...kppk',
      '.kpPk...kpk.',
      'kbbbk..kbbbk',
      'kkkk...kkkk.',
    ],
    walkB: [
      '...kppkppk..',
      '...kpPkPk...',
      '...kbbbbbk..',
      '...kkkkkk...',
    ],
  };

  const SW = 12, SH = 17;

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  /** Converte righe di caratteri in canvas usando una palette. */
  function rowsToCanvas(rows, pal) {
    const c = makeCanvas(rows[0].length, rows.length);
    const g = c.getContext('2d');
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === '.' || !pal[ch]) continue;
      g.fillStyle = pal[ch];
      g.fillRect(x, y, 1, 1);
    }
    return c;
  }

  function flipH(src) {
    const c = makeCanvas(src.width, src.height);
    const g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1);
    g.drawImage(src, 0, 0);
    return c;
  }

  function rotate90(src, times) {
    const r = ((times % 4) + 4) % 4;
    const w = r % 2 ? src.height : src.width, h = r % 2 ? src.width : src.height;
    const c = makeCanvas(w, h);
    const g = c.getContext('2d');
    g.translate(w / 2, h / 2);
    g.rotate((r * Math.PI) / 2);
    g.drawImage(src, -src.width / 2, -src.height / 2);
    return c;
  }

  /** Sagoma a tinta unica (per lampeggi e scia del Flash). */
  function silhouette(src, color) {
    const c = makeCanvas(src.width, src.height);
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }

  /**
   * Crea tutti i fotogrammi del soldatino per un colore.
   * Restituisce { right: {stand, walkA, walkB, dead}, left: {...}, white, trail, deadRot[4] }
   */
  function buildSoldier(colorDef) {
    const pal = Object.assign({}, P, { c: colorDef.color, C: colorDef.dark });
    const frames = {};
    for (const name of ['stand', 'walkA', 'walkB']) {
      frames[name] = rowsToCanvas(BODY.concat(LEGS[name]), pal);
    }
    frames.dead = rowsToCanvas(BODY_DEAD.concat(LEGS.walkA), pal);
    const left = {};
    for (const k in frames) left[k] = flipH(frames[k]);
    return {
      right: frames,
      left,
      white: { right: silhouette(frames.stand, '#ffffff'), left: silhouette(left.stand, '#ffffff') },
      trail: { right: silhouette(frames.walkA, colorDef.light), left: silhouette(left.walkA, colorDef.light) },
      deadRot: [0, 1, 2, 3].map((r) => rotate90(frames.dead, r)),
    };
  }

  // ------------------------------------------------------------------
  // Caselle della mappa
  // ------------------------------------------------------------------
  // Piccolo generatore pseudo-casuale deterministico (stessa mappa = stessi dettagli)
  function hash(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }

  const SAND1 = '#d9b56a', SAND2 = '#c9a057', SAND3 = '#e8c983', SAND4 = '#b38a48';

  function px(g, x, y, c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
  function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }

  function drawFloor(g, ox, oy, tx, ty, seed) {
    rect(g, ox, oy, TILE, TILE, SAND1);
    // chiazze più scure/chiare a grande scala
    const big = hash(Math.floor(tx / 3), Math.floor(ty / 3), seed);
    if (big < 0.25) rect(g, ox, oy, TILE, TILE, SAND2);
    for (let i = 0; i < 5; i++) {
      const r = hash(tx * 8 + i, ty * 8 + i * 3, seed);
      const x = Math.floor(r * 8), y = Math.floor(hash(tx + i * 7, ty + i, seed) * 8);
      px(g, ox + x, oy + y, r < 0.5 ? SAND4 : SAND3);
    }
    const d = hash(tx, ty, seed + 1);
    if (d < 0.05) { // sassolino
      rect(g, ox + 3, oy + 4, 2, 1, '#8a7a66'); px(g, ox + 3, oy + 3, '#bfb3a3');
    } else if (d < 0.09) { // ciuffo d'erba secca
      px(g, ox + 2, oy + 5, '#7d8a35'); px(g, ox + 3, oy + 4, '#9aa847'); px(g, ox + 4, oy + 5, '#7d8a35');
    } else if (d < 0.11) { // impronte
      px(g, ox + 2, oy + 2, SAND4); px(g, ox + 5, oy + 5, SAND4);
    }
  }

  function drawWall(g, ox, oy, tx, ty, grid) {
    // Blocchi di cemento con bordo superiore chiaro e lato inferiore scuro (finto 3D)
    rect(g, ox, oy, TILE, TILE, '#8d8f99');
    rect(g, ox, oy, TILE, 2, '#b9bcc6');
    rect(g, ox, oy + 6, TILE, 2, '#5d5f6b');
    const brick = (tx + ty) % 2 === 0;
    rect(g, ox + (brick ? 3 : 7), oy + 2, 1, 4, '#6d6f7a');
    rect(g, ox, oy + 4, TILE, 1, '#7a7c86');
    if (hash(tx, ty, 9) < 0.3) { px(g, ox + 5, oy + 3, '#5d5f6b'); px(g, ox + 6, oy + 2, '#5d5f6b'); } // crepa
    // contorno dove confina con il pavimento
    const isW = (x, y) => y >= 0 && y < ROWS && x >= 0 && x < COLS && grid[y][x] === T.WALL;
    if (!isW(tx, ty - 1)) rect(g, ox, oy, TILE, 1, '#1b1b26');
    if (!isW(tx, ty + 1)) rect(g, ox, oy + 7, TILE, 1, '#1b1b26');
    if (!isW(tx - 1, ty)) rect(g, ox, oy, 1, TILE, '#1b1b26');
    if (!isW(tx + 1, ty)) rect(g, ox + 7, oy, 1, TILE, '#1b1b26');
  }

  function drawCrate(g, ox, oy) {
    rect(g, ox, oy, 8, 8, '#1b1b26');
    rect(g, ox + 1, oy + 1, 6, 6, '#c27a3a');
    rect(g, ox + 1, oy + 1, 6, 1, '#e39c55');
    rect(g, ox + 1, oy + 6, 6, 1, '#8a4f22');
    // X di rinforzo
    for (let i = 0; i < 6; i++) { px(g, ox + 1 + i, oy + 1 + i, '#8a4f22'); px(g, ox + 6 - i, oy + 1 + i, '#8a4f22'); }
    px(g, ox + 1, oy + 1, '#ffd08a');
  }

  function drawSand(g, ox, oy, tx, ty) {
    // Due file di sacchi tondeggianti, sfalsate
    const off = (tx + ty) % 2 ? 0 : 2;
    rect(g, ox, oy + 1, 8, 7, '#1b1b26');
    for (let row = 0; row < 2; row++) {
      const y = oy + 1 + row * 3;
      for (let i = -1; i < 2; i++) {
        const x = ox + i * 4 + (row ? off : (off + 2) % 4);
        if (x + 3 < ox || x > ox + 7) continue;
        const x0 = Math.max(ox, x), x1 = Math.min(ox + 8, x + 4);
        rect(g, x0, y + 1, x1 - x0, 2, '#b89c63');
        rect(g, x0, y, x1 - x0, 1, '#ddc489');
        if (x + 3 < ox + 8 && x + 3 >= ox) px(g, x + 3, y + 1, '#7d6838');
      }
    }
    rect(g, ox, oy + 7, 8, 1, '#7d6838');
  }

  function drawBarrel(g, ox, oy) {
    rect(g, ox + 1, oy, 6, 8, '#1b1b26');
    rect(g, ox + 2, oy + 1, 4, 6, '#d83a2e');
    rect(g, ox + 2, oy + 1, 1, 6, '#ff7a5c');
    rect(g, ox + 5, oy + 1, 1, 6, '#8e1d1d');
    rect(g, ox + 2, oy + 3, 4, 1, '#ffd23b'); // fascia gialla di pericolo
    rect(g, ox + 2, oy + 1, 4, 1, '#ff9c80');
  }

  function drawWire(g, ox, oy, tx, ty) {
    drawFloor(g, ox, oy, tx, ty, 7);
    // paletti e spirale di filo spinato
    rect(g, ox + 1, oy + 1, 1, 6, '#5a3a22');
    for (let x = 0; x < 8; x++) {
      const y = oy + 3 + Math.round(Math.sin((x + tx * 8) * 1.3) * 2);
      px(g, ox + x, y, '#c9ccd4');
      if (x % 3 === 0) { px(g, ox + x, y - 1, '#6b6f7a'); px(g, ox + x, y + 1, '#6b6f7a'); }
    }
  }

  function drawWreck(g, ox, oy) {
    // Rottame di carro armato 24x16 (3x2 caselle)
    rect(g, ox + 1, oy + 2, 22, 13, '#1b1b26');
    rect(g, ox + 2, oy + 3, 20, 11, '#5f5a4a');
    rect(g, ox + 2, oy + 3, 20, 2, '#7e7863');
    rect(g, ox + 2, oy + 11, 20, 3, '#3a3830'); // cingoli
    for (let x = 3; x < 22; x += 3) px(g, ox + x, oy + 12, '#6b6f7a');
    rect(g, ox + 7, oy + 4, 9, 6, '#1b1b26'); // torretta
    rect(g, ox + 8, oy + 5, 7, 4, '#6e6853');
    rect(g, ox + 15, oy + 6, 8, 2, '#1b1b26'); // cannone storto
    rect(g, ox + 16, oy + 6, 6, 1, '#7e7863');
    // ruggine e bruciature
    px(g, ox + 4, oy + 6, '#a0522d'); px(g, ox + 5, oy + 7, '#a0522d'); px(g, ox + 18, oy + 9, '#a0522d');
    px(g, ox + 10, oy + 6, '#3a3830'); px(g, ox + 12, oy + 7, '#3a3830');
  }

  /** Disegna l'intera mappa statica su un canvas (si ridisegna solo se cambia). */
  function renderMap(map) {
    const c = makeCanvas(COLS * TILE, ROWS * TILE);
    const g = c.getContext('2d');
    const grid = map.grid;
    // 1) pavimento ovunque
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) drawFloor(g, x * TILE, y * TILE, x, y, map.seed % 1000);
    // 2) ombre proiettate (in basso a destra degli ostacoli)
    g.fillStyle = 'rgba(70,40,20,0.35)';
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const t = grid[y][x];
      if (t === T.FLOOR || t === T.WIRE) continue;
      g.fillRect(x * TILE + 2, y * TILE + 3, TILE, TILE);
    }
    // 3) ostacoli
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const t = grid[y][x], ox = x * TILE, oy = y * TILE;
      if (t === T.WALL) drawWall(g, ox, oy, x, y, grid);
      else if (t === T.CRATE) drawCrate(g, ox, oy);
      else if (t === T.SAND) drawSand(g, ox, oy, x, y);
      else if (t === T.BARREL) drawBarrel(g, ox, oy);
      else if (t === T.WIRE) drawWire(g, ox, oy, x, y);
    }
    for (const [x, y] of map.wrecks) drawWreck(g, x * TILE, y * TILE);
    return c;
  }

  /** Ridisegna una sola casella (es. barile esploso) + bruciatura. */
  function redrawTile(canvas, map, tx, ty) {
    const g = canvas.getContext('2d');
    drawFloor(g, tx * TILE, ty * TILE, tx, ty, map.seed % 1000);
  }

  /** Macchia di bruciatura permanente sul pavimento. */
  function scorch(canvas, map, x, y, r) {
    const g = canvas.getContext('2d');
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
      const d = Math.hypot(xx, yy * 1.3);
      if (d > r) continue;
      const wx = Math.round(x + xx), wy = Math.round(y + yy);
      const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
      if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS || map.grid[ty][tx] !== T.FLOOR) continue;
      const n = hash(wx, wy, 3);
      if (n < 1 - d / r) {
        g.fillStyle = d < r * 0.45 ? '#3a2a1e' : (n < 0.5 ? '#6b4a2e' : '#8a6a42');
        g.fillRect(wx, wy, 1, 1);
      }
    }
  }

  window.Sprites = { buildSoldier, renderMap, redrawTile, scorch, SW, SH, makeCanvas, P };
})();
