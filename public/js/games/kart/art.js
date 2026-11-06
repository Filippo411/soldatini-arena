/**
 * PIPPO KART — sprite in pixel art: kart (4 viste) con il pilota, decorazioni a bordo pista.
 */
(function () {
  'use strict';
  const K = '#1b1b26';

  function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /**
   * Kart 24x18 visto da: 'back' (da dietro), 'front', 'left' (muso a sinistra), 'right'.
   * colore = colore del giocatore, char = pilota (testa disegnata sopra)
   */
  function buildKart(color, dark, charId) {
    const ch = KartChars.get(charId);
    const views = {};
    for (const view of ['back', 'front', 'left', 'right']) {
      const c = cv(24, 18);
      const g = c.getContext('2d');
      const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
      if (view === 'back' || view === 'front') {
        // gomme
        r(0, 10, 6, 8, K); r(1, 11, 4, 6, '#3a3d48'); r(18, 10, 6, 8, K); r(19, 11, 4, 6, '#3a3d48');
        // scocca
        r(4, 9, 16, 7, K); r(5, 10, 14, 5, color); r(5, 14, 14, 1, dark);
        if (view === 'back') {
          r(3, 7, 18, 3, K); r(4, 8, 16, 1, color);           // alettone
          r(9, 15, 2, 2, '#6b6f7a'); r(13, 15, 2, 2, '#6b6f7a'); // scarichi
        } else {
          r(6, 15, 12, 2, K); r(7, 15, 10, 1, '#ffffff');       // muso / numero
          r(8, 11, 2, 2, '#ffe14a'); r(14, 11, 2, 2, '#ffe14a'); // fari
        }
        // pilota
        g.save(); g.translate(7, 1);
        KartChars.drawRows(g, ch.back, ch.pal, 0, 0, 1);
        g.restore();
        if (view === 'front') { r(9, 4, 6, 3, ch.pal.s || '#f2c49a'); r(10, 5, 1, 1, K); r(13, 5, 1, 1, K); }
      } else {
        const fl = view === 'left';
        g.save();
        if (fl) { g.translate(24, 0); g.scale(-1, 1); }
        // vista di lato con il muso a destra
        r(1, 11, 7, 7, K); r(2, 12, 5, 5, '#3a3d48'); r(16, 12, 6, 6, K); r(17, 13, 4, 4, '#3a3d48');
        r(3, 9, 20, 5, K); r(4, 10, 18, 3, color); r(4, 12, 18, 1, dark);
        r(0, 6, 3, 5, K); r(0, 6, 2, 1, color);                // alettone
        r(20, 9, 4, 3, K); r(21, 10, 3, 1, color);             // muso
        g.translate(7, 1);
        KartChars.drawRows(g, ch.back, ch.pal, 0, 0, 1);
        g.restore();
      }
      views[view] = c;
    }
    return views;
  }

  // ------------------------------------------------------------------
  // Decorazioni (disegnate una volta, poi scalate in prospettiva)
  // ------------------------------------------------------------------
  const DECO = {};
  function rows(def, pal) {
    const c = cv(def[0].length, def.length);
    const g = c.getContext('2d');
    def.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
    return c;
  }
  function init() {
    if (DECO.tree) return;
    DECO.tree = rows([
      '....kkkkkk....', '..kkggggggkk..', '.kgggGggggggk.', 'kggGgggggGgggk', 'kgggggGgggggGk', 'kgGggggggGgggk',
      'kgggggggggggGk', '.kggGgggggggk.', '..kkggggggkk..', '....kkbbkk....', '.....kbbk.....', '.....kbbk.....', '.....kbbk.....', '....kkbbkk....',
    ], { k: K, g: '#2f7a24', G: '#46a336', b: '#8a5a2c' });
    DECO.pine = rows([
      '......kk......', '.....kggk.....', '....kgGggk....', '...kggggGgk...', '....kgggGk....', '...kgGgggggk..', '..kgggggGgggk.',
      '...kggGgggk...', '..kggggggGggk.', '.kgggGgggggggk', 'kkkkkkkkkkkkkk', '.....kbbk.....', '.....kbbk.....',
    ], { k: K, g: '#1f5a2a', G: '#2f7a3a', b: '#5a3a22' });
    DECO.palm = rows([
      '..gg....gg....', '.gGgg..ggGgg..', 'gg..gggg...gg.', '.....gbg......', '.....kbk......', '......kbk.....', '......kbk.....',
      '......kbk.....', '.....kbk......', '.....kbk......', '.....kbk......', '....kkbkk.....',
    ], { k: K, g: '#2f7a24', G: '#46a336', b: '#c98a4a' });
    DECO.stand = rows([
      'kkkkkkkkkkkkkkkkkkkkkkkk', 'kwwwwwwwwwwwwwwwwwwwwwwk', 'kRRRRRRRRRRRRRRRRRRRRRRk', 'kprpbpypgprpbpypgprpbpyk',
      'kpppppppppppppppppppppppk'.slice(0, 24), 'kpypgprpbpypgprpbpypgprk', 'kppppppppppppppppppppppk', 'kgprpbpypgprpbpypgprpbpk',
      'kssssssssssssssssssssssk', 'ksk..................ksk', 'ksk..................ksk',
    ], { k: K, w: '#ffffff', R: '#ff3b3b', p: '#9aa0ad', r: '#ff7ab8', b: '#2f8bff', y: '#ffd23b', g: '#3fe05a', s: '#6b6f7a' });
    DECO.banking = rows([
      'kkkkkkkkkkkkkkkk', 'kccccccccccccccc', 'kcCcccccccCccccc', 'kccccccccccccccc', 'kcccCccccccccCcc', 'kccccccccccccccc', 'kkkkkkkkkkkkkkkk',
    ], { k: K, c: '#b9bcc4', C: '#9aa0ad' });
    const BCOL = ['#f2e6c9', '#ffd2a0', '#ffb8a0', '#e8d8a8', '#ffffff'];
    DECO.building = BCOL.map((col) => rows([
      'kkkkkkkkkkkkkk', 'krrrrrrrrrrrrk', 'kcccccccccccck', 'kcwwcwwcwwcwwk'.slice(0, 14), 'kcbbcbbcbbcbbk'.slice(0, 14), 'kcccccccccccck', 'kcwwcwwcwwcwwk'.slice(0, 14),
      'kcbbcbbcbbcbbk'.slice(0, 14), 'kcccccccccccck', 'kcwwcwwcwwcwwk'.slice(0, 14), 'kcbbcbbcbbcbbk'.slice(0, 14), 'kccccckkcccccck'.slice(0, 14), 'kccccckkccccck', 'kkkkkkkkkkkkkk',
    ], { k: K, r: '#c2381f', c: col, w: '#9ccbff', b: '#5a8ac9' }));
    DECO.yacht = ['#ffffff', '#f2e6c9', '#ffd23b', '#9ccbff', '#ffffff'].map((col) => rows([
      '.......k........', '......kwk.......', '.....kwwwkkk....', '....kwbwbwwwk...', 'kkkkkkkkkkkkkkkk', 'kccccccccccccck.', '.kcccccccccccck.', '..kkkkkkkkkkkk..',
    ], { k: K, w: '#ffffff', b: '#2f8bff', c: col }));
  }

  /** Cartello con il nome della curva (testo pixel) */
  const signCache = new Map();
  function sign(text) {
    if (signCache.has(text)) return signCache.get(text);
    const w = PixelFont.width(text) + 6;
    const c = cv(w, 18);
    const g = c.getContext('2d');
    g.fillStyle = K; g.fillRect(0, 0, w, 11);
    g.fillStyle = '#ffd23b'; g.fillRect(1, 1, w - 2, 9);
    PixelFont.draw(g, text, w / 2, 2, { color: K, align: 'center', outline: null });
    g.fillStyle = K; g.fillRect(3, 11, 2, 7); g.fillRect(w - 5, 11, 2, 7);
    signCache.set(text, c);
    return c;
  }

  function decoImage(d) {
    init();
    if (d.kind === 'sign') return sign(d.text);
    if (d.kind === 'building') return DECO.building[d.c || 0];
    if (d.kind === 'yacht') return DECO.yacht[d.c || 0];
    return DECO[d.kind];
  }
  // dimensione nel mondo (pixel di mondo per ogni pixel dello sprite)
  const DECO_SCALE = { tree: 2.2, pine: 2.6, palm: 2.6, stand: 2, banking: 3, building: 4, yacht: 2.2, sign: 0.7 };

  window.KartArt = { buildKart, decoImage, DECO_SCALE };
})();
