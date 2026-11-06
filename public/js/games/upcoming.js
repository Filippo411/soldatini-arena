/**
 * Giochi in arrivo: compaiono nel menu come "PROSSIMAMENTE".
 * Quando un gioco è pronto, si toglie da qui e si crea la sua cartella in js/games/.
 */
(function () {
  'use strict';

  /** Disegna una piccola icona da righe di caratteri (stesso sistema delle altre icone) */
  function art(rows, pal) {
    return (ctx, x, y) => {
      rows.forEach((r, j) => [...r].forEach((ch, i) => {
        if (ch === '.' || !pal[ch]) return;
        ctx.fillStyle = pal[ch];
        ctx.fillRect(x + i, y + j, 1, 1);
      }));
    };
  }
  const K = '#1b1b26';

  // (al momento nessun gioco in arrivo: tutti e quattro sono pronti!)
})();
