/**
 * HOLY SHEEP — collegamento alla Game Room: sessione, suoni, demo per il menu.
 */
(function () {
  'use strict';
  const S = SHEEP;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // --- Effetti sonori chiptune di questo gioco ---
  Sfx.register('bark', ({ tone, noise }) => {
    tone('square', 620, 260, 0.07, 0.2); noise(0.05, 0.25, 3000, 600);
    tone('square', 560, 240, 0.08, 0.18, 0.11); noise(0.05, 0.2, 3000, 600, 0.11);
  });
  Sfx.register('whimper', ({ tone }) => { tone('square', 900, 1300, 0.12, 0.1); tone('square', 1200, 700, 0.2, 0.1, 0.12); });
  Sfx.register('baa', ({ tone }) => {
    // belato: nota tremolante che scende
    for (let i = 0; i < 6; i++) tone('square', 380 - i * 12 + (i % 2) * 40, null, 0.05, 0.07, i * 0.05);
  });
  Sfx.register('howl', ({ tone }) => { tone('triangle', 300, 620, 0.6, 0.35); tone('triangle', 620, 380, 0.9, 0.3, 0.6); tone('square', 310, 640, 0.6, 0.05); });
  Sfx.register('point', ({ tone, N }) => { tone('square', N(84), null, 0.06, 0.13); tone('square', N(91), null, 0.12, 0.13, 0.06); });
  Sfx.register('golden', ({ tone, N }) => { [0, 4, 7, 12, 16, 19].forEach((n, i) => tone('square', N(79 + n), null, 0.05, 0.12, i * 0.04)); });
  Sfx.register('chomp', ({ noise, tone }) => { noise(0.08, 0.5, 1500, 200); noise(0.08, 0.5, 1500, 200, 0.12); tone('square', 120, 60, 0.2, 0.15); });
  Sfx.register('dash', ({ noise, tone }) => { noise(0.25, 0.3, 5000, 400); tone('triangle', 200, 600, 0.15, 0.1); });
  Sfx.register('whistle', ({ tone }) => { tone('square', 1800, 1700, 0.25, 0.12); tone('square', 1800, 1300, 0.4, 0.12, 0.3); });

  let ready = false;
  function ensureRender() {
    const cv = document.getElementById('game');
    if (!ready) { SheepRender.init(cv); ready = true; } else { cv.width = S.W; cv.height = S.H; }
  }

  class SheepSession {
    constructor(room, humans) {
      this.room = room;
      ensureRender();
      const defs = humans.map((h) => ({ slot: h.slot, name: h.name, isBot: false }));
      if (defs.length <= 1) {
        // da solo: tre cani del computer negli altri recinti
        const names = S.BOT_NAMES.slice().sort(() => Math.random() - 0.5);
        for (let i = 0; i < 4; i++) if (!defs.some((d) => d.slot === i)) defs.push({ slot: i, name: names.pop(), isBot: true });
      }
      defs.sort((a, b) => a.slot - b.slot);
      this.game = new SheepGame(defs, (t, d) => this.onEvent(t, d));
      this.points = new Set();
    }
    dog(slot) { return this.game.dogs.find((d) => !d.isBot && d.slot === slot) || null; }
    update(dt) { this.game.update(dt); }
    draw() { SheepRender.draw(this.game, { roomCode: this.room.code }); }
    input(slot, m) {
      const d = this.dog(slot);
      if (!d) return;
      if (m.t === 'in') { d.input.x = clamp(+m.x || 0, -1, 1); d.input.y = clamp(+m.y || 0, -1, 1); }
      else if (m.t === 'bark') d.input.bark = true;
      else if (m.t === 'dash') d.input.dash = true;
    }
    setConnected(slot, on) {
      const d = this.dog(slot);
      if (!d) return;
      d.connected = on;
      if (!on) { d.input.x = 0; d.input.y = 0; }
    }
    hud(slot) {
      const d = this.dog(slot);
      if (!d) return null;
      const h = { sheep: d.score, time: Math.ceil(this.game.time), barkMax: S.BARK_CD, dashMax: S.DASH_CD };
      if (this.points.has(slot)) { h.point = 1; this.points.delete(slot); }
      return h;
    }
    onEvent(type, data) {
      if (type === 'sfx') Sfx.play(data);
      else if (type === 'announce') Sfx.announce(...(Array.isArray(data) ? data : [data]));
      else if (type === 'music') { if (data) Sfx.startMusic('farm'); else Sfx.stopMusic(); }
      else if (type === 'buzz') { if (!data.d.isBot) this.room.buzz(data.d.slot, data.pattern); }
      else if (type === 'hud') { if (!data.isBot) this.room.hudChanged(data.slot); }
      else if (type === 'point') { if (!data.isBot) { this.points.add(data.slot); this.room.hudChanged(data.slot); } }
      else if (type === 'over') {
        const ranking = data.map((d) => ({ slot: d.slot, name: d.name, bot: d.isBot, detail: d.score + (d.score === 1 ? ' PECORA' : ' PECORE') }));
        this.room.finish(ranking, { delay: 2000, voice: 'Winner! ' + data[0].name.toLowerCase() });
      }
    }
    stop() { Sfx.stopMusic(); }
  }

  function demo() {
    ensureRender();
    const g = new SheepGame([0, 1, 2, 3].map((i) => ({ slot: i, name: S.BOT_NAMES[i], isBot: true })), () => {});
    g.state = 'play'; g.time = 9999; g.wolfTimer = 9999;
    return { update(dt) { g.update(dt); }, draw() { SheepRender.draw(g, { demo: true }); } };
  }

  GAMES.register({
    id: 'sheep',
    title: 'HOLY SHEEP',
    desc: 'Sei un cane pastore: abbaia per farti seguire, corri per spaventarle. Più pecore nel recinto vince!',
    players: '1-4 (bot se sei da solo)',
    layout: 'sheep',
    available: true,
    icon(ctx, x, y) {
      ctx.drawImage(SheepArt.sheep.a.right, x + 2, y + 9);
      ctx.drawImage(SheepArt.dogs[0].a.left, x + 11, y + 1);
    },
    demo,
    create(room, humans) { return new SheepSession(room, humans); },
  });
})();
