/**
 * PIPPO GAME ROOM — server
 * ------------------------------------------------------------
 * Un server Node.js SENZA dipendenze esterne (niente npm install).
 * Fa due cose sole:
 *   1. serve i file statici della cartella /public (pagine host e controller);
 *   2. fa da "centralino" WebSocket: inoltra i messaggi tra i telefoni
 *      (controller) e lo schermo grande (host) della stessa stanza.
 *
 * Tutta la logica di gioco gira nel browser dello schermo host:
 * il server non sa nulla di soldatini, mappe o proiettili.
 *
 * Avvio:  node server.js        (porta: variabile PORT, default 3000)
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ------------------------------------------------------------------
// 1. File statici
// ------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

/** Indirizzi IP della rete locale (per giocare senza internet, sulla stessa Wi-Fi). */
function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) out.push(a.address);
    }
  }
  return out;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);

  // Piccola API: l'host chiede l'IP locale quando è aperto su "localhost",
  // così il QR code punta a un indirizzo raggiungibile dai telefoni.
  if (p === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ lan: lanAddresses(), port: PORT }));
    return;
  }
  if (p === '/healthz') { res.writeHead(200); res.end('ok'); return; }

  // Indirizzi "belli": / = schermo grande, /play = telefono
  if (p === '/') p = '/index.html';
  if (p === '/play' || p === '/p') p = '/play.html';

  const file = path.normalize(path.join(PUBLIC_DIR, p));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end(); return; }

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Non trovato'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

// ------------------------------------------------------------------
// 2. WebSocket minimale (RFC 6455) — solo messaggi di testo
// ------------------------------------------------------------------
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/** Avvolge un socket TCP "promosso" a WebSocket con send/close/eventi. */
class WSConn {
  constructor(socket) {
    this.socket = socket;
    this.buf = Buffer.alloc(0);
    this.frags = [];          // frammenti di un messaggio spezzato
    this.open = true;
    this.alive = true;        // per il controllo ping/pong
    this.onmessage = () => {};
    this.onclose = () => {};
    socket.setNoDelay(true);  // bassa latenza: niente algoritmo di Nagle
    socket.on('data', (d) => this._data(d));
    socket.on('close', () => this._closed());
    socket.on('error', () => this._closed());
  }

  _data(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    // Un pacchetto TCP può contenere più frame, o un frame a metà: cicliamo.
    for (;;) {
      if (this.buf.length < 2) return;
      const b0 = this.buf[0], b1 = this.buf[1];
      const fin = (b0 & 0x80) !== 0;
      const opcode = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let len = b1 & 0x7f;
      let off = 2;
      if (len === 126) {
        if (this.buf.length < 4) return;
        len = this.buf.readUInt16BE(2); off = 4;
      } else if (len === 127) {
        if (this.buf.length < 10) return;
        len = Number(this.buf.readBigUInt64BE(2)); off = 10;
      }
      if (len > 1 << 20) { this.close(); return; } // messaggi enormi: non servono
      const maskOff = off;
      if (masked) off += 4;
      if (this.buf.length < off + len) return;

      let payload = this.buf.subarray(off, off + len);
      if (masked) {
        const mask = this.buf.subarray(maskOff, maskOff + 4);
        payload = Buffer.from(payload);
        for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      }
      this.buf = this.buf.subarray(off + len);

      if (opcode === 0x8) { this.close(); return; }                 // close
      if (opcode === 0x9) { this._send(0xA, payload); continue; }   // ping -> pong
      if (opcode === 0xA) { this.alive = true; continue; }          // pong
      if (opcode === 0x1 || opcode === 0x0) {                       // testo / continuazione
        this.frags.push(payload);
        if (fin) {
          const text = Buffer.concat(this.frags).toString('utf8');
          this.frags = [];
          this.alive = true;
          try { this.onmessage(text); } catch (e) { console.error(e); }
        }
      }
    }
  }

  _send(opcode, payload) {
    if (!this.open) return;
    const len = payload.length;
    let header;
    if (len < 126) {
      header = Buffer.from([0x80 | opcode, len]);
    } else if (len < 65536) {
      header = Buffer.alloc(4); header[0] = 0x80 | opcode; header[1] = 126; header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10); header[0] = 0x80 | opcode; header[1] = 127; header.writeBigUInt64BE(BigInt(len), 2);
    }
    try { this.socket.write(Buffer.concat([header, payload])); } catch (e) { this._closed(); }
  }

  send(obj) { this._send(0x1, Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj))); }
  ping() { this._send(0x9, Buffer.alloc(0)); }

  close() {
    if (!this.open) return;
    this._send(0x8, Buffer.alloc(0));
    this.socket.end();
    this._closed();
  }

  _closed() {
    if (!this.open) return;
    this.open = false;
    try { this.socket.destroy(); } catch (e) { /* già chiuso */ }
    this.onclose();
  }
}

// ------------------------------------------------------------------
// 3. Stanze
// ------------------------------------------------------------------
/**
 * rooms: CODICE -> { code, key, host: WSConn|null, ctrls: Map(cid -> WSConn), hostGoneAt }
 * key = "chiave segreta" dell'host, serve per riagganciarsi alla propria
 * stanza se la connessione dello schermo cade per un attimo.
 */
const rooms = new Map();
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // senza I e O (si confondono con 1 e 0)

function newCode() {
  for (;;) {
    let c = '';
    for (let i = 0; i < 4; i++) c += LETTERS[crypto.randomInt(LETTERS.length)];
    if (!rooms.has(c)) return c;
  }
}

function attachHost(conn, room) {
  room.host = conn;
  room.hostGoneAt = 0;
  conn.send({ t: 'room', code: room.code, key: room.key, ctrls: [...room.ctrls.keys()] });

  conn.onmessage = (text) => {
    let m; try { m = JSON.parse(text); } catch (e) { return; }
    if (m.t === 'to') {                       // messaggio a un solo telefono
      const c = room.ctrls.get(m.cid);
      if (c) c.send(m.d);
    } else if (m.t === 'all') {               // messaggio a tutti i telefoni
      const s = JSON.stringify(m.d);
      for (const c of room.ctrls.values()) c.send(s);
    } else if (m.t === 'kick') {
      const c = room.ctrls.get(m.cid);
      if (c) c.close();
    }
  };
  conn.onclose = () => {
    if (room.host !== conn) return;
    room.host = null;
    room.hostGoneAt = Date.now();
    for (const c of room.ctrls.values()) c.send({ t: 'hostgone' });
  };
}

function handleConnection(conn, params) {
  const role = params.get('role');

  if (role === 'host') {
    // Riaggancio a una stanza esistente (stessa chiave) oppure stanza nuova
    const code = (params.get('room') || '').toUpperCase();
    const key = params.get('key') || '';
    let room = rooms.get(code);
    if (room && room.key === key) {
      if (room.host && room.host !== conn) room.host.close();
      attachHost(conn, room);
      for (const c of room.ctrls.values()) c.send({ t: 'hostback' });
      return;
    }
    room = { code: newCode(), key: crypto.randomBytes(8).toString('hex'), host: null, ctrls: new Map(), hostGoneAt: 0 };
    rooms.set(room.code, room);
    attachHost(conn, room);
    console.log(`[stanza ${room.code}] creata`);
    return;
  }

  if (role === 'ctrl') {
    const code = (params.get('room') || '').toUpperCase();
    const cid = (params.get('cid') || '').slice(0, 40);
    const room = rooms.get(code);
    if (!room || !cid) {
      conn.send({ t: 'err', code: 'noroom', msg: 'Stanza non trovata' });
      setTimeout(() => conn.close(), 200);
      return;
    }
    // Stesso telefono che rientra: chiudiamo la vecchia connessione "zombie"
    const old = room.ctrls.get(cid);
    if (old && old !== conn) { old.onclose = () => {}; old.close(); }
    room.ctrls.set(cid, conn);
    conn.send({ t: 'ok', room: room.code, host: !!room.host });
    if (room.host) room.host.send({ t: 'cjoin', cid });

    conn.onmessage = (text) => {
      if (!room.host) return;
      // Inoltriamo il messaggio grezzo all'host, con il mittente.
      room.host.send('{"t":"c","cid":' + JSON.stringify(cid) + ',"d":' + text + '}');
    };
    conn.onclose = () => {
      if (room.ctrls.get(cid) !== conn) return;
      room.ctrls.delete(cid);
      if (room.host) room.host.send({ t: 'cleave', cid });
    };
    return;
  }

  conn.close();
}

server.on('upgrade', (req, socket) => {
  const url = new URL(req.url, 'http://x');
  const key = req.headers['sec-websocket-key'];
  if (url.pathname !== '/ws' || !key) { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
  const conn = new WSConn(socket);
  handleConnection(conn, url.searchParams);
});

// Ping periodico: tiene viva la connessione (alcuni hosting chiudono i socket muti)
// e pulisce le stanze abbandonate.
const allConns = () => {
  const list = [];
  for (const r of rooms.values()) {
    if (r.host) list.push(r.host);
    for (const c of r.ctrls.values()) list.push(c);
  }
  return list;
};
setInterval(() => {
  for (const c of allConns()) {
    if (!c.alive) { c.close(); continue; }
    c.alive = false;
    c.ping();
  }
  const now = Date.now();
  for (const [code, r] of rooms) {
    // Host sparito da più di 10 minuti: stanza eliminata
    if (!r.host && r.hostGoneAt && now - r.hostGoneAt > 10 * 60 * 1000) {
      for (const c of r.ctrls.values()) c.close();
      rooms.delete(code);
      console.log(`[stanza ${code}] chiusa`);
    }
  }
}, 20000);

server.listen(PORT, () => {
  console.log('');
  console.log('  PIPPO GAME ROOM è acceso!');
  console.log(`  Schermo grande:  http://localhost:${PORT}`);
  for (const ip of lanAddresses()) console.log(`  Dalla Wi-Fi:     http://${ip}:${PORT}`);
  console.log('');
});
