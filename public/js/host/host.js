/**
 * Regia dello schermo host: stanza, lobby, gestione telefoni, ciclo di gioco.
 *
 * Flusso:  LOBBY (QR + partita dimostrativa di bot sullo sfondo)
 *          -> PARTITA (conto alla rovescia, poi si gioca)
 *          -> FINE (classifica)  -> NUOVA PARTITA o LOBBY
 */
(function () {
  'use strict';
  const C = CFG;
  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------------
  // Stato
  // ------------------------------------------------------------------
  let net = null;
  let roomCode = null, roomKey = null;
  let phase = 'lobby';          // 'lobby' | 'game' | 'over'
  let game = null;              // partita vera
  let demo = null;              // partita dimostrativa dietro la lobby
  /** slots[i] = { slot, name, cid, connected, leftAt } oppure null */
  const slots = [null, null, null, null];
  const waiting = new Map();    // cid -> nome (arrivati a partita in corso)
  let overShownAt = 0;
  let audioOn = false;

  const canvas = $('game');
  Render.init(canvas);

  // ------------------------------------------------------------------
  // Adattamento del canvas allo schermo (pixel nitidi)
  // ------------------------------------------------------------------
  function fit() {
    const s = Math.min(innerWidth / C.W, innerHeight / C.H);
    // se possibile usiamo un fattore intero: pixel tutti uguali
    const si = Math.floor(s);
    const scale = si >= 2 && si / s > 0.9 ? si : s;
    canvas.style.width = Math.floor(C.W * scale) + 'px';
    canvas.style.height = Math.floor(C.H * scale) + 'px';
  }
  addEventListener('resize', fit);
  fit();

  // ------------------------------------------------------------------
  // Rete
  // ------------------------------------------------------------------
  function connect() {
    // se la pagina si ricarica entro poco, riproviamo a riprendere la stessa stanza
    try {
      const saved = JSON.parse(sessionStorage.getItem('soldatini-room') || 'null');
      if (saved) { roomCode = saved.code; roomKey = saved.key; }
    } catch (e) { /* niente */ }

    net = new Net(() => '/ws?role=host' + (roomCode ? `&room=${roomCode}&key=${roomKey}` : ''), {
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
      const changed = m.code !== roomCode;
      roomCode = m.code; roomKey = m.key;
      sessionStorage.setItem('soldatini-room', JSON.stringify({ code: roomCode, key: roomKey }));
      if (changed) {
        // stanza nuova: i giocatori di prima non esistono più
        for (let i = 0; i < 4; i++) slots[i] = null;
      }
      // telefoni ancora collegati alla stanza (riaggancio dopo un'interruzione)
      for (const cid of m.ctrls || []) {
        const s = slotByCid(cid);
        if (s) { s.connected = true; sendYou(s); }
      }
      showJoinInfo();
      refreshLobby();
    } else if (m.t === 'cjoin') {
      const s = slotByCid(m.cid);
      if (s) { s.connected = true; sendYou(s); refreshLobby(); syncSoldierConn(s); }
      // altrimenti aspettiamo il suo "hello" con il nome
    } else if (m.t === 'cleave') {
      const s = slotByCid(m.cid);
      waiting.delete(m.cid);
      if (s) {
        s.connected = false;
        s.leftAt = performance.now();
        syncSoldierConn(s);
        refreshLobby();
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

  /** Il "capo" della lobby: il primo telefono collegato può avviare la partita */
  function leadSlot() {
    return slots.find((s) => s && s.connected) || null;
  }

  function cleanName(n) {
    n = PixelFont.norm(String(n || '').trim()).replace(/\s+/g, ' ').trim().slice(0, 9);
    return n || null;
  }

  function onControllerMessage(cid, d) {
    const s = slotByCid(cid);
    switch (d.t) {
      case 'hello': return onHello(cid, d);
      case 'in': {
        const sol = soldierOf(s);
        if (sol) {
          sol.input.x = clamp(+d.x || 0, -1, 1);
          sol.input.y = clamp(+d.y || 0, -1, 1);
        }
        return;
      }
      case 'fire': { const sol = soldierOf(s); if (sol) { sol.input.fire = !!d.on; if (d.on) sol.input.fireTap = true; } return; }
      // --- Stick di mira (stile Brawl Stars) ---
      // aim: il giocatore sta trascinando lo stick SPARA (a = angolo, null = annullato)
      case 'aim': { const sol = soldierOf(s); if (sol) sol.input.aimStick = angleOrNull(d.a); return; }
      // shoot: ha rilasciato lo stick -> un colpo (a = angolo mirato, null = tocco semplice)
      case 'shoot': {
        const sol = soldierOf(s);
        if (sol && phase === 'game') { sol.input.aimStick = null; sol.input.shot = { a: angleOrNull(d.a) }; }
        return;
      }
      // paim: sta mirando con lo stick POWERUP (m = forza del lancio 0..1)
      case 'paim': {
        const sol = soldierOf(s);
        if (sol) { sol.input.powStick = angleOrNull(d.a); sol.input.powMag = clamp(+d.m || 0, 0, 1); }
        return;
      }
      case 'pow': {
        const sol = soldierOf(s);
        if (sol) sol.input.powStick = null;
        if (sol && phase === 'game') sol.input.pow = { a: angleOrNull(d.a), m: d.m == null ? null : clamp(+d.m, 0, 1) };
        return;
      }
      case 'start':
        if (phase === 'lobby' && s && leadSlot() === s) startMatch();
        return;
      case 'again':
        if (phase === 'over' && s && leadSlot() === s) startMatch();
        return;
      case 'lobby':
        if (phase === 'over' && s && leadSlot() === s) backToLobby();
        return;
      case 'leave':
        if (s && phase !== 'game') { slots[s.slot] = null; refreshLobby(); broadcastYou(); }
        return;
      default:
    }
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const angleOrNull = (a) => (a === null || a === undefined || !isFinite(+a) ? null : +a);

  function onHello(cid, d) {
    const name = cleanName(d.name) || 'SOLDATO';
    let s = slotByCid(cid);
    if (s) {
      // stesso telefono che rientra
      s.connected = true;
      if (phase !== 'game') s.name = name;
      syncSoldierConn(s);
      sendYou(s); refreshLobby(); broadcastYou();
      return;
    }
    // Rientro da un altro browser/telefono: stesso nome di un giocatore scollegato
    s = slots.find((x) => x && !x.connected && x.name === name);
    if (s) {
      s.cid = cid; s.connected = true;
      const sol = soldierOf(s); if (sol) sol.cid = cid;
      syncSoldierConn(s);
      sendYou(s); refreshLobby(); broadcastYou();
      return;
    }
    // Giocatore nuovo
    if (phase === 'game') {
      waiting.set(cid, name);
      toPhone(cid, { t: 'wait', msg: 'PARTITA IN CORSO! ENTRERAI ALLA PROSSIMA' });
      return;
    }
    const free = slots.findIndex((x) => !x);
    if (free === -1) { toPhone(cid, { t: 'full', msg: 'STANZA PIENA (4 GIOCATORI)' }); return; }
    slots[free] = { slot: free, name: uniqueName(name, free), cid, connected: true };
    Sfx.play('join');
    refreshLobby();
    broadcastYou();
  }

  function uniqueName(name, slot) {
    const taken = slots.filter((x) => x && x.slot !== slot).map((x) => x.name);
    if (!taken.includes(name)) return name;
    return (name.slice(0, 7) + ' ' + (slot + 1)).trim();
  }

  function soldierOf(s) {
    if (!s || !game) return null;
    return game.soldiers.find((x) => !x.isBot && x.slot === s.slot) || null;
  }
  function syncSoldierConn(s) {
    const sol = soldierOf(s);
    if (sol) {
      sol.connected = s.connected;
      if (!s.connected) { sol.input.x = 0; sol.input.y = 0; sol.input.fire = false; sol.input.aimStick = null; sol.input.powStick = null; }
    }
  }

  /** Dice a un telefono chi è e in che fase siamo */
  function sendYou(s) {
    if (!s || !s.connected) return;
    const pc = C.PLAYERS[s.slot];
    const lead = leadSlot() === s;
    const msg = {
      t: 'you', slot: s.slot, name: s.name, color: pc.color, dark: pc.dark, lead, phase,
      room: roomCode,
      players: humans().map((x) => ({ slot: x.slot, name: x.name, color: C.PLAYERS[x.slot].color, on: x.connected })),
    };
    if (phase === 'over' && game) {
      msg.rank = game.ranking().map((x) => ({ slot: x.slot, name: x.name, kills: x.kills, deaths: x.deaths, bot: x.isBot }));
      msg.winner = game.winner ? game.winner.slot : -1;
    }
    toPhone(s.cid, msg);
    sendHud(soldierOf(s), true);
  }
  function broadcastYou() { for (const s of humans()) sendYou(s); }

  // --- HUD dei telefoni: inviato solo quando cambia qualcosa ---
  const lastHud = new Map();
  function sendHud(sol, force) {
    if (!sol || sol.isBot) return;
    const s = slots[sol.slot];
    if (!s || !s.connected) return;
    const hud = {
      t: 'st', ammo: sol.ammo, kills: sol.kills, pow: sol.power,
      dead: sol.dead ? Math.max(1, Math.ceil(sol.respawnT)) : 0,
      shield: sol.shieldT > 0 ? Math.ceil(sol.shieldT) : 0,
      flash: sol.flashT > 0 ? Math.ceil(sol.flashT) : 0,
      time: game ? Math.ceil(game.time) : 0,
    };
    const key = JSON.stringify(hud);
    if (!force && lastHud.get(s.cid) === key) return;
    lastHud.set(s.cid, key);
    toPhone(s.cid, hud);
  }

  // ------------------------------------------------------------------
  // Eventi dalla partita -> suoni, vibrazioni, schermate
  // ------------------------------------------------------------------
  function onGameEvent(type, data) {
    if (type === 'sfx') Sfx.play(data);
    else if (type === 'announce') Sfx.announce(data);
    else if (type === 'music') { if (data) Sfx.startMusic(); else Sfx.stopMusic(); }
    else if (type === 'buzz') {
      const s = slots[data.s.slot];
      if (!data.s.isBot && s) toPhone(s.cid, { t: 'buzz', p: data.pattern });
    } else if (type === 'hud') sendHud(data);
    else if (type === 'over') onMatchOver(data);
  }

  // ------------------------------------------------------------------
  // Fasi
  // ------------------------------------------------------------------
  function newDemo() {
    // partita dimostrativa a 4 bot, muta, dietro la lobby
    demo = new Game([0, 1, 2, 3].map((i) => ({ slot: i, name: C.BOT_NAMES[i], isBot: true })), () => {});
    demo.state = 'play';
    demo.time = 9999;
  }

  function startMatch() {
    if (phase === 'game') return;
    // chi era in attesa entra ora (se c'è posto)
    for (const [cid, name] of waiting) {
      const free = slots.findIndex((x) => !x);
      if (free === -1) break;
      slots[free] = { slot: free, name: uniqueName(name, free), cid, connected: true };
    }
    waiting.clear();
    // giocatori scollegati da molto: fuori
    for (let i = 0; i < 4; i++) if (slots[i] && !slots[i].connected) slots[i] = null;

    const defs = humans().map((s) => ({ slot: s.slot, name: s.name, cid: s.cid, isBot: false }));
    if (defs.length <= 1) {
      // da solo (o nessuno): arrivano i bot negli slot liberi
      const names = C.BOT_NAMES.slice().sort(() => Math.random() - 0.5);
      for (let i = 0; i < 4; i++) {
        if (!defs.some((d) => d.slot === i)) defs.push({ slot: i, name: names.pop(), isBot: true });
      }
    }
    defs.sort((a, b) => a.slot - b.slot);
    game = new Game(defs, onGameEvent);
    phase = 'game';
    demo = null;
    lastHud.clear();
    $('lobby').classList.add('hidden');
    $('over').classList.add('hidden');
    document.body.classList.add('playing');
    broadcastYou();
  }

  function onMatchOver(winner) {
    phase = 'over';
    overShownAt = performance.now() + 1800; // prima lasciamo vedere "MISSION COMPLETE!"
    broadcastYou();
    setTimeout(() => {
      if (phase !== 'over') return;
      showOver(winner);
      Sfx.play('win_jingle');
      setTimeout(() => Sfx.announce('Winner! ' + winner.name.toLowerCase()), 400);
    }, 1800);
  }

  function showOver(winner) {
    const pc = C.PLAYERS[winner.slot];
    $('winnerTitle').textContent = 'WINNER!';
    $('winnerName').textContent = winner.name + (winner.isBot ? ' (CPU)' : '');
    $('winnerName').style.color = pc.color;
    const body = $('rankBody');
    body.innerHTML = '';
    game.ranking().forEach((s, i) => {
      const tr = document.createElement('tr');
      if (i === 0) tr.className = 'first';
      tr.innerHTML = `<td class="pos">${i + 1}°</td><td class="sw" style="background:${C.PLAYERS[s.slot].color}"></td>` +
        `<td style="color:${C.PLAYERS[s.slot].color}">${escapeHtml(s.name)}${s.isBot ? ' <small>CPU</small>' : ''}</td>` +
        `<td class="k">${s.kills} ELIM.</td><td class="d">${s.deaths} K.O.</td>`;
      body.appendChild(tr);
    });
    $('over').classList.remove('hidden');
  }

  function backToLobby() {
    phase = 'lobby';
    game = null;
    Sfx.stopMusic();
    for (const [cid, name] of waiting) {
      const free = slots.findIndex((x) => !x);
      if (free === -1) break;
      slots[free] = { slot: free, name: uniqueName(name, free), cid, connected: true };
    }
    waiting.clear();
    newDemo();
    $('over').classList.add('hidden');
    $('lobby').classList.remove('hidden');
    document.body.classList.remove('playing');
    refreshLobby();
    broadcastYou();
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ------------------------------------------------------------------
  // Lobby (DOM)
  // ------------------------------------------------------------------
  async function showJoinInfo() {
    let base = location.origin;
    // Aperto come "localhost"? I telefoni non possono raggiungerlo: usiamo l'IP della rete Wi-Fi
    if (/^(localhost|127\.|\[::1\])/.test(location.hostname)) {
      try {
        const info = await (await fetch('/api/info')).json();
        if (info.lan && info.lan.length) base = `${location.protocol}//${info.lan[0]}:${location.port || info.port}`;
      } catch (e) { /* lasciamo l'origine */ }
    }
    const url = `${base}/play?r=${roomCode}`;
    $('joinUrl').textContent = base.replace(/^https?:\/\//, '') + '/play';
    $('roomCode').textContent = roomCode;
    try { QR.draw($('qr'), QR.make(url), 8); } catch (e) { console.error(e); }
    $('qr').title = url;
  }

  function refreshLobby() {
    const ul = $('slots');
    ul.innerHTML = '';
    const art = Render.soldierArt();
    for (let i = 0; i < 4; i++) {
      const s = slots[i];
      const pc = C.PLAYERS[i];
      const li = document.createElement('li');
      const num = `<span class="num" style="background:${pc.color}">${i + 1}</span>`;
      if (s) {
        li.innerHTML = num;
        const cv = document.createElement('canvas');
        cv.width = 12; cv.height = 17;
        cv.getContext('2d').drawImage(art[i].right.stand, 0, 0);
        li.appendChild(cv);
        const nm = document.createElement('span');
        nm.textContent = s.name;
        nm.style.color = pc.color;
        li.appendChild(nm);
        const tag = document.createElement('span');
        tag.className = 'tag' + (s.connected ? '' : ' off');
        tag.textContent = s.connected ? (leadSlot() === s ? 'CAPO' : 'PRONTO') : 'OFFLINE';
        li.appendChild(tag);
      } else {
        li.className = 'empty';
        li.innerHTML = num + '<span>IN ATTESA...</span>';
      }
      ul.appendChild(li);
    }
    const n = humans().length;
    $('lobbyHint').textContent = n === 0 ? 'Da 1 a 4 giocatori. Da solo? Arrivano 3 bot!'
      : n === 1 ? 'Sei da solo: giocherai contro 3 bot!' : `${n} giocatori: tutti contro tutti!`;
    $('startBtn').textContent = n === 0 ? 'DEMO (SOLO BOT)' : 'INIZIA';
  }

  // Giocatori in lobby scollegati da più di 20 secondi: liberiamo il posto
  setInterval(() => {
    if (phase !== 'lobby') return;
    let changed = false;
    for (let i = 0; i < 4; i++) {
      const s = slots[i];
      if (s && !s.connected && performance.now() - s.leftAt > 20000) { slots[i] = null; changed = true; }
    }
    if (changed) { refreshLobby(); broadcastYou(); }
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
    if (phase === 'game' && game && game.state === 'play') Sfx.startMusic();
  }
  addEventListener('pointerdown', enableAudio);
  addEventListener('keydown', enableAudio);

  $('startBtn').onclick = () => startMatch();
  $('againBtn').onclick = () => startMatch();
  $('lobbyBtn').onclick = () => backToLobby();
  $('muteBtn').onclick = () => { $('muteBtn').textContent = Sfx.toggleMute() ? 'AUDIO OFF' : 'AUDIO ON'; };
  $('fsBtn').onclick = toggleFullscreen;

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen && document.exitFullscreen();
  }

  addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (phase === 'lobby') startMatch();
      else if (phase === 'over' && performance.now() > overShownAt) startMatch();
    } else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    else if (e.key === 'm' || e.key === 'M') $('muteBtn').click();
    else if (e.key === 'Escape' && phase === 'over') backToLobby();
  });

  // ------------------------------------------------------------------
  // Ciclo principale (60 fotogrammi al secondo, passo fisso)
  // ------------------------------------------------------------------
  const STEP = 1 / 60;
  let acc = 0, last = performance.now(), hudTimer = 0;
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25; // scheda in background: niente salti enormi
    acc += dt;
    const g = game || demo;
    while (acc >= STEP) {
      if (g) g.update(STEP);
      acc -= STEP;
    }
    if (g) Render.draw(g, { roomCode: game ? roomCode : null });

    // aggiornamento periodico dell'HUD sui telefoni
    hudTimer += dt;
    if (game && hudTimer > 0.25) {
      hudTimer = 0;
      for (const s of game.soldiers) sendHud(s);
    }
    requestAnimationFrame(frame);
  }

  // Avvio
  newDemo();
  refreshLobby();
  connect();
  requestAnimationFrame(frame);

  // Per i test automatici
  window.__host = { get game() { return game; }, get phase() { return phase; }, slots, startMatch, backToLobby };
})();
