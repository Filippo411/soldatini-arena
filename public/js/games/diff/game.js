/**
 * TROVA LE DIFFERENZE — regole e disegno sullo schermo grande.
 *
 * Sulla TV c'è la scena ORIGINALE, sui telefoni la stessa scena con 10 differenze.
 * Si tocca sul telefono il punto dove si vede una differenza:
 *   - giusto: +1 (il cerchio compare solo sul TUO telefono)
 *   - sbagliato: telefono bloccato per 2 secondi (niente tocchi a caso!)
 * Vince chi le trova tutte per primo; allo scadere del tempo vince chi ne ha di più.
 * Ogni tanto la TV mostra un aiutino su una differenza che quasi nessuno ha trovato.
 */
(function () {
  'use strict';

  const CFG = {
    W: 384, H: 216,
    SX: 2, SY: 16,           // posizione della scena sulla TV
    N_DIFFS: 10,
    MATCH_TIME: 180,
    MISS_LOCK: 2,            // secondi di blocco dopo un tocco sbagliato
    HINT_FIRST: 70,          // primo aiutino dopo N secondi
    HINT_EVERY: 40,
    SOLUTIONS_TIME: 12,      // a fine partita, per quanti secondi restano visibili le soluzioni prima della classifica
  };
  const K = '#1b1b26';

  class DiffGame {
    constructor(defs, emit) {
      this.emit = emit || (() => {});
      const sc = DiffScene.generate();
      this.theme = sc.theme;
      this.original = sc.objs;
      const m = DiffScene.makeDiffs(sc.objs, CFG.N_DIFFS, sc.theme);
      this.changed = m.objs;
      this.diffs = m.diffs;
      this.sceneId = Math.random().toString(36).slice(2, 8);
      this.players = defs.map((d) => ({ slot: d.slot, name: d.name, found: new Set(), lockT: 0, lastFoundAt: 1e9, misses: 0, flashT: 0, connected: true }));
      this.state = 'countdown';
      this.countdown = 3.999;
      this.lastTick = 4;
      this.time = CFG.MATCH_TIME;
      this.clock = 0;
      this.hint = null;
      this.hintTimer = CFG.HINT_FIRST;
      this.revealT = -1;
      this.banner = null;
      // la scena originale viene disegnata una volta sola
      this.sceneCanvas = document.createElement('canvas');
      this.sceneCanvas.width = DiffScene.SW; this.sceneCanvas.height = DiffScene.SH;
      DiffScene.draw(this.sceneCanvas.getContext('2d'), { theme: this.theme, objs: this.original }, 0, 0);
    }

    /** Messaggio con la scena modificata, da mandare ai telefoni */
    sceneMsg() { return { t: 'scene', id: this.sceneId, theme: this.theme, objs: this.changed }; }

    player(slot) { return this.players.find((p) => p.slot === slot) || null; }

    update(dt) {
      this.clock += dt;
      for (const p of this.players) {
        if (p.lockT > 0) { p.lockT = Math.max(0, p.lockT - dt); if (p.lockT === 0) this.emit('hud', p); }
        p.flashT = Math.max(0, p.flashT - dt);
      }
      if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
      if (this.hint) { this.hint.t -= dt; if (this.hint.t <= 0) this.hint = null; }
      if (this.state === 'countdown') {
        this.countdown -= dt;
        const n = Math.ceil(this.countdown);
        if (n !== this.lastTick && n >= 1 && n <= 3) { this.lastTick = n; this.emit('sfx', 'beep'); }
        if (this.countdown <= 0) {
          this.state = 'play';
          this.banner = { text: 'VIA! GUARDA IL TELEFONO', color: '#ffd23b', t: 0, dur: 1.4 };
          this.emit('sfx', 'go');
          this.emit('music', true);
          for (const p of this.players) this.emit('hud', p);
        }
      } else if (this.state === 'play') {
        const before = Math.ceil(this.time);
        this.time = Math.max(0, this.time - dt);
        if (Math.ceil(this.time) !== before) {
          for (const p of this.players) this.emit('hud', p);
          if (this.time <= 5 && this.time > 0) this.emit('sfx', 'tick');
        }
        this.hintTimer -= dt;
        if (this.hintTimer <= 0) { this.hintTimer = CFG.HINT_EVERY; this.giveHint(); }
        if (this.time <= 0) this.end(null);
      } else if (this.state === 'over') {
        this.revealT += dt;
      }
    }

    /** Aiutino: un cerchio lampeggiante sulla TV attorno a una differenza poco trovata */
    giveHint() {
      let best = -1, bc = 1e9;
      this.diffs.forEach((d, i) => {
        const c = this.players.filter((p) => p.found.has(i)).length;
        if (c < bc || (c === bc && Math.random() < 0.5)) { bc = c; best = i; }
      });
      if (best < 0 || bc === this.players.length) return;
      const d = this.diffs[best];
      // il cerchio dell'aiuto è più grande e un po' spostato: indica la zona, non il punto preciso
      this.hint = { x: d.x + (Math.random() * 16 - 8), y: d.y + (Math.random() * 16 - 8), r: 30, t: 4 };
      this.emit('sfx', 'hint');
    }

    tap(slot, x, y) {
      const p = this.player(slot);
      if (!p || this.state !== 'play' || p.lockT > 0) return;
      const i = this.diffs.findIndex((d, idx) => !p.found.has(idx) && DiffScene.hits(d, x, y));
      if (i >= 0) {
        p.found.add(i);
        p.lastFoundAt = this.clock;
        p.flashT = 0.5;
        this.emit('sfx', 'found');
        this.emit('buzz', { slot, pattern: [40] });
        this.emit('hud', p);
        if (p.found.size === this.diffs.length) this.end(p);
        else if (p.found.size === this.diffs.length - 1) this.banner = { text: p.name + ': MANCA 1!', color: ROOM.PLAYERS[slot].color, t: 0, dur: 1.3 };
      } else {
        // già trovata? niente penalità
        if (this.diffs.some((d, idx) => p.found.has(idx) && DiffScene.hits(d, x, y))) return;
        p.misses++;
        p.lockT = CFG.MISS_LOCK;
        this.emit('sfx', 'miss');
        this.emit('buzz', { slot, pattern: [80, 40, 80] });
        this.emit('hud', p);
      }
    }

    end(winner) {
      if (this.state === 'over') return;
      this.state = 'over';
      this.revealT = 0;
      this.banner = { text: winner ? winner.name + ' HA FINITO!' : 'TEMPO!', color: '#ffd23b', t: 0, dur: 2.2 };
      this.emit('sfx', 'whistle');
      this.emit('music', false);
      for (const p of this.players) this.emit('hud', p);
      this.emit('over', this.ranking());
    }

    ranking() {
      return this.players.slice().sort((a, b) => b.found.size - a.found.size || a.lastFoundAt - b.lastFoundAt || a.misses - b.misses);
    }

    hud(slot) {
      const p = this.player(slot);
      if (!p) return null;
      return {
        sceneId: this.sceneId,
        found: [...p.found].map((i) => { const d = this.diffs[i]; return [Math.round(d.x), Math.round(d.y), Math.round(d.r)]; }),
        total: this.diffs.length,
        time: Math.ceil(this.time),
        lock: p.lockT > 0 ? 1 : 0,
        state: this.state,
        // a fine partita il telefono mostra tutte le differenze; l'ultimo valore è 1 se questo giocatore l'aveva trovata
        all: this.state === 'over' ? this.diffs.map((d, i) => [Math.round(d.x), Math.round(d.y), Math.round(d.r), p.found.has(i) ? 1 : 0]) : null,
      };
    }

    // ------------------------------------------------------------------
    // Disegno sulla TV
    // ------------------------------------------------------------------
    draw(ctx, opts) {
      ctx.fillStyle = '#20152a';
      ctx.fillRect(0, 0, CFG.W, CFG.H);
      ctx.drawImage(this.sceneCanvas, CFG.SX, CFG.SY);
      ctx.fillStyle = K;
      ctx.fillRect(CFG.SX - 1, CFG.SY - 1, DiffScene.SW + 2, 1); ctx.fillRect(CFG.SX - 1, CFG.SY + DiffScene.SH, DiffScene.SW + 2, 1);

      const cx = (x) => CFG.SX + x, cy = (y) => CFG.SY + y;
      // aiutino
      if (this.hint && Math.floor(this.clock * 6) % 2) ring(ctx, cx(this.hint.x), cy(this.hint.y), this.hint.r, '#ffffff');
      // a fine partita: si svelano tutte le differenze una alla volta
      // verde = trovata da qualcuno, rosso lampeggiante = non l'ha trovata nessuno
      if (this.state === 'over') {
        const n = Math.min(this.diffs.length, Math.floor(this.revealT / 0.15));
        for (let i = 0; i < n; i++) {
          const d = this.diffs[i];
          if (this.players.some((p) => p.found.has(i))) {
            ring(ctx, cx(d.x), cy(d.y), d.r, '#5ff27a');
          } else {
            ring(ctx, cx(d.x), cy(d.y), d.r, '#ff3b3b');
            ring(ctx, cx(d.x), cy(d.y), d.r + 1, '#ff3b3b');
            if (Math.floor(this.clock * 4) % 2) ring(ctx, cx(d.x), cy(d.y), d.r + 2, '#ffffff');
          }
        }
      }
      if (opts.demo) return;

      // barra in alto
      ctx.fillStyle = K; ctx.fillRect(0, 0, CFG.W, 14);
      PixelFont.draw(ctx, 'TROVA LE ' + this.diffs.length + ' DIFFERENZE: ' + DiffScene.THEMES[this.theme].name, 4, 4, { color: '#ffd23b', outline: null });
      const t = Math.ceil(this.time);
      const col = this.time <= 15 ? (Math.floor(this.clock * 4) % 2 ? '#ff3b3b' : '#ffd23b') : '#ffffff';
      PixelFont.draw(ctx, Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'), CFG.W - 4, 4, { color: col, outline: null, align: 'right' });

      // pannello giocatori a destra
      const px0 = CFG.SX + DiffScene.SW + 4;
      this.players.forEach((p, i) => {
        const y = CFG.SY + i * 45;
        const pc = ROOM.PLAYERS[p.slot];
        ctx.fillStyle = p.flashT > 0 && Math.floor(this.clock * 16) % 2 ? '#ffffff' : '#2a2a3a';
        ctx.fillRect(px0, y, 56, 42);
        ctx.fillStyle = pc.color; ctx.fillRect(px0, y, 3, 42);
        PixelFont.draw(ctx, p.name.slice(0, 8), px0 + 5, y + 3, { color: pc.color, outline: null });
        PixelFont.draw(ctx, String(p.found.size), px0 + 5, y + 14, { color: '#ffffff', scale: 2, outline: null });
        PixelFont.draw(ctx, '/' + this.diffs.length, px0 + 6 + PixelFont.width(String(p.found.size), 2), y + 21, { color: '#9aa0ad', outline: null });
        // pallini
        for (let k = 0; k < this.diffs.length; k++) {
          ctx.fillStyle = k < p.found.size ? pc.color : '#4a4c57';
          ctx.fillRect(px0 + 5 + k * 5, y + 33, 4, 4);
        }
        if (p.lockT > 0) PixelFont.draw(ctx, 'X', px0 + 48, y + 14, { color: '#ff3b3b' });
        if (!p.connected && Math.floor(this.clock * 2) % 2) PixelFont.draw(ctx, 'OFF', px0 + 36, y + 3, { color: '#ffffff', outline: null });
      });

      // barra in basso
      if (this.state === 'over') {
        const missed = this.diffs.filter((d, i) => !this.players.some((p) => p.found.has(i))).length;
        const msg = missed ? 'IN ROSSO: ' + missed + (missed === 1 ? ' DIFFERENZA NON TROVATA' : ' DIFFERENZE NON TROVATE') : 'TUTTE LE DIFFERENZE TROVATE!';
        PixelFont.draw(ctx, msg, CFG.SX + DiffScene.SW / 2, CFG.H - 10, { color: missed ? '#ff6b6b' : '#5ff27a', align: 'center', outline: null });
      } else {
        PixelFont.draw(ctx, 'TOCCA SUL TELEFONO DOVE VEDI UNA DIFFERENZA', CFG.SX + DiffScene.SW / 2, CFG.H - 10, { color: '#9aa0ad', align: 'center', outline: null });
      }
      if (opts.roomCode) PixelFont.draw(ctx, opts.roomCode, CFG.W - 4, CFG.H - 10, { color: '#6b6f7a', align: 'right', outline: null });

      // conto alla rovescia e scritte
      const mid = CFG.SY + DiffScene.SH / 2;
      if (this.state === 'countdown') {
        ctx.fillStyle = 'rgba(27,27,38,0.55)'; ctx.fillRect(CFG.SX, CFG.SY, DiffScene.SW, DiffScene.SH);
        const n = Math.ceil(this.countdown);
        if (n >= 1 && n <= 3) PixelFont.draw(ctx, String(n), CFG.SX + DiffScene.SW / 2, mid - 26, { color: '#ffd23b', scale: 6, align: 'center', shadow: '#a3172a' });
        PixelFont.draw(ctx, 'GUARDA BENE LA TV...', CFG.SX + DiffScene.SW / 2, mid + 28, { color: '#ffffff', align: 'center' });
      }
      if (this.banner) {
        const b = this.banner;
        if (!(b.t > b.dur - 0.3 && Math.floor(b.t * 16) % 2)) {
          let scale = b.t < 0.06 ? 4 : 3;
          while (scale > 1 && PixelFont.width(b.text, scale) > DiffScene.SW - 8) scale--;
          PixelFont.draw(ctx, b.text, CFG.SX + DiffScene.SW / 2, mid - 10, { color: b.color, scale, align: 'center', shadow: K });
        }
      }
    }
  }

  function ring(ctx, x, y, r, c) {
    ctx.fillStyle = c;
    const n = Math.ceil(r * 6);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
    }
  }

  window.DiffGame = DiffGame;
  window.DIFF_CFG = CFG;
})();
