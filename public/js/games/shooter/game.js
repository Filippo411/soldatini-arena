/**
 * Simulazione della partita (gira tutta sullo schermo host).
 *
 * Coordinate: pixel della mappa (0..384 x 0..192). La posizione di un
 * soldatino è quella dei suoi PIEDI; i proiettili viaggiano sul "pavimento"
 * e vengono solo disegnati un po' più in alto (altezza del fucile).
 *
 * La classe non disegna nulla e non suona nulla: comunica con l'esterno
 * tramite this.emit(tipo, dati) — ci pensa host.js a trasformare gli eventi
 * in suoni, vibrazioni sui telefoni, ecc.
 */
(function () {
  'use strict';
  const C = CFG;
  const { T, TILE } = C;

  const rand = (a, b) => a + Math.random() * (b - a);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  class Soldier {
    constructor(def) {
      this.slot = def.slot;             // 0..3 => colore
      this.name = def.name;
      this.isBot = !!def.isBot;
      this.cid = def.cid || null;       // id del telefono
      this.connected = true;
      this.kills = 0;
      this.deaths = 0;
      this.input = { x: 0, y: 0, fire: false, pow: false };
      this.bot = null;                  // stato dell'intelligenza artificiale
      this.reset();
    }
    reset() {
      this.x = 0; this.y = 0;
      this.face = 0;                    // angolo di mira (radianti)
      this.moving = false;
      this.ammo = C.MAX_AMMO;
      this.power = null;
      this.flashT = 0;
      this.shieldT = 0;
      this.shieldHits = 0;
      this.dead = false;
      this.deadT = 0;
      this.respawnT = 0;
      this.protectT = 0;
      this.cooldown = 0;
      this.muzzleT = 0;
      this.walkT = 0;
      this.streak = 0;
      this.z = 0; this.vz = 0; this.spin = 0; this.dvx = 0; this.dvy = 0;
      this.trail = [];
      this.emptyShown = 0;
      this.hurtT = 0;
      this.moveFace = undefined; // ultima direzione di camminata
      this.faceLockT = 0;
      this.faceHist = [];
    }
    get alive() { return !this.dead; }
  }

  class Game {
    /**
     * @param {Array<{slot,name,isBot,cid}>} defs giocatori
     * @param {(type:string, data:any)=>void} emit
     */
    constructor(defs, emit) {
      this.emit = emit || (() => {});
      this.map = MapGen.generate();
      this.mapCanvas = Sprites.renderMap(this.map);
      this.soldiers = defs.map((d) => new Soldier(d));
      this.bullets = [];
      this.grenades = [];
      this.pickups = [];
      this.particles = [];
      this.blasts = [];         // esplosioni da disegnare
      this.pending = [];        // esplosioni a catena in attesa
      this.texts = [];          // scritte che fluttuano (es. "+10")
      this.banner = null;       // scritta grande al centro
      this.feed = [];           // elenco eliminazioni recenti
      this.shake = 0;
      this.flashScreen = 0;
      this.state = 'countdown';
      this.countdown = 3.999;
      this.time = C.MATCH_TIME;
      this.suddenDeath = false;
      this.firstBlood = false;
      this.ammoTimer = 0;
      this.powerTimer = 0;
      this.clock = 0;
      this.winner = null;
      this.lastTick = 4;

      // Partenza: ogni soldatino nel proprio angolo
      this.soldiers.forEach((s, i) => {
        const sp = this.map.spawns[i % 4];
        s.x = sp.x; s.y = sp.y;
        s.face = sp.x < C.MAP_W / 2 ? 0 : Math.PI;
        s.protectT = C.SPAWN_PROTECT;
      });
      // Qualche oggetto già presente all'inizio
      for (let i = 0; i < 2; i++) this.spawnPickup('ammo');
      this.spawnPickup(this.randomPower());
      this.spawnPickup(this.randomPower());
    }

    randomPower() { return C.POWER_TYPES[Math.floor(Math.random() * C.POWER_TYPES.length)]; }

    // ------------------------------------------------------------------
    // Ciclo principale
    // ------------------------------------------------------------------
    update(dt) {
      this.clock += dt;
      this.shake = Math.max(0, this.shake - dt * 10);
      this.flashScreen = Math.max(0, this.flashScreen - dt * 4);

      if (this.state === 'countdown') {
        this.countdown -= dt;
        const n = Math.ceil(this.countdown);
        if (n !== this.lastTick && n >= 1 && n <= 3) { this.lastTick = n; this.emit('sfx', 'beep'); }
        if (this.countdown <= 0) {
          this.state = 'play';
          this.showBanner('MISSION START!', '#ffd23b', 1.6);
          this.emit('sfx', 'go');
          this.emit('sfx', 'start_jingle');
          this.emit('announce', 'Mission start!');
          this.emit('music', true);
        }
        // durante il conto alla rovescia ci si può già girare, ma non muovere
        for (const s of this.soldiers) {
          if (s.isBot) continue;
          if (Math.hypot(s.input.x, s.input.y) > 0.3) s.face = Math.atan2(s.input.y, s.input.x);
        }
      } else if (this.state === 'play') {
        const before = Math.ceil(this.time);
        this.time = Math.max(0, this.time - dt);
        const after = Math.ceil(this.time);
        if (before !== after) {
          if (after === 30) { this.showBanner('30 SECONDI!', '#ff9c3b', 1.4); this.emit('announce', 'Thirty seconds!'); }
          if (after <= 5 && after > 0) this.emit('sfx', 'tick');
        }
        for (const s of this.soldiers) {
          if (s.isBot && s.alive) Bots.think(this, s, dt);
          this.updateSoldier(s, dt);
        }
        this.separateSoldiers();
        this.updatePickups(dt);
        if (this.time <= 0 && this.state === 'play') this.checkTimeUp();
      }

      if (this.state !== 'countdown') {
        this.updateBullets(dt);
        this.updateGrenades(dt);
      }
      // anche a partita finita lasciamo finire morti ed effetti
      if (this.state === 'over') for (const s of this.soldiers) this.updateDeath(s, dt);
      this.updatePending(dt);
      this.updateParticles(dt);
      this.updateTexts(dt);
    }

    // ------------------------------------------------------------------
    // Soldatini
    // ------------------------------------------------------------------
    updateSoldier(s, dt) {
      s.hurtT = Math.max(0, s.hurtT - dt);
      if (s.dead) {
        this.updateDeath(s, dt);
        s.respawnT -= dt;
        if (s.respawnT <= 0) this.respawn(s);
        return;
      }
      s.protectT = Math.max(0, s.protectT - dt);
      s.cooldown -= dt;
      s.muzzleT = Math.max(0, s.muzzleT - dt);
      s.emptyShown = Math.max(0, s.emptyShown - dt);
      if (s.flashT > 0) s.flashT = Math.max(0, s.flashT - dt);
      if (s.shieldT > 0) { s.shieldT = Math.max(0, s.shieldT - dt); if (s.shieldT === 0) s.shieldHits = 0; }

      const inp = s.connected || s.isBot ? s.input : { x: 0, y: 0, fire: false, pow: false };
      s.faceLockT = Math.max(0, (s.faceLockT || 0) - dt);

      // --- Movimento ---
      // Curva del joystick: piccola zona morta, poi si arriva presto a piena velocità
      let mag = Math.hypot(inp.x, inp.y);
      const wasMoving = s.moving;
      s.moving = mag > C.STICK_DEADZONE;
      if (s.moving) {
        const ang = Math.atan2(inp.y, inp.x);
        const k = Math.min(1, (mag - C.STICK_DEADZONE) / (C.STICK_FULL - C.STICK_DEADZONE));
        const sp = C.SPEED * (0.5 + 0.5 * k) * (s.flashT > 0 ? C.FLASH_MULT : 1);
        this.moveSoldier(s, Math.cos(ang) * sp * dt, Math.sin(ang) * sp * dt);
        s.walkT += dt * (s.flashT > 0 ? 1.8 : 1);
        // memoria della direzione: quando si molla il joystick il pollice "sbanda",
        // quindi teniamo la direzione di un attimo prima
        s.faceHist = s.faceHist || [];
        s.faceHist.push({ t: this.clock, a: ang });
        while (s.faceHist.length && this.clock - s.faceHist[0].t > 0.15) s.faceHist.shift();
        s.moveFace = ang;
      } else if (wasMoving && s.faceHist && s.faceHist.length) {
        s.moveFace = s.faceHist[0].a;
        s.faceHist = [];
      }

      // --- Direzione in cui si guarda (e si spara) ---
      //  1. stick di mira attivo (telefono) -> si guarda dove si mira
      //  2. subito dopo un colpo mirato -> resta girato da quella parte un attimo
      //  3. altrimenti -> direzione di camminata
      if (inp.aimStick != null) s.face = inp.aimStick;
      else if (inp.powStick != null) s.face = inp.powStick;
      else if (inp.aim !== undefined && !s.moving) s.face = inp.aim; // bot che mirano da fermi
      else if (s.faceLockT <= 0 && s.moveFace !== undefined) s.face = s.moveFace;

      // scia del Flash
      if (s.flashT > 0) {
        s.trail.push({ x: s.x, y: s.y, left: Math.cos(s.face) < 0, life: 0.25 });
      }
      for (const t of s.trail) t.life -= dt;
      s.trail = s.trail.filter((t) => t.life > 0);

      // --- Sparo ---
      // fireTap: un tocco rapidissimo sul telefono spara comunque un colpo
      // shot: colpo singolo dallo stick di mira (angolo = dove mirava, null = dove cammina)
      if (inp.shot && s.cooldown <= 0) {
        if (inp.shot.a != null) { s.face = inp.shot.a; s.faceLockT = 0.35; }
        inp.shot = null;
        this.shoot(s);
      } else if ((inp.fire || inp.fireTap) && s.cooldown <= 0) { inp.fireTap = false; this.shoot(s); }

      // --- Powerup ---
      if (inp.pow) {
        const p = inp.pow;
        inp.pow = false;
        // dallo stick: direzione e forza del lancio (granata)
        if (typeof p === 'object' && p.a != null) { s.face = p.a; s.faceLockT = 0.35; }
        this.usePower(s, typeof p === 'object' ? p.m : null);
      }

      // --- Raccolta oggetti ---
      for (const p of this.pickups) {
        if (p.dead || Math.hypot(p.x - s.x, p.y - s.y) > 8) continue;
        if (p.type === 'ammo') {
          if (s.ammo >= C.MAX_AMMO) continue;
          s.ammo = C.MAX_AMMO;
          p.dead = true;
          this.floatText(s.x, s.y - 20, '+10', '#ffd23b');
          this.emit('sfx', 'pickup_ammo');
          this.emit('buzz', { s, pattern: [40] });
        } else {
          if (s.power) continue;
          s.power = p.type;
          p.dead = true;
          const label = { flash: 'FLASH!', grenade: 'GRANATA!', shield: 'SCUDO!' }[p.type];
          this.floatText(s.x, s.y - 20, label, '#5ff2ff');
          this.emit('sfx', 'pickup_power');
          this.emit('buzz', { s, pattern: [30, 40, 30] });
        }
        this.sparkle(p.x, p.y, p.type === 'ammo' ? '#ffd23b' : '#5ff2ff');
        this.emit('hud', s);
      }
    }

    /** Il box ai piedi tocca un ostacolo? */
    collides(x, y) {
      const h = C.HALF, m = this.map;
      return m.solidMove(x - h, y - h) || m.solidMove(x + h - 0.01, y - h) ||
             m.solidMove(x - h, y + h - 0.01) || m.solidMove(x + h - 0.01, y + h - 0.01);
    }

    /** Movimento con scivolamento sugli spigoli (più piacevole da controllare) */
    moveSoldier(s, dx, dy) {
      if (!this.collides(s.x + dx, s.y)) s.x += dx;
      else if (Math.abs(dx) > 0.01 && Math.abs(dy) < Math.abs(dx) * 0.7) {
        for (const n of [1, -1, 2, -2, 3, -3, 4, -4]) {
          if (!this.collides(s.x + dx, s.y + n)) { if (!this.collides(s.x, s.y + Math.sign(n) * Math.abs(dx))) s.y += Math.sign(n) * Math.abs(dx); break; }
        }
      }
      if (!this.collides(s.x, s.y + dy)) s.y += dy;
      else if (Math.abs(dy) > 0.01 && Math.abs(dx) < Math.abs(dy) * 0.7) {
        for (const n of [1, -1, 2, -2, 3, -3, 4, -4]) {
          if (!this.collides(s.x + n, s.y + dy)) { if (!this.collides(s.x + Math.sign(n) * Math.abs(dy), s.y)) s.x += Math.sign(n) * Math.abs(dy); break; }
        }
      }
    }

    /** I soldatini non si sovrappongono: piccola spinta reciproca */
    separateSoldiers() {
      const list = this.soldiers.filter((s) => s.alive);
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d > 0.01 && d < 7) {
          const push = (7 - d) / 2, nx = dx / d, ny = dy / d;
          this.moveSoldier(a, -nx * push, -ny * push);
          this.moveSoldier(b, nx * push, ny * push);
        }
      }
    }

    shoot(s) {
      if (s.ammo <= 0) {
        s.cooldown = 0.45;
        if (s.emptyShown <= 0) {
          this.floatText(s.x, s.y - 22, 'NO AMMO', '#ff5a5a');
          s.emptyShown = 1.2;
          this.emit('buzz', { s, pattern: [15, 30, 15] });
        }
        this.emit('sfx', 'empty');
        return;
      }
      s.ammo--;
      s.cooldown = C.FIRE_COOLDOWN + (s.isBot ? s.bot.extraCooldown : 0);
      s.muzzleT = 0.07;
      const cx = Math.cos(s.face), cy = Math.sin(s.face);
      const sx = s.x + cx * 7, sy = s.y + cy * 7;
      // se la canna "entra" nel muro, il colpo si ferma subito
      if (this.map.lineOfSight(s.x, s.y, sx, sy) && !this.map.solidShot(sx, sy)) {
        this.bullets.push({ x: sx, y: sy, vx: cx * C.BULLET_SPEED, vy: cy * C.BULLET_SPEED, owner: s, life: C.BULLET_LIFE });
      } else {
        this.sparks(sx, sy, 4, '#fff1a0');
        this.hitTile(sx, sy, s);
      }
      // bossolo che vola via di lato
      this.particles.push({
        kind: 'casing', x: s.x, y: s.y, z: 9, vx: -cy * rand(20, 40) - cx * 10, vy: cx * rand(20, 40) * 0.6 - cy * 10, vz: rand(50, 80),
        life: 1.2, max: 1.2, color: '#ffd23b', g: 260, bounce: 0.4,
      });
      this.emit('sfx', 'shot');
      this.emit('hud', s);
    }

    usePower(s, throwMag) {
      if (!s.power || s.dead) return;
      const p = s.power;
      s.power = null;
      if (p === 'flash') {
        s.flashT = C.FLASH_TIME;
        this.emit('sfx', 'flash');
        this.floatText(s.x, s.y - 22, 'FLASH!', '#ffe14a');
      } else if (p === 'shield') {
        s.shieldT = C.SHIELD_TIME;
        s.shieldHits = 1;
        this.emit('sfx', 'shield');
        this.floatText(s.x, s.y - 22, 'SCUDO!', '#5ff2ff');
      } else if (p === 'grenade') {
        this.grenades.push(this.newGrenade(s, s.face, throwMag));
        this.emit('sfx', 'throw');
      }
      this.emit('hud', s);
    }

    /**
     * Colpisce un soldatino. Lo scudo assorbe un colpo.
     * @returns {boolean} true se il colpo è andato a segno (anche solo sullo scudo)
     */
    hit(victim, attacker, cause) {
      if (victim.dead || victim.protectT > 0 || this.state !== 'play') return false;
      if (victim.shieldT > 0 && victim.shieldHits > 0) {
        victim.shieldHits = 0;
        victim.shieldT = 0;
        victim.hurtT = 0.3;
        this.sparks(victim.x, victim.y - 6, 14, '#5ff2ff');
        this.floatText(victim.x, victim.y - 22, 'SCUDO ROTTO!', '#5ff2ff');
        this.emit('sfx', 'hit_shield');
        this.emit('buzz', { s: victim, pattern: [80] });
        this.emit('hud', victim);
        return true;
      }
      // --- Eliminazione! ---
      victim.dead = true;
      victim.deadT = 0;
      victim.respawnT = C.RESPAWN_TIME;
      victim.deaths++;
      victim.streak = 0;
      victim.power = null;
      victim.flashT = 0; victim.shieldT = 0; victim.shieldHits = 0;
      victim.trail = [];
      // morte esagerata: il soldatino salta in aria girando
      victim.z = 0; victim.vz = 170;
      const away = attacker && attacker !== victim ? Math.atan2(victim.y - attacker.y, victim.x - attacker.x) : rand(0, Math.PI * 2);
      victim.dvx = Math.cos(away) * 30; victim.dvy = Math.sin(away) * 30;
      victim.spin = 0;
      this.stars(victim.x, victim.y - 8);
      this.shake = Math.max(this.shake, 2);
      this.emit('sfx', 'death');
      this.emit('buzz', { s: victim, pattern: [200, 60, 120] });

      if (attacker && attacker !== victim) {
        attacker.kills++;
        attacker.streak++;
        if (!this.firstBlood) {
          this.firstBlood = true;
          this.showBanner('FIRST BLOOD!', '#ff3b3b', 1.3);
          this.emit('announce', 'First blood!');
        } else if (attacker.streak === 3) {
          this.showBanner('GREAT!', C.PLAYERS[attacker.slot].color, 1.2);
          this.emit('announce', 'Great!');
        } else if (attacker.streak === 5) {
          this.showBanner('EXCELLENT!', C.PLAYERS[attacker.slot].color, 1.3);
          this.emit('announce', 'Excellent!');
        } else if (attacker.streak >= 7 && attacker.streak % 2 === 1) {
          this.showBanner('INARRESTABILE!', C.PLAYERS[attacker.slot].color, 1.3);
          this.emit('announce', 'Unstoppable!');
        }
        if (attacker.kills === C.KILLS_TO_WIN - 1) this.floatText(attacker.x, attacker.y - 30, 'ULTIMO!', '#ffffff');
        this.floatText(attacker.x, attacker.y - 22, '+1', C.PLAYERS[attacker.slot].light);
        this.feed.unshift({ a: attacker.slot, an: attacker.name, v: victim.slot, vn: victim.name, cause, t: 4 });
        this.emit('buzz', { s: attacker, pattern: [30] });
        this.emit('hud', attacker);
      } else {
        // autoeliminazione (es. propria granata): -1
        victim.kills = Math.max(0, victim.kills - 1);
        this.feed.unshift({ a: victim.slot, an: victim.name, v: victim.slot, vn: victim.name, cause: 'self', t: 4 });
        this.floatText(victim.x, victim.y - 22, 'OOPS! -1', '#ffffff');
      }
      if (this.feed.length > 4) this.feed.length = 4;
      this.emit('hud', victim);

      if (attacker && attacker !== victim && attacker.kills >= C.KILLS_TO_WIN) this.endMatch(attacker);
      else if (this.suddenDeath) this.checkTimeUp();
      return true;
    }

    updateDeath(s, dt) {
      if (!s.dead) return;
      s.deadT += dt;
      if (s.z > 0 || s.vz > 0) {
        s.vz -= 420 * dt;
        s.z += s.vz * dt;
        s.spin += dt * 14;
        const nx = s.x + s.dvx * dt, ny = s.y + s.dvy * dt;
        if (!this.collides(nx, s.y)) s.x = nx;
        if (!this.collides(s.x, ny)) s.y = ny;
        if (s.z <= 0) {
          s.z = 0;
          if (s.vz < -60) { s.vz = -s.vz * 0.35; this.dust(s.x, s.y); } else { s.vz = 0; }
        }
      }
    }

    respawn(s) {
      const pt = this.farPoint(s);
      const kills = s.kills, deaths = s.deaths, streak = 0;
      const input = s.input, bot = s.bot, connected = s.connected;
      s.reset();
      Object.assign(s, { kills, deaths, streak, input, bot, connected, x: pt.x, y: pt.y });
      s.face = pt.x < C.MAP_W / 2 ? 0 : Math.PI;
      s.protectT = C.SPAWN_PROTECT;
      this.sparkle(s.x, s.y - 6, C.PLAYERS[s.slot].color);
      this.emit('sfx', 'respawn');
      this.emit('hud', s);
    }

    /** Punto libero il più lontano possibile dagli avversari vivi */
    farPoint(self) {
      const open = this.map.openTiles();
      const enemies = this.soldiers.filter((o) => o !== self && o.alive);
      let best = open[0], bestScore = -1;
      for (let i = 0; i < 70; i++) {
        const p = open[Math.floor(Math.random() * open.length)];
        if (this.collides(p.x, p.y)) continue;
        let d = 1000;
        for (const e of enemies) d = Math.min(d, Math.hypot(e.x - p.x, e.y - p.y));
        for (const g of this.grenades) d = Math.min(d, Math.hypot(g.x - p.x, g.y - p.y) + 20);
        if (d > bestScore) { bestScore = d; best = p; }
      }
      return best;
    }

    // ------------------------------------------------------------------
    // Proiettili, granate, esplosioni
    // ------------------------------------------------------------------
    updateBullets(dt) {
      for (const b of this.bullets) {
        b.life -= dt;
        const steps = Math.ceil((Math.hypot(b.vx, b.vy) * dt) / 2);
        for (let i = 0; i < steps && b.life > 0; i++) {
          b.x += (b.vx * dt) / steps;
          b.y += (b.vy * dt) / steps;
          if (this.map.solidShot(b.x, b.y)) {
            b.life = 0;
            this.sparks(b.x - b.vx * 0.01, b.y - b.vy * 0.01, 5, '#fff1a0');
            this.hitTile(b.x, b.y, b.owner);
            break;
          }
          for (const s of this.soldiers) {
            if (s === b.owner || s.dead) continue;
            if (Math.hypot(s.x - b.x, s.y - 2 - b.y) < C.HIT_R) {
              if (s.protectT > 0) { b.life = 0; this.sparks(b.x, b.y, 3, '#ffffff'); break; }
              if (this.hit(s, b.owner, 'gun')) { b.life = 0; break; }
            }
          }
        }
      }
      this.bullets = this.bullets.filter((b) => b.life > 0);
    }

    /** Un colpo ha toccato una casella: i barili esplodono! */
    hitTile(x, y, owner) {
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      if (this.map.grid[ty] && this.map.grid[ty][tx] === T.BARREL) this.explodeBarrel(tx, ty, owner, 0);
    }

    explodeBarrel(tx, ty, owner, delay) {
      if (this.map.grid[ty][tx] !== T.BARREL) return;
      this.map.grid[ty][tx] = T.FLOOR;
      Sprites.redrawTile(this.mapCanvas, this.map, tx, ty);
      this.pending.push({ x: tx * TILE + 4, y: ty * TILE + 4, r: C.BARREL_R, owner, delay, kind: 'barrel' });
    }

    updateGrenades(dt) {
      for (const g of this.grenades) {
        g.t += dt;
        g.spin += dt * 15;
        const r = this.stepGrenade(g, dt);
        if (r.bounced) this.emit('sfx', 'bounce');
        let boom = g.t >= C.GRENADE_FUSE;
        // impatto contro un ostacolo
        if (r.wall) { boom = true; this.hitTile(r.wx, r.wy, g.owner); }
        // impatto contro un soldatino (non il lanciatore nei primi istanti)
        for (const s of this.soldiers) {
          if (s.dead || (s === g.owner && g.t < 0.4)) continue;
          if (Math.hypot(s.x - g.x, s.y - 2 - g.y) < 6 && g.z < 12) boom = true;
        }
        if (boom) {
          g.done = true;
          this.explode(g.x, g.y, C.BLAST_R, g.owner, 'grenade');
        }
      }
      this.grenades = this.grenades.filter((g) => !g.done);
    }

    /**
     * Fisica della granata per un passo: volo con attrito e rimbalzi sull'altezza z.
     * Usata sia dalla granata vera sia dall'anteprima della traiettoria mentre si mira.
     */
    stepGrenade(g, dt) {
      const out = { bounced: false, wall: false };
      g.vz -= 300 * dt;
      g.z += g.vz * dt;
      if (g.z <= 0) {
        g.z = 0;
        if (g.vz < -25) { g.vz = -g.vz * 0.45; out.bounced = true; } else g.vz = 0;
        g.vx *= 0.9; g.vy *= 0.9;
      }
      const f = Math.pow(0.4, dt);
      g.vx *= f; g.vy *= f;
      const nx = g.x + g.vx * dt, ny = g.y + g.vy * dt;
      if (this.map.solidShot(nx, ny)) { out.wall = true; out.wx = nx; out.wy = ny; }
      else { g.x = nx; g.y = ny; }
      return out;
    }

    /** Granata appena lanciata da s, con forza m (0..1, null = piena) */
    newGrenade(s, angle, m) {
      const cx = Math.cos(angle), cy = Math.sin(angle);
      const sp = C.GRENADE_SPEED * (m == null ? 1 : 0.35 + 0.65 * Math.max(0, Math.min(1, m)));
      return { x: s.x + cx * 4, y: s.y + cy * 4, z: 8, vx: cx * sp, vy: cy * sp, vz: 70, t: 0, owner: s, spin: 0 };
    }

    /** Anteprima della traiettoria: elenco di punti {x,y,z} fino allo scoppio */
    predictGrenade(s, angle, m) {
      const g = this.newGrenade(s, angle, m);
      const pts = [];
      const dt = 1 / 30;
      for (let t = 0; t < C.GRENADE_FUSE; t += dt) {
        g.t = t;
        if (this.stepGrenade(g, dt).wall) break;
        pts.push({ x: g.x, y: g.y, z: g.z });
      }
      return pts;
    }

    updatePending(dt) {
      for (const p of this.pending) {
        p.delay -= dt;
        if (p.delay <= 0) { p.done = true; this.explode(p.x, p.y, p.r, p.owner, p.kind); }
      }
      this.pending = this.pending.filter((p) => !p.done);
    }

    explode(x, y, r, owner, kind) {
      this.blasts.push({ x, y, r, t: 0, max: 0.55 });
      this.shake = Math.max(this.shake, kind === 'grenade' ? 5 : 4);
      this.flashScreen = 0.6;
      this.emit('sfx', 'explosion');
      this.emit('boom');
      Sprites.scorch(this.mapCanvas, this.map, x, y, Math.round(r * 0.55));
      // fumo, fuoco, detriti
      for (let i = 0; i < 26; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(10, 55);
        this.particles.push({
          kind: 'smoke', x: x + Math.cos(a) * rand(0, r * 0.4), y: y + Math.sin(a) * rand(0, r * 0.3), z: rand(0, 8),
          vx: Math.cos(a) * sp * 0.4, vy: Math.sin(a) * sp * 0.3, vz: rand(8, 30), life: rand(0.7, 1.6), max: 1.6,
          size: rand(2, 5), g: -5,
        });
      }
      for (let i = 0; i < 22; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(40, 130);
        this.particles.push({
          kind: 'debris', x, y, z: 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, vz: rand(60, 170),
          life: rand(0.6, 1.2), max: 1.2, color: ['#5a3a22', '#86703c', '#3a3830', '#c27a3a', '#1b1b26'][i % 5], g: 380, bounce: 0.3,
        });
      }
      for (let i = 0; i < 16; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(60, 150);
        this.particles.push({
          kind: 'spark', x, y, z: 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, vz: rand(20, 90),
          life: rand(0.2, 0.5), max: 0.5, color: i % 2 ? '#ffd23b' : '#ffffff', g: 200,
        });
      }
      // danno ai soldatini nel raggio (anche al lanciatore!)
      for (const s of this.soldiers) {
        if (s.dead) continue;
        if (Math.hypot(s.x - x, s.y - 3 - y) < r) this.hit(s, owner, kind);
      }
      // i barili vicini esplodono a catena
      const tr = Math.ceil(r / TILE);
      const cx = Math.floor(x / TILE), cy = Math.floor(y / TILE);
      for (let ty = cy - tr; ty <= cy + tr; ty++) for (let tx = cx - tr; tx <= cx + tr; tx++) {
        if (!this.map.grid[ty] || this.map.grid[ty][tx] !== T.BARREL) continue;
        if (Math.hypot(tx * TILE + 4 - x, ty * TILE + 4 - y) < r) this.explodeBarrel(tx, ty, owner, 0.15);
      }
    }

    // ------------------------------------------------------------------
    // Oggetti sulla mappa
    // ------------------------------------------------------------------
    updatePickups(dt) {
      for (const p of this.pickups) p.t += dt;
      this.pickups = this.pickups.filter((p) => !p.dead);
      const ammoCount = this.pickups.filter((p) => p.type === 'ammo').length;
      const powCount = this.pickups.length - ammoCount;
      this.ammoTimer += dt;
      this.powerTimer += dt;
      if (ammoCount < C.AMMO_MAX_ON_MAP && this.ammoTimer >= C.AMMO_RESPAWN) { this.ammoTimer = 0; this.spawnPickup('ammo'); }
      if (ammoCount >= C.AMMO_MAX_ON_MAP) this.ammoTimer = 0;
      if (powCount < C.POWER_MAX_ON_MAP && this.powerTimer >= C.POWER_RESPAWN) { this.powerTimer = 0; this.spawnPickup(this.randomPower()); }
      if (powCount >= C.POWER_MAX_ON_MAP) this.powerTimer = 0;
    }

    spawnPickup(type) {
      const open = this.map.openTiles();
      for (let i = 0; i < 60; i++) {
        const p = open[Math.floor(Math.random() * open.length)];
        if (this.collides(p.x, p.y)) continue;
        if (this.soldiers.some((s) => s.alive && Math.hypot(s.x - p.x, s.y - p.y) < 40)) continue;
        if (this.pickups.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 50)) continue;
        this.pickups.push({ x: p.x, y: p.y, type, t: 0 });
        this.sparkle(p.x, p.y, '#ffffff');
        return;
      }
    }

    // ------------------------------------------------------------------
    // Fine partita
    // ------------------------------------------------------------------
    checkTimeUp() {
      if (this.time > 0) return;
      const ranked = this.ranking();
      if (ranked.length < 2 || ranked[0].kills > ranked[1].kills) {
        this.endMatch(ranked[0]);
      } else if (!this.suddenDeath) {
        this.suddenDeath = true;
        this.showBanner('SUDDEN DEATH!', '#ff3b3b', 2);
        this.emit('announce', 'Sudden death!');
      }
    }

    ranking() {
      return this.soldiers.slice().sort((a, b) => b.kills - a.kills || a.deaths - b.deaths || a.slot - b.slot);
    }

    endMatch(winner) {
      if (this.state === 'over') return;
      this.state = 'over';
      this.winner = winner;
      this.bullets = [];
      for (const s of this.soldiers) s.input.fire = false;
      this.showBanner(this.time <= 0 ? 'TIME UP!' : 'MISSION COMPLETE!', '#ffd23b', 1.5);
      this.emit('music', false);
      this.emit('over', winner);
    }

    // ------------------------------------------------------------------
    // Effetti
    // ------------------------------------------------------------------
    showBanner(text, color, dur) { this.banner = { text, color, t: 0, dur: dur || 1.4 }; }

    floatText(x, y, text, color) { this.texts.push({ x, y, text, color, t: 0, dur: 0.9 }); }

    updateTexts(dt) {
      for (const t of this.texts) { t.t += dt; t.y -= dt * 14; }
      this.texts = this.texts.filter((t) => t.t < t.dur);
      if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
      for (const f of this.feed) f.t -= dt;
      this.feed = this.feed.filter((f) => f.t > 0);
      for (const b of this.blasts) b.t += dt;
      this.blasts = this.blasts.filter((b) => b.t < b.max);
    }

    sparks(x, y, n, color) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(30, 90);
        this.particles.push({ kind: 'spark', x, y, z: 7, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rand(10, 60), life: rand(0.1, 0.3), max: 0.3, color, g: 200 });
      }
    }

    sparkle(x, y, color) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        this.particles.push({ kind: 'spark', x, y, z: 4, vx: Math.cos(a) * 40, vy: Math.sin(a) * 30, vz: 30, life: 0.4, max: 0.4, color, g: 60 });
      }
    }

    stars(x, y) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        this.particles.push({ kind: 'star', x, y, z: 8, vx: Math.cos(a) * 55, vy: Math.sin(a) * 40, vz: 40, life: 0.6, max: 0.6, color: i % 2 ? '#ffffff' : '#ffd23b', g: 120 });
      }
    }

    dust(x, y) {
      for (let i = 0; i < 6; i++) {
        this.particles.push({ kind: 'smoke', x: x + rand(-4, 4), y, z: 0, vx: rand(-15, 15), vy: rand(-4, 4), vz: rand(5, 15), life: 0.5, max: 0.6, size: 2, g: 0, dusty: true });
      }
    }

    updateParticles(dt) {
      for (const p of this.particles) {
        p.life -= dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vz -= (p.g || 0) * dt;
        p.z += p.vz * dt;
        if (p.z < 0) {
          p.z = 0;
          if (p.bounce) { p.vz = -p.vz * p.bounce; p.vx *= 0.6; p.vy *= 0.6; } else { p.vz = 0; p.vx *= 0.8; p.vy *= 0.8; }
        }
        if (p.kind === 'smoke') { p.vx *= 0.97; p.vy *= 0.97; }
      }
      this.particles = this.particles.filter((p) => p.life > 0);
      if (this.particles.length > 600) this.particles.splice(0, this.particles.length - 600);
    }
  }

  window.Game = Game;
})();
