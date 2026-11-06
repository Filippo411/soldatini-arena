/**
 * PIPPO KART — collegamento alla Game Room.
 *
 * Due fasi:
 *   1. SCELTA: ognuno sceglie il pilota sul telefono, il capo sceglie la pista e preme VIA
 *   2. GARA: semafori, 3 giri, classifica
 * Ci sono sempre 4 kart in pista: i posti liberi li prendono i CPU.
 */
(function () {
  'use strict';
  const W = 384, H = 216, K = '#1b1b26';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // --- suoni ---
  Sfx.register('light', ({ tone }) => { tone('square', 440, null, 0.25, 0.16); });
  Sfx.register('turbo', ({ tone, noise }) => { tone('sawtooth', 120, 900, 0.5, 0.14); noise(0.5, 0.25, 6000, 600); });
  Sfx.register('crash', ({ noise, tone }) => { noise(0.25, 0.5, 2500, 200); tone('square', 140, 60, 0.2, 0.15); });
  Sfx.register('bump', ({ tone }) => { tone('square', 220, 160, 0.08, 0.12); });
  Sfx.register('lap', ({ tone, N }) => { [0, 4, 7].forEach((n, i) => tone('square', N(79 + n), null, 0.08, 0.13, i * 0.08)); });
  Sfx.register('lastlap', ({ tone, N }) => { [0, 4, 7, 12, 7, 12].forEach((n, i) => tone('square', N(79 + n), null, 0.08, 0.14, i * 0.08)); });
  Sfx.register('finish', ({ tone, N }) => { [0, 5, 9, 12].forEach((n, i) => tone('square', N(72 + n), null, 0.12, 0.14, i * 0.12)); });
  Sfx.register('win1', ({ tone, N }) => { [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone('square', N(72 + n), null, 0.1, 0.15, i * 0.08)); });

  let ready = false;
  function ensure() {
    const cv = document.getElementById('game');
    if (!ready) { KartRender.init(cv); ready = true; } else { cv.width = W; cv.height = H; }
    return cv.getContext('2d');
  }

  const previews = {};
  function preview(tr) { if (!previews[tr.id]) previews[tr.id] = KartWorld.preview(tr, 64); return previews[tr.id]; }

  class KartSession {
    constructor(room, humans) {
      this.room = room;
      this.ctx = ensure();
      this.humans = humans.map((h) => ({ slot: h.slot, name: h.name, char: null, connected: true }));
      this.stage = 'select';
      this.track = 'monza';
      this.race = null;
      this.clock = 0;
      this.autoT = 45;   // dopo 45 secondi di scelta si parte comunque
    }

    human(slot) { return this.humans.find((h) => h.slot === slot) || null; }

    // ------------------------------------------------------------------
    startRace() {
      if (this.stage !== 'select') return;
      // chi non ha scelto riceve un pilota libero
      const free = () => KartChars.CHARS.map((c) => c.id).filter((id) => !this.humans.some((h) => h.char === id));
      for (const h of this.humans) if (!h.char) h.char = free()[0];
      const racers = this.humans.map((h) => ({ slot: h.slot, name: h.name, isBot: false, char: h.char }));
      const left = free().sort(() => Math.random() - 0.5);
      for (let s = 0; s < 4 && racers.length < 4; s++) {
        if (racers.some((r) => r.slot === s)) continue;
        const c = left.pop();
        racers.push({ slot: s, name: KartChars.get(c).short, isBot: true, char: c });
      }
      racers.sort((a, b) => a.slot - b.slot);
      const world = KartWorld.build(KartTracks.get(this.track));
      this.race = new KartRace(world, racers, (t, d) => this.onEvent(t, d));
      for (const h of this.humans) { const k = this.kart(h.slot); if (k) k.connected = h.connected; }
      this.stage = 'race';
      this.ctx = ensure();
      for (const h of this.humans) this.room.hudChanged(h.slot);
    }
    kart(slot) { return this.race ? this.race.karts.find((k) => !k.isBot && k.slot === slot) : null; }

    update(dt) {
      this.clock += dt;
      if (this.stage === 'select') {
        this.autoT -= dt;
        if (this.autoT <= 0) this.startRace();
        return;
      }
      this.race.update(dt);
    }

    draw() {
      if (this.stage === 'select') return this.drawSelect();
      const focus = this.humans.map((h) => this.kart(h.slot)).filter(Boolean);
      KartRender.draw(this.race, focus.length ? focus : [this.race.karts[0]], { roomCode: this.room.code });
    }

    drawSelect() {
      const g = this.ctx;
      g.fillStyle = '#20152a'; g.fillRect(0, 0, W, H);
      // a strisce come una bandiera a scacchi in alto
      for (let x = 0; x < W; x += 8) for (let y = 0; y < 16; y += 8) { g.fillStyle = ((x + y) / 8) % 2 ? '#ffffff' : K; g.fillRect(x, y, 8, 8); }
      PixelFont.draw(g, 'PIPPO KART', W / 2, 22, { color: '#ffd23b', scale: 3, align: 'center', shadow: '#a3172a' });
      // piste
      PixelFont.draw(g, 'PISTA (SCEGLIE IL CAPO)', 8, 52, { color: '#9aa0ad', outline: null });
      KartTracks.TRACKS.forEach((tr, i) => {
        const x = 8 + i * 74, y = 62, sel = tr.id === this.track;
        g.fillStyle = sel ? '#ffd23b' : '#3a3d48'; g.fillRect(x - 2, y - 2, 68, 80);
        g.fillStyle = sel ? '#3a2a10' : '#2a2a3a'; g.fillRect(x, y, 64, 76);
        g.drawImage(preview(tr), x, y);
        PixelFont.draw(g, tr.name, x + 32, y + 66, { color: sel ? '#ffd23b' : '#ffffff', align: 'center', outline: null });
      });
      const tr = KartTracks.get(this.track);
      wrapText(g, tr.sub, 8, 148, 220, '#ffffff');
      // piloti
      PixelFont.draw(g, 'PILOTI', 238, 52, { color: '#9aa0ad', outline: null });
      KartChars.CHARS.forEach((c, i) => {
        const x = 238 + (i % 2) * 72, y = 62 + Math.floor(i / 2) * 70;
        const by = this.humans.find((h) => h.char === c.id);
        g.fillStyle = by ? ROOM.PLAYERS[by.slot].color : '#3a3d48'; g.fillRect(x - 2, y - 2, 68, 66);
        g.fillStyle = '#2a2a3a'; g.fillRect(x, y, 64, 62);
        KartChars.drawPortrait(g, c.id, x + 12, y + 2, 2);
        PixelFont.draw(g, c.short.slice(0, 10), x + 32, y + 44, { color: '#ffffff', align: 'center', outline: null });
        if (by) PixelFont.draw(g, by.name, x + 32, y + 53, { color: ROOM.PLAYERS[by.slot].color, align: 'center', outline: null });
      });
      const missing = this.humans.filter((h) => !h.char).length;
      const msg = missing ? 'SCEGLI IL PILOTA SUL TELEFONO!' : 'PRONTI! IL CAPO PREME VIA (O INVIO)';
      PixelFont.draw(g, msg, W / 2, H - 22, { color: Math.floor(this.clock * 3) % 2 ? '#ffd23b' : '#ffffff', align: 'center' });
      PixelFont.draw(g, 'PARTENZA AUTOMATICA TRA ' + Math.ceil(this.autoT), W / 2, H - 10, { color: '#6b6f7a', align: 'center', outline: null });
    }

    key(k) {
      if (this.stage !== 'select') return;
      const ids = KartTracks.TRACKS.map((t) => t.id);
      const i = ids.indexOf(this.track);
      if (k === 'ArrowRight') this.track = ids[(i + 1) % ids.length];
      else if (k === 'ArrowLeft') this.track = ids[(i - 1 + ids.length) % ids.length];
      else if (k === 'Enter') this.startRace();
      for (const h of this.humans) this.room.hudChanged(h.slot);
    }

    // ------------------------------------------------------------------
    input(slot, m) {
      const h = this.human(slot);
      if (!h) return;
      if (this.stage === 'select') {
        if (m.t === 'kchar' && KartChars.get(m.id) && !this.humans.some((o) => o !== h && o.char === m.id)) {
          h.char = m.id; Sfx.play('join');
          for (const o of this.humans) this.room.hudChanged(o.slot);
        } else if (m.t === 'ktrack' && this.room.isLead(slot) && KartTracks.get(m.id)) {
          this.track = m.id; Sfx.play('tick');
          for (const o of this.humans) this.room.hudChanged(o.slot);
        } else if (m.t === 'kgo' && this.room.isLead(slot)) this.startRace();
        return;
      }
      const k = this.kart(slot);
      if (!k) return;
      if (m.t === 'kin') { k.input.steer = clamp(+m.s || 0, -1, 1); k.input.brake = !!m.b; }
      else if (m.t === 'turbo') k.input.turbo = true;
    }

    setConnected(slot, on) {
      const h = this.human(slot);
      if (h) h.connected = on;
      const k = this.kart(slot);
      if (k) { k.connected = on; if (!on) { k.input.steer = 0; k.input.brake = false; } }
    }

    hud(slot) {
      const base = {
        stage: this.stage, track: this.track, lead: this.room.isLead(slot),
        chars: this.humans.filter((h) => h.char).map((h) => [h.slot, h.char]),
        tracks: KartTracks.TRACKS.map((t) => [t.id, t.name]),
      };
      if (this.stage === 'select') return base;
      const k = this.kart(slot);
      if (!k) return base;
      return Object.assign(base, {
        pos: k.pos || 1, n: this.race.karts.length, lap: Math.max(1, Math.min(this.race.laps, k.lap)), laps: this.race.laps,
        turbos: k.turbos, finished: k.finished ? k.place : 0, lights: this.race.state === 'lights' ? 1 : 0,
      });
    }

    onEvent(type, data) {
      if (type === 'sfx') Sfx.play(data);
      else if (type === 'music') { if (data) Sfx.startMusic('race'); else Sfx.stopMusic(); }
      else if (type === 'buzz') { if (!data.k.isBot) this.room.buzz(data.k.slot, data.pattern); }
      else if (type === 'hud') { if (!data.isBot) this.room.hudChanged(data.slot); }
      else if (type === 'over') {
        const ranking = data.map((k) => ({
          slot: k.slot, name: k.name, bot: k.isBot,
          detail: k.finished ? formatTime(k.finishTime) : 'GIRO ' + Math.max(1, Math.min(this.race.laps, k.lap)),
        }));
        this.room.finish(ranking, { delay: 2500, voice: 'Winner! ' + data[0].name.toLowerCase() });
      }
    }
    stop() { Sfx.stopMusic(); }
  }

  function formatTime(t) {
    const m = Math.floor(t / 60), s = (t % 60).toFixed(1);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function wrapText(g, text, x, y, w, color) {
    const words = text.toUpperCase().split(' ');
    let line = '', yy = y;
    for (const wd of words) {
      const t = line ? line + ' ' + wd : wd;
      if (PixelFont.width(t) > w) { PixelFont.draw(g, line, x, yy, { color, outline: null }); line = wd; yy += 10; } else line = t;
    }
    if (line) PixelFont.draw(g, line, x, yy, { color, outline: null });
  }

  /** Sfondo del menu: 4 CPU che girano a Monza */
  function demo() {
    ensure();
    const ids = KartChars.CHARS.map((c) => c.id);
    const race = new KartRace(KartWorld.build(KartTracks.get('monza')), [0, 1, 2, 3].map((i) => ({ slot: i, name: 'CPU', isBot: true, char: ids[i] })), () => {});
    race.state = 'race';
    return {
      update(dt) { race.update(dt); for (const k of race.karts) { k.finished = false; if (k.lap > 2) k.lap = 1; } },
      draw() { KartRender.draw(race, [race.karts[0]], { demo: true }); },
    };
  }

  GAMES.register({
    id: 'kart',
    title: 'PIPPO KART',
    desc: 'Kart in finto 3D su Monza, Spa e Monaco. Il telefono è il volante: inclinalo per sterzare! 3 turbo a testa.',
    players: '1-4 (schermo diviso, CPU nei posti liberi)',
    layout: 'kart',
    available: true,
    icon(c, x, y) {
      const views = KartArt.buildKart(ROOM.PLAYERS[0].color, ROOM.PLAYERS[0].dark, 'generale');
      c.drawImage(views.back, x, y + 3);
    },
    demo,
    create(room, humans) { return new KartSession(room, humans); },
  });
})();
