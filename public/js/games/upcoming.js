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

  GAMES.register({
    id: 'kart',
    title: 'PIPPO KART',
    desc: 'Gare di kart su piste ispirate a Monza, Spa e Monaco. Il telefono fa da volante!',
    players: '1-4 (schermo diviso)',
    available: false,
    icon: art([
      '........................',
      '........................',
      '.........kkkk...........',
      '........kHHHHk..........',
      '........kHHHHk..........',
      '.........kssk...........',
      '......kkkkkkkkkkkkkk....',
      '.....krrrrrrrrrrrrrrk...',
      '....krrwwrrrrrrrrrrrrk..',
      '...kkrrrrrrrrrrrrrrrrkk.',
      '..kgggkkkkkkkkkkkkkgggk.',
      '..kgsgk...........kgsgk.',
      '..kgggk...........kgggk.',
      '...kkk.............kkk..',
    ], { k: K, H: '#ffd23b', s: '#ffc690', r: '#ff3b3b', w: '#ffffff', g: '#3a3d48' }),
  });
})();
