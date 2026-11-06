/**
 * PIPPO KART — simulazione della gara.
 *
 * Fisica "arcade": il kart accelera da solo, si sterza col volante (inclinando il telefono)
 * e si frena; fuori pista si rallenta, a Monaco i muretti fanno rimbalzare.
 * Ogni pilota ha 3 TURBO per gara. 3 giri, partenza con i semafori stile F1.
 */
(function () {
  'use strict';

  const KC = {
    MAX_SPEED: 135,
    ACCEL: 70,
    BRAKE: 160,
    TURN: 2.3,            // radianti al secondo a piena sterzata
    TURBO_TIME: 1.3,
    TURBO_MULT: 1.45,
    TURBOS: 3,
    SURF_SPEED: [0.5, 1, 0.92, 0.42, 1],   // erba, asfalto, cordolo, sabbia, (muro)
    LIGHTS: 5,
    LIGHT_STEP: 0.7,
    FINISH_WAIT: 20,      // dopo il primo arrivato, quanti secondi aspettare gli altri
    CATCHUP_FROM: 0.03,   // rimonta: parte quando sei più di questa frazione di giro dietro al primo...
    CATCHUP_SPAN: 0.12,   // ...e arriva al massimo dopo altrettanta frazione di giro in più
    CATCHUP_MAX: 0.07,    // bonus massimo di velocità (+7%)
    CPU_NAMES: ['CPU 1', 'CPU 2', 'CPU 3'],
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const wrapA = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

  class KartRace {
    /**
     * @param world   da KartWorld.build
     * @param racers  [{slot, name, isBot, char}]
     */
    constructor(world, racers, emit) {
      this.world = world;
      this.emit = emit || (() => {});
      this.N = world.samples.length;
      this.laps = world.track.laps;
      this.karts = racers.map((r, i) => {
        const s = world.samples[(this.N - 8 - 9 * i) % this.N];
        const side = i % 2 ? 1 : -1;
        const nx = -Math.sin(s.dir), ny = Math.cos(s.dir);
        const pc = ROOM.PLAYERS[r.slot];
        return {
          slot: r.slot, name: r.name, isBot: !!r.isBot, char: r.char, connected: true,
          x: s.x + nx * side * world.track.width * 0.22, y: s.y + ny * side * world.track.width * 0.22,
          heading: s.dir, speed: 0, vdir: s.dir,
          input: { steer: 0, brake: false, turbo: false },
          idx: (this.N - 8 - 9 * i) % this.N, lap: 0, passedHalf: true, finished: false, finishTime: 0, place: 0,
          turbos: KC.TURBOS, turboT: 0, surf: 1, bumpT: 0, wrongT: 0, offT: 0, z: 0,
          sprites: KartArt.buildKart(pc.color, pc.dark, r.char),
          bot: r.isBot ? { skill: rand(0.9, 0.97), look: rand(12, 18), wobble: rand(0, 6) } : null,
        };
      });
      this.state = 'lights';    // lights -> race -> done
      this.lightT = 0;
      this.lightsOn = 0;
      this.raceT = 0;
      this.clock = 0;
      this.firstHumanFinish = 0;
      this.banner = null;
      this.finishOrder = [];
    }

    update(dt) {
      this.clock += dt;
      if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
      if (this.state === 'lights') {
        this.lightT += dt;
        const on = Math.min(KC.LIGHTS, Math.floor(this.lightT / KC.LIGHT_STEP));
        if (on > this.lightsOn) { this.lightsOn = on; this.emit('sfx', 'light'); }
        if (this.lightT > KC.LIGHT_STEP * (KC.LIGHTS + 1) + rand(0, 0.02)) {
          this.state = 'race';
          this.lightsOn = 0;
          this.banner = { text: 'VIA!', color: '#3fe05a', t: 0, dur: 1 };
          this.emit('sfx', 'go');
          this.emit('music', true);
        }
        return;
      }
      if (this.state === 'race') this.raceT += dt;
      for (const k of this.karts) {
        if (k.isBot || k.finished) this.botThink(k, dt);
        this.physics(k, dt);
        this.progress(k);
      }
      this.collide();
      this.rank();
      if (this.state === 'race') {
        const humans = this.karts.filter((k) => !k.isBot);
        const allDone = humans.length ? humans.every((k) => k.finished) : this.karts.every((k) => k.finished);
        const timeout = this.firstHumanFinish && this.raceT - this.firstHumanFinish > KC.FINISH_WAIT;
        if (allDone || timeout) this.end();
      }
    }

    // ------------------------------------------------------------------
    physics(k, dt) {
      const inp = k.input;
      k.turboT = Math.max(0, k.turboT - dt);
      k.bumpT = Math.max(0, k.bumpT - dt);
      if (inp.turbo) {
        inp.turbo = false;
        if (k.turbos > 0 && k.turboT <= 0 && this.state === 'race') { k.turbos--; k.turboT = KC.TURBO_TIME; this.emit('sfx', 'turbo'); this.emit('hud', k); }
      }
      k.surf = this.world.surfAt(k.x, k.y);
      const surfMul = KC.SURF_SPEED[k.surf] != null ? KC.SURF_SPEED[k.surf] : 1;
      const max = KC.MAX_SPEED * surfMul * (k.turboT > 0 ? KC.TURBO_MULT : 1) * (k.isBot ? k.bot.skill * this.rubber(k) : this.catchUp(k));
      const steer = Math.max(-1, Math.min(1, k.connected || k.isBot ? inp.steer : 0));
      if (inp.brake && (k.connected || k.isBot)) k.speed -= KC.BRAKE * dt;
      else k.speed += KC.ACCEL * (k.turboT > 0 ? 2 : 1) * dt;
      if (k.speed > max) k.speed -= (k.speed - max) * Math.min(1, 2.5 * dt);
      if (k.speed < 0) k.speed = Math.max(k.speed, -30);
      // sterzata: più efficace in velocità (ma non da fermi)
      const grip = Math.min(1, Math.abs(k.speed) / 50);
      k.heading = wrapA(k.heading + steer * KC.TURN * grip * dt * (inp.brake ? 1.25 : 1) * Math.sign(k.speed || 1));
      // la direzione del moto segue il muso con un po' di scivolamento
      k.vdir = wrapA(k.vdir + wrapA(k.heading - k.vdir) * Math.min(1, dt * (k.surf === 1 ? 9 : 5)));
      const nx = k.x + Math.cos(k.vdir) * k.speed * dt, ny = k.y + Math.sin(k.vdir) * k.speed * dt;
      if (this.world.surfAt(nx, ny) === KartWorld.SURF.WALL) {
        // muretto: rimbalzo verso la pista
        const s = this.world.samples[k.idx];
        const dx = s.x - k.x, dy = s.y - k.y, d = Math.hypot(dx, dy) || 1;
        k.x += dx / d * 2; k.y += dy / d * 2;
        k.speed *= 0.45;
        k.vdir = k.heading = wrapA(k.heading + wrapA(s.dir - k.heading) * 0.5);
        if (k.bumpT <= 0) { k.bumpT = 0.4; this.emit('sfx', 'crash'); this.emit('buzz', { k, pattern: [90] }); }
      } else { k.x = nx; k.y = ny; }
      // fuori pista: vibrazione
      if ((k.surf === 0 || k.surf === 3) && k.speed > 40) {
        k.offT -= dt;
        if (k.offT <= 0) { k.offT = 0.35; this.emit('buzz', { k, pattern: [25] }); }
      }
    }

    /** Elastico leggero per i CPU: chi è molto indietro accelera un po' */
    rubber(k) {
      const humans = this.karts.filter((q) => !q.isBot);
      if (!humans.length) return 1;
      const best = Math.max(...humans.map((q) => this.dist(q)));
      const d = this.dist(k) - best;
      if (d < -300) return 1.07;
      if (d > 300) return 0.94;
      return 1;
    }
    dist(k) { return k.lap * this.N + k.idx; }

    /**
     * Rimonta per i giocatori: chi è dietro al primo va un pelino più veloce (fino a +CATCHUP_MAX),
     * così la gara resta aperta. Parte da un po' di distacco e cresce piano piano.
     */
    catchUp(k) {
      if (this.state !== 'race' || k.finished) return 1;
      let lead = -1e9;
      for (const q of this.karts) if (!q.finished) lead = Math.max(lead, this.dist(q));
      const gap = (lead - this.dist(k)) / this.N;      // distacco in giri
      if (gap <= KC.CATCHUP_FROM) return 1;
      return 1 + Math.min(KC.CATCHUP_MAX, (gap - KC.CATCHUP_FROM) / KC.CATCHUP_SPAN * KC.CATCHUP_MAX);
    }

    /** Avanzamento lungo la pista e conteggio dei giri */
    progress(k) {
      const S = this.world.samples, N = this.N;
      let best = k.idx, bd = 1e9;
      for (let o = -25; o <= 25; o++) {
        const i = (k.idx + o + N) % N;
        const d = (S[i].x - k.x) ** 2 + (S[i].y - k.y) ** 2;
        if (d < bd) { bd = d; best = i; }
      }
      const prev = k.idx;
      k.idx = best;
      if (best > N * 0.4 && best < N * 0.6) k.passedHalf = true;
      if (prev > N * 0.85 && best < N * 0.15) {
        if (k.passedHalf) {
          k.lap++;
          k.passedHalf = false;
          if (k.lap > this.laps && !k.finished) this.finish(k);
          else if (k.lap > 1) {
            if (!k.isBot) { this.emit('sfx', k.lap === this.laps ? 'lastlap' : 'lap'); this.emit('hud', k); }
            if (k.lap === this.laps && !k.isBot) this.flash(k, 'ULTIMO GIRO!');
          } else if (!k.isBot) this.emit('hud', k);
        }
      } else if (prev < N * 0.15 && best > N * 0.85) {
        k.lap--; k.passedHalf = true;   // ripassato il traguardo all'indietro
      }
      // contromano?
      const fwd = Math.cos(wrapA(k.heading - S[best].dir));
      if (fwd < -0.3 && k.speed > 20 && this.state === 'race') k.wrongT += 1 / 60; else k.wrongT = 0;
      k.hill = S[best].hill || 0;
      k.tunnel = S[best].tunnel;
    }

    finish(k) {
      k.finished = true;
      k.finishTime = this.raceT;
      this.finishOrder.push(k);
      k.place = this.finishOrder.length;
      if (!this.firstHumanFinish) this.firstHumanFinish = this.raceT;   // (primo arrivato in assoluto)
      if (!k.isBot) {
        this.emit('sfx', k.place === 1 ? 'win1' : 'finish');
        this.emit('buzz', { k, pattern: [100, 60, 100, 60, 250] });
        this.flash(k, k.place === 1 ? 'VITTORIA!' : k.place + ' POSTO');
        this.emit('hud', k);
      }
    }
    flash(k, text) { k.msg = { text, t: 2 }; }

    rank() {
      const order = this.karts.slice().sort((a, b) => {
        if (a.finished && b.finished) return a.finishTime - b.finishTime;
        if (a.finished) return -1;
        if (b.finished) return 1;
        return this.dist(b) - this.dist(a);
      });
      order.forEach((k, i) => { if (k.pos !== i + 1) { k.pos = i + 1; if (!k.isBot) this.emit('hud', k); } });
      for (const k of this.karts) if (k.msg) { k.msg.t -= 1 / 60; if (k.msg.t <= 0) k.msg = null; }
      return order;
    }

    collide() {
      const ks = this.karts;
      for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
        const a = ks[i], b = ks[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d > 0.01 && d < 10) {
          const p = (10 - d) / 2, nx = dx / d, ny = dy / d;
          a.x -= nx * p; a.y -= ny * p; b.x += nx * p; b.y += ny * p;
          const avg = (a.speed + b.speed) / 2;
          a.speed = a.speed * 0.7 + avg * 0.3; b.speed = b.speed * 0.7 + avg * 0.3;
          if (a.bumpT <= 0 || b.bumpT <= 0) { a.bumpT = b.bumpT = 0.3; this.emit('sfx', 'bump'); this.emit('buzz', { k: a, pattern: [40] }); this.emit('buzz', { k: b, pattern: [40] }); }
        }
      }
    }

    // ------------------------------------------------------------------
    // CPU (e piloti arrivati, che proseguono da soli)
    // ------------------------------------------------------------------
    botThink(k, dt) {
      const S = this.world.samples, N = this.N;
      const look = Math.round(k.bot ? k.bot.look + k.speed * 0.06 : 14);
      const t = S[(k.idx + look) % N];
      // piccola variazione di traiettoria per non sembrare un trenino
      const wob = k.bot ? Math.sin(this.clock * 0.7 + k.bot.wobble) * this.world.track.width * 0.18 : 0;
      const tx = t.x - Math.sin(t.dir) * wob, ty = t.y + Math.cos(t.dir) * wob;
      const want = Math.atan2(ty - k.y, tx - k.x);
      const diff = wrapA(want - k.heading);
      k.input.steer = Math.max(-1, Math.min(1, diff * 2.6));
      // curva stretta in arrivo? frena un po'
      const far = S[(k.idx + look * 2) % N];
      const bend = Math.abs(wrapA(far.dir - S[k.idx].dir));
      k.input.brake = (bend > 0.9 && k.speed > 105) || (Math.abs(diff) > 0.8 && k.speed > 70);
      if (k.isBot && !k.finished && k.turbos > 0 && bend < 0.15 && k.speed > 120 && Math.random() < dt * 0.15) k.input.turbo = true;
    }

    end() {
      if (this.state === 'done') return;
      this.state = 'done';
      this.emit('music', false);
      this.emit('over', this.rank());
    }
  }

  window.KartRace = KartRace;
  window.KART = KC;
})();
