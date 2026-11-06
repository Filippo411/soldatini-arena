/**
 * THE BILLIONAIRE — regole del gioco (nessun disegno e nessuna rete qui dentro).
 *
 * Due modalità, stesse domande e stessi aiuti:
 *
 *  SFIDA   ('arena'): tutti contro tutti, fino a 8 giocatori. 10 domande, ognuno risponde
 *          dal suo telefono, chi ne indovina di più vince. Gli aiuti sono personali:
 *          ognuno ha i suoi 4, usabili una sola volta nell'intera partita.
 *
 *  SQUADRA ('team'): tutti insieme verso il milione. 15 domande, la risposta è quella più
 *          votata dai telefoni. I 4 aiuti sono della squadra e si attivano quando la
 *          maggioranza li chiede. Si sbaglia = si torna all'ultima soglia sicura.
 *
 * La classe comunica con l'esterno solo tramite la funzione emit(tipo, dati):
 *   'sfx' nome | 'music' on/off | 'buzz' {slot, pattern} | 'dirty' | 'over' {...}
 */
(function () {
  'use strict';
  const C = BILL_CFG;
  const LIFE_IDS = C.LIFE.map((l) => l.id);

  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // ------------------------------------------------------------------
  // Gli aiuti
  // ------------------------------------------------------------------

  /** 50/50: restano la risposta giusta e una sola sbagliata */
  function applyFifty(q, elim) {
    const wrongAlive = shuffle([0, 1, 2, 3].filter((i) => i !== q.c && !elim.includes(i)));
    return elim.concat(wrongAlive.slice(0, Math.max(0, wrongAlive.length - 1)));
  }

  /** Aiuto del pubblico: percentuali simulate. Più la domanda è difficile, più il pubblico sbaglia */
  function applyAudience(q, elim) {
    const alive = [0, 1, 2, 3].filter((i) => !elim.includes(i));
    const wrongAlive = alive.filter((i) => i !== q.c);
    const pRight = [0, 0.95, 0.85, 0.7][q.lvl];
    const leader = (!wrongAlive.length || Math.random() < pRight) ? q.c : pick(wrongAlive);
    let lead = leader === q.c ? [0, 55 + rnd(31), 45 + rnd(31), 35 + rnd(26)][q.lvl] : 35 + rnd(16);
    if (alive.length === 2) lead = Math.min(92, lead + 15);
    const p = [0, 0, 0, 0];
    p[leader] = lead;
    const others = alive.filter((i) => i !== leader);
    const w = others.map(() => 0.3 + Math.random());
    const sum = w.reduce((a, b) => a + b, 0) || 1;
    others.forEach((o, k) => { p[o] = Math.round((100 - lead) * w[k] / sum); });
    p[leader] += 100 - p.reduce((a, b) => a + b, 0);   // il totale fa sempre 100
    return p;
  }

  const SURE = ['SONO SICURO: È LA', 'NON HO DUBBI, È LA', 'LO SO, È LA'];
  const MID = ['PROPENDO PER LA', 'SECONDO ME È LA', 'MI SEMBRA LA'];
  const LOW = ['NON SONO SICURO... FORSE LA', 'AZZARDO LA', 'TIRO A INDOVINARE: LA'];

  /** Telefonata a casa: l'amico a volte ci prende, a volte no (e non sempre è sicuro) */
  function applyFriend(q, elim) {
    const wrongAlive = [0, 1, 2, 3].filter((i) => i !== q.c && !elim.includes(i));
    const right = !wrongAlive.length || Math.random() < [0, 0.92, 0.78, 0.6][q.lvl];
    const choice = right ? q.c : pick(wrongAlive);
    const conf = right ? [null, [0.7, 0.25], [0.45, 0.4], [0.25, 0.4]][q.lvl] : [0.25, 0.45];
    const r = Math.random();
    const phrase = pick(r < conf[0] ? SURE : r < conf[0] + conf[1] ? MID : LOW);
    return { who: pick(C.FRIENDS), pick: choice, txt: phrase + ' ' + 'ABCD'[choice] + '!' };
  }

  // ------------------------------------------------------------------
  // Partita
  // ------------------------------------------------------------------
  class BillGame {
    constructor(humans, emit) {
      this.emit = emit || (() => {});
      this.players = humans.map((h) => ({
        slot: h.slot, name: h.name, connected: true,
        // SFIDA
        score: 0, timeSum: 0, ans: -1, ansT: 0, res: -1, life: { fifty: true, aud: true, tel: true, swap: true }, s: null,
        // SQUADRA
        vote: -1, voteT: 0, right: 0,
      }));
      this.pmap = new Map(this.players.map((p) => [p.slot, p]));
      this.stage = 'menu';     // menu | intro | ask | suspense | reveal | end
      this.mode = null;        // 'arena' | 'team'
      this.menuSel = 'team';   // scelta evidenziata nel menu
      this.notice = '';        // messaggio breve nel menu
      this.noticeT = 0;
      this.t = 0;              // secondi nella fase corrente
      this.clock = 0;          // secondi totali (per le animazioni)
      this.idx = -1;
      this.total = 0;
      this.queue = [];
      this.used = new Set();
      this.q = null;           // domanda in corso (SFIDA: la domanda comune)
      this.toasts = [];        // "ROSSO USA 50/50" sullo schermo grande
      this.parts = [];         // coriandoli
      this.lastTick = -1;

      // SQUADRA
      this.ts = null;                                      // stato della domanda corrente { q, elim, info, swapped }
      this.teamLife = { fifty: true, aud: true, tel: true, swap: true };
      this.lifeVotes = { fifty: new Set(), aud: new Set(), tel: new Set(), swap: new Set() };
      this.lockAt = null;
      this.final = -1;         // risposta scelta dalla squadra
      this.won = 0;            // vinti finora (ultima domanda indovinata)
      this.safe = 0;           // ultima soglia sicura raggiunta
      this.result = null;      // { ok, prize, million }
    }

    // --- utilità ---
    get ladder() { return C.LADDER; }
    connected() { return this.players.filter((p) => p.connected); }
    player(slot) { return this.pmap.get(slot) || null; }
    cur() { return this.mode === 'team' && this.ts ? this.ts.q : this.q; }
    dirty() { this.emit('dirty'); }
    timeLeft() { return Math.max(0, C.ASK_TIME - this.t); }
    need() { return Math.floor(Math.max(1, this.connected().length) / 2) + 1; }
    static fmt(n) { return fmt(n); }

    toast(text, slot) {
      this.toasts.push({ text, slot, t: 0 });
      if (this.toasts.length > 4) this.toasts.shift();
    }

    // --- menu ---
    pickMode(mode) {
      if (this.stage !== 'menu' || (mode !== 'arena' && mode !== 'team')) return;
      this.menuSel = mode;
      if (mode === 'arena' && this.connected().length < C.ARENA_MIN_PLAYERS) {
        this.notice = 'LA SFIDA VUOLE ALMENO ' + C.ARENA_MIN_PLAYERS + ' GIOCATORI!';
        this.noticeT = 3;
        this.emit('sfx', 'empty');
        this.dirty();
        return;
      }
      this.mode = mode;
      const levels = mode === 'arena' ? C.ARENA_LEVELS : C.TEAM_LEVELS;
      this.total = levels.length;
      this.queue = levels.map((lv) => { const q = BillQuestions.draw(lv, this.used); this.used.add(q.id); return q; });
      this.stage = 'intro';
      this.t = 0;
      this.emit('sfx', 'bill_intro');
      this.dirty();
    }

    key(k) {
      if (this.stage !== 'menu') return;
      if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
        this.menuSel = this.menuSel === 'arena' ? 'team' : 'arena';
        this.emit('sfx', 'tick');
        this.dirty();
      } else if (k === 'Enter') this.pickMode(this.menuSel);
    }

    // --- domande ---
    nextQuestion() {
      this.idx++;
      this.q = this.queue[this.idx];
      this.stage = 'ask';
      this.t = 0;
      this.lastTick = -1;
      this.lockAt = null;
      this.final = -1;
      this.result = null;
      this.parts.length = 0;
      for (const p of this.players) {
        p.ans = -1; p.ansT = 0; p.res = -1; p.vote = -1; p.voteT = 0;
        p.s = { q: this.q, elim: [], info: null, swapped: false };
      }
      this.ts = { q: this.q, elim: [], info: null, swapped: false };
      for (const id of LIFE_IDS) this.lifeVotes[id].clear();
      this.emit('music', true);
      this.emit('sfx', 'bill_q');
      this.dirty();
    }

    // --- risposte ---
    /** SFIDA: risposta definitiva (il primo tocco vale). SQUADRA: voto, cambiabile finché non si blocca */
    answer(slot, o) {
      const p = this.pmap.get(slot);
      if (!p || this.stage !== 'ask' || !Number.isInteger(o) || o < 0 || o > 3) return;
      if (this.mode === 'arena') {
        if (p.ans >= 0 || p.s.elim.includes(o)) return;
        p.ans = o; p.ansT = this.t;
        this.emit('sfx', 'bill_select');
      } else {
        if (this.ts.elim.includes(o) || p.vote === o) return;
        p.vote = o; p.voteT = this.t;
        this.emit('sfx', 'bill_select');
      }
      this.dirty();
    }

    useLife(slot, k) {
      const p = this.pmap.get(slot);
      const id = LIFE_IDS[k];
      if (!p || !id || this.stage !== 'ask') return;
      const label = C.LIFE[k].name;
      if (this.mode === 'arena') {
        if (p.ans >= 0 || !p.life[id]) return;
        p.life[id] = false;
        this.applyLife(p.s, id);
        this.toast(p.name + ' USA ' + label, slot);
        this.emit('sfx', 'bill_life');
      } else {
        if (!this.teamLife[id]) return;
        const set = this.lifeVotes[id];
        if (set.has(slot)) set.delete(slot); else set.add(slot);
        this.emit('sfx', 'tick');
        this.checkLifeVotes();
      }
      this.dirty();
    }

    /** SQUADRA: un aiuto parte quando la maggioranza dei giocatori collegati lo chiede */
    checkLifeVotes() {
      if (this.mode !== 'team' || this.stage !== 'ask') return;
      for (let k = 0; k < LIFE_IDS.length; k++) {
        const id = LIFE_IDS[k];
        if (!this.teamLife[id]) continue;
        const votes = [...this.lifeVotes[id]].filter((s) => this.pmap.get(s) && this.pmap.get(s).connected).length;
        if (votes < this.need()) continue;
        this.teamLife[id] = false;
        this.lifeVotes[id].clear();
        this.applyLife(this.ts, id);
        if (id === 'swap') {
          // domanda nuova: tempo e voti ripartono da zero
          this.q = this.ts.q;
          this.t = 0; this.lockAt = null; this.lastTick = -1;
          for (const p of this.players) { p.vote = -1; p.voteT = 0; }
          this.emit('music', true);
        } else {
          // l'aiuto toglie risposte: i voti su quelle risposte non valgono più
          for (const p of this.players) if (this.ts.elim.includes(p.vote)) p.vote = -1;
        }
        this.toast('LA SQUADRA USA ' + C.LIFE[k].name, -1);
        this.emit('sfx', 'bill_life');
      }
    }

    applyLife(s, id) {
      if (id === 'fifty') s.elim = applyFifty(s.q, s.elim);
      else if (id === 'aud') s.info = { t: 'aud', p: applyAudience(s.q, s.elim) };
      else if (id === 'tel') s.info = Object.assign({ t: 'tel' }, applyFriend(s.q, s.elim));
      else if (id === 'swap') {
        const nq = BillQuestions.draw(s.q.lvl, this.used);
        this.used.add(nq.id);
        s.q = nq; s.elim = []; s.info = null; s.swapped = true;
      }
    }

    setConnected(slot, on) {
      const p = this.pmap.get(slot);
      if (!p) return;
      p.connected = on;
      if (!on) for (const id of LIFE_IDS) this.lifeVotes[id].delete(slot);
      else this.dirty();
      this.checkLifeVotes();
    }

    // --- ciclo ---
    update(dt) {
      this.clock += dt;
      this.t += dt;
      if (this.noticeT > 0) { this.noticeT -= dt; if (this.noticeT <= 0) { this.notice = ''; this.dirty(); } }
      for (const x of this.toasts) x.t += dt;
      this.toasts = this.toasts.filter((x) => x.t < 4.5);
      for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; p.life -= dt; }
      this.parts = this.parts.filter((p) => p.life > 0);

      switch (this.stage) {
        case 'intro':
          if (this.t >= C.INTRO) this.nextQuestion();
          break;
        case 'ask':
          this.updateAsk();
          break;
        case 'suspense':
          if (this.t >= (this.mode === 'arena' ? C.SUSPENSE_ARENA : C.SUSPENSE_TEAM)) this.reveal();
          break;
        case 'reveal':
          if (this.t >= (this.mode === 'arena' ? C.REVEAL_ARENA : C.REVEAL_TEAM)) this.afterReveal();
          break;
        default:
      }
    }

    updateAsk() {
      const conn = this.connected();
      if (this.mode === 'arena') {
        if (conn.length && conn.every((p) => p.ans >= 0)) return this.toSuspense();
      } else {
        const all = conn.length > 0 && conn.every((p) => p.vote >= 0);
        if (all && this.lockAt === null) { this.lockAt = this.t + C.LOCK_GRACE; this.dirty(); }
        else if (!all && this.lockAt !== null) { this.lockAt = null; this.dirty(); }
        if (this.lockAt !== null && this.t >= this.lockAt) return this.toSuspense();
      }
      const left = this.timeLeft();
      if (left <= 10 && Math.ceil(left) !== this.lastTick) {
        this.lastTick = Math.ceil(left);
        if (left > 0) this.emit('sfx', 'bill_tick');
      }
      if (left <= 0) this.toSuspense();
    }

    toSuspense() {
      this.stage = 'suspense';
      this.t = 0;
      if (this.mode === 'team') this.final = this.majority();
      this.emit('music', false);
      this.emit('sfx', 'bill_lock');
      this.dirty();
    }

    /** SQUADRA: risposta più votata; a pari voti vince quella votata per prima. -1 = nessun voto */
    majority() {
      const count = [0, 0, 0, 0], first = [Infinity, Infinity, Infinity, Infinity];
      for (const p of this.players) {
        if (p.vote < 0) continue;
        count[p.vote]++;
        first[p.vote] = Math.min(first[p.vote], p.voteT);
      }
      let best = -1;
      for (let i = 0; i < 4; i++) {
        if (!count[i]) continue;
        if (best < 0 || count[i] > count[best] || (count[i] === count[best] && first[i] < first[best])) best = i;
      }
      return best;
    }

    reveal() {
      this.stage = 'reveal';
      this.t = 0;
      if (this.mode === 'arena') {
        let anyRight = false;
        for (const p of this.players) {
          if (p.ans < 0) { p.res = -1; this.emit('buzz', { slot: p.slot, pattern: [200] }); continue; }
          if (p.ans === p.s.q.c) {
            p.res = 1; p.score++; p.timeSum += p.ansT; anyRight = true;
            this.emit('buzz', { slot: p.slot, pattern: [60, 40, 60] });
          } else {
            p.res = 0;
            this.emit('buzz', { slot: p.slot, pattern: [300] });
          }
        }
        this.emit('sfx', anyRight ? 'bill_correct' : 'bill_wrong');
        if (anyRight) this.confetti(24);
      } else {
        const ok = this.final === this.q.c;
        for (const p of this.players) {
          if (p.vote === this.q.c) p.right++;
          p.res = p.vote < 0 ? -1 : p.vote === this.q.c ? 1 : 0;
          this.emit('buzz', { slot: p.slot, pattern: ok ? [60, 40, 60] : [300] });
        }
        if (ok) {
          this.won = C.LADDER[this.idx];
          if (C.SAFE.includes(this.idx)) this.safe = this.won;
        }
        this.result = { ok, prize: ok ? this.won : this.safe, million: ok && this.idx === this.total - 1 };
        this.emit('sfx', ok ? (this.result.million ? 'bill_million' : 'bill_correct') : 'bill_wrong');
        if (ok) this.confetti(this.result.million ? 90 : 36);
      }
      this.dirty();
    }

    afterReveal() {
      if (this.mode === 'arena') {
        if (this.idx + 1 >= this.total) this.finish(); else this.nextQuestion();
      } else if (this.result.ok && this.idx + 1 < this.total) this.nextQuestion();
      else this.finish();
    }

    // --- fine ---
    finish() {
      this.stage = 'end';
      this.t = 0;
      this.emit('music', false);
      let ranking, opts;
      if (this.mode === 'arena') {
        const sorted = this.players.slice().sort((a, b) => b.score - a.score || a.timeSum - b.timeSum || a.slot - b.slot);
        ranking = sorted.map((p) => ({ slot: p.slot, name: p.name, bot: false, detail: p.score + '/' + this.total + ' GIUSTE' }));
        opts = { delay: C.FINISH_DELAY };
      } else {
        const prize = this.result ? this.result.prize : this.safe;
        const million = !!(this.result && this.result.million);
        const sorted = this.players.slice().sort((a, b) => b.right - a.right || a.slot - b.slot);
        ranking = sorted.map((p) => ({ slot: p.slot, name: p.name, bot: false, detail: p.right + ' VOTI GIUSTI' }));
        const pts = million ? 3 : prize >= C.LADDER[9] ? 2 : prize >= C.LADDER[4] ? 1 : 0;
        this.prizeFinal = prize;
        opts = {
          delay: C.FINISH_DELAY, teamPts: pts,
          title: million ? 'MILIONARI!' : prize > 0 ? 'BRAVI!' : 'GAME OVER',
          sub: million ? 'AVETE VINTO € 1.000.000!' : prize > 0 ? 'PORTATE A CASA € ' + fmt(prize) : 'NIENTE VINCITA... RIPROVATE!',
        };
      }
      this.emit('sfx', 'bill_end');
      this.emit('over', { ranking, opts });
      this.dirty();
    }

    // --- coriandoli ---
    confetti(n) {
      const cols = ['#ffd23b', '#ff3b3b', '#2f8bff', '#3fe05a', '#ff6fb5', '#ffffff'];
      for (let i = 0; i < n; i++) {
        this.parts.push({
          x: C.W * (0.2 + Math.random() * 0.6), y: C.H * 0.35,
          vx: (Math.random() - 0.5) * 180, vy: -60 - Math.random() * 120,
          life: 1.6 + Math.random() * 1.4, c: pick(cols),
        });
      }
    }

    // --- dati per i telefoni ---
    hud(slot, lead) {
      const p = this.pmap.get(slot);
      if (!p) return null;
      const conn = this.connected().length;
      const h = { g: 'bill', st: this.stage, md: this.mode, lead: lead ? 1 : 0, np: conn, ca: conn >= C.ARENA_MIN_PLAYERS ? 1 : 0, sel: this.menuSel, nt: this.notice };
      if (this.stage === 'menu' || this.stage === 'intro') return h;

      const arena = this.mode === 'arena';
      const s = arena ? p.s : this.ts;
      h.n = this.idx + 1; h.tot = this.total;
      if (this.stage === 'ask') h.tm = Math.ceil(this.timeLeft());
      h.o = s.q.o; h.el = s.elim; h.info = s.info;
      if (s.swapped) { h.sw = 1; h.q = s.q.q; }
      h.pick = arena ? p.ans : p.vote;
      if (arena) {
        h.lf = LIFE_IDS.map((id) => (p.life[id] ? 1 : 0));
        h.sc = p.score;
        h.rk = 1 + this.players.filter((x) => x.score > p.score).length;
      } else {
        h.lf = LIFE_IDS.map((id) => (this.teamLife[id] ? 1 : 0));
        h.lv = LIFE_IDS.map((id) => this.lifeVotes[id].size);
        h.mine = LIFE_IDS.map((id) => (this.lifeVotes[id].has(slot) ? 1 : 0));
        h.need = this.need();
        h.lk = this.lockAt !== null ? 1 : 0;
        h.won = this.won; h.safe = this.safe; h.val = C.LADDER[this.idx];
      }
      if (this.stage === 'reveal' || this.stage === 'end') {
        h.cor = s.q.c; h.res = p.res;
        if (!arena && this.result) { h.ok = this.result.ok ? 1 : 0; h.prz = this.result.prize; }
      }
      return h;
    }
  }

  window.BillGame = BillGame;
})();
