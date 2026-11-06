# PIPPO GAME ROOM

Sala giochi "da salotto" per 1–4 giocatori, in pixel art 8-bit. Lo schermo grande (PC, TV o proiettore) mostra il gioco, e ognuno usa il proprio telefono come controller inquadrando un QR code.

**Come funziona una serata**
1. Si apre il sito sulla TV e ognuno inquadra il QR con il telefono. Si entra una volta sola per tutta la serata.
2. Il **capo** (il primo telefono collegato) sceglie il gioco dal menu e preme **GIOCA**. Si può scegliere anche dalla TV, con frecce + INVIO.
3. A fine partita c'è la classifica: si sceglie **RIGIOCA** oppure **MENU GIOCHI**.
4. Ogni partita assegna punti alla **classifica della serata**: 3 punti al primo, 2 al secondo, 1 al terzo. Contano solo i giocatori veri, quando sono almeno 2.

**Giochi**
- ✅ **Soldatini Arena**: sparatutto tutti contro tutti, descritto qui sotto.
- ✅ **Holy Sheep**: cani pastore che radunano pecore (vedi sotto).
- ✅ **Trova le differenze**: vedi sotto.
- 🔜 **Pippo Kart**: kart su piste ispirate a Monza, Spa e Monaco, con il telefono come volante.

---

## Trova le differenze

Sulla TV c'è una scena in pixel art (fattoria, spiaggia o città di notte, ogni volta diversa). Sul telefono di ognuno c'è la stessa scena con **10 differenze**: un colore cambiato, un oggetto sparito o aggiunto, un dettaglio diverso, un oggetto girato.

- **Tocca sul telefono** dove vedi una differenza. Se è giusta compare un cerchio del tuo colore, che vedi solo tu.
- **Tocco sbagliato:** il telefono si blocca per 2 secondi, così nessuno tocca a caso.
- Vince chi le trova **tutte e 10** per primo, oppure chi ne ha di più dopo 3 minuti.
- Ogni tanto la TV mostra un **aiutino**: un cerchio lampeggiante attorno a una zona dove c'è una differenza che quasi nessuno ha trovato.
- A fine partita la TV e i telefoni mostrano tutte le differenze.

---

## Holy Sheep

Ognuno è un cane pastore e ha un recinto in un angolo del pascolo, del suo colore. Dopo **2 minuti** vince chi ha più pecore nel recinto.

| Sul telefono | Cosa fa |
|---|---|
| **Joystick** | Muovi il cane |
| **WOOF!** | Abbai: le pecore vicine ti **seguono** per un po'. Sopra di loro compare un cuoricino del tuo colore |
| **SCATTO** | Corsa veloce per mezzo secondo (si ricarica in 3 secondi) |

- **Correre addosso** alle pecore le spaventa e le fa scappare, con lo scatto ancora di più. Serve a spingerle o a rubarle agli altri.
- Una pecora che entra in un recinto si sistema lì. Si può però **rubare** dal recinto degli altri, abbaiando dal cancello.
- La **pecora d'oro** vale 3 punti.
- **Il lupo** ogni tanto entra nel pascolo e si mangia una pecora libera. **Abbaiagli contro** per mandarlo via.
- Da soli si gioca contro 3 cani del computer.

---

## Soldatini Arena

Si gioca tutti contro tutti in uno sparatutto 2D visto dall'alto, con grafica pixel art in stile arcade militare anni '90. Vince chi arriva per primo a **10 eliminazioni**, oppure chi ne ha di più dopo **3 minuti**.

---

## Come si gioca

Comandi in stile Brawl Stars: un joystick per muoversi a sinistra, due "stick d'attacco" a destra.

| Sul telefono | Cosa fa |
|---|---|
| **Joystick** (metà sinistra: appoggia il pollice dove vuoi) | Muove il soldatino in tutte le direzioni |
| **SPARA: tocco veloce** | **Mira automatica**: il colpo parte verso l'avversario visibile più vicino (se nessuno è a tiro, dove stai guardando) |
| **SPARA: tieni premuto senza muovere il dito** | Raffica, sempre con mira automatica |
| **SPARA: trascina** | Mira manuale: sullo schermo grande compare un mirino laser. **Rilascia** per sparare lì. Puoi mirare in una direzione e intanto camminare in un'altra |
| **POWERUP: tocco** | Usa il powerup (la granata va dove cammini) |
| **POWERUP: trascina** (con la granata) | Mostra traiettoria e area dell'esplosione: più trascini lontano, più lontano la lanci. Rilascia per lanciare |
| Riporta il dito al centro prima di rilasciare | Annulla il colpo |

- **Colpi:** si parte con 10. Quando li finisci, raccogli una **cassa munizioni** (torni a 10).
- **Flash** ⚡: corri molto più veloce per 5 secondi.
- **Granata**: la lanci in avanti e scoppia dopo 1,5 secondi o quando tocca qualcosa. Colpisce **tutti** quelli nel raggio, **te compreso**. Se ti elimini da solo perdi un punto.
- **Scudo**: per 10 secondi ti serve un colpo in più per essere eliminato.
- **Barili rossi**: se li colpisci esplodono.
- **Filo spinato**: non ci passi attraverso, ma i proiettili sì.
- Dopo un'eliminazione rientri in gioco dopo 3 secondi, lontano dagli avversari, e per 1,5 secondi sei invulnerabile.
- Se giochi **da solo** entrano in partita 3 bot.
- Se il telefono si scollega (blocco schermo, chiamata, batteria) puoi **riscansionare il QR**: rientri con lo stesso soldatino e lo stesso punteggio, e la partita non ricomincia.

**Tasti sullo schermo grande:** `FRECCE` scelgono il gioco · `INVIO` avvia o rigioca · `ESC` (dalla classifica) torna al menu · `F` schermo intero · `M` audio.
**Importante:** clicca una volta sullo schermo grande per attivare l'audio. I browser lo richiedono.

---

## OPZIONE A — Online gratis con Render (consigliata)

Ti serve circa un quarto d'ora la prima volta. Non devi installare niente sul computer.
Alla fine avrai un indirizzo tipo `https://soldatini-arena.onrender.com` da aprire su qualsiasi PC o TV.

### 1. Carica il codice su GitHub

1. Vai su **https://github.com** e crea un account gratuito (*Sign up*).
2. In alto a destra premi **+** → **New repository**.
3. Come nome scrivi `soldatini-arena`, lascia **Public** e premi **Create repository**.
4. Nella pagina che si apre clicca sul link **uploading an existing file**.
5. Sul tuo computer apri la cartella `soldatini` che hai estratto dallo zip. Seleziona **tutto il suo contenuto** (la cartella `public`, `server.js`, `package.json` e gli altri file) e trascinalo nella pagina di GitHub.
   > Deve essere il **contenuto** della cartella, non la cartella stessa: subito sotto il nome del repository devi vedere `server.js` e `public`.
6. Aspetta che il caricamento finisca, poi premi **Commit changes** in basso.

### 2. Pubblica il gioco con Render

1. Vai su **https://render.com** e premi **Get Started**. Scegli **GitHub** per registrarti con lo stesso account.
2. Premi **New +** → **Web Service**.
3. Collega GitHub se te lo chiede, poi scegli il repository `soldatini-arena` e premi **Connect**.
4. Compila così:
   - **Name:** `soldatini-arena`. Diventerà il tuo indirizzo; se è già preso, scegline un altro.
   - **Region:** **Frankfurt (EU Central)**, la più vicina all'Italia.
   - **Language / Runtime:** **Node**
   - **Build Command:** lascialo vuoto, oppure scrivi `npm install`. Non ci sono librerie da installare.
   - **Start Command:** `node server.js`
   - **Instance Type:** **Free**
5. Premi **Deploy Web Service** e aspetta 1–3 minuti, finché vedi **Live** in verde.
6. In alto trovi il tuo indirizzo, per esempio `https://soldatini-arena.onrender.com`.

### 3. Giocate!

1. Sul PC, sulla TV o sul proiettore apri il tuo indirizzo nel browser (Chrome, Edge, Safari o Firefox) e premi `F` per lo schermo intero.
2. Ognuno inquadra il QR con la fotocamera del telefono, scrive il proprio nome e preme **ENTRA!**.
   Chi non riesce a scansionare va su `tuoindirizzo/play` e scrive il codice di 4 lettere.
3. Il primo telefono collegato (il **capo**) preme **INIZIA**. In alternativa si può premere INVIO o il pulsante sullo schermo grande.

**Da sapere sul piano gratuito di Render:**
- Se nessuno lo usa per 15 minuti, il server va in pausa. Alla prima apertura successiva serve circa **1 minuto** per riaccenderlo: aspetta e ricarica la pagina. Mentre giocate resta sempre acceso.
- Telefoni e schermo devono avere internet. Va bene anche la rete dati. La risposta dei comandi è di poche decine di millisecondi.
- **Aggiornare il gioco:** carica i file modificati su GitHub con *Add file → Upload files* e Render ripubblica da solo.

---

## OPZIONE B — Sul tuo PC, senza internet (stessa Wi-Fi)

È la soluzione con meno ritardo in assoluto. Telefoni e PC devono essere collegati **alla stessa rete Wi-Fi**.

1. Installa **Node.js** (versione **LTS**) da **https://nodejs.org**. Basta premere *Avanti* fino alla fine.
2. Avvia il gioco:
   - **Windows:** doppio clic su `avvia-windows.bat`. Se Windows chiede il permesso del firewall, scegli **Consenti** per le reti **private**.
   - **Mac:** clic destro su `avvia-mac.command` → **Apri** → **Apri**. Serve solo la prima volta.
3. Si apre il browser su `http://localhost:3000`. Il QR punta già all'indirizzo del PC sulla rete Wi-Fi, quindi i telefoni lo scansionano e funziona.
4. Per spegnere il gioco chiudi la finestra nera del terminale.

> Se i telefoni non si collegano, di solito dipende dal firewall del PC, che blocca la porta 3000, oppure da una Wi-Fi "ospiti" che isola i dispositivi tra loro.

---

## Come è fatto (per i curiosi)

```
public/
├── index.html               Schermo grande (menu + giochi)
├── play.html                Telefono (controller)
├── css/                     Stile pixel (common, host, controller)
└── js/
    ├── common/              Rete (WebSocket), QR code, icone condivise
    ├── core/
    │   ├── registry.js      Colori dei giocatori, punti serata, ELENCO GIOCHI
    │   ├── font.js          Font pixel 5x7 disegnato in codice
    │   └── audio.js         Effetti e musica chiptune (Web Audio)
    ├── room/host.js         La "sala": stanza, menu, telefoni, classifica serata
    ├── games/
    │   ├── shooter/         SOLDATINI ARENA (config, mappa, sprite, bot, gioco, disegno)
    │   ├── sheep/           HOLY SHEEP (stessa struttura)
    │   ├── diff/            TROVA LE DIFFERENZE (scene.js è usato anche dai telefoni)
    │   │   └── index.js     collegamento del gioco alla sala
    │   └── upcoming.js      giochi "PROSSIMAMENTE" nel menu
    └── controller/controller.js   Schermate e comandi del telefono
server.js                    Server Node SENZA dipendenze: file statici + "centralino" WebSocket
```

- **Aggiungere un gioco:** si crea una cartella in `js/games/` con un `index.js` che chiama `GAMES.register({...})`. L'interfaccia è descritta in cima a `js/core/registry.js`. La sala pensa a tutto il resto: telefoni, menu, classifica.


- **Architettura:** il server si limita a inoltrare i messaggi. Tutta la partita gira nel browser dello schermo grande. I telefoni mandano solo i comandi (joystick, sparo, powerup) e ricevono munizioni, punteggio e vibrazioni.
- **Perché WebSocket e non WebRTC/PeerJS:** con WebRTC alcune reti (dati mobili, Wi-Fi aziendali) bloccano il collegamento diretto, e servirebbe un server TURN a pagamento. Con WebSocket su un unico server gratuito funziona ovunque.
- **Grafica:** è tutta originale e generata in codice (sprite come griglie di caratteri), senza immagini esterne. Il font del menu è "Press Start 2P" di Google Fonts. Se non si carica, il gioco usa un font di riserva, e il font dentro la partita è comunque disegnato in codice.
- **Modificare le regole dello sparatutto:** apri `public/js/games/shooter/config.js`. Per esempio `KILLS_TO_WIN: 10`, `MATCH_TIME: 180`, `SPEED: 62`.
