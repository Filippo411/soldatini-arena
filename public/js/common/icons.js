/**
 * Icone pixel art condivise tra schermo host e telefono.
 * Ogni icona è una griglia di caratteri: ogni carattere è un colore
 * della palette PAL ('.' = trasparente).
 */
(function () {
  'use strict';

  const PAL = {
    k: '#1b1b26', // contorno quasi nero
    w: '#ffffff',
    y: '#ffe14a', // giallo
    Y: '#f39b1d', // arancio
    g: '#6fae3a', // verde granata
    G: '#3d6b22',
    c: '#5ff2ff', // ciano scudo
    C: '#1d8fc9',
    b: '#d9a441', // ottone proiettile
    B: '#8c5a1c',
    o: '#7a8a3a', // verde militare cassa
    O: '#4d5a22',
    r: '#e8423b',
    s: '#b9bcc4', // metallo
    S: '#6b6f7a',
  };

  const ICONS = {
    // Fulmine (Flash)
    flash: [
      '....kkkk.',
      '...kyyyk.',
      '..kyyyk..',
      '.kyyyykkk',
      'kyyyyyyyk',
      'kkkyyyyk.',
      '..kyyyk..',
      '.kyyk....',
      '.kkk.....',
    ],
    // Granata ad ananas
    grenade: [
      '...kkk...',
      '..ksSskk.',
      '..kkkkk.k',
      '.kggggk.k',
      'kgGgGgGk.',
      'kggggggk.',
      'kgGgGgGk.',
      '.kggggk..',
      '..kkkk...',
    ],
    // Scudo
    shield: [
      'kkkkkkkkk',
      'kcccwcccC',
      'kccwccccC',
      'kcwcccccC',
      'kcccccccC',
      '.kcccccC.',
      '.kCccccC.',
      '..kCccC..',
      '...kCk...',
    ],
    // Cassa munizioni
    ammo: [
      '.kkkkkkk.',
      'kbBkbBkbk',
      'kbBkbBkbk',
      'kkkkkkkkk',
      'kooooooOk',
      'koyyyyyOk',
      'kooooooOk',
      'kOOOOOOOk',
      '.kkkkkkk.',
    ],
    // Proiettile singolo (per il conteggio munizioni)
    bullet: [
      '.y.',
      'kbk',
      'kbk',
      'kBk',
      'kkk',
    ],
    // Pecorella (Holy Sheep)
    sheep: [
      '..kkkkk....',
      '.kwwswwkk..',
      'kwwwwwwwkkk',
      'kwswwwswkSk',
      'kwwwwwwwkwk',
      'kwwwswwwkkk',
      '.kkkkkkkk..',
      '..kS..kS...',
      '..kk..kk...',
    ],
    // Teschio (eliminazioni)
    skull: [
      '.kkkkk.',
      'kwwwwwk',
      'kwkwkwk',
      'kwwwwwk',
      '.kwkwk.',
      '..kkk..',
    ],
  };

  /** Disegna un'icona su un contesto 2D in (x,y) con fattore di scala. */
  function drawIcon(ctx, name, x, y, scale, colorOverride) {
    const rows = ICONS[name];
    if (!rows) return;
    scale = scale || 1;
    for (let j = 0; j < rows.length; j++) {
      for (let i = 0; i < rows[j].length; i++) {
        const ch = rows[j][i];
        if (ch === '.') continue;
        ctx.fillStyle = colorOverride ? (ch === 'k' ? PAL.k : colorOverride) : PAL[ch];
        ctx.fillRect(x + i * scale, y + j * scale, scale, scale);
      }
    }
  }

  window.Icons = { ICONS, PAL, drawIcon };
})();
