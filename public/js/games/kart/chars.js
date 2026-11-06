/**
 * PIPPO KART — i 4 piloti (personaggi originali, caricature "di genere").
 * Usato sia dalla TV sia dai telefoni (ritratti nella schermata di scelta).
 *
 * Ogni pilota ha:
 *   - un ritratto 20x20 in pixel art (portrait)
 *   - la testa vista da dietro, sopra al kart (back)
 *   - un tormentone detto dal telefono quando lo scegli (line + voce)
 */
(function () {
  'use strict';
  const K = '#1b1b26';

  const CHARS = [
    {
      id: 'generale',
      name: 'IL GENERALISSIMO',
      short: 'GENERALE',
      desc: 'Mascellone, medaglie e zero dubbi.',
      line: 'Avanti tutta! Chi si ferma è perduto, e anche un po\' lento!',
      voice: { lang: 'it-IT', pitch: 0.5, rate: 0.9 },
      pal: { k: K, s: '#f2b58a', S: '#c98a5c', h: '#1b1b26', g: '#ffd23b', u: '#5d6b3a', U: '#3f4a1d', w: '#ffffff', r: '#ff3b3b', b: '#2f8bff' },
      portrait: [
        '....kkkkkkkkkkkk....',
        '...khhhhhhhhhhhhk...',
        '..khhhhhhhhhhhhhhk..',
        '..kggggggggggggggk..',
        '.kkkkkkkkkkkkkkkkkk.',
        '...kssssssssssssk...',
        '...kskkksssskkksk...',
        '...ksswkssssswksk...',
        '...kssssssssssssk...',
        '...kssssSSSSssssk...',
        '...kSssssssssssSk...',
        '..kSsskkkkkkkkssSk..',
        '..kSsssssssssssssk..',
        '..kSSssssssssssSSk..',
        '...kSSSSSSSSSSSSk...',
        '....kkkkkkkkkkkk....',
        '..kuuuuugguuuuuuuk..',
        '.kuuurbuuuuuuggguuk.',
        '.kuuugguuuuuuuuuuuk.',
        '.kUUUUUUUUUUUUUUUUk.',
      ],
      back: ['..kkkkkk..', '.khhhhhhk.', 'kggggggggk', 'kkkkkkkkkk', '.kSSSSSSk.', '.kSSSSSSk.', '..kuuuuk..'],
    },
    {
      id: 'comandante',
      name: 'EL COMANDANTE',
      short: 'COMANDANTE',
      desc: 'Basco, barbone e sigaro sempre acceso.',
      line: '¡A la carrera, compañeros! ¡Hasta la meta!',
      voice: { lang: 'es-ES', pitch: 0.8, rate: 1.0 },
      pal: { k: K, s: '#e8b080', S: '#b8805a', h: '#1b1b26', r: '#ff3b3b', y: '#ffd23b', B: '#3a2a22', u: '#5d6b3a', U: '#3f4a1d', w: '#ffffff', c: '#c98a4a', f: '#ff9c3b' },
      portrait: [
        '.....kkkkkkkkkk.....',
        '...kkhhhhhhhhhhkk...',
        '..khhhhhhhhhhyhhhk..',
        '.khhhhhhhhhhyryhhhk.',
        '.khhhhhhhhhhhyhhhhk.',
        '..kkkkkkkkkkkkkkkk..',
        '..kBssssssssssssBk..',
        '..kBskkssssskksBk...',
        '..kBswkssssswksBk...',
        '..kBssssssssssssBk..',
        '..kBBssssSSssssBBk..',
        '..kBBBBkkkkkkBBBBk..',
        '..kBBBBBBBBccfBBBk..',
        '...kBBBBBBBBBBBBk...',
        '....kBBBBBBBBBBk....',
        '.....kkkkkkkkkk.....',
        '..kuuuuuuuuuuuuuuk..',
        '.kuuuuuuuuuuuuuuuuk.',
        '.kuuuuuuuuuuuuuuuuk.',
        '.kUUUUUUUUUUUUUUUUk.',
      ],
      back: ['..kkkkk...', '.khhhhhkk.', 'khhhhhhhhk', 'kkkkkkkkkk', '.kBBBBBBk.', '.kBBBBBBk.', '..kuuuuk..'],
    },
    {
      id: 'regina',
      name: 'LA REGINA DEL NILO',
      short: 'REGINA',
      desc: 'Copricapo dorato, trucco perfetto, sorpassi regali.',
      line: 'Inchinatevi alla vostra regina! E fate largo!',
      voice: { lang: 'it-IT', pitch: 1.3, rate: 0.95 },
      pal: { k: K, s: '#d9a06a', S: '#a8744a', b: '#2f8bff', g: '#ffd23b', e: '#1a3fa8', h: '#1b1b26', w: '#ffffff', r: '#ff3b3b', G: '#3fe05a' },
      portrait: [
        '......kkkkkkkk......',
        '....kkggggggggkk....',
        '...kgggggGGggggggk..',
        '..kbgbgbgbgbgbgbgk..',
        '..kgbkkkkkkkkkkbgk..',
        '.kbgkhhsssssshhkgbk.',
        '.kgbkesssssssseksgk.',
        '.kbgkewkssssewkkgbk.',
        '.kgbkssssssssssksgk.',
        '.kbgkssssSSssssskgk.',
        '.kgbksssssssssskgbk.',
        '.kbgkssssrrssssksgk.',
        '.kgbkkssssssssskkgk.',
        '.kbgb.kkkkkkkkk.bgbk',
        '.kgbg..kssssk..gbgk.',
        '.kbgb.kggggggk.bgbk.',
        '..kkkkgbgbgbgbgkkk..',
        '.kgggggggggggggggggk',
        '.kwwwwwwwwwwwwwwwwk.',
        '.kwwwwwwwwwwwwwwwwk.',
      ],
      back: ['..kkkkkk..', '.kggggggk.', 'kbgbgbgbgk', 'kgbgbgbgbk', 'kbgbgbgbgk', '.kgbgbgbk.', '..kwwwwk..'],
    },
    {
      id: 'televenditrice',
      name: 'LA TELEVENDITRICE',
      short: 'TELEVENDITA',
      desc: 'Capelli cotonati, occhialoni e telefono in mano.',
      line: 'Chiamate subito! Offerta imperdibile! Solo per oggi!',
      voice: { lang: 'it-IT', pitch: 1.5, rate: 1.25 },
      pal: { k: K, s: '#f2c49a', S: '#c99a6a', y: '#ffe14a', Y: '#e0a020', r: '#ff3b3b', p: '#ff7ab8', w: '#ffffff', b: '#1b1b26', P: '#b04cf0', g: '#9aa0ad' },
      portrait: [
        '...kkkkkkkkkkkkkk...',
        '..kyyyyyYyyyyyyyyk..',
        '.kyyyYyyyyyyyYyyyyk.',
        'kyyyyyyyyyyyyyyyyyyk',
        'kyyYkkkkkkkkkkkkYyyk',
        'kyyksssssssssssskyyk',
        'kyykrrrrrsssrrrrrkyk',
        'kyyrwwbwrsssrwbwwryk',
        'kyykrrrrrsssrrrrrkyk',
        'kyyksssssSSssssskyyk',
        'kyyksssssssssssskyyk',
        '.kyksssspppppsssskyk',
        '.kyyksssskksssskkyk.',
        '..kykkssssssssskkk..',
        '...kk.kkkkkkkk.kgk..',
        '.....kkssssssk.kgk..',
        '..kkPPPPPPPPPPkkgk..',
        '.kPPPPPPPPPPPPPPkk..',
        '.kPPPPwPPPPPPwPPPk..',
        '.kPPPPPPPPPPPPPPPk..',
      ],
      back: ['..kkkkkk..', '.kyyyyyyk.', 'kyyyYyyyyk', 'kyyyyyyYyk', 'kyYyyyyyyk', '.kyyyyyyk.', '..kPPPPk..'],
    },
  ];

  function drawRows(ctx, rows, pal, x, y, scale) {
    scale = scale || 1;
    rows.forEach((r, j) => [...r].forEach((ch, i) => {
      if (ch === '.' || !pal[ch]) return;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(x + i * scale, y + j * scale, scale, scale);
    }));
  }

  /** Disegna il ritratto 20x20 del pilota */
  function drawPortrait(ctx, id, x, y, scale) {
    const c = CHARS.find((q) => q.id === id);
    if (c) drawRows(ctx, c.portrait, c.pal, x, y, scale);
  }

  window.KartChars = { CHARS, drawPortrait, drawRows, get: (id) => CHARS.find((c) => c.id === id) };
})();
