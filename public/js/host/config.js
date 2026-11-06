/**
 * Costanti di gioco: tutte le "manopole" per bilanciare la partita sono qui.
 */
(function () {
  'use strict';

  const CFG = {
    // --- Schermo (risoluzione interna, poi ingrandita a schermo intero) ---
    W: 384,
    H: 216,
    HUD_TOP: 12,        // altezza barra HUD in alto
    HUD_BOTTOM: 12,     // altezza barra HUD in basso

    // --- Mappa ---
    TILE: 8,
    COLS: 48,           // 48 * 8 = 384 px
    ROWS: 24,           // 24 * 8 = 192 px (+ 12 + 12 di HUD = 216)

    // --- Partita ---
    KILLS_TO_WIN: 10,
    MATCH_TIME: 180,    // secondi
    RESPAWN_TIME: 3,
    SPAWN_PROTECT: 1.5, // secondi di invulnerabilità dopo il respawn

    // --- Soldatino ---
    SPEED: 62,          // pixel al secondo
    FLASH_MULT: 1.8,
    HALF: 2.5,          // mezza larghezza del "box" di collisione ai piedi
    STICK_DEADZONE: 0.2, // joystick: sotto questa spinta il soldatino sta fermo
    STICK_FULL: 0.65,    // joystick: da questa spinta in su si va a piena velocità
    AIM_RANGE: 90,       // lunghezza del mirino laser mentre si mira
    HIT_R: 6,           // raggio entro cui un proiettile colpisce

    // --- Armi ---
    MAX_AMMO: 10,
    FIRE_COOLDOWN: 0.24,
    BULLET_SPEED: 230,
    BULLET_LIFE: 1.6,

    GRENADE_FUSE: 1.5,
    GRENADE_SPEED: 150,
    BLAST_R: 30,        // raggio esplosione granata
    BARREL_R: 26,       // raggio esplosione barile

    FLASH_TIME: 5,
    SHIELD_TIME: 10,

    // --- Oggetti sulla mappa ---
    AMMO_MAX_ON_MAP: 3,
    AMMO_RESPAWN: 6,      // ogni quanti secondi può ricomparire un pacco
    POWER_MAX_ON_MAP: 2,
    POWER_RESPAWN: 9,

    // --- Giocatori: colori ben distinguibili da lontano ---
    PLAYERS: [
      { name: 'ROSSO',  color: '#ff3b3b', dark: '#a3172a', light: '#ff9c8a' },
      { name: 'BLU',    color: '#2f8bff', dark: '#1a3fa8', light: '#9ccbff' },
      { name: 'GIALLO', color: '#ffd23b', dark: '#c27a12', light: '#fff1a0' },
      { name: 'VERDE',  color: '#3fe05a', dark: '#16843a', light: '#a6ffad' },
    ],
    BOT_NAMES: ['SGT.BRUNO', 'CAP.TONI', 'CPL.GINO', 'SGT.RITA', 'CPL.NINA', 'CAP.OSCAR'],

    POWER_TYPES: ['flash', 'grenade', 'shield'],
  };

  CFG.MAP_W = CFG.COLS * CFG.TILE;
  CFG.MAP_H = CFG.ROWS * CFG.TILE;

  // Tipi di casella della mappa
  CFG.T = {
    FLOOR: 0,
    WALL: 1,     // muro di cemento
    CRATE: 2,    // cassa di legno
    SAND: 3,     // sacchi di sabbia
    BARREL: 4,   // barile esplosivo (si distrugge se colpito)
    WIRE: 5,     // filo spinato: blocca il passaggio ma NON i proiettili
    WRECK: 6,    // rottame di carro armato
  };

  window.CFG = CFG;
})();
