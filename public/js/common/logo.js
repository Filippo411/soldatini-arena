/**
 * Logo animato "PIPPO GAME ROOM":
 *   - PIPPO fatto di blocchi in stile Tetris, che cadono dall'alto e si incastrano
 *   - GAME ROOM in font 8-bit appena sotto
 * Disegnato pixel per pixel su un canvas piccolo, ingrandito via CSS (pixelated).
 *
 *   Logo.mount(document.getElementById('logo'));
 */
(function () {
  'use strict';

  const B = 8;                       // lato di un blocco, in pixel
  const W = 200, H = 68;             // dimensioni del canvas
  const INK = '#1b1b26';

  // Lettere su griglia di blocchi (5 righe)
  const LETTERS = {
    P: ['####', '#..#', '####', '#...', '#...'],
    I: ['###', '.#.', '.#.', '.#.', '###'],
    O: ['####', '#..#', '#..#', '#..#', '####'],
  };
  const WORD = 'PIPPO';
  // Colori classici dei "tetramini": [base, chiaro, scuro]
  const COLORS = [
    ['#f03c3c', '#ff9c8a', '#a3172a'], // rosso
    ['#3cd8f0', '#b8f6ff', '#1d8fc9'], // ciano
    ['#ffd23b', '#fff1a0', '#c27a12'], // giallo
    ['#3fe05a', '#a6ffad', '#16843a'], // verde
    ['#b04cf0', '#e2b0ff', '#6a1fa3'], // viola
  ];

  /** Elenco dei blocchi finali {x, y, color} */
  function buildBlocks() {
    const blocks = [];
    const totalW = WORD.split('').reduce((w, ch) => w + LETTERS[ch][0].length, 0) + WORD.length - 1;
    let ox = Math.floor((W - totalW * B) / 2);
    WORD.split('').forEach((ch, li) => {
      const rows = LETTERS[ch];
      rows.forEach((row, ry) => [...row].forEach((c, rx) => {
        if (c === '#') blocks.push({ x: ox + rx * B, y: 2 + ry * B, col: COLORS[li % COLORS.length], letter: li, row: ry });
      }));
      ox += (rows[0].length + 1) * B;
    });
    return blocks;
  }

  function drawBlock(g, x, y, col, flash) {
    x = Math.round(x); y = Math.round(y);
    const [base, light, dark] = flash ? ['#ffffff', '#ffffff', '#d6d6e0'] : col;
    g.fillStyle = INK; g.fillRect(x, y, B, B);
    g.fillStyle = dark; g.fillRect(x, y, B - 1, B - 1);
    g.fillStyle = base; g.fillRect(x, y, B - 2, B - 2);
    g.fillStyle = light; g.fillRect(x, y, B - 2, 1); g.fillRect(x, y, 1, B - 2);
    g.fillStyle = '#ffffff'; g.fillRect(x + 1, y + 1, 1, 1);   // riflesso
    g.fillStyle = dark; g.fillRect(x + 3, y + 3, 2, 2);        // incavo centrale
    g.fillStyle = light; g.fillRect(x + 3, y + 3, 1, 1);
  }

  function mount(canvas, opts) {
    opts = opts || {};
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    const blocks = buildBlocks();

    // Ordine di caduta: lettera per lettera, dal basso verso l'alto (come un vero Tetris)
    blocks.forEach((b) => {
      b.delay = opts.animate === false ? 0 : b.letter * 0.32 + (4 - b.row) * 0.06 + Math.random() * 0.05;
    });
    const FALL = 0.35;   // durata della caduta di un blocco
    const start = performance.now();
    let flashRow = -1, flashUntil = 0, nextFlash = 3;

    function frame(now) {
      const t = (now - start) / 1000;
      g.clearRect(0, 0, W, H);

      // ogni tanto una riga lampeggia come una "linea completata"
      if (t > nextFlash) {
        flashRow = Math.floor(Math.random() * 5);
        flashUntil = t + 0.35;
        nextFlash = t + 4 + Math.random() * 4;
      }

      let allLanded = true;
      for (const b of blocks) {
        const k = (t - b.delay) / FALL;
        if (k <= 0) { allLanded = false; continue; }
        let y = b.y;
        if (k < 1) {
          allLanded = false;
          y = -B + (b.y + B) * k * k;      // accelera cadendo
        }
        const flash = t < flashUntil && b.row === flashRow && Math.floor(t * 16) % 2 === 0;
        drawBlock(g, b.x, y, b.col, flash);
      }

      // GAME ROOM in 8-bit, compare quando i blocchi sono atterrati
      const lastDelay = Math.max(...blocks.map((b) => b.delay)) + FALL;
      if (window.PixelFont && t > lastDelay - 0.1) {
        const blink = t < lastDelay + 0.5 && Math.floor(t * 12) % 2;
        if (!blink) {
          // ombra rossa spostata in basso a destra, poi la scritta bianca con bordo scuro
          PixelFont.draw(g, 'GAME ROOM', W / 2 + 2, 51, { color: '#a3172a', scale: 2, align: 'center', outline: INK });
          PixelFont.draw(g, 'GAME ROOM', W / 2, 49, { color: '#ffffff', scale: 2, align: 'center', outline: INK });
        }
      }

      if (!allLanded || t < lastDelay + 1 || opts.loop !== false) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  window.Logo = { mount };
})();
