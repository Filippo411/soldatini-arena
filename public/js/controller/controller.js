/**
 * Telefono = joystick.
 * Mostra la schermata giusta (ingresso, lobby, controller, fine partita)
 * e manda allo schermo host i comandi: movimento, sparo, powerup.
 */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------------
  // Identità persistente del telefono: serve per rientrare in partita
  // ------------------------------------------------------------------
  const store = {
    get(k) { try { return localStorage.getItem('soldatini-' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('soldatini-' + k, v); } catch (e) { /* privato */ } },
  };
  let cid = store.get('cid');
  if (!cid) {
    cid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    store.set('cid', cid);
  }

  const params = new URLSearchParams(location.search);
  let room = (params.get('r') || params.get('room') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  let myName = store.get('name') || '';
  let me = null;           // ultimo messaggio "you" dall'host
  let net = null;
  let joined = false;

  // ------------------------------------------------------------------
  // Schermate
  // ------------------------------------------------------------------
  const screens = ['scrJoin', 'scrLobby', 'scrPad', 'scrOver', 'scrMsg'];
  let current = 'scrJoin';
  function show(id) {
    current = id;
    for (const s of screens) $(s).classList.toggle('hidden', s !== id);
    checkOrientation();
  }

  function checkOrientation() {
    const portrait = innerHeight > innerWidth;
    $('rotate').classList.toggle('hidden', !(portrait && current === 'scrPad'));
  }
  addEventListener('resize', checkOrientation);
  addEventListener('orientationchange', () => setTimeout(checkOrientation, 200));

  // ------------------------------------------------------------------
  // Ingresso
  // ------------------------------------------------------------------
  $('inRoom').value = room;
  $('inName').value = myName;
  if (room) $('inRoom').parentElement.classList.add('hidden'); // codice già dal QR

  $('joinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const r = $('inRoom').value.toUpperCase().replace(/[^A-Z]/g, '');
    const n = $('inName').value.trim().toUpperCase().slice(0, 9);
    if (r.length !== 4) { $('joinErr').textContent = 'IL CODICE HA 4 LETTERE'; $('inRoom').parentElement.classList.remove('hidden'); return; }
    if (!n) { $('joinErr').textContent = 'SCRIVI UN NOME!'; return; }
    room = r; myName = n;
    store.set('name', n);
    store.set('room', r);
    goFullscreen();
    join();
  });

  function join() {
    $('joinErr').textContent = '';
    joined = true;
    if (net) net.stop();
    net = new Net(() => `/ws?role=ctrl&room=${room}&cid=${encodeURIComponent(cid)}`, {
      onopen: () => { $('connBadge').classList.add('hidden'); },
      onclose: () => { if (joined) $('connBadge').classList.remove('hidden'); },
      onmessage: onMessage,
    });
    // URL aggiornato: se si ricarica la pagina si rientra nella stessa stanza
    history.replaceState(null, '', `${location.pathname}?r=${room}`);
  }

  function goFullscreen() {
    const el = document.documentElement;
    try {
      const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : (el.webkitRequestFullscreen && el.webkitRequestFullscreen());
      if (p && p.then) p.then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
    } catch (e) { /* non supportato (iPhone): pazienza */ }
    // tieni lo schermo acceso
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* no */ }
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.wakeLock && joined) navigator.wakeLock.request('screen').catch(() => {});
  });

  // ------------------------------------------------------------------
  // Messaggi dall'host
  // ------------------------------------------------------------------
  function onMessage(m) {
    switch (m.t) {
      case 'ok':
        // collegati al server: presentiamoci all'host
        net.send({ t: 'hello', name: myName });
        if (!m.host) showMsg('LO SCHERMO GRANDE NON È COLLEGATO. ASPETTA UN ATTIMO...', false);
        break;
      case 'err':
        joined = false;
        net.stop();
        show('scrJoin');
        $('inRoom').parentElement.classList.remove('hidden');
        $('joinErr').textContent = m.code === 'noroom' ? 'STANZA NON TROVATA! CONTROLLA IL CODICE' : m.msg;
        break;
      case 'hostgone': showMsg('LO SCHERMO GRANDE SI È SCOLLEGATO... ASPETTA', false); break;
      case 'hostback': net.send({ t: 'hello', name: myName }); break;
      case 'wait': showMsg(m.msg, false); break;
      case 'full': showMsg(m.msg, true); break;
      case 'you': onYou(m); break;
      case 'st': onHud(m); break;
      case 'buzz': buzz(m.p); break;
      default:
    }
  }

  function showMsg(text, retry) {
    $('msgText').textContent = text;
    $('btnRetry').classList.toggle('hidden', !retry);
    show('scrMsg');
  }
  $('btnRetry').onclick = () => { if (net) net.send({ t: 'hello', name: myName }); };

  function onYou(m) {
    me = m;
    myName = m.name;
    document.body.style.setProperty('--pc', m.color);
    document.body.style.setProperty('--pcd', m.dark);
    drawMe(m.slot);

    if (m.phase === 'lobby') {
      $('meNum').textContent = 'GIOCATORE ' + (m.slot + 1);
      $('meName').textContent = m.name;
      const ul = $('roster');
      ul.innerHTML = '';
      for (const p of m.players) {
        const li = document.createElement('li');
        li.textContent = p.name;
        li.style.borderColor = p.color;
        if (!p.on) li.className = 'off';
        ul.appendChild(li);
      }
      $('btnStart').classList.toggle('hidden', !m.lead);
      $('btnStart').textContent = m.players.length === 1 ? 'INIZIA (VS BOT)' : 'INIZIA!';
      $('lobbyNote').textContent = m.lead
        ? (m.players.length === 1 ? 'SEI DA SOLO: SFIDERAI 3 BOT. OPPURE ASPETTA GLI AMICI!' : 'SEI IL CAPO: PREMI INIZIA QUANDO CI SIETE TUTTI')
        : 'ASPETTA CHE IL CAPO AVVII LA PARTITA...';
      show('scrLobby');
      resetStick();
    } else if (m.phase === 'game') {
      $('padChip').textContent = m.slot + 1;
      $('padName').textContent = m.name;
      if (current !== 'scrPad') { resetStick(); }
      show('scrPad');
    } else if (m.phase === 'over') {
      resetStick();
      sendStick(0, 0, true);
      if (m.rank) {
        const w = m.rank[0];
        const iWon = w && w.slot === m.slot && !w.bot;
        $('overTitle').textContent = iWon ? 'WINNER!' : 'GAME OVER';
        $('overWin').textContent = iWon ? 'HAI VINTO TU!' : 'VINCE ' + w.name;
        $('overWin').style.color = iWon ? m.color : '#fff';
        const ol = $('overRank');
        ol.innerHTML = '';
        m.rank.forEach((r, i) => {
          const li = document.createElement('li');
          li.textContent = `${i + 1}° ${r.name}  ${r.kills} ELIM.`;
          if (r.slot === m.slot && !r.bot) li.className = 'me';
          ol.appendChild(li);
        });
        if (iWon) buzz([100, 80, 100, 80, 300]);
      }
      $('btnAgain').classList.toggle('hidden', !m.lead);
      $('btnLobby').classList.toggle('hidden', !m.lead);
      $('overNote').textContent = m.lead ? 'SEI IL CAPO: RIGIOCHIAMO?' : 'IL CAPO SCEGLIE SE RIGIOCARE...';
      show('scrOver');
    }
  }

  // Soldatino nel colore del giocatore (stessa pixel art dello schermo grande)
  const BODY = [
    '...kkkkkk...', '..kHHHHhhk..', '.kHHhhhhhhk.', '.khhhhhhhdk.', 'kdhhhhhhhhdk', 'kkcccccccckk',
    '.ksssswkssk.', '.kSsssssssk.', '..kSSsssSk..', '..kcccccck..', '.kCcccccccCk', '.kCccCcccCk.',
    '..kPPPPPPk..', '..kppk.kppk.', '..kpPk.kpPk.', '..kbbbkkbbbk', '..kkkk.kkkk.',
  ];
  function drawMe(slot) {
    const pal = { k: '#1b1b26', H: '#9fb04f', h: '#66762f', d: '#3f4a1d', s: '#ffc690', S: '#d58a5c', w: '#fff', p: '#c2a463', P: '#86703c', b: '#5a3a22', c: me.color, C: me.dark };
    const g = $('meSprite').getContext('2d');
    g.clearRect(0, 0, 12, 17);
    BODY.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
  }

  // ------------------------------------------------------------------
  // HUD del telefono
  // ------------------------------------------------------------------
  const ammoEl = $('padAmmo');
  for (let i = 0; i < 10; i++) ammoEl.appendChild(document.createElement('i'));
  Icons.drawIcon($('skullIcon').getContext('2d'), 'skull', 0, 0, 1);
  let lastPow = undefined, lastDead = 0, lastKills = 0;

  function onHud(h) {
    [...ammoEl.children].forEach((el, i) => el.classList.toggle('empty', i >= h.ammo));
    ammoEl.classList.toggle('zero', h.ammo === 0);
    $('padKills').textContent = h.kills;
    const t = Math.max(0, h.time);
    $('padTime').textContent = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');

    // powerup
    if (h.pow !== lastPow) {
      lastPow = h.pow;
      const c = $('powIcon').getContext('2d');
      c.clearRect(0, 0, 9, 9);
      Icons.drawIcon(c, h.pow || 'grenade', 0, 0, 1);
      $('btnPow').classList.toggle('empty', !h.pow);
      $('btnPow').classList.toggle('ready', !!h.pow);
      $('powLabel').textContent = h.pow ? { flash: 'FLASH', grenade: 'GRANATA', shield: 'SCUDO' }[h.pow] : 'VUOTO';
    }
    if (!h.pow && (h.shield || h.flash)) $('powLabel').textContent = h.shield ? 'SCUDO ' + h.shield : 'FLASH ' + h.flash;
    else if (!h.pow) $('powLabel').textContent = 'VUOTO';

    // K.O.
    $('koLayer').classList.toggle('hidden', !h.dead);
    if (h.dead) $('koSub').textContent = 'RIENTRI TRA ' + h.dead;
    if (h.dead && !lastDead) flash('hit');
    if (h.kills > lastKills) flash('on');
    lastDead = h.dead; lastKills = h.kills;
  }

  function flash(cls) {
    const el = $('flashLayer');
    el.className = 'flash-layer ' + cls;
    setTimeout(() => { el.className = 'flash-layer'; }, 60);
  }

  function buzz(p) {
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* non supportato */ }
  }

  // ------------------------------------------------------------------
  // Joystick virtuale (mobile: compare dove appoggi il pollice)
  // ------------------------------------------------------------------
  const zone = $('stickZone'), base = $('stickBase'), knob = $('stickKnob');
  let stickId = null, ox = 0, oy = 0, sx = 0, sy = 0, lastSent = 0, sentX = 0, sentY = 0;
  const RADIUS = () => base.offsetWidth * 0.38;

  function resetStick() {
    stickId = null; sx = sy = 0;
    knob.style.transform = 'translate(0,0)';
    base.style.left = '30%'; base.style.top = '55%';
  }

  zone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (stickId !== null) return;
    stickId = e.pointerId;
    zone.setPointerCapture(e.pointerId);
    const r = zone.getBoundingClientRect();
    ox = e.clientX; oy = e.clientY;
    base.style.left = (e.clientX - r.left) + 'px';
    base.style.top = (e.clientY - r.top) + 'px';
    moveStick(e);
  });
  zone.addEventListener('pointermove', (e) => { if (e.pointerId === stickId) { e.preventDefault(); moveStick(e); } });
  const endStick = (e) => {
    if (e.pointerId !== stickId) return;
    stickId = null; sx = sy = 0;
    knob.style.transform = 'translate(0,0)';
    sendStick(0, 0, true);
  };
  zone.addEventListener('pointerup', endStick);
  zone.addEventListener('pointercancel', endStick);
  zone.addEventListener('lostpointercapture', endStick);

  function moveStick(e) {
    const R = RADIUS();
    let dx = e.clientX - ox, dy = e.clientY - oy;
    const d = Math.hypot(dx, dy);
    if (d > R) {
      // il joystick "insegue" il dito se esce dal cerchio
      ox += (dx / d) * (d - R); oy += (dy / d) * (d - R);
      const r = zone.getBoundingClientRect();
      base.style.left = (ox - r.left) + 'px';
      base.style.top = (oy - r.top) + 'px';
      dx = e.clientX - ox; dy = e.clientY - oy;
    }
    knob.style.transform = `translate(${Math.round(dx)}px,${Math.round(dy)}px)`;
    sx = dx / R; sy = dy / R;
    sendStick(sx, sy, false);
  }

  /** Invia la posizione del joystick (max ~30 volte al secondo, solo se cambia) */
  function sendStick(x, y, force) {
    if (!net) return;
    x = Math.round(x * 20) / 20; y = Math.round(y * 20) / 20;
    const now = performance.now();
    if (!force && (x === sentX && y === sentY)) return;
    if (!force && now - lastSent < 33) { pendingStick = true; return; }
    lastSent = now; sentX = x; sentY = y; pendingStick = false;
    net.send({ t: 'in', x, y });
  }
  let pendingStick = false;
  setInterval(() => { if (pendingStick) sendStick(sx, sy, true); }, 35);
  // ripetizione periodica: se un messaggio si perde, il soldatino non resta "incantato"
  setInterval(() => { if (current === 'scrPad' && net) net.send({ t: 'in', x: sentX, y: sentY }); }, 500);

  // ------------------------------------------------------------------
  // Pulsanti SPARA e POWERUP
  // ------------------------------------------------------------------
  const fireBtn = $('btnFire'), powBtn = $('btnPow');
  let fireId = null;
  fireBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    fireId = e.pointerId;
    fireBtn.setPointerCapture(e.pointerId);
    fireBtn.classList.add('pressed');
    if (net) net.send({ t: 'fire', on: 1 });
    buzz(12);
  });
  const fireUp = (e) => {
    if (e.pointerId !== fireId) return;
    fireId = null;
    fireBtn.classList.remove('pressed');
    if (net) net.send({ t: 'fire', on: 0 });
  };
  fireBtn.addEventListener('pointerup', fireUp);
  fireBtn.addEventListener('pointercancel', fireUp);
  fireBtn.addEventListener('lostpointercapture', fireUp);

  powBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    powBtn.classList.add('pressed');
    if (net) net.send({ t: 'pow' });
    buzz(20);
  });
  const powUp = () => powBtn.classList.remove('pressed');
  powBtn.addEventListener('pointerup', powUp);
  powBtn.addEventListener('pointercancel', powUp);
  powBtn.addEventListener('pointerleave', powUp);

  $('btnStart').onclick = () => { goFullscreen(); net && net.send({ t: 'start' }); };
  $('btnAgain').onclick = () => net && net.send({ t: 'again' });
  $('btnLobby').onclick = () => net && net.send({ t: 'lobby' });

  // Niente menu contestuale / pinch-zoom / doppio tap su iOS
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => { if (current !== 'scrJoin') e.preventDefault(); }, { passive: false });
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd < 300 && current !== 'scrJoin') e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  // ------------------------------------------------------------------
  // Tastiera (comodo per provare dal PC): WASD/frecce, SPAZIO, E
  // ------------------------------------------------------------------
  const keys = new Set();
  function keyStick() {
    let x = 0, y = 0;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (keys.has('w') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    const d = Math.hypot(x, y) || 1;
    sx = x / d; sy = y / d;
    sendStick(sx, sy, true);
  }
  addEventListener('keydown', (e) => {
    if (current !== 'scrPad' || e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { net && net.send({ t: 'fire', on: 1 }); e.preventDefault(); return; }
    if (k === 'e') { net && net.send({ t: 'pow' }); return; }
    keys.add(k); keyStick();
  });
  addEventListener('keyup', (e) => {
    if (current !== 'scrPad') return;
    const k = e.key.toLowerCase();
    if (k === ' ') { net && net.send({ t: 'fire', on: 0 }); return; }
    keys.delete(k); keyStick();
  });

  // ------------------------------------------------------------------
  // Avvio: se arrivo dal QR e ho già un nome per questa stanza, rientro da solo
  // ------------------------------------------------------------------
  show('scrJoin');
  if (room && myName && store.get('room') === room) join();
})();
