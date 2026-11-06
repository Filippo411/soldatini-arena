/**
 * THE BILLIONAIRE — banca delle domande di cultura generale.
 *
 * Ogni domanda: [ testo, RISPOSTA GIUSTA, sbagliata, sbagliata, sbagliata ]
 * (la risposta giusta va sempre scritta per prima: l'ordine delle 4 opzioni
 * viene rimescolato a ogni partita).
 *
 * Tre livelli di difficoltà:
 *   1 = facile, 2 = media, 3 = difficile
 *
 * Per aggiungere domande basta aggiungere una riga nel livello giusto.
 * Sullo schermo grande il font non ha tutti i simboli: lettere, numeri e
 * . , : - + / ' ? ! = % ( ) & € vanno bene; gli accenti (à è é ì ò ù) pure.
 * Evita virgolette, punto e virgola e lettere accentate diverse dalle precedenti.
 * Per un buon aspetto: domanda sotto i 120 caratteri, risposte sotto i 34.
 */
(function () {
  'use strict';

  const BANK = {
    1: [
      ["Qual è la capitale d'Italia?", 'Roma', 'Milano', 'Napoli', 'Torino'],
      ['Quanti giorni ha un anno bisestile?', '366', '365', '364', '367'],
      ['Quale pianeta è chiamato il Pianeta Rosso?', 'Marte', 'Venere', 'Giove', 'Mercurio'],
      ['Chi ha dipinto la Gioconda?', 'Leonardo da Vinci', 'Michelangelo', 'Raffaello', 'Caravaggio'],
      ['Quanti lati ha un esagono?', '6', '5', '7', '8'],
      ["Qual è l'oceano più grande del mondo?", 'Oceano Pacifico', 'Oceano Atlantico', 'Oceano Indiano', 'Oceano Artico'],
      ['In quale città si trova la Torre Eiffel?', 'Parigi', 'Londra', 'Roma', 'Madrid'],
      ['Quale metallo è liquido a temperatura ambiente?', 'Mercurio', 'Piombo', 'Ferro', 'Rame'],
      ['Da quale frutto si ricava il vino?', 'Uva', 'Mela', 'Pera', 'Ciliegia'],
      ['Quale mare bagna Venezia?', 'Mare Adriatico', 'Mar Tirreno', 'Mar Ionio', 'Mar Ligure'],
      ['Chi ha scritto la Divina Commedia?', 'Dante Alighieri', 'Francesco Petrarca', 'Giovanni Boccaccio', 'Alessandro Manzoni'],
      ["Qual è il fiume più lungo d'Italia?", 'Po', 'Tevere', 'Adige', 'Arno'],
      ['Quale gas ci serve per respirare?', 'Ossigeno', 'Azoto', 'Elio', 'Idrogeno'],
      ['Quante sono le note musicali?', '7', '5', '8', '12'],
      ['Quale nazionale ha vinto più Mondiali di calcio?', 'Brasile', 'Germania', 'Italia', 'Argentina'],
      ['Come si chiama il satellite naturale della Terra?', 'La Luna', 'Fobos', 'Titano', 'Europa'],
      ['Qual è il pianeta più vicino al Sole?', 'Mercurio', 'Venere', 'Terra', 'Marte'],
      ['Di quale paese è tipica la pizza?', 'Italia', 'Francia', 'Spagna', 'Grecia'],
      ["Quanti minuti ci sono in un'ora e mezza?", '90', '80', '100', '75'],
      ['Quale insetto produce il miele?', "L'ape", 'La vespa', 'La formica', 'La farfalla'],
      ['Quale colore si ottiene mescolando blu e giallo?', 'Verde', 'Arancione', 'Viola', 'Marrone'],
      ['Qual è la lingua più parlata in Brasile?', 'Portoghese', 'Spagnolo', 'Inglese', 'Francese'],
      ['Come si chiama il vulcano vicino a Napoli?', 'Vesuvio', 'Etna', 'Stromboli', 'Vulcano'],
      ['Chi ha scritto I Promessi Sposi?', 'Alessandro Manzoni', 'Giacomo Leopardi', 'Ugo Foscolo', 'Giovanni Verga'],
      ['Quale strumento musicale ha 88 tasti?', 'Pianoforte', 'Chitarra', 'Violino', 'Flauto'],
      ['Quanti giocatori scendono in campo per squadra nel calcio?', '11', '10', '9', '12'],
      ['In quale città si trova il Colosseo?', 'Roma', 'Atene', 'Napoli', 'Firenze'],
      ['Qual è il più grande animale terrestre?', "L'elefante", 'La giraffa', 'Il rinoceronte', "L'ippopotamo"],
      ['Quale festa si celebra il 25 dicembre?', 'Natale', 'Pasqua', 'Ferragosto', 'Epifania'],
      ["Qual è la formula chimica dell'acqua?", 'H2O', 'CO2', 'O2', 'NaCl'],
      ['Qual è la capitale della Spagna?', 'Madrid', 'Barcellona', 'Siviglia', 'Valencia'],
      ['Quale città è famosa per la Torre pendente?', 'Pisa', 'Siena', 'Bologna', 'Lucca'],
      ['Quanti zeri ha il numero mille?', '3', '2', '4', '5'],
      ['Quale organo pompa il sangue nel corpo?', 'Il cuore', 'Il fegato', 'Il polmone', 'Lo stomaco'],
      ['Quale dolce è fatto con savoiardi, mascarpone e caffè?', 'Tiramisù', 'Panna cotta', 'Cassata', 'Zabaione'],
      ['In quale sport si usano una racchetta e una pallina gialla?', 'Tennis', 'Golf', 'Rugby', 'Hockey'],
      ["Quale stagione viene dopo l'inverno?", 'Primavera', 'Estate', 'Autunno', 'Inverno'],
      ['Chi è Pinocchio nella favola di Collodi?', 'Un burattino di legno', 'Un gatto', 'Un orsetto', 'Un principe'],
      ['Quale città italiana è famosa per canali e gondole?', 'Venezia', 'Verona', 'Padova', 'Trieste'],
      ['Quanti anni ci sono in un secolo?', '100', '10', '1000', '50'],
      ['Qual è la montagna più alta del mondo?', 'Everest', 'K2', 'Kilimangiaro', 'Monte Bianco'],
      ['Quale animale è il simbolo del WWF?', 'Il panda', 'La tigre', "L'elefante", 'La balena'],
      ['Quale dolce tipico si mangia a Pasqua?', 'La colomba', 'Il panettone', 'Il pandoro', 'Il torrone'],
      ['In quale paese si trova il Taj Mahal?', 'India', 'Egitto', 'Cina', 'Turchia'],
      ['Qual è la moneta ufficiale del Regno Unito?', 'Sterlina', 'Euro', 'Dollaro', 'Corona'],
      ['Quali sono i colori della bandiera italiana?', 'Verde, bianco e rosso', 'Blu, bianco e rosso', 'Verde, giallo e rosso', 'Bianco, rosso e blu'],
      ['Quale personaggio delle fiabe arabe esce da una lampada?', 'Il genio', 'Il mago', 'Il drago', 'Il gigante'],
      ['Quanti sono i cerchi del simbolo olimpico?', '5', '4', '6', '7'],
    ],

    2: [
      ['Chi ha creato il commissario Montalbano?', 'Andrea Camilleri', 'Leonardo Sciascia', 'Umberto Eco', 'Italo Calvino'],
      ['In che anno Neil Armstrong mise piede sulla Luna?', '1969', '1965', '1972', '1959'],
      ["Qual è la capitale dell'Australia?", 'Canberra', 'Sydney', 'Melbourne', 'Perth'],
      ['Chi dipinse La notte stellata?', 'Vincent van Gogh', 'Claude Monet', 'Paul Gauguin', 'Pablo Picasso'],
      ['Quale elemento chimico ha simbolo Au?', 'Oro', 'Argento', 'Alluminio', 'Rame'],
      ['Quale fiume attraversa Firenze?', 'Arno', 'Tevere', 'Po', 'Adige'],
      ['Chi ha scritto Il nome della rosa?', 'Umberto Eco', 'Italo Calvino', 'Primo Levi', 'Alberto Moravia'],
      ['In che anno è caduto il Muro di Berlino?', '1989', '1991', '1985', '1979'],
      ['Quale pianeta è famoso per i suoi anelli visibili?', 'Saturno', 'Marte', 'Mercurio', 'Venere'],
      ['Quanti sono i pianeti del Sistema Solare?', '8', '9', '7', '10'],
      ['Chi fu il primo imperatore di Roma?', 'Augusto', 'Giulio Cesare', 'Nerone', 'Traiano'],
      ["Quale paese dell'Unione Europea ha più abitanti?", 'Germania', 'Francia', 'Italia', 'Spagna'],
      ['Chi ha composto La Traviata?', 'Giuseppe Verdi', 'Giacomo Puccini', 'Gioachino Rossini', 'Vincenzo Bellini'],
      ['Qual è la capitale del Canada?', 'Ottawa', 'Toronto', 'Vancouver', 'Montreal'],
      ["Qual è l'osso più lungo del corpo umano?", 'Femore', 'Tibia', 'Omero', 'Perone'],
      ["Quale mare separa l'Italia dai Balcani?", 'Mare Adriatico', 'Mar Tirreno', 'Mar Egeo', 'Mar Nero'],
      ['Quale italiano vinse il Nobel per la fisica nel 1909 con la radio?', 'Guglielmo Marconi', 'Enrico Fermi', 'Alessandro Volta', 'Galileo Galilei'],
      ['Quale scienziato formulò la teoria della relatività?', 'Albert Einstein', 'Isaac Newton', 'Galileo Galilei', 'Niels Bohr'],
      ['In quale sport si disputa il torneo di Wimbledon?', 'Tennis', 'Golf', 'Cricket', 'Rugby'],
      ['Qual è la capitale della Turchia?', 'Ankara', 'Istanbul', 'Smirne', 'Antalya'],
      ['Chi guidò la spedizione che nel 1492 raggiunse le Americhe?', 'Cristoforo Colombo', 'Amerigo Vespucci', 'Marco Polo', 'Vasco da Gama'],
      ["Quale organo produce l'insulina?", 'Pancreas', 'Fegato', 'Rene', 'Milza'],
      ['In quale regione italiana si trova Matera?', 'Basilicata', 'Puglia', 'Calabria', 'Campania'],
      ['Quale città ospitò le Olimpiadi invernali del 2006?', 'Torino', 'Milano', "Cortina d'Ampezzo", 'Bormio'],
      ["Qual è la lingua ufficiale dell'Argentina?", 'Spagnolo', 'Portoghese', 'Italiano', 'Inglese'],
      ["Chi scrisse la poesia L'infinito?", 'Giacomo Leopardi', 'Giosuè Carducci', 'Giovanni Pascoli', 'Eugenio Montale'],
      ['Quale squadra di calcio è detta la Vecchia Signora?', 'Juventus', 'Milan', 'Inter', 'Roma'],
      ['Qual è il più grande deserto caldo del mondo?', 'Sahara', 'Gobi', 'Kalahari', 'Atacama'],
      ['Chi dipinse gli affreschi della volta della Cappella Sistina?', 'Michelangelo', 'Raffaello', 'Botticelli', 'Tiziano'],
      ['Quante corde ha una chitarra classica?', '6', '4', '5', '8'],
      ['Quale unità di misura si usa per la frequenza?', 'Hertz', 'Watt', 'Joule', 'Volt'],
      ["Secondo la tradizione, chi è l'autore dell'Odissea?", 'Omero', 'Virgilio', 'Esiodo', 'Sofocle'],
      ['Qual è la capitale della Svizzera?', 'Berna', 'Zurigo', 'Ginevra', 'Basilea'],
      ['Qual è la più grande isola italiana?', 'Sicilia', 'Sardegna', 'Elba', 'Capri'],
      ['Qual è il simbolo chimico del sodio?', 'Na', 'So', 'Sd', 'S'],
      ['Quale festa si celebra in Italia il 2 giugno?', 'Festa della Repubblica', 'Festa della Liberazione', 'Ferragosto', 'Festa dei Lavoratori'],
      ['Quanto fa 12 per 12?', '144', '124', '164', '122'],
      ['In quale città si trova il Duomo con la Madonnina?', 'Milano', 'Torino', 'Bologna', 'Genova'],
      ['Quale pittore spagnolo dipinse Guernica?', 'Pablo Picasso', 'Salvador Dali', 'Joan Miro', 'Francisco Goya'],
      ["Qual è la capitale dell'Egitto?", 'Il Cairo', 'Alessandria', 'Luxor', 'Giza'],
      ['Quale vitamina produce il corpo con la luce del sole?', 'Vitamina D', 'Vitamina C', 'Vitamina A', 'Vitamina B12'],
      ['Chi fu il primo presidente degli Stati Uniti?', 'George Washington', 'Abraham Lincoln', 'Thomas Jefferson', 'John Adams'],
      ["Qual è il gas più abbondante nell'atmosfera terrestre?", 'Azoto', 'Ossigeno', 'Anidride carbonica', 'Argon'],
      ['Chi ha scritto la tragedia Romeo e Giulietta?', 'William Shakespeare', 'Charles Dickens', 'Christopher Marlowe', 'Oscar Wilde'],
      ['Qual è la valuta del Giappone?', 'Yen', 'Won', 'Yuan', 'Rupia'],
      ['In quale città si trova la Sagrada Familia?', 'Barcellona', 'Madrid', 'Siviglia', 'Valencia'],
      ["Quanti anni durò la Guerra dei Cent'Anni?", '116', '100', '99', '150'],
      ['Quale città è soprannominata la Città Eterna?', 'Roma', 'Atene', 'Gerusalemme', 'Istanbul'],
    ],

    3: [
      ['Qual è la capitale del Kazakistan?', 'Astana', 'Almaty', 'Tashkent', 'Bishkek'],
      ['In che anno scoppiò la Rivoluzione francese?', '1789', '1799', '1776', '1815'],
      ['Chi scrisse Guerra e pace?', 'Lev Tolstoj', 'Fedor Dostoevskij', 'Anton Cechov', 'Nikolaj Gogol'],
      ['Chi formulò le tre leggi del moto dei pianeti?', 'Johannes Kepler', 'Niccolò Copernico', 'Galileo Galilei', 'Isaac Newton'],
      ['Quale elemento chimico ha numero atomico 1?', 'Idrogeno', 'Elio', 'Litio', 'Ossigeno'],
      ["Quale città fu capitale del Regno d'Italia dal 1865 al 1871?", 'Firenze', 'Torino', 'Roma', 'Milano'],
      ['Chi dipinse La Primavera, conservata agli Uffizi?', 'Sandro Botticelli', 'Tiziano', 'Giotto', 'Beato Angelico'],
      ['Quale trattato del 1957 istituì la Comunità Economica Europea?', 'Trattato di Roma', 'Trattato di Maastricht', 'Trattato di Lisbona', 'Trattato di Parigi'],
      ['Qual è la capitale del Perù?', 'Lima', 'Quito', 'Bogotà', 'Santiago'],
      ['Chi compose Le quattro stagioni?', 'Antonio Vivaldi', 'Johann Sebastian Bach', 'Claudio Monteverdi', 'Arcangelo Corelli'],
      ['Qual è lo stato più piccolo del mondo?', 'Città del Vaticano', 'Principato di Monaco', 'San Marino', 'Liechtenstein'],
      ["In che anno l'Italia vinse il suo quarto Mondiale di calcio?", '2006', '1994', '1998', '2010'],
      ['Quale fisico scoprì la radioattività nel 1896?', 'Henri Becquerel', 'Marie Curie', 'Ernest Rutherford', 'Wilhelm Roentgen'],
      ['Chi scrisse Il Principe?', 'Niccolò Machiavelli', 'Francesco Guicciardini', 'Dante Alighieri', 'Tommaso Moro'],
      ["Qual è il fiume più lungo d'Europa?", 'Volga', 'Danubio', 'Reno', 'Dnepr'],
      ['Quale filosofo scrisse la Critica della ragion pura?', 'Immanuel Kant', 'Georg Hegel', 'Friedrich Nietzsche', 'Arthur Schopenhauer'],
      ['In quale città si trova il Museo del Prado?', 'Madrid', 'Barcellona', 'Lisbona', 'Parigi'],
      ['Quale battaglia del 1815 segnò la sconfitta finale di Napoleone?', 'Waterloo', 'Austerlitz', 'Lipsia', 'Borodino'],
      ["Qual è l'elemento più abbondante nella crosta terrestre?", 'Ossigeno', 'Silicio', 'Ferro', 'Alluminio'],
      ['Quale italiano vinse il Nobel per la letteratura nel 1997?', 'Dario Fo', 'Eugenio Montale', 'Umberto Eco', 'Luigi Pirandello'],
      ['Chi dipinse Il giuramento degli Orazi?', 'Jacques-Louis David', 'Eugène Delacroix', 'Francisco Goya', 'Gustave Courbet'],
      ['Attorno a quale pianeta orbita Ganimede, la luna più grande?', 'Giove', 'Saturno', 'Nettuno', 'Urano'],
      ["Chi fu l'ultimo re d'Italia?", 'Umberto II', 'Vittorio Emanuele III', 'Vittorio Emanuele II', 'Carlo Alberto'],
      ["In quale anno l'eruzione del Vesuvio distrusse Pompei?", '79 d.C.', '69 d.C.', '89 d.C.', '79 a.C.'],
      ['Qual è la capitale della Nuova Zelanda?', 'Wellington', 'Auckland', 'Christchurch', 'Dunedin'],
      ['Chi fu il primo uomo nello spazio?', 'Jurij Gagarin', 'Neil Armstrong', 'Buzz Aldrin', 'Alan Shepard'],
      ["Qual è la formula chimica dell'anidride carbonica?", 'CO2', 'CO', 'C2O', 'O3'],
      ['Chi ha scritto Cent\'anni di solitudine?', 'Gabriel Garcia Marquez', 'Jorge Luis Borges', 'Pablo Neruda', 'Mario Vargas Llosa'],
      ['In quale città nacque Wolfgang Amadeus Mozart?', 'Salisburgo', 'Vienna', 'Praga', 'Monaco di Baviera'],
      ['Quale elemento chimico ha simbolo Fe?', 'Ferro', 'Fluoro', 'Fosforo', 'Francio'],
      ['Chi diresse il film La dolce vita?', 'Federico Fellini', 'Luchino Visconti', 'Vittorio De Sica', 'Roberto Rossellini'],
      ['Quale città è la sede ufficiale del Parlamento europeo?', 'Strasburgo', 'Bruxelles', 'Lussemburgo', 'Parigi'],
      ['Chi scrisse il Canzoniere?', 'Francesco Petrarca', 'Giovanni Boccaccio', 'Dante Alighieri', 'Torquato Tasso'],
      ["Qual è la capitale dell'Islanda?", 'Reykjavik', 'Oslo', 'Helsinki', 'Tallinn'],
      ['Quale imperatore romano ricostruì il Pantheon come lo vediamo oggi?', 'Adriano', 'Augusto', 'Traiano', 'Nerone'],
      ['Quante ossa ha il corpo umano adulto?', '206', '186', '226', '256'],
      ['Chi scoprì la penicillina?', 'Alexander Fleming', 'Louis Pasteur', 'Robert Koch', 'Edward Jenner'],
      ["Quale gruppo ha pubblicato l'album The Dark Side of the Moon?", 'Pink Floyd', 'Led Zeppelin', 'The Beatles', 'Queen'],
      ['Qual è il punto più profondo degli oceani?', 'Fossa delle Marianne', 'Fossa di Portorico', 'Fossa delle Tonga', 'Fossa di Giava'],
      ['Come si chiamava Istanbul prima di Costantinopoli?', 'Bisanzio', 'Troia', 'Antiochia', 'Smirne'],
      ['Chi era la dea greca della saggezza?', 'Atena', 'Era', 'Afrodite', 'Artemide'],
      ['Quale unità misura la resistenza elettrica?', 'Ohm', 'Volt', 'Ampere', 'Farad'],
      ['In quale continente si trova il lago Vittoria?', 'Africa', 'Asia', 'America', 'Oceania'],
      ["Chi scolpì il David di marmo dell'Accademia di Firenze?", 'Michelangelo', 'Donatello', 'Bernini', 'Canova'],
      ['Quale matematico greco è famoso per il teorema sui triangoli rettangoli?', 'Pitagora', 'Euclide', 'Archimede', 'Talete'],
      ['Chi ha scritto il romanzo 1984?', 'George Orwell', 'Aldous Huxley', 'Ray Bradbury', 'Franz Kafka'],
      ['Quale città sorge sulle rive della Moldava?', 'Praga', 'Budapest', 'Vienna', 'Varsavia'],
      ['Quanto vale all\'incirca la velocità della luce nel vuoto?', '300.000 km/s', '150.000 km/s', '30.000 km/s', '3.000.000 km/s'],
    ],
  };

  /**
   * Domande già uscite in questa serata: finché non sono finite quelle nuove
   * del livello, non si ripetono (anche tra una partita e l'altra).
   */
  const seen = { 1: new Set(), 2: new Set(), 3: new Set() };

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /**
   * Pesca una domanda del livello dato.
   * exclude (facoltativo): insieme di id già usati nella partita in corso.
   * Restituisce { id, lvl, q, o: [4 opzioni rimescolate], c: indice della giusta }
   */
  function draw(level, exclude) {
    const pool = BANK[level];
    const free = (i) => !(exclude && exclude.has(level + ':' + i));
    let cand = [];
    for (let i = 0; i < pool.length; i++) if (!seen[level].has(i) && free(i)) cand.push(i);
    if (!cand.length) {          // finite quelle nuove: si riparte (senza le escluse)
      seen[level].clear();
      for (let i = 0; i < pool.length; i++) if (free(i)) cand.push(i);
    }
    const i = cand[Math.floor(Math.random() * cand.length)];
    seen[level].add(i);
    const row = pool[i];
    const right = row[1];
    const opts = shuffle(row.slice(1));
    return { id: level + ':' + i, lvl: level, q: row[0], o: opts, c: opts.indexOf(right) };
  }

  window.BillQuestions = { BANK, draw };
})();
