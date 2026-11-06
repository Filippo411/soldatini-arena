/**
 * PIPPO GAME ROOM — regia dello schermo grande.
 *
 * Gestisce tutto ciò che è comune ai giochi:
 *   - stanza e QR code, telefoni che entrano/escono/rientrano
 *   - MENU dei giochi (il capo sceglie dal telefono o dallo schermo)
 *   - avvio della partita del gioco scelto, inoltro dei comandi dei telefoni
 *   - classifica di fine partita e CLASSIFICA DELLA SERATA
 *
 * Flusso:  MENU (hub) -> PARTITA (gioco scelto) -> RISULTATI -> RIGIOCA o MENU
 */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const PLAYERS = ROOM.PLAYERS;

  // ------------------------------------------------------------------
  // Stato
  // ------------------------------------------------------------------
  let net = null;
  let phase = 'hub';            // 'hub' | 'game' | 'over'
  let session = null;           // partita in corso (oggetto creato dal gioco)
  let demo = null;              // animazione di sfondo nel menu
  let selected = 'shooter';     // gioco selezionato nel menu
  let playingId = null;         // gioco della partita in corso / appena finita
  let lastRanking = null;
  /** slots[i] = { slot, name, cid, connected, leftAt } oppure null */
  const slots = [null, null, null, null];
  /** punti della serata per slot: { name, pts, wins } */
  const evening = [null, null, null, null];
  const waiting = new Map();    // cid -> nome (arrivati a partita in corso)
  let overShownAt = 0;
  let audioOn = false;

  const room = {
    code: null,
    key: null,
    /** vibrazione sul telefono di uno slot */
    buzz(slot, pattern) { const s = slots[slot]; if (s) toPhone(s.cid, { t: 'buzz', p: pattern }); },
    /** l'HUD di uno slot è cambiato: lo rimandiamo al telefono */
    hudChanged(slot) { hudDirty.add(slot); },
    /** il gioco è finito: ranking dal primo all'ultimo */
    finish(ranking, opts) { onFinish(ranking, opts || {}); },
  };

  const canvas = $('game');

  // ------------------------------------------------------------------
  // Adattamento del canvas allo schermo (pixel nitidi)
  // ------------------------------------------------------------------
  function fit() {
    const w = canvas.width || 384, h = canvas.height || 216;
    const s = Math.min(innerWidth / w, innerHeight / h);
    const si = Math.floor(s);
    const scale = si >= 2 && si / s > 0.9 ? si : s;
    canvas.style.width = Math.floor(w * scale) + 'px';
    canvas.style.height = Math.floor(h * scale) + 'px';
  }
  addEventListener('resize', fit);

  // ------------------------------------------------------------------
  // Rete
  // ------------------------------------------------------------------
  function connect() {
    try {
      const saved = JSON.parse(sessionStorage.getItem('pgr-room') || 'null');
      if (saved) { room.code = saved.code; room.key = saved.key; }
    } catch (e) { /* niente */ }

    net = new Net(() => '/ws?role=host' + (room.code ? `&room=${room.code}&key=${room.key}` : ''), {
      onopen: () => setNetStatus('SERVER OK', 'ok'),
      onclose: () => setNetStatus('CONNESSIONE PERSA... RIPROVO', 'bad'),
      onmessage: onServerMessage,
    });
  }

  function setNetStatus(text, cls) {
    const el = $('netStatus');
    el.textContent = text;
    el.className = 'net-status ' + (cls || '');
  }

  function onServerMessage(m) {
    if (m.t === 'room') {
      const changed = m.code !== room.code;
      room.code = m.code; room.key = m.key;
      sessionStorage.setItem('pgr-room', JSON.stringify({ code: room.code, key: room.key }));
      if (changed) for (let i = 0; i < 4; i++) { slots[i] = null; evening[i] = null; }
      for (const cid of m.ctrls || []) {
        const s = slotByCid(cid);
        if (s) { s.connected = true; sendYou(s); }
      }
      showJoinInfo();
      refreshHub();
    } else if (m.t === 'cjoin') {
      const s = slotByCid(m.cid);
      if (s) { s.connected = true; if (session) session.setConnected(s.slot, true); sendYou(s); refreshHub(); }
    } else if (m.t === 'cleave') {
      const s = slotByCid(m.cid);
      waiting.delete(m.cid);
      if (s) {
        s.connected = false;
        s.leftAt = performance.now();
        if (session) session.setConnected(s.slot, false);
        refreshHub();
        broadcastYou();
      }
    } else if (m.t === 'c') {
      onControllerMessage(m.cid, m.d || {});
    }
  }

  function toPhone(cid, d) { if (cid) net.send({ t: 'to', cid, d }); }

  // ------------------------------------------------------------------
  // Giocatori
  // ------------------------------------------------------------------
  const slotByCid = (cid) => slots.find((s) => s && s.cid === cid) || null;
  const humans = () => slots.filter(Boolean);
  /** Il "capo": il primo telefono collegato può scegliere il gioco e avviarlo */
  const leadSlot = () => slots.find((s) => s && s.connected) || null;

  function cleanName(n) {
    n = PixelFont.norm(String(n || '').trim()).replace(/\s+/g, ' ').trim().slice(0, 9);
    return n || null;
  }

  function onControllerMessage(cid, d) {
    const s = slotByCid(cid);
    if (d.t === 'hello') return onHello(cid, d);
    if (!s) return;
    const lead = leadSlot() === s;
    switch (d.t) {
      case 'pick':   // il capo sceglie un gioco nel menu
        if (lead && phase === 'hub' && GAMES.get(d.game)) { selectGame(d.game); }
        return;
      case 'start':
        if (lead && phase === 'hub') startMatch();
        return;
      case 'again':
        if (lead && phase === 'over') startMatch(playingId);
        return;
      case 'lobby':
        if (lead && phase === 'over') backToHub();
        return;
      case 'leave':
        if (phase !== 'game') { slots[s.slot] = null; evening[s.slot] = null; refreshHub(); broadcastYou(); }
        return;
      default:
        // tutto il resto sono comandi di gioco
        if (session && phase !== 'hub') session.input(s.slot, d);
    }
  }

  function onHello(cid, d) {
    const name = cleanName(d.name) || 'GIOCATORE';
    let s = slotByCid(cid);
    if (s) {
      // stesso telefono che rientra
      s.connected = true;
      if (phase !== 'game') s.name = name;
      if (session) session.setConnected(s.slot, true);
      refreshHub(); broadcastYou();
      return;
    }
    // rientro da un altro browser: stesso nome di un giocatore scollegato
    s = slots.find((x) => x && !x.connected && x.name === name);
    if (s) {
      s.cid = cid; s.connected = true;
      if (session) session.setConnected(s.slot, true);
      refreshHub(); broadcastYou();
      return;
    }
    if (phase === 'game') {
      waiting.set(cid, name);
      toPhone(cid, { t: 'wait', msg: 'PARTITA IN CORSO! ENTRERAI ALLA PROSSIMA' });
      return;
    }
    const free = slots.findIndex((x) => !x);
    if (free === -1) { toPhone(cid, { t: 'full', msg: 'STANZA PIENA (4 GIOCATORI)' }); return; }
    addPlayer(free, name, cid);
    Sfx.play('join');
    refreshHub();
    broadcastYou();
  }

  function addPlayer(slot, name, cid) {
    const taken = slots.filter((x) => x && x.slot !== slot).map((x) => x.name);
    if (taken.includes(name)) name = (name.slice(0, 7) + ' ' + (slot + 1)).trim();
    slots[slot] = { slot, name, cid, connected: true };
    if (!evening[slot] || evening[slot].name !== name) evening[slot] = { name, pts: 0, wins: 0 };
  }

  /** Dice a un telefono chi è, in che fase siamo e cosa mostrare */
  function sendYou(s) {
    if (!s || !s.connected) return;
    const pc = PLAYERS[s.slot];
    const g = GAMES.get(phase === 'hub' ? selected : playingId);
    const msg = {
      t: 'you', slot: s.slot, name: s.name, color: pc.color, dark: pc.dark,
      lead: leadSlot() === s, phase, room: room.code,
      game: g ? g.id : null, gameTitle: g ? g.title : '', layout: g ? g.layout : null,
      games: GAMES.list.map((x) => ({ id: x.id, title: x.title, desc: x.desc, players: x.players, available: x.available })),
      players: humans().map((x) => ({
        slot: x.slot, name: x.name, color: PLAYERS[x.slot].color, on: x.connected,
        pts: evening[x.slot] ? evening[x.slot].pts : 0,
      })),
    };
    if (phase === 'over' && lastRanking) msg.rank = lastRanking;
    toPhone(s.cid, msg);
    sendHud(s.slot, true);
  }
  function broadcastYou() { for (const s of humans()) sendYou(s); }

  // --- HUD dei telefoni: inviato solo quando cambia qualcosa ---
  const hudDirty = new Set();
  const lastHud = new Map();
  function sendHud(slot, force) {
    if (!session || !session.hud) return;
    const s = slots[slot];
    if (!s || !s.connected) return;
    const h = session.hud(slot);
    if (!h) return;
    const key = JSON.stringify(h);
    if (!force && lastHud.get(s.cid) === key) return;
    lastHud.set(s.cid, key);
    toPhone(s.cid, Object.assign({ t: 'st' }, h));
  }

  // ------------------------------------------------------------------
  // Fasi
  // ------------------------------------------------------------------
  function selectGame(id) {
    const g = GAMES.get(id);
    if (!g) return;
    selected = id;
    Sfx.play('tick');
    refreshHub();
    broadcastYou();
  }

  function startMatch(id) {
    if (phase === 'game') return;
    const g = GAMES.get(id || selected);
    if (!g || !g.available) { Sfx.play('empty'); flashHint('QUESTO GIOCO ARRIVA PRESTO!'); return; }
    // chi era in attesa entra ora (se c'è posto)
    for (const [cid, name] of waiting) {
      const free = slots.findIndex((x) => !x);
      if (free === -1) break;
      addPlayer(free, name, cid);
    }
    waiting.clear();
    // giocatori scollegati: fuori
    for (let i = 0; i < 4; i++) if (slots[i] && !slots[i].connected) slots[i] = null;

    if (session) session.stop();
    playingId = g.id;
    session = g.create(room, humans().map((s) => ({ slot: s.slot, name: s.name })));
    phase = 'game';
    demo = null;
    lastHud.clear();
    lastRanking = null;
    $('hub').classList.add('hidden');
    $('over').classList.add('hidden');
    document.body.classList.add('playing');
    fit();
    broadcastYou();
  }

  function onFinish(ranking, opts) {
    if (phase !== 'game') return;
    phase = 'over';
    // punti della serata: solo tra giocatori umani, e solo se sono almeno 2
    const hum = ranking.filter((r) => !r.bot);
    ranking.forEach((r) => { r.pts = 0; });
    if (hum.length >= 2) {
      hum.forEach((r, i) => {
        r.pts = ROOM.EVENING_POINTS[i] || 0;
        const e = evening[r.slot];
        if (e) { e.pts += r.pts; if (i === 0) e.wins++; }
      });
    }
    lastRanking = ranking.map((r) => ({ slot: r.slot, name: r.name, bot: !!r.bot, detail: r.detail || '', pts: r.pts }));
    const delay = opts.delay || 0;
    overShownAt = performance.now() + delay;
    broadcastYou();
    setTimeout(() => {
      if (phase !== 'over') return;
      showOver(lastRanking);
      Sfx.play('win_jingle');
      if (opts.voice) setTimeout(() => Sfx.announce(opts.voice), 400);
    }, delay);
  }

  function showOver(ranking) {
    const w = ranking[0];
    const pc = PLAYERS[w.slot];
    $('winnerName').textContent = w.name + (w.bot ? ' (CPU)' : '');
    $('winnerName').style.color = pc.color;
    $('overGame').textContent = GAMES.get(playingId).title;
    const body = $('rankBody');
    body.innerHTML = '';
    ranking.forEach((r, i) => {
      const tr = document.createElement('tr');
      if (i === 0) tr.className = 'first';
      const col = PLAYERS[r.slot].color;
      tr.innerHTML = `<td class="pos">${i + 1}°</td><td class="sw" style="background:${col}"></td>` +
        `<td style="color:${col}">${escapeHtml(r.name)}${r.bot ? ' <small>CPU</small>' : ''}</td>` +
        `<td class="k">${escapeHtml(r.detail)}</td><td class="d">${r.pts ? '+' + r.pts + ' PT' : ''}</td>`;
      body.appendChild(tr);
    });
    $('over').classList.remove('hidden');
  }

  function backToHub() {
    if (session) session.stop();
    session = null;
    phase = 'hub';
    Sfx.stopMusic();
    for (const [cid, name] of waiting) {
      const free = slots.findIndex((x) => !x);
      if (free === -1) break;
      addPlayer(free, name, cid);
    }
    waiting.clear();
    newDemo();
    $('over').classList.add('hidden');
    $('hub').classList.remove('hidden');
    document.body.classList.remove('playing');
    refreshHub();
    broadcastYou();
  }

  function newDemo() {
    const g = GAMES.get(selected);
    const src = g && g.demo ? g : GAMES.get('shooter');
    demo = src.demo();
    fit();
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ------------------------------------------------------------------
  // Menu (DOM)
  // ------------------------------------------------------------------
  async function showJoinInfo() {
    let base = location.origin;
    // aperto come "localhost"? I telefoni non lo raggiungono: usiamo l'IP della Wi-Fi
    if (/^(localhost|127\.|\[::1\])/.test(location.hostname)) {
      try {
        const info = await (await fetch('/api/info')).json();
        if (info.lan && info.lan.length) base = `${location.protocol}//${info.lan[0]}:${location.port || info.port}`;
      } catch (e) { /* lasciamo l'origine */ }
    }
    const url = `${base}/play?r=${room.code}`;
    $('joinUrl').textContent = base.replace(/^https?:\/\//, '') + '/play';
    $('roomCode').textContent = room.code;
    try { QR.draw($('qr'), QR.make(url), 8); } catch (e) { console.error(e); }
    $('qr').title = url;
  }

  // schede dei giochi
  function buildGameCards() {
    const wrap = $('gameCards');
    wrap.innerHTML = '';
    for (const g of GAMES.list) {
      const card = document.createElement('button');
      card.className = 'game-card' + (g.available ? '' : ' soon');
      card.dataset.id = g.id;
      const cv = document.createElement('canvas');
      cv.width = 24; cv.height = 24;
      try { g.icon(cv.getContext('2d'), 0, 0); } catch (e) { /* icona non pronta */ }
      card.appendChild(cv);
      const t = document.createElement('span');
      t.className = 'gtitle';
      t.textContent = g.title;
      card.appendChild(t);
      if (!g.available) {
        const b = document.createElement('span');
        b.className = 'badge';
        b.textContent = 'PRESTO';
        card.appendChild(b);
      }
      card.onclick = () => { if (selected === g.id) startMatch(); else selectGame(g.id); };
      wrap.appendChild(card);
    }
  }

  function refreshHub() {
    // giochi
    for (const card of document.querySelectorAll('.game-card')) card.classList.toggle('sel', card.dataset.id === selected);
    const g = GAMES.get(selected);
    $('gameDesc').textContent = g.desc;
    $('gamePlayers').textContent = 'GIOCATORI: ' + g.players;
    $('playBtn').textContent = g.available ? 'GIOCA!' : 'PROSSIMAMENTE';
    $('playBtn').disabled = !g.available;

    // squadra + punti della serata
    const ul = $('slots');
    ul.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const s = slots[i];
      const pc = PLAYERS[i];
      const li = document.createElement('li');
      li.innerHTML = `<span class="num" style="background:${pc.color}">${i + 1}</span>`;
      if (s) {
        const nm = document.createElement('span');
        nm.className = 'pname';
        nm.textContent = s.name;
        nm.style.color = pc.color;
        li.appendChild(nm);
        const tag = document.createElement('span');
        tag.className = 'tag' + (s.connected ? '' : ' off');
        tag.textContent = s.connected ? (leadSlot() === s ? 'CAPO' : '') : 'OFFLINE';
        li.appendChild(tag);
        const pts = document.createElement('span');
        pts.className = 'pts';
        pts.textContent = (evening[i] ? evening[i].pts : 0) + ' PT';
        li.appendChild(pts);
      } else {
        li.className = 'empty';
        li.innerHTML += '<span class="pname">IN ATTESA...</span>';
      }
      ul.appendChild(li);
    }
    const anyPts = evening.some((e) => e && e.pts > 0);
    $('resetBtn').classList.toggle('hidden', !anyPts);
    const n = humans().length;
    $('hubHint').textContent = n === 0 ? 'Inquadra il QR per entrare!'
      : n === 1 ? 'Sei da solo: nei giochi che lo prevedono arrivano i bot.'
      : `${n} giocatori in sala. Il capo sceglie il gioco dal telefono.`;
  }

  let hintTimer = null;
  function flashHint(text) {
    const el = $('hubHint');
    el.textContent = text;
    el.classList.add('warn');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { el.classList.remove('warn'); refreshHub(); }, 1800);
  }

  // giocatori scollegati nel menu da più di 20 secondi: posto liberato
  setInterval(() => {
    if (phase !== 'hub') return;
    let changed = false;
    for (let i = 0; i < 4; i++) {
      const s = slots[i];
      if (s && !s.connected && performance.now() - s.leftAt > 20000) { slots[i] = null; changed = true; }
    }
    if (changed) { refreshHub(); broadcastYou(); }
  }, 2000);

  // ------------------------------------------------------------------
  // Pulsanti e tastiera
  // ------------------------------------------------------------------
  function enableAudio() {
    if (audioOn) return;
    Sfx.init();
    audioOn = true;
    $('audioBtn').classList.add('hidden');
    $('muteBtn').classList.remove('hidden');
    document.body.classList.add('audio-on');
  }
  addEventListener('pointerdown', enableAudio);
  addEventListener('keydown', enableAudio);

  $('playBtn').onclick = () => startMatch();
  $('againBtn').onclick = () => startMatch(playingId);
  $('lobbyBtn').onclick = () => backToHub();
  $('resetBtn').onclick = () => {
    for (let i = 0; i < 4; i++) if (evening[i]) { evening[i].pts = 0; evening[i].wins = 0; }
    refreshHub(); broadcastYou();
  };
  $('muteBtn').onclick = () => { $('muteBtn').textContent = Sfx.toggleMute() ? 'AUDIO OFF' : 'AUDIO ON'; };
  $('fsBtn').onclick = toggleFullscreen;

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen && document.exitFullscreen();
  }

  addEventListener('keydown', (e) => {
    const k = e.key;
    if (phase === 'hub') {
      const ids = GAMES.list.map((g) => g.id);
      const i = ids.indexOf(selected);
      if (k === 'ArrowRight' || k === 'ArrowDown') selectGame(ids[(i + 1) % ids.length]);
      else if (k === 'ArrowLeft' || k === 'ArrowUp') selectGame(ids[(i - 1 + ids.length) % ids.length]);
      else if (k === 'Enter') startMatch();
    } else if (phase === 'over' && performance.now() > overShownAt) {
      if (k === 'Enter') startMatch(playingId);
      else if (k === 'Escape' || k === 'Backspace') backToHub();
    }
    if (k === 'f' || k === 'F') toggleFullscreen();
    else if (k === 'm' || k === 'M') $('muteBtn').click();
  });

  // ------------------------------------------------------------------
  // Ciclo principale (60 fotogrammi al secondo, passo fisso)
  // ------------------------------------------------------------------
  const STEP = 1 / 60;
  let acc = 0, last = performance.now(), hudTimer = 0, fullHudTimer = 0;
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    const running = session || demo;
    while (acc >= STEP) {
      if (running) running.update(STEP);
      acc -= STEP;
    }
    if (running) running.draw();

    // HUD sui telefoni: cambi subito, ripasso completo ogni tanto
    hudTimer += dt; fullHudTimer += dt;
    if (session && hudTimer > 0.1) {
      hudTimer = 0;
      for (const slot of hudDirty) sendHud(slot);
      hudDirty.clear();
      if (fullHudTimer > 0.5) { fullHudTimer = 0; for (const s of humans()) sendHud(s.slot); }
    }
    requestAnimationFrame(frame);
  }

  // Avvio
  buildGameCards();
  newDemo();
  refreshHub();
  connect();
  requestAnimationFrame(frame);

  // Per i test automatici
  window.__host = {
    get session() { return session; }, get phase() { return phase; }, get selected() { return selected; },
    get game() { return session && session.game; }, slots, evening, startMatch, backToHub, selectGame,
  };
})();
