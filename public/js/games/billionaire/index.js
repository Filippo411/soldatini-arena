/**
 * THE BILLIONAIRE — collegamento alla Game Room (suoni, partita, menu).
 */
(function () {
  'use strict';
  const C = BILL_CFG;

  // --- effetti sonori (tutti generati in codice, come negli altri giochi) ---
  Sfx.register('bill_intro', ({ tone, N }) => {
    [[60, 0.12], [64, 0.12], [67, 0.12], [72, 0.35]].forEach(([n, d], i) => {
      tone('square', N(n), null, d, 0.14, i * 0.13); tone('triangle', N(n - 12), null, d, 0.22, i * 0.13);
    });
  });
  Sfx.register('bill_q', ({ tone, N }) => { tone('square', N(79), null, 0.07, 0.12); tone('square', N(86), null, 0.12, 0.12, 0.08); });
  Sfx.register('bill_select', ({ tone, N }) => { tone('square', N(88), null, 0.04, 0.08); });
  Sfx.register('bill_tick', ({ tone, N }) => { tone('square', N(93), null, 0.04, 0.09); });
  Sfx.register('bill_lock', ({ tone, N }) => {
    tone('sawtooth', 160, 55, 0.5, 0.16);
    tone('triangle', N(43), null, 0.9, 0.24);
    tone('square', N(55), null, 0.12, 0.08, 0.5); tone('square', N(55), null, 0.12, 0.08, 0.9);
  });
  Sfx.register('bill_correct', ({ tone, N }) => {
    [72, 76, 79, 84].forEach((n, i) => { tone('square', N(n), null, 0.1, 0.14, i * 0.08); tone('triangle', N(n - 12), null, 0.12, 0.2, i * 0.08); });
    tone('square', N(84), null, 0.4, 0.14, 0.34);
  });
  Sfx.register('bill_wrong', ({ tone }) => {
    tone('sawtooth', 320, 70, 0.6, 0.2);
    tone('square', 160, 60, 0.7, 0.14, 0.12);
  });
  Sfx.register('bill_life', ({ tone, N }) => {
    tone('triangle', 400, 1600, 0.25, 0.18);
    tone('square', N(91), null, 0.1, 0.1, 0.24); tone('square', N(96), null, 0.14, 0.1, 0.34);
  });
  Sfx.register('bill_million', ({ tone, N }) => {
    const mel = [[72, 0.12], [76, 0.12], [79, 0.12], [84, 0.36], [79, 0.12], [84, 0.12], [88, 0.12], [91, 0.7]];
    let t = 0;
    for (const [n, d] of mel) {
      tone('square', N(n), null, d * 0.9, 0.16, t);
      tone('square', N(n - 7), null, d * 0.9, 0.07, t);
      tone('triangle', N(n - 24), null, d, 0.3, t);
      t += d;
    }
  });
  Sfx.register('bill_end', ({ tone, N }) => {
    [60, 64, 67].forEach((n) => tone('triangle', N(n), null, 0.9, 0.16));
  });

  let ctx = null;
  function ensureCanvas() {
    const cv = document.getElementById('game');
    cv.width = C.W; cv.height = C.H;
    ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  class BillSession {
    constructor(room, humans) {
      this.room = room;
      ensureCanvas();
      this.game = new BillGame(humans.map((h) => ({ slot: h.slot, name: h.name })), (t, d) => this.onEvent(t, d));
    }
    update(dt) { this.game.update(dt); }
    draw() { BillRender.draw(ctx, this.game); }
    key(k) { this.game.key(k); }

    /** Comandi dai telefoni (tutto va controllato: il telefono è l'altro lato della rete) */
    input(slot, m) {
      if (!m || typeof m.t !== 'string') return;
      const g = this.game;
      if (m.t === 'mode') { if (this.room.isLead(slot)) g.pickMode(m.m); }
      else if (m.t === 'ans') g.answer(slot, m.o);
      else if (m.t === 'life') g.useLife(slot, m.k);
    }
    setConnected(slot, on) { this.game.setConnected(slot, on); }
    hud(slot) { return this.game.hud(slot, this.room.isLead(slot)); }

    onEvent(type, data) {
      if (type === 'sfx') Sfx.play(data);
      else if (type === 'music') { if (data) Sfx.startMusic('quiz'); else Sfx.stopMusic(); }
      else if (type === 'buzz') this.room.buzz(data.slot, data.pattern);
      else if (type === 'dirty') { for (const p of this.game.players) this.room.hudChanged(p.slot); }
      else if (type === 'over') this.room.finish(data.ranking, data.opts);
    }
    stop() { Sfx.stopMusic(); }
  }

  /** Sfondo del menu: monete che cadono */
  function demo() {
    ensureCanvas();
    return BillRender.demo(ctx);
  }

  GAMES.register({
    id: 'billionaire',
    title: 'THE BILLIONAIRE',
    desc: 'Quiz di cultura generale. SFIDA: fino a 8 giocatori, 10 domande, vince chi ne azzecca di più. SQUADRA: tutti insieme verso il milione!',
    players: '1-8',
    maxPlayers: 8,
    layout: 'billionaire',
    available: true,
    icon(c, x, y) {
      // moneta d'oro con il simbolo dell'euro
      for (let j = 0; j < 24; j++) for (let i = 0; i < 24; i++) {
        const dx = i - 11.5, dy = j - 11.5, d = Math.hypot(dx, dy);
        if (d > 11.6) continue;
        c.fillStyle = d > 9.6 ? '#1b1b26' : d > 8 ? '#c27a12' : (dx + dy < -7 ? '#fff1a0' : '#ffd23b');
        c.fillRect(x + i, y + j, 1, 1);
      }
      c.fillStyle = '#8a4f0c';
      ['..###', '.#...', '####.', '.#...', '####.', '.#...', '..###'].forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') c.fillRect(x + 9 + i, y + 8 + j, 1, 1); }));
    },
    demo,
    create(room, humans) { return new BillSession(room, humans); },
  });
})();
