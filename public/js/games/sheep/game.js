/**
 * HOLY SHEEP — simulazione.
 *
 * Ogni giocatore è un cane pastore. Due strumenti:
 *   - ABBAIARE: le pecore vicine si girano e ti SEGUONO per un po'
 *   - CORRERE ADDOSSO (soprattutto con lo SCATTO): le pecore si spaventano e scappano
 * Vince chi a fine tempo ha più pecore nel proprio recinto (quelle d'oro valgono 3).
 * Ogni tanto arriva il lupo: le pecore scappano, e se ne prende una se la mangia.
 * Abbaiandogli contro, il lupo se ne va.
 */
(function () {
  'use strict';
  const S = SHEEP;
  const rand = (a, b) => a + Math.random() * (b - a);

  class SheepGame {
    /**
     * @param defs  [{slot, name, isBot}]
     * @param emit  (tipo, dati) => void   eventi verso l'esterno (suoni, vibrazioni, hud, fine)
     */
    constructor(defs, emit) {
      this.emit = emit || (() => {});
      this.used = defs.map((d) => d.slot);
      this.map = SheepMap.generate(this.used);
      this.mapCanvas = SheepArt.renderMap(this.map, this.used);
      this.dogs = defs.map((d) => {
        const p = S.PENS[d.slot];
        return {
          slot: d.slot, name: d.name, isBot: !!d.isBot, connected: true,
          x: p.spawnX, y: p.spawnY, vx: 0, vy: 0, left: p.dir < 0, moving: false, walkT: 0,
          input: { x: 0, y: 0, bark: false, dash: false },
          barkCd: 0, dashCd: 0, dashT: 0, barkT: 0, score: 0, banked: 0, bot: null,
        };
      });
      this.sheep = [];
      const open = this.map.open().filter((t) => t.tx > 13 && t.tx < S.COLS - 14);
      for (let i = 0; i < S.SHEEP_COUNT; i++) this.addSheep(open, false);
      this.wolf = null;
      this.wolfTimer = S.WOLF_FIRST;
      this.goldTimer = 6;
      this.waveT = 0;
      this.respawnQueue = [];
      this.rings = [];         // onde dell'abbaio
      this.texts = [];
      this.particles = [];
      this.banner = null;
      this.state = 'countdown';
      this.countdown = 3.999;
      this.lastTick = 4;
      this.time = S.MATCH_TIME;
      this.clock = 0;
      this.shake = 0;
    }

    addSheep(open, golden, at) {
      const t = at || open[Math.floor(Math.random() * open.length)];
      this.sheep.push({
        x: t.x + rand(-2, 2), y: t.y + rand(-2, 2), vx: 0, vy: 0,
        golden, heading: rand(0, Math.PI * 2), wanderT: rand(0, 2), graze: rand(0, 2),
        followDog: null, followT: 0, fleeT: 0, left: Math.random() < 0.5, walkT: 0,
        pen: -1, penT: 0, alertT: 0, bleatT: rand(3, 15),
      });
    }

    // ------------------------------------------------------------------
    update(dt) {
      this.clock += dt;
      this.shake = Math.max(0, this.shake - dt * 8);
      if (this.state === 'countdown') {
        this.countdown -= dt;
        const n = Math.ceil(this.countdown);
        if (n !== this.lastTick && n >= 1 && n <= 3) { this.lastTick = n; this.emit('sfx', 'beep'); }
        if (this.countdown <= 0) {
          this.state = 'play';
          this.showBanner('VIA!', '#ffd23b', 1.2);
          this.emit('sfx', 'go');
          this.emit('announce', ['Via!', { lang: 'it-IT', pitch: 0.8 }]);
          this.emit('music', true);
        }
      } else if (this.state === 'play') {
        const before = Math.ceil(this.time);
        this.time = Math.max(0, this.time - dt);
        const after = Math.ceil(this.time);
        if (before !== after) {
          if (after === 60) this.showBanner('ULTIMO MINUTO!', '#ff9c3b', 1.4);
          if (after === 10) this.showBanner('ULTIMI 10 SECONDI!', '#ff9c3b', 1.4);
          if (after <= 5 && after > 0) this.emit('sfx', 'tick');
        }
        for (const d of this.dogs) {
          if (d.isBot) SheepBots.think(this, d, dt);
          this.updateDog(d, dt);
        }
        this.updateWolf(dt);
        this.updateGold(dt);
        if (this.time <= 0) this.end();
      }
      // le pecore si muovono sempre (anche durante il conto alla rovescia: è carino)
      for (const s of this.sheep) this.updateSheep(s, dt);
      this.separate();
      this.updateScores(dt);
      for (const r of this.rings) r.t += dt;
      this.rings = this.rings.filter((r) => r.t < 0.5);
      for (const t of this.texts) { t.t += dt; t.y -= dt * 12; }
      this.texts = this.texts.filter((t) => t.t < t.dur);
      for (const p of this.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vz -= 200 * dt; p.z = Math.max(0, p.z + p.vz * dt); }
      this.particles = this.particles.filter((p) => p.life > 0);
      if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
    }

    // ------------------------------------------------------------------
    // Cani
    // ------------------------------------------------------------------
    updateDog(d, dt) {
      d.barkCd = Math.max(0, d.barkCd - dt);
      d.dashCd = Math.max(0, d.dashCd - dt);
      d.dashT = Math.max(0, d.dashT - dt);
      d.barkT = Math.max(0, d.barkT - dt);
      const inp = d.connected || d.isBot ? d.input : { x: 0, y: 0 };
      const mag = Math.min(1, Math.hypot(inp.x, inp.y));
      d.moving = mag > 0.2;
      if (d.moving) {
        const a = Math.atan2(inp.y, inp.x);
        const k = Math.min(1, (mag - 0.2) / 0.45);
        const sp = S.DOG_SPEED * (0.5 + 0.5 * k) * (d.dashT > 0 ? S.DASH_MULT : 1);
        d.vx = Math.cos(a) * sp; d.vy = Math.sin(a) * sp;
        this.move(d, d.vx * dt, d.vy * dt, 3);
        if (Math.abs(d.vx) > 4) d.left = d.vx < 0;
        d.walkT += dt * (d.dashT > 0 ? 2 : 1);
        if (d.dashT > 0 && Math.random() < 0.5) this.particles.push({ x: d.x, y: d.y, z: 0, vx: rand(-10, 10), vy: rand(-5, 5), vz: 20, life: 0.3, color: '#c9a462' });
      } else { d.vx = 0; d.vy = 0; }

      if (inp.bark) { inp.bark = false; this.bark(d); }
      if (inp.dash) {
        inp.dash = false;
        if (d.dashCd <= 0) { d.dashT = S.DASH_TIME; d.dashCd = S.DASH_CD; this.emit('sfx', 'dash'); }
      }
    }

    bark(d) {
      if (d.barkCd > 0 || this.state !== 'play') return;
      d.barkCd = S.BARK_CD;
      d.barkT = 0.35;
      this.rings.push({ x: d.x, y: d.y - 4, slot: d.slot, t: 0 });
      this.emit('sfx', 'bark');
      let n = 0;
      for (const s of this.sheep) {
        if (Math.hypot(s.x - d.x, s.y - d.y) < S.BARK_R) {
          s.followDog = d; s.followT = S.ATTRACT_TIME; s.fleeT = 0; s.alertT = 0.4; n++;
        }
      }
      // il lupo ha paura degli abbai: la prima volta indietreggia (e poi torna), la seconda se ne va
      const w = this.wolf;
      if (w && !w.leaving && w.retreatT <= 0 && Math.hypot(w.x - d.x, w.y - d.y) < S.BARK_R * 1.25) {
        w.scares++;
        w.scaredBy = d;
        w.lungeT = 0; w.recoverT = 0; w.target = null;
        if (w.scares >= S.WOLF_SCARES) w.leaving = true; else w.retreatT = 2.2;
        this.floatText(w.x, w.y - 14, 'CAI CAI!', '#ffffff');
        this.emit('sfx', 'whimper');
      }
      return n;
    }

    // ------------------------------------------------------------------
    // Pecore: piccolo "stormo" con separazione, coesione, pascolo, fuga, inseguimento
    // ------------------------------------------------------------------
    updateSheep(s, dt) {
      s.followT = Math.max(0, s.followT - dt);
      s.fleeT = Math.max(0, s.fleeT - dt);
      s.alertT = Math.max(0, s.alertT - dt);
      if (s.followT <= 0) s.followDog = null;
      let dx = 0, dy = 0, speed = 0;

      // pericoli: cani che corrono addosso, lupo
      let fx = 0, fy = 0, scared = false;
      if (this.state === 'play') {
        for (const d of this.dogs) {
          if (d === s.followDog || !d.moving) continue;
          const r = d.dashT > 0 ? S.DASH_SCARE_R : S.SCARE_R;
          const dist = Math.hypot(s.x - d.x, s.y - d.y);
          if (dist < r && dist > 0.1) { fx += (s.x - d.x) / dist * (r - dist); fy += (s.y - d.y) / dist * (r - dist); scared = true; }
        }
        const w = this.wolf;
        if (w && !w.leaving) {
          const dist = Math.hypot(s.x - w.x, s.y - w.y);
          if (dist < S.WOLF_FEAR_R && dist > 0.1) { fx += (s.x - w.x) / dist * 60; fy += (s.y - w.y) / dist * 60; scared = true; }
        }
      }
      if (scared) {
        if (s.fleeT <= 0) s.alertT = 0.5;
        s.fleeT = 0.6;
        // lo spavento fa smettere di seguire il cane
        if (s.followDog && Math.random() < 0.05) { s.followDog = null; s.followT = 0; }
      }

      if (s.fleeT > 0 && (fx || fy)) {
        const m = Math.hypot(fx, fy);
        dx = fx / m; dy = fy / m; speed = S.SHEEP_FLEE_SPEED;
        s.heading = Math.atan2(dy, dx);
      } else if (s.followDog) {
        // segue il cane che ha abbaiato, fermandosi poco dietro
        const d = s.followDog;
        const dist = Math.hypot(d.x - s.x, d.y - s.y);
        if (dist > S.FOLLOW_DIST) {
          dx = (d.x - s.x) / dist; dy = (d.y - s.y) / dist;
          speed = Math.min(S.SHEEP_FOLLOW_SPEED, 20 + dist * 1.2);
        }
      } else {
        // pascolo: brevi passeggiate e pause, con un po' di coesione con le vicine
        s.wanderT -= dt;
        if (s.wanderT <= 0) {
          s.wanderT = rand(1, 3);
          s.graze = Math.random() < 0.45 ? rand(0.8, 2.5) : 0;
          s.heading += rand(-1.2, 1.2);
        }
        s.graze = Math.max(0, s.graze - dt);
        let cx = 0, cy = 0, n = 0;
        for (const o of this.sheep) {
          if (o === s) continue;
          const dd = Math.abs(o.x - s.x) + Math.abs(o.y - s.y);
          if (dd < 36) { cx += o.x; cy += o.y; n++; }
        }
        dx = Math.cos(s.heading); dy = Math.sin(s.heading);
        if (n && s.pen < 0) {
          cx /= n; cy /= n;
          const cd = Math.hypot(cx - s.x, cy - s.y);
          if (cd > 10) { dx += (cx - s.x) / cd * 0.6; dy += (cy - s.y) / cd * 0.6; }
        }
        // nei recinti le pecore restano tranquille e lontane dal cancello
        if (s.pen >= 0) {
          const p = S.PENS[s.pen];
          dx += (p.centerX - s.x) * 0.02; dy += (p.centerY - s.y) * 0.02;
        }
        const m = Math.hypot(dx, dy) || 1;
        dx /= m; dy /= m;
        speed = s.graze > 0 ? 0 : S.SHEEP_SPEED * (s.pen >= 0 ? 0.4 : 0.6);
      }

      // velocità che cambia con dolcezza (le pecore non sono razzi)
      const k = Math.min(1, dt * 6);
      s.vx += (dx * speed - s.vx) * k;
      s.vy += (dy * speed - s.vy) * k;
      const ox = s.x, oy = s.y;
      this.move(s, s.vx * dt, s.vy * dt, 2.5);
      // se sbatte contro qualcosa cambia direzione
      if (Math.abs(s.x - ox) < Math.abs(s.vx * dt) * 0.3 && Math.abs(s.y - oy) < Math.abs(s.vy * dt) * 0.3) s.heading += rand(1, 2.5);
      const sp = Math.hypot(s.vx, s.vy);
      if (sp > 3) { s.left = s.vx < 0; s.walkT += dt * sp / 20; }

      // belati casuali
      s.bleatT -= dt;
      if (s.bleatT <= 0) {
        s.bleatT = rand(8, 20);
        if (this.state === 'play' && Math.random() < 0.35) { this.floatText(s.x, s.y - 10, 'BEEE', '#ffffff'); this.emit('sfx', 'baa'); }
      }
    }

    /** Le pecore non si sovrappongono */
    separate() {
      const all = this.sheep;
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        if (Math.abs(dx) > 7 || Math.abs(dy) > 7) continue;
        const d = Math.hypot(dx, dy);
        if (d > 0.01 && d < 6.5) {
          const p = (6.5 - d) / 2, nx = dx / d, ny = dy / d;
          this.move(a, -nx * p, -ny * p, 2.5);
          this.move(b, nx * p, ny * p, 2.5);
        }
      }
      for (const d of this.dogs) for (const s of all) {
        const dx = s.x - d.x, dy = s.y - d.y, dd = Math.hypot(dx, dy);
        if (dd > 0.01 && dd < 6) this.move(s, dx / dd * (6 - dd), dy / dd * (6 - dd), 2.5);
      }
    }

    // collisione box contro le caselle solide (stessa idea di Soldatini Arena)
    collides(x, y, h) {
      const m = this.map;
      return m.solid(x - h, y - h) || m.solid(x + h - 0.01, y - h) || m.solid(x - h, y + h - 0.01) || m.solid(x + h - 0.01, y + h - 0.01);
    }
    move(o, dx, dy, h) {
      if (!this.collides(o.x + dx, o.y, h)) o.x += dx;
      else for (const n of [1, -1, 2, -2, 3, -3]) { if (!this.collides(o.x + dx, o.y + n, h)) { o.y += Math.sign(n) * Math.min(Math.abs(dx), 1); break; } }
      if (!this.collides(o.x, o.y + dy, h)) o.y += dy;
      else for (const n of [1, -1, 2, -2, 3, -3]) { if (!this.collides(o.x + n, o.y + dy, h)) { o.x += Math.sign(n) * Math.min(Math.abs(dy), 1); break; } }
    }

    // ------------------------------------------------------------------
    // Punteggi: pecore dentro ogni recinto
    // ------------------------------------------------------------------
    penOf(x, y) {
      for (let i = 0; i < S.PENS.length; i++) {
        const p = S.PENS[i];
        if (x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) return i;
      }
      return -1;
    }
    updateScores(dt) {
      // le pecore già "salvate" (sparite dal recinto) restano nel punteggio per sempre
      const sc = [0, 0, 0, 0];
      for (const d of this.dogs) sc[d.slot] = d.banked;
      for (const s of this.sheep.slice()) {
        const p = this.penOf(s.x, s.y);
        if (p !== s.pen) {
          s.penT = 0;
          // entrando in un recinto la pecora si "sistema": smette di seguire il cane
          if (p >= 0) { s.followDog = null; s.followT = 0; }
          // una pecora è entrata in un recinto!
          if (p >= 0 && this.state === 'play') {
            const d = this.dogs.find((x) => x.slot === p);
            const v = s.golden ? S.GOLDEN_VALUE : 1;
            if (d) {
              this.floatText(s.x, s.y - 12, '+' + v, ROOM.PLAYERS[p].light);
              this.emit('sfx', s.golden ? 'golden' : 'point');
              this.emit('buzz', { d, pattern: [25] });
              this.emit('point', d);
            }
          } else if (s.pen >= 0 && p < 0 && this.state === 'play') {
            const d = this.dogs.find((x) => x.slot === s.pen);
            if (d) this.floatText(s.x, s.y - 12, '-' + (s.golden ? S.GOLDEN_VALUE : 1), '#ff5a5a');
          }
          s.pen = p;
        }
        const v = s.golden ? S.GOLDEN_VALUE : 1;
        // dopo PEN_STAY secondi dentro il recinto la pecora sparisce: il punto è al sicuro
        if (p >= 0 && this.state === 'play') {
          s.penT += dt;
          const d = this.dogs.find((x) => x.slot === p);
          if (d && s.penT >= S.PEN_STAY) {
            d.banked += v;
            this.sheep.splice(this.sheep.indexOf(s), 1);
            this.puff(s.x, s.y, s.golden ? '#ffe14a' : ROOM.PLAYERS[p].light);
            this.floatText(s.x, s.y - 12, 'SALVA!', ROOM.PLAYERS[p].light);
            sc[p] += v;
            continue;
          }
        }
        if (p >= 0) sc[p] += v;
      }
      for (const d of this.dogs) {
        if (d.score !== sc[d.slot]) { d.score = sc[d.slot]; this.emit('hud', d); }
      }
    }

    // ------------------------------------------------------------------
    // Pecora d'oro e lupo
    // ------------------------------------------------------------------
    updateGold(dt) {
      // nuovo gregge quando quasi tutte le pecore sono già nei recinti
      const free = this.sheep.filter((s) => s.pen < 0).length + this.respawnQueue.length;
      if (this.waveT > 0) {
        this.waveT -= dt;
        if (this.waveT <= 0) {
          const open = this.map.open().filter((t) => t.tx > 14 && t.tx < S.COLS - 15);
          const n = Math.min(S.WAVE_SIZE, S.MAX_SHEEP - this.sheep.length);
          for (let i = 0; i < n; i++) {
            this.addSheep(open, false);
            const sh = this.sheep[this.sheep.length - 1];
            this.puff(sh.x, sh.y, '#ffffff');
          }
          this.emit('sfx', 'baa');
        }
      } else if (free <= S.WAVE_MIN_FREE && this.sheep.length < S.MAX_SHEEP && this.time > 8) {
        this.waveT = 2;
        this.showBanner('NUOVO GREGGE!', '#ffffff', 1.6);
        this.emit('sfx', 'golden');
      }
      this.goldTimer -= dt;
      for (const r of this.respawnQueue) r.t -= dt;
      const ready = this.respawnQueue.filter((r) => r.t <= 0);
      this.respawnQueue = this.respawnQueue.filter((r) => r.t > 0);
      const open = this.map.open().filter((t) => t.tx > 14 && t.tx < S.COLS - 15);
      for (const r of ready) {
        this.addSheep(open, r.golden);
        const s = this.sheep[this.sheep.length - 1];
        this.puff(s.x, s.y, '#ffffff');
        this.emit('sfx', 'baa');
      }
      if (this.goldTimer <= 0) {
        this.goldTimer = S.GOLDEN_EVERY;
        const loose = this.sheep.filter((s) => s.golden && s.pen < 0).length;
        if (!loose) {
          this.addSheep(open, true);
          const s = this.sheep[this.sheep.length - 1];
          this.puff(s.x, s.y, '#ffe14a');
          this.floatText(s.x, s.y - 14, 'PECORA D\'ORO!', '#ffe14a');
          this.emit('sfx', 'golden');
        }
      }
    }

    updateWolf(dt) {
      this.wolfTimer -= dt;
      if (!this.wolf && this.wolfTimer <= 0 && this.time > 12) {
        this.wolfTimer = S.WOLF_EVERY;
        // entra da metà di uno dei quattro lati (lontano dai recinti negli angoli)
        const side = Math.floor(Math.random() * 4);
        const open = this.map.open().filter((t) => (side === 0 ? t.ty <= 2 && t.tx > 14 && t.tx < S.COLS - 15
          : side === 1 ? t.ty >= S.ROWS - 3 && t.tx > 14 && t.tx < S.COLS - 15
            : side === 2 ? t.tx <= 2 && t.ty > 8 && t.ty < S.ROWS - 9
              : t.tx >= S.COLS - 3 && t.ty > 8 && t.ty < S.ROWS - 9));
        const at = open.length ? open[Math.floor(Math.random() * open.length)] : { x: S.MAP_W / 2, y: 12 };
        this.wolf = {
          x: at.x, y: at.y, vx: 0, vy: 0, life: S.WOLF_LIFE, leaving: false, left: at.x > S.MAP_W / 2, walkT: 0,
          target: null, retarget: 0, eaten: 0, scares: 0, scaredBy: null,
          retreatT: 0, lungeT: 0, lungeCd: 1.2, recoverT: 0, lungeDx: 0, lungeDy: 0, phase: rand(0, 6),
        };
        this.showBanner('ARRIVA IL LUPO!', '#ff3b3b', 1.6);
        this.emit('sfx', 'howl');
        this.shake = 2;
      }
      const w = this.wolf;
      if (!w) return;
      w.life -= dt;
      if (w.life <= 0) w.leaving = true;
      w.retreatT = Math.max(0, w.retreatT - dt);
      const wasLunging = w.lungeT > 0;
      w.lungeT = Math.max(0, w.lungeT - dt);
      w.lungeCd = Math.max(0, w.lungeCd - dt);
      w.recoverT = Math.max(0, w.recoverT - dt);
      if (wasLunging && w.lungeT === 0) w.recoverT = 0.7;   // fine dello scatto: riprende fiato

      let vx = 0, vy = 0, anim = 1.5;
      if (w.leaving) {
        // scappa verso il bordo più vicino in alto/basso
        let tx = w.x; const ty = w.y < S.MAP_H / 2 ? -20 : S.MAP_H + 20;
        if (w.scaredBy) tx = w.x + (w.x - w.scaredBy.x) * 2;
        const dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy) || 1;
        vx = dx / d * S.WOLF_SPEED * 1.5; vy = dy / d * S.WOLF_SPEED * 1.5; anim = 2.2;
      } else if (w.retreatT > 0 && w.scaredBy) {
        // spaventato da un abbaio: indietreggia di corsa, ma poi torna a caccia
        const dx = w.x - w.scaredBy.x, dy = w.y - w.scaredBy.y, d = Math.hypot(dx, dy) || 1;
        vx = dx / d * S.WOLF_SPEED * 1.4; vy = dy / d * S.WOLF_SPEED * 1.4; anim = 2.2;
      } else if (w.lungeT > 0) {
        // SCATTO: breve, veloce e dritto (le pecore non scappano abbastanza in fretta)
        vx = w.lungeDx * S.WOLF_LUNGE_SPEED; vy = w.lungeDy * S.WOLF_LUNGE_SPEED; anim = 3.2;
        if (Math.random() < 0.6) this.particles.push({ x: w.x, y: w.y, z: 0, vx: rand(-12, 12), vy: rand(-6, 6), vz: 20, life: 0.3, color: '#8a7a68' });
      } else if (w.recoverT > 0) {
        // dopo lo scatto (o dopo aver mangiato) riprende fiato: quasi fermo
        vx = w.vx * 0.2; vy = w.vy * 0.2; anim = 0.6;
      } else {
        // caccia: sceglie una preda (meglio se è portata da un cane o se è d'oro) e la insegue a zig-zag
        w.retarget -= dt;
        if (!w.target || w.retarget <= 0 || this.sheep.indexOf(w.target) < 0 || w.target.pen >= 0) {
          w.target = this.pickWolfTarget(w);
          w.retarget = 1.2;
        }
        const t = w.target;
        if (t) {
          const dx = t.x - w.x, dy = t.y - w.y, dist = Math.hypot(dx, dy) || 1;
          if (dist < S.WOLF_LUNGE_R && w.lungeCd <= 0) {
            // parte lo scatto, mirando un po' avanti rispetto a dove sta andando la pecora
            const lx = t.x + t.vx * 0.25 - w.x, ly = t.y + t.vy * 0.25 - w.y, ld = Math.hypot(lx, ly) || 1;
            w.lungeDx = lx / ld; w.lungeDy = ly / ld;
            w.lungeT = S.WOLF_LUNGE_TIME; w.lungeCd = S.WOLF_LUNGE_CD;
            this.floatText(w.x, w.y - 16, 'GRRR!', '#ff5a5a');
            this.emit('sfx', 'dash');
          } else {
            const nx = dx / dist, ny = dy / dist;
            const zig = Math.sin(this.clock * 4 + w.phase) * 0.55;   // zig-zag da predatore
            vx = (nx - ny * zig) * S.WOLF_SPEED; vy = (ny + nx * zig) * S.WOLF_SPEED;
          }
        } else {
          // niente pecore libere: gironzola verso il centro
          const dx = S.MAP_W / 2 - w.x, dy = S.MAP_H / 2 - w.y, d = Math.hypot(dx, dy) || 1;
          vx = dx / d * S.WOLF_SPEED * 0.6; vy = dy / d * S.WOLF_SPEED * 0.6;
        }
      }
      w.vx = vx; w.vy = vy;
      if (w.leaving) { w.x += vx * dt; w.y += vy * dt; } else this.move(w, vx * dt, vy * dt, 3);
      if (Math.abs(vx) > 2) w.left = vx < 0;
      w.walkT += dt * anim;

      // mangia la pecora libera che ha a tiro (non quando scappa)
      if (!w.leaving && w.retreatT <= 0) {
        for (const s of this.sheep) {
          if (s.pen >= 0) continue;
          if (Math.hypot(s.x - w.x, s.y - w.y) < 6) { this.eat(s); break; }
        }
      }
      if (this.wolf && w.leaving && (w.y < -16 || w.y > S.MAP_H + 16 || w.x < -16 || w.x > S.MAP_W + 16)) this.wolf = null;
    }

    pickWolfTarget(w) {
      let best = null, bs = 1e9;
      for (const s of this.sheep) {
        if (s.pen >= 0) continue;
        let score = Math.hypot(s.x - w.x, s.y - w.y) + rand(0, 14);
        if (s.followDog) score -= 40;      // le pecore che un cane sta portando a casa sono le più ghiotte
        if (s.golden) score -= 35;
        if (score < bs) { bs = score; best = s; }
      }
      return best;
    }

    eat(s) {
      const w = this.wolf;
      this.sheep.splice(this.sheep.indexOf(s), 1);
      this.respawnQueue.push({ t: S.SHEEP_RESPAWN, golden: false });
      this.puff(s.x, s.y, s.golden ? '#ffe14a' : '#ffffff');
      this.floatText(s.x, s.y - 12, 'GNAM!', '#ff5a5a');
      this.emit('sfx', 'chomp');
      this.shake = 2;
      w.eaten++;
      w.target = null; w.lungeT = 0;
      // dopo il pasto si ferma a masticare; con la pancia piena se ne va
      if (w.eaten >= S.WOLF_MAX_EAT) w.leaving = true; else w.recoverT = 1;
    }

    // ------------------------------------------------------------------
    end() {
      if (this.state === 'over') return;
      this.state = 'over';
      for (const s of this.sheep) { s.followDog = null; }
      this.showBanner('TEMPO!', '#ffd23b', 2);
      this.emit('sfx', 'whistle');
      this.emit('music', false);
      this.emit('over', this.ranking());
    }
    ranking() {
      return this.dogs.slice().sort((a, b) => b.score - a.score || a.slot - b.slot);
    }

    // ------------------------------------------------------------------
    showBanner(text, color, dur) { this.banner = { text, color, t: 0, dur }; }
    floatText(x, y, text, color) { this.texts.push({ x, y, text, color, t: 0, dur: 0.9 }); }
    puff(x, y, color) {
      for (let i = 0; i < 12; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(20, 50);
        this.particles.push({ x, y, z: 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: rand(30, 70), life: rand(0.4, 0.8), color, big: true });
      }
    }
  }

  window.SheepGame = SheepGame;
})();
