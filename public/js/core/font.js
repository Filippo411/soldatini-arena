/**
 * Font bitmap 5x7 disegnato a mano (pixel perfetti, nessun file esterno).
 * PixelFont.draw(ctx, testo, x, y, { color, scale, align, outline, shadow })
 * I testi vengono messi in cache come piccoli canvas per non ridisegnarli
 * pixel per pixel a ogni fotogramma.
 */
(function () {
  'use strict';

  // Ogni glifo: 7 righe da 5 caratteri ('#' = pixel acceso)
  const G = {
    A: '.###.|#...#|#...#|#####|#...#|#...#|#...#',
    B: '####.|#...#|#...#|####.|#...#|#...#|####.',
    C: '.###.|#...#|#....|#....|#....|#...#|.###.',
    D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
    E: '#####|#....|#....|####.|#....|#....|#####',
    F: '#####|#....|#....|####.|#....|#....|#....',
    G: '.###.|#...#|#....|#.###|#...#|#...#|.####',
    H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
    I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
    J: '..###|...#.|...#.|...#.|#..#.|#..#.|.##..',
    K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
    L: '#....|#....|#....|#....|#....|#....|#####',
    M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
    N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
    O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
    P: '####.|#...#|#...#|####.|#....|#....|#....',
    Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
    R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
    S: '.####|#....|#....|.###.|....#|....#|####.',
    T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
    U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
    V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
    W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.',
    X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
    Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
    Z: '#####|....#|...#.|..#..|.#...|#....|#####',
    0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
    1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
    2: '.###.|#...#|....#|...#.|..#..|.#...|#####',
    3: '####.|....#|....#|.###.|....#|....#|####.',
    4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
    5: '#####|#....|####.|....#|....#|#...#|.###.',
    6: '.###.|#....|#....|####.|#...#|#...#|.###.',
    7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
    8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
    9: '.###.|#...#|#...#|.####|....#|....#|.###.',
    '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..',
    '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
    '.': '.....|.....|.....|.....|.....|.....|..#..',
    ',': '.....|.....|.....|.....|.....|..#..|.#...',
    ':': '.....|..#..|.....|.....|.....|..#..|.....',
    '-': '.....|.....|.....|.###.|.....|.....|.....',
    '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
    '/': '....#|...#.|...#.|..#..|.#...|.#...|#....',
    "'": '..#..|..#..|.....|.....|.....|.....|.....',
    '>': '.#...|..#..|...#.|....#|...#.|..#..|.#...',
    '<': '...#.|..#..|.#...|#....|.#...|..#..|...#.',
    '=': '.....|.....|#####|.....|#####|.....|.....',
    '_': '.....|.....|.....|.....|.....|.....|#####',
    '#': '.#.#.|#####|.#.#.|.#.#.|.#.#.|#####|.#.#.',
    '*': '.....|#.#.#|.###.|#####|.###.|#.#.#|.....',
    '%': '##..#|##.#.|...#.|..#..|.#...|.#.##|#..##',
    '€': '..###|.#...|####.|.#...|####.|.#...|..###',
    '(': '...#.|..#..|.#...|.#...|.#...|..#..|...#.',
    ')': '.#...|..#..|...#.|...#.|...#.|..#..|.#...',
    '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#',
    x: '.....|.....|#...#|.#.#.|..#..|.#.#.|#...#', // "x" minuscola per "x10"
    ' ': '.....|.....|.....|.....|.....|.....|.....',
  };
  const GLYPHS = {};
  for (const k in G) GLYPHS[k] = G[k].split('|');

  const ACCENTS = { 'À': 'A', 'È': 'E', 'É': 'E', 'Ì': 'I', 'Ò': 'O', 'Ù': 'U' };

  /** Normalizza il testo: maiuscolo, niente accenti, caratteri sconosciuti -> spazio. */
  function norm(text) {
    let out = '';
    for (const ch0 of String(text)) {
      if (ch0 === 'x') { out += 'x'; continue; }
      let ch = ch0.toUpperCase();
      ch = ACCENTS[ch] || ch;
      out += GLYPHS[ch] ? ch : ' ';
    }
    return out;
  }

  const ADV = 6; // avanzamento orizzontale per carattere (5 + 1 di spazio)
  function width(text, scale) { const t = norm(text); return (t.length * ADV - 1) * (scale || 1); }

  const cache = new Map();

  function render(text, color, scale, outline, shadow) {
    const t = norm(text);
    const key = t + '|' + color + '|' + scale + '|' + outline + '|' + shadow;
    let c = cache.get(key);
    if (c) return c;
    if (cache.size > 400) cache.clear();

    const pad = (outline ? 1 : 0) * scale;
    const sh = shadow ? scale : 0;
    c = document.createElement('canvas');
    c.width = Math.max(1, (t.length * ADV - 1) * scale + pad * 2 + sh);
    c.height = 7 * scale + pad * 2 + sh;
    const g = c.getContext('2d');

    const plot = (ox, oy, col) => {
      g.fillStyle = col;
      for (let i = 0; i < t.length; i++) {
        const rows = GLYPHS[t[i]];
        for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) {
          if (rows[y][x] === '#') g.fillRect(ox + (i * ADV + x) * scale, oy + y * scale, scale, scale);
        }
      }
    };
    if (shadow) {
      if (outline) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) plot(pad + sh + dx * scale, pad + sh + dy * scale, shadow);
      else plot(pad + sh, pad + sh, shadow);
    }
    if (outline) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (dx || dy) plot(pad + dx * scale, pad + dy * scale, outline);
      }
    }
    plot(pad, pad, color);
    cache.set(key, c);
    return c;
  }

  /**
   * opts: color (default bianco), scale (1), align ('left'|'center'|'right'),
   *       outline (colore contorno o null), shadow (colore ombra o null)
   */
  function draw(ctx, text, x, y, opts) {
    opts = opts || {};
    const scale = opts.scale || 1;
    const outline = opts.outline === undefined ? '#1b1b26' : opts.outline;
    const c = render(text, opts.color || '#ffffff', scale, outline, opts.shadow || null);
    const pad = outline ? scale : 0;
    let dx = Math.round(x) - pad;
    if (opts.align === 'center') dx = Math.round(x - (c.width - (opts.shadow ? scale : 0)) / 2);
    else if (opts.align === 'right') dx = Math.round(x - c.width + pad + (opts.shadow ? scale : 0));
    ctx.drawImage(c, dx, Math.round(y) - pad);
  }

  window.PixelFont = { draw, width, norm };
})();
