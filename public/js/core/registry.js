/**
 * PIPPO GAME ROOM — elementi comuni a tutti i giochi.
 *
 *  - ROOM.PLAYERS: i 4 colori dei giocatori (uguali in tutti i giochi)
 *  - GAMES: elenco dei giochi; ogni gioco si registra con GAMES.register({...})
 *
 * Come è fatto un gioco (vedi js/games/shooter/index.js come esempio):
 *
 *   GAMES.register({
 *     id: 'shooter',               // identificativo
 *     title: 'SOLDATINI ARENA',    // nome nel menu
 *     desc: 'Sparatutto ...',      // una riga di descrizione
 *     players: '1-4',              // testo mostrato nel menu
 *     layout: 'shooter',           // quale controller mostrare sul telefono
 *     available: true,             // false = "PROSSIMAMENTE"
 *     icon(ctx, x, y) {...},       // icona pixel art 24x24 per il menu
 *     demo() { return {update(dt), draw()} },   // animazione di sfondo nel menu (facoltativa)
 *     create(room, humans) { return session }    // avvia una partita
 *   });
 *
 * La "session" restituita da create() deve avere:
 *   update(dt)            avanza la simulazione
 *   draw()                disegna sul canvas principale
 *   input(slot, msg)      messaggio arrivato dal telefono del giocatore "slot"
 *   setConnected(slot,on) un telefono si è scollegato / è rientrato
 *   hud(slot)             oggetto da mandare al telefono (munizioni, punti...)
 *   stop()                pulizia (musica, ecc.)
 * e quando la partita finisce chiama room.finish(ranking, { delay })
 *   ranking = [{ slot, name, bot, detail }] dal primo all'ultimo
 */
(function () {
  'use strict';

  window.ROOM = {
    NAME: 'PIPPO GAME ROOM',
    PLAYERS: [
      { name: 'ROSSO',  color: '#ff3b3b', dark: '#a3172a', light: '#ff9c8a' },
      { name: 'BLU',    color: '#2f8bff', dark: '#1a3fa8', light: '#9ccbff' },
      { name: 'GIALLO', color: '#ffd23b', dark: '#c27a12', light: '#fff1a0' },
      { name: 'VERDE',  color: '#3fe05a', dark: '#16843a', light: '#a6ffad' },
    ],
    // punti della "classifica della serata" per posizione (solo giocatori umani)
    EVENING_POINTS: [3, 2, 1, 0],
  };

  const list = [];
  window.GAMES = {
    list,
    register(def) { list.push(def); },
    get(id) { return list.find((g) => g.id === id) || null; },
  };
})();
