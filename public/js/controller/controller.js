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
  const screens = ['scrJoin', 'scrLobby', 'scrPad', 'scrSheep', 'scrDiff', 'scrOver', 'scrMsg'];
  let current = 'scrJoin';
  function show(id) {
    current = id;
    for (const s of screens) $(s).classList.toggle('hidden', s !== id);
    checkOrientation();
  }

  function checkOrientation() {
    const portrait = innerHeight > innerWidth;
    $('rotate').classList.toggle('hidden', !(portrait && GAME_SCREENS.has(current)));
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
      case 'scene': diffScene = m; drawDiff(); break;
      default:
    }
  }

  function showMsg(text, retry) {
    $('msgText').textContent = text;
    $('btnRetry').classList.toggle('hidden', !retry);
    show('scrMsg');
  }
  $('btnRetry').onclick = () => { if (net) net.send({ t: 'hello', name: myName }); };

  // Quale schermata del telefono usa ciascun gioco
  const LAYOUT_SCREENS = { shooter: 'scrPad', sheep: 'scrSheep', diff: 'scrDiff' };
  const GAME_SCREENS = new Set(Object.values(LAYOUT_SCREENS));

  function onYou(m) {
    me = m;
    myName = m.name;
    document.body.style.setProperty('--pc', m.color);
    document.body.style.setProperty('--pcd', m.dark);

    if (m.phase === 'hub') {
      showHub(m);
      resetStick();
    } else if (m.phase === 'game') {
      const scr = LAYOUT_SCREENS[m.layout] || 'scrPad';
      $('padChip').textContent = m.slot + 1;
      $('padName').textContent = m.name;
      for (const el of document.querySelectorAll('.sheep-chip, .diff-chip')) el.textContent = m.slot + 1;
      for (const el of document.querySelectorAll('.sheep-name')) el.textContent = m.name;
      if (current !== scr) resetStick();
      show(scr);
    } else if (m.phase === 'over') {
      resetStick();
      sendStick(0, 0, true);
      $('overGame').textContent = m.gameTitle || '';
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
          li.textContent = `${i + 1}° ${r.name}  ${r.detail}${r.pts ? '  +' + r.pts + ' PT' : ''}`;
          if (r.slot === m.slot && !r.bot) li.className = 'me';
          ol.appendChild(li);
        });
        if (iWon && !overBuzzed) { overBuzzed = true; buzz([100, 80, 100, 80, 300]); }
      }
      $('btnAgain').classList.toggle('hidden', !m.lead);
      $('btnLobby').classList.toggle('hidden', !m.lead);
      $('overNote').textContent = m.lead ? 'SEI IL CAPO: RIGIOCHIAMO O CAMBIAMO GIOCO?' : 'IL CAPO SCEGLIE COSA FARE...';
      show('scrOver');
    }
    if (m.phase !== 'over') overBuzzed = false;
  }
  let overBuzzed = false;

  /** Menu della sala sul telefono: classifica della serata + scelta del gioco (solo il capo) */
  function showHub(m) {
    $('meNum').textContent = m.slot + 1;
    $('meName').textContent = m.name;
    const ul = $('roster');
    ul.innerHTML = '';
    m.players.slice().sort((a, b) => b.pts - a.pts).forEach((p) => {
      const li = document.createElement('li');
      li.textContent = `${p.name} ${p.pts}PT`;
      li.style.borderColor = p.color;
      if (!p.on) li.className = 'off';
      ul.appendChild(li);
    });

    const list = $('gameList');
    list.innerHTML = '';
    for (const g of m.games) {
      const b = document.createElement('button');
      b.className = 'game-btn' + (g.id === m.game ? ' sel' : '') + (g.available ? '' : ' soon');
      b.innerHTML = `<span class="gt"></span><span class="gp"></span>`;
      b.querySelector('.gt').textContent = g.title;
      b.querySelector('.gp').textContent = g.available ? g.players : 'PROSSIMAMENTE';
      b.disabled = !m.lead;
      b.onclick = () => { send({ t: 'pick', game: g.id }); buzz(10); };
      list.appendChild(b);
    }
    const sel = m.games.find((g) => g.id === m.game);
    $('btnStart').classList.toggle('hidden', !m.lead);
    $('btnStart').disabled = !(sel && sel.available);
    $('btnStart').textContent = sel && sel.available ? 'GIOCA A ' + sel.title + '!' : 'IN ARRIVO...';
    $('lobbyNote').textContent = m.lead
      ? 'SEI IL CAPO: SCEGLI IL GIOCO'
      : 'IL CAPO STA SCEGLIENDO... (' + (sel ? sel.title : '') + ')';
    show('scrLobby');
  }

  // ------------------------------------------------------------------
  // HUD del telefono
  // ------------------------------------------------------------------
  const ammoEl = $('padAmmo');
  for (let i = 0; i < 10; i++) ammoEl.appendChild(document.createElement('i'));
  Icons.drawIcon($('skullIcon').getContext('2d'), 'skull', 0, 0, 1);
  let lastPow = undefined, lastDead = 0, lastKills = 0;

  function onHud(h) {
    if (me && me.layout === 'sheep') return onSheepHud(h);
    if (me && me.layout === 'diff') return onDiffHud(h);
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
  // Ogni schermata di gioco ha la sua zona joystick (classe .stick-zone):
  // gli eventi sono gli stessi, cambia solo quale zona è attiva.
  let zone = null, base = null, knob = null;
  let stickId = null, ox = 0, oy = 0, sx = 0, sy = 0, lastSent = 0, sentX = 0, sentY = 0;
  const RADIUS = () => base.offsetWidth * 0.38;

  function resetStick() {
    stickId = null; sx = sy = 0;
    for (const z of document.querySelectorAll('.stick-zone')) {
      z.querySelector('.stick-knob').style.transform = 'translate(0,0)';
      const b = z.querySelector('.stick-base');
      b.style.left = '30%'; b.style.top = '55%';
    }
  }

  for (const z of document.querySelectorAll('.stick-zone')) {
    z.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (stickId !== null) return;
      zone = z; base = z.querySelector('.stick-base'); knob = z.querySelector('.stick-knob');
      stickId = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      const r = zone.getBoundingClientRect();
      ox = e.clientX; oy = e.clientY;
      base.style.left = (e.clientX - r.left) + 'px';
      base.style.top = (e.clientY - r.top) + 'px';
      moveStick(e);
    });
    z.addEventListener('pointermove', (e) => { if (e.pointerId === stickId && z === zone) { e.preventDefault(); moveStick(e); } });
    const endStick = (e) => {
      if (e.pointerId !== stickId || z !== zone) return;
      stickId = null; sx = sy = 0;
      knob.style.transform = 'translate(0,0)';
      sendStick(0, 0, true);
    };
    z.addEventListener('pointerup', endStick);
    z.addEventListener('pointercancel', endStick);
    z.addEventListener('lostpointercapture', endStick);
  }

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
  setInterval(() => { if (GAME_SCREENS.has(current) && net) net.send({ t: 'in', x: sentX, y: sentY }); }, 500);

  // ------------------------------------------------------------------
  // Stick d'attacco stile Brawl Stars (SPARA e POWERUP)
  //   - TOCCO veloce          -> colpo nella direzione in cui stai camminando
  //   - TIENI PREMUTO fermo   -> raffica nella direzione in cui cammini
  //   - TRASCINA              -> mira (sullo schermo grande compare il mirino),
  //                              RILASCIA per sparare lì
  //   - riporta il dito al centro prima di rilasciare -> annulla
  // ------------------------------------------------------------------
  function attackStick(el, h) {
    const knob = el.querySelector('.aknob');
    let id = null, aiming = false, cancel = false, holding = false, holdTimer = null;
    let cx = 0, cy = 0, ang = 0, mag = 0, lastSend = 0;
    const R = () => el.offsetWidth * 0.75;         // distanza massima di trascinamento
    const TH = () => Math.max(24, el.offsetWidth * 0.3); // soglia per iniziare a mirare (alta: i tocchi restano tocchi)

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (id !== null || (h.enabled && !h.enabled())) return;
      id = e.pointerId;
      el.setPointerCapture(id);
      const r = el.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;  // il centro del pulsante è l'origine
      aiming = false; cancel = false; holding = false;
      el.classList.add('pressed');
      buzz(10);
      if (h.onHoldStart) holdTimer = setTimeout(() => { holding = true; h.onHoldStart(); }, 260);
    });

    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      e.preventDefault();
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const d = Math.hypot(dx, dy), max = R();
      if (!aiming && d > TH()) {
        aiming = true;
        clearTimeout(holdTimer);
        if (holding) { holding = false; h.onHoldEnd && h.onHoldEnd(); }
        el.classList.add('aiming');
      }
      if (!aiming) return;
      if (d > max) { dx = (dx / d) * max; dy = (dy / d) * max; }
      knob.style.transform = `translate(${Math.round(dx)}px,${Math.round(dy)}px)`;
      const nowCancel = d < TH() * 0.8;
      if (nowCancel !== cancel) { cancel = nowCancel; el.classList.toggle('cancel', cancel); if (cancel) buzz(8); }
      ang = Math.atan2(dy, dx);
      mag = Math.min(1, d / max);
      const now = performance.now();
      if (now - lastSend > 33) { lastSend = now; h.onAim(cancel ? null : ang, mag); }
    });

    const up = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      clearTimeout(holdTimer);
      el.classList.remove('pressed', 'aiming', 'cancel');
      knob.style.transform = '';
      if (holding) { holding = false; h.onHoldEnd && h.onHoldEnd(); return; }
      if (aiming) {
        if (cancel) h.onAim(null, 0);                // annullato
        else h.onRelease(ang, mag);                  // colpo mirato
      } else {
        h.onRelease(null, null);                     // tocco semplice
      }
      aiming = false;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  }

  const send = (m) => { if (net) net.send(m); };
  const r3 = (a) => (a == null ? null : Math.round(a * 1000) / 1000);

  attackStick($('btnFire'), {
    onAim: (a) => send({ t: 'aim', a: r3(a) }),
    onRelease: (a) => send({ t: 'shoot', a: r3(a) }),
    onHoldStart: () => send({ t: 'fire', on: 1 }),   // tenuto premuto senza trascinare: raffica
    onHoldEnd: () => send({ t: 'fire', on: 0 }),
  });

  attackStick($('btnPow'), {
    enabled: () => !!lastPow,                        // niente powerup = stick spento
    onAim: (a, m) => send({ t: 'paim', a: r3(a), m: r3(m) }),
    onRelease: (a, m) => send({ t: 'pow', a: r3(a), m: r3(m) }),
  });

  $('btnStart').onclick = () => { goFullscreen(); send({ t: 'start' }); };
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
  // HOLY SHEEP: pulsanti ABBAIA e SCATTO, con ricarica mostrata sul pulsante
  // ------------------------------------------------------------------
  const sheepCfg = { barkMax: 0.7, dashMax: 3 };
  Icons.drawIcon($('sheepIcon').getContext('2d'), 'sheep', 0, 0, 1);

  function onSheepHud(h) {
    $('sheepCount').textContent = h.sheep;
    const t = Math.max(0, h.time);
    $('sheepTime').textContent = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
    if (h.barkMax) sheepCfg.barkMax = h.barkMax;
    if (h.dashMax) sheepCfg.dashMax = h.dashMax;
    if (h.point) { const el = $('sheepFlash'); el.className = 'flash-layer on'; setTimeout(() => { el.className = 'flash-layer'; }, 60); }
  }

  /** Pulsante semplice con ricarica: la barra scura scende mentre si ricarica */
  function coolButton(el, msg, maxKey, vib) {
    const cd = el.querySelector('.cd');
    let readyAt = 0;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.classList.add('pressed');
      const now = performance.now();
      if (now < readyAt) { buzz(8); return; }
      send(msg);
      buzz(vib);
      const dur = sheepCfg[maxKey] * 1000;
      readyAt = now + dur;
      cd.style.transition = 'none';
      cd.style.height = '100%';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        cd.style.transition = `height ${dur}ms linear`;
        cd.style.height = '0%';
      }));
    });
    const up = () => el.classList.remove('pressed');
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  }
  coolButton($('btnBark'), { t: 'bark' }, 'barkMax', [30, 20, 30]);
  coolButton($('btnDash'), { t: 'dash' }, 'dashMax', 40);

  // ------------------------------------------------------------------
  // TROVA LE DIFFERENZE: la scena modificata, da toccare dove si vede una differenza
  // ------------------------------------------------------------------
  let diffScene = null, diffHud = null, diffTaps = [];
  const dcv = $('diffCanvas'), dctx = dcv.getContext('2d');

  function fitDiff() {
    // la scena (320x180) riempie lo schermo mantenendo le proporzioni
    const s = Math.min(innerWidth / DiffScene.SW, innerHeight / DiffScene.SH);
    dcv.style.width = Math.floor(DiffScene.SW * s) + 'px';
    dcv.style.height = Math.floor(DiffScene.SH * s) + 'px';
  }
  addEventListener('resize', fitDiff);
  fitDiff();

  function circle(x, y, r, c) {
    dctx.fillStyle = c;
    const n = Math.ceil(r * 6);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; dctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1); }
  }

  function drawDiff() {
    if (!diffScene) return;
    DiffScene.draw(dctx, diffScene, 0, 0);
    const col = (me && me.color) || '#ffd23b';
    if (diffHud) {
      if (diffHud.all) for (const [x, y, r] of diffHud.all) { circle(x, y, r, '#ff3b3b'); }
      for (const [x, y, r] of diffHud.found) { circle(x, y, r, col); circle(x, y, r + 1, '#ffffff'); circle(x, y, r - 1, col); }
    }
    // piccoli segni dei tocchi recenti
    const now = performance.now();
    diffTaps = diffTaps.filter((t) => now - t.at < 600);
    for (const t of diffTaps) { dctx.fillStyle = '#ffffff'; dctx.fillRect(Math.round(t.x) - 1, Math.round(t.y), 3, 1); dctx.fillRect(Math.round(t.x), Math.round(t.y) - 1, 1, 3); }
  }
  setInterval(() => { if (current === 'scrDiff' && diffTaps.length) drawDiff(); }, 100);

  function onDiffHud(h) {
    diffHud = h;
    if (!diffScene || diffScene.id !== h.sceneId) { send({ t: 'needscene' }); }
    const prev = +$('diffFound').textContent;
    $('diffFound').textContent = h.found.length;
    $('diffTotal').textContent = h.total;
    const t = Math.max(0, h.time);
    $('diffTime').textContent = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
    $('diffLock').classList.toggle('hidden', !h.lock);
    if (h.found.length > prev) { const el = $('diffFlash'); el.className = 'flash-layer on'; setTimeout(() => { el.className = 'flash-layer'; }, 80); }
    drawDiff();
  }

  dcv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (!diffScene || (diffHud && diffHud.lock)) return;
    const r = dcv.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * DiffScene.SW;
    const y = (e.clientY - r.top) / r.height * DiffScene.SH;
    diffTaps.push({ x, y, at: performance.now() });
    send({ t: 'tap', x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    drawDiff();
  });

  // ------------------------------------------------------------------
  // Tastiera (comodo per provare dal PC):
  //   WASD = muovi · SPAZIO = spara dove cammini · IJKL = mira, rilascia per sparare · E = powerup
  // ------------------------------------------------------------------
  const keys = new Set();
  const dirOf = (up, left, down, right) => {
    let x = 0, y = 0;
    if (keys.has(left)) x -= 1;
    if (keys.has(right)) x += 1;
    if (keys.has(up)) y -= 1;
    if (keys.has(down)) y += 1;
    return { x, y };
  };
  let keyAim = null;
  function keyUpdate() {
    const m = dirOf('w', 'a', 's', 'd');
    const ar = dirOf('arrowup', 'arrowleft', 'arrowdown', 'arrowright');
    m.x += ar.x; m.y += ar.y;
    const d = Math.hypot(m.x, m.y) || 1;
    sx = m.x / d; sy = m.y / d;
    sendStick(sx, sy, true);
    const a = dirOf('i', 'j', 'k', 'l');
    if (a.x || a.y) { keyAim = Math.atan2(a.y, a.x); send({ t: 'aim', a: r3(keyAim) }); }
    else if (keyAim !== null) { send({ t: 'shoot', a: r3(keyAim) }); keyAim = null; }
  }
  addEventListener('keydown', (e) => {
    if (!GAME_SCREENS.has(current) || e.repeat) return;
    const k = e.key.toLowerCase();
    const sheep = current === 'scrSheep';
    if (k === ' ') { send(sheep ? { t: 'bark' } : { t: 'shoot', a: null }); e.preventDefault(); return; }
    if (k === 'e') { send(sheep ? { t: 'dash' } : { t: 'pow', a: null, m: null }); return; }
    keys.add(k); keyUpdate();
  });
  addEventListener('keyup', (e) => {
    if (!GAME_SCREENS.has(current)) return;
    keys.delete(e.key.toLowerCase()); keyUpdate();
  });

  // ------------------------------------------------------------------
  // Avvio: se arrivo dal QR e ho già un nome per questa stanza, rientro da solo
  // ------------------------------------------------------------------
  Logo.mount($('logo'));
  show('scrJoin');
  if (room && myName && store.get('room') === room) join();
})();
