/**
 * PIPPO GAME ROOM — schermo intero, senza barre del browser.
 *
 * - Android / PC / iPad: Fullscreen API (serve un tocco o un tasto dell'utente, quindi
 *   proviamo al primo gesto) + blocco in orizzontale dove possibile.
 * - iPhone: Safari non permette lo schermo intero a una pagina web. L'unica strada è
 *   "Condividi > Aggiungi a Home": da lì la pagina si apre a tutto schermo (modalità app).
 *   Per questo esiste needsInstall, che serve a mostrare un suggerimento.
 */
(function () {
  'use strict';
  var de = document.documentElement;
  var req = de.requestFullscreen || de.webkitRequestFullscreen || de.msRequestFullscreen;

  function active() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function standalone() {
    try {
      if (window.navigator.standalone === true) return true;
      return !!(window.matchMedia && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches));
    } catch (e) { return false; }
  }
  var ua = navigator.userAgent || '';
  var isIPhone = /iPhone|iPod/.test(ua);

  function lockLandscape() {
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) { /* non supportato */ }
  }

  function enter() {
    if (active() || standalone() || !req) return;
    try {
      var p = req.call(de, { navigationUI: 'hide' });
      if (p && p.then) p.then(lockLandscape, function () {});
      else lockLandscape();
    } catch (e) { /* serve un gesto dell'utente: riproveremo al prossimo */ }
  }

  function exit() {
    var f = document.exitFullscreen || document.webkitExitFullscreen;
    try { if (f) { var p = f.call(document); if (p && p.catch) p.catch(function () {}); } } catch (e) { /* niente */ }
  }

  function toggle() { if (active()) exit(); else enter(); }

  /**
   * Entra a schermo intero al primo gesto dell'utente.
   * persistent = true: riprova a ogni tocco finché non ci riesce (joystick: nessun tasto per uscire).
   * persistent = false: se l'utente esce di proposito (tasto F, ESC) non lo rimettiamo a forza.
   */
  function autoOnGesture(persistent) {
    var stopped = false;
    function onGesture(e) {
      if (stopped || active() || standalone()) return;
      if (e && e.type === 'keydown' && (e.key === 'Escape' || e.key === 'f' || e.key === 'F')) return;
      enter();
    }
    ['click', 'touchend', 'keydown'].forEach(function (name) { document.addEventListener(name, onGesture, true); });
    if (!persistent) {
      var seen = false;
      var onChange = function () {
        if (active()) seen = true;
        else if (seen) stopped = true;   // era a schermo intero ed è uscito: scelta dell'utente
      };
      document.addEventListener('fullscreenchange', onChange);
      document.addEventListener('webkitfullscreenchange', onChange);
    }
  }

  window.PGFullscreen = {
    supported: !!req,
    active: active,
    standalone: standalone,
    /** iPhone nel browser: lo schermo intero è possibile solo aggiungendo la pagina alla Home */
    needsInstall: isIPhone && !standalone(),
    enter: enter, exit: exit, toggle: toggle, autoOnGesture: autoOnGesture,
  };
})();
