/**
 * THE BILLIONAIRE — regole e tempi (qui si cambiano i numeri del gioco).
 */
(function () {
  'use strict';

  window.BILL_CFG = {
    // schermo grande: risoluzione del canvas (16:9)
    W: 480, H: 270,

    // --- tempi, in secondi ---
    ASK_TIME: 60,          // tempo massimo per rispondere (si va avanti prima se rispondono tutti)
    INTRO: 3,              // schermata di presentazione
    LOCK_GRACE: 2,         // SQUADRA: quando hanno votato tutti, ultimi secondi per cambiare idea
    SUSPENSE_ARENA: 1.4,   // pausa "drammatica" prima di svelare la risposta
    SUSPENSE_TEAM: 2.6,
    REVEAL_ARENA: 5,       // quanto resta a schermo la risposta giusta
    REVEAL_TEAM: 4.5,
    FINISH_DELAY: 3500,    // prima della classifica finale

    // --- SFIDA (tutti contro tutti) ---
    // difficoltà delle 10 domande: 3 facili, 4 medie, 3 difficili
    ARENA_LEVELS: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3],
    ARENA_MIN_PLAYERS: 2,

    // --- SQUADRA (verso il milione) ---
    // 15 domande: 5 facili, 5 medie, 5 difficili
    TEAM_LEVELS: [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3],
    LADDER: [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000],
    SAFE: [4, 9],          // soglie sicure: 1.000 (5ª domanda) e 32.000 (10ª domanda)

    // --- aiuti (stessi in entrambe le modalità, ognuno usabile una sola volta) ---
    LIFE: [
      { id: 'fifty', name: '50/50',    full: '50/50' },
      { id: 'aud',   name: 'PUBBLICO', full: 'AIUTO DEL PUBBLICO' },
      { id: 'tel',   name: 'AMICO',    full: 'TELEFONATA A CASA' },
      { id: 'swap',  name: 'CAMBIA',   full: 'CAMBIA DOMANDA' },
    ],
    FRIENDS: ['ZIO GIGI', 'NONNA ROSA', 'CUGINO TONI', 'IL PROF', 'ZIA PINA', 'PEPPINO', 'NONNO CARLO', 'LA MAMMA', 'IL VICINO', 'MARCELLO'],
  };
})();
