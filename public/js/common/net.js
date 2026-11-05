/**
 * Connessione WebSocket con riconnessione automatica.
 * Usata sia dallo schermo host sia dal telefono.
 *
 *   const net = new Net(() => '/ws?role=host', {
 *     onmessage: (msg) => {...}, onopen: () => {...}, onclose: () => {...}
 *   });
 *   net.send({ ... });
 */
(function () {
  'use strict';

  class Net {
    /** @param {() => string} urlFn funzione che restituisce il percorso (ricalcolata a ogni tentativo) */
    constructor(urlFn, handlers) {
      this.urlFn = urlFn;
      this.h = handlers || {};
      this.ws = null;
      this.stopped = false;
      this.retry = 0;
      this.connect();
      // Quando il telefono torna in primo piano proviamo subito a riconnetterci
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !this.isOpen()) this.connect();
      });
    }

    isOpen() { return this.ws && this.ws.readyState === 1; }

    connect() {
      if (this.stopped) return;
      if (this.ws && this.ws.readyState <= 1) return; // già in corso
      const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
      const ws = new WebSocket(proto + location.host + this.urlFn());
      this.ws = ws;
      ws.onopen = () => { this.retry = 0; this.h.onopen && this.h.onopen(); };
      ws.onmessage = (e) => {
        let m; try { m = JSON.parse(e.data); } catch (err) { return; }
        this.h.onmessage && this.h.onmessage(m);
      };
      ws.onclose = () => {
        if (this.ws !== ws) return;
        this.h.onclose && this.h.onclose();
        if (this.stopped) return;
        // Attesa crescente: 0.5s, 1s, 2s ... massimo 4s
        const wait = Math.min(4000, 500 * Math.pow(2, this.retry++));
        setTimeout(() => this.connect(), wait);
      };
      ws.onerror = () => { /* gestito da onclose */ };
    }

    send(obj) {
      if (this.isOpen()) this.ws.send(JSON.stringify(obj));
    }

    stop() { this.stopped = true; if (this.ws) this.ws.close(); }
  }

  window.Net = Net;
})();
