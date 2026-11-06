/**
 * TROVA LE DIFFERENZE — collegamento alla Game Room.
 */
(function () {
  'use strict';
  const C = DIFF_CFG;

  Sfx.register('found', ({ tone, N }) => { [0, 7, 12].forEach((n, i) => tone('square', N(76 + n), null, 0.07, 0.14, i * 0.06)); });
  Sfx.register('miss', ({ tone }) => { tone('square', 200, 120, 0.15, 0.16); tone('square', 150, 90, 0.2, 0.14, 0.15); });
  Sfx.register('hint', ({ tone, N }) => { tone('triangle', N(84), null, 0.1, 0.2); tone('triangle', N(88), null, 0.1, 0.2, 0.12); tone('triangle', N(91), null, 0.2, 0.2, 0.24); });
  Sfx.register('whistle', ({ tone }) => { tone('square', 1800, 1700, 0.25, 0.12); tone('square', 1800, 1300, 0.4, 0.12, 0.3); });

  let ctx = null;
  function ensureCanvas() {
    const cv = document.getElementById('game');
    cv.width = C.W; cv.height = C.H;
    ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  class DiffSession {
    constructor(room, humans) {
      this.room = room;
      ensureCanvas();
      this.game = new DiffGame(humans.map((h) => ({ slot: h.slot, name: h.name })), (t, d) => this.onEvent(t, d));
      // la scena modificata parte subito verso tutti i telefoni
      for (const h of humans) room.send(h.slot, this.game.sceneMsg());
    }
    update(dt) { this.game.update(dt); }
    draw() { this.game.draw(ctx, { roomCode: this.room.code }); }
    input(slot, m) {
      if (m.t === 'tap') this.game.tap(slot, +m.x, +m.y);
      else if (m.t === 'needscene') this.room.send(slot, this.game.sceneMsg());
    }
    setConnected(slot, on) {
      const p = this.game.player(slot);
      if (p) p.connected = on;
      if (on) this.room.send(slot, this.game.sceneMsg());
    }
    hud(slot) { return this.game.hud(slot); }
    onEvent(type, data) {
      if (type === 'sfx') Sfx.play(data);
      else if (type === 'music') { if (data) Sfx.startMusic('farm'); else Sfx.stopMusic(); }
      else if (type === 'buzz') this.room.buzz(data.slot, data.pattern);
      else if (type === 'hud') this.room.hudChanged(data.slot);
      else if (type === 'over') {
        const ranking = data.map((p) => ({ slot: p.slot, name: p.name, bot: false, detail: p.found.size + '/' + this.game.diffs.length + ' TROVATE' }));
        // si aspetta un po' prima della classifica: TV e telefoni mostrano le soluzioni (quali differenze mancavano)
        this.room.finish(ranking, { delay: C.SOLUTIONS_TIME * 1000, holdPhones: true, voice: 'Winner! ' + data[0].name.toLowerCase() });
      }
    }
    stop() { Sfx.stopMusic(); }
  }

  /** Sfondo del menu: una scena che cambia ogni tanto */
  function demo() {
    ensureCanvas();
    let g = new DiffGame([], () => {});
    let t = 0;
    return {
      update(dt) { t += dt; if (t > 6) { t = 0; g = new DiffGame([], () => {}); } },
      draw() {
        ctx.fillStyle = '#20152a'; ctx.fillRect(0, 0, C.W, C.H);
        ctx.drawImage(g.sceneCanvas, (C.W - DiffScene.SW) / 2, (C.H - DiffScene.SH) / 2);
      },
    };
  }

  GAMES.register({
    id: 'diff',
    title: 'TROVA LE DIFFERENZE',
    desc: 'Sulla TV l\'originale, sul telefono la copia con 10 differenze: toccale per primo! Occhio: se sbagli il telefono si blocca 2 secondi.',
    players: '1-4',
    layout: 'diff',
    available: true,
    icon(c, x, y) {
      // lente d'ingrandimento
      const rows = ['.......kkkkkkk..........', '.....kkcccccccckk.......', '....kccwwcccccccck......', '...kccwwcccccccccck.....', '...kcwwccccccccccck.....',
        '..kccwcccccccccccccck...', '..kccccccccccccccccck...', '..kccccccccccccccccck...', '..kccccccccccccccccck...', '...kccccccccccccccck....',
        '...kcccccccccccccck.....', '....kccccccccccccck.....', '.....kkcccccccckkbb.....', '.......kkkkkkkk.kbbb....', '.................kbbb...',
        '..................kbbb..', '...................kbbb.', '....................kbbk', '.....................kk.'];
      const pal = { k: '#1b1b26', c: '#5ff2ff', w: '#ffffff', b: '#c27a3a' };
      rows.forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) { c.fillStyle = pal[ch]; c.fillRect(x + i, y + 2 + j, 1, 1); } }));
    },
    demo,
    create(room, humans) { return new DiffSession(room, humans); },
  });
})();
