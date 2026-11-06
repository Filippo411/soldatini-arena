/**
 * THE BILLIONAIRE — disegno dello schermo grande (canvas 480x270, pixel art).
 * BillRender.draw(ctx, game, { roomCode })
 */
(function () {
  'use strict';
  const C = BILL_CFG;
  const W = C.W, H = C.H;
  const T = (ctx, text, x, y, o) => PixelFont.draw(ctx, text, x, y, o);

  const COL = {
    bgTop: '#0a0f33', bgBot: '#1d2f86',
    panel: '#101a52', panelHi: '#1c2d86', line: '#5b7be0',
    gold: '#ffd23b', goldDark: '#c27a12', orange: '#ff9c3b',
    ok: '#2fbf4b', okDark: '#1f7a30', bad: '#d6283f', badDark: '#7a1426',
    ink: '#0a0c1e', dim: '#6b7399', white: '#ffffff',
    life: ['#ffd23b', '#2f8bff', '#3fe05a', '#ff6fb5'],
  };
  const LETTERS = ['A', 'B', 'C', 'D'];
  const fmt = (n) => BillGame.fmt(n);

  // ------------------------------------------------------------------
  // Mattoncini di disegno
  // ------------------------------------------------------------------
  /** Pannello con angoli smussati da 2 pixel e bordo di 1 pixel */
  function panel(ctx, x, y, w, h, fill, border) {
    ctx.fillStyle = border;
    ctx.fillRect(x + 2, y, w - 4, h);
    ctx.fillRect(x, y + 2, w, h - 4);
    ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x + w - 2, y + 1, 1, 1);
    ctx.fillRect(x + 1, y + h - 2, 1, 1); ctx.fillRect(x + w - 2, y + h - 2, 1, 1);
    ctx.fillStyle = fill;
    ctx.fillRect(x + 2, y + 1, w - 4, h - 2);
    ctx.fillRect(x + 1, y + 2, w - 2, h - 4);
  }

  /** Spunta verde / croce rossa */
  function tick(ctx, x, y, col) {
    ctx.fillStyle = col;
    [[6, 0], [5, 1], [0, 2], [4, 2], [1, 3], [3, 3], [2, 4]].forEach((p) => ctx.fillRect(x + p[0], y + p[1], 1, 1));
  }
  function cross(ctx, x, y, col) {
    ctx.fillStyle = col;
    [[0, 0], [4, 0], [1, 1], [3, 1], [2, 2], [1, 3], [3, 3], [0, 4], [4, 4]].forEach((p) => ctx.fillRect(x + p[0], y + p[1], 1, 1));
  }

  function wrap(text, maxChars) {
    const words = PixelFont.norm(text).split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      if (!cur) cur = w;
      else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  /** Testo a capo, centrato in un riquadro */
  function textBlock(ctx, text, x, y, w, h, o) {
    o = o || {};
    const chars = Math.floor(w / 6);
    const lines = wrap(text, chars);
    const lh = (o.scale || 1) * 10;
    let ty = y + Math.round((h - lines.length * lh + (lh - 7 * (o.scale || 1))) / 2);
    for (const l of lines) {
      T(ctx, l, o.align === 'left' ? x : x + w / 2, ty, { color: o.color || COL.white, scale: o.scale || 1, align: o.align === 'left' ? 'left' : 'center', outline: o.outline === undefined ? null : o.outline });
      ty += lh;
    }
  }

  // ------------------------------------------------------------------
  // Sfondo
  // ------------------------------------------------------------------
  const STARS = [];
  for (let i = 0; i < 46; i++) STARS.push({ x: (i * 97 + 31) % W, y: (i * 53 + 17) % H, p: (i * 0.37) % 6.28, s: i % 5 === 0 ? 2 : 1 });

  function background(ctx, g) {
    const bands = 18;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const a = [0x0a, 0x0f, 0x33], b = [0x1d, 0x2f, 0x86];
      const c = a.map((v, k) => Math.round(v + (b[k] - v) * t));
      ctx.fillStyle = 'rgb(' + c.join(',') + ')';
      ctx.fillRect(0, Math.floor(i * H / bands), W, Math.ceil(H / bands) + 1);
    }
    for (const s of STARS) {
      const tw = Math.sin(g.clock * 2 + s.p);
      if (tw < -0.2) continue;
      ctx.fillStyle = tw > 0.6 ? '#ffffff' : '#7f93ff';
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
  }

  // ------------------------------------------------------------------
  // Parti comuni
  // ------------------------------------------------------------------
  function header(ctx, g) {
    T(ctx, 'THE BILLIONAIRE', 8, 5, { color: COL.gold, scale: 1, outline: COL.ink, shadow: '#a3172a' });
    const label = g.mode === 'arena' ? 'SFIDA' : 'SQUADRA';
    const sub = g.mode === 'arena'
      ? label + ' - ROUND ' + (g.idx + 1) + '/' + g.total
      : label + ' - DOMANDA ' + (g.idx + 1) + '/' + g.total + ' PER € ' + fmt(C.LADDER[g.idx]);
    T(ctx, sub, 128, 6, { color: '#cfd8ff', outline: null });
    if (g.stage === 'ask') {
      const left = g.timeLeft();
      const col = left <= 10 ? '#ff5a5a' : left <= 25 ? COL.orange : '#7dff8a';
      T(ctx, String(Math.ceil(left)), W - 8, 4, { color: col, scale: 2, align: 'right', outline: COL.ink });
      // barra del tempo
      ctx.fillStyle = COL.ink; ctx.fillRect(8, 19, W - 16, 3);
      ctx.fillStyle = col; ctx.fillRect(8, 19, Math.round((W - 16) * left / C.ASK_TIME), 3);
    } else {
      ctx.fillStyle = COL.ink; ctx.fillRect(8, 19, W - 16, 3);
    }
  }

  function question(ctx, g, q) {
    panel(ctx, 8, 26, 344, 56, COL.panel, COL.line);
    textBlock(ctx, q.q, 14, 26, 332, 56, { color: COL.white });
    // livello di difficoltà: 1-3 stelline
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i < q.lvl ? COL.gold : '#2a3a8a'; ctx.fillRect(14 + i * 6, 30, 4, 4); }
  }

  const OX = [8, 184], OY = [90, 124], OW = 168, OH = 30;

  function options(ctx, g, q) {
    const s = g.mode === 'team' ? g.ts : null;
    const elim = s ? s.elim : [];
    const reveal = g.stage === 'reveal' || g.stage === 'end';
    for (let i = 0; i < 4; i++) {
      const x = OX[i % 2], y = OY[(i / 2) | 0];
      const gone = elim.includes(i);
      let fill = COL.panel, border = COL.line, txt = COL.white, badge = COL.orange;
      const isRight = reveal && i === q.c;
      const isFinal = g.mode === 'team' && i === g.final && (g.stage === 'suspense' || reveal);
      if (isRight) { fill = COL.ok; border = '#a6ffad'; badge = '#a6ffad'; }
      else if (isFinal && reveal) { fill = COL.bad; border = '#ff9c8a'; badge = '#ff9c8a'; }
      else if (isFinal) { fill = COL.goldDark; border = COL.gold; if ((g.clock * 6 | 0) % 2) fill = '#e39b1b'; }
      if (isRight && reveal && (g.clock * 5 | 0) % 2) fill = '#3fe05a';
      if (gone) { fill = '#0c1236'; border = '#2a3470'; txt = '#2a3470'; badge = '#2a3470'; }
      panel(ctx, x, y, OW, OH, fill, border);
      // lettera
      ctx.fillStyle = badge; ctx.fillRect(x + 4, y + 5, 16, 20);
      T(ctx, LETTERS[i], x + 12, y + 12, { color: gone ? '#0c1236' : COL.ink, align: 'center', outline: null });
      if (!gone) textBlock(ctx, q.o[i], x + 23, y, OW - 27, OH, { color: txt, align: 'left' });
      else T(ctx, '- - -', x + 24, y + 12, { color: '#2a3470', outline: null });

      // aiuto del pubblico (solo SQUADRA: è una cosa di tutti, quindi sta sullo schermo)
      if (s && s.info && s.info.t === 'aud' && !gone) {
        const pc = s.info.p[i];
        ctx.fillStyle = '#0a0c1e'; ctx.fillRect(x + 4, y + OH - 5, OW - 8, 3);
        ctx.fillStyle = COL.gold; ctx.fillRect(x + 4, y + OH - 5, Math.round((OW - 8) * pc / 100), 3);
        T(ctx, pc + '%', x + OW - 5, y + 3, { color: COL.gold, align: 'right', outline: COL.ink });
      }

      // chi ha votato / scelto questa risposta (SQUADRA: in diretta; SFIDA: solo a risposta svelata)
      const chips = g.players.filter((p) => (g.mode === 'team' ? p.vote === i : reveal && p.ans === i && p.res !== -1));
      chips.forEach((p, k) => {
        ctx.fillStyle = COL.ink; ctx.fillRect(x + OW - 8 - k * 8, y + OH - 11, 7, 7);
        ctx.fillStyle = PLAYER_COLOR(p.slot); ctx.fillRect(x + OW - 7 - k * 8, y + OH - 10, 5, 5);
      });
    }
  }

  const PLAYER_COLOR = (slot) => ROOM.PLAYERS[slot].color;

  // ------------------------------------------------------------------
  // SFIDA: classifica a destra
  // ------------------------------------------------------------------
  function scoreboard(ctx, g) {
    panel(ctx, 356, 26, 116, 238, COL.panel, COL.line);
    T(ctx, 'CLASSIFICA', 414, 31, { color: COL.gold, align: 'center', outline: null });
    const rows = g.players.slice().sort((a, b) => b.score - a.score || a.slot - b.slot);
    const reveal = g.stage === 'reveal' || g.stage === 'end';
    rows.forEach((p, i) => {
      const y = 43 + i * 27;
      const col = PLAYER_COLOR(p.slot);
      ctx.fillStyle = '#0a0f33'; ctx.fillRect(360, y, 108, 25);
      ctx.fillStyle = p.connected ? col : '#444a66'; ctx.fillRect(360, y, 4, 25);
      T(ctx, p.name, 368, y + 3, { color: p.connected ? col : '#6b7399', outline: null });
      T(ctx, String(p.score), 465, y + 3, { color: COL.white, align: 'right', scale: 2, outline: null });
      // gli aiuti rimasti (visibili a tutti)
      ['fifty', 'aud', 'tel', 'swap'].forEach((id, k) => {
        ctx.fillStyle = p.life[id] ? COL.life[k] : '#2a3470';
        ctx.fillRect(368 + k * 10, y + 16, 8, 5);
      });
      // stato della domanda
      if (g.stage === 'ask' || g.stage === 'suspense') { if (p.ans >= 0) tick(ctx, 428, y + 17, '#7dff8a'); }
      else if (reveal) {
        if (p.res === 1) tick(ctx, 428, y + 17, '#7dff8a');
        else if (p.res === 0) cross(ctx, 429, y + 17, '#ff5a5a');
        else T(ctx, '-', 430, y + 15, { color: '#6b7399', outline: null });
      }
    });
  }

  function arenaLower(ctx, g, q) {
    // chi ha risposto
    const conn = g.connected();
    const done = conn.filter((p) => p.ans >= 0).length;
    if (g.stage === 'ask' || g.stage === 'suspense') {
      panel(ctx, 8, 158, 344, 22, COL.panel, COL.line);
      T(ctx, 'RISPOSTE: ' + done + '/' + conn.length, 14, 165, { color: '#cfd8ff', outline: null });
      T(ctx, 'ANCHE GLI AIUTI SI USANO DAL TELEFONO', 346, 165, { color: COL.dim, align: 'right', outline: null });
    } else {
      const right = g.players.filter((p) => p.res === 1).length;
      panel(ctx, 8, 158, 344, 22, COL.okDark, '#a6ffad');
      T(ctx, 'ESATTO: ' + LETTERS[q.c] + ' - ' + right + ' SU ' + g.players.length + ' CI HANNO PRESO!', 180, 165, { color: COL.white, align: 'center', outline: null });
    }
    // aiuti usati
    g.toasts.forEach((x, i) => {
      const y = 188 + i * 12;
      const a = Math.min(1, (4.5 - x.t) * 2);
      ctx.globalAlpha = a;
      const col = x.slot >= 0 ? PLAYER_COLOR(x.slot) : COL.gold;
      ctx.fillStyle = col; ctx.fillRect(10, y, 5, 8);
      T(ctx, x.text, 20, y + 1, { color: COL.white, outline: null });
      ctx.globalAlpha = 1;
    });
    // round fatti
    for (let i = 0; i < g.total; i++) {
      ctx.fillStyle = i < g.idx ? COL.gold : i === g.idx ? '#ffffff' : '#2a3470';
      ctx.fillRect(10 + i * 18, 250, 14, 8);
    }
    T(ctx, g.idx + 1 === g.total ? 'ULTIMA DOMANDA!' : 'ROUND', 194, 251, { color: COL.dim, outline: null });
  }

  // ------------------------------------------------------------------
  // SQUADRA: scala dei premi, aiuti e giocatori
  // ------------------------------------------------------------------
  function ladder(ctx, g) {
    panel(ctx, 356, 26, 116, 238, COL.panel, COL.line);
    const shown = g.stage === 'reveal' || g.stage === 'end';
    const passed = g.result && g.result.ok ? g.idx : g.idx - 1;   // ultima domanda già indovinata
    for (let i = 0; i < 15; i++) {
      const y = 30 + (14 - i) * 14;
      const isCur = i === g.idx;
      const safe = C.SAFE.includes(i);
      if (isCur) {
        ctx.fillStyle = shown && g.result && !g.result.ok ? COL.bad : COL.gold;
        ctx.fillRect(360, y - 2, 108, 12);
      }
      const col = isCur ? COL.ink : i <= passed ? '#7dff8a' : safe ? COL.orange : '#cfd8ff';
      T(ctx, String(i + 1), 372, y, { color: col, align: 'right', outline: null });
      T(ctx, fmt(C.LADDER[i]), 466, y, { color: col, align: 'right', outline: null });
      if (safe) { ctx.fillStyle = isCur ? COL.ink : COL.orange; ctx.fillRect(375, y + 2, 3, 3); }
    }
  }

  function teamLower(ctx, g, q) {
    const s = g.ts;
    // striscia informativa
    let msg = '', mc = '#cfd8ff', bg = COL.panel, bd = COL.line;
    const reveal = g.stage === 'reveal' || g.stage === 'end';
    if (reveal && g.result) {
      if (g.result.million) { msg = 'AVETE VINTO UN MILIONE!!!'; bg = COL.okDark; bd = '#a6ffad'; mc = COL.gold; }
      else if (g.result.ok) { msg = 'ESATTO! AVETE € ' + fmt(g.won); bg = COL.okDark; bd = '#a6ffad'; mc = COL.white; }
      else { msg = (g.final < 0 ? 'TEMPO SCADUTO! ' : 'SBAGLIATO! ') + 'PORTATE A CASA € ' + fmt(g.safe); bg = COL.badDark; bd = '#ff9c8a'; mc = COL.white; }
    } else if (g.stage === 'suspense') { msg = 'RISPOSTA BLOCCATA... SARÀ LA ' + LETTERS[g.final < 0 ? 0 : g.final] + '?'; if (g.final < 0) msg = 'NESSUN VOTO...'; mc = COL.gold; }
    else if (s.info && s.info.t === 'tel') { msg = s.info.who + ': ' + s.info.txt; mc = '#9bffb0'; }
    else if (g.lockAt !== null) { msg = 'TUTTI HANNO VOTATO! ULTIMI SECONDI PER CAMBIARE IDEA...'; mc = COL.gold; }
    else msg = 'VOTATE DAL TELEFONO: RISPONDE LA MAGGIORANZA';
    panel(ctx, 8, 158, 344, 22, bg, bd);
    textBlock(ctx, msg, 12, 158, 336, 22, { color: mc });

    // i 4 aiuti
    C.LIFE.forEach((l, k) => {
      const x = 8 + k * 87, y = 186, w = 82;
      const avail = g.teamLife[l.id];
      const votes = g.lifeVotes[l.id].size;
      panel(ctx, x, y, w, 30, avail ? COL.panel : '#0c1236', avail ? COL.life[k] : '#2a3470');
      T(ctx, l.name, x + w / 2, y + 6, { color: avail ? COL.life[k] : '#2a3470', align: 'center', outline: null });
      if (avail) {
        T(ctx, 'VOTI ' + votes + '/' + g.need(), x + w / 2, y + 18, { color: votes ? COL.white : COL.dim, align: 'center', outline: null });
      } else {
        T(ctx, 'USATO', x + w / 2, y + 18, { color: '#7a1426', align: 'center', outline: null });
      }
    });

    // i giocatori
    const per = 4;
    g.players.forEach((p, i) => {
      const x = 8 + (i % per) * 87, y = 222 + ((i / per) | 0) * 21, w = 82;
      ctx.fillStyle = '#0a0f33'; ctx.fillRect(x, y, w, 18);
      ctx.fillStyle = p.connected ? PLAYER_COLOR(p.slot) : '#444a66'; ctx.fillRect(x, y, 4, 18);
      T(ctx, p.name, x + 8, y + 5, { color: p.connected ? PLAYER_COLOR(p.slot) : '#6b7399', outline: null });
      if (g.stage === 'ask' && p.vote >= 0) tick(ctx, x + w - 10, y + 7, '#7dff8a');
      if (reveal) { if (p.res === 1) tick(ctx, x + w - 10, y + 7, '#7dff8a'); else if (p.res === 0) cross(ctx, x + w - 9, y + 7, '#ff5a5a'); }
    });
  }

  // ------------------------------------------------------------------
  // Fasi a tutto schermo
  // ------------------------------------------------------------------
  function menu(ctx, g) {
    T(ctx, 'THE', W / 2, 14, { color: '#cfd8ff', scale: 2, align: 'center', outline: COL.ink });
    T(ctx, 'BILLIONAIRE', W / 2, 34, { color: COL.gold, scale: 4, align: 'center', outline: COL.ink, shadow: '#a3172a' });
    // monete che ballano
    for (let i = 0; i < 6; i++) {
      const x = 30 + i * 84, y = 70 + Math.sin(g.clock * 3 + i) * 3;
      coin(ctx, x, y);
    }
    const canArena = g.connected().length >= C.ARENA_MIN_PLAYERS;
    const cards = [
      { id: 'arena', x: 24, title: 'SFIDA', sub: 'TUTTI CONTRO TUTTI', lines: ['2-8 GIOCATORI', '10 DOMANDE', 'CHI NE INDOVINA', 'DI PIU VINCE!', 'AIUTI PERSONALI'], dis: !canArena },
      { id: 'team', x: 252, title: 'SQUADRA', sub: 'TUTTI INSIEME', lines: ['1-8 GIOCATORI', '15 DOMANDE', 'ARRIVATE A', '€ 1.000.000!', 'AIUTI DI SQUADRA'], dis: false },
    ];
    for (const c of cards) {
      const sel = g.menuSel === c.id;
      const pulse = sel && ((g.clock * 4) | 0) % 2 === 0;
      panel(ctx, c.x, 92, 204, 112, c.dis ? '#0c1236' : sel ? '#2a3a9a' : COL.panel, sel ? (pulse ? '#fff1a0' : COL.gold) : c.dis ? '#2a3470' : COL.line);
      T(ctx, c.title, c.x + 102, 99, { color: c.dis ? '#3a4690' : COL.gold, scale: 3, align: 'center', outline: COL.ink });
      T(ctx, c.sub, c.x + 102, 127, { color: c.dis ? '#3a4690' : '#cfd8ff', align: 'center', outline: null });
      c.lines.forEach((l, i) => T(ctx, l, c.x + 102, 144 + i * 11, { color: c.dis ? '#3a4690' : i % 5 === 3 ? COL.gold : COL.white, align: 'center', outline: null }));
      if (c.dis) T(ctx, 'SERVONO ALMENO 2 GIOCATORI', c.x + 102, 195, { color: '#ff5a5a', align: 'center', outline: null });
    }
    // giocatori in sala
    g.players.forEach((p, i) => {
      const x = 24 + (i % 4) * 114, y = 214 + ((i / 4) | 0) * 13;
      ctx.fillStyle = PLAYER_COLOR(p.slot); ctx.fillRect(x, y, 5, 8);
      T(ctx, p.name, x + 9, y + 1, { color: p.connected ? COL.white : COL.dim, outline: null });
    });
    if (g.notice) T(ctx, g.notice, W / 2, 244, { color: '#ff5a5a', align: 'center', outline: COL.ink });
    else T(ctx, 'IL CAPO SCEGLIE DAL TELEFONO (O FRECCE + INVIO)', W / 2, 244, { color: COL.dim, align: 'center', outline: null });
  }

  function coin(ctx, x, y) {
    ctx.fillStyle = COL.ink; ctx.fillRect(x - 6, y - 4, 12, 12); ctx.fillRect(x - 4, y - 6, 8, 16);
    ctx.fillStyle = COL.goldDark; ctx.fillRect(x - 5, y - 3, 10, 10); ctx.fillRect(x - 3, y - 5, 6, 14);
    ctx.fillStyle = COL.gold; ctx.fillRect(x - 4, y - 3, 8, 10); ctx.fillRect(x - 3, y - 4, 6, 12);
    T(ctx, '€', x, y, { color: COL.goldDark, align: 'center', outline: null });
  }

  function intro(ctx, g) {
    const team = g.mode === 'team';
    T(ctx, team ? 'SQUADRA' : 'SFIDA', W / 2, 52, { color: COL.gold, scale: 5, align: 'center', outline: COL.ink, shadow: '#a3172a' });
    T(ctx, team ? 'TUTTI INSIEME VERSO IL MILIONE!' : 'TUTTI CONTRO TUTTI!', W / 2, 100, { color: COL.white, scale: 1, align: 'center', outline: COL.ink });
    const lines = team
      ? ['15 DOMANDE: SI SBAGLIA = SI TORNA ALL\'ULTIMA SOGLIA SICURA', 'SOGLIE SICURE: € 1.000 E € 32.000', 'RISPONDE LA RISPOSTA PIU VOTATA', 'AIUTI DI SQUADRA: SERVE LA MAGGIORANZA']
      : ['10 DOMANDE: OGNI RISPOSTA GIUSTA VALE UN PUNTO', 'RISPONDETE DAL TELEFONO, 60 SECONDI A DOMANDA', 'OGNUNO HA I SUOI 4 AIUTI: UNO SOLO USO CIASCUNO', 'VINCE CHI NE INDOVINA DI PIU!'];
    lines.forEach((l, i) => T(ctx, l, W / 2, 124 + i * 14, { color: i === 0 ? COL.gold : '#cfd8ff', align: 'center', outline: null }));
    C.LIFE.forEach((l, k) => {
      const x = 56 + k * 92;
      panel(ctx, x, 192, 84, 20, COL.panel, COL.life[k]);
      T(ctx, l.name, x + 42, 199, { color: COL.life[k], align: 'center', outline: null });
    });
    ctx.fillStyle = COL.ink; ctx.fillRect(120, 236, 240, 6);
    ctx.fillStyle = COL.gold; ctx.fillRect(120, 236, Math.round(240 * Math.min(1, g.t / C.INTRO)), 6);
    T(ctx, 'PREPARATEVI!', W / 2, 224, { color: '#ffffff', align: 'center', outline: COL.ink });
  }

  function endBanner(ctx, g) {
    ctx.fillStyle = 'rgba(10,12,30,0.62)'; ctx.fillRect(0, 0, W, H);
    const team = g.mode === 'team';
    if (team) {
      const r = g.result || { prize: 0 };
      T(ctx, r.million ? 'MILIONARI!' : r.prize > 0 ? 'BRAVI!' : 'GAME OVER', W / 2, 78, { color: COL.gold, scale: 5, align: 'center', outline: COL.ink, shadow: '#a3172a' });
      T(ctx, r.million ? '€ 1.000.000' : r.prize > 0 ? '€ ' + fmt(r.prize) : '€ 0', W / 2, 130, { color: COL.white, scale: 3, align: 'center', outline: COL.ink });
    } else {
      T(ctx, 'FINE!', W / 2, 78, { color: COL.gold, scale: 5, align: 'center', outline: COL.ink, shadow: '#a3172a' });
      const top = g.players.slice().sort((a, b) => b.score - a.score || a.timeSum - b.timeSum)[0];
      if (top) T(ctx, top.name + ' VINCE CON ' + top.score + '/' + g.total, W / 2, 130, { color: PLAYER_COLOR(top.slot), scale: 2, align: 'center', outline: COL.ink });
    }
  }

  // ------------------------------------------------------------------
  function draw(ctx, g) {
    ctx.imageSmoothingEnabled = false;
    background(ctx, g);
    if (g.stage === 'menu') menu(ctx, g);
    else if (g.stage === 'intro') intro(ctx, g);
    else {
      const q = g.cur();
      header(ctx, g);
      question(ctx, g, q);
      options(ctx, g, q);
      if (g.mode === 'arena') { scoreboard(ctx, g); arenaLower(ctx, g, q); }
      else { ladder(ctx, g); teamLower(ctx, g, q); }
      if (g.stage === 'end') endBanner(ctx, g);
    }
    for (const p of g.parts) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 3); }
  }

  /** Sfondo del menu della sala: monete che cadono */
  function demo(ctx) {
    const coins = [];
    for (let i = 0; i < 26; i++) coins.push({ x: Math.random() * W, y: Math.random() * H, v: 14 + Math.random() * 26, p: Math.random() * 6 });
    const g = { clock: 0 };
    return {
      update(dt) { g.clock += dt; for (const c of coins) { c.y += c.v * dt; if (c.y > H + 10) { c.y = -10; c.x = Math.random() * W; } } },
      draw() {
        background(ctx, g);
        for (const c of coins) coin(ctx, Math.round(c.x + Math.sin(g.clock + c.p) * 6), Math.round(c.y));
      },
    };
  }

  window.BillRender = { draw, demo, coin };
})();
