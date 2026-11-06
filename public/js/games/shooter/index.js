/**
 * SOLDATINI ARENA — collegamento del gioco alla Game Room.
 * Traduce i messaggi dei telefoni in comandi per i soldatini, gli eventi
 * della partita in suoni/vibrazioni, e consegna la classifica finale.
 */
(function () {
  'use strict';
  const C = CFG;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const angleOrNull = (a) => (a === null || a === undefined || !isFinite(+a) ? null : +a);

  let renderReady = false;
  function ensureRender() {
    if (!renderReady) { Render.init(document.getElementById('game')); renderReady = true; }
    else { const cv = document.getElementById('game'); cv.width = C.W; cv.height = C.H; }
  }

  class ShooterSession {
    /**
     * @param room   la Game Room (per suoni, vibrazioni, fine partita)
     * @param humans [{slot, name}] giocatori umani
     */
    constructor(room, humans) {
      this.room = room;
      ensureRender();
      const defs = humans.map((h) => ({ slot: h.slot, name: h.name, isBot: false }));
      if (defs.length <= 1) {
        // da solo (o nessuno = demo): arrivano i bot negli slot liberi
        const names = C.BOT_NAMES.slice().sort(() => Math.random() - 0.5);
        for (let i = 0; i < 4; i++) {
          if (!defs.some((d) => d.slot === i)) defs.push({ slot: i, name: names.pop(), isBot: true });
        }
      }
      defs.sort((a, b) => a.slot - b.slot);
      this.game = new Game(defs, (t, d) => this.onEvent(t, d));
    }

    soldier(slot) { return this.game.soldiers.find((s) => !s.isBot && s.slot === slot) || null; }

    update(dt) { this.game.update(dt); }
    draw() { Render.draw(this.game, { roomCode: this.room.code }); }

    input(slot, d) {
      const sol = this.soldier(slot);
      if (!sol) return;
      const inp = sol.input;
      switch (d.t) {
        case 'in': inp.x = clamp(+d.x || 0, -1, 1); inp.y = clamp(+d.y || 0, -1, 1); break;
        case 'fire': inp.fire = !!d.on; if (d.on) inp.fireTap = true; break;
        // stick di mira stile Brawl Stars
        case 'aim': inp.aimStick = angleOrNull(d.a); break;
        case 'shoot': inp.aimStick = null; inp.shot = { a: angleOrNull(d.a) }; break;
        case 'paim': inp.powStick = angleOrNull(d.a); inp.powMag = clamp(+d.m || 0, 0, 1); break;
        case 'pow': inp.powStick = null; inp.pow = { a: angleOrNull(d.a), m: d.m == null ? null : clamp(+d.m, 0, 1) }; break;
        default:
      }
    }

    setConnected(slot, on) {
      const sol = this.soldier(slot);
      if (!sol) return;
      sol.connected = on;
      if (!on) Object.assign(sol.input, { x: 0, y: 0, fire: false, aimStick: null, powStick: null });
    }

    hud(slot) {
      const s = this.soldier(slot);
      if (!s) return null;
      return {
        ammo: s.ammo, kills: s.kills, pow: s.power,
        dead: s.dead ? Math.max(1, Math.ceil(s.respawnT)) : 0,
        shield: s.shieldT > 0 ? Math.ceil(s.shieldT) : 0,
        flash: s.flashT > 0 ? Math.ceil(s.flashT) : 0,
        time: Math.ceil(this.game.time),
      };
    }

    onEvent(type, data) {
      if (type === 'sfx') Sfx.play(data);
      else if (type === 'announce') Sfx.announce(data);
      else if (type === 'music') { if (data) Sfx.startMusic(); else Sfx.stopMusic(); }
      else if (type === 'buzz') { if (!data.s.isBot) this.room.buzz(data.s.slot, data.pattern); }
      else if (type === 'hud') { if (!data.isBot) this.room.hudChanged(data.slot); }
      else if (type === 'over') {
        const ranking = this.game.ranking().map((s) => ({
          slot: s.slot, name: s.name, bot: s.isBot, detail: `${s.kills} ELIM. · ${s.deaths} K.O.`,
        }));
        // prima lasciamo vedere "MISSION COMPLETE!", poi la classifica
        this.room.finish(ranking, { delay: 1800, voice: 'Winner! ' + data.name.toLowerCase() });
      }
    }

    stop() { Sfx.stopMusic(); }
  }

  /** Partita dimostrativa di soli bot, muta, dietro al menu */
  function demo() {
    ensureRender();
    const g = new Game([0, 1, 2, 3].map((i) => ({ slot: i, name: C.BOT_NAMES[i], isBot: true })), () => {});
    g.state = 'play';
    g.time = 9999;
    return {
      update(dt) { g.update(dt); },
      draw() { Render.draw(g, { demo: true }); },
    };
  }

  let iconArt = null;
  GAMES.register({
    id: 'shooter',
    title: 'SOLDATINI ARENA',
    desc: 'Sparatutto tutti contro tutti. 10 eliminazioni o 3 minuti.',
    players: '1-4 (bot se sei da solo)',
    layout: 'shooter',
    available: true,
    icon(ctx, x, y) {
      if (!iconArt) iconArt = Sprites.buildSoldier(ROOM.PLAYERS[0]);
      ctx.drawImage(iconArt.right.stand, x + 5, y + 4);
      // fucile + fiammata
      ctx.fillStyle = '#3a3d48'; ctx.fillRect(x + 12, y + 14, 6, 1);
      ctx.fillStyle = '#ffe14a'; ctx.fillRect(x + 19, y + 13, 2, 3);
      ctx.fillStyle = '#ff9c3b'; ctx.fillRect(x + 21, y + 14, 2, 1);
    },
    demo,
    create(room, humans) { return new ShooterSession(room, humans); },
  });

  // Window di debug per i test automatici
  window.__shooter = { ShooterSession };
})();
