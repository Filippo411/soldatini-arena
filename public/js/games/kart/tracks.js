/**
 * PIPPO KART — le tre piste, ispirate (con molta fantasia) a Monza, Spa e Monaco.
 *
 * Ogni pista è una linea centrale fatta di punti di controllo (mondo 1024x1024),
 * smussata con una spline. Alcuni punti hanno "etichette":
 *   hill: pendenza (per il sali-e-scendi di Spa: l'orizzonte si alza e si abbassa)
 *   tunnel: tratto in galleria (Monaco)
 *   sign: cartello a bordo pista (PARABOLICA, EAU ROUGE...)
 */
(function () {
  'use strict';

  const TRACKS = [
    {
      id: 'monza',
      name: 'MONZA',
      sub: 'Il tempio della velocità: rettilinei infiniti e la Parabolica',
      width: 62, laps: 3, walls: false,
      ground: '#4ea52f', ground2: '#5fb83a', runoff: '#d9b56a',
      sky: ['#5fb8ff', '#a6e0ff'], scenery: 'alps',
      pts: [
        [300, 880], [480, 890], [660, 888],
        [740, 880], [770, 852], [800, 846], [826, 818, { sign: 'RETTIFILO' }],
        [875, 730], [900, 610, { sign: 'CURVA GRANDE' }], [895, 490],
        [880, 445], [858, 432], [866, 400, { sign: 'ROGGIA' }], [855, 365],
        [835, 300], [795, 255, { sign: 'LESMO' }], [745, 240],
        [695, 252], [655, 285],
        [560, 335], [460, 385],
        [415, 400], [392, 430], [360, 440, { sign: 'ASCARI' }], [328, 470],
        [270, 560], [222, 660], [190, 750],
        [178, 812, { sign: 'PARABOLICA' }], [200, 862], [240, 880],
      ],
      deco: 'monza',
    },
    {
      id: 'spa',
      name: 'SPA',
      sub: 'Sali e scendi nelle Ardenne: Eau Rouge, Raidillon e Blanchimont',
      width: 58, laps: 3, walls: false,
      ground: '#3f8a27', ground2: '#4ea52f', runoff: '#c9b89a',
      sky: ['#7a8fb8', '#b9c6dc'], scenery: 'forest',
      pts: [
        [715, 620], [712, 450], [708, 300],
        [705, 225, { sign: 'LA SOURCE' }], [690, 168], [650, 148], [612, 168], [600, 215],
        [596, 330, { hill: -0.8 }], [590, 450, { hill: -1 }], [585, 560, { hill: -1 }],
        [570, 622, { hill: -0.4, sign: 'EAU ROUGE' }], [600, 666, { hill: 1.6 }], [580, 712, { hill: 1.8, sign: 'RAIDILLON' }], [548, 762, { hill: 1 }],
        [470, 790, { hill: 0.2 }], [360, 795], [262, 790, { sign: 'KEMMEL' }],
        [226, 775], [206, 802, { sign: 'LES COMBES' }], [180, 790],
        [130, 800, { hill: -0.5 }], [96, 836], [104, 880, { sign: 'RIVAGE' }], [152, 895],
        [222, 902, { hill: -0.6 }], [300, 930, { sign: 'POUHON' }], [380, 948],
        [450, 938], [522, 958, { sign: 'STAVELOT' }],
        [620, 958, { hill: 0.4 }], [722, 935, { sign: 'BLANCHIMONT' }], [800, 880],
        [826, 820], [802, 786, { sign: 'BUS STOP' }], [786, 750], [742, 718],
      ],
      deco: 'spa',
    },
    {
      id: 'monaco',
      name: 'MONACO',
      sub: 'Muretti a un palmo, il tornante, il tunnel e gli yacht nel porto',
      width: 48, laps: 3, walls: true,
      ground: '#9aa0ad', ground2: '#8a8f9c', runoff: '#6b6f7a',
      sky: ['#4fc3ff', '#b8ecff'], scenery: 'city',
      pts: [
        [760, 830], [600, 836], [440, 832],
        [330, 822, { sign: 'SAINTE DEVOTE' }], [292, 780],
        [282, 690], [286, 600, { hill: 0.6 }],
        [300, 530, { sign: 'MASSENET' }], [340, 486],
        [400, 470, { sign: 'CASINO' }], [430, 432],
        [432, 380], [460, 340, { sign: 'MIRABEAU' }],
        [522, 326], [585, 342], [606, 392, { sign: 'TORNANTE' }], [578, 434], [526, 440],
        [496, 474], [540, 512], [624, 478], [668, 410], [684, 330, { sign: 'PORTIER' }],
        [690, 240, { tunnel: 1 }], [700, 150, { tunnel: 1, sign: 'TUNNEL' }], [760, 110, { tunnel: 1 }], [840, 120, { tunnel: 1 }],
        [880, 170], [868, 220, { sign: 'CHICANE' }], [890, 262],
        [892, 360, { sign: 'TABAC' }], [884, 460],
        [900, 520, { sign: 'PISCINA' }], [870, 560], [896, 610], [872, 650],
        [880, 720, { sign: 'RASCASSE' }], [850, 770], [810, 790],
      ],
      deco: 'monaco',
    },
  ];

  window.KartTracks = { TRACKS, get: (id) => TRACKS.find((t) => t.id === id) };
})();
