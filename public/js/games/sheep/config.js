/**
 * HOLY SHEEP — costanti di gioco (tutte le "manopole" sono qui).
 */
(function () {
  'use strict';

  const S = {
    W: 384, H: 216, HUD_TOP: 12, HUD_BOTTOM: 12,
    TILE: 8, COLS: 48, ROWS: 24,

    MATCH_TIME: 120,        // secondi
    SHEEP_COUNT: 24,        // pecore bianche in campo
    GOLDEN_EVERY: 22,       // ogni quanti secondi compare una pecora d'oro (se non ce n'è una)
    GOLDEN_VALUE: 3,        // quanto vale una pecora d'oro

    // Cane
    DOG_SPEED: 68,
    DASH_MULT: 1.9,
    DASH_TIME: 0.55,
    DASH_CD: 3,             // ricarica dello scatto
    BARK_CD: 0.7,           // ricarica dell'abbaio
    BARK_R: 64,             // raggio dell'abbaio: le pecore qui dentro ti seguono
    ATTRACT_TIME: 1.6,      // per quanto ti seguono dopo un abbaio
    FOLLOW_DIST: 11,        // a che distanza si fermano dietro al cane
    SCARE_R: 20,            // correre addosso alle pecore le spaventa
    DASH_SCARE_R: 38,       // ... e con lo scatto ancora di più

    // Pecore
    SHEEP_SPEED: 30,
    SHEEP_FOLLOW_SPEED: 52,
    SHEEP_FLEE_SPEED: 60,

    // Lupo
    WOLF_FIRST: 32,         // primo lupo dopo N secondi
    WOLF_EVERY: 28,
    WOLF_SPEED: 50,
    WOLF_LIFE: 13,
    WOLF_FEAR_R: 58,        // le pecore scappano dal lupo entro questa distanza
    SHEEP_RESPAWN: 7,       // una pecora mangiata ritorna dopo N secondi

    BOT_NAMES: ['FUFFI', 'BALTO', 'LASSIE', 'REX', 'BRICIOLA', 'ZEUS'],
  };
  S.MAP_W = S.COLS * S.TILE;
  S.MAP_H = S.ROWS * S.TILE;

  S.T = { GRASS: 0, FENCE: 1, BUSH: 2, ROCK: 3, HAY: 4, WATER: 5, TREE: 6, GATE: 7 };

  /**
   * Recinti negli angoli (in caselle). L'apertura guarda verso il centro.
   * slot 0 = in alto a sinistra, 1 = in basso a destra, 2 = in alto a destra, 3 = in basso a sinistra
   * (stesso ordine degli angoli di partenza di Soldatini Arena).
   */
  const PEN_W = 8, PEN_H = 6;   // interno del recinto
  S.PENS = [
    { cx: 0, cy: 0 }, { cx: 1, cy: 1 }, { cx: 1, cy: 0 }, { cx: 0, cy: 1 },
  ].map(({ cx, cy }) => {
    const x0 = cx ? S.COLS - 1 - PEN_W : 1;    // prima casella interna
    const y0 = cy ? S.ROWS - 1 - PEN_H : 1;
    return {
      tx: x0, ty: y0, tw: PEN_W, th: PEN_H,
      wallX: cx ? x0 - 1 : x0 + PEN_W,        // colonna della staccionata con l'apertura
      wallY: cy ? y0 - 1 : y0 + PEN_H,        // riga della staccionata orizzontale
      gate: [y0 + 2, y0 + 3, y0 + 4].map((y) => (cy ? y - 1 : y)),   // righe dell'apertura
      dir: cx ? -1 : 1,                        // da che parte si esce
      // rettangolo interno in pixel (per contare le pecore)
      x: x0 * S.TILE, y: y0 * S.TILE, w: PEN_W * S.TILE, h: PEN_H * S.TILE,
    };
  });
  S.PENS.forEach((p) => {
    p.gateX = (p.wallX + 0.5) * S.TILE;
    p.gateY = (p.gate[1] + 0.5) * S.TILE;
    p.centerX = p.x + p.w / 2;
    p.centerY = p.y + p.h / 2;
    p.spawnX = p.gateX + p.dir * 18;           // il cane parte davanti al proprio cancello
    p.spawnY = p.gateY;
  });

  window.SHEEP = S;
})();
