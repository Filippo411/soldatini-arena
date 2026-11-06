/**
 * TROVA LE DIFFERENZE — scene in pixel art generate a caso.
 *
 * Questo file è usato sia dallo schermo grande sia dai telefoni:
 * una scena è solo un elenco di oggetti {k: tipo, x, y, c: colore, f: specchiato, v: variante},
 * quindi l'host la manda ai telefoni come piccolo JSON e ognuno la ridisegna identica.
 *
 *   const scene = DiffScene.generate();              // { theme, objs }
 *   const { objs, diffs } = DiffScene.makeDiffs(scene.objs, 10);
 *   DiffScene.draw(ctx, { theme, objs }, ox, oy);    // disegna 320x180
 */
(function () {
  'use strict';

  const SW = 320, SH = 180;
  const K = '#1b1b26';
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Colori "intercambiabili": una differenza può cambiarne uno con un altro
  const COLS = ['#ff3b3b', '#2f8bff', '#ffd23b', '#3fe05a', '#b04cf0', '#ff9c3b', '#ffffff', '#ff7ab8'];
  const DARK = { '#ff3b3b': '#a3172a', '#2f8bff': '#1a3fa8', '#ffd23b': '#c27a12', '#3fe05a': '#16843a', '#b04cf0': '#6a1fa3', '#ff9c3b': '#b85a12', '#ffffff': '#b9bcc4', '#ff7ab8': '#b03a74' };

  // ------------------------------------------------------------------
  // Primitive
  // ------------------------------------------------------------------
  let g = null, OX = 0, OY = 0, FLIP = false, FX = 0, FY = 0, FW = 0;
  function r(x, y, w, h, c) {
    g.fillStyle = c;
    let xx = x;
    if (FLIP) xx = FW - x - w;           // specchiatura orizzontale dell'oggetto
    g.fillRect(OX + FX + xx, OY + FY + y, w, h);
  }
  function p(x, y, c) { r(x, y, 1, 1, c); }
  function disc(cx, cy, rad, c) {
    for (let dy = -rad; dy <= rad; dy++) {
      const w = Math.round(Math.sqrt(rad * rad - dy * dy));
      r(cx - w, cy + dy, w * 2 + 1, 1, c);
    }
  }

  // ------------------------------------------------------------------
  // Oggetti: w,h = ingombro; draw(o, col, dark) disegna con origine in alto a sinistra
  // flip = può essere specchiato; color = ha un colore principale; vary = ha una variante
  // ------------------------------------------------------------------
  const T = {};
  function def(name, w, h, opts, draw) { T[name] = Object.assign({ w, h, draw }, opts); }

  def('cloud', 26, 10, { flip: true, vary: true }, (o) => {
    disc(7, 6, 4, K); disc(14, 4, 5, K); disc(20, 6, 4, K);
    disc(7, 6, 3, '#ffffff'); disc(14, 4, 4, '#ffffff'); disc(20, 6, 3, '#ffffff');
    r(4, 7, 20, 2, '#ffffff');
    if (o.v) { disc(24, 7, 2, K); disc(24, 7, 1, '#ffffff'); }   // nuvola con un "pezzetto" in più
  });
  def('sun', 18, 18, { vary: true, color: true }, (o, c, d) => {
    disc(9, 9, 6, K); disc(9, 9, 5, c === '#ffffff' ? '#ffe14a' : c);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; p(9 + Math.round(Math.cos(a) * 8), 9 + Math.round(Math.sin(a) * 8), d); }
    if (o.v) { p(7, 8, K); p(11, 8, K); r(7, 11, 5, 1, K); }      // sole sorridente
  });
  def('moon', 14, 14, { flip: true, vary: true }, (o) => {
    disc(7, 7, 6, K); disc(7, 7, 5, '#fff1a0'); disc(10, 5, 4, '#1a2350');
    if (o.v) p(4, 8, '#c9b860');
  });
  def('star', 5, 5, { color: true }, (o, c) => { p(2, 0, c); r(0, 2, 5, 1, c); p(2, 4, c); r(1, 1, 3, 3, c); });
  def('bird', 7, 4, { flip: true, vary: true }, (o) => {
    p(0, 0, K); p(1, 1, K); p(2, 2, K); p(3, 1, K); p(4, 1, K); p(5, 0, K); p(6, 0, K);
    if (o.v) p(3, 3, '#ff9c3b');
  });
  def('balloon', 9, 20, { color: true, vary: true }, (o, c, d) => {
    disc(4, 5, 4, K); disc(4, 5, 3, c); p(3, 3, '#ffffff'); p(4, 9, d);
    for (let y = 10; y < 20; y++) p(4 + (y % 4 === 0 ? 1 : 0), y, '#6b6f7a');
    if (o.v) { r(2, 5, 5, 1, d); }                              // striscia
  });
  def('tree', 18, 28, { vary: true, flip: true }, (o) => {
    r(7, 18, 4, 10, K); r(8, 18, 2, 10, '#8a5a2c');
    disc(9, 9, 9, K); disc(9, 9, 8, '#2f7a24'); disc(7, 7, 5, '#46a336'); p(5, 5, '#7dcf4a');
    if (o.v) { disc(5, 11, 1, '#ff3b3b'); disc(12, 6, 1, '#ff3b3b'); disc(13, 12, 1, '#ff3b3b'); } // mele
  });
  def('pine', 14, 26, { vary: true }, (o) => {
    r(6, 20, 3, 6, '#5a3a22');
    for (let i = 0; i < 4; i++) { const w = 3 + i * 2; r(7 - w, 2 + i * 5, w * 2 + 1, 5, K); r(8 - w, 3 + i * 5, w * 2 - 1, 3, '#2f7a24'); }
    if (o.v) p(7, 0, '#ffd23b');
  });
  def('bush', 14, 9, { vary: true, flip: true }, (o) => {
    disc(4, 5, 4, K); disc(9, 4, 4, K); disc(4, 5, 3, '#2f7a24'); disc(9, 4, 3, '#46a336'); r(1, 6, 12, 3, '#2f7a24');
    if (o.v) { p(4, 4, '#ff7ab8'); p(9, 3, '#ff7ab8'); p(7, 6, '#ff7ab8'); }
  });
  def('flower', 5, 9, { color: true }, (o, c) => { r(2, 4, 1, 5, '#2f7a24'); p(1, 6, '#46a336'); p(2, 1, c); r(1, 2, 3, 1, c); p(2, 3, c); p(2, 2, '#ffd23b'); });
  def('house', 30, 30, { color: true, vary: true, flip: true }, (o, c, d) => {
    for (let i = 0; i < 12; i++) r(3 + i - 1, 12 - i, 26 - i * 2 + 2, 1, K);
    for (let i = 0; i < 11; i++) r(3 + i, 12 - i, 24 - i * 2, 1, '#c2381f');
    r(4, 12, 22, 18, K); r(5, 13, 20, 16, c === '#ffffff' ? '#f2e6c9' : c);
    r(8, 17, 6, 5, K); r(9, 18, 4, 3, o.v ? '#ffe14a' : '#9ccbff');              // finestra (accesa?)
    r(17, 19, 6, 10, K); r(18, 20, 4, 9, '#8a5a2c'); p(21, 24, '#ffd23b');       // porta
    r(20, 2, 4, 6, K); r(21, 3, 2, 5, '#9aa0ad');                                // camino
  });
  def('fence', 24, 9, {}, () => {
    for (let x = 0; x < 24; x += 6) { r(x + 1, 0, 3, 9, K); r(x + 2, 1, 1, 8, '#f2e6c9'); }
    r(0, 3, 24, 2, '#f2e6c9'); r(0, 6, 24, 1, '#c9b89a');
  });
  def('cat', 12, 9, { flip: true, color: true, vary: true }, (o, c, d) => {
    const fur = c === '#ffffff' ? '#ffffff' : (c === '#ffd23b' || c === '#ff9c3b' ? c : '#6b6f7a');
    r(0, 3, 9, 5, K); r(1, 4, 7, 3, fur); r(7, 0, 5, 6, K); r(8, 1, 3, 4, fur); p(8, 0, K); p(10, 0, K);
    p(9, 2, '#3fe05a'); r(1, 7, 1, 2, K); r(6, 7, 1, 2, K);
    if (o.v) { r(0, 1, 1, 3, K); } // coda alzata
  });
  def('dog', 13, 10, { flip: true, vary: true }, (o) => {
    r(0, 3, 10, 5, K); r(1, 4, 8, 3, '#c98a4a'); r(8, 0, 5, 6, K); r(9, 1, 3, 4, '#c98a4a'); r(12, 3, 1, 1, K);
    p(10, 2, K); r(1, 8, 1, 2, K); r(7, 8, 1, 2, K); r(0, 2, 1, 2, K);
    if (o.v) { r(8, 6, 3, 1, '#ff3b3b'); }   // collare
  });
  def('car', 26, 14, { flip: true, color: true, vary: true }, (o, c, d) => {
    r(5, 1, 14, 6, K); r(6, 2, 12, 5, c); r(8, 3, 4, 3, '#9ccbff'); r(13, 3, 4, 3, '#9ccbff');
    r(0, 6, 26, 6, K); r(1, 7, 24, 4, c); r(1, 10, 24, 1, d);
    disc(6, 12, 2, K); disc(20, 12, 2, K); p(6, 12, '#9aa0ad'); p(20, 12, '#9aa0ad');
    p(24, 8, o.v ? '#ffe14a' : '#ffffff');   // faro
  });
  def('person', 7, 16, { color: true, vary: true, flip: true }, (o, c, d) => {
    r(1, 0, 5, 5, K); r(2, 1, 3, 3, '#ffc690'); r(1, 5, 5, 6, K); r(2, 6, 3, 4, c);
    r(1, 11, 2, 5, K); r(4, 11, 2, 5, K); p(4, 2, K);
    if (o.v) r(1, 0, 5, 1, '#5a3a22');   // capelli/cappello
  });
  def('lamp', 7, 26, { vary: true }, (o) => {
    r(3, 4, 1, 22, K); r(1, 0, 5, 4, K); r(2, 1, 3, 2, o.v ? '#ffe14a' : '#6b6f7a'); r(1, 25, 5, 1, K);
  });
  def('bench', 18, 8, {}, () => { r(0, 2, 18, 2, K); r(1, 2, 16, 1, '#c98a4a'); r(0, 5, 18, 2, K); r(1, 5, 16, 1, '#c98a4a'); r(2, 7, 1, 1, K); r(15, 7, 1, 1, K); });
  def('building', 34, 70, { color: true, vary: true }, (o, c, d) => {
    const col = c === '#ffffff' ? '#c9ccd4' : d;
    r(0, 0, 34, 70, K); r(1, 1, 32, 69, col);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
      const sd = o.s || 0;
      // la variante accende/spegne UNA sola finestra
      const lit = (((x * 7 + y * 3 + sd) % 5) < 2) !== (!!o.v && x === sd % 4 && y === 2 + (sd % 4));
      r(4 + x * 7, 5 + y * 8, 4, 5, lit ? '#ffe14a' : '#1a2350');
    }
  });
  def('traffic', 6, 24, { vary: true }, (o) => {
    r(2, 10, 2, 14, K); r(0, 0, 6, 11, K);
    p(2, 2, !o.v ? '#ff3b3b' : '#3a1010'); p(3, 2, !o.v ? '#ff3b3b' : '#3a1010');
    r(2, 7, 2, 2, o.v ? '#3fe05a' : '#103a10');
  });
  // fattoria
  def('barn', 40, 34, { color: true, vary: true, flip: true }, (o, c, d) => {
    const col = c === '#ffffff' ? '#ff3b3b' : c;
    for (let i = 0; i < 10; i++) r(10 - i, 10 - i, 20 + i * 2, 1, K);
    r(0, 10, 40, 24, K); r(1, 11, 38, 22, col);
    for (let i = 0; i < 9; i++) r(11 - i, 10 - i, 18 + i * 2, 1, DARK[col] || '#a3172a');
    r(14, 18, 12, 15, '#f2e6c9'); r(15, 19, 10, 14, DARK[col] || '#a3172a');
    for (let i = 0; i < 10; i++) { p(15 + i, 19 + Math.round(i * 1.4), '#f2e6c9'); p(24 - i, 19 + Math.round(i * 1.4), '#f2e6c9'); }
    r(17, 4, 6, 5, '#f2e6c9'); r(18, 5, 4, 3, o.v ? '#ffe14a' : K);
  });
  def('cow', 22, 14, { flip: true, vary: true }, (o) => {
    r(2, 2, 15, 8, K); r(3, 3, 13, 6, '#ffffff'); r(5, 4, 3, 3, K); r(11, 5, 3, 2, K);
    if (o.v) r(8, 3, 2, 2, K);
    r(16, 0, 6, 7, K); r(17, 1, 4, 5, '#ffffff'); r(18, 4, 3, 2, '#ff9cb8'); p(17, 0, '#c9b89a'); p(21, 0, '#c9b89a');
    r(3, 10, 2, 4, K); r(13, 10, 2, 4, K); r(0, 3, 2, 1, K);
  });
  def('sheep', 14, 11, { flip: true, vary: true }, (o) => {
    disc(6, 5, 5, K); disc(6, 5, 4, '#ffffff'); r(10, 2, 4, 5, K); r(11, 3, 2, 3, '#3a3d48');
    r(3, 9, 1, 2, K); r(8, 9, 1, 2, K);
    if (o.v) p(6, 3, '#ff7ab8');
  });
  def('chicken', 9, 9, { flip: true, color: true }, (o, c) => {
    const col = c === '#ffd23b' || c === '#ffffff' ? c : '#ffffff';
    r(1, 3, 6, 4, K); r(2, 4, 4, 2, col); r(5, 0, 4, 4, K); r(6, 1, 2, 2, col); p(8, 2, '#ff9c3b'); p(6, 0, '#ff3b3b');
    r(3, 7, 1, 2, '#ff9c3b'); r(5, 7, 1, 2, '#ff9c3b');
  });
  def('tractor', 28, 20, { flip: true, color: true, vary: true }, (o, c, d) => {
    r(4, 6, 18, 8, K); r(5, 7, 16, 6, c); r(14, 0, 8, 8, K); r(15, 1, 6, 6, '#9ccbff');
    r(2, 4, 2, 6, K); if (o.v) r(1, 0, 3, 4, '#6b6f7a');   // fumo
    disc(18, 14, 5, K); disc(18, 14, 3, '#3a3d48'); disc(6, 16, 3, K); disc(6, 16, 1, '#3a3d48');
  });
  def('hay', 16, 12, { vary: true }, (o) => {
    r(0, 0, 16, 12, K); r(1, 1, 14, 10, '#e8c040'); r(1, 1, 14, 2, '#fff1a0');
    for (let x = 3; x < 15; x += 3) r(x, 3, 1, 8, '#c29a2a');
    if (o.v) r(0, 5, 16, 1, '#8a5a2c');
  });
  def('scarecrow', 18, 26, { color: true, vary: true }, (o, c) => {
    r(8, 6, 2, 20, '#8a5a2c'); r(0, 9, 18, 2, '#8a5a2c');
    r(5, 9, 8, 9, K); r(6, 10, 6, 7, c);
    disc(9, 4, 3, K); disc(9, 4, 2, '#e8c040'); r(4, 0, 10, 2, K); r(6, 0, 6, 1, '#5a3a22');
    if (o.v) { p(8, 4, K); p(10, 4, K); }
  });
  // spiaggia
  def('umbrella', 26, 26, { color: true, vary: true }, (o, c, d) => {
    for (let i = 0; i < 6; i++) r(12 - i * 2, i, 3 + i * 4, 1, K);
    for (let i = 0; i < 26; i += 6) r(i, 6, 3, 2, c);
    for (let i = 1; i < 6; i++) for (let x = 13 - i * 2; x < 12 + i * 2; x++) p(x, i, Math.floor(x / 4) % 2 ? c : (o.v ? '#ffd23b' : '#ffffff'));
    r(12, 6, 2, 20, K);
  });
  def('palm', 24, 34, { flip: true, vary: true }, (o) => {
    for (let y = 10; y < 34; y++) r(11 + Math.round((y - 10) / 8), y, 3, 1, (y % 3) ? '#8a5a2c' : '#5a3a22');
    for (let i = 0; i < 10; i++) { r(11 - i, 6 + Math.round(i * 0.5), 2, 2, '#2f7a24'); r(13 + i, 6 + Math.round(i * 0.5), 2, 2, '#2f7a24'); r(12 - i * 0.6, 4 - Math.round(i * 0.3), 2, 2, '#46a336'); }
    if (o.v) { disc(12, 10, 1, '#5a3a22'); disc(15, 10, 1, '#5a3a22'); }    // noci di cocco
  });
  def('crab', 12, 8, { color: true, vary: true }, (o, c) => {
    const col = c === '#ffffff' ? '#ff3b3b' : c;
    r(2, 3, 8, 4, K); r(3, 4, 6, 2, col); p(4, 2, K); p(7, 2, K);
    r(0, 1, 2, 2, col); r(10, 1, 2, 2, col); p(2, 7, K); p(9, 7, K);
    if (o.v) { r(0, 0, 1, 1, K); }
  });
  def('castle', 22, 18, { vary: true, color: true }, (o, c) => {
    r(2, 6, 18, 12, K); r(3, 7, 16, 11, '#e8c983'); r(0, 2, 6, 16, K); r(1, 3, 4, 15, '#e8c983'); r(16, 2, 6, 16, K); r(17, 3, 4, 15, '#e8c983');
    r(9, 12, 4, 6, '#8a6a42'); r(19, -4, 1, 6, K); r(20, -4, 3, 2, c);
    if (o.v) r(2, -3, 1, 5, K);
  });
  def('ball', 9, 9, { color: true }, (o, c) => { disc(4, 4, 4, K); disc(4, 4, 3, '#ffffff'); r(1, 3, 7, 2, c); p(4, 1, c); p(4, 7, c); });
  def('towel', 22, 8, { color: true, vary: true }, (o, c, d) => {
    r(0, 0, 22, 8, K); r(1, 1, 20, 6, c); for (let x = 3; x < 21; x += 4) r(x, 1, 2, 6, o.v ? '#ffffff' : d);
  });
  def('boat', 26, 24, { flip: true, color: true, vary: true }, (o, c) => {
    r(12, 0, 1, 18, K);
    for (let i = 0; i < 14; i++) r(13, 1 + i, Math.round(i * 0.8), 1, c);
    r(2, 18, 22, 5, K); r(4, 19, 18, 3, '#8a5a2c');
    if (o.v) r(10, 0, 2, 2, '#ff3b3b');
  });
  def('starfish', 9, 9, { color: true }, (o, c) => { p(4, 0, c); r(0, 3, 9, 2, c); r(3, 1, 3, 6, c); p(1, 8, c); p(7, 8, c); r(2, 6, 1, 2, c); r(6, 6, 1, 2, c); p(4, 4, K); });

  // ------------------------------------------------------------------
  // Temi: sfondo + oggetti tipici
  // ------------------------------------------------------------------
  const THEMES = {
    farm: {
      name: 'LA FATTORIA',
      sky: ['#5fb8ff', '#8fd0ff'], ground: '#5fb83a', groundY: 92, groundDetail: '#4ea52f',
      skyObjs: ['cloud', 'cloud', 'cloud', 'sun', 'bird', 'bird', 'bird', 'balloon'],
      bigObjs: ['barn', 'house', 'tree', 'tree', 'pine', 'tractor', 'scarecrow'],
      smallObjs: ['cow', 'cow', 'sheep', 'sheep', 'sheep', 'chicken', 'chicken', 'hay', 'flower', 'flower', 'flower', 'bush', 'dog', 'cat', 'fence', 'fence', 'person'],
    },
    beach: {
      name: 'LA SPIAGGIA',
      sky: ['#5fd0ff', '#a6e8ff'], ground: '#f2d68a', groundY: 100, sea: '#2f8bff', seaY: 78, groundDetail: '#e0c070',
      skyObjs: ['cloud', 'cloud', 'sun', 'bird', 'bird', 'bird', 'balloon'],
      bigObjs: ['palm', 'palm', 'umbrella', 'umbrella', 'umbrella', 'boat', 'castle'],
      smallObjs: ['crab', 'crab', 'ball', 'ball', 'towel', 'towel', 'starfish', 'starfish', 'person', 'person', 'person', 'dog', 'castle', 'flower'],
    },
    city: {
      name: 'LA CITTA DI NOTTE',
      sky: ['#1a2350', '#2a3570'], ground: '#5d5f6b', groundY: 118, groundDetail: '#4a4c57', night: true,
      skyObjs: ['moon', 'star', 'star', 'star', 'star', 'star', 'cloud', 'balloon'],
      bigObjs: ['building', 'building', 'building', 'building', 'building', 'building', 'building'],
      smallObjs: ['car', 'car', 'car', 'lamp', 'lamp', 'lamp', 'person', 'person', 'person', 'person', 'cat', 'dog', 'tree', 'bench', 'traffic', 'bush'],
    },
  };

  function overlaps(a, list, pad) {
    const ta = T[a.k];
    for (const b of list) {
      const tb = T[b.k];
      if (a.x < b.x + tb.w + pad && a.x + ta.w + pad > b.x && a.y < b.y + tb.h + pad && a.y + ta.h + pad > b.y) return true;
    }
    return false;
  }

  function generate(themeName) {
    const name = themeName || pick(Object.keys(THEMES));
    const th = THEMES[name];
    const objs = [];
    const add = (k, x, y, extra) => {
      const t = T[k];
      const o = Object.assign({ k, x: Math.round(x), y: Math.round(y), c: t.color ? rnd(0, COLS.length - 1) : 0, f: t.flip && Math.random() < 0.5 ? 1 : 0, v: t.vary && Math.random() < 0.5 ? 1 : 0, s: rnd(0, 9) }, extra || {});
      objs.push(o);
      return o;
    };
    const tryPlace = (k, yMin, yMax, pad, list) => {
      const t = T[k];
      for (let i = 0; i < 40; i++) {
        const o = { k, x: rnd(2, SW - t.w - 2), y: rnd(yMin, Math.max(yMin, yMax - t.h)) };
        if (!overlaps(o, list, pad)) { return add(k, o.x, o.y); }
      }
      return null;
    };
    const sky = [], big = [], small = [];
    // cielo
    for (let i = 0; i < 7; i++) { const o = tryPlace(pick(th.skyObjs), 3, th.night ? 60 : (th.seaY || th.groundY) - 14, 4, sky); if (o) sky.push(o); }
    // oggetti grandi appoggiati sull'orizzonte
    if (name === 'city') {
      let x = 2;
      while (x < SW - 30) {
        const h = rnd(40, 70);
        const o = add('building', x, th.groundY - h, {});
        o.y = th.groundY - 70 + (70 - h);   // altezze diverse: il palazzo "esce" dal suolo
        x += 36 + rnd(0, 8);
        big.push(o);
      }
    } else {
      for (let i = 0; i < 5; i++) {
        const k = pick(th.bigObjs);
        const t = T[k];
        const o = tryPlace(k, th.groundY - t.h + 6, th.groundY + 12, 3, big);
        if (o) big.push(o);
      }
    }
    // tanti oggetti piccoli sul terreno
    const groundTop = name === 'city' ? th.groundY + 2 : th.groundY + 8;
    for (let i = 0; i < 26; i++) {
      const o = tryPlace(pick(th.smallObjs), groundTop, SH - 2, 3, big.concat(small));
      if (o) small.push(o);
    }
    // ordine di disegno: dall'alto in basso (gli oggetti più in basso stanno davanti)
    const list = sky.concat(big, small.sort((a, b) => (a.y + T[a.k].h) - (b.y + T[b.k].h)));
    return { theme: name, objs: list };
  }

  // ------------------------------------------------------------------
  // Differenze
  // ------------------------------------------------------------------
  /** Zona da toccare per una differenza: cerchio + rettangolo dell'oggetto */
  function center(o) {
    const t = T[o.k];
    return { x: o.x + t.w / 2, y: o.y + t.h / 2, r: Math.max(10, Math.min(18, Math.max(t.w, t.h) / 2 + 3)), bx: o.x - 3, by: o.y - 3, bw: t.w + 6, bh: t.h + 6 };
  }
  /** Il tocco (x, y) colpisce la differenza d? */
  function hits(d, x, y) {
    return Math.hypot(x - d.x, y - d.y) <= d.r || (x >= d.bx && x <= d.bx + d.bw && y >= d.by && y <= d.by + d.bh);
  }

  /**
   * Crea N differenze: restituisce la lista di oggetti modificata (per i telefoni)
   * e l'elenco delle differenze {x, y, r, kind} per controllare i tocchi.
   */
  function makeDiffs(objs, n, themeName) {
    const out = objs.map((o) => Object.assign({}, o));
    const diffs = [];
    const far = (c) => diffs.every((d) => Math.hypot(d.x - c.x, d.y - c.y) > 22);
    const order = out.map((_, i) => i).sort(() => Math.random() - 0.5);
    for (const i of order) {
      if (diffs.length >= n) break;
      const o = out[i];
      const t = T[o.k];
      const c = center(o);
      if (!far(c)) continue;
      // oggetti minuscoli: al massimo 2 differenze, se no diventa impossibile
      const tiny = t.w * t.h < 70;
      if (tiny && diffs.filter((d) => d.tiny).length >= 2) continue;
      c.tiny = tiny;
      const kinds = [];
      if (t.color) kinds.push('color', 'color');
      if (t.vary) kinds.push('vary', 'vary');
      if (t.flip) kinds.push('flip');
      if (o.k !== 'building' && t.w < 30) kinds.push('remove');
      if (!kinds.length) continue;
      const kind = pick(kinds);
      if (kind === 'color') { let nc; do { nc = rnd(0, COLS.length - 1); } while (nc === o.c); o.c = nc; }
      else if (kind === 'vary') {
        o.v = o.v ? 0 : 1;
        if (o.k === 'building') {   // cambia una sola finestra: la zona è solo quella
          const sd = o.s || 0;
          const wx = o.x + 4 + (sd % 4) * 7 + 2, wy = o.y + 5 + (2 + sd % 4) * 8 + 2;
          diffs.push({ x: wx, y: wy, r: 10, bx: wx - 6, by: wy - 6, bw: 12, bh: 12, kind });
          continue;
        }
      }
      else if (kind === 'flip') o.f = o.f ? 0 : 1;
      else if (kind === 'remove') o.hide = 1;
      diffs.push(Object.assign(c, { kind }));
    }
    // se non bastano, aggiungiamo piccoli oggetti nuovi (fiore, stella, uccellino)
    const th = THEMES[themeName] || THEMES.farm;
    for (let tries = 0; diffs.length < n && tries < 200; tries++) {
      const k = th.night ? pick(['cat', 'balloon', 'bush']) : pick(['bush', 'ball', 'cat', 'balloon', 'crab']);
      const t = T[k];
      const o = { k, x: rnd(4, SW - t.w - 4), y: rnd(8, SH - t.h - 4), c: rnd(0, COLS.length - 1), f: 0, v: 0, s: 0, extra: 1 };
      const cc = center(o);
      if (!far(cc) || overlaps(o, out.filter((q) => !q.hide), 2)) continue;
      out.push(o);
      diffs.push(Object.assign(cc, { kind: 'add' }));
    }
    return { objs: out, diffs };
  }

  // ------------------------------------------------------------------
  // Disegno
  // ------------------------------------------------------------------
  function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

  function drawBackground(theme) {
    const th = THEMES[theme];
    const horizon = th.seaY || th.groundY;
    for (let y = 0; y < horizon; y++) { g.fillStyle = y < horizon / 2 ? th.sky[0] : th.sky[1]; g.fillRect(OX, OY + y, SW, 1); }
    if (th.sea) {
      g.fillStyle = th.sea; g.fillRect(OX, OY + th.seaY, SW, th.groundY - th.seaY);
      for (let x = 0; x < SW; x += 9) { g.fillStyle = '#9ccbff'; g.fillRect(OX + x + ((x / 9) % 2) * 4, OY + th.seaY + 4 + ((x / 9) % 3) * 5, 4, 1); }
      g.fillStyle = '#ffffff'; g.fillRect(OX, OY + th.groundY - 1, SW, 1);
    }
    g.fillStyle = th.ground; g.fillRect(OX, OY + th.groundY, SW, SH - th.groundY);
    for (let i = 0; i < 160; i++) {
      const x = Math.floor(hash(i, 1) * SW), y = th.groundY + 2 + Math.floor(hash(i, 2) * (SH - th.groundY - 2));
      g.fillStyle = th.groundDetail; g.fillRect(OX + x, OY + y, 2, 1);
    }
    if (theme === 'city') {   // strada con strisce
      g.fillStyle = '#3a3d48'; g.fillRect(OX, OY + 140, SW, 22);
      g.fillStyle = '#ffffff'; for (let x = 4; x < SW; x += 20) g.fillRect(OX + x, OY + 150, 10, 2);
    }
  }

  function drawObj(o) {
    if (o.hide) return;
    const t = T[o.k];
    if (!t) return;
    FLIP = !!o.f && !!t.flip; FX = o.x; FY = o.y; FW = t.w;
    const col = COLS[o.c] || COLS[0];
    t.draw(o, col, DARK[col] || K);
    FLIP = false; FX = 0; FY = 0;
  }

  /** Disegna la scena (320x180) nel contesto, con l'angolo in alto a sinistra in (ox, oy) */
  function draw(ctx, scene, ox, oy) {
    g = ctx; OX = ox || 0; OY = oy || 0;
    g.save();
    g.beginPath(); g.rect(OX, OY, SW, SH); g.clip();
    drawBackground(scene.theme);
    for (const o of scene.objs) drawObj(o);
    g.restore();
  }

  window.DiffScene = { generate, makeDiffs, draw, hits, SW, SH, THEMES };
})();
