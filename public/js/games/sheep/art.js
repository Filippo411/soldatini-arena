/**
 * HOLY SHEEP — pixel art generata in codice: pecore, cani, lupo, pascolo.
 */
(function () {
  'use strict';
  const S = SHEEP;
  const { TILE, T, COLS, ROWS } = S;
  const K = '#1b1b26';

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function fromRows(rows, pal) {
    const c = canvas(rows[0].length, rows.length);
    const g = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
    return c;
  }
  function flip(src) {
    const c = canvas(src.width, src.height);
    const g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
    return c;
  }
  const both = (rows, pal) => { const r = fromRows(rows, pal); return { right: r, left: flip(r) }; };

  // --- Pecora (rivolta a destra), 11x9: lana tonda, muso scuro ---
  const SHEEP_A = [
    '..kkkkk....',
    '.kwwWwwkk..',
    'kwwwwwwwkkk',
    'kwWwwwWwkgk',
    'kwwwwwwwkek',
    'kwwwWwwwkkk',
    '.kkkkkkkk..',
    '..kg..kg...',
    '..kk..kk...',
  ];
  const SHEEP_B = SHEEP_A.slice(0, 7).concat(['...kg.kg...', '...kk.kk...']);
  const SHEEP_PAL = { k: K, w: '#ffffff', W: '#d9dbe6', g: '#3a3d48', e: '#ffffff' };
  const GOLD_PAL = { k: K, w: '#ffe14a', W: '#f39b1d', g: '#5a3a22', e: '#ffffff' };

  // --- Cane (rivolto a destra), 13x10: border collie con bandana colorata ---
  const DOG_A = [
    '.........kk..',
    '........kbbk.',
    '.......kbbwbk',
    'kk.....kbbbbkk',
    'kbk.kkkkcckkk.',
    '.kbbbbbbbccwk.',
    '.kbbbbwwwwwk..',
    '..kbwkkkkbwk..',
    '..kbk....kbk..',
    '..kk.....kk...',
  ].map((r) => r.slice(0, 13));
  const DOG_B = DOG_A.slice(0, 7).concat(['..kbwkkkkbwk.', '...kbk..kbk..', '...kk...kk...']);

  // --- Lupo (rivolto a destra), 15x10 ---
  const WOLF_A = [
    '...........kk..',
    '..........kggk.',
    '.........kgggrk',
    'kk......kgggggk',
    'kgk.kkkkkgggkk.',
    '.kggggggggggk..',
    '.kgGggggGgggk..',
    '..kgGkkkkkgGk..',
    '..kgk.....kgk..',
    '..kk......kk...',
  ];
  const WOLF_B = WOLF_A.slice(0, 7).concat(['..kgGkkkkkgGk..', '...kgk...kgk...', '...kk....kk....']);
  const WOLF_PAL = { k: K, g: '#8a8f9c', G: '#5d6170', r: '#ff3b3b' };

  const sheep = { a: both(SHEEP_A, SHEEP_PAL), b: both(SHEEP_B, SHEEP_PAL) };
  const gold = { a: both(SHEEP_A, GOLD_PAL), b: both(SHEEP_B, GOLD_PAL) };
  const wolf = { a: both(WOLF_A, WOLF_PAL), b: both(WOLF_B, WOLF_PAL) };
  const dogs = ROOM.PLAYERS.map((pc) => {
    const pal = { k: K, b: '#3a2a22', w: '#ffffff', c: pc.color };
    return { a: both(DOG_A, pal), b: both(DOG_B, pal) };
  });

  // ------------------------------------------------------------------
  // Pascolo
  // ------------------------------------------------------------------
  function hash(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function px(g, x, y, c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }

  const G1 = '#5fb83a', G2 = '#4ea52f', G3 = '#7dcf4a', G4 = '#3f8a27';
  const FLOWERS = ['#ffffff', '#ffd23b', '#ff7ab8', '#9ccbff'];

  function grass(g, ox, oy, tx, ty, seed) {
    rect(g, ox, oy, TILE, TILE, hash(Math.floor(tx / 4), Math.floor(ty / 3), seed) < 0.3 ? G2 : G1);
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(hash(tx * 8 + i, ty, seed) * 8), y = Math.floor(hash(tx, ty * 8 + i, seed) * 8);
      px(g, ox + x, oy + y, i % 2 ? G3 : G4);
    }
    const d = hash(tx, ty, seed + 3);
    if (d < 0.06) { // fiorellino
      const c = FLOWERS[Math.floor(d * 100) % FLOWERS.length];
      px(g, ox + 3, oy + 3, c); px(g, ox + 2, oy + 3, c); px(g, ox + 4, oy + 3, c); px(g, ox + 3, oy + 2, c); px(g, ox + 3, oy + 4, c);
      px(g, ox + 3, oy + 3, '#ffd23b');
    } else if (d < 0.12) { // ciuffo d'erba
      px(g, ox + 2, oy + 5, G4); px(g, ox + 3, oy + 4, G3); px(g, ox + 4, oy + 5, G4); px(g, ox + 5, oy + 4, G3);
    }
  }

  function penFloor(g, ox, oy, tx, ty) {
    rect(g, ox, oy, TILE, TILE, '#c9a462');
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(hash(tx * 3 + i, ty, 5) * 7), y = Math.floor(hash(tx, ty * 3 + i, 5) * 8);
      rect(g, ox + x, oy + y, 2, 1, i % 2 ? '#e8c983' : '#a8844a'); // paglia
    }
  }

  function fence(g, ox, oy, tx, ty, grid) {
    const isF = (x, y) => y >= 0 && y < ROWS && x >= 0 && x < COLS && (grid[y][x] === T.FENCE || grid[y][x] === T.GATE);
    const h = isF(tx - 1, ty) || isF(tx + 1, ty);
    const v = isF(tx, ty - 1) || isF(tx, ty + 1);
    // assi orizzontali e/o verticali + paletto
    if (h) { rect(g, ox, oy + 2, TILE, 2, '#8a5a2c'); rect(g, ox, oy + 5, TILE, 2, '#8a5a2c'); rect(g, ox, oy + 2, TILE, 1, '#c98a4a'); rect(g, ox, oy + 5, TILE, 1, '#c98a4a'); }
    if (v || !h) { rect(g, ox + 3, oy, 2, TILE, '#8a5a2c'); rect(g, ox + 3, oy, 1, TILE, '#c98a4a'); }
    rect(g, ox + 2, oy + 1, 4, 6, K); rect(g, ox + 3, oy + 1, 2, 5, '#a8703a'); px(g, ox + 3, oy + 1, '#e3a45f');
  }

  function gate(g, ox, oy) {
    // cancello chiuso (recinto di un giocatore assente)
    rect(g, ox + 1, oy, 6, TILE, K);
    rect(g, ox + 2, oy, 4, TILE, '#6b6f7a');
    for (let y = 1; y < 8; y += 3) rect(g, ox + 2, oy + y, 4, 1, '#9aa0ad');
  }

  function bush(g, ox, oy) {
    rect(g, ox, oy + 1, 8, 7, K);
    rect(g, ox + 1, oy + 1, 6, 6, '#2f7a24');
    rect(g, ox + 1, oy + 1, 5, 2, '#46a336');
    px(g, ox + 2, oy + 2, '#7dcf4a'); px(g, ox + 5, oy + 4, '#46a336');
    px(g, ox + 3, oy + 4, '#ff3b3b'); px(g, ox + 5, oy + 2, '#ff3b3b'); // bacche
  }
  function rock(g, ox, oy) {
    rect(g, ox + 1, oy + 2, 6, 6, K);
    rect(g, ox + 1, oy + 2, 5, 5, '#9aa0ad');
    rect(g, ox + 1, oy + 2, 4, 2, '#c9ccd4');
    px(g, ox + 4, oy + 5, '#6b6f7a');
  }
  function hay(g, ox, oy) {
    rect(g, ox, oy + 1, 8, 7, K);
    rect(g, ox, oy + 1, 7, 6, '#e8c040');
    rect(g, ox, oy + 1, 7, 1, '#fff1a0');
    for (let x = 1; x < 7; x += 2) rect(g, ox + x, oy + 2, 1, 4, '#c29a2a');
    rect(g, ox, oy + 4, 7, 1, '#8a5a2c');
  }
  function water(g, ox, oy, tx, ty, grid) {
    rect(g, ox, oy, TILE, TILE, '#2f8bff');
    const isW = (x, y) => grid[y] && grid[y][x] === T.WATER;
    if (!isW(tx, ty - 1)) rect(g, ox, oy, TILE, 2, '#9ccbff');
    if (!isW(tx, ty + 1)) rect(g, ox, oy + 6, TILE, 2, '#1a3fa8');
    if (!isW(tx - 1, ty)) rect(g, ox, oy, 1, TILE, '#1a3fa8');
    if (!isW(tx + 1, ty)) rect(g, ox + 7, oy, 1, TILE, '#1a3fa8');
    px(g, ox + 3, oy + 4, '#ffffff'); px(g, ox + 4, oy + 4, '#9ccbff');
  }
  function tree(g, ox, oy) {
    rect(g, ox + 3, oy + 3, 2, 5, '#5a3a22');
    rect(g, ox - 2, oy - 6, 12, 10, K);
    rect(g, ox - 1, oy - 5, 10, 8, '#2f7a24');
    rect(g, ox, oy - 5, 7, 3, '#46a336');
    px(g, ox + 1, oy - 4, '#7dcf4a'); px(g, ox + 6, oy - 1, '#46a336');
  }

  /** Disegna l'intero pascolo statico (con i recinti colorati dei giocatori) */
  function renderMap(map, usedSlots) {
    const c = canvas(COLS * TILE, ROWS * TILE);
    const g = c.getContext('2d');
    const grid = map.grid;
    const inPen = (x, y) => S.PENS.findIndex((p) => x >= p.tx && x < p.tx + p.tw && y >= p.ty && y < p.ty + p.th);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const pi = inPen(x, y);
      if (pi >= 0) penFloor(g, x * TILE, y * TILE, x, y);
      else grass(g, x * TILE, y * TILE, x, y, map.seed % 1000);
    }
    // ombre
    g.fillStyle = 'rgba(20,60,10,0.35)';
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const t = grid[y][x];
      if (t === T.BUSH || t === T.ROCK || t === T.HAY) g.fillRect(x * TILE + 2, y * TILE + 3, TILE, TILE);
    }
    const trees = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const t = grid[y][x], ox = x * TILE, oy = y * TILE;
      if (t === T.FENCE) fence(g, ox, oy, x, y, grid);
      else if (t === T.GATE) gate(g, ox, oy);
      else if (t === T.BUSH) bush(g, ox, oy);
      else if (t === T.ROCK) rock(g, ox, oy);
      else if (t === T.HAY) hay(g, ox, oy);
      else if (t === T.WATER) water(g, ox, oy, x, y, grid);
      else if (t === T.TREE) trees.push([ox, oy]);
    }
    for (const [ox, oy] of trees) tree(g, ox, oy);
    // bandierine colorate sui recinti dei giocatori
    S.PENS.forEach((p, slot) => {
      if (!usedSlots.includes(slot)) return;
      const pc = ROOM.PLAYERS[slot];
      const fx = (p.dir > 0 ? p.tx + p.tw : p.tx - 1) * TILE + 3;
      const fy = (p.wallY > p.ty ? p.wallY : p.wallY) * TILE - 9;
      rect(g, fx, fy, 1, 12, K);
      rect(g, fx + 1, fy, 6, 4, K);
      rect(g, fx + 1, fy + 1, 5, 2, pc.color);
      // pavimento del recinto leggermente colorato
      g.fillStyle = pc.color;
      g.globalAlpha = 0.18;
      g.fillRect(p.x, p.y, p.w, p.h);
      g.globalAlpha = 1;
    });
    return c;
  }

  window.SheepArt = { sheep, gold, wolf, dogs, renderMap };
})();
