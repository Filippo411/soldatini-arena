/* Generato da tools/build-legacy.js: NON modificare a mano */
/**
 * Piccoli "rattoppi" per i browser delle smart TV più vecchie (Chrome 38-60 circa).
 * Vengono caricati solo nella versione "legacy" dello schermo grande.
 */
(function () {
  'use strict';
  function def(obj, name, fn) { if (!obj[name]) Object.defineProperty(obj, name, { value: fn, configurable: true, writable: true }); }
  def(Object, 'assign', function (t) {
    for (var i = 1; i < arguments.length; i++) { var s = arguments[i]; if (s) for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k]; }
    return t;
  });
  def(Object, 'values', function (o) { return Object.keys(o).map(function (k) { return o[k]; }); });
  def(Object, 'entries', function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }); });
  def(Array, 'from', function (a, fn) {
    var out = [];
    if (a && typeof Symbol !== 'undefined' && a[Symbol.iterator] && typeof a.length !== 'number') { var it = a[Symbol.iterator](), r; while (!(r = it.next()).done) out.push(r.value); }
    else for (var i = 0; i < a.length; i++) out.push(a[i]);
    return fn ? out.map(fn) : out;
  });
  def(Array.prototype, 'find', function (f, t) { for (var i = 0; i < this.length; i++) if (f.call(t, this[i], i, this)) return this[i]; });
  def(Array.prototype, 'findIndex', function (f, t) { for (var i = 0; i < this.length; i++) if (f.call(t, this[i], i, this)) return i; return -1; });
  def(Array.prototype, 'includes', function (v) { return this.indexOf(v) !== -1 || (v !== v && this.some(function (x) { return x !== x; })); });
  def(Array.prototype, 'fill', function (v, s, e) {
    var len = this.length; s = s == null ? 0 : (s < 0 ? Math.max(len + s, 0) : Math.min(s, len)); e = e == null ? len : (e < 0 ? Math.max(len + e, 0) : Math.min(e, len));
    for (var i = s; i < e; i++) this[i] = v; return this;
  });
  ['Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array'].forEach(function (n) {
    if (window[n]) def(window[n].prototype, 'fill', Array.prototype.fill);
  });
  def(String.prototype, 'padStart', function (n, p) { var s = String(this); p = p == null ? ' ' : String(p); while (s.length < n) s = p + s; return s.slice(s.length - Math.max(n, String(this).length)); });
  def(String.prototype, 'includes', function (s, i) { return this.indexOf(s, i || 0) !== -1; });
  def(String.prototype, 'startsWith', function (s, i) { return this.substr(i || 0, s.length) === s; });
  def(Number, 'isFinite', function (v) { return typeof v === 'number' && isFinite(v); });
  def(Math, 'hypot', function () { var s = 0; for (var i = 0; i < arguments.length; i++) s += arguments[i] * arguments[i]; return Math.sqrt(s); });
  def(Math, 'sign', function (x) { x = +x; return x > 0 ? 1 : x < 0 ? -1 : x; });
  def(Math, 'trunc', function (x) { return x < 0 ? Math.ceil(x) : Math.floor(x); });
  if (window.NodeList) def(NodeList.prototype, 'forEach', Array.prototype.forEach);
})();


/* ---- js/common/net.js ---- */
"use strict";
(function () {
    'use strict';
    var Net = (function () {
        function Net(urlFn, handlers) {
            var _this = this;
            this.urlFn = urlFn;
            this.h = handlers || {};
            this.ws = null;
            this.stopped = false;
            this.retry = 0;
            this.connect();
            document.addEventListener('visibilitychange', function () {
                if (!document.hidden && !_this.isOpen())
                    _this.connect();
            });
        }
        Net.prototype.isOpen = function () { return this.ws && this.ws.readyState === 1; };
        Net.prototype.connect = function () {
            var _this = this;
            if (this.stopped)
                return;
            if (this.ws && this.ws.readyState <= 1)
                return;
            var proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
            var ws = new WebSocket(proto + location.host + this.urlFn());
            this.ws = ws;
            ws.onopen = function () { _this.retry = 0; _this.h.onopen && _this.h.onopen(); };
            ws.onmessage = function (e) {
                var m;
                try {
                    m = JSON.parse(e.data);
                }
                catch (err) {
                    return;
                }
                _this.h.onmessage && _this.h.onmessage(m);
            };
            ws.onclose = function () {
                if (_this.ws !== ws)
                    return;
                _this.h.onclose && _this.h.onclose();
                if (_this.stopped)
                    return;
                var wait = Math.min(4000, 500 * Math.pow(2, _this.retry++));
                setTimeout(function () { return _this.connect(); }, wait);
            };
            ws.onerror = function () { };
        };
        Net.prototype.send = function (obj) {
            if (this.isOpen())
                this.ws.send(JSON.stringify(obj));
        };
        Net.prototype.stop = function () { this.stopped = true; if (this.ws)
            this.ws.close(); };
        return Net;
    }());
    window.Net = Net;
})();

/* ---- js/common/qr.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function () {
    'use strict';
    var ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
    var NUM_BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
    var ECL_FORMAT_BITS = 0;
    var bit = function (x, i) { return ((x >>> i) & 1) !== 0; };
    function rawModules(ver) {
        var r = (16 * ver + 128) * ver + 64;
        if (ver >= 2) {
            var n = Math.floor(ver / 7) + 2;
            r -= (25 * n - 10) * n - 55;
            if (ver >= 7)
                r -= 36;
        }
        return r;
    }
    var dataCodewords = function (ver) { return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver]; };
    function gfMul(x, y) {
        var z = 0;
        for (var i = 7; i >= 0; i--) {
            z = (z << 1) ^ ((z >>> 7) * 0x11d);
            z ^= ((y >>> i) & 1) * x;
        }
        return z & 0xff;
    }
    function rsDivisor(deg) {
        var r = new Array(deg).fill(0);
        r[deg - 1] = 1;
        var root = 1;
        for (var i = 0; i < deg; i++) {
            for (var j = 0; j < r.length; j++) {
                r[j] = gfMul(r[j], root);
                if (j + 1 < r.length)
                    r[j] ^= r[j + 1];
            }
            root = gfMul(root, 0x02);
        }
        return r;
    }
    function rsRemainder(data, div) {
        var e_1, _a;
        var r = div.map(function () { return 0; });
        var _loop_1 = function (b) {
            var f = b ^ r.shift();
            r.push(0);
            div.forEach(function (c, i) { r[i] ^= gfMul(c, f); });
        };
        try {
            for (var data_1 = __values(data), data_1_1 = data_1.next(); !data_1_1.done; data_1_1 = data_1.next()) {
                var b = data_1_1.value;
                _loop_1(b);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (data_1_1 && !data_1_1.done && (_a = data_1.return)) _a.call(data_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return r;
    }
    function make(text) {
        var bytes = Array.from(new TextEncoder().encode(text));
        var ver = 1;
        for (; ver <= 10; ver++) {
            var ccBits = ver <= 9 ? 8 : 16;
            if (4 + ccBits + bytes.length * 8 <= dataCodewords(ver) * 8)
                break;
        }
        if (ver > 10)
            throw new Error('Testo troppo lungo per il QR');
        var size = ver * 4 + 17;
        var bits = [];
        var push = function (val, len) { for (var i_1 = len - 1; i_1 >= 0; i_1--)
            bits.push((val >>> i_1) & 1); };
        push(0x4, 4);
        push(bytes.length, ver <= 9 ? 8 : 16);
        bytes.forEach(function (b) { return push(b, 8); });
        var cap = dataCodewords(ver) * 8;
        push(0, Math.min(4, cap - bits.length));
        push(0, (8 - (bits.length % 8)) % 8);
        for (var pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11)
            push(pad, 8);
        var data = [];
        for (var i_2 = 0; i_2 < bits.length; i_2 += 8) {
            var b = 0;
            for (var j = 0; j < 8; j++)
                b = (b << 1) | bits[i_2 + j];
            data.push(b);
        }
        var nb = NUM_BLOCKS[ver], eccLen = ECC_PER_BLOCK[ver];
        var rawCw = Math.floor(rawModules(ver) / 8);
        var nShort = nb - (rawCw % nb);
        var shortLen = Math.floor(rawCw / nb);
        var div = rsDivisor(eccLen);
        var blocks = [];
        for (var i_3 = 0, k = 0; i_3 < nb; i_3++) {
            var dat = data.slice(k, k + shortLen - eccLen + (i_3 < nShort ? 0 : 1));
            k += dat.length;
            var ecc = rsRemainder(dat, div);
            if (i_3 < nShort)
                dat.push(0);
            blocks.push(dat.concat(ecc));
        }
        var final = [];
        var _loop_2 = function (i_4) {
            blocks.forEach(function (blk, j) {
                if (i_4 !== shortLen - eccLen || j >= nShort)
                    final.push(blk[i_4]);
            });
        };
        for (var i_4 = 0; i_4 < blocks[0].length; i_4++) {
            _loop_2(i_4);
        }
        var mod = [], fn = [];
        for (var y = 0; y < size; y++) {
            mod.push(new Array(size).fill(false));
            fn.push(new Array(size).fill(false));
        }
        var setF = function (x, y, v) { mod[y][x] = v; fn[y][x] = true; };
        for (var i_5 = 0; i_5 < size; i_5++) {
            setF(6, i_5, i_5 % 2 === 0);
            setF(i_5, 6, i_5 % 2 === 0);
        }
        var finder = function (cx, cy) {
            for (var dy = -4; dy <= 4; dy++)
                for (var dx = -4; dx <= 4; dx++) {
                    var x = cx + dx, y = cy + dy;
                    if (x < 0 || y < 0 || x >= size || y >= size)
                        continue;
                    var d = Math.max(Math.abs(dx), Math.abs(dy));
                    setF(x, y, d !== 2 && d !== 4);
                }
        };
        finder(3, 3);
        finder(size - 4, 3);
        finder(3, size - 4);
        if (ver >= 2) {
            var n = Math.floor(ver / 7) + 2;
            var step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
            var pos = [6];
            for (var p = size - 7; pos.length < n; p -= step)
                pos.splice(1, 0, p);
            for (var i_6 = 0; i_6 < n; i_6++)
                for (var j = 0; j < n; j++) {
                    if ((i_6 === 0 && j === 0) || (i_6 === 0 && j === n - 1) || (i_6 === n - 1 && j === 0))
                        continue;
                    for (var dy = -2; dy <= 2; dy++)
                        for (var dx = -2; dx <= 2; dx++) {
                            setF(pos[i_6] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
                        }
                }
        }
        var drawFormat = function (mask) {
            var d = (ECL_FORMAT_BITS << 3) | mask;
            var rem = d;
            for (var i_7 = 0; i_7 < 10; i_7++)
                rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
            var b = ((d << 10) | rem) ^ 0x5412;
            for (var i_8 = 0; i_8 <= 5; i_8++)
                setF(8, i_8, bit(b, i_8));
            setF(8, 7, bit(b, 6));
            setF(8, 8, bit(b, 7));
            setF(7, 8, bit(b, 8));
            for (var i_9 = 9; i_9 < 15; i_9++)
                setF(14 - i_9, 8, bit(b, i_9));
            for (var i_10 = 0; i_10 < 8; i_10++)
                setF(size - 1 - i_10, 8, bit(b, i_10));
            for (var i_11 = 8; i_11 < 15; i_11++)
                setF(8, size - 15 + i_11, bit(b, i_11));
            setF(8, size - 8, true);
        };
        drawFormat(0);
        if (ver >= 7) {
            var rem = ver;
            for (var i_12 = 0; i_12 < 12; i_12++)
                rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
            var b = (ver << 12) | rem;
            for (var i_13 = 0; i_13 < 18; i_13++) {
                var v = bit(b, i_13), a = size - 11 + (i_13 % 3), c = Math.floor(i_13 / 3);
                setF(a, c, v);
                setF(c, a, v);
            }
        }
        var i = 0;
        for (var right = size - 1; right >= 1; right -= 2) {
            if (right === 6)
                right = 5;
            for (var v = 0; v < size; v++) {
                for (var j = 0; j < 2; j++) {
                    var x = right - j;
                    var up = ((right + 1) & 2) === 0;
                    var y = up ? size - 1 - v : v;
                    if (!fn[y][x] && i < final.length * 8) {
                        mod[y][x] = bit(final[i >>> 3], 7 - (i & 7));
                        i++;
                    }
                }
            }
        }
        var maskFn = [
            function (x, y) { return (x + y) % 2 === 0; },
            function (x, y) { return y % 2 === 0; },
            function (x) { return x % 3 === 0; },
            function (x, y) { return (x + y) % 3 === 0; },
            function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
            function (x, y) { return ((x * y) % 2) + ((x * y) % 3) === 0; },
            function (x, y) { return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; },
            function (x, y) { return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; },
        ];
        var applyMask = function (m) {
            for (var y = 0; y < size; y++)
                for (var x = 0; x < size; x++) {
                    if (!fn[y][x] && maskFn[m](x, y))
                        mod[y][x] = !mod[y][x];
                }
        };
        var penalty = function () {
            var p = 0, dark = 0;
            for (var y = 0; y < size; y++) {
                for (var k = 0; k < 2; k++) {
                    var run = 0, prev = null;
                    for (var x = 0; x < size; x++) {
                        var v = k ? mod[x][y] : mod[y][x];
                        if (v === prev) {
                            run++;
                            if (run === 5)
                                p += 3;
                            else if (run > 5)
                                p++;
                        }
                        else {
                            prev = v;
                            run = 1;
                        }
                    }
                }
                for (var x = 0; x < size; x++) {
                    if (mod[y][x])
                        dark++;
                    if (x < size - 1 && y < size - 1) {
                        var c = mod[y][x];
                        if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1])
                            p += 3;
                    }
                }
            }
            p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
            return p;
        };
        var best = 0, bestP = Infinity;
        for (var m = 0; m < 8; m++) {
            applyMask(m);
            drawFormat(m);
            var p = penalty();
            if (p < bestP) {
                bestP = p;
                best = m;
            }
            applyMask(m);
        }
        applyMask(best);
        drawFormat(best);
        return mod;
    }
    function draw(canvas, matrix, scale) {
        var n = matrix.length, q = 4;
        canvas.width = canvas.height = (n + q * 2) * scale;
        var g = canvas.getContext('2d');
        g.fillStyle = '#fff';
        g.fillRect(0, 0, canvas.width, canvas.height);
        g.fillStyle = '#000';
        for (var y = 0; y < n; y++)
            for (var x = 0; x < n; x++) {
                if (matrix[y][x])
                    g.fillRect((x + q) * scale, (y + q) * scale, scale, scale);
            }
    }
    window.QR = { make: make, draw: draw };
})();

/* ---- js/common/icons.js ---- */
"use strict";
(function () {
    'use strict';
    var PAL = {
        k: '#1b1b26',
        w: '#ffffff',
        y: '#ffe14a',
        Y: '#f39b1d',
        g: '#6fae3a',
        G: '#3d6b22',
        c: '#5ff2ff',
        C: '#1d8fc9',
        b: '#d9a441',
        B: '#8c5a1c',
        o: '#7a8a3a',
        O: '#4d5a22',
        r: '#e8423b',
        s: '#b9bcc4',
        S: '#6b6f7a',
    };
    var ICONS = {
        flash: [
            '....kkkk.',
            '...kyyyk.',
            '..kyyyk..',
            '.kyyyykkk',
            'kyyyyyyyk',
            'kkkyyyyk.',
            '..kyyyk..',
            '.kyyk....',
            '.kkk.....',
        ],
        grenade: [
            '...kkk...',
            '..ksSskk.',
            '..kkkkk.k',
            '.kggggk.k',
            'kgGgGgGk.',
            'kggggggk.',
            'kgGgGgGk.',
            '.kggggk..',
            '..kkkk...',
        ],
        shield: [
            'kkkkkkkkk',
            'kcccwcccC',
            'kccwccccC',
            'kcwcccccC',
            'kcccccccC',
            '.kcccccC.',
            '.kCccccC.',
            '..kCccC..',
            '...kCk...',
        ],
        ammo: [
            '.kkkkkkk.',
            'kbBkbBkbk',
            'kbBkbBkbk',
            'kkkkkkkkk',
            'kooooooOk',
            'koyyyyyOk',
            'kooooooOk',
            'kOOOOOOOk',
            '.kkkkkkk.',
        ],
        bullet: [
            '.y.',
            'kbk',
            'kbk',
            'kBk',
            'kkk',
        ],
        sheep: [
            '..kkkkk....',
            '.kwwswwkk..',
            'kwwwwwwwkkk',
            'kwswwwswkSk',
            'kwwwwwwwkwk',
            'kwwwswwwkkk',
            '.kkkkkkkk..',
            '..kS..kS...',
            '..kk..kk...',
        ],
        skull: [
            '.kkkkk.',
            'kwwwwwk',
            'kwkwkwk',
            'kwwwwwk',
            '.kwkwk.',
            '..kkk..',
        ],
    };
    function drawIcon(ctx, name, x, y, scale, colorOverride) {
        var rows = ICONS[name];
        if (!rows)
            return;
        scale = scale || 1;
        for (var j = 0; j < rows.length; j++) {
            for (var i = 0; i < rows[j].length; i++) {
                var ch = rows[j][i];
                if (ch === '.')
                    continue;
                ctx.fillStyle = colorOverride ? (ch === 'k' ? PAL.k : colorOverride) : PAL[ch];
                ctx.fillRect(x + i * scale, y + j * scale, scale, scale);
            }
        }
    }
    window.Icons = { ICONS: ICONS, PAL: PAL, drawIcon: drawIcon };
})();

/* ---- js/core/registry.js ---- */
"use strict";
(function () {
    'use strict';
    window.ROOM = {
        NAME: 'PIPPO GAME ROOM',
        PLAYERS: [
            { name: 'ROSSO', color: '#ff3b3b', dark: '#a3172a', light: '#ff9c8a' },
            { name: 'BLU', color: '#2f8bff', dark: '#1a3fa8', light: '#9ccbff' },
            { name: 'GIALLO', color: '#ffd23b', dark: '#c27a12', light: '#fff1a0' },
            { name: 'VERDE', color: '#3fe05a', dark: '#16843a', light: '#a6ffad' },
        ],
        EVENING_POINTS: [3, 2, 1, 0],
    };
    var list = [];
    window.GAMES = {
        list: list,
        register: function (def) { list.push(def); },
        get: function (id) { return list.find(function (g) { return g.id === id; }) || null; },
    };
})();

/* ---- js/core/font.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function () {
    'use strict';
    var G = {
        A: '.###.|#...#|#...#|#####|#...#|#...#|#...#',
        B: '####.|#...#|#...#|####.|#...#|#...#|####.',
        C: '.###.|#...#|#....|#....|#....|#...#|.###.',
        D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
        E: '#####|#....|#....|####.|#....|#....|#####',
        F: '#####|#....|#....|####.|#....|#....|#....',
        G: '.###.|#...#|#....|#.###|#...#|#...#|.####',
        H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
        I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
        J: '..###|...#.|...#.|...#.|#..#.|#..#.|.##..',
        K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
        L: '#....|#....|#....|#....|#....|#....|#####',
        M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
        N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
        O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
        P: '####.|#...#|#...#|####.|#....|#....|#....',
        Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
        R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
        S: '.####|#....|#....|.###.|....#|....#|####.',
        T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
        U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
        V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
        W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.',
        X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
        Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
        Z: '#####|....#|...#.|..#..|.#...|#....|#####',
        0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
        1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
        2: '.###.|#...#|....#|...#.|..#..|.#...|#####',
        3: '####.|....#|....#|.###.|....#|....#|####.',
        4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
        5: '#####|#....|####.|....#|....#|#...#|.###.',
        6: '.###.|#....|#....|####.|#...#|#...#|.###.',
        7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
        8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
        9: '.###.|#...#|#...#|.####|....#|....#|.###.',
        '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..',
        '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
        '.': '.....|.....|.....|.....|.....|.....|..#..',
        ',': '.....|.....|.....|.....|.....|..#..|.#...',
        ':': '.....|..#..|.....|.....|.....|..#..|.....',
        '-': '.....|.....|.....|.###.|.....|.....|.....',
        '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
        '/': '....#|...#.|...#.|..#..|.#...|.#...|#....',
        "'": '..#..|..#..|.....|.....|.....|.....|.....',
        '>': '.#...|..#..|...#.|....#|...#.|..#..|.#...',
        '<': '...#.|..#..|.#...|#....|.#...|..#..|...#.',
        '=': '.....|.....|#####|.....|#####|.....|.....',
        '_': '.....|.....|.....|.....|.....|.....|#####',
        '#': '.#.#.|#####|.#.#.|.#.#.|.#.#.|#####|.#.#.',
        '*': '.....|#.#.#|.###.|#####|.###.|#.#.#|.....',
        x: '.....|.....|#...#|.#.#.|..#..|.#.#.|#...#',
        ' ': '.....|.....|.....|.....|.....|.....|.....',
    };
    var GLYPHS = {};
    for (var k in G)
        GLYPHS[k] = G[k].split('|');
    var ACCENTS = { 'À': 'A', 'È': 'E', 'É': 'E', 'Ì': 'I', 'Ò': 'O', 'Ù': 'U' };
    function norm(text) {
        var e_1, _a;
        var out = '';
        try {
            for (var _b = __values(String(text)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var ch0 = _c.value;
                if (ch0 === 'x') {
                    out += 'x';
                    continue;
                }
                var ch = ch0.toUpperCase();
                ch = ACCENTS[ch] || ch;
                out += GLYPHS[ch] ? ch : ' ';
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return out;
    }
    var ADV = 6;
    function width(text, scale) { var t = norm(text); return (t.length * ADV - 1) * (scale || 1); }
    var cache = new Map();
    function render(text, color, scale, outline, shadow) {
        var t = norm(text);
        var key = t + '|' + color + '|' + scale + '|' + outline + '|' + shadow;
        var c = cache.get(key);
        if (c)
            return c;
        if (cache.size > 400)
            cache.clear();
        var pad = (outline ? 1 : 0) * scale;
        var sh = shadow ? scale : 0;
        c = document.createElement('canvas');
        c.width = Math.max(1, (t.length * ADV - 1) * scale + pad * 2 + sh);
        c.height = 7 * scale + pad * 2 + sh;
        var g = c.getContext('2d');
        var plot = function (ox, oy, col) {
            g.fillStyle = col;
            for (var i = 0; i < t.length; i++) {
                var rows = GLYPHS[t[i]];
                for (var y = 0; y < 7; y++)
                    for (var x = 0; x < 5; x++) {
                        if (rows[y][x] === '#')
                            g.fillRect(ox + (i * ADV + x) * scale, oy + y * scale, scale, scale);
                    }
            }
        };
        if (shadow) {
            if (outline)
                for (var dy = -1; dy <= 1; dy++)
                    for (var dx = -1; dx <= 1; dx++)
                        plot(pad + sh + dx * scale, pad + sh + dy * scale, shadow);
            else
                plot(pad + sh, pad + sh, shadow);
        }
        if (outline) {
            for (var dy = -1; dy <= 1; dy++)
                for (var dx = -1; dx <= 1; dx++) {
                    if (dx || dy)
                        plot(pad + dx * scale, pad + dy * scale, outline);
                }
        }
        plot(pad, pad, color);
        cache.set(key, c);
        return c;
    }
    function draw(ctx, text, x, y, opts) {
        opts = opts || {};
        var scale = opts.scale || 1;
        var outline = opts.outline === undefined ? '#1b1b26' : opts.outline;
        var c = render(text, opts.color || '#ffffff', scale, outline, opts.shadow || null);
        var pad = outline ? scale : 0;
        var dx = Math.round(x) - pad;
        if (opts.align === 'center')
            dx = Math.round(x - (c.width - (opts.shadow ? scale : 0)) / 2);
        else if (opts.align === 'right')
            dx = Math.round(x - c.width + pad + (opts.shadow ? scale : 0));
        ctx.drawImage(c, dx, Math.round(y) - pad);
    }
    window.PixelFont = { draw: draw, width: width, norm: norm };
})();

/* ---- js/common/logo.js ---- */
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function () {
    'use strict';
    var B = 8;
    var W = 200, H = 68;
    var INK = '#1b1b26';
    var LETTERS = {
        P: ['####', '#..#', '####', '#...', '#...'],
        I: ['###', '.#.', '.#.', '.#.', '###'],
        O: ['####', '#..#', '#..#', '#..#', '####'],
    };
    var WORD = 'PIPPO';
    var COLORS = [
        ['#f03c3c', '#ff9c8a', '#a3172a'],
        ['#3cd8f0', '#b8f6ff', '#1d8fc9'],
        ['#ffd23b', '#fff1a0', '#c27a12'],
        ['#3fe05a', '#a6ffad', '#16843a'],
        ['#b04cf0', '#e2b0ff', '#6a1fa3'],
    ];
    function buildBlocks() {
        var blocks = [];
        var totalW = WORD.split('').reduce(function (w, ch) { return w + LETTERS[ch][0].length; }, 0) + WORD.length - 1;
        var ox = Math.floor((W - totalW * B) / 2);
        WORD.split('').forEach(function (ch, li) {
            var rows = LETTERS[ch];
            rows.forEach(function (row, ry) { return __spreadArray([], __read(row), false).forEach(function (c, rx) {
                if (c === '#')
                    blocks.push({ x: ox + rx * B, y: 2 + ry * B, col: COLORS[li % COLORS.length], letter: li, row: ry });
            }); });
            ox += (rows[0].length + 1) * B;
        });
        return blocks;
    }
    function drawBlock(g, x, y, col, flash) {
        x = Math.round(x);
        y = Math.round(y);
        var _a = __read(flash ? ['#ffffff', '#ffffff', '#d6d6e0'] : col, 3), base = _a[0], light = _a[1], dark = _a[2];
        g.fillStyle = INK;
        g.fillRect(x, y, B, B);
        g.fillStyle = dark;
        g.fillRect(x, y, B - 1, B - 1);
        g.fillStyle = base;
        g.fillRect(x, y, B - 2, B - 2);
        g.fillStyle = light;
        g.fillRect(x, y, B - 2, 1);
        g.fillRect(x, y, 1, B - 2);
        g.fillStyle = '#ffffff';
        g.fillRect(x + 1, y + 1, 1, 1);
        g.fillStyle = dark;
        g.fillRect(x + 3, y + 3, 2, 2);
        g.fillStyle = light;
        g.fillRect(x + 3, y + 3, 1, 1);
    }
    function mount(canvas, opts) {
        opts = opts || {};
        canvas.width = W;
        canvas.height = H;
        var g = canvas.getContext('2d');
        g.imageSmoothingEnabled = false;
        var blocks = buildBlocks();
        blocks.forEach(function (b) {
            b.delay = opts.animate === false ? 0 : b.letter * 0.32 + (4 - b.row) * 0.06 + Math.random() * 0.05;
        });
        var FALL = 0.35;
        var start = performance.now();
        var flashRow = -1, flashUntil = 0, nextFlash = 3;
        function frame(now) {
            var e_1, _a;
            var t = (now - start) / 1000;
            g.clearRect(0, 0, W, H);
            if (t > nextFlash) {
                flashRow = Math.floor(Math.random() * 5);
                flashUntil = t + 0.35;
                nextFlash = t + 4 + Math.random() * 4;
            }
            var allLanded = true;
            try {
                for (var blocks_1 = __values(blocks), blocks_1_1 = blocks_1.next(); !blocks_1_1.done; blocks_1_1 = blocks_1.next()) {
                    var b = blocks_1_1.value;
                    var k = (t - b.delay) / FALL;
                    if (k <= 0) {
                        allLanded = false;
                        continue;
                    }
                    var y = b.y;
                    if (k < 1) {
                        allLanded = false;
                        y = -B + (b.y + B) * k * k;
                    }
                    var flash = t < flashUntil && b.row === flashRow && Math.floor(t * 16) % 2 === 0;
                    drawBlock(g, b.x, y, b.col, flash);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (blocks_1_1 && !blocks_1_1.done && (_a = blocks_1.return)) _a.call(blocks_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            var lastDelay = Math.max.apply(Math, __spreadArray([], __read(blocks.map(function (b) { return b.delay; })), false)) + FALL;
            if (window.PixelFont && t > lastDelay - 0.1) {
                var blink = t < lastDelay + 0.5 && Math.floor(t * 12) % 2;
                if (!blink) {
                    PixelFont.draw(g, 'GAME ROOM', W / 2 + 2, 51, { color: '#a3172a', scale: 2, align: 'center', outline: INK });
                    PixelFont.draw(g, 'GAME ROOM', W / 2, 49, { color: '#ffffff', scale: 2, align: 'center', outline: INK });
                }
            }
            if (!allLanded || t < lastDelay + 1 || opts.loop !== false)
                requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }
    window.Logo = { mount: mount };
})();

/* ---- js/core/audio.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
(function () {
    'use strict';
    var ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
    var muted = false;
    function init() {
        if (ctx) {
            if (ctx.state === 'suspended')
                ctx.resume();
            return;
        }
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC)
            return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.55;
        master.connect(ctx.destination);
        sfxBus = ctx.createGain();
        sfxBus.gain.value = 0.9;
        sfxBus.connect(master);
        musicBus = ctx.createGain();
        musicBus.gain.value = 0.22;
        musicBus.connect(master);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
        var d = noiseBuf.getChannelData(0);
        for (var i = 0; i < d.length; i++)
            d[i] = Math.random() * 2 - 1;
    }
    function tone(type, f0, f1, dur, vol, when, bus) {
        var t = ctx.currentTime + (when || 0);
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f0, t);
        if (f1 && f1 !== f0)
            o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
        o.connect(g);
        g.connect(bus || sfxBus);
        o.start(t);
        o.stop(t + dur + 0.02);
    }
    function noise(dur, vol, fStart, fEnd, when) {
        var t = ctx.currentTime + (when || 0);
        var src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        var f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(fStart, t);
        f.frequency.exponentialRampToValueAtTime(Math.max(40, fEnd), t + dur);
        var g = ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
        src.connect(f);
        f.connect(g);
        g.connect(sfxBus);
        src.start(t, Math.random() * 0.5);
        src.stop(t + dur + 0.02);
    }
    var N = function (n) { return 440 * Math.pow(2, (n - 69) / 12); };
    var SOUNDS = {
        shot: function () { tone('square', 880, 140, 0.09, 0.18); noise(0.07, 0.25, 6000, 800); },
        empty: function () { tone('square', 160, 120, 0.05, 0.12); tone('square', 120, 90, 0.05, 0.1, 0.06); },
        explosion: function () {
            noise(0.9, 0.9, 2400, 60);
            tone('triangle', 120, 30, 0.6, 0.6);
            tone('square', 70, 30, 0.35, 0.25);
        },
        small_explosion: function () { noise(0.45, 0.6, 3000, 90); tone('triangle', 160, 40, 0.35, 0.4); },
        death: function () {
            tone('square', 600, 80, 0.45, 0.16);
            tone('square', 300, 40, 0.5, 0.1, 0.05);
        },
        hit_shield: function () { tone('square', 1400, 900, 0.08, 0.14); tone('triangle', 2000, 1500, 0.15, 0.12, 0.04); },
        pickup_ammo: function () { [0, 4, 7].forEach(function (n, i) { return tone('square', N(72 + n), null, 0.06, 0.14, i * 0.05); }); },
        pickup_power: function () { [0, 4, 7, 12, 16].forEach(function (n, i) { return tone('square', N(76 + n), null, 0.06, 0.13, i * 0.04); }); },
        flash: function () { tone('sawtooth', 200, 1600, 0.3, 0.12); tone('square', 400, 2400, 0.25, 0.08, 0.05); },
        shield: function () { tone('triangle', 300, 900, 0.3, 0.2); tone('square', 600, 1200, 0.25, 0.06, 0.1); },
        throw: function () { tone('triangle', 500, 250, 0.15, 0.15); },
        bounce: function () { tone('square', 300, 280, 0.03, 0.08); },
        respawn: function () { [0, 7, 12].forEach(function (n, i) { return tone('triangle', N(60 + n), null, 0.08, 0.2, i * 0.06); }); },
        beep: function () { tone('square', N(72), null, 0.12, 0.18); },
        go: function () { tone('square', N(84), null, 0.35, 0.2); tone('square', N(79), null, 0.35, 0.12); },
        join: function () { tone('square', N(67), null, 0.06, 0.15); tone('square', N(74), null, 0.1, 0.15, 0.07); },
        tick: function () { tone('square', N(96), null, 0.03, 0.06); },
        start_jingle: function () {
            var e_1, _a;
            var mel = [[67, 0.1], [72, 0.1], [76, 0.1], [79, 0.25], [76, 0.1], [79, 0.4]];
            var t = 0;
            try {
                for (var mel_1 = __values(mel), mel_1_1 = mel_1.next(); !mel_1_1.done; mel_1_1 = mel_1.next()) {
                    var _b = __read(mel_1_1.value, 2), n = _b[0], d = _b[1];
                    tone('square', N(n), null, d * 0.95, 0.16, t);
                    tone('triangle', N(n - 24), null, d, 0.25, t);
                    t += d;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (mel_1_1 && !mel_1_1.done && (_a = mel_1.return)) _a.call(mel_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        },
        win_jingle: function () {
            var e_2, _a;
            var mel = [[72, 0.12], [72, 0.12], [72, 0.12], [72, 0.36], [68, 0.36], [70, 0.36], [72, 0.24], [70, 0.12], [72, 0.7]];
            var t = 0;
            try {
                for (var mel_2 = __values(mel), mel_2_1 = mel_2.next(); !mel_2_1.done; mel_2_1 = mel_2.next()) {
                    var _b = __read(mel_2_1.value, 2), n = _b[0], d = _b[1];
                    tone('square', N(n), null, d * 0.9, 0.17, t);
                    tone('square', N(n - 5), null, d * 0.9, 0.07, t);
                    tone('triangle', N(n - 24), null, d, 0.3, t);
                    t += d;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (mel_2_1 && !mel_2_1.done && (_a = mel_2.return)) _a.call(mel_2);
                }
                finally { if (e_2) throw e_2.error; }
            }
        },
    };
    var lastPlay = {};
    function play(name) {
        if (!ctx || muted || !SOUNDS[name])
            return;
        var now = performance.now();
        if (lastPlay[name] && now - lastPlay[name] < 25)
            return;
        lastPlay[name] = now;
        try {
            SOUNDS[name]();
        }
        catch (e) { }
    }
    function announce(text, opts) {
        if (muted || !('speechSynthesis' in window))
            return;
        opts = opts || {};
        try {
            speechSynthesis.cancel();
            var u = new SpeechSynthesisUtterance(text);
            u.lang = opts.lang || 'en-US';
            u.rate = opts.rate || 0.95;
            u.pitch = opts.pitch != null ? opts.pitch : 0.4;
            u.volume = 1;
            speechSynthesis.speak(u);
        }
        catch (e) { }
    }
    var THEMES = {
        army: {
            bpm: 150, leadFrom: 32, leadWave: 'square',
            bass: [40, 40, 52, 40, 43, 43, 55, 43, 38, 38, 50, 38, 45, 45, 47, 45],
            lead: [64, 0, 67, 0, 71, 0, 67, 64, 62, 0, 67, 0, 69, 0, 71, 0, 64, 0, 67, 0, 72, 0, 71, 67, 69, 0, 67, 0, 64, 0, 62, 0],
            snare: [2],
        },
        farm: {
            bpm: 168, leadFrom: 0, leadWave: 'square',
            bass: [48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 60, 0, 55, 0, 59, 0],
            lead: [72, 74, 76, 72, 76, 0, 79, 0, 77, 76, 74, 72, 74, 0, 67, 0, 72, 74, 76, 77, 79, 0, 79, 0, 81, 79, 77, 74, 72, 0, 0, 0],
            snare: [1, 3],
        },
        race: {
            bpm: 176, leadFrom: 16, leadWave: 'square',
            bass: [45, 45, 57, 45, 45, 57, 45, 57, 41, 41, 53, 41, 43, 43, 55, 43],
            lead: [69, 0, 72, 76, 0, 74, 72, 0, 69, 0, 72, 74, 76, 0, 79, 0, 77, 0, 76, 74, 0, 72, 74, 0, 76, 0, 72, 0, 69, 0, 0, 0],
            snare: [2],
        },
    };
    var musicTimer = null, nextBeat = 0, step = 0, theme = THEMES.army;
    function scheduleMusic() {
        var STEP = 60 / theme.bpm / 2;
        while (nextBeat < ctx.currentTime + 0.2) {
            var when = nextBeat - ctx.currentTime;
            var b = theme.bass[step % theme.bass.length];
            if (b)
                tone('triangle', N(b), null, STEP * 0.9, 0.5, when, musicBus);
            var l = theme.lead[step % theme.lead.length];
            if (l && step % 64 >= theme.leadFrom)
                tone(theme.leadWave, N(l), null, STEP * 0.8, 0.12, when, musicBus);
            if (theme.snare.includes(step % 4)) {
                var t = ctx.currentTime + when;
                var src = ctx.createBufferSource();
                src.buffer = noiseBuf;
                var g = ctx.createGain();
                g.gain.setValueAtTime(0.22, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
                src.connect(g);
                g.connect(musicBus);
                src.start(t, Math.random());
                src.stop(t + 0.1);
            }
            nextBeat += STEP;
            step++;
        }
    }
    function startMusic(name) {
        if (!ctx)
            return;
        theme = THEMES[name] || THEMES.army;
        if (musicTimer)
            return;
        nextBeat = ctx.currentTime + 0.1;
        step = 0;
        musicTimer = setInterval(scheduleMusic, 50);
    }
    function stopMusic() { clearInterval(musicTimer); musicTimer = null; }
    function register(name, fn) { SOUNDS[name] = function () { return fn({ tone: tone, noise: noise, N: N, ctx: ctx }); }; }
    function toggleMute() {
        muted = !muted;
        if (master)
            master.gain.value = muted ? 0 : 0.55;
        if (muted && 'speechSynthesis' in window)
            speechSynthesis.cancel();
        return muted;
    }
    window.Sfx = { init: init, play: play, announce: announce, startMusic: startMusic, stopMusic: stopMusic, toggleMute: toggleMute, register: register, isMuted: function () { return muted; } };
})();

/* ---- js/games/shooter/config.js ---- */
"use strict";
(function () {
    'use strict';
    var CFG = {
        W: 384,
        H: 216,
        HUD_TOP: 12,
        HUD_BOTTOM: 12,
        TILE: 8,
        COLS: 48,
        ROWS: 24,
        MATCH_TIME: 240,
        RESPAWN_TIME: 3,
        SPAWN_PROTECT: 1.5,
        SPEED: 62,
        FLASH_MULT: 1.8,
        HALF: 2.5,
        STICK_DEADZONE: 0.2,
        STICK_FULL: 0.65,
        AIM_RANGE: 90,
        AUTO_AIM_RANGE: 170,
        HIT_R: 6,
        MAX_AMMO: 10,
        FIRE_COOLDOWN: 0.24,
        BULLET_SPEED: 230,
        BULLET_LIFE: 1.6,
        GRENADE_FUSE: 1.5,
        GRENADE_SPEED: 150,
        BLAST_R: 30,
        BARREL_R: 26,
        FLASH_TIME: 5,
        SHIELD_TIME: 10,
        AMMO_MAX_ON_MAP: 3,
        AMMO_RESPAWN: 6,
        POWER_MAX_ON_MAP: 2,
        POWER_RESPAWN: 9,
        PLAYERS: ROOM.PLAYERS,
        BOT_NAMES: ['SGT.BRUNO', 'CAP.TONI', 'CPL.GINO', 'SGT.RITA', 'CPL.NINA', 'CAP.OSCAR'],
        POWER_TYPES: ['flash', 'grenade', 'shield'],
    };
    CFG.MAP_W = CFG.COLS * CFG.TILE;
    CFG.MAP_H = CFG.ROWS * CFG.TILE;
    CFG.T = {
        FLOOR: 0,
        WALL: 1,
        CRATE: 2,
        SAND: 3,
        BARREL: 4,
        WIRE: 5,
        WRECK: 6,
    };
    window.CFG = CFG;
})();

/* ---- js/games/shooter/map.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    'use strict';
    var COLS = CFG.COLS, ROWS = CFG.ROWS, TILE = CFG.TILE, T = CFG.T;
    var rnd = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
    var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
    var blocksMove = function (t) { return t !== T.FLOOR; };
    var blocksShot = function (t) { return t !== T.FLOOR && t !== T.WIRE; };
    function randomPrefab() {
        var e_1, _a, e_2, _b;
        var cells = [];
        var kind = pick(['wallL', 'wallL', 'wallLine', 'sand', 'sand', 'crates', 'crates', 'barrels', 'wire', 'wreck', 'bunker']);
        if (kind === 'wallL') {
            var a = rnd(3, 5), b = rnd(2, 3);
            for (var i = 0; i < a; i++)
                cells.push([i, 0, T.WALL]);
            for (var j = 1; j < b; j++)
                cells.push([0, j, T.WALL]);
        }
        else if (kind === 'wallLine') {
            var n = rnd(3, 5);
            var horiz = Math.random() < 0.5;
            for (var i = 0; i < n; i++)
                cells.push(horiz ? [i, 0, T.WALL] : [0, i, T.WALL]);
        }
        else if (kind === 'sand') {
            var n = rnd(3, 5);
            var horiz = Math.random() < 0.65;
            for (var i = 0; i < n; i++)
                cells.push(horiz ? [i, 0, T.SAND] : [0, i, T.SAND]);
        }
        else if (kind === 'crates') {
            var shape = pick([[[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 0]]]);
            try {
                for (var shape_1 = __values(shape), shape_1_1 = shape_1.next(); !shape_1_1.done; shape_1_1 = shape_1.next()) {
                    var _c = __read(shape_1_1.value, 2), x = _c[0], y = _c[1];
                    cells.push([x, y, T.CRATE]);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (shape_1_1 && !shape_1_1.done && (_a = shape_1.return)) _a.call(shape_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        else if (kind === 'barrels') {
            var shape = pick([[[0, 0]], [[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 1]]]);
            try {
                for (var shape_2 = __values(shape), shape_2_1 = shape_2.next(); !shape_2_1.done; shape_2_1 = shape_2.next()) {
                    var _d = __read(shape_2_1.value, 2), x = _d[0], y = _d[1];
                    cells.push([x, y, T.BARREL]);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (shape_2_1 && !shape_2_1.done && (_b = shape_2.return)) _b.call(shape_2);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
        else if (kind === 'wire') {
            var n = rnd(3, 4);
            var horiz = Math.random() < 0.5;
            for (var i = 0; i < n; i++)
                cells.push(horiz ? [i, 0, T.WIRE] : [0, i, T.WIRE]);
        }
        else if (kind === 'wreck') {
            for (var y = 0; y < 2; y++)
                for (var x = 0; x < 3; x++)
                    cells.push([x, y, T.WRECK]);
        }
        else if (kind === 'bunker') {
            cells.push([0, 0, T.SAND], [1, 0, T.SAND], [2, 0, T.SAND], [0, 1, T.SAND], [2, 1, T.CRATE]);
        }
        return cells;
    }
    function tryGenerate() {
        var e_3, _a, e_4, _b;
        var g = [];
        for (var y = 0; y < ROWS; y++)
            g.push(new Array(COLS).fill(T.FLOOR));
        var wrecks = [];
        var QW = COLS / 2, QH = ROWS / 2;
        var free = function (x, y) { return x >= 1 && y >= 1 && x < QW && y < QH && g[y][x] === T.FLOOR; };
        var inSpawnZone = function (x, y) { return x <= 5 && y <= 5; };
        var target = rnd(9, 12);
        var placed = 0;
        var _loop_1 = function (attempt) {
            var e_5, _h, e_6, _j;
            var cells = randomPrefab();
            var fx = Math.random() < 0.5, fy = Math.random() < 0.5;
            var w = Math.max.apply(Math, __spreadArray([], __read(cells.map(function (c) { return c[0]; })), false)) + 1;
            var h = Math.max.apply(Math, __spreadArray([], __read(cells.map(function (c) { return c[1]; })), false)) + 1;
            var ox = rnd(2, QW - w), oy = rnd(2, QH - h);
            var abs = cells.map(function (_a) {
                var _b = __read(_a, 3), x = _b[0], y = _b[1], t = _b[2];
                return [ox + (fx && t !== T.WRECK ? w - 1 - x : x), oy + (fy && t !== T.WRECK ? h - 1 - y : y), t];
            });
            var ok = true;
            try {
                for (var abs_1 = (e_5 = void 0, __values(abs)), abs_1_1 = abs_1.next(); !abs_1_1.done; abs_1_1 = abs_1.next()) {
                    var _k = __read(abs_1_1.value, 2), x = _k[0], y = _k[1];
                    if (inSpawnZone(x, y) || x >= QW || y >= QH) {
                        ok = false;
                        break;
                    }
                    for (var dy = -1; dy <= 1 && ok; dy++)
                        for (var dx = -1; dx <= 1; dx++) {
                            var xx = x + dx, yy = y + dy;
                            if (xx < 1 || yy < 1 || xx >= QW || yy >= QH)
                                continue;
                            if (!free(xx, yy)) {
                                ok = false;
                                break;
                            }
                        }
                    if (!ok)
                        break;
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (abs_1_1 && !abs_1_1.done && (_h = abs_1.return)) _h.call(abs_1);
                }
                finally { if (e_5) throw e_5.error; }
            }
            if (!ok)
                return "continue";
            try {
                for (var abs_2 = (e_6 = void 0, __values(abs)), abs_2_1 = abs_2.next(); !abs_2_1.done; abs_2_1 = abs_2.next()) {
                    var _l = __read(abs_2_1.value, 3), x = _l[0], y = _l[1], t = _l[2];
                    g[y][x] = t;
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (abs_2_1 && !abs_2_1.done && (_j = abs_2.return)) _j.call(abs_2);
                }
                finally { if (e_6) throw e_6.error; }
            }
            if (abs[0][2] === T.WRECK)
                wrecks.push([ox, oy]);
            placed++;
        };
        for (var attempt = 0; attempt < 300 && placed < target; attempt++) {
            _loop_1(attempt);
        }
        for (var y = 0; y < QH; y++)
            for (var x = 0; x < QW; x++) {
                var t = g[y][x];
                g[y][COLS - 1 - x] = t;
                g[ROWS - 1 - y][x] = t;
                g[ROWS - 1 - y][COLS - 1 - x] = t;
            }
        var allWrecks = [];
        try {
            for (var wrecks_1 = __values(wrecks), wrecks_1_1 = wrecks_1.next(); !wrecks_1_1.done; wrecks_1_1 = wrecks_1.next()) {
                var _c = __read(wrecks_1_1.value, 2), x = _c[0], y = _c[1];
                allWrecks.push([x, y], [COLS - 3 - x, y], [x, ROWS - 2 - y], [COLS - 3 - x, ROWS - 2 - y]);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (wrecks_1_1 && !wrecks_1_1.done && (_a = wrecks_1.return)) _a.call(wrecks_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        for (var x = 0; x < COLS; x++) {
            g[0][x] = T.WALL;
            g[ROWS - 1][x] = T.WALL;
        }
        for (var y = 0; y < ROWS; y++) {
            g[y][0] = T.WALL;
            g[y][COLS - 1] = T.WALL;
        }
        var seen = [];
        for (var y = 0; y < ROWS; y++)
            seen.push(new Array(COLS).fill(false));
        var stack = [[3, 3]];
        seen[3][3] = true;
        var reached = 0;
        while (stack.length) {
            var _d = __read(stack.pop(), 2), x = _d[0], y = _d[1];
            reached++;
            try {
                for (var _e = (e_4 = void 0, __values([[1, 0], [-1, 0], [0, 1], [0, -1]])), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var _g = __read(_f.value, 2), dx = _g[0], dy = _g[1];
                    var xx = x + dx, yy = y + dy;
                    if (xx < 0 || yy < 0 || xx >= COLS || yy >= ROWS)
                        continue;
                    if (seen[yy][xx] || blocksMove(g[yy][xx]))
                        continue;
                    seen[yy][xx] = true;
                    stack.push([xx, yy]);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
        var freeCount = 0, lost = 0;
        for (var y = 0; y < ROWS; y++)
            for (var x = 0; x < COLS; x++) {
                if (g[y][x] === T.FLOOR) {
                    freeCount++;
                    if (!seen[y][x]) {
                        lost++;
                        g[y][x] = T.CRATE;
                    }
                }
            }
        if (lost > 8)
            return null;
        var interior = (COLS - 2) * (ROWS - 2);
        var density = 1 - freeCount / interior;
        if (density < 0.12 || density > 0.26)
            return null;
        return { grid: g, wrecks: allWrecks.filter(function (_a) {
                var _b = __read(_a, 2), x = _b[0], y = _b[1];
                return g[y][x] === T.WRECK;
            }) };
    }
    function generate() {
        for (var i = 0; i < 200; i++) {
            var m = tryGenerate();
            if (m)
                return finish(m);
        }
        var g = [];
        var _loop_2 = function (y) {
            g.push(new Array(COLS).fill(T.FLOOR).map(function (_, x) { return (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1 ? T.WALL : T.FLOOR); }));
        };
        for (var y = 0; y < ROWS; y++) {
            _loop_2(y);
        }
        return finish({ grid: g, wrecks: [] });
    }
    function finish(m) {
        var map = m;
        map.spawns = [
            [3, 3], [COLS - 4, ROWS - 4], [COLS - 4, 3], [3, ROWS - 4],
        ].map(function (_a) {
            var _b = __read(_a, 2), x = _b[0], y = _b[1];
            return ({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 });
        });
        map.seed = Math.floor(Math.random() * 1e9);
        map.tileAt = function (px, py) {
            var x = Math.floor(px / TILE), y = Math.floor(py / TILE);
            if (x < 0 || y < 0 || x >= COLS || y >= ROWS)
                return T.WALL;
            return map.grid[y][x];
        };
        map.solidMove = function (px, py) { return blocksMove(map.tileAt(px, py)); };
        map.solidShot = function (px, py) { return blocksShot(map.tileAt(px, py)); };
        map.lineOfSight = function (x0, y0, x1, y1) {
            var d = Math.hypot(x1 - x0, y1 - y0);
            var steps = Math.ceil(d / 3);
            for (var i = 1; i < steps; i++) {
                var t = i / steps;
                if (map.solidShot(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
                    return false;
            }
            return true;
        };
        map.openTiles = function () {
            var e_7, _a;
            var out = [];
            for (var y = 1; y < ROWS - 1; y++)
                for (var x = 1; x < COLS - 1; x++) {
                    if (map.grid[y][x] !== T.FLOOR)
                        continue;
                    var n = 0;
                    try {
                        for (var _b = (e_7 = void 0, __values([[1, 0], [-1, 0], [0, 1], [0, -1]])), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var _d = __read(_c.value, 2), dx = _d[0], dy = _d[1];
                            if (map.grid[y + dy][x + dx] === T.FLOOR)
                                n++;
                        }
                    }
                    catch (e_7_1) { e_7 = { error: e_7_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_7) throw e_7.error; }
                    }
                    if (n >= 3)
                        out.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, tx: x, ty: y });
                }
            return out;
        };
        return map;
    }
    window.MapGen = { generate: generate, blocksMove: blocksMove, blocksShot: blocksShot };
})();

/* ---- js/games/shooter/sprites.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
(function () {
    'use strict';
    var TILE = CFG.TILE, T = CFG.T, COLS = CFG.COLS, ROWS = CFG.ROWS;
    var P = {
        k: '#1b1b26',
        H: '#9fb04f',
        h: '#66762f',
        d: '#3f4a1d',
        s: '#ffc690',
        S: '#d58a5c',
        w: '#ffffff',
        p: '#c2a463',
        P: '#86703c',
        b: '#5a3a22',
        m: '#b8343a',
    };
    var BODY = [
        '...kkkkkk...',
        '..kHHHHhhk..',
        '.kHHhhhhhhk.',
        '.khhhhhhhdk.',
        'kdhhhhhhhhdk',
        'kkcccccccckk',
        '.ksssswkssk.',
        '.kSsssssssk.',
        '..kSSsssSk..',
        '..kcccccck..',
        '.kCcccccccCk',
        '.kCccCcccCk.',
        '..kPPPPPPk..',
    ];
    var BODY_DEAD = BODY.slice();
    BODY_DEAD[6] = '.ksssskksskk'.slice(0, 12);
    BODY_DEAD[7] = '.kSssssmmsk.';
    var LEGS = {
        stand: [
            '..kppk.kppk.',
            '..kpPk.kpPk.',
            '..kbbbkkbbbk',
            '..kkkk.kkkk.',
        ],
        walkA: [
            '.kppk...kppk',
            '.kpPk...kpk.',
            'kbbbk..kbbbk',
            'kkkk...kkkk.',
        ],
        walkB: [
            '...kppkppk..',
            '...kpPkPk...',
            '...kbbbbbk..',
            '...kkkkkk...',
        ],
    };
    var SW = 12, SH = 17;
    function makeCanvas(w, h) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }
    function rowsToCanvas(rows, pal) {
        var c = makeCanvas(rows[0].length, rows.length);
        var g = c.getContext('2d');
        for (var y = 0; y < rows.length; y++)
            for (var x = 0; x < rows[y].length; x++) {
                var ch = rows[y][x];
                if (ch === '.' || !pal[ch])
                    continue;
                g.fillStyle = pal[ch];
                g.fillRect(x, y, 1, 1);
            }
        return c;
    }
    function flipH(src) {
        var c = makeCanvas(src.width, src.height);
        var g = c.getContext('2d');
        g.translate(src.width, 0);
        g.scale(-1, 1);
        g.drawImage(src, 0, 0);
        return c;
    }
    function rotate90(src, times) {
        var r = ((times % 4) + 4) % 4;
        var w = r % 2 ? src.height : src.width, h = r % 2 ? src.width : src.height;
        var c = makeCanvas(w, h);
        var g = c.getContext('2d');
        g.translate(w / 2, h / 2);
        g.rotate((r * Math.PI) / 2);
        g.drawImage(src, -src.width / 2, -src.height / 2);
        return c;
    }
    function silhouette(src, color) {
        var c = makeCanvas(src.width, src.height);
        var g = c.getContext('2d');
        g.drawImage(src, 0, 0);
        g.globalCompositeOperation = 'source-in';
        g.fillStyle = color;
        g.fillRect(0, 0, c.width, c.height);
        return c;
    }
    function buildSoldier(colorDef) {
        var e_1, _a;
        var pal = Object.assign({}, P, { c: colorDef.color, C: colorDef.dark });
        var frames = {};
        try {
            for (var _b = __values(['stand', 'walkA', 'walkB']), _c = _b.next(); !_c.done; _c = _b.next()) {
                var name = _c.value;
                frames[name] = rowsToCanvas(BODY.concat(LEGS[name]), pal);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        frames.dead = rowsToCanvas(BODY_DEAD.concat(LEGS.walkA), pal);
        var left = {};
        for (var k in frames)
            left[k] = flipH(frames[k]);
        return {
            right: frames,
            left: left,
            white: { right: silhouette(frames.stand, '#ffffff'), left: silhouette(left.stand, '#ffffff') },
            trail: { right: silhouette(frames.walkA, colorDef.light), left: silhouette(left.walkA, colorDef.light) },
            deadRot: [0, 1, 2, 3].map(function (r) { return rotate90(frames.dead, r); }),
        };
    }
    function hash(x, y, s) {
        var h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
        h = (h ^ (h >>> 13)) * 1274126177;
        return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    }
    var SAND1 = '#d9b56a', SAND2 = '#c9a057', SAND3 = '#e8c983', SAND4 = '#b38a48';
    function px(g, x, y, c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
    function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
    function drawFloor(g, ox, oy, tx, ty, seed) {
        rect(g, ox, oy, TILE, TILE, SAND1);
        var big = hash(Math.floor(tx / 3), Math.floor(ty / 3), seed);
        if (big < 0.25)
            rect(g, ox, oy, TILE, TILE, SAND2);
        for (var i = 0; i < 5; i++) {
            var r = hash(tx * 8 + i, ty * 8 + i * 3, seed);
            var x = Math.floor(r * 8), y = Math.floor(hash(tx + i * 7, ty + i, seed) * 8);
            px(g, ox + x, oy + y, r < 0.5 ? SAND4 : SAND3);
        }
        var d = hash(tx, ty, seed + 1);
        if (d < 0.05) {
            rect(g, ox + 3, oy + 4, 2, 1, '#8a7a66');
            px(g, ox + 3, oy + 3, '#bfb3a3');
        }
        else if (d < 0.09) {
            px(g, ox + 2, oy + 5, '#7d8a35');
            px(g, ox + 3, oy + 4, '#9aa847');
            px(g, ox + 4, oy + 5, '#7d8a35');
        }
        else if (d < 0.11) {
            px(g, ox + 2, oy + 2, SAND4);
            px(g, ox + 5, oy + 5, SAND4);
        }
    }
    function drawWall(g, ox, oy, tx, ty, grid) {
        rect(g, ox, oy, TILE, TILE, '#8d8f99');
        rect(g, ox, oy, TILE, 2, '#b9bcc6');
        rect(g, ox, oy + 6, TILE, 2, '#5d5f6b');
        var brick = (tx + ty) % 2 === 0;
        rect(g, ox + (brick ? 3 : 7), oy + 2, 1, 4, '#6d6f7a');
        rect(g, ox, oy + 4, TILE, 1, '#7a7c86');
        if (hash(tx, ty, 9) < 0.3) {
            px(g, ox + 5, oy + 3, '#5d5f6b');
            px(g, ox + 6, oy + 2, '#5d5f6b');
        }
        var isW = function (x, y) { return y >= 0 && y < ROWS && x >= 0 && x < COLS && grid[y][x] === T.WALL; };
        if (!isW(tx, ty - 1))
            rect(g, ox, oy, TILE, 1, '#1b1b26');
        if (!isW(tx, ty + 1))
            rect(g, ox, oy + 7, TILE, 1, '#1b1b26');
        if (!isW(tx - 1, ty))
            rect(g, ox, oy, 1, TILE, '#1b1b26');
        if (!isW(tx + 1, ty))
            rect(g, ox + 7, oy, 1, TILE, '#1b1b26');
    }
    function drawCrate(g, ox, oy) {
        rect(g, ox, oy, 8, 8, '#1b1b26');
        rect(g, ox + 1, oy + 1, 6, 6, '#c27a3a');
        rect(g, ox + 1, oy + 1, 6, 1, '#e39c55');
        rect(g, ox + 1, oy + 6, 6, 1, '#8a4f22');
        for (var i = 0; i < 6; i++) {
            px(g, ox + 1 + i, oy + 1 + i, '#8a4f22');
            px(g, ox + 6 - i, oy + 1 + i, '#8a4f22');
        }
        px(g, ox + 1, oy + 1, '#ffd08a');
    }
    function drawSand(g, ox, oy, tx, ty) {
        var off = (tx + ty) % 2 ? 0 : 2;
        rect(g, ox, oy + 1, 8, 7, '#1b1b26');
        for (var row = 0; row < 2; row++) {
            var y = oy + 1 + row * 3;
            for (var i = -1; i < 2; i++) {
                var x = ox + i * 4 + (row ? off : (off + 2) % 4);
                if (x + 3 < ox || x > ox + 7)
                    continue;
                var x0 = Math.max(ox, x), x1 = Math.min(ox + 8, x + 4);
                rect(g, x0, y + 1, x1 - x0, 2, '#b89c63');
                rect(g, x0, y, x1 - x0, 1, '#ddc489');
                if (x + 3 < ox + 8 && x + 3 >= ox)
                    px(g, x + 3, y + 1, '#7d6838');
            }
        }
        rect(g, ox, oy + 7, 8, 1, '#7d6838');
    }
    function drawBarrel(g, ox, oy) {
        rect(g, ox + 1, oy, 6, 8, '#1b1b26');
        rect(g, ox + 2, oy + 1, 4, 6, '#d83a2e');
        rect(g, ox + 2, oy + 1, 1, 6, '#ff7a5c');
        rect(g, ox + 5, oy + 1, 1, 6, '#8e1d1d');
        rect(g, ox + 2, oy + 3, 4, 1, '#ffd23b');
        rect(g, ox + 2, oy + 1, 4, 1, '#ff9c80');
    }
    function drawWire(g, ox, oy, tx, ty) {
        drawFloor(g, ox, oy, tx, ty, 7);
        rect(g, ox + 1, oy + 1, 1, 6, '#5a3a22');
        for (var x = 0; x < 8; x++) {
            var y = oy + 3 + Math.round(Math.sin((x + tx * 8) * 1.3) * 2);
            px(g, ox + x, y, '#c9ccd4');
            if (x % 3 === 0) {
                px(g, ox + x, y - 1, '#6b6f7a');
                px(g, ox + x, y + 1, '#6b6f7a');
            }
        }
    }
    function drawWreck(g, ox, oy) {
        rect(g, ox + 1, oy + 2, 22, 13, '#1b1b26');
        rect(g, ox + 2, oy + 3, 20, 11, '#5f5a4a');
        rect(g, ox + 2, oy + 3, 20, 2, '#7e7863');
        rect(g, ox + 2, oy + 11, 20, 3, '#3a3830');
        for (var x = 3; x < 22; x += 3)
            px(g, ox + x, oy + 12, '#6b6f7a');
        rect(g, ox + 7, oy + 4, 9, 6, '#1b1b26');
        rect(g, ox + 8, oy + 5, 7, 4, '#6e6853');
        rect(g, ox + 15, oy + 6, 8, 2, '#1b1b26');
        rect(g, ox + 16, oy + 6, 6, 1, '#7e7863');
        px(g, ox + 4, oy + 6, '#a0522d');
        px(g, ox + 5, oy + 7, '#a0522d');
        px(g, ox + 18, oy + 9, '#a0522d');
        px(g, ox + 10, oy + 6, '#3a3830');
        px(g, ox + 12, oy + 7, '#3a3830');
    }
    function renderMap(map) {
        var e_2, _a;
        var c = makeCanvas(COLS * TILE, ROWS * TILE);
        var g = c.getContext('2d');
        var grid = map.grid;
        for (var y = 0; y < ROWS; y++)
            for (var x = 0; x < COLS; x++)
                drawFloor(g, x * TILE, y * TILE, x, y, map.seed % 1000);
        g.fillStyle = 'rgba(70,40,20,0.35)';
        for (var y = 0; y < ROWS; y++)
            for (var x = 0; x < COLS; x++) {
                var t = grid[y][x];
                if (t === T.FLOOR || t === T.WIRE)
                    continue;
                g.fillRect(x * TILE + 2, y * TILE + 3, TILE, TILE);
            }
        for (var y = 0; y < ROWS; y++)
            for (var x = 0; x < COLS; x++) {
                var t = grid[y][x], ox = x * TILE, oy = y * TILE;
                if (t === T.WALL)
                    drawWall(g, ox, oy, x, y, grid);
                else if (t === T.CRATE)
                    drawCrate(g, ox, oy);
                else if (t === T.SAND)
                    drawSand(g, ox, oy, x, y);
                else if (t === T.BARREL)
                    drawBarrel(g, ox, oy);
                else if (t === T.WIRE)
                    drawWire(g, ox, oy, x, y);
            }
        try {
            for (var _b = __values(map.wrecks), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), x = _d[0], y = _d[1];
                drawWreck(g, x * TILE, y * TILE);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return c;
    }
    function redrawTile(canvas, map, tx, ty) {
        var g = canvas.getContext('2d');
        drawFloor(g, tx * TILE, ty * TILE, tx, ty, map.seed % 1000);
    }
    function scorch(canvas, map, x, y, r) {
        var g = canvas.getContext('2d');
        for (var yy = -r; yy <= r; yy++)
            for (var xx = -r; xx <= r; xx++) {
                var d = Math.hypot(xx, yy * 1.3);
                if (d > r)
                    continue;
                var wx = Math.round(x + xx), wy = Math.round(y + yy);
                var tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
                if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS || map.grid[ty][tx] !== T.FLOOR)
                    continue;
                var n = hash(wx, wy, 3);
                if (n < 1 - d / r) {
                    g.fillStyle = d < r * 0.45 ? '#3a2a1e' : (n < 0.5 ? '#6b4a2e' : '#8a6a42');
                    g.fillRect(wx, wy, 1, 1);
                }
            }
    }
    window.Sprites = { buildSoldier: buildSoldier, renderMap: renderMap, redrawTile: redrawTile, scorch: scorch, SW: SW, SH: SH, makeCanvas: makeCanvas, P: P };
})();

/* ---- js/games/shooter/bots.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
(function () {
    'use strict';
    var TILE = CFG.TILE, COLS = CFG.COLS, ROWS = CFG.ROWS;
    var rand = function (a, b) { return a + Math.random() * (b - a); };
    function bfs(map, sx, sy, gx, gy) {
        var e_1, _a;
        if (sx === gx && sy === gy)
            return [];
        var prev = new Int32Array(COLS * ROWS).fill(-1);
        var start = sy * COLS + sx, goal = gy * COLS + gx;
        prev[start] = start;
        var q = [start];
        for (var qi = 0; qi < q.length; qi++) {
            var cur = q[qi];
            if (cur === goal)
                break;
            var cx = cur % COLS, cy = (cur / COLS) | 0;
            try {
                for (var _b = (e_1 = void 0, __values([[1, 0], [-1, 0], [0, 1], [0, -1]])), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), dx = _d[0], dy = _d[1];
                    var nx = cx + dx, ny = cy + dy;
                    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS)
                        continue;
                    var n = ny * COLS + nx;
                    if (prev[n] !== -1 || MapGen.blocksMove(map.grid[ny][nx]))
                        continue;
                    prev[n] = cur;
                    q.push(n);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        if (prev[goal] === -1)
            return null;
        var path = [];
        for (var c = goal; c !== start; c = prev[c])
            path.push([c % COLS, (c / COLS) | 0]);
        return path.reverse();
    }
    function initBot(s) {
        s.bot = {
            path: [],
            repath: 0,
            seenT: 0,
            aimErr: 0,
            extraCooldown: rand(0.25, 0.4),
            reaction: rand(0.3, 0.5),
            wander: null,
            stuckT: 0,
            lastX: s.x, lastY: s.y,
        };
    }
    function think(game, s, dt) {
        var e_2, _a;
        if (!s.bot)
            initBot(s);
        var b = s.bot;
        var map = game.map;
        var inp = s.input;
        inp.fire = false;
        inp.x = 0;
        inp.y = 0;
        delete inp.aim;
        inp.aimStick = null;
        var target = null, td = 1e9;
        try {
            for (var _b = __values(game.soldiers), _c = _b.next(); !_c.done; _c = _b.next()) {
                var o = _c.value;
                if (o === s || o.dead || o.protectT > 0.5)
                    continue;
                var d = Math.hypot(o.x - s.x, o.y - s.y);
                if (d < 160 && d < td && map.lineOfSight(s.x, s.y - 2, o.x, o.y - 2)) {
                    target = o;
                    td = d;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        if (s.power === 'shield' && target)
            inp.pow = true;
        if (s.power === 'flash' && (!target || td > 110) && Math.random() < dt * 0.6)
            inp.pow = true;
        if (target && s.ammo > 0) {
            b.seenT += dt;
            var want = Math.atan2(target.y - s.y, target.x - s.x);
            if (b.seenT < dt * 1.5)
                b.aimErr = rand(-0.22, 0.22);
            var aim = want + b.aimErr * Math.max(0.3, 1 - b.seenT);
            if (s.power === 'grenade' && td > 35 && td < 85) {
                inp.aimStick = want;
                inp.pow = { a: want, m: Math.min(1, td / 90) };
                return;
            }
            if (td > 100) {
                followPath(game, s, target.x, target.y, dt);
            }
            else {
                inp.aimStick = aim;
                if (b.seenT > b.reaction)
                    inp.fire = true;
                if (Math.sin(game.clock * 2 + s.slot) > 0.75) {
                    var side = want + Math.PI / 2 * (s.slot % 2 ? 1 : -1);
                    inp.x = Math.cos(side) * 0.6;
                    inp.y = Math.sin(side) * 0.6;
                }
            }
            return;
        }
        b.seenT = 0;
        var goal = null;
        if (s.ammo === 0) {
            goal = nearest(s, game.pickups.filter(function (p) { return p.type === 'ammo'; }));
        }
        if (!goal && !s.power) {
            var pw = nearest(s, game.pickups.filter(function (p) { return p.type !== 'ammo'; }));
            if (pw && Math.hypot(pw.x - s.x, pw.y - s.y) < 120)
                goal = pw;
        }
        if (!goal && s.ammo < 4) {
            var am = nearest(s, game.pickups.filter(function (p) { return p.type === 'ammo'; }));
            if (am && Math.hypot(am.x - s.x, am.y - s.y) < 100)
                goal = am;
        }
        if (!goal && s.ammo > 0)
            goal = nearest(s, game.soldiers.filter(function (o) { return o !== s && o.alive; }));
        if (!goal) {
            if (!b.wander || Math.hypot(b.wander.x - s.x, b.wander.y - s.y) < 8) {
                var open = map.openTiles();
                b.wander = open[Math.floor(Math.random() * open.length)];
            }
            goal = b.wander;
        }
        followPath(game, s, goal.x, goal.y, dt);
    }
    function nearest(s, list) {
        var e_3, _a;
        var best = null, bd = 1e9;
        try {
            for (var list_1 = __values(list), list_1_1 = list_1.next(); !list_1_1.done; list_1_1 = list_1.next()) {
                var o = list_1_1.value;
                var d = Math.hypot(o.x - s.x, o.y - s.y);
                if (d < bd) {
                    bd = d;
                    best = o;
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (list_1_1 && !list_1_1.done && (_a = list_1.return)) _a.call(list_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return best;
    }
    function followPath(game, s, gx, gy, dt) {
        var b = s.bot;
        b.repath -= dt;
        var tx = Math.floor(s.x / TILE), ty = Math.floor(s.y / TILE);
        if (b.repath <= 0 || !b.path || !b.path.length) {
            b.repath = rand(0.35, 0.6);
            b.path = bfs(game.map, tx, ty, Math.floor(gx / TILE), Math.floor(gy / TILE)) || [];
        }
        while (b.path.length && b.path[0][0] === tx && b.path[0][1] === ty)
            b.path.shift();
        var wx = gx, wy = gy;
        if (b.path.length) {
            wx = b.path[0][0] * TILE + TILE / 2;
            wy = b.path[0][1] * TILE + TILE / 2;
        }
        var dx = wx - s.x, dy = wy - s.y, d = Math.hypot(dx, dy);
        if (d > 1) {
            s.input.x = dx / d;
            s.input.y = dy / d;
        }
        if (Math.hypot(s.x - b.lastX, s.y - b.lastY) < 0.2)
            b.stuckT += dt;
        else
            b.stuckT = 0;
        b.lastX = s.x;
        b.lastY = s.y;
        if (b.stuckT > 0.4) {
            var a = rand(0, Math.PI * 2);
            s.input.x = Math.cos(a);
            s.input.y = Math.sin(a);
            b.repath = 0;
            if (b.stuckT > 0.8)
                b.stuckT = 0;
        }
    }
    window.Bots = { think: think, bfs: bfs };
})();

/* ---- js/games/shooter/game.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function () {
    'use strict';
    var C = CFG;
    var T = C.T, TILE = C.TILE;
    var rand = function (a, b) { return a + Math.random() * (b - a); };
    var dist = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };
    var Soldier = (function () {
        function Soldier(def) {
            this.slot = def.slot;
            this.name = def.name;
            this.isBot = !!def.isBot;
            this.cid = def.cid || null;
            this.connected = true;
            this.kills = 0;
            this.deaths = 0;
            this.input = { x: 0, y: 0, fire: false, pow: false };
            this.bot = null;
            this.reset();
        }
        Soldier.prototype.reset = function () {
            this.x = 0;
            this.y = 0;
            this.face = 0;
            this.moving = false;
            this.ammo = C.MAX_AMMO;
            this.power = null;
            this.flashT = 0;
            this.shieldT = 0;
            this.shieldHits = 0;
            this.dead = false;
            this.deadT = 0;
            this.respawnT = 0;
            this.protectT = 0;
            this.cooldown = 0;
            this.muzzleT = 0;
            this.walkT = 0;
            this.streak = 0;
            this.z = 0;
            this.vz = 0;
            this.spin = 0;
            this.dvx = 0;
            this.dvy = 0;
            this.trail = [];
            this.emptyShown = 0;
            this.hurtT = 0;
            this.moveFace = undefined;
            this.faceLockT = 0;
            this.faceHist = [];
        };
        Object.defineProperty(Soldier.prototype, "alive", {
            get: function () { return !this.dead; },
            enumerable: false,
            configurable: true
        });
        return Soldier;
    }());
    var Game = (function () {
        function Game(defs, emit) {
            var _this = this;
            this.emit = emit || (function () { });
            this.map = MapGen.generate();
            this.mapCanvas = Sprites.renderMap(this.map);
            this.soldiers = defs.map(function (d) { return new Soldier(d); });
            this.bullets = [];
            this.grenades = [];
            this.pickups = [];
            this.particles = [];
            this.blasts = [];
            this.pending = [];
            this.texts = [];
            this.banner = null;
            this.feed = [];
            this.shake = 0;
            this.flashScreen = 0;
            this.state = 'countdown';
            this.countdown = 3.999;
            this.time = C.MATCH_TIME;
            this.suddenDeath = false;
            this.firstBlood = false;
            this.ammoTimer = 0;
            this.powerTimer = 0;
            this.clock = 0;
            this.winner = null;
            this.lastTick = 4;
            this.soldiers.forEach(function (s, i) {
                var sp = _this.map.spawns[i % 4];
                s.x = sp.x;
                s.y = sp.y;
                s.face = sp.x < C.MAP_W / 2 ? 0 : Math.PI;
                s.protectT = C.SPAWN_PROTECT;
            });
            for (var i = 0; i < 2; i++)
                this.spawnPickup('ammo');
            this.spawnPickup(this.randomPower());
            this.spawnPickup(this.randomPower());
        }
        Game.prototype.randomPower = function () { return C.POWER_TYPES[Math.floor(Math.random() * C.POWER_TYPES.length)]; };
        Game.prototype.update = function (dt) {
            var e_1, _a, e_2, _b, e_3, _c;
            this.clock += dt;
            this.shake = Math.max(0, this.shake - dt * 10);
            this.flashScreen = Math.max(0, this.flashScreen - dt * 4);
            if (this.state === 'countdown') {
                this.countdown -= dt;
                var n = Math.ceil(this.countdown);
                if (n !== this.lastTick && n >= 1 && n <= 3) {
                    this.lastTick = n;
                    this.emit('sfx', 'beep');
                }
                if (this.countdown <= 0) {
                    this.state = 'play';
                    this.showBanner('MISSION START!', '#ffd23b', 1.6);
                    this.emit('sfx', 'go');
                    this.emit('sfx', 'start_jingle');
                    this.emit('announce', 'Mission start!');
                    this.emit('music', true);
                }
                try {
                    for (var _d = __values(this.soldiers), _e = _d.next(); !_e.done; _e = _d.next()) {
                        var s = _e.value;
                        if (s.isBot)
                            continue;
                        if (Math.hypot(s.input.x, s.input.y) > 0.3)
                            s.face = Math.atan2(s.input.y, s.input.x);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            else if (this.state === 'play') {
                var before = Math.ceil(this.time);
                this.time = Math.max(0, this.time - dt);
                var after = Math.ceil(this.time);
                if (before !== after) {
                    if (after === 60) {
                        this.showBanner('ULTIMO MINUTO!', '#ff9c3b', 1.4);
                        this.emit('announce', 'One minute left!');
                    }
                    if (after === 30) {
                        this.showBanner('30 SECONDI!', '#ff9c3b', 1.4);
                        this.emit('announce', 'Thirty seconds!');
                    }
                    if (after <= 5 && after > 0)
                        this.emit('sfx', 'tick');
                }
                try {
                    for (var _f = __values(this.soldiers), _g = _f.next(); !_g.done; _g = _f.next()) {
                        var s = _g.value;
                        if (s.isBot && s.alive)
                            Bots.think(this, s, dt);
                        this.updateSoldier(s, dt);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                this.separateSoldiers();
                this.updatePickups(dt);
                if (this.time <= 0 && this.state === 'play')
                    this.checkTimeUp();
            }
            if (this.state !== 'countdown') {
                this.updateBullets(dt);
                this.updateGrenades(dt);
            }
            if (this.state === 'over')
                try {
                    for (var _h = __values(this.soldiers), _j = _h.next(); !_j.done; _j = _h.next()) {
                        var s = _j.value;
                        this.updateDeath(s, dt);
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (_j && !_j.done && (_c = _h.return)) _c.call(_h);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            this.updatePending(dt);
            this.updateParticles(dt);
            this.updateTexts(dt);
        };
        Game.prototype.updateSoldier = function (s, dt) {
            var e_4, _a, e_5, _b;
            s.hurtT = Math.max(0, s.hurtT - dt);
            if (s.dead) {
                this.updateDeath(s, dt);
                s.respawnT -= dt;
                if (s.respawnT <= 0)
                    this.respawn(s);
                return;
            }
            s.protectT = Math.max(0, s.protectT - dt);
            s.cooldown -= dt;
            s.muzzleT = Math.max(0, s.muzzleT - dt);
            s.emptyShown = Math.max(0, s.emptyShown - dt);
            if (s.flashT > 0)
                s.flashT = Math.max(0, s.flashT - dt);
            if (s.shieldT > 0) {
                s.shieldT = Math.max(0, s.shieldT - dt);
                if (s.shieldT === 0)
                    s.shieldHits = 0;
            }
            var inp = s.connected || s.isBot ? s.input : { x: 0, y: 0, fire: false, pow: false };
            s.faceLockT = Math.max(0, (s.faceLockT || 0) - dt);
            var mag = Math.hypot(inp.x, inp.y);
            var wasMoving = s.moving;
            s.moving = mag > C.STICK_DEADZONE;
            if (s.moving) {
                var ang = Math.atan2(inp.y, inp.x);
                var k = Math.min(1, (mag - C.STICK_DEADZONE) / (C.STICK_FULL - C.STICK_DEADZONE));
                var sp = C.SPEED * (0.5 + 0.5 * k) * (s.flashT > 0 ? C.FLASH_MULT : 1);
                this.moveSoldier(s, Math.cos(ang) * sp * dt, Math.sin(ang) * sp * dt);
                s.walkT += dt * (s.flashT > 0 ? 1.8 : 1);
                s.faceHist = s.faceHist || [];
                s.faceHist.push({ t: this.clock, a: ang });
                while (s.faceHist.length && this.clock - s.faceHist[0].t > 0.15)
                    s.faceHist.shift();
                s.moveFace = ang;
            }
            else if (wasMoving && s.faceHist && s.faceHist.length) {
                s.moveFace = s.faceHist[0].a;
                s.faceHist = [];
            }
            if (inp.aimStick != null)
                s.face = inp.aimStick;
            else if (inp.powStick != null)
                s.face = inp.powStick;
            else if (inp.aim !== undefined && !s.moving)
                s.face = inp.aim;
            else if (s.faceLockT <= 0 && s.moveFace !== undefined)
                s.face = s.moveFace;
            if (s.flashT > 0) {
                s.trail.push({ x: s.x, y: s.y, left: Math.cos(s.face) < 0, life: 0.25 });
            }
            try {
                for (var _c = __values(s.trail), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var t = _d.value;
                    t.life -= dt;
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_4) throw e_4.error; }
            }
            s.trail = s.trail.filter(function (t) { return t.life > 0; });
            if (inp.shot && s.cooldown <= 0) {
                var a = inp.shot.a != null ? inp.shot.a : this.autoAim(s);
                if (a != null) {
                    s.face = a;
                    s.faceLockT = 0.35;
                }
                inp.shot = null;
                this.shoot(s);
            }
            else if ((inp.fire || inp.fireTap) && s.cooldown <= 0) {
                inp.fireTap = false;
                if (!s.isBot && inp.aimStick == null) {
                    var a = this.autoAim(s);
                    if (a != null) {
                        s.face = a;
                        s.faceLockT = 0.35;
                    }
                }
                this.shoot(s);
            }
            if (inp.pow) {
                var p = inp.pow;
                inp.pow = false;
                if (typeof p === 'object' && p.a != null) {
                    s.face = p.a;
                    s.faceLockT = 0.35;
                }
                this.usePower(s, typeof p === 'object' ? p.m : null);
            }
            try {
                for (var _e = __values(this.pickups), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var p = _f.value;
                    if (p.dead || Math.hypot(p.x - s.x, p.y - s.y) > 8)
                        continue;
                    if (p.type === 'ammo') {
                        if (s.ammo >= C.MAX_AMMO)
                            continue;
                        s.ammo = C.MAX_AMMO;
                        p.dead = true;
                        this.floatText(s.x, s.y - 20, '+10', '#ffd23b');
                        this.emit('sfx', 'pickup_ammo');
                        this.emit('buzz', { s: s, pattern: [40] });
                    }
                    else {
                        if (s.power)
                            continue;
                        s.power = p.type;
                        p.dead = true;
                        var label = { flash: 'FLASH!', grenade: 'GRANATA!', shield: 'SCUDO!' }[p.type];
                        this.floatText(s.x, s.y - 20, label, '#5ff2ff');
                        this.emit('sfx', 'pickup_power');
                        this.emit('buzz', { s: s, pattern: [30, 40, 30] });
                    }
                    this.sparkle(p.x, p.y, p.type === 'ammo' ? '#ffd23b' : '#5ff2ff');
                    this.emit('hud', s);
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                }
                finally { if (e_5) throw e_5.error; }
            }
        };
        Game.prototype.collides = function (x, y) {
            var h = C.HALF, m = this.map;
            return m.solidMove(x - h, y - h) || m.solidMove(x + h - 0.01, y - h) ||
                m.solidMove(x - h, y + h - 0.01) || m.solidMove(x + h - 0.01, y + h - 0.01);
        };
        Game.prototype.moveSoldier = function (s, dx, dy) {
            var e_6, _a, e_7, _b;
            if (!this.collides(s.x + dx, s.y))
                s.x += dx;
            else if (Math.abs(dx) > 0.01 && Math.abs(dy) < Math.abs(dx) * 0.7) {
                try {
                    for (var _c = __values([1, -1, 2, -2, 3, -3, 4, -4]), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var n = _d.value;
                        if (!this.collides(s.x + dx, s.y + n)) {
                            if (!this.collides(s.x, s.y + Math.sign(n) * Math.abs(dx)))
                                s.y += Math.sign(n) * Math.abs(dx);
                            break;
                        }
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    }
                    finally { if (e_6) throw e_6.error; }
                }
            }
            if (!this.collides(s.x, s.y + dy))
                s.y += dy;
            else if (Math.abs(dy) > 0.01 && Math.abs(dx) < Math.abs(dy) * 0.7) {
                try {
                    for (var _e = __values([1, -1, 2, -2, 3, -3, 4, -4]), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var n = _f.value;
                        if (!this.collides(s.x + n, s.y + dy)) {
                            if (!this.collides(s.x + Math.sign(n) * Math.abs(dy), s.y))
                                s.x += Math.sign(n) * Math.abs(dy);
                            break;
                        }
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
            }
        };
        Game.prototype.separateSoldiers = function () {
            var list = this.soldiers.filter(function (s) { return s.alive; });
            for (var i = 0; i < list.length; i++)
                for (var j = i + 1; j < list.length; j++) {
                    var a = list[i], b = list[j];
                    var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
                    if (d > 0.01 && d < 7) {
                        var push = (7 - d) / 2, nx = dx / d, ny = dy / d;
                        this.moveSoldier(a, -nx * push, -ny * push);
                        this.moveSoldier(b, nx * push, ny * push);
                    }
                }
        };
        Game.prototype.autoAim = function (s) {
            var e_8, _a;
            var best = null, bd = C.AUTO_AIM_RANGE;
            try {
                for (var _b = __values(this.soldiers), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var o = _c.value;
                    if (o === s || o.dead || o.protectT > 0)
                        continue;
                    var d = Math.hypot(o.x - s.x, o.y - s.y);
                    if (d < bd && this.map.lineOfSight(s.x, s.y - 2, o.x, o.y - 2)) {
                        bd = d;
                        best = o;
                    }
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_8) throw e_8.error; }
            }
            if (!best)
                return null;
            var lead = bd / C.BULLET_SPEED;
            var vx = best.moving ? Math.cos(best.moveFace || 0) * C.SPEED * 0.5 : 0;
            var vy = best.moving ? Math.sin(best.moveFace || 0) * C.SPEED * 0.5 : 0;
            return Math.atan2(best.y + vy * lead - s.y, best.x + vx * lead - s.x);
        };
        Game.prototype.shoot = function (s) {
            if (s.ammo <= 0) {
                s.cooldown = 0.45;
                if (s.emptyShown <= 0) {
                    this.floatText(s.x, s.y - 22, 'NO AMMO', '#ff5a5a');
                    s.emptyShown = 1.2;
                    this.emit('buzz', { s: s, pattern: [15, 30, 15] });
                }
                this.emit('sfx', 'empty');
                return;
            }
            s.ammo--;
            s.cooldown = C.FIRE_COOLDOWN + (s.isBot ? s.bot.extraCooldown : 0);
            s.muzzleT = 0.07;
            var cx = Math.cos(s.face), cy = Math.sin(s.face);
            var sx = s.x + cx * 7, sy = s.y + cy * 7;
            if (this.map.lineOfSight(s.x, s.y, sx, sy) && !this.map.solidShot(sx, sy)) {
                this.bullets.push({ x: sx, y: sy, vx: cx * C.BULLET_SPEED, vy: cy * C.BULLET_SPEED, owner: s, life: C.BULLET_LIFE });
            }
            else {
                this.sparks(sx, sy, 4, '#fff1a0');
                this.hitTile(sx, sy, s);
            }
            this.particles.push({
                kind: 'casing', x: s.x, y: s.y, z: 9, vx: -cy * rand(20, 40) - cx * 10, vy: cx * rand(20, 40) * 0.6 - cy * 10, vz: rand(50, 80),
                life: 1.2, max: 1.2, color: '#ffd23b', g: 260, bounce: 0.4,
            });
            this.emit('sfx', 'shot');
            this.emit('hud', s);
        };
        Game.prototype.usePower = function (s, throwMag) {
            if (!s.power || s.dead)
                return;
            var p = s.power;
            s.power = null;
            if (p === 'flash') {
                s.flashT = C.FLASH_TIME;
                this.emit('sfx', 'flash');
                this.floatText(s.x, s.y - 22, 'FLASH!', '#ffe14a');
            }
            else if (p === 'shield') {
                s.shieldT = C.SHIELD_TIME;
                s.shieldHits = 1;
                this.emit('sfx', 'shield');
                this.floatText(s.x, s.y - 22, 'SCUDO!', '#5ff2ff');
            }
            else if (p === 'grenade') {
                this.grenades.push(this.newGrenade(s, s.face, throwMag));
                this.emit('sfx', 'throw');
            }
            this.emit('hud', s);
        };
        Game.prototype.hit = function (victim, attacker, cause) {
            if (victim.dead || victim.protectT > 0 || this.state !== 'play')
                return false;
            if (victim.shieldT > 0 && victim.shieldHits > 0) {
                victim.shieldHits = 0;
                victim.shieldT = 0;
                victim.hurtT = 0.3;
                this.sparks(victim.x, victim.y - 6, 14, '#5ff2ff');
                this.floatText(victim.x, victim.y - 22, 'SCUDO ROTTO!', '#5ff2ff');
                this.emit('sfx', 'hit_shield');
                this.emit('buzz', { s: victim, pattern: [80] });
                this.emit('hud', victim);
                return true;
            }
            victim.dead = true;
            victim.deadT = 0;
            victim.respawnT = C.RESPAWN_TIME;
            victim.deaths++;
            victim.streak = 0;
            victim.power = null;
            victim.flashT = 0;
            victim.shieldT = 0;
            victim.shieldHits = 0;
            victim.trail = [];
            victim.z = 0;
            victim.vz = 170;
            var away = attacker && attacker !== victim ? Math.atan2(victim.y - attacker.y, victim.x - attacker.x) : rand(0, Math.PI * 2);
            victim.dvx = Math.cos(away) * 30;
            victim.dvy = Math.sin(away) * 30;
            victim.spin = 0;
            this.stars(victim.x, victim.y - 8);
            this.shake = Math.max(this.shake, 2);
            this.emit('sfx', 'death');
            this.emit('buzz', { s: victim, pattern: [200, 60, 120] });
            if (attacker && attacker !== victim) {
                attacker.kills++;
                attacker.streak++;
                if (!this.firstBlood) {
                    this.firstBlood = true;
                    this.showBanner('FIRST BLOOD!', '#ff3b3b', 1.3);
                    this.emit('announce', 'First blood!');
                }
                else if (attacker.streak === 3) {
                    this.showBanner('GREAT!', C.PLAYERS[attacker.slot].color, 1.2);
                    this.emit('announce', 'Great!');
                }
                else if (attacker.streak === 5) {
                    this.showBanner('EXCELLENT!', C.PLAYERS[attacker.slot].color, 1.3);
                    this.emit('announce', 'Excellent!');
                }
                else if (attacker.streak >= 7 && attacker.streak % 2 === 1) {
                    this.showBanner('INARRESTABILE!', C.PLAYERS[attacker.slot].color, 1.3);
                    this.emit('announce', 'Unstoppable!');
                }
                this.floatText(attacker.x, attacker.y - 22, '+1', C.PLAYERS[attacker.slot].light);
                this.feed.unshift({ a: attacker.slot, an: attacker.name, v: victim.slot, vn: victim.name, cause: cause, t: 4 });
                this.emit('buzz', { s: attacker, pattern: [30] });
                this.emit('hud', attacker);
            }
            else {
                victim.kills = Math.max(0, victim.kills - 1);
                this.feed.unshift({ a: victim.slot, an: victim.name, v: victim.slot, vn: victim.name, cause: 'self', t: 4 });
                this.floatText(victim.x, victim.y - 22, 'OOPS! -1', '#ffffff');
            }
            if (this.feed.length > 4)
                this.feed.length = 4;
            this.emit('hud', victim);
            if (this.suddenDeath)
                this.checkTimeUp();
            return true;
        };
        Game.prototype.updateDeath = function (s, dt) {
            if (!s.dead)
                return;
            s.deadT += dt;
            if (s.z > 0 || s.vz > 0) {
                s.vz -= 420 * dt;
                s.z += s.vz * dt;
                s.spin += dt * 14;
                var nx = s.x + s.dvx * dt, ny = s.y + s.dvy * dt;
                if (!this.collides(nx, s.y))
                    s.x = nx;
                if (!this.collides(s.x, ny))
                    s.y = ny;
                if (s.z <= 0) {
                    s.z = 0;
                    if (s.vz < -60) {
                        s.vz = -s.vz * 0.35;
                        this.dust(s.x, s.y);
                    }
                    else {
                        s.vz = 0;
                    }
                }
            }
        };
        Game.prototype.respawn = function (s) {
            var pt = this.farPoint(s);
            var kills = s.kills, deaths = s.deaths, streak = 0;
            var input = s.input, bot = s.bot, connected = s.connected;
            s.reset();
            Object.assign(s, { kills: kills, deaths: deaths, streak: streak, input: input, bot: bot, connected: connected, x: pt.x, y: pt.y });
            s.face = pt.x < C.MAP_W / 2 ? 0 : Math.PI;
            s.protectT = C.SPAWN_PROTECT;
            this.sparkle(s.x, s.y - 6, C.PLAYERS[s.slot].color);
            this.emit('sfx', 'respawn');
            this.emit('hud', s);
        };
        Game.prototype.farPoint = function (self) {
            var e_9, _a, e_10, _b;
            var open = this.map.openTiles();
            var enemies = this.soldiers.filter(function (o) { return o !== self && o.alive; });
            var best = open[0], bestScore = -1;
            for (var i = 0; i < 70; i++) {
                var p = open[Math.floor(Math.random() * open.length)];
                if (this.collides(p.x, p.y))
                    continue;
                var d = 1000;
                try {
                    for (var enemies_1 = (e_9 = void 0, __values(enemies)), enemies_1_1 = enemies_1.next(); !enemies_1_1.done; enemies_1_1 = enemies_1.next()) {
                        var e = enemies_1_1.value;
                        d = Math.min(d, Math.hypot(e.x - p.x, e.y - p.y));
                    }
                }
                catch (e_9_1) { e_9 = { error: e_9_1 }; }
                finally {
                    try {
                        if (enemies_1_1 && !enemies_1_1.done && (_a = enemies_1.return)) _a.call(enemies_1);
                    }
                    finally { if (e_9) throw e_9.error; }
                }
                try {
                    for (var _c = (e_10 = void 0, __values(this.grenades)), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var g = _d.value;
                        d = Math.min(d, Math.hypot(g.x - p.x, g.y - p.y) + 20);
                    }
                }
                catch (e_10_1) { e_10 = { error: e_10_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                    }
                    finally { if (e_10) throw e_10.error; }
                }
                if (d > bestScore) {
                    bestScore = d;
                    best = p;
                }
            }
            return best;
        };
        Game.prototype.updateBullets = function (dt) {
            var e_11, _a, e_12, _b;
            try {
                for (var _c = __values(this.bullets), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var b = _d.value;
                    b.life -= dt;
                    var steps = Math.ceil((Math.hypot(b.vx, b.vy) * dt) / 2);
                    for (var i = 0; i < steps && b.life > 0; i++) {
                        b.x += (b.vx * dt) / steps;
                        b.y += (b.vy * dt) / steps;
                        if (this.map.solidShot(b.x, b.y)) {
                            b.life = 0;
                            this.sparks(b.x - b.vx * 0.01, b.y - b.vy * 0.01, 5, '#fff1a0');
                            this.hitTile(b.x, b.y, b.owner);
                            break;
                        }
                        try {
                            for (var _e = (e_12 = void 0, __values(this.soldiers)), _f = _e.next(); !_f.done; _f = _e.next()) {
                                var s = _f.value;
                                if (s === b.owner || s.dead)
                                    continue;
                                if (Math.hypot(s.x - b.x, s.y - 2 - b.y) < C.HIT_R) {
                                    if (s.protectT > 0) {
                                        b.life = 0;
                                        this.sparks(b.x, b.y, 3, '#ffffff');
                                        break;
                                    }
                                    if (this.hit(s, b.owner, 'gun')) {
                                        b.life = 0;
                                        break;
                                    }
                                }
                            }
                        }
                        catch (e_12_1) { e_12 = { error: e_12_1 }; }
                        finally {
                            try {
                                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                            }
                            finally { if (e_12) throw e_12.error; }
                        }
                    }
                }
            }
            catch (e_11_1) { e_11 = { error: e_11_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_11) throw e_11.error; }
            }
            this.bullets = this.bullets.filter(function (b) { return b.life > 0; });
        };
        Game.prototype.hitTile = function (x, y, owner) {
            var tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
            if (this.map.grid[ty] && this.map.grid[ty][tx] === T.BARREL)
                this.explodeBarrel(tx, ty, owner, 0);
        };
        Game.prototype.explodeBarrel = function (tx, ty, owner, delay) {
            if (this.map.grid[ty][tx] !== T.BARREL)
                return;
            this.map.grid[ty][tx] = T.FLOOR;
            Sprites.redrawTile(this.mapCanvas, this.map, tx, ty);
            this.pending.push({ x: tx * TILE + 4, y: ty * TILE + 4, r: C.BARREL_R, owner: owner, delay: delay, kind: 'barrel' });
        };
        Game.prototype.updateGrenades = function (dt) {
            var e_13, _a, e_14, _b;
            try {
                for (var _c = __values(this.grenades), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var g = _d.value;
                    g.t += dt;
                    g.spin += dt * 15;
                    var r = this.stepGrenade(g, dt);
                    if (r.bounced)
                        this.emit('sfx', 'bounce');
                    var boom = g.t >= C.GRENADE_FUSE;
                    if (r.wall) {
                        boom = true;
                        this.hitTile(r.wx, r.wy, g.owner);
                    }
                    try {
                        for (var _e = (e_14 = void 0, __values(this.soldiers)), _f = _e.next(); !_f.done; _f = _e.next()) {
                            var s = _f.value;
                            if (s.dead || (s === g.owner && g.t < 0.4))
                                continue;
                            if (Math.hypot(s.x - g.x, s.y - 2 - g.y) < 6 && g.z < 12)
                                boom = true;
                        }
                    }
                    catch (e_14_1) { e_14 = { error: e_14_1 }; }
                    finally {
                        try {
                            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                        }
                        finally { if (e_14) throw e_14.error; }
                    }
                    if (boom) {
                        g.done = true;
                        this.explode(g.x, g.y, C.BLAST_R, g.owner, 'grenade');
                    }
                }
            }
            catch (e_13_1) { e_13 = { error: e_13_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_13) throw e_13.error; }
            }
            this.grenades = this.grenades.filter(function (g) { return !g.done; });
        };
        Game.prototype.stepGrenade = function (g, dt) {
            var out = { bounced: false, wall: false };
            g.vz -= 300 * dt;
            g.z += g.vz * dt;
            if (g.z <= 0) {
                g.z = 0;
                if (g.vz < -25) {
                    g.vz = -g.vz * 0.45;
                    out.bounced = true;
                }
                else
                    g.vz = 0;
                g.vx *= 0.9;
                g.vy *= 0.9;
            }
            var f = Math.pow(0.4, dt);
            g.vx *= f;
            g.vy *= f;
            var nx = g.x + g.vx * dt, ny = g.y + g.vy * dt;
            if (this.map.solidShot(nx, ny)) {
                out.wall = true;
                out.wx = nx;
                out.wy = ny;
            }
            else {
                g.x = nx;
                g.y = ny;
            }
            return out;
        };
        Game.prototype.newGrenade = function (s, angle, m) {
            var cx = Math.cos(angle), cy = Math.sin(angle);
            var sp = C.GRENADE_SPEED * (m == null ? 1 : 0.35 + 0.65 * Math.max(0, Math.min(1, m)));
            return { x: s.x + cx * 4, y: s.y + cy * 4, z: 8, vx: cx * sp, vy: cy * sp, vz: 70, t: 0, owner: s, spin: 0 };
        };
        Game.prototype.predictGrenade = function (s, angle, m) {
            var g = this.newGrenade(s, angle, m);
            var pts = [];
            var dt = 1 / 30;
            for (var t = 0; t < C.GRENADE_FUSE; t += dt) {
                g.t = t;
                if (this.stepGrenade(g, dt).wall)
                    break;
                pts.push({ x: g.x, y: g.y, z: g.z });
            }
            return pts;
        };
        Game.prototype.updatePending = function (dt) {
            var e_15, _a;
            try {
                for (var _b = __values(this.pending), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var p = _c.value;
                    p.delay -= dt;
                    if (p.delay <= 0) {
                        p.done = true;
                        this.explode(p.x, p.y, p.r, p.owner, p.kind);
                    }
                }
            }
            catch (e_15_1) { e_15 = { error: e_15_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_15) throw e_15.error; }
            }
            this.pending = this.pending.filter(function (p) { return !p.done; });
        };
        Game.prototype.explode = function (x, y, r, owner, kind) {
            var e_16, _a;
            this.blasts.push({ x: x, y: y, r: r, t: 0, max: 0.55 });
            this.shake = Math.max(this.shake, kind === 'grenade' ? 5 : 4);
            this.flashScreen = 0.6;
            this.emit('sfx', 'explosion');
            this.emit('boom');
            Sprites.scorch(this.mapCanvas, this.map, x, y, Math.round(r * 0.55));
            for (var i = 0; i < 26; i++) {
                var a = rand(0, Math.PI * 2), sp = rand(10, 55);
                this.particles.push({
                    kind: 'smoke', x: x + Math.cos(a) * rand(0, r * 0.4), y: y + Math.sin(a) * rand(0, r * 0.3), z: rand(0, 8),
                    vx: Math.cos(a) * sp * 0.4, vy: Math.sin(a) * sp * 0.3, vz: rand(8, 30), life: rand(0.7, 1.6), max: 1.6,
                    size: rand(2, 5), g: -5,
                });
            }
            for (var i = 0; i < 22; i++) {
                var a = rand(0, Math.PI * 2), sp = rand(40, 130);
                this.particles.push({
                    kind: 'debris',
                    x: x,
                    y: y,
                    z: 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, vz: rand(60, 170),
                    life: rand(0.6, 1.2), max: 1.2, color: ['#5a3a22', '#86703c', '#3a3830', '#c27a3a', '#1b1b26'][i % 5], g: 380, bounce: 0.3,
                });
            }
            for (var i = 0; i < 16; i++) {
                var a = rand(0, Math.PI * 2), sp = rand(60, 150);
                this.particles.push({
                    kind: 'spark',
                    x: x,
                    y: y,
                    z: 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, vz: rand(20, 90),
                    life: rand(0.2, 0.5), max: 0.5, color: i % 2 ? '#ffd23b' : '#ffffff', g: 200,
                });
            }
            try {
                for (var _b = __values(this.soldiers), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var s = _c.value;
                    if (s.dead)
                        continue;
                    if (Math.hypot(s.x - x, s.y - 3 - y) < r)
                        this.hit(s, owner, kind);
                }
            }
            catch (e_16_1) { e_16 = { error: e_16_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_16) throw e_16.error; }
            }
            var tr = Math.ceil(r / TILE);
            var cx = Math.floor(x / TILE), cy = Math.floor(y / TILE);
            for (var ty = cy - tr; ty <= cy + tr; ty++)
                for (var tx = cx - tr; tx <= cx + tr; tx++) {
                    if (!this.map.grid[ty] || this.map.grid[ty][tx] !== T.BARREL)
                        continue;
                    if (Math.hypot(tx * TILE + 4 - x, ty * TILE + 4 - y) < r)
                        this.explodeBarrel(tx, ty, owner, 0.15);
                }
        };
        Game.prototype.updatePickups = function (dt) {
            var e_17, _a;
            try {
                for (var _b = __values(this.pickups), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var p = _c.value;
                    p.t += dt;
                }
            }
            catch (e_17_1) { e_17 = { error: e_17_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_17) throw e_17.error; }
            }
            this.pickups = this.pickups.filter(function (p) { return !p.dead; });
            var ammoCount = this.pickups.filter(function (p) { return p.type === 'ammo'; }).length;
            var powCount = this.pickups.length - ammoCount;
            this.ammoTimer += dt;
            this.powerTimer += dt;
            if (ammoCount < C.AMMO_MAX_ON_MAP && this.ammoTimer >= C.AMMO_RESPAWN) {
                this.ammoTimer = 0;
                this.spawnPickup('ammo');
            }
            if (ammoCount >= C.AMMO_MAX_ON_MAP)
                this.ammoTimer = 0;
            if (powCount < C.POWER_MAX_ON_MAP && this.powerTimer >= C.POWER_RESPAWN) {
                this.powerTimer = 0;
                this.spawnPickup(this.randomPower());
            }
            if (powCount >= C.POWER_MAX_ON_MAP)
                this.powerTimer = 0;
        };
        Game.prototype.spawnPickup = function (type) {
            var open = this.map.openTiles();
            var _loop_1 = function (i) {
                var p = open[Math.floor(Math.random() * open.length)];
                if (this_1.collides(p.x, p.y))
                    return "continue";
                if (this_1.soldiers.some(function (s) { return s.alive && Math.hypot(s.x - p.x, s.y - p.y) < 40; }))
                    return "continue";
                if (this_1.pickups.some(function (q) { return Math.hypot(q.x - p.x, q.y - p.y) < 50; }))
                    return "continue";
                this_1.pickups.push({ x: p.x, y: p.y, type: type, t: 0 });
                this_1.sparkle(p.x, p.y, '#ffffff');
                return { value: void 0 };
            };
            var this_1 = this;
            for (var i = 0; i < 60; i++) {
                var state_1 = _loop_1(i);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
        };
        Game.prototype.checkTimeUp = function () {
            if (this.time > 0)
                return;
            var ranked = this.ranking();
            if (ranked.length < 2 || ranked[0].kills > ranked[1].kills) {
                this.endMatch(ranked[0]);
            }
            else if (!this.suddenDeath) {
                this.suddenDeath = true;
                this.showBanner('SUDDEN DEATH!', '#ff3b3b', 2);
                this.emit('announce', 'Sudden death!');
            }
        };
        Game.prototype.ranking = function () {
            return this.soldiers.slice().sort(function (a, b) { return b.kills - a.kills || a.deaths - b.deaths || a.slot - b.slot; });
        };
        Game.prototype.endMatch = function (winner) {
            var e_18, _a;
            if (this.state === 'over')
                return;
            this.state = 'over';
            this.winner = winner;
            this.bullets = [];
            try {
                for (var _b = __values(this.soldiers), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var s = _c.value;
                    s.input.fire = false;
                }
            }
            catch (e_18_1) { e_18 = { error: e_18_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_18) throw e_18.error; }
            }
            this.showBanner(this.time <= 0 ? 'TIME UP!' : 'MISSION COMPLETE!', '#ffd23b', 1.5);
            this.emit('music', false);
            this.emit('over', winner);
        };
        Game.prototype.showBanner = function (text, color, dur) { this.banner = { text: text, color: color, t: 0, dur: dur || 1.4 }; };
        Game.prototype.floatText = function (x, y, text, color) { this.texts.push({ x: x, y: y, text: text, color: color, t: 0, dur: 0.9 }); };
        Game.prototype.updateTexts = function (dt) {
            var e_19, _a, e_20, _b, e_21, _c;
            try {
                for (var _d = __values(this.texts), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var t = _e.value;
                    t.t += dt;
                    t.y -= dt * 14;
                }
            }
            catch (e_19_1) { e_19 = { error: e_19_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                }
                finally { if (e_19) throw e_19.error; }
            }
            this.texts = this.texts.filter(function (t) { return t.t < t.dur; });
            if (this.banner) {
                this.banner.t += dt;
                if (this.banner.t > this.banner.dur)
                    this.banner = null;
            }
            try {
                for (var _f = __values(this.feed), _g = _f.next(); !_g.done; _g = _f.next()) {
                    var f = _g.value;
                    f.t -= dt;
                }
            }
            catch (e_20_1) { e_20 = { error: e_20_1 }; }
            finally {
                try {
                    if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                }
                finally { if (e_20) throw e_20.error; }
            }
            this.feed = this.feed.filter(function (f) { return f.t > 0; });
            try {
                for (var _h = __values(this.blasts), _j = _h.next(); !_j.done; _j = _h.next()) {
                    var b = _j.value;
                    b.t += dt;
                }
            }
            catch (e_21_1) { e_21 = { error: e_21_1 }; }
            finally {
                try {
                    if (_j && !_j.done && (_c = _h.return)) _c.call(_h);
                }
                finally { if (e_21) throw e_21.error; }
            }
            this.blasts = this.blasts.filter(function (b) { return b.t < b.max; });
        };
        Game.prototype.sparks = function (x, y, n, color) {
            for (var i = 0; i < n; i++) {
                var a = rand(0, Math.PI * 2), sp = rand(30, 90);
                this.particles.push({ kind: 'spark', x: x, y: y, z: 7, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rand(10, 60), life: rand(0.1, 0.3), max: 0.3, color: color, g: 200 });
            }
        };
        Game.prototype.sparkle = function (x, y, color) {
            for (var i = 0; i < 10; i++) {
                var a = (i / 10) * Math.PI * 2;
                this.particles.push({ kind: 'spark', x: x, y: y, z: 4, vx: Math.cos(a) * 40, vy: Math.sin(a) * 30, vz: 30, life: 0.4, max: 0.4, color: color, g: 60 });
            }
        };
        Game.prototype.stars = function (x, y) {
            for (var i = 0; i < 8; i++) {
                var a = (i / 8) * Math.PI * 2;
                this.particles.push({ kind: 'star', x: x, y: y, z: 8, vx: Math.cos(a) * 55, vy: Math.sin(a) * 40, vz: 40, life: 0.6, max: 0.6, color: i % 2 ? '#ffffff' : '#ffd23b', g: 120 });
            }
        };
        Game.prototype.dust = function (x, y) {
            for (var i = 0; i < 6; i++) {
                this.particles.push({ kind: 'smoke', x: x + rand(-4, 4), y: y, z: 0, vx: rand(-15, 15), vy: rand(-4, 4), vz: rand(5, 15), life: 0.5, max: 0.6, size: 2, g: 0, dusty: true });
            }
        };
        Game.prototype.updateParticles = function (dt) {
            var e_22, _a;
            try {
                for (var _b = __values(this.particles), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var p = _c.value;
                    p.life -= dt;
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.vz -= (p.g || 0) * dt;
                    p.z += p.vz * dt;
                    if (p.z < 0) {
                        p.z = 0;
                        if (p.bounce) {
                            p.vz = -p.vz * p.bounce;
                            p.vx *= 0.6;
                            p.vy *= 0.6;
                        }
                        else {
                            p.vz = 0;
                            p.vx *= 0.8;
                            p.vy *= 0.8;
                        }
                    }
                    if (p.kind === 'smoke') {
                        p.vx *= 0.97;
                        p.vy *= 0.97;
                    }
                }
            }
            catch (e_22_1) { e_22 = { error: e_22_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_22) throw e_22.error; }
            }
            this.particles = this.particles.filter(function (p) { return p.life > 0; });
            if (this.particles.length > 600)
                this.particles.splice(0, this.particles.length - 600);
        };
        return Game;
    }());
    window.Game = Game;
})();

/* ---- js/games/shooter/render.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
(function () {
    'use strict';
    var C = CFG;
    var W = C.W, H = C.H, HUD_TOP = C.HUD_TOP, TILE = C.TILE;
    var K = '#1b1b26';
    var ctx = null;
    var soldierArt = [];
    function init(canvas) {
        canvas.width = W;
        canvas.height = H;
        ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        for (var i = 0; i < 4; i++)
            soldierArt[i] = Sprites.buildSoldier(C.PLAYERS[i]);
    }
    var R = Math.round;
    function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(R(x), R(y), w, h); }
    function px(x, y, c) { ctx.fillStyle = c; ctx.fillRect(R(x), R(y), 1, 1); }
    function disc(cx, cy, r, c, squash) {
        ctx.fillStyle = c;
        cx = R(cx);
        cy = R(cy);
        var sq = squash || 1;
        var ry = Math.max(1, Math.round(r * sq));
        for (var dy = -ry; dy <= ry; dy++) {
            var w = Math.round(Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))) * r);
            ctx.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
        }
    }
    function ring(cx, cy, r, c, c2) {
        cx = R(cx);
        cy = R(cy);
        var n = Math.ceil(r * 7);
        for (var i = 0; i < n; i++) {
            var a = (i / n) * Math.PI * 2;
            px(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9, (c2 && i % 4 === 0) ? c2 : c);
        }
    }
    function shadow(x, y, w) { rect(x - w, y, w * 2 + 1, 2, 'rgba(40,20,10,0.4)'); rect(x - w + 1, y + 2, w * 2 - 1, 1, 'rgba(40,20,10,0.25)'); }
    function draw(game, opts) {
        var e_1, _a, e_2, _b, e_3, _c, e_4, _d, e_5, _e, e_6, _f, e_7, _g, e_8, _h, e_9, _j;
        opts = opts || {};
        var g = game;
        ctx.fillStyle = '#20152a';
        ctx.fillRect(0, 0, W, H);
        var sh = g.shake > 0.1 ? g.shake : 0;
        var ox = sh ? R((Math.random() * 2 - 1) * sh) : 0;
        var oy = sh ? R((Math.random() * 2 - 1) * sh) : 0;
        ctx.save();
        ctx.translate(ox, HUD_TOP + oy);
        ctx.drawImage(g.mapCanvas, 0, 0);
        try {
            for (var _k = __values(g.pickups), _l = _k.next(); !_l.done; _l = _k.next()) {
                var p = _l.value;
                drawPickup(p, g.clock);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_l && !_l.done && (_a = _k.return)) _a.call(_k);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var ents = [];
        var _loop_1 = function (s) {
            ents.push({ y: s.y, f: function () { return drawSoldier(s, g); } });
        };
        try {
            for (var _m = __values(g.soldiers), _o = _m.next(); !_o.done; _o = _m.next()) {
                var s = _o.value;
                _loop_1(s);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_o && !_o.done && (_b = _m.return)) _b.call(_m);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var _loop_2 = function (gr) {
            ents.push({ y: gr.y, f: function () { return drawGrenade(gr); } });
        };
        try {
            for (var _p = __values(g.grenades), _q = _p.next(); !_q.done; _q = _p.next()) {
                var gr = _q.value;
                _loop_2(gr);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_q && !_q.done && (_c = _p.return)) _c.call(_p);
            }
            finally { if (e_3) throw e_3.error; }
        }
        ents.sort(function (a, b) { return a.y - b.y; });
        try {
            for (var ents_1 = __values(ents), ents_1_1 = ents_1.next(); !ents_1_1.done; ents_1_1 = ents_1.next()) {
                var e = ents_1_1.value;
                e.f();
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (ents_1_1 && !ents_1_1.done && (_d = ents_1.return)) _d.call(ents_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        try {
            for (var _r = __values(g.bullets), _s = _r.next(); !_s.done; _s = _r.next()) {
                var b = _s.value;
                var a = Math.atan2(b.vy, b.vx);
                px(b.x, b.y, 'rgba(40,20,10,0.35)');
                var bx = b.x, by = b.y - 7;
                rect(bx - 1, by - 1, 3, 3, '#ffd23b');
                px(bx, by, '#ffffff');
                px(bx - Math.cos(a) * 2, by - Math.sin(a) * 2, '#ff9c3b');
                px(bx - Math.cos(a) * 3, by - Math.sin(a) * 3, '#ff5a2e');
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_s && !_s.done && (_e = _r.return)) _e.call(_r);
            }
            finally { if (e_5) throw e_5.error; }
        }
        try {
            for (var _t = __values(g.soldiers), _u = _t.next(); !_u.done; _u = _t.next()) {
                var s = _u.value;
                if (!s.dead && !s.isBot && g.state === 'play')
                    drawAim(s, g);
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_u && !_u.done && (_f = _t.return)) _f.call(_t);
            }
            finally { if (e_6) throw e_6.error; }
        }
        try {
            for (var _v = __values(g.particles), _w = _v.next(); !_w.done; _w = _v.next()) {
                var p = _w.value;
                drawParticle(p);
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_w && !_w.done && (_g = _v.return)) _g.call(_v);
            }
            finally { if (e_7) throw e_7.error; }
        }
        try {
            for (var _x = __values(g.blasts), _y = _x.next(); !_y.done; _y = _x.next()) {
                var b = _y.value;
                drawBlast(b);
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_y && !_y.done && (_h = _x.return)) _h.call(_x);
            }
            finally { if (e_8) throw e_8.error; }
        }
        try {
            for (var _z = __values(g.texts), _0 = _z.next(); !_0.done; _0 = _z.next()) {
                var t = _0.value;
                if (t.t > t.dur * 0.7 && Math.floor(t.t * 20) % 2)
                    continue;
                PixelFont.draw(ctx, t.text, t.x, t.y, { color: t.color, align: 'center' });
            }
        }
        catch (e_9_1) { e_9 = { error: e_9_1 }; }
        finally {
            try {
                if (_0 && !_0.done && (_j = _z.return)) _j.call(_z);
            }
            finally { if (e_9) throw e_9.error; }
        }
        ctx.restore();
        if (g.flashScreen > 0.2) {
            ctx.fillStyle = "rgba(255,240,200,".concat((g.flashScreen - 0.2) * 0.5, ")");
            ctx.fillRect(0, HUD_TOP, W, C.MAP_H);
        }
        if (opts.demo)
            return;
        drawFeed(g);
        drawHUD(g, opts);
        drawCenterText(g);
    }
    function drawSoldier(s, g) {
        var e_10, _a;
        var art = soldierArt[s.slot];
        if (s.lastLeft === undefined)
            s.lastLeft = Math.cos(s.face) < 0;
        var cx = Math.cos(s.face);
        if (cx < -0.15)
            s.lastLeft = true;
        else if (cx > 0.15)
            s.lastLeft = false;
        var left = s.lastLeft;
        var dir = left ? art.left : art.right;
        if (s.dead) {
            if (s.deadT > 1.7)
                return;
            if (s.deadT > 0.9 && Math.floor(s.deadT * 16) % 2)
                return;
            shadow(s.x, s.y, 4);
            var rot = s.z > 0 ? Math.floor(s.spin) % 4 : (left ? 3 : 1);
            var img = art.deadRot[rot];
            ctx.drawImage(img, R(s.x - img.width / 2), R(s.y - img.height + (s.z > 0 ? 0 : 3) - s.z));
            return;
        }
        try {
            for (var _b = __values(s.trail), _c = _b.next(); !_c.done; _c = _b.next()) {
                var t = _c.value;
                ctx.globalAlpha = Math.max(0, t.life / 0.25) * 0.55;
                ctx.drawImage(t.left ? art.trail.left : art.trail.right, R(t.x - 6), R(t.y - 16));
            }
        }
        catch (e_10_1) { e_10 = { error: e_10_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_10) throw e_10.error; }
        }
        ctx.globalAlpha = 1;
        shadow(s.x, s.y, 4);
        var frame = 'stand';
        var bob = 0;
        if (s.moving) {
            var f = Math.floor(s.walkT * 10) % 4;
            frame = ['walkA', 'stand', 'walkB', 'stand'][f];
            bob = f % 2 ? -1 : 0;
        }
        var sx = R(s.x - 6), sy = R(s.y - 16 + bob);
        var aimUp = Math.sin(s.face) < -0.45;
        if (aimUp)
            drawGun(s, sy);
        var blink = (s.protectT > 0 && Math.floor(g.clock * 16) % 2) || s.hurtT > 0.15;
        ctx.drawImage(blink ? (left ? art.white.left : art.white.right) : dir[frame], sx, sy);
        if (!aimUp)
            drawGun(s, sy);
        if (s.shieldT > 0 && !(s.shieldT < 2 && Math.floor(g.clock * 10) % 2)) {
            var pr = 11 + Math.sin(g.clock * 8) * 0.8;
            ring(s.x, s.y - 7, pr, '#5ff2ff', '#ffffff');
            ring(s.x, s.y - 7, pr - 1, 'rgba(95,242,255,0.45)');
        }
        var col = C.PLAYERS[s.slot].color;
        var label = s.isBot ? 'CPU' : 'P' + (s.slot + 1);
        var ty = sy - 10;
        PixelFont.draw(ctx, label, s.x, ty, { color: col, align: 'center' });
        rect(s.x - 1, ty + 8, 3, 1, col);
        px(s.x, ty + 9, col);
        if (!s.isBot && !s.connected && Math.floor(g.clock * 2) % 2) {
            PixelFont.draw(ctx, 'OFFLINE', s.x, ty - 9, { color: '#ffffff', align: 'center' });
        }
    }
    function drawGun(s, sy) {
        var cx = Math.cos(s.face), cy = Math.sin(s.face);
        var hx = s.x + (cx < 0 ? -1 : 1), hy = sy + 11;
        var len = 7;
        for (var i = 0; i <= len; i++) {
            var x = hx + cx * i, y = hy + cy * i * 0.85;
            px(x, y, i < 2 ? '#5a3a22' : (i === len ? '#9aa0ad' : '#3a3d48'));
            px(x, y + 1, K);
        }
        if (s.muzzleT > 0) {
            var mx = hx + cx * (len + 3), my = hy + cy * (len + 3) * 0.85;
            var big = s.muzzleT > 0.035;
            disc(mx, my, big ? 3 : 2, '#ff9c3b');
            disc(mx, my, big ? 2 : 1, '#ffe14a');
            px(mx, my, '#ffffff');
            if (big) {
                px(mx + cx * 4, my + cy * 4, '#ffe14a');
                px(mx - cy * 3, my + cx * 3, '#ff9c3b');
                px(mx + cy * 3, my - cx * 3, '#ff9c3b');
            }
        }
    }
    function drawAim(s, g) {
        var pc = C.PLAYERS[s.slot];
        var inp = s.input;
        var blink = Math.floor(g.clock * 12) % 2;
        if (inp.aimStick != null) {
            var cx = Math.cos(inp.aimStick), cy = Math.sin(inp.aimStick);
            var ex = s.x, ey = s.y;
            for (var d = 7; d <= C.AIM_RANGE; d += 1) {
                var x_1 = s.x + cx * d, y_1 = s.y + cy * d;
                if (g.map.solidShot(x_1, y_1))
                    break;
                ex = x_1;
                ey = y_1;
                if (((d - Math.floor(g.clock * 40)) % 6 + 6) % 6 < 4) {
                    var c = d % 12 < 6 ? pc.color : pc.light;
                    rect(x_1, y_1 - 5, 2, 1, K);
                    rect(x_1, y_1 - 7, 2, 2, c);
                }
            }
            var x = R(ex), y = R(ey - 7);
            var col = blink ? '#ffffff' : pc.color;
            ring(x, y + 0.5, 4, K);
            ring(x, y, 3, col);
            px(x, y, col);
        }
        if (inp.powStick != null && s.power === 'grenade') {
            var pts = g.predictGrenade(s, inp.powStick, inp.powMag);
            for (var i = 0; i < pts.length; i += 3) {
                var p = pts[i];
                px(p.x, p.y, 'rgba(40,20,10,0.35)');
                rect(p.x - 1, p.y - 4 - p.z, 3, 3, K);
                px(p.x, p.y - 3 - p.z, i % 6 ? pc.color : '#ffffff');
            }
            var end = pts[pts.length - 1];
            if (end) {
                var n = 40;
                for (var i = 0; i < n; i++) {
                    if ((i + Math.floor(g.clock * 10)) % 3 === 0)
                        continue;
                    var a = (i / n) * Math.PI * 2;
                    var ex2 = end.x + Math.cos(a) * C.BLAST_R, ey2 = end.y + Math.sin(a) * C.BLAST_R * 0.8;
                    rect(ex2, ey2, 2, 2, blink ? '#ff3b3b' : '#ffd23b');
                }
                ctx.fillStyle = 'rgba(255,59,59,0.18)';
                for (var dy = -C.BLAST_R * 0.8; dy <= C.BLAST_R * 0.8; dy++) {
                    var w = Math.sqrt(Math.max(0, 1 - (dy * dy) / (C.BLAST_R * C.BLAST_R * 0.64))) * C.BLAST_R;
                    ctx.fillRect(R(end.x - w), R(end.y + dy), R(w * 2), 1);
                }
                rect(end.x - 1, end.y - 1, 3, 3, '#ff3b3b');
            }
        }
        else if (inp.powStick != null && s.power) {
            ring(s.x, s.y - 7, 13, blink ? '#5ff2ff' : '#ffffff');
        }
    }
    function drawGrenade(gr) {
        shadow(gr.x, gr.y, 2);
        var y = gr.y - 3 - gr.z;
        rect(gr.x - 2, y - 2, 4, 4, K);
        rect(gr.x - 1, y - 1, 2, 2, '#6fae3a');
        px(gr.x - 1, y - 1, '#a6e06a');
        var rate = 6 + gr.t * 14;
        if (Math.floor(gr.t * rate) % 2)
            px(gr.x, y - 3, '#ff3b3b');
    }
    function drawPickup(p, clock) {
        var bob = Math.round(Math.sin(p.t * 4) * 1.5);
        shadow(p.x, p.y + 1, 4);
        var x = R(p.x - 4), y = R(p.y - 10 + bob);
        if (p.type !== 'ammo') {
            var glow = Math.floor(clock * 6) % 2 ? '#ffffff' : '#5ff2ff';
            rect(x - 2, y - 2, 13, 1, glow);
            rect(x - 2, y + 10, 13, 1, glow);
            rect(x - 2, y - 2, 1, 13, glow);
            rect(x + 10, y - 2, 1, 13, glow);
        }
        if (p.t < 0.6 && Math.floor(p.t * 20) % 2)
            return;
        Icons.drawIcon(ctx, p.type, x, y, 1);
    }
    function drawParticle(p) {
        var k = Math.max(0, p.life / p.max);
        if (p.kind === 'smoke') {
            var r = (p.size || 3) * (p.dusty ? 1 : (1.4 - k * 0.6));
            var c = void 0;
            if (p.dusty)
                c = 'rgba(217,181,106,' + (k * 0.8) + ')';
            else if (k > 0.85)
                c = '#ffd23b';
            else if (k > 0.72)
                c = '#ff7a2e';
            else
                c = k > 0.4 ? '#4a4652' : '#7e7a86';
            if (!p.dusty && k < 0.3 && Math.floor(p.life * 30) % 2)
                return;
            disc(p.x, p.y - p.z, Math.max(1, r), c);
        }
        else if (p.kind === 'debris') {
            if (p.z > 2)
                px(p.x, p.y, 'rgba(40,20,10,0.35)');
            rect(p.x, p.y - p.z, 2, 2, p.color);
        }
        else if (p.kind === 'casing') {
            if (k < 0.25 && Math.floor(p.life * 20) % 2)
                return;
            rect(p.x, p.y - p.z, 2, 1, p.color);
        }
        else if (p.kind === 'star') {
            var x = p.x, y = p.y - p.z;
            px(x, y, p.color);
            px(x - 1, y, p.color);
            px(x + 1, y, p.color);
            px(x, y - 1, p.color);
            px(x, y + 1, p.color);
        }
        else {
            px(p.x, p.y - p.z, p.color);
        }
    }
    function drawBlast(b) {
        var k = b.t / b.max;
        var grow = 1 - Math.pow(1 - Math.min(1, k * 2.2), 3);
        var r = b.r * (0.35 + 0.65 * grow);
        if (k < 0.12) {
            disc(b.x, b.y - 4, r * 0.9, '#ffffff', 0.8);
            return;
        }
        if (k < 0.7) {
            disc(b.x, b.y - 4, r, k < 0.4 ? '#ff5a2e' : '#c2381f', 0.8);
            disc(b.x, b.y - 6, r * 0.75, '#ff9c3b', 0.8);
            disc(b.x, b.y - 8, r * (0.5 - k * 0.4), '#ffe14a', 0.8);
            if (k < 0.3)
                disc(b.x, b.y - 9, r * 0.25, '#ffffff', 0.8);
        }
        else {
            ring(b.x, b.y - 4, r, '#4a4652');
            ring(b.x, b.y - 4, r - 1, '#7e7a86');
        }
    }
    function drawHUD(g, opts) {
        var e_11, _a;
        rect(0, 0, W, HUD_TOP, K);
        rect(0, HUD_TOP - 1, W, 1, '#3a3d48');
        rect(0, H - C.HUD_BOTTOM, W, C.HUD_BOTTOM, K);
        rect(0, H - C.HUD_BOTTOM, W, 1, '#3a3d48');
        var pos = [[2, 2], [W - 134, 2], [2, H - 10], [W - 134, H - 10]];
        try {
            for (var _b = __values(g.soldiers), _c = _b.next(); !_c.done; _c = _b.next()) {
                var s = _c.value;
                var _d = __read(pos[s.slot], 2), x = _d[0], y = _d[1];
                drawPanel(s, x, y, g);
            }
        }
        catch (e_11_1) { e_11 = { error: e_11_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_11) throw e_11.error; }
        }
        var t = Math.ceil(g.time);
        var mm = Math.floor(t / 60), ss = String(t % 60).padStart(2, '0');
        var col = '#ffffff';
        if (g.time <= 30)
            col = Math.floor(g.clock * 4) % 2 ? '#ff3b3b' : '#ffd23b';
        if (g.suddenDeath) {
            PixelFont.draw(ctx, 'SUDDEN DEATH', W / 2, 3, { color: Math.floor(g.clock * 4) % 2 ? '#ff3b3b' : '#ffffff', align: 'center' });
        }
        else {
            PixelFont.draw(ctx, mm + ':' + ss, W / 2, 3, { color: col, align: 'center' });
        }
        if (opts.roomCode) {
            PixelFont.draw(ctx, 'STANZA ' + opts.roomCode, W / 2, H - 9, { color: '#9aa0ad', align: 'center', outline: null });
        }
    }
    function drawPanel(s, x, y, g) {
        var pc = C.PLAYERS[s.slot];
        rect(x, y, 9, 8, pc.color);
        rect(x, y + 7, 9, 1, pc.dark);
        PixelFont.draw(ctx, String(s.slot + 1), x + 2, y + 1, { color: K, outline: null });
        var name = s.name.slice(0, 9);
        var dim = s.dead || (!s.isBot && !s.connected);
        PixelFont.draw(ctx, name, x + 12, y + 1, { color: dim ? '#6b6f7a' : pc.color, outline: null });
        Icons.drawIcon(ctx, 'skull', x + 68, y + 1, 1);
        PixelFont.draw(ctx, String(s.kills), x + 77, y + 1, { color: '#ffffff', outline: null });
        if (s.dead) {
            PixelFont.draw(ctx, 'KO ' + Math.max(1, Math.ceil(s.respawnT)), x + 92, y + 1, { color: '#ff5a5a', outline: null });
        }
        else {
            for (var i = 0; i < C.MAX_AMMO; i++) {
                var bx_1 = x + 91 + i * 3;
                if (i < s.ammo) {
                    rect(bx_1, y + 1, 2, 1, '#fff1a0');
                    rect(bx_1, y + 2, 2, 5, '#d9a441');
                }
                else
                    rect(bx_1, y + 2, 2, 5, '#3a3d48');
            }
            if (s.ammo === 0 && Math.floor(g.clock * 4) % 2)
                rect(x + 90, y + 1, 31, 7, 'rgba(255,59,59,0.5)');
        }
        var bx = x + 123;
        rect(bx - 1, y - 1, 11, 10, '#3a3d48');
        rect(bx, y, 9, 8, K);
        if (s.power)
            Icons.drawIcon(ctx, s.power, bx, y - 1, 1);
        else if (s.shieldT > 0)
            PixelFont.draw(ctx, String(Math.ceil(s.shieldT)), bx + 2, y + 1, { color: '#5ff2ff', outline: null });
        else if (s.flashT > 0)
            PixelFont.draw(ctx, String(Math.ceil(s.flashT)), bx + 2, y + 1, { color: '#ffe14a', outline: null });
    }
    function drawFeed(g) {
        var e_12, _a;
        var y = HUD_TOP + 3;
        try {
            for (var _b = __values(g.feed), _c = _b.next(); !_c.done; _c = _b.next()) {
                var f = _c.value;
                if (f.t < 0.5 && Math.floor(f.t * 12) % 2) {
                    y += 9;
                    continue;
                }
                var icon = f.cause === 'grenade' ? '*' : f.cause === 'barrel' ? '*' : '>';
                var right = W - 3;
                if (f.cause === 'self') {
                    PixelFont.draw(ctx, f.vn + ' OOPS', right, y, { color: C.PLAYERS[f.v].color, align: 'right' });
                }
                else {
                    var vw = PixelFont.width(f.vn) + 2;
                    PixelFont.draw(ctx, f.vn, right, y, { color: C.PLAYERS[f.v].color, align: 'right' });
                    PixelFont.draw(ctx, icon, right - vw - 6, y, { color: '#ffffff', align: 'right' });
                    PixelFont.draw(ctx, f.an, right - vw - 14, y, { color: C.PLAYERS[f.a].color, align: 'right' });
                }
                y += 9;
            }
        }
        catch (e_12_1) { e_12 = { error: e_12_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_12) throw e_12.error; }
        }
    }
    function drawCenterText(g) {
        var cy = HUD_TOP + C.MAP_H / 2;
        if (g.state === 'countdown') {
            var n = Math.ceil(g.countdown);
            var frac = g.countdown - Math.floor(g.countdown);
            var scale = frac > 0.85 ? 8 : frac > 0.75 ? 7 : 6;
            if (n >= 1 && n <= 3) {
                PixelFont.draw(ctx, String(n), W / 2, cy - (7 * scale) / 2, { color: '#ffd23b', scale: scale, align: 'center', shadow: '#a3172a' });
            }
            PixelFont.draw(ctx, 'PREPARATI!', W / 2, cy + 34, { color: '#ffffff', scale: 2, align: 'center' });
        }
        if (g.banner) {
            var b = g.banner;
            if (b.t > b.dur - 0.3 && Math.floor(b.t * 16) % 2)
                return;
            var scale = b.t < 0.06 ? 5 : b.t < 0.12 ? 4 : 3;
            if (PixelFont.width(b.text, scale) > W - 16)
                scale = 2;
            var wob = b.t < 0.4 ? Math.round(Math.sin(b.t * 40) * 2) : 0;
            PixelFont.draw(ctx, b.text, W / 2, cy - 12 + wob, { color: b.color, scale: scale, align: 'center', shadow: K });
        }
    }
    window.Render = { init: init, draw: draw, soldierArt: function () { return soldierArt; } };
})();

/* ---- js/games/shooter/index.js ---- */
"use strict";
(function () {
    'use strict';
    var C = CFG;
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var angleOrNull = function (a) { return (a === null || a === undefined || !isFinite(+a) ? null : +a); };
    var renderReady = false;
    function ensureRender() {
        if (!renderReady) {
            Render.init(document.getElementById('game'));
            renderReady = true;
        }
        else {
            var cv = document.getElementById('game');
            cv.width = C.W;
            cv.height = C.H;
        }
    }
    var ShooterSession = (function () {
        function ShooterSession(room, humans) {
            var _this = this;
            this.room = room;
            ensureRender();
            var defs = humans.map(function (h) { return ({ slot: h.slot, name: h.name, isBot: false }); });
            if (defs.length <= 1) {
                var names = C.BOT_NAMES.slice().sort(function () { return Math.random() - 0.5; });
                var _loop_1 = function (i) {
                    if (!defs.some(function (d) { return d.slot === i; }))
                        defs.push({ slot: i, name: names.pop(), isBot: true });
                };
                for (var i = 0; i < 4; i++) {
                    _loop_1(i);
                }
            }
            defs.sort(function (a, b) { return a.slot - b.slot; });
            this.game = new Game(defs, function (t, d) { return _this.onEvent(t, d); });
        }
        ShooterSession.prototype.soldier = function (slot) { return this.game.soldiers.find(function (s) { return !s.isBot && s.slot === slot; }) || null; };
        ShooterSession.prototype.update = function (dt) { this.game.update(dt); };
        ShooterSession.prototype.draw = function () { Render.draw(this.game, { roomCode: this.room.code }); };
        ShooterSession.prototype.input = function (slot, d) {
            var sol = this.soldier(slot);
            if (!sol)
                return;
            var inp = sol.input;
            switch (d.t) {
                case 'in':
                    inp.x = clamp(+d.x || 0, -1, 1);
                    inp.y = clamp(+d.y || 0, -1, 1);
                    break;
                case 'fire':
                    inp.fire = !!d.on;
                    if (d.on)
                        inp.fireTap = true;
                    break;
                case 'aim':
                    inp.aimStick = angleOrNull(d.a);
                    break;
                case 'shoot':
                    inp.aimStick = null;
                    inp.shot = { a: angleOrNull(d.a) };
                    break;
                case 'paim':
                    inp.powStick = angleOrNull(d.a);
                    inp.powMag = clamp(+d.m || 0, 0, 1);
                    break;
                case 'pow':
                    inp.powStick = null;
                    inp.pow = { a: angleOrNull(d.a), m: d.m == null ? null : clamp(+d.m, 0, 1) };
                    break;
                default:
            }
        };
        ShooterSession.prototype.setConnected = function (slot, on) {
            var sol = this.soldier(slot);
            if (!sol)
                return;
            sol.connected = on;
            if (!on)
                Object.assign(sol.input, { x: 0, y: 0, fire: false, aimStick: null, powStick: null });
        };
        ShooterSession.prototype.hud = function (slot) {
            var s = this.soldier(slot);
            if (!s)
                return null;
            return {
                ammo: s.ammo, kills: s.kills, pow: s.power,
                dead: s.dead ? Math.max(1, Math.ceil(s.respawnT)) : 0,
                shield: s.shieldT > 0 ? Math.ceil(s.shieldT) : 0,
                flash: s.flashT > 0 ? Math.ceil(s.flashT) : 0,
                time: Math.ceil(this.game.time),
            };
        };
        ShooterSession.prototype.onEvent = function (type, data) {
            if (type === 'sfx')
                Sfx.play(data);
            else if (type === 'announce')
                Sfx.announce(data);
            else if (type === 'music') {
                if (data)
                    Sfx.startMusic('army');
                else
                    Sfx.stopMusic();
            }
            else if (type === 'buzz') {
                if (!data.s.isBot)
                    this.room.buzz(data.s.slot, data.pattern);
            }
            else if (type === 'hud') {
                if (!data.isBot)
                    this.room.hudChanged(data.slot);
            }
            else if (type === 'over') {
                var ranking = this.game.ranking().map(function (s) { return ({
                    slot: s.slot, name: s.name, bot: s.isBot, detail: "".concat(s.kills, " ELIM. \u00B7 ").concat(s.deaths, " K.O."),
                }); });
                this.room.finish(ranking, { delay: 1800, voice: 'Winner! ' + data.name.toLowerCase() });
            }
        };
        ShooterSession.prototype.stop = function () { Sfx.stopMusic(); };
        return ShooterSession;
    }());
    function demo() {
        ensureRender();
        var g = new Game([0, 1, 2, 3].map(function (i) { return ({ slot: i, name: C.BOT_NAMES[i], isBot: true }); }), function () { });
        g.state = 'play';
        g.time = 9999;
        return {
            update: function (dt) { g.update(dt); },
            draw: function () { Render.draw(g, { demo: true }); },
        };
    }
    var iconArt = null;
    GAMES.register({
        id: 'shooter',
        title: 'SOLDATINI ARENA',
        desc: 'Sparatutto tutti contro tutti: 4 minuti, vince chi fa più eliminazioni.',
        players: '1-4 (bot se sei da solo)',
        layout: 'shooter',
        available: true,
        icon: function (ctx, x, y) {
            if (!iconArt)
                iconArt = Sprites.buildSoldier(ROOM.PLAYERS[0]);
            ctx.drawImage(iconArt.right.stand, x + 5, y + 4);
            ctx.fillStyle = '#3a3d48';
            ctx.fillRect(x + 12, y + 14, 6, 1);
            ctx.fillStyle = '#ffe14a';
            ctx.fillRect(x + 19, y + 13, 2, 3);
            ctx.fillStyle = '#ff9c3b';
            ctx.fillRect(x + 21, y + 14, 2, 1);
        },
        demo: demo,
        create: function (room, humans) { return new ShooterSession(room, humans); },
    });
    window.__shooter = { ShooterSession: ShooterSession };
})();

/* ---- js/games/sheep/config.js ---- */
"use strict";
(function () {
    'use strict';
    var S = {
        W: 384, H: 216, HUD_TOP: 12, HUD_BOTTOM: 12,
        TILE: 8, COLS: 48, ROWS: 24,
        MATCH_TIME: 240,
        WAVE_MIN_FREE: 3,
        WAVE_SIZE: 12,
        MAX_SHEEP: 70,
        SHEEP_COUNT: 24,
        GOLDEN_EVERY: 22,
        GOLDEN_VALUE: 3,
        DOG_SPEED: 68,
        DASH_MULT: 1.9,
        DASH_TIME: 0.55,
        DASH_CD: 3,
        BARK_CD: 0.7,
        BARK_R: 64,
        ATTRACT_TIME: 1.6,
        FOLLOW_DIST: 11,
        SCARE_R: 20,
        DASH_SCARE_R: 38,
        SHEEP_SPEED: 30,
        SHEEP_FOLLOW_SPEED: 52,
        SHEEP_FLEE_SPEED: 60,
        WOLF_FIRST: 32,
        WOLF_EVERY: 28,
        WOLF_SPEED: 50,
        WOLF_LIFE: 13,
        WOLF_FEAR_R: 58,
        SHEEP_RESPAWN: 7,
        BOT_NAMES: ['FUFFI', 'BALTO', 'LASSIE', 'REX', 'BRICIOLA', 'ZEUS'],
    };
    S.MAP_W = S.COLS * S.TILE;
    S.MAP_H = S.ROWS * S.TILE;
    S.T = { GRASS: 0, FENCE: 1, BUSH: 2, ROCK: 3, HAY: 4, WATER: 5, TREE: 6, GATE: 7 };
    var PEN_W = 8, PEN_H = 6;
    S.PENS = [
        { cx: 0, cy: 0 }, { cx: 1, cy: 1 }, { cx: 1, cy: 0 }, { cx: 0, cy: 1 },
    ].map(function (_a) {
        var cx = _a.cx, cy = _a.cy;
        var x0 = cx ? S.COLS - 1 - PEN_W : 1;
        var y0 = cy ? S.ROWS - 1 - PEN_H : 1;
        return {
            tx: x0, ty: y0, tw: PEN_W, th: PEN_H,
            wallX: cx ? x0 - 1 : x0 + PEN_W,
            wallY: cy ? y0 - 1 : y0 + PEN_H,
            gate: [y0 + 2, y0 + 3, y0 + 4].map(function (y) { return (cy ? y - 1 : y); }),
            dir: cx ? -1 : 1,
            x: x0 * S.TILE, y: y0 * S.TILE, w: PEN_W * S.TILE, h: PEN_H * S.TILE,
        };
    });
    S.PENS.forEach(function (p) {
        p.gateX = (p.wallX + 0.5) * S.TILE;
        p.gateY = (p.gate[1] + 0.5) * S.TILE;
        p.centerX = p.x + p.w / 2;
        p.centerY = p.y + p.h / 2;
        p.spawnX = p.gateX + p.dir * 18;
        p.spawnY = p.gateY;
    });
    window.SHEEP = S;
})();

/* ---- js/games/sheep/map.js ---- */
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function () {
    'use strict';
    var S = SHEEP;
    var COLS = S.COLS, ROWS = S.ROWS, TILE = S.TILE, T = S.T;
    var rnd = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
    var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
    var solid = function (t) { return t !== T.GRASS; };
    function prefab() {
        var kind = pick(['bush', 'bush', 'bush', 'rock', 'rock', 'hay', 'pond', 'tree', 'tree']);
        var c = [];
        if (kind === 'bush') {
            var shape = pick([[[0, 0]], [[0, 0], [1, 0]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [1, 1]]]);
            shape.forEach(function (_a) {
                var _b = __read(_a, 2), x = _b[0], y = _b[1];
                return c.push([x, y, T.BUSH]);
            });
        }
        else if (kind === 'rock') {
            var shape = pick([[[0, 0]], [[0, 0], [1, 0]]]);
            shape.forEach(function (_a) {
                var _b = __read(_a, 2), x = _b[0], y = _b[1];
                return c.push([x, y, T.ROCK]);
            });
        }
        else if (kind === 'hay') {
            c.push([0, 0, T.HAY], [1, 0, T.HAY]);
        }
        else if (kind === 'pond') {
            for (var y = 0; y < 2; y++)
                for (var x = 0; x < 3; x++)
                    c.push([x, y, T.WATER]);
        }
        else {
            c.push([0, 0, T.TREE]);
        }
        return c;
    }
    function tryGenerate(usedSlots) {
        var e_1, _a;
        var g = [];
        for (var y = 0; y < ROWS; y++)
            g.push(new Array(COLS).fill(T.GRASS));
        var QW = COLS / 2, QH = ROWS / 2;
        var reserved = function (x, y) { return (x <= 14 && y <= 9); };
        var placed = 0;
        var target = rnd(5, 8);
        var _loop_1 = function (i) {
            var e_2, _f, e_3, _g;
            var cells = prefab();
            var w = Math.max.apply(Math, __spreadArray([], __read(cells.map(function (c) { return c[0]; })), false)) + 1, h = Math.max.apply(Math, __spreadArray([], __read(cells.map(function (c) { return c[1]; })), false)) + 1;
            var ox = rnd(2, QW - w), oy = rnd(2, QH - h);
            var abs = cells.map(function (_a) {
                var _b = __read(_a, 3), x = _b[0], y = _b[1], t = _b[2];
                return [ox + x, oy + y, t];
            });
            var ok = true;
            try {
                for (var abs_1 = (e_2 = void 0, __values(abs)), abs_1_1 = abs_1.next(); !abs_1_1.done; abs_1_1 = abs_1.next()) {
                    var _h = __read(abs_1_1.value, 2), x = _h[0], y = _h[1];
                    if (reserved(x, y)) {
                        ok = false;
                        break;
                    }
                    for (var dy = -1; dy <= 1 && ok; dy++)
                        for (var dx = -1; dx <= 1; dx++) {
                            var xx = x + dx, yy = y + dy;
                            if (xx < 1 || yy < 1 || xx >= QW || yy >= QH)
                                continue;
                            if (g[yy][xx] !== T.GRASS) {
                                ok = false;
                                break;
                            }
                        }
                    if (!ok)
                        break;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (abs_1_1 && !abs_1_1.done && (_f = abs_1.return)) _f.call(abs_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            if (!ok)
                return "continue";
            try {
                for (var abs_2 = (e_3 = void 0, __values(abs)), abs_2_1 = abs_2.next(); !abs_2_1.done; abs_2_1 = abs_2.next()) {
                    var _j = __read(abs_2_1.value, 3), x = _j[0], y = _j[1], t = _j[2];
                    g[y][x] = t;
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (abs_2_1 && !abs_2_1.done && (_g = abs_2.return)) _g.call(abs_2);
                }
                finally { if (e_3) throw e_3.error; }
            }
            placed++;
        };
        for (var i = 0; i < 300 && placed < target; i++) {
            _loop_1(i);
        }
        for (var y = 0; y < QH; y++)
            for (var x = 0; x < QW; x++) {
                var t = g[y][x];
                g[y][COLS - 1 - x] = t;
                g[ROWS - 1 - y][x] = t;
                g[ROWS - 1 - y][COLS - 1 - x] = t;
            }
        for (var x = 0; x < COLS; x++) {
            g[0][x] = T.FENCE;
            g[ROWS - 1][x] = T.FENCE;
        }
        for (var y = 0; y < ROWS; y++) {
            g[y][0] = T.FENCE;
            g[y][COLS - 1] = T.FENCE;
        }
        S.PENS.forEach(function (p, slot) {
            var e_4, _a;
            for (var y = p.ty; y < p.ty + p.th; y++)
                for (var x = p.tx; x < p.tx + p.tw; x++)
                    g[y][x] = T.GRASS;
            var ys = p.wallY > p.ty ? [0, p.wallY] : [p.wallY, ROWS - 1];
            for (var y = ys[0]; y <= ys[1]; y++) {
                var isGate = p.gate.includes(y);
                g[y][p.wallX] = isGate ? (usedSlots.includes(slot) ? T.GRASS : T.GATE) : T.FENCE;
            }
            var xs = p.wallX > p.tx ? [0, p.wallX] : [p.wallX, COLS - 1];
            for (var x = xs[0]; x <= xs[1]; x++)
                g[p.wallY][x] = T.FENCE;
            try {
                for (var _b = __values(p.gate), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var y = _c.value;
                    for (var k = 1; k <= 3; k++) {
                        var x = p.wallX + p.dir * k;
                        if (g[y][x] !== T.FENCE)
                            g[y][x] = T.GRASS;
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_4) throw e_4.error; }
            }
        });
        var p0 = S.PENS[usedSlots[0] || 0];
        var sx = p0.wallX + p0.dir * 2, sy = p0.gate[1];
        var seen = g.map(function (r) { return r.map(function () { return false; }); });
        var st = [[sx, sy]];
        seen[sy][sx] = true;
        while (st.length) {
            var _b = __read(st.pop(), 2), x = _b[0], y = _b[1];
            try {
                for (var _c = (e_1 = void 0, __values([[1, 0], [-1, 0], [0, 1], [0, -1]])), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var _e = __read(_d.value, 2), dx = _e[0], dy = _e[1];
                    var xx = x + dx, yy = y + dy;
                    if (xx < 0 || yy < 0 || xx >= COLS || yy >= ROWS || seen[yy][xx] || solid(g[yy][xx]))
                        continue;
                    seen[yy][xx] = true;
                    st.push([xx, yy]);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        var lost = 0;
        var _loop_2 = function (y) {
            var _loop_3 = function (x) {
                if (g[y][x] !== T.GRASS || seen[y][x])
                    return "continue";
                var inPen = S.PENS.some(function (p) { return x >= p.tx && x < p.tx + p.tw && y >= p.ty && y < p.ty + p.th; });
                if (!inPen) {
                    lost++;
                    g[y][x] = T.BUSH;
                }
            };
            for (var x = 0; x < COLS; x++) {
                _loop_3(x);
            }
        };
        for (var y = 0; y < ROWS; y++) {
            _loop_2(y);
        }
        if (lost > 6)
            return null;
        return g;
    }
    function generate(usedSlots) {
        var g = null;
        for (var i = 0; i < 100 && !g; i++)
            g = tryGenerate(usedSlots);
        if (!g)
            g = tryGenerate(usedSlots) || [];
        var map = { grid: g, seed: Math.floor(Math.random() * 1e6) };
        map.tileAt = function (px, py) {
            var x = Math.floor(px / TILE), y = Math.floor(py / TILE);
            if (x < 0 || y < 0 || x >= COLS || y >= ROWS)
                return T.FENCE;
            return g[y][x];
        };
        map.solid = function (px, py) { return solid(map.tileAt(px, py)); };
        map.open = function () {
            var out = [];
            var _loop_4 = function (y) {
                var _loop_5 = function (x) {
                    if (g[y][x] !== T.GRASS)
                        return "continue";
                    if (S.PENS.some(function (p) { return x >= p.tx - 1 && x <= p.tx + p.tw && y >= p.ty - 1 && y <= p.ty + p.th; }))
                        return "continue";
                    out.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, tx: x, ty: y });
                };
                for (var x = 1; x < COLS - 1; x++) {
                    _loop_5(x);
                }
            };
            for (var y = 1; y < ROWS - 1; y++) {
                _loop_4(y);
            }
            return out;
        };
        return map;
    }
    window.SheepMap = { generate: generate, solid: solid };
})();

/* ---- js/games/sheep/art.js ---- */
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function () {
    'use strict';
    var S = SHEEP;
    var TILE = S.TILE, T = S.T, COLS = S.COLS, ROWS = S.ROWS;
    var K = '#1b1b26';
    function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function fromRows(rows, pal) {
        var c = canvas(rows[0].length, rows.length);
        var g = c.getContext('2d');
        rows.forEach(function (r, y) { return __spreadArray([], __read(r), false).forEach(function (ch, x) { if (pal[ch]) {
            g.fillStyle = pal[ch];
            g.fillRect(x, y, 1, 1);
        } }); });
        return c;
    }
    function flip(src) {
        var c = canvas(src.width, src.height);
        var g = c.getContext('2d');
        g.translate(src.width, 0);
        g.scale(-1, 1);
        g.drawImage(src, 0, 0);
        return c;
    }
    var both = function (rows, pal) { var r = fromRows(rows, pal); return { right: r, left: flip(r) }; };
    var SHEEP_A = [
        '..kkkkk....',
        '.kwwWwwkk..',
        'kwwwwwwwkkk',
        'kwWwwwWwkgk',
        'kwwwwwwwkek',
        'kwwwWwwwkkk',
        '.kkkkkkkk..',
        '..kg..kg...',
        '..kk..kk...',
    ];
    var SHEEP_B = SHEEP_A.slice(0, 7).concat(['...kg.kg...', '...kk.kk...']);
    var SHEEP_PAL = { k: K, w: '#ffffff', W: '#d9dbe6', g: '#3a3d48', e: '#ffffff' };
    var GOLD_PAL = { k: K, w: '#ffe14a', W: '#f39b1d', g: '#5a3a22', e: '#ffffff' };
    var DOG_A = [
        '.........kk..',
        '........kbbk.',
        '.......kbbwbk',
        'kk.....kbbbbkk',
        'kbk.kkkkcckkk.',
        '.kbbbbbbbccwk.',
        '.kbbbbwwwwwk..',
        '..kbwkkkkbwk..',
        '..kbk....kbk..',
        '..kk.....kk...',
    ].map(function (r) { return r.slice(0, 13); });
    var DOG_B = DOG_A.slice(0, 7).concat(['..kbwkkkkbwk.', '...kbk..kbk..', '...kk...kk...']);
    var WOLF_A = [
        '...........kk..',
        '..........kggk.',
        '.........kgggrk',
        'kk......kgggggk',
        'kgk.kkkkkgggkk.',
        '.kggggggggggk..',
        '.kgGggggGgggk..',
        '..kgGkkkkkgGk..',
        '..kgk.....kgk..',
        '..kk......kk...',
    ];
    var WOLF_B = WOLF_A.slice(0, 7).concat(['..kgGkkkkkgGk..', '...kgk...kgk...', '...kk....kk....']);
    var WOLF_PAL = { k: K, g: '#8a8f9c', G: '#5d6170', r: '#ff3b3b' };
    var sheep = { a: both(SHEEP_A, SHEEP_PAL), b: both(SHEEP_B, SHEEP_PAL) };
    var gold = { a: both(SHEEP_A, GOLD_PAL), b: both(SHEEP_B, GOLD_PAL) };
    var wolf = { a: both(WOLF_A, WOLF_PAL), b: both(WOLF_B, WOLF_PAL) };
    var dogs = ROOM.PLAYERS.map(function (pc) {
        var pal = { k: K, b: '#3a2a22', w: '#ffffff', c: pc.color };
        return { a: both(DOG_A, pal), b: both(DOG_B, pal) };
    });
    function hash(x, y, s) {
        var h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
        h = (h ^ (h >>> 13)) * 1274126177;
        return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    }
    function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
    function px(g, x, y, c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
    var G1 = '#5fb83a', G2 = '#4ea52f', G3 = '#7dcf4a', G4 = '#3f8a27';
    var FLOWERS = ['#ffffff', '#ffd23b', '#ff7ab8', '#9ccbff'];
    function grass(g, ox, oy, tx, ty, seed) {
        rect(g, ox, oy, TILE, TILE, hash(Math.floor(tx / 4), Math.floor(ty / 3), seed) < 0.3 ? G2 : G1);
        for (var i = 0; i < 4; i++) {
            var x = Math.floor(hash(tx * 8 + i, ty, seed) * 8), y = Math.floor(hash(tx, ty * 8 + i, seed) * 8);
            px(g, ox + x, oy + y, i % 2 ? G3 : G4);
        }
        var d = hash(tx, ty, seed + 3);
        if (d < 0.06) {
            var c = FLOWERS[Math.floor(d * 100) % FLOWERS.length];
            px(g, ox + 3, oy + 3, c);
            px(g, ox + 2, oy + 3, c);
            px(g, ox + 4, oy + 3, c);
            px(g, ox + 3, oy + 2, c);
            px(g, ox + 3, oy + 4, c);
            px(g, ox + 3, oy + 3, '#ffd23b');
        }
        else if (d < 0.12) {
            px(g, ox + 2, oy + 5, G4);
            px(g, ox + 3, oy + 4, G3);
            px(g, ox + 4, oy + 5, G4);
            px(g, ox + 5, oy + 4, G3);
        }
    }
    function penFloor(g, ox, oy, tx, ty) {
        rect(g, ox, oy, TILE, TILE, '#c9a462');
        for (var i = 0; i < 3; i++) {
            var x = Math.floor(hash(tx * 3 + i, ty, 5) * 7), y = Math.floor(hash(tx, ty * 3 + i, 5) * 8);
            rect(g, ox + x, oy + y, 2, 1, i % 2 ? '#e8c983' : '#a8844a');
        }
    }
    function fence(g, ox, oy, tx, ty, grid) {
        var isF = function (x, y) { return y >= 0 && y < ROWS && x >= 0 && x < COLS && (grid[y][x] === T.FENCE || grid[y][x] === T.GATE); };
        var h = isF(tx - 1, ty) || isF(tx + 1, ty);
        var v = isF(tx, ty - 1) || isF(tx, ty + 1);
        if (h) {
            rect(g, ox, oy + 2, TILE, 2, '#8a5a2c');
            rect(g, ox, oy + 5, TILE, 2, '#8a5a2c');
            rect(g, ox, oy + 2, TILE, 1, '#c98a4a');
            rect(g, ox, oy + 5, TILE, 1, '#c98a4a');
        }
        if (v || !h) {
            rect(g, ox + 3, oy, 2, TILE, '#8a5a2c');
            rect(g, ox + 3, oy, 1, TILE, '#c98a4a');
        }
        rect(g, ox + 2, oy + 1, 4, 6, K);
        rect(g, ox + 3, oy + 1, 2, 5, '#a8703a');
        px(g, ox + 3, oy + 1, '#e3a45f');
    }
    function gate(g, ox, oy) {
        rect(g, ox + 1, oy, 6, TILE, K);
        rect(g, ox + 2, oy, 4, TILE, '#6b6f7a');
        for (var y = 1; y < 8; y += 3)
            rect(g, ox + 2, oy + y, 4, 1, '#9aa0ad');
    }
    function bush(g, ox, oy) {
        rect(g, ox, oy + 1, 8, 7, K);
        rect(g, ox + 1, oy + 1, 6, 6, '#2f7a24');
        rect(g, ox + 1, oy + 1, 5, 2, '#46a336');
        px(g, ox + 2, oy + 2, '#7dcf4a');
        px(g, ox + 5, oy + 4, '#46a336');
        px(g, ox + 3, oy + 4, '#ff3b3b');
        px(g, ox + 5, oy + 2, '#ff3b3b');
    }
    function rock(g, ox, oy) {
        rect(g, ox + 1, oy + 2, 6, 6, K);
        rect(g, ox + 1, oy + 2, 5, 5, '#9aa0ad');
        rect(g, ox + 1, oy + 2, 4, 2, '#c9ccd4');
        px(g, ox + 4, oy + 5, '#6b6f7a');
    }
    function hay(g, ox, oy) {
        rect(g, ox, oy + 1, 8, 7, K);
        rect(g, ox, oy + 1, 7, 6, '#e8c040');
        rect(g, ox, oy + 1, 7, 1, '#fff1a0');
        for (var x = 1; x < 7; x += 2)
            rect(g, ox + x, oy + 2, 1, 4, '#c29a2a');
        rect(g, ox, oy + 4, 7, 1, '#8a5a2c');
    }
    function water(g, ox, oy, tx, ty, grid) {
        rect(g, ox, oy, TILE, TILE, '#2f8bff');
        var isW = function (x, y) { return grid[y] && grid[y][x] === T.WATER; };
        if (!isW(tx, ty - 1))
            rect(g, ox, oy, TILE, 2, '#9ccbff');
        if (!isW(tx, ty + 1))
            rect(g, ox, oy + 6, TILE, 2, '#1a3fa8');
        if (!isW(tx - 1, ty))
            rect(g, ox, oy, 1, TILE, '#1a3fa8');
        if (!isW(tx + 1, ty))
            rect(g, ox + 7, oy, 1, TILE, '#1a3fa8');
        px(g, ox + 3, oy + 4, '#ffffff');
        px(g, ox + 4, oy + 4, '#9ccbff');
    }
    function tree(g, ox, oy) {
        rect(g, ox + 3, oy + 3, 2, 5, '#5a3a22');
        rect(g, ox - 2, oy - 6, 12, 10, K);
        rect(g, ox - 1, oy - 5, 10, 8, '#2f7a24');
        rect(g, ox, oy - 5, 7, 3, '#46a336');
        px(g, ox + 1, oy - 4, '#7dcf4a');
        px(g, ox + 6, oy - 1, '#46a336');
    }
    function renderMap(map, usedSlots) {
        var e_1, _a;
        var c = canvas(COLS * TILE, ROWS * TILE);
        var g = c.getContext('2d');
        var grid = map.grid;
        var inPen = function (x, y) { return S.PENS.findIndex(function (p) { return x >= p.tx && x < p.tx + p.tw && y >= p.ty && y < p.ty + p.th; }); };
        for (var y = 0; y < ROWS; y++)
            for (var x = 0; x < COLS; x++) {
                var pi = inPen(x, y);
                if (pi >= 0)
                    penFloor(g, x * TILE, y * TILE, x, y);
                else
                    grass(g, x * TILE, y * TILE, x, y, map.seed % 1000);
            }
        g.fillStyle = 'rgba(20,60,10,0.35)';
        for (var y = 0; y < ROWS; y++)
            for (var x = 0; x < COLS; x++) {
                var t = grid[y][x];
                if (t === T.BUSH || t === T.ROCK || t === T.HAY)
                    g.fillRect(x * TILE + 2, y * TILE + 3, TILE, TILE);
            }
        var trees = [];
        for (var y = 0; y < ROWS; y++)
            for (var x = 0; x < COLS; x++) {
                var t = grid[y][x], ox = x * TILE, oy = y * TILE;
                if (t === T.FENCE)
                    fence(g, ox, oy, x, y, grid);
                else if (t === T.GATE)
                    gate(g, ox, oy);
                else if (t === T.BUSH)
                    bush(g, ox, oy);
                else if (t === T.ROCK)
                    rock(g, ox, oy);
                else if (t === T.HAY)
                    hay(g, ox, oy);
                else if (t === T.WATER)
                    water(g, ox, oy, x, y, grid);
                else if (t === T.TREE)
                    trees.push([ox, oy]);
            }
        try {
            for (var trees_1 = __values(trees), trees_1_1 = trees_1.next(); !trees_1_1.done; trees_1_1 = trees_1.next()) {
                var _b = __read(trees_1_1.value, 2), ox = _b[0], oy = _b[1];
                tree(g, ox, oy);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (trees_1_1 && !trees_1_1.done && (_a = trees_1.return)) _a.call(trees_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        S.PENS.forEach(function (p, slot) {
            if (!usedSlots.includes(slot))
                return;
            var pc = ROOM.PLAYERS[slot];
            var fx = (p.dir > 0 ? p.tx + p.tw : p.tx - 1) * TILE + 3;
            var fy = (p.wallY > p.ty ? p.wallY : p.wallY) * TILE - 9;
            rect(g, fx, fy, 1, 12, K);
            rect(g, fx + 1, fy, 6, 4, K);
            rect(g, fx + 1, fy + 1, 5, 2, pc.color);
            g.fillStyle = pc.color;
            g.globalAlpha = 0.18;
            g.fillRect(p.x, p.y, p.w, p.h);
            g.globalAlpha = 1;
        });
        return c;
    }
    window.SheepArt = { sheep: sheep, gold: gold, wolf: wolf, dogs: dogs, renderMap: renderMap };
})();

/* ---- js/games/sheep/bots.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
(function () {
    'use strict';
    var S = SHEEP;
    var TILE = S.TILE, COLS = S.COLS, ROWS = S.ROWS;
    var rand = function (a, b) { return a + Math.random() * (b - a); };
    function bfs(map, sx, sy, gx, gy) {
        var e_1, _a;
        var prev = new Int32Array(COLS * ROWS).fill(-1);
        var start = sy * COLS + sx, goal = gy * COLS + gx;
        if (start === goal)
            return [];
        prev[start] = start;
        var q = [start];
        for (var i = 0; i < q.length; i++) {
            var c = q[i];
            if (c === goal)
                break;
            var cx = c % COLS, cy = (c / COLS) | 0;
            try {
                for (var _b = (e_1 = void 0, __values([[1, 0], [-1, 0], [0, 1], [0, -1]])), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), dx = _d[0], dy = _d[1];
                    var nx = cx + dx, ny = cy + dy;
                    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS)
                        continue;
                    var n = ny * COLS + nx;
                    if (prev[n] !== -1 || SheepMap.solid(map.grid[ny][nx]))
                        continue;
                    prev[n] = c;
                    q.push(n);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        if (prev[goal] === -1)
            return null;
        var path = [];
        for (var c = goal; c !== start; c = prev[c])
            path.push([c % COLS, (c / COLS) | 0]);
        return path.reverse();
    }
    function go(game, d, gx, gy, dt) {
        var b = d.bot;
        b.repath -= dt;
        var tx = Math.floor(d.x / TILE), ty = Math.floor(d.y / TILE);
        var gtx = Math.max(0, Math.min(COLS - 1, Math.floor(gx / TILE))), gty = Math.max(0, Math.min(ROWS - 1, Math.floor(gy / TILE)));
        if (b.repath <= 0 || !b.path) {
            b.repath = rand(0.3, 0.5);
            b.path = bfs(game.map, tx, ty, gtx, gty) || [];
        }
        while (b.path.length && b.path[0][0] === tx && b.path[0][1] === ty)
            b.path.shift();
        var wx = gx, wy = gy;
        if (b.path.length) {
            wx = b.path[0][0] * TILE + 4;
            wy = b.path[0][1] * TILE + 4;
        }
        var dx = wx - d.x, dy = wy - d.y, dist = Math.hypot(dx, dy);
        if (dist > 1.5) {
            d.input.x = dx / dist * b.pace;
            d.input.y = dy / dist * b.pace;
        }
        return Math.hypot(gx - d.x, gy - d.y);
    }
    function pickTarget(game, d) {
        var e_2, _a;
        var own = S.PENS[d.slot];
        var best = null, bs = 1e9;
        try {
            for (var _b = __values(game.sheep), _c = _b.next(); !_c.done; _c = _b.next()) {
                var s = _c.value;
                if (s.pen === d.slot)
                    continue;
                if (s.followDog === d)
                    continue;
                var score = Math.hypot(s.x - d.x, s.y - d.y) + 0.6 * Math.hypot(s.x - own.gateX, s.y - own.gateY);
                if (s.golden)
                    score -= 80;
                if (s.pen >= 0)
                    score += 120;
                if (s.followDog && s.followDog !== d)
                    score += 40;
                score += rand(0, 30);
                if (score < bs) {
                    bs = score;
                    best = s;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return best;
    }
    function think(game, d, dt) {
        if (!d.bot)
            d.bot = { mode: 'fetch', target: null, retarget: 0, path: null, repath: 0, leadT: 0, barkWait: rand(0.6, 1.2), pace: rand(0.8, 0.95) };
        var b = d.bot;
        d.input.x = 0;
        d.input.y = 0;
        var own = S.PENS[d.slot];
        var inside = function (x, y) { return x >= own.x && x < own.x + own.w && y >= own.y && y < own.y + own.h; };
        var w = game.wolf;
        if (w && !w.leaving && Math.hypot(w.x - d.x, w.y - d.y) < S.BARK_R)
            d.input.bark = true;
        if (b.mode === 'fetch') {
            b.retarget -= dt;
            if (!b.target || b.retarget <= 0 || game.sheep.indexOf(b.target) < 0 || b.target.pen === d.slot) {
                b.target = pickTarget(game, d);
                b.retarget = 2.5;
            }
            if (!b.target) {
                go(game, d, own.gateX + own.dir * 30, own.gateY, dt);
                return;
            }
            var dist = go(game, d, b.target.x, b.target.y, dt);
            if (dist < S.BARK_R * 0.55) {
                d.input.bark = true;
                b.mode = 'lead';
                b.leadT = 9;
                b.barkWait = rand(0.8, 1.3);
            }
        }
        else if (b.mode === 'lead') {
            b.leadT -= dt;
            var followers = game.sheep.filter(function (s) { return s.followDog === d; });
            var passedGate = (own.dir > 0 ? d.x < own.gateX : d.x > own.gateX);
            var gx = passedGate ? own.centerX - own.dir * 14 : own.gateX - own.dir * 4;
            var gy = passedGate ? own.centerY : own.gateY;
            var far = followers.length && followers.every(function (s) { return Math.hypot(s.x - d.x, s.y - d.y) > 30; });
            if (!far)
                go(game, d, gx, gy, dt);
            b.barkWait -= dt;
            if (b.barkWait <= 0) {
                b.barkWait = rand(0.9, 1.4);
                if (followers.length || !passedGate)
                    d.input.bark = true;
            }
            if ((passedGate && inside(d.x, d.y) && Math.hypot(gx - d.x, gy - d.y) < 10) || b.leadT <= 0 || (!followers.length && b.leadT < 7)) {
                b.mode = 'exit';
            }
        }
        else if (b.mode === 'exit') {
            var dist = go(game, d, own.gateX + own.dir * 22, own.gateY + (Math.random() < 0.5 ? -1 : 1), dt);
            if (dist < 8) {
                b.mode = 'fetch';
                b.target = null;
            }
        }
    }
    window.SheepBots = { think: think };
})();

/* ---- js/games/sheep/game.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function () {
    'use strict';
    var S = SHEEP;
    var rand = function (a, b) { return a + Math.random() * (b - a); };
    var SheepGame = (function () {
        function SheepGame(defs, emit) {
            this.emit = emit || (function () { });
            this.used = defs.map(function (d) { return d.slot; });
            this.map = SheepMap.generate(this.used);
            this.mapCanvas = SheepArt.renderMap(this.map, this.used);
            this.dogs = defs.map(function (d) {
                var p = S.PENS[d.slot];
                return {
                    slot: d.slot, name: d.name, isBot: !!d.isBot, connected: true,
                    x: p.spawnX, y: p.spawnY, vx: 0, vy: 0, left: p.dir < 0, moving: false, walkT: 0,
                    input: { x: 0, y: 0, bark: false, dash: false },
                    barkCd: 0, dashCd: 0, dashT: 0, barkT: 0, score: 0, bot: null,
                };
            });
            this.sheep = [];
            var open = this.map.open().filter(function (t) { return t.tx > 13 && t.tx < S.COLS - 14; });
            for (var i = 0; i < S.SHEEP_COUNT; i++)
                this.addSheep(open, false);
            this.wolf = null;
            this.wolfTimer = S.WOLF_FIRST;
            this.goldTimer = 6;
            this.waveT = 0;
            this.respawnQueue = [];
            this.rings = [];
            this.texts = [];
            this.particles = [];
            this.banner = null;
            this.state = 'countdown';
            this.countdown = 3.999;
            this.lastTick = 4;
            this.time = S.MATCH_TIME;
            this.clock = 0;
            this.shake = 0;
        }
        SheepGame.prototype.addSheep = function (open, golden, at) {
            var t = at || open[Math.floor(Math.random() * open.length)];
            this.sheep.push({
                x: t.x + rand(-2, 2), y: t.y + rand(-2, 2), vx: 0, vy: 0,
                golden: golden,
                heading: rand(0, Math.PI * 2), wanderT: rand(0, 2), graze: rand(0, 2),
                followDog: null, followT: 0, fleeT: 0, left: Math.random() < 0.5, walkT: 0,
                pen: -1, alertT: 0, bleatT: rand(3, 15),
            });
        };
        SheepGame.prototype.update = function (dt) {
            var e_1, _a, e_2, _b, e_3, _c, e_4, _d, e_5, _e;
            this.clock += dt;
            this.shake = Math.max(0, this.shake - dt * 8);
            if (this.state === 'countdown') {
                this.countdown -= dt;
                var n = Math.ceil(this.countdown);
                if (n !== this.lastTick && n >= 1 && n <= 3) {
                    this.lastTick = n;
                    this.emit('sfx', 'beep');
                }
                if (this.countdown <= 0) {
                    this.state = 'play';
                    this.showBanner('VIA!', '#ffd23b', 1.2);
                    this.emit('sfx', 'go');
                    this.emit('announce', ['Via!', { lang: 'it-IT', pitch: 0.8 }]);
                    this.emit('music', true);
                }
            }
            else if (this.state === 'play') {
                var before = Math.ceil(this.time);
                this.time = Math.max(0, this.time - dt);
                var after = Math.ceil(this.time);
                if (before !== after) {
                    if (after === 60)
                        this.showBanner('ULTIMO MINUTO!', '#ff9c3b', 1.4);
                    if (after === 10)
                        this.showBanner('ULTIMI 10 SECONDI!', '#ff9c3b', 1.4);
                    if (after <= 5 && after > 0)
                        this.emit('sfx', 'tick');
                }
                try {
                    for (var _f = __values(this.dogs), _g = _f.next(); !_g.done; _g = _f.next()) {
                        var d = _g.value;
                        if (d.isBot)
                            SheepBots.think(this, d, dt);
                        this.updateDog(d, dt);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_g && !_g.done && (_a = _f.return)) _a.call(_f);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                this.updateWolf(dt);
                this.updateGold(dt);
                if (this.time <= 0)
                    this.end();
            }
            try {
                for (var _h = __values(this.sheep), _j = _h.next(); !_j.done; _j = _h.next()) {
                    var s = _j.value;
                    this.updateSheep(s, dt);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_j && !_j.done && (_b = _h.return)) _b.call(_h);
                }
                finally { if (e_2) throw e_2.error; }
            }
            this.separate();
            this.updateScores();
            try {
                for (var _k = __values(this.rings), _l = _k.next(); !_l.done; _l = _k.next()) {
                    var r = _l.value;
                    r.t += dt;
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_l && !_l.done && (_c = _k.return)) _c.call(_k);
                }
                finally { if (e_3) throw e_3.error; }
            }
            this.rings = this.rings.filter(function (r) { return r.t < 0.5; });
            try {
                for (var _m = __values(this.texts), _o = _m.next(); !_o.done; _o = _m.next()) {
                    var t = _o.value;
                    t.t += dt;
                    t.y -= dt * 12;
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_o && !_o.done && (_d = _m.return)) _d.call(_m);
                }
                finally { if (e_4) throw e_4.error; }
            }
            this.texts = this.texts.filter(function (t) { return t.t < t.dur; });
            try {
                for (var _p = __values(this.particles), _q = _p.next(); !_q.done; _q = _p.next()) {
                    var p = _q.value;
                    p.life -= dt;
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.vz -= 200 * dt;
                    p.z = Math.max(0, p.z + p.vz * dt);
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_q && !_q.done && (_e = _p.return)) _e.call(_p);
                }
                finally { if (e_5) throw e_5.error; }
            }
            this.particles = this.particles.filter(function (p) { return p.life > 0; });
            if (this.banner) {
                this.banner.t += dt;
                if (this.banner.t > this.banner.dur)
                    this.banner = null;
            }
        };
        SheepGame.prototype.updateDog = function (d, dt) {
            d.barkCd = Math.max(0, d.barkCd - dt);
            d.dashCd = Math.max(0, d.dashCd - dt);
            d.dashT = Math.max(0, d.dashT - dt);
            d.barkT = Math.max(0, d.barkT - dt);
            var inp = d.connected || d.isBot ? d.input : { x: 0, y: 0 };
            var mag = Math.min(1, Math.hypot(inp.x, inp.y));
            d.moving = mag > 0.2;
            if (d.moving) {
                var a = Math.atan2(inp.y, inp.x);
                var k = Math.min(1, (mag - 0.2) / 0.45);
                var sp = S.DOG_SPEED * (0.5 + 0.5 * k) * (d.dashT > 0 ? S.DASH_MULT : 1);
                d.vx = Math.cos(a) * sp;
                d.vy = Math.sin(a) * sp;
                this.move(d, d.vx * dt, d.vy * dt, 3);
                if (Math.abs(d.vx) > 4)
                    d.left = d.vx < 0;
                d.walkT += dt * (d.dashT > 0 ? 2 : 1);
                if (d.dashT > 0 && Math.random() < 0.5)
                    this.particles.push({ x: d.x, y: d.y, z: 0, vx: rand(-10, 10), vy: rand(-5, 5), vz: 20, life: 0.3, color: '#c9a462' });
            }
            else {
                d.vx = 0;
                d.vy = 0;
            }
            if (inp.bark) {
                inp.bark = false;
                this.bark(d);
            }
            if (inp.dash) {
                inp.dash = false;
                if (d.dashCd <= 0) {
                    d.dashT = S.DASH_TIME;
                    d.dashCd = S.DASH_CD;
                    this.emit('sfx', 'dash');
                }
            }
        };
        SheepGame.prototype.bark = function (d) {
            var e_6, _a;
            if (d.barkCd > 0 || this.state !== 'play')
                return;
            d.barkCd = S.BARK_CD;
            d.barkT = 0.35;
            this.rings.push({ x: d.x, y: d.y - 4, slot: d.slot, t: 0 });
            this.emit('sfx', 'bark');
            var n = 0;
            try {
                for (var _b = __values(this.sheep), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var s = _c.value;
                    if (Math.hypot(s.x - d.x, s.y - d.y) < S.BARK_R) {
                        s.followDog = d;
                        s.followT = S.ATTRACT_TIME;
                        s.fleeT = 0;
                        s.alertT = 0.4;
                        n++;
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_6) throw e_6.error; }
            }
            if (this.wolf && !this.wolf.leaving && Math.hypot(this.wolf.x - d.x, this.wolf.y - d.y) < S.BARK_R * 1.25) {
                this.wolf.leaving = true;
                this.wolf.scaredBy = d;
                this.floatText(this.wolf.x, this.wolf.y - 14, 'CAI CAI!', '#ffffff');
                this.emit('sfx', 'whimper');
            }
            return n;
        };
        SheepGame.prototype.updateSheep = function (s, dt) {
            var e_7, _a, e_8, _b;
            s.followT = Math.max(0, s.followT - dt);
            s.fleeT = Math.max(0, s.fleeT - dt);
            s.alertT = Math.max(0, s.alertT - dt);
            if (s.followT <= 0)
                s.followDog = null;
            var dx = 0, dy = 0, speed = 0;
            var fx = 0, fy = 0, scared = false;
            if (this.state === 'play') {
                try {
                    for (var _c = __values(this.dogs), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var d = _d.value;
                        if (d === s.followDog || !d.moving)
                            continue;
                        var r = d.dashT > 0 ? S.DASH_SCARE_R : S.SCARE_R;
                        var dist = Math.hypot(s.x - d.x, s.y - d.y);
                        if (dist < r && dist > 0.1) {
                            fx += (s.x - d.x) / dist * (r - dist);
                            fy += (s.y - d.y) / dist * (r - dist);
                            scared = true;
                        }
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
                var w = this.wolf;
                if (w && !w.leaving) {
                    var dist = Math.hypot(s.x - w.x, s.y - w.y);
                    if (dist < S.WOLF_FEAR_R && dist > 0.1) {
                        fx += (s.x - w.x) / dist * 60;
                        fy += (s.y - w.y) / dist * 60;
                        scared = true;
                    }
                }
            }
            if (scared) {
                if (s.fleeT <= 0)
                    s.alertT = 0.5;
                s.fleeT = 0.6;
                if (s.followDog && Math.random() < 0.05) {
                    s.followDog = null;
                    s.followT = 0;
                }
            }
            if (s.fleeT > 0 && (fx || fy)) {
                var m = Math.hypot(fx, fy);
                dx = fx / m;
                dy = fy / m;
                speed = S.SHEEP_FLEE_SPEED;
                s.heading = Math.atan2(dy, dx);
            }
            else if (s.followDog) {
                var d = s.followDog;
                var dist = Math.hypot(d.x - s.x, d.y - s.y);
                if (dist > S.FOLLOW_DIST) {
                    dx = (d.x - s.x) / dist;
                    dy = (d.y - s.y) / dist;
                    speed = Math.min(S.SHEEP_FOLLOW_SPEED, 20 + dist * 1.2);
                }
            }
            else {
                s.wanderT -= dt;
                if (s.wanderT <= 0) {
                    s.wanderT = rand(1, 3);
                    s.graze = Math.random() < 0.45 ? rand(0.8, 2.5) : 0;
                    s.heading += rand(-1.2, 1.2);
                }
                s.graze = Math.max(0, s.graze - dt);
                var cx = 0, cy = 0, n = 0;
                try {
                    for (var _e = __values(this.sheep), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var o = _f.value;
                        if (o === s)
                            continue;
                        var dd = Math.abs(o.x - s.x) + Math.abs(o.y - s.y);
                        if (dd < 36) {
                            cx += o.x;
                            cy += o.y;
                            n++;
                        }
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_8) throw e_8.error; }
                }
                dx = Math.cos(s.heading);
                dy = Math.sin(s.heading);
                if (n && s.pen < 0) {
                    cx /= n;
                    cy /= n;
                    var cd = Math.hypot(cx - s.x, cy - s.y);
                    if (cd > 10) {
                        dx += (cx - s.x) / cd * 0.6;
                        dy += (cy - s.y) / cd * 0.6;
                    }
                }
                if (s.pen >= 0) {
                    var p = S.PENS[s.pen];
                    dx += (p.centerX - s.x) * 0.02;
                    dy += (p.centerY - s.y) * 0.02;
                }
                var m = Math.hypot(dx, dy) || 1;
                dx /= m;
                dy /= m;
                speed = s.graze > 0 ? 0 : S.SHEEP_SPEED * (s.pen >= 0 ? 0.4 : 0.6);
            }
            var k = Math.min(1, dt * 6);
            s.vx += (dx * speed - s.vx) * k;
            s.vy += (dy * speed - s.vy) * k;
            var ox = s.x, oy = s.y;
            this.move(s, s.vx * dt, s.vy * dt, 2.5);
            if (Math.abs(s.x - ox) < Math.abs(s.vx * dt) * 0.3 && Math.abs(s.y - oy) < Math.abs(s.vy * dt) * 0.3)
                s.heading += rand(1, 2.5);
            var sp = Math.hypot(s.vx, s.vy);
            if (sp > 3) {
                s.left = s.vx < 0;
                s.walkT += dt * sp / 20;
            }
            s.bleatT -= dt;
            if (s.bleatT <= 0) {
                s.bleatT = rand(8, 20);
                if (this.state === 'play' && Math.random() < 0.35) {
                    this.floatText(s.x, s.y - 10, 'BEEE', '#ffffff');
                    this.emit('sfx', 'baa');
                }
            }
        };
        SheepGame.prototype.separate = function () {
            var e_9, _a, e_10, _b;
            var all = this.sheep;
            for (var i = 0; i < all.length; i++)
                for (var j = i + 1; j < all.length; j++) {
                    var a = all[i], b = all[j];
                    var dx = b.x - a.x, dy = b.y - a.y;
                    if (Math.abs(dx) > 7 || Math.abs(dy) > 7)
                        continue;
                    var d = Math.hypot(dx, dy);
                    if (d > 0.01 && d < 6.5) {
                        var p = (6.5 - d) / 2, nx = dx / d, ny = dy / d;
                        this.move(a, -nx * p, -ny * p, 2.5);
                        this.move(b, nx * p, ny * p, 2.5);
                    }
                }
            try {
                for (var _c = __values(this.dogs), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var d = _d.value;
                    try {
                        for (var all_1 = (e_10 = void 0, __values(all)), all_1_1 = all_1.next(); !all_1_1.done; all_1_1 = all_1.next()) {
                            var s = all_1_1.value;
                            var dx = s.x - d.x, dy = s.y - d.y, dd = Math.hypot(dx, dy);
                            if (dd > 0.01 && dd < 6)
                                this.move(s, dx / dd * (6 - dd), dy / dd * (6 - dd), 2.5);
                        }
                    }
                    catch (e_10_1) { e_10 = { error: e_10_1 }; }
                    finally {
                        try {
                            if (all_1_1 && !all_1_1.done && (_b = all_1.return)) _b.call(all_1);
                        }
                        finally { if (e_10) throw e_10.error; }
                    }
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_9) throw e_9.error; }
            }
        };
        SheepGame.prototype.collides = function (x, y, h) {
            var m = this.map;
            return m.solid(x - h, y - h) || m.solid(x + h - 0.01, y - h) || m.solid(x - h, y + h - 0.01) || m.solid(x + h - 0.01, y + h - 0.01);
        };
        SheepGame.prototype.move = function (o, dx, dy, h) {
            var e_11, _a, e_12, _b;
            if (!this.collides(o.x + dx, o.y, h))
                o.x += dx;
            else
                try {
                    for (var _c = __values([1, -1, 2, -2, 3, -3]), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var n = _d.value;
                        if (!this.collides(o.x + dx, o.y + n, h)) {
                            o.y += Math.sign(n) * Math.min(Math.abs(dx), 1);
                            break;
                        }
                    }
                }
                catch (e_11_1) { e_11 = { error: e_11_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    }
                    finally { if (e_11) throw e_11.error; }
                }
            if (!this.collides(o.x, o.y + dy, h))
                o.y += dy;
            else
                try {
                    for (var _e = __values([1, -1, 2, -2, 3, -3]), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var n = _f.value;
                        if (!this.collides(o.x + n, o.y + dy, h)) {
                            o.x += Math.sign(n) * Math.min(Math.abs(dy), 1);
                            break;
                        }
                    }
                }
                catch (e_12_1) { e_12 = { error: e_12_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_12) throw e_12.error; }
                }
        };
        SheepGame.prototype.penOf = function (x, y) {
            for (var i = 0; i < S.PENS.length; i++) {
                var p = S.PENS[i];
                if (x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h)
                    return i;
            }
            return -1;
        };
        SheepGame.prototype.updateScores = function () {
            var e_13, _a, e_14, _b;
            var sc = [0, 0, 0, 0];
            var _loop_1 = function (s) {
                var p = this_1.penOf(s.x, s.y);
                if (p !== s.pen) {
                    if (p >= 0) {
                        s.followDog = null;
                        s.followT = 0;
                    }
                    if (p >= 0 && this_1.state === 'play') {
                        var d = this_1.dogs.find(function (x) { return x.slot === p; });
                        var v = s.golden ? S.GOLDEN_VALUE : 1;
                        if (d) {
                            this_1.floatText(s.x, s.y - 12, '+' + v, ROOM.PLAYERS[p].light);
                            this_1.emit('sfx', s.golden ? 'golden' : 'point');
                            this_1.emit('buzz', { d: d, pattern: [25] });
                            this_1.emit('point', d);
                        }
                    }
                    else if (s.pen >= 0 && p < 0 && this_1.state === 'play') {
                        var d = this_1.dogs.find(function (x) { return x.slot === s.pen; });
                        if (d)
                            this_1.floatText(s.x, s.y - 12, '-' + (s.golden ? S.GOLDEN_VALUE : 1), '#ff5a5a');
                    }
                    s.pen = p;
                }
                if (p >= 0)
                    sc[p] += s.golden ? S.GOLDEN_VALUE : 1;
            };
            var this_1 = this;
            try {
                for (var _c = __values(this.sheep), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var s = _d.value;
                    _loop_1(s);
                }
            }
            catch (e_13_1) { e_13 = { error: e_13_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_13) throw e_13.error; }
            }
            try {
                for (var _e = __values(this.dogs), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var d = _f.value;
                    if (d.score !== sc[d.slot]) {
                        d.score = sc[d.slot];
                        this.emit('hud', d);
                    }
                }
            }
            catch (e_14_1) { e_14 = { error: e_14_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                }
                finally { if (e_14) throw e_14.error; }
            }
        };
        SheepGame.prototype.updateGold = function (dt) {
            var e_15, _a, e_16, _b;
            var free = this.sheep.filter(function (s) { return s.pen < 0; }).length + this.respawnQueue.length;
            if (this.waveT > 0) {
                this.waveT -= dt;
                if (this.waveT <= 0) {
                    var open_1 = this.map.open().filter(function (t) { return t.tx > 14 && t.tx < S.COLS - 15; });
                    var n = Math.min(S.WAVE_SIZE, S.MAX_SHEEP - this.sheep.length);
                    for (var i = 0; i < n; i++) {
                        this.addSheep(open_1, false);
                        var sh = this.sheep[this.sheep.length - 1];
                        this.puff(sh.x, sh.y, '#ffffff');
                    }
                    this.emit('sfx', 'baa');
                }
            }
            else if (free <= S.WAVE_MIN_FREE && this.sheep.length < S.MAX_SHEEP && this.time > 8) {
                this.waveT = 2;
                this.showBanner('NUOVO GREGGE!', '#ffffff', 1.6);
                this.emit('sfx', 'golden');
            }
            this.goldTimer -= dt;
            try {
                for (var _c = __values(this.respawnQueue), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var r = _d.value;
                    r.t -= dt;
                }
            }
            catch (e_15_1) { e_15 = { error: e_15_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_15) throw e_15.error; }
            }
            var ready = this.respawnQueue.filter(function (r) { return r.t <= 0; });
            this.respawnQueue = this.respawnQueue.filter(function (r) { return r.t > 0; });
            var open = this.map.open().filter(function (t) { return t.tx > 14 && t.tx < S.COLS - 15; });
            try {
                for (var ready_1 = __values(ready), ready_1_1 = ready_1.next(); !ready_1_1.done; ready_1_1 = ready_1.next()) {
                    var r = ready_1_1.value;
                    this.addSheep(open, r.golden);
                    var s = this.sheep[this.sheep.length - 1];
                    this.puff(s.x, s.y, '#ffffff');
                    this.emit('sfx', 'baa');
                }
            }
            catch (e_16_1) { e_16 = { error: e_16_1 }; }
            finally {
                try {
                    if (ready_1_1 && !ready_1_1.done && (_b = ready_1.return)) _b.call(ready_1);
                }
                finally { if (e_16) throw e_16.error; }
            }
            if (this.goldTimer <= 0) {
                this.goldTimer = S.GOLDEN_EVERY;
                var loose = this.sheep.filter(function (s) { return s.golden && s.pen < 0; }).length;
                if (!loose) {
                    this.addSheep(open, true);
                    var s = this.sheep[this.sheep.length - 1];
                    this.puff(s.x, s.y, '#ffe14a');
                    this.floatText(s.x, s.y - 14, 'PECORA D\'ORO!', '#ffe14a');
                    this.emit('sfx', 'golden');
                }
            }
        };
        SheepGame.prototype.updateWolf = function (dt) {
            var e_17, _a;
            this.wolfTimer -= dt;
            if (!this.wolf && this.wolfTimer <= 0 && this.time > 12) {
                this.wolfTimer = S.WOLF_EVERY;
                var top = Math.random() < 0.5;
                this.wolf = { x: S.MAP_W / 2 + rand(-40, 40), y: top ? 12 : S.MAP_H - 12, vx: 0, vy: 0, life: S.WOLF_LIFE, leaving: false, left: false, walkT: 0, target: null, eaten: 0 };
                this.showBanner('ARRIVA IL LUPO!', '#ff3b3b', 1.6);
                this.emit('sfx', 'howl');
                this.shake = 2;
            }
            var w = this.wolf;
            if (!w)
                return;
            w.life -= dt;
            if (w.life <= 0)
                w.leaving = true;
            var tx, ty;
            if (w.leaving) {
                tx = w.x;
                ty = w.y < S.MAP_H / 2 ? -20 : S.MAP_H + 20;
                if (w.scaredBy) {
                    tx = w.x + (w.x - w.scaredBy.x) * 2;
                }
            }
            else {
                var best = null, bd = 1e9;
                try {
                    for (var _b = __values(this.sheep), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var s = _c.value;
                        if (s.pen >= 0)
                            continue;
                        var d_1 = Math.hypot(s.x - w.x, s.y - w.y);
                        if (d_1 < bd) {
                            bd = d_1;
                            best = s;
                        }
                    }
                }
                catch (e_17_1) { e_17 = { error: e_17_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_17) throw e_17.error; }
                }
                if (best) {
                    tx = best.x;
                    ty = best.y;
                    if (bd < 5)
                        this.eat(best);
                }
                else {
                    tx = S.MAP_W / 2;
                    ty = S.MAP_H / 2;
                }
            }
            var dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy) || 1;
            var sp = S.WOLF_SPEED * (w.leaving ? 1.4 : 1);
            w.vx = dx / d * sp;
            w.vy = dy / d * sp;
            if (w.leaving) {
                w.x += w.vx * dt;
                w.y += w.vy * dt;
            }
            else
                this.move(w, w.vx * dt, w.vy * dt, 3);
            w.left = w.vx < 0;
            w.walkT += dt * 1.5;
            if (w.leaving && (w.y < -16 || w.y > S.MAP_H + 16 || w.x < -16 || w.x > S.MAP_W + 16))
                this.wolf = null;
        };
        SheepGame.prototype.eat = function (s) {
            this.sheep.splice(this.sheep.indexOf(s), 1);
            this.respawnQueue.push({ t: S.SHEEP_RESPAWN, golden: false });
            this.puff(s.x, s.y, s.golden ? '#ffe14a' : '#ffffff');
            this.floatText(s.x, s.y - 12, 'GNAM!', '#ff5a5a');
            this.emit('sfx', 'chomp');
            this.shake = 2;
            this.wolf.leaving = true;
        };
        SheepGame.prototype.end = function () {
            var e_18, _a;
            if (this.state === 'over')
                return;
            this.state = 'over';
            try {
                for (var _b = __values(this.sheep), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var s = _c.value;
                    s.followDog = null;
                }
            }
            catch (e_18_1) { e_18 = { error: e_18_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_18) throw e_18.error; }
            }
            this.showBanner('TEMPO!', '#ffd23b', 2);
            this.emit('sfx', 'whistle');
            this.emit('music', false);
            this.emit('over', this.ranking());
        };
        SheepGame.prototype.ranking = function () {
            return this.dogs.slice().sort(function (a, b) { return b.score - a.score || a.slot - b.slot; });
        };
        SheepGame.prototype.showBanner = function (text, color, dur) { this.banner = { text: text, color: color, t: 0, dur: dur }; };
        SheepGame.prototype.floatText = function (x, y, text, color) { this.texts.push({ x: x, y: y, text: text, color: color, t: 0, dur: 0.9 }); };
        SheepGame.prototype.puff = function (x, y, color) {
            for (var i = 0; i < 12; i++) {
                var a = rand(0, Math.PI * 2), sp = rand(20, 50);
                this.particles.push({ x: x, y: y, z: 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: rand(30, 70), life: rand(0.4, 0.8), color: color, big: true });
            }
        };
        return SheepGame;
    }());
    window.SheepGame = SheepGame;
})();

/* ---- js/games/sheep/render.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
(function () {
    'use strict';
    var S = SHEEP;
    var K = '#1b1b26';
    var R = Math.round;
    var ctx = null;
    function init(canvas) {
        canvas.width = S.W;
        canvas.height = S.H;
        ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
    }
    function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(R(x), R(y), w, h); }
    function px(x, y, c) { ctx.fillStyle = c; ctx.fillRect(R(x), R(y), 1, 1); }
    function shadow(x, y, w) { rect(x - w, y, w * 2 + 1, 2, 'rgba(20,50,10,0.35)'); }
    function ring(cx, cy, r, c, step) {
        var n = Math.ceil(r * 6);
        for (var i = 0; i < n; i++) {
            if (step && i % step)
                continue;
            var a = (i / n) * Math.PI * 2;
            px(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.75, c);
        }
    }
    function draw(g, opts) {
        var e_1, _a, e_2, _b, e_3, _c, e_4, _d, e_5, _e, e_6, _f, e_7, _g;
        opts = opts || {};
        ctx.fillStyle = '#20152a';
        ctx.fillRect(0, 0, S.W, S.H);
        var sh = g.shake > 0.1 ? g.shake : 0;
        ctx.save();
        ctx.translate(sh ? R((Math.random() * 2 - 1) * sh) : 0, S.HUD_TOP + (sh ? R((Math.random() * 2 - 1) * sh) : 0));
        ctx.drawImage(g.mapCanvas, 0, 0);
        try {
            for (var _h = __values(g.dogs), _j = _h.next(); !_j.done; _j = _h.next()) {
                var d = _j.value;
                var p = S.PENS[d.slot];
                PixelFont.draw(ctx, String(d.score), p.centerX, p.centerY - 7, { color: ROOM.PLAYERS[d.slot].light, scale: 2, align: 'center', outline: null });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_j && !_j.done && (_a = _h.return)) _a.call(_h);
            }
            finally { if (e_1) throw e_1.error; }
        }
        try {
            for (var _k = __values(g.rings), _l = _k.next(); !_l.done; _l = _k.next()) {
                var r = _l.value;
                var k = r.t / 0.5;
                var col = ROOM.PLAYERS[r.slot].color;
                ring(r.x, r.y, 8 + k * S.BARK_R, col, 2);
                ring(r.x, r.y, 4 + k * S.BARK_R * 0.6, '#ffffff', 3);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_l && !_l.done && (_b = _k.return)) _b.call(_k);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var ents = [];
        var _loop_1 = function (s) {
            ents.push([s.y, function () { return drawSheep(s, g); }]);
        };
        try {
            for (var _m = __values(g.sheep), _o = _m.next(); !_o.done; _o = _m.next()) {
                var s = _o.value;
                _loop_1(s);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_o && !_o.done && (_c = _m.return)) _c.call(_m);
            }
            finally { if (e_3) throw e_3.error; }
        }
        var _loop_2 = function (d) {
            ents.push([d.y, function () { return drawDog(d, g); }]);
        };
        try {
            for (var _p = __values(g.dogs), _q = _p.next(); !_q.done; _q = _p.next()) {
                var d = _q.value;
                _loop_2(d);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_q && !_q.done && (_d = _p.return)) _d.call(_p);
            }
            finally { if (e_4) throw e_4.error; }
        }
        if (g.wolf)
            ents.push([g.wolf.y, function () { return drawWolf(g.wolf, g); }]);
        ents.sort(function (a, b) { return a[0] - b[0]; });
        try {
            for (var ents_1 = __values(ents), ents_1_1 = ents_1.next(); !ents_1_1.done; ents_1_1 = ents_1.next()) {
                var e = ents_1_1.value;
                e[1]();
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (ents_1_1 && !ents_1_1.done && (_e = ents_1.return)) _e.call(ents_1);
            }
            finally { if (e_5) throw e_5.error; }
        }
        try {
            for (var _r = __values(g.particles), _s = _r.next(); !_s.done; _s = _r.next()) {
                var p = _s.value;
                rect(p.x, p.y - p.z, p.big ? 2 : 1, p.big ? 2 : 1, p.color);
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_s && !_s.done && (_f = _r.return)) _f.call(_r);
            }
            finally { if (e_6) throw e_6.error; }
        }
        try {
            for (var _t = __values(g.texts), _u = _t.next(); !_u.done; _u = _t.next()) {
                var t = _u.value;
                if (t.t > t.dur * 0.7 && Math.floor(t.t * 20) % 2)
                    continue;
                PixelFont.draw(ctx, t.text, t.x, t.y, { color: t.color, align: 'center' });
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_u && !_u.done && (_g = _t.return)) _g.call(_t);
            }
            finally { if (e_7) throw e_7.error; }
        }
        ctx.restore();
        if (opts.demo)
            return;
        drawHUD(g, opts);
        drawCenter(g);
    }
    function drawSheep(s, g) {
        var art = s.golden ? SheepArt.gold : SheepArt.sheep;
        var moving = Math.hypot(s.vx, s.vy) > 3;
        var fr = moving && Math.floor(s.walkT * 8) % 2 ? art.b : art.a;
        var img = s.left ? fr.left : fr.right;
        shadow(s.x, s.y + 1, 4);
        var hop = moving && s.fleeT > 0 ? -(Math.floor(s.walkT * 8) % 2) : 0;
        ctx.drawImage(img, R(s.x - 5), R(s.y - 7 + hop));
        if (s.golden && Math.floor(g.clock * 6 + s.x) % 4 === 0)
            px(s.x + 3, s.y - 8, '#ffffff');
        if (s.followDog) {
            var c = ROOM.PLAYERS[s.followDog.slot].color;
            var x = R(s.x), y = R(s.y - 12 + Math.sin(g.clock * 8 + s.x) * 1);
            px(x - 1, y, c);
            px(x + 1, y, c);
            rect(x - 1, y + 1, 3, 1, c);
            px(x, y + 2, c);
        }
        else if (s.alertT > 0) {
            rect(s.x, s.y - 14, 1, 3, '#ffffff');
            px(s.x, s.y - 10, '#ffffff');
        }
    }
    function drawDog(d, g) {
        var art = SheepArt.dogs[d.slot];
        var fr = d.moving && Math.floor(d.walkT * 10) % 2 ? art.b : art.a;
        var img = d.left ? fr.left : fr.right;
        shadow(d.x, d.y + 1, 5);
        ctx.drawImage(img, R(d.x - 6), R(d.y - 8 - (d.barkT > 0.2 ? 1 : 0)));
        if (d.barkT > 0)
            PixelFont.draw(ctx, 'WOOF!', d.x + (d.left ? -12 : 12), d.y - 20, { color: '#ffffff', align: 'center' });
        var pc = ROOM.PLAYERS[d.slot];
        var label = d.isBot ? 'CPU' : 'P' + (d.slot + 1);
        PixelFont.draw(ctx, label, d.x, d.y - 19 - (d.barkT > 0 ? 9 : 0), { color: pc.color, align: 'center' });
        if (!d.isBot && !d.connected && Math.floor(g.clock * 2) % 2)
            PixelFont.draw(ctx, 'OFFLINE', d.x, d.y - 30, { color: '#ffffff', align: 'center' });
    }
    function drawWolf(w, g) {
        var fr = Math.floor(w.walkT * 10) % 2 ? SheepArt.wolf.b : SheepArt.wolf.a;
        shadow(w.x, w.y + 1, 6);
        ctx.drawImage(w.left ? fr.left : fr.right, R(w.x - 7), R(w.y - 8));
        if (!w.leaving && Math.floor(g.clock * 4) % 2)
            PixelFont.draw(ctx, '!', w.x, w.y - 20, { color: '#ff3b3b', align: 'center' });
    }
    function drawHUD(g, opts) {
        var e_8, _a;
        rect(0, 0, S.W, S.HUD_TOP, K);
        rect(0, S.HUD_TOP - 1, S.W, 1, '#3a3d48');
        rect(0, S.H - S.HUD_BOTTOM, S.W, S.HUD_BOTTOM, K);
        rect(0, S.H - S.HUD_BOTTOM, S.W, 1, '#3a3d48');
        var corner = [[2, 2], [S.W - 112, S.H - 10], [S.W - 112, 2], [2, S.H - 10]];
        try {
            for (var _b = __values(g.dogs), _c = _b.next(); !_c.done; _c = _b.next()) {
                var d = _c.value;
                var _d = __read(corner[d.slot], 2), x = _d[0], y = _d[1];
                var pc = ROOM.PLAYERS[d.slot];
                rect(x, y, 9, 8, pc.color);
                rect(x, y + 7, 9, 1, pc.dark);
                PixelFont.draw(ctx, String(d.slot + 1), x + 2, y + 1, { color: K, outline: null });
                PixelFont.draw(ctx, d.name.slice(0, 9), x + 12, y + 1, { color: (!d.isBot && !d.connected) ? '#6b6f7a' : pc.color, outline: null });
                Icons.drawIcon(ctx, 'sheep', x + 78, y, 1);
                PixelFont.draw(ctx, 'x' + d.score, x + 90, y + 1, { color: '#ffffff', outline: null });
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_8) throw e_8.error; }
        }
        var t = Math.ceil(g.time);
        var col = g.time <= 10 ? (Math.floor(g.clock * 4) % 2 ? '#ff3b3b' : '#ffd23b') : '#ffffff';
        PixelFont.draw(ctx, Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'), S.W / 2, 3, { color: col, align: 'center' });
        if (opts.roomCode)
            PixelFont.draw(ctx, 'STANZA ' + opts.roomCode, S.W / 2, S.H - 9, { color: '#9aa0ad', align: 'center', outline: null });
    }
    function drawCenter(g) {
        var cy = S.HUD_TOP + S.MAP_H / 2;
        if (g.state === 'countdown') {
            var n = Math.ceil(g.countdown);
            if (n >= 1 && n <= 3)
                PixelFont.draw(ctx, String(n), S.W / 2, cy - 21, { color: '#ffd23b', scale: 6, align: 'center', shadow: '#a3172a' });
            PixelFont.draw(ctx, 'PORTA LE PECORE NEL TUO RECINTO!', S.W / 2, cy + 30, { color: '#ffffff', align: 'center' });
            PixelFont.draw(ctx, 'ABBAIA = TI SEGUONO  CORRI = SCAPPANO', S.W / 2, cy + 42, { color: '#fff1a0', align: 'center' });
        }
        if (g.banner) {
            var b = g.banner;
            if (b.t > b.dur - 0.3 && Math.floor(b.t * 16) % 2)
                return;
            var scale = b.t < 0.06 ? 5 : b.t < 0.12 ? 4 : 3;
            if (PixelFont.width(b.text, scale) > S.W - 16)
                scale = 2;
            PixelFont.draw(ctx, b.text, S.W / 2, cy - 12, { color: b.color, scale: scale, align: 'center', shadow: K });
        }
    }
    window.SheepRender = { init: init, draw: draw };
})();

/* ---- js/games/sheep/index.js ---- */
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    'use strict';
    var S = SHEEP;
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    Sfx.register('bark', function (_a) {
        var tone = _a.tone, noise = _a.noise;
        tone('square', 620, 260, 0.07, 0.2);
        noise(0.05, 0.25, 3000, 600);
        tone('square', 560, 240, 0.08, 0.18, 0.11);
        noise(0.05, 0.2, 3000, 600, 0.11);
    });
    Sfx.register('whimper', function (_a) {
        var tone = _a.tone;
        tone('square', 900, 1300, 0.12, 0.1);
        tone('square', 1200, 700, 0.2, 0.1, 0.12);
    });
    Sfx.register('baa', function (_a) {
        var tone = _a.tone;
        for (var i = 0; i < 6; i++)
            tone('square', 380 - i * 12 + (i % 2) * 40, null, 0.05, 0.07, i * 0.05);
    });
    Sfx.register('howl', function (_a) {
        var tone = _a.tone;
        tone('triangle', 300, 620, 0.6, 0.35);
        tone('triangle', 620, 380, 0.9, 0.3, 0.6);
        tone('square', 310, 640, 0.6, 0.05);
    });
    Sfx.register('point', function (_a) {
        var tone = _a.tone, N = _a.N;
        tone('square', N(84), null, 0.06, 0.13);
        tone('square', N(91), null, 0.12, 0.13, 0.06);
    });
    Sfx.register('golden', function (_a) {
        var tone = _a.tone, N = _a.N;
        [0, 4, 7, 12, 16, 19].forEach(function (n, i) { return tone('square', N(79 + n), null, 0.05, 0.12, i * 0.04); });
    });
    Sfx.register('chomp', function (_a) {
        var noise = _a.noise, tone = _a.tone;
        noise(0.08, 0.5, 1500, 200);
        noise(0.08, 0.5, 1500, 200, 0.12);
        tone('square', 120, 60, 0.2, 0.15);
    });
    Sfx.register('dash', function (_a) {
        var noise = _a.noise, tone = _a.tone;
        noise(0.25, 0.3, 5000, 400);
        tone('triangle', 200, 600, 0.15, 0.1);
    });
    Sfx.register('whistle', function (_a) {
        var tone = _a.tone;
        tone('square', 1800, 1700, 0.25, 0.12);
        tone('square', 1800, 1300, 0.4, 0.12, 0.3);
    });
    var ready = false;
    function ensureRender() {
        var cv = document.getElementById('game');
        if (!ready) {
            SheepRender.init(cv);
            ready = true;
        }
        else {
            cv.width = S.W;
            cv.height = S.H;
        }
    }
    var SheepSession = (function () {
        function SheepSession(room, humans) {
            var _this = this;
            this.room = room;
            ensureRender();
            var defs = humans.map(function (h) { return ({ slot: h.slot, name: h.name, isBot: false }); });
            if (defs.length <= 1) {
                var names = S.BOT_NAMES.slice().sort(function () { return Math.random() - 0.5; });
                var _loop_1 = function (i) {
                    if (!defs.some(function (d) { return d.slot === i; }))
                        defs.push({ slot: i, name: names.pop(), isBot: true });
                };
                for (var i = 0; i < 4; i++) {
                    _loop_1(i);
                }
            }
            defs.sort(function (a, b) { return a.slot - b.slot; });
            this.game = new SheepGame(defs, function (t, d) { return _this.onEvent(t, d); });
            this.points = new Set();
        }
        SheepSession.prototype.dog = function (slot) { return this.game.dogs.find(function (d) { return !d.isBot && d.slot === slot; }) || null; };
        SheepSession.prototype.update = function (dt) { this.game.update(dt); };
        SheepSession.prototype.draw = function () { SheepRender.draw(this.game, { roomCode: this.room.code }); };
        SheepSession.prototype.input = function (slot, m) {
            var d = this.dog(slot);
            if (!d)
                return;
            if (m.t === 'in') {
                d.input.x = clamp(+m.x || 0, -1, 1);
                d.input.y = clamp(+m.y || 0, -1, 1);
            }
            else if (m.t === 'bark')
                d.input.bark = true;
            else if (m.t === 'dash')
                d.input.dash = true;
        };
        SheepSession.prototype.setConnected = function (slot, on) {
            var d = this.dog(slot);
            if (!d)
                return;
            d.connected = on;
            if (!on) {
                d.input.x = 0;
                d.input.y = 0;
            }
        };
        SheepSession.prototype.hud = function (slot) {
            var d = this.dog(slot);
            if (!d)
                return null;
            var h = { sheep: d.score, time: Math.ceil(this.game.time), barkMax: S.BARK_CD, dashMax: S.DASH_CD };
            if (this.points.has(slot)) {
                h.point = 1;
                this.points.delete(slot);
            }
            return h;
        };
        SheepSession.prototype.onEvent = function (type, data) {
            if (type === 'sfx')
                Sfx.play(data);
            else if (type === 'announce')
                Sfx.announce.apply(Sfx, __spreadArray([], __read((Array.isArray(data) ? data : [data])), false));
            else if (type === 'music') {
                if (data)
                    Sfx.startMusic('farm');
                else
                    Sfx.stopMusic();
            }
            else if (type === 'buzz') {
                if (!data.d.isBot)
                    this.room.buzz(data.d.slot, data.pattern);
            }
            else if (type === 'hud') {
                if (!data.isBot)
                    this.room.hudChanged(data.slot);
            }
            else if (type === 'point') {
                if (!data.isBot) {
                    this.points.add(data.slot);
                    this.room.hudChanged(data.slot);
                }
            }
            else if (type === 'over') {
                var ranking = data.map(function (d) { return ({ slot: d.slot, name: d.name, bot: d.isBot, detail: d.score + (d.score === 1 ? ' PECORA' : ' PECORE') }); });
                this.room.finish(ranking, { delay: 2000, voice: 'Winner! ' + data[0].name.toLowerCase() });
            }
        };
        SheepSession.prototype.stop = function () { Sfx.stopMusic(); };
        return SheepSession;
    }());
    function demo() {
        ensureRender();
        var g = new SheepGame([0, 1, 2, 3].map(function (i) { return ({ slot: i, name: S.BOT_NAMES[i], isBot: true }); }), function () { });
        g.state = 'play';
        g.time = 9999;
        g.wolfTimer = 9999;
        return { update: function (dt) { g.update(dt); }, draw: function () { SheepRender.draw(g, { demo: true }); } };
    }
    GAMES.register({
        id: 'sheep',
        title: 'HOLY SHEEP',
        desc: 'Sei un cane pastore: abbaia per farti seguire, corri per spaventarle. Più pecore nel recinto vince!',
        players: '1-4 (bot se sei da solo)',
        layout: 'sheep',
        available: true,
        icon: function (ctx, x, y) {
            ctx.drawImage(SheepArt.sheep.a.right, x + 2, y + 9);
            ctx.drawImage(SheepArt.dogs[0].a.left, x + 11, y + 1);
        },
        demo: demo,
        create: function (room, humans) { return new SheepSession(room, humans); },
    });
})();

/* ---- js/games/diff/scene.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function () {
    'use strict';
    var SW = 320, SH = 180;
    var K = '#1b1b26';
    var rnd = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
    var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
    var COLS = ['#ff3b3b', '#2f8bff', '#ffd23b', '#3fe05a', '#b04cf0', '#ff9c3b', '#ffffff', '#ff7ab8'];
    var DARK = { '#ff3b3b': '#a3172a', '#2f8bff': '#1a3fa8', '#ffd23b': '#c27a12', '#3fe05a': '#16843a', '#b04cf0': '#6a1fa3', '#ff9c3b': '#b85a12', '#ffffff': '#b9bcc4', '#ff7ab8': '#b03a74' };
    var g = null, OX = 0, OY = 0, FLIP = false, FX = 0, FY = 0, FW = 0;
    function r(x, y, w, h, c) {
        g.fillStyle = c;
        var xx = x;
        if (FLIP)
            xx = FW - x - w;
        g.fillRect(OX + FX + xx, OY + FY + y, w, h);
    }
    function p(x, y, c) { r(x, y, 1, 1, c); }
    function disc(cx, cy, rad, c) {
        for (var dy = -rad; dy <= rad; dy++) {
            var w = Math.round(Math.sqrt(rad * rad - dy * dy));
            r(cx - w, cy + dy, w * 2 + 1, 1, c);
        }
    }
    var T = {};
    function def(name, w, h, opts, draw) { T[name] = Object.assign({ w: w, h: h, draw: draw }, opts); }
    def('cloud', 26, 10, { flip: true, vary: true }, function (o) {
        disc(7, 6, 4, K);
        disc(14, 4, 5, K);
        disc(20, 6, 4, K);
        disc(7, 6, 3, '#ffffff');
        disc(14, 4, 4, '#ffffff');
        disc(20, 6, 3, '#ffffff');
        r(4, 7, 20, 2, '#ffffff');
        if (o.v) {
            disc(24, 7, 2, K);
            disc(24, 7, 1, '#ffffff');
        }
    });
    def('sun', 18, 18, { vary: true, color: true }, function (o, c, d) {
        disc(9, 9, 6, K);
        disc(9, 9, 5, c === '#ffffff' ? '#ffe14a' : c);
        for (var i = 0; i < 8; i++) {
            var a = i * Math.PI / 4;
            p(9 + Math.round(Math.cos(a) * 8), 9 + Math.round(Math.sin(a) * 8), d);
        }
        if (o.v) {
            p(7, 8, K);
            p(11, 8, K);
            r(7, 11, 5, 1, K);
        }
    });
    def('moon', 14, 14, { flip: true, vary: true }, function (o) {
        disc(7, 7, 6, K);
        disc(7, 7, 5, '#fff1a0');
        disc(10, 5, 4, '#1a2350');
        if (o.v)
            p(4, 8, '#c9b860');
    });
    def('star', 5, 5, { color: true }, function (o, c) { p(2, 0, c); r(0, 2, 5, 1, c); p(2, 4, c); r(1, 1, 3, 3, c); });
    def('bird', 7, 4, { flip: true, vary: true }, function (o) {
        p(0, 0, K);
        p(1, 1, K);
        p(2, 2, K);
        p(3, 1, K);
        p(4, 1, K);
        p(5, 0, K);
        p(6, 0, K);
        if (o.v)
            p(3, 3, '#ff9c3b');
    });
    def('balloon', 9, 20, { color: true, vary: true }, function (o, c, d) {
        disc(4, 5, 4, K);
        disc(4, 5, 3, c);
        p(3, 3, '#ffffff');
        p(4, 9, d);
        for (var y = 10; y < 20; y++)
            p(4 + (y % 4 === 0 ? 1 : 0), y, '#6b6f7a');
        if (o.v) {
            r(2, 5, 5, 1, d);
        }
    });
    def('tree', 18, 28, { vary: true, flip: true }, function (o) {
        r(7, 18, 4, 10, K);
        r(8, 18, 2, 10, '#8a5a2c');
        disc(9, 9, 9, K);
        disc(9, 9, 8, '#2f7a24');
        disc(7, 7, 5, '#46a336');
        p(5, 5, '#7dcf4a');
        if (o.v) {
            disc(5, 11, 1, '#ff3b3b');
            disc(12, 6, 1, '#ff3b3b');
            disc(13, 12, 1, '#ff3b3b');
        }
    });
    def('pine', 14, 26, { vary: true }, function (o) {
        r(6, 20, 3, 6, '#5a3a22');
        for (var i = 0; i < 4; i++) {
            var w = 3 + i * 2;
            r(7 - w, 2 + i * 5, w * 2 + 1, 5, K);
            r(8 - w, 3 + i * 5, w * 2 - 1, 3, '#2f7a24');
        }
        if (o.v)
            p(7, 0, '#ffd23b');
    });
    def('bush', 14, 9, { vary: true, flip: true }, function (o) {
        disc(4, 5, 4, K);
        disc(9, 4, 4, K);
        disc(4, 5, 3, '#2f7a24');
        disc(9, 4, 3, '#46a336');
        r(1, 6, 12, 3, '#2f7a24');
        if (o.v) {
            p(4, 4, '#ff7ab8');
            p(9, 3, '#ff7ab8');
            p(7, 6, '#ff7ab8');
        }
    });
    def('flower', 5, 9, { color: true }, function (o, c) { r(2, 4, 1, 5, '#2f7a24'); p(1, 6, '#46a336'); p(2, 1, c); r(1, 2, 3, 1, c); p(2, 3, c); p(2, 2, '#ffd23b'); });
    def('house', 30, 30, { color: true, vary: true, flip: true }, function (o, c, d) {
        for (var i = 0; i < 12; i++)
            r(3 + i - 1, 12 - i, 26 - i * 2 + 2, 1, K);
        for (var i = 0; i < 11; i++)
            r(3 + i, 12 - i, 24 - i * 2, 1, '#c2381f');
        r(4, 12, 22, 18, K);
        r(5, 13, 20, 16, c === '#ffffff' ? '#f2e6c9' : c);
        r(8, 17, 6, 5, K);
        r(9, 18, 4, 3, o.v ? '#ffe14a' : '#9ccbff');
        r(17, 19, 6, 10, K);
        r(18, 20, 4, 9, '#8a5a2c');
        p(21, 24, '#ffd23b');
        r(20, 2, 4, 6, K);
        r(21, 3, 2, 5, '#9aa0ad');
    });
    def('fence', 24, 9, {}, function () {
        for (var x = 0; x < 24; x += 6) {
            r(x + 1, 0, 3, 9, K);
            r(x + 2, 1, 1, 8, '#f2e6c9');
        }
        r(0, 3, 24, 2, '#f2e6c9');
        r(0, 6, 24, 1, '#c9b89a');
    });
    def('cat', 12, 9, { flip: true, color: true, vary: true }, function (o, c, d) {
        var fur = c === '#ffffff' ? '#ffffff' : (c === '#ffd23b' || c === '#ff9c3b' ? c : '#6b6f7a');
        r(0, 3, 9, 5, K);
        r(1, 4, 7, 3, fur);
        r(7, 0, 5, 6, K);
        r(8, 1, 3, 4, fur);
        p(8, 0, K);
        p(10, 0, K);
        p(9, 2, '#3fe05a');
        r(1, 7, 1, 2, K);
        r(6, 7, 1, 2, K);
        if (o.v) {
            r(0, 1, 1, 3, K);
        }
    });
    def('dog', 13, 10, { flip: true, vary: true }, function (o) {
        r(0, 3, 10, 5, K);
        r(1, 4, 8, 3, '#c98a4a');
        r(8, 0, 5, 6, K);
        r(9, 1, 3, 4, '#c98a4a');
        r(12, 3, 1, 1, K);
        p(10, 2, K);
        r(1, 8, 1, 2, K);
        r(7, 8, 1, 2, K);
        r(0, 2, 1, 2, K);
        if (o.v) {
            r(8, 6, 3, 1, '#ff3b3b');
        }
    });
    def('car', 26, 14, { flip: true, color: true, vary: true }, function (o, c, d) {
        r(5, 1, 14, 6, K);
        r(6, 2, 12, 5, c);
        r(8, 3, 4, 3, '#9ccbff');
        r(13, 3, 4, 3, '#9ccbff');
        r(0, 6, 26, 6, K);
        r(1, 7, 24, 4, c);
        r(1, 10, 24, 1, d);
        disc(6, 12, 2, K);
        disc(20, 12, 2, K);
        p(6, 12, '#9aa0ad');
        p(20, 12, '#9aa0ad');
        p(24, 8, o.v ? '#ffe14a' : '#ffffff');
    });
    def('person', 7, 16, { color: true, vary: true, flip: true }, function (o, c, d) {
        r(1, 0, 5, 5, K);
        r(2, 1, 3, 3, '#ffc690');
        r(1, 5, 5, 6, K);
        r(2, 6, 3, 4, c);
        r(1, 11, 2, 5, K);
        r(4, 11, 2, 5, K);
        p(4, 2, K);
        if (o.v)
            r(1, 0, 5, 1, '#5a3a22');
    });
    def('lamp', 7, 26, { vary: true }, function (o) {
        r(3, 4, 1, 22, K);
        r(1, 0, 5, 4, K);
        r(2, 1, 3, 2, o.v ? '#ffe14a' : '#6b6f7a');
        r(1, 25, 5, 1, K);
    });
    def('bench', 18, 8, {}, function () { r(0, 2, 18, 2, K); r(1, 2, 16, 1, '#c98a4a'); r(0, 5, 18, 2, K); r(1, 5, 16, 1, '#c98a4a'); r(2, 7, 1, 1, K); r(15, 7, 1, 1, K); });
    def('building', 34, 70, { color: true, vary: true }, function (o, c, d) {
        var col = c === '#ffffff' ? '#c9ccd4' : d;
        r(0, 0, 34, 70, K);
        r(1, 1, 32, 69, col);
        for (var y = 0; y < 8; y++)
            for (var x = 0; x < 4; x++) {
                var sd = o.s || 0;
                var lit = (((x * 7 + y * 3 + sd) % 5) < 2) !== (!!o.v && x === sd % 4 && y === 2 + (sd % 4));
                r(4 + x * 7, 5 + y * 8, 4, 5, lit ? '#ffe14a' : '#1a2350');
            }
    });
    def('traffic', 6, 24, { vary: true }, function (o) {
        r(2, 10, 2, 14, K);
        r(0, 0, 6, 11, K);
        p(2, 2, !o.v ? '#ff3b3b' : '#3a1010');
        p(3, 2, !o.v ? '#ff3b3b' : '#3a1010');
        r(2, 7, 2, 2, o.v ? '#3fe05a' : '#103a10');
    });
    def('barn', 40, 34, { color: true, vary: true, flip: true }, function (o, c, d) {
        var col = c === '#ffffff' ? '#ff3b3b' : c;
        for (var i = 0; i < 10; i++)
            r(10 - i, 10 - i, 20 + i * 2, 1, K);
        r(0, 10, 40, 24, K);
        r(1, 11, 38, 22, col);
        for (var i = 0; i < 9; i++)
            r(11 - i, 10 - i, 18 + i * 2, 1, DARK[col] || '#a3172a');
        r(14, 18, 12, 15, '#f2e6c9');
        r(15, 19, 10, 14, DARK[col] || '#a3172a');
        for (var i = 0; i < 10; i++) {
            p(15 + i, 19 + Math.round(i * 1.4), '#f2e6c9');
            p(24 - i, 19 + Math.round(i * 1.4), '#f2e6c9');
        }
        r(17, 4, 6, 5, '#f2e6c9');
        r(18, 5, 4, 3, o.v ? '#ffe14a' : K);
    });
    def('cow', 22, 14, { flip: true, vary: true }, function (o) {
        r(2, 2, 15, 8, K);
        r(3, 3, 13, 6, '#ffffff');
        r(5, 4, 3, 3, K);
        r(11, 5, 3, 2, K);
        if (o.v)
            r(8, 3, 2, 2, K);
        r(16, 0, 6, 7, K);
        r(17, 1, 4, 5, '#ffffff');
        r(18, 4, 3, 2, '#ff9cb8');
        p(17, 0, '#c9b89a');
        p(21, 0, '#c9b89a');
        r(3, 10, 2, 4, K);
        r(13, 10, 2, 4, K);
        r(0, 3, 2, 1, K);
    });
    def('sheep', 14, 11, { flip: true, vary: true }, function (o) {
        disc(6, 5, 5, K);
        disc(6, 5, 4, '#ffffff');
        r(10, 2, 4, 5, K);
        r(11, 3, 2, 3, '#3a3d48');
        r(3, 9, 1, 2, K);
        r(8, 9, 1, 2, K);
        if (o.v)
            p(6, 3, '#ff7ab8');
    });
    def('chicken', 9, 9, { flip: true, color: true }, function (o, c) {
        var col = c === '#ffd23b' || c === '#ffffff' ? c : '#ffffff';
        r(1, 3, 6, 4, K);
        r(2, 4, 4, 2, col);
        r(5, 0, 4, 4, K);
        r(6, 1, 2, 2, col);
        p(8, 2, '#ff9c3b');
        p(6, 0, '#ff3b3b');
        r(3, 7, 1, 2, '#ff9c3b');
        r(5, 7, 1, 2, '#ff9c3b');
    });
    def('tractor', 28, 20, { flip: true, color: true, vary: true }, function (o, c, d) {
        r(4, 6, 18, 8, K);
        r(5, 7, 16, 6, c);
        r(14, 0, 8, 8, K);
        r(15, 1, 6, 6, '#9ccbff');
        r(2, 4, 2, 6, K);
        if (o.v)
            r(1, 0, 3, 4, '#6b6f7a');
        disc(18, 14, 5, K);
        disc(18, 14, 3, '#3a3d48');
        disc(6, 16, 3, K);
        disc(6, 16, 1, '#3a3d48');
    });
    def('hay', 16, 12, { vary: true }, function (o) {
        r(0, 0, 16, 12, K);
        r(1, 1, 14, 10, '#e8c040');
        r(1, 1, 14, 2, '#fff1a0');
        for (var x = 3; x < 15; x += 3)
            r(x, 3, 1, 8, '#c29a2a');
        if (o.v)
            r(0, 5, 16, 1, '#8a5a2c');
    });
    def('scarecrow', 18, 26, { color: true, vary: true }, function (o, c) {
        r(8, 6, 2, 20, '#8a5a2c');
        r(0, 9, 18, 2, '#8a5a2c');
        r(5, 9, 8, 9, K);
        r(6, 10, 6, 7, c);
        disc(9, 4, 3, K);
        disc(9, 4, 2, '#e8c040');
        r(4, 0, 10, 2, K);
        r(6, 0, 6, 1, '#5a3a22');
        if (o.v) {
            p(8, 4, K);
            p(10, 4, K);
        }
    });
    def('umbrella', 26, 26, { color: true, vary: true }, function (o, c, d) {
        for (var i = 0; i < 6; i++)
            r(12 - i * 2, i, 3 + i * 4, 1, K);
        for (var i = 0; i < 26; i += 6)
            r(i, 6, 3, 2, c);
        for (var i = 1; i < 6; i++)
            for (var x = 13 - i * 2; x < 12 + i * 2; x++)
                p(x, i, Math.floor(x / 4) % 2 ? c : (o.v ? '#ffd23b' : '#ffffff'));
        r(12, 6, 2, 20, K);
    });
    def('palm', 24, 34, { flip: true, vary: true }, function (o) {
        for (var y = 10; y < 34; y++)
            r(11 + Math.round((y - 10) / 8), y, 3, 1, (y % 3) ? '#8a5a2c' : '#5a3a22');
        for (var i = 0; i < 10; i++) {
            r(11 - i, 6 + Math.round(i * 0.5), 2, 2, '#2f7a24');
            r(13 + i, 6 + Math.round(i * 0.5), 2, 2, '#2f7a24');
            r(12 - i * 0.6, 4 - Math.round(i * 0.3), 2, 2, '#46a336');
        }
        if (o.v) {
            disc(12, 10, 1, '#5a3a22');
            disc(15, 10, 1, '#5a3a22');
        }
    });
    def('crab', 12, 8, { color: true, vary: true }, function (o, c) {
        var col = c === '#ffffff' ? '#ff3b3b' : c;
        r(2, 3, 8, 4, K);
        r(3, 4, 6, 2, col);
        p(4, 2, K);
        p(7, 2, K);
        r(0, 1, 2, 2, col);
        r(10, 1, 2, 2, col);
        p(2, 7, K);
        p(9, 7, K);
        if (o.v) {
            r(0, 0, 1, 1, K);
        }
    });
    def('castle', 22, 18, { vary: true, color: true }, function (o, c) {
        r(2, 6, 18, 12, K);
        r(3, 7, 16, 11, '#e8c983');
        r(0, 2, 6, 16, K);
        r(1, 3, 4, 15, '#e8c983');
        r(16, 2, 6, 16, K);
        r(17, 3, 4, 15, '#e8c983');
        r(9, 12, 4, 6, '#8a6a42');
        r(19, -4, 1, 6, K);
        r(20, -4, 3, 2, c);
        if (o.v)
            r(2, -3, 1, 5, K);
    });
    def('ball', 9, 9, { color: true }, function (o, c) { disc(4, 4, 4, K); disc(4, 4, 3, '#ffffff'); r(1, 3, 7, 2, c); p(4, 1, c); p(4, 7, c); });
    def('towel', 22, 8, { color: true, vary: true }, function (o, c, d) {
        r(0, 0, 22, 8, K);
        r(1, 1, 20, 6, c);
        for (var x = 3; x < 21; x += 4)
            r(x, 1, 2, 6, o.v ? '#ffffff' : d);
    });
    def('boat', 26, 24, { flip: true, color: true, vary: true }, function (o, c) {
        r(12, 0, 1, 18, K);
        for (var i = 0; i < 14; i++)
            r(13, 1 + i, Math.round(i * 0.8), 1, c);
        r(2, 18, 22, 5, K);
        r(4, 19, 18, 3, '#8a5a2c');
        if (o.v)
            r(10, 0, 2, 2, '#ff3b3b');
    });
    def('starfish', 9, 9, { color: true }, function (o, c) { p(4, 0, c); r(0, 3, 9, 2, c); r(3, 1, 3, 6, c); p(1, 8, c); p(7, 8, c); r(2, 6, 1, 2, c); r(6, 6, 1, 2, c); p(4, 4, K); });
    var THEMES = {
        farm: {
            name: 'LA FATTORIA',
            sky: ['#5fb8ff', '#8fd0ff'], ground: '#5fb83a', groundY: 92, groundDetail: '#4ea52f',
            skyObjs: ['cloud', 'cloud', 'cloud', 'sun', 'bird', 'bird', 'bird', 'balloon'],
            bigObjs: ['barn', 'house', 'tree', 'tree', 'pine', 'tractor', 'scarecrow'],
            smallObjs: ['cow', 'cow', 'sheep', 'sheep', 'sheep', 'chicken', 'chicken', 'hay', 'flower', 'flower', 'flower', 'bush', 'dog', 'cat', 'fence', 'fence', 'person'],
        },
        beach: {
            name: 'LA SPIAGGIA',
            sky: ['#5fd0ff', '#a6e8ff'], ground: '#f2d68a', groundY: 100, sea: '#2f8bff', seaY: 78, groundDetail: '#e0c070',
            skyObjs: ['cloud', 'cloud', 'sun', 'bird', 'bird', 'bird', 'balloon'],
            bigObjs: ['palm', 'palm', 'umbrella', 'umbrella', 'umbrella', 'boat', 'castle'],
            smallObjs: ['crab', 'crab', 'ball', 'ball', 'towel', 'towel', 'starfish', 'starfish', 'person', 'person', 'person', 'dog', 'castle', 'flower'],
        },
        city: {
            name: 'LA CITTA DI NOTTE',
            sky: ['#1a2350', '#2a3570'], ground: '#5d5f6b', groundY: 118, groundDetail: '#4a4c57', night: true,
            skyObjs: ['moon', 'star', 'star', 'star', 'star', 'star', 'cloud', 'balloon'],
            bigObjs: ['building', 'building', 'building', 'building', 'building', 'building', 'building'],
            smallObjs: ['car', 'car', 'car', 'lamp', 'lamp', 'lamp', 'person', 'person', 'person', 'person', 'cat', 'dog', 'tree', 'bench', 'traffic', 'bush'],
        },
    };
    function overlaps(a, list, pad) {
        var e_1, _a;
        var ta = T[a.k];
        try {
            for (var list_1 = __values(list), list_1_1 = list_1.next(); !list_1_1.done; list_1_1 = list_1.next()) {
                var b = list_1_1.value;
                var tb = T[b.k];
                if (a.x < b.x + tb.w + pad && a.x + ta.w + pad > b.x && a.y < b.y + tb.h + pad && a.y + ta.h + pad > b.y)
                    return true;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (list_1_1 && !list_1_1.done && (_a = list_1.return)) _a.call(list_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return false;
    }
    function generate(themeName) {
        var name = themeName || pick(Object.keys(THEMES));
        var th = THEMES[name];
        var objs = [];
        var add = function (k, x, y, extra) {
            var t = T[k];
            var o = Object.assign({ k: k, x: Math.round(x), y: Math.round(y), c: t.color ? rnd(0, COLS.length - 1) : 0, f: t.flip && Math.random() < 0.5 ? 1 : 0, v: t.vary && Math.random() < 0.5 ? 1 : 0, s: rnd(0, 9) }, extra || {});
            objs.push(o);
            return o;
        };
        var tryPlace = function (k, yMin, yMax, pad, list) {
            var t = T[k];
            for (var i = 0; i < 40; i++) {
                var o = { k: k, x: rnd(2, SW - t.w - 2), y: rnd(yMin, Math.max(yMin, yMax - t.h)) };
                if (!overlaps(o, list, pad)) {
                    return add(k, o.x, o.y);
                }
            }
            return null;
        };
        var sky = [], big = [], small = [];
        for (var i = 0; i < 7; i++) {
            var o = tryPlace(pick(th.skyObjs), 3, th.night ? 60 : (th.seaY || th.groundY) - 14, 4, sky);
            if (o)
                sky.push(o);
        }
        if (name === 'city') {
            var x = 2;
            while (x < SW - 30) {
                var h = rnd(40, 70);
                var o = add('building', x, th.groundY - h, {});
                o.y = th.groundY - 70 + (70 - h);
                x += 36 + rnd(0, 8);
                big.push(o);
            }
        }
        else {
            for (var i = 0; i < 5; i++) {
                var k = pick(th.bigObjs);
                var t = T[k];
                var o = tryPlace(k, th.groundY - t.h + 6, th.groundY + 12, 3, big);
                if (o)
                    big.push(o);
            }
        }
        var groundTop = name === 'city' ? th.groundY + 2 : th.groundY + 8;
        for (var i = 0; i < 26; i++) {
            var o = tryPlace(pick(th.smallObjs), groundTop, SH - 2, 3, big.concat(small));
            if (o)
                small.push(o);
        }
        var list = sky.concat(big, small.sort(function (a, b) { return (a.y + T[a.k].h) - (b.y + T[b.k].h); }));
        return { theme: name, objs: list };
    }
    function center(o) {
        var t = T[o.k];
        return { x: o.x + t.w / 2, y: o.y + t.h / 2, r: Math.max(10, Math.min(18, Math.max(t.w, t.h) / 2 + 3)), bx: o.x - 3, by: o.y - 3, bw: t.w + 6, bh: t.h + 6 };
    }
    function hits(d, x, y) {
        return Math.hypot(x - d.x, y - d.y) <= d.r || (x >= d.bx && x <= d.bx + d.bw && y >= d.by && y <= d.by + d.bh);
    }
    function makeDiffs(objs, n, themeName) {
        var e_2, _a;
        var out = objs.map(function (o) { return Object.assign({}, o); });
        var diffs = [];
        var far = function (c) { return diffs.every(function (d) { return Math.hypot(d.x - c.x, d.y - c.y) > 22; }); };
        var order = out.map(function (_, i) { return i; }).sort(function () { return Math.random() - 0.5; });
        try {
            for (var order_1 = __values(order), order_1_1 = order_1.next(); !order_1_1.done; order_1_1 = order_1.next()) {
                var i = order_1_1.value;
                if (diffs.length >= n)
                    break;
                var o = out[i];
                var t = T[o.k];
                var c = center(o);
                if (!far(c))
                    continue;
                var tiny = t.w * t.h < 70;
                if (tiny && diffs.filter(function (d) { return d.tiny; }).length >= 2)
                    continue;
                c.tiny = tiny;
                var kinds = [];
                if (t.color)
                    kinds.push('color', 'color');
                if (t.vary)
                    kinds.push('vary', 'vary');
                if (t.flip)
                    kinds.push('flip');
                if (o.k !== 'building' && t.w < 30)
                    kinds.push('remove');
                if (!kinds.length)
                    continue;
                var kind = pick(kinds);
                if (kind === 'color') {
                    var nc = void 0;
                    do {
                        nc = rnd(0, COLS.length - 1);
                    } while (nc === o.c);
                    o.c = nc;
                }
                else if (kind === 'vary') {
                    o.v = o.v ? 0 : 1;
                    if (o.k === 'building') {
                        var sd = o.s || 0;
                        var wx = o.x + 4 + (sd % 4) * 7 + 2, wy = o.y + 5 + (2 + sd % 4) * 8 + 2;
                        diffs.push({ x: wx, y: wy, r: 10, bx: wx - 6, by: wy - 6, bw: 12, bh: 12, kind: kind });
                        continue;
                    }
                }
                else if (kind === 'flip')
                    o.f = o.f ? 0 : 1;
                else if (kind === 'remove')
                    o.hide = 1;
                diffs.push(Object.assign(c, { kind: kind }));
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (order_1_1 && !order_1_1.done && (_a = order_1.return)) _a.call(order_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var th = THEMES[themeName] || THEMES.farm;
        for (var tries = 0; diffs.length < n && tries < 200; tries++) {
            var k = th.night ? pick(['cat', 'balloon', 'bush']) : pick(['bush', 'ball', 'cat', 'balloon', 'crab']);
            var t = T[k];
            var o = { k: k, x: rnd(4, SW - t.w - 4), y: rnd(8, SH - t.h - 4), c: rnd(0, COLS.length - 1), f: 0, v: 0, s: 0, extra: 1 };
            var cc = center(o);
            if (!far(cc) || overlaps(o, out.filter(function (q) { return !q.hide; }), 2))
                continue;
            out.push(o);
            diffs.push(Object.assign(cc, { kind: 'add' }));
        }
        return { objs: out, diffs: diffs };
    }
    function hash(x, y) { var h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
    function drawBackground(theme) {
        var th = THEMES[theme];
        var horizon = th.seaY || th.groundY;
        for (var y = 0; y < horizon; y++) {
            g.fillStyle = y < horizon / 2 ? th.sky[0] : th.sky[1];
            g.fillRect(OX, OY + y, SW, 1);
        }
        if (th.sea) {
            g.fillStyle = th.sea;
            g.fillRect(OX, OY + th.seaY, SW, th.groundY - th.seaY);
            for (var x = 0; x < SW; x += 9) {
                g.fillStyle = '#9ccbff';
                g.fillRect(OX + x + ((x / 9) % 2) * 4, OY + th.seaY + 4 + ((x / 9) % 3) * 5, 4, 1);
            }
            g.fillStyle = '#ffffff';
            g.fillRect(OX, OY + th.groundY - 1, SW, 1);
        }
        g.fillStyle = th.ground;
        g.fillRect(OX, OY + th.groundY, SW, SH - th.groundY);
        for (var i = 0; i < 160; i++) {
            var x = Math.floor(hash(i, 1) * SW), y = th.groundY + 2 + Math.floor(hash(i, 2) * (SH - th.groundY - 2));
            g.fillStyle = th.groundDetail;
            g.fillRect(OX + x, OY + y, 2, 1);
        }
        if (theme === 'city') {
            g.fillStyle = '#3a3d48';
            g.fillRect(OX, OY + 140, SW, 22);
            g.fillStyle = '#ffffff';
            for (var x = 4; x < SW; x += 20)
                g.fillRect(OX + x, OY + 150, 10, 2);
        }
    }
    function drawObj(o) {
        if (o.hide)
            return;
        var t = T[o.k];
        if (!t)
            return;
        FLIP = !!o.f && !!t.flip;
        FX = o.x;
        FY = o.y;
        FW = t.w;
        var col = COLS[o.c] || COLS[0];
        t.draw(o, col, DARK[col] || K);
        FLIP = false;
        FX = 0;
        FY = 0;
    }
    function draw(ctx, scene, ox, oy) {
        var e_3, _a;
        g = ctx;
        OX = ox || 0;
        OY = oy || 0;
        g.save();
        g.beginPath();
        g.rect(OX, OY, SW, SH);
        g.clip();
        drawBackground(scene.theme);
        try {
            for (var _b = __values(scene.objs), _c = _b.next(); !_c.done; _c = _b.next()) {
                var o = _c.value;
                drawObj(o);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        g.restore();
    }
    window.DiffScene = { generate: generate, makeDiffs: makeDiffs, draw: draw, hits: hits, SW: SW, SH: SH, THEMES: THEMES };
})();

/* ---- js/games/diff/game.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    'use strict';
    var CFG = {
        W: 384, H: 216,
        SX: 2, SY: 16,
        N_DIFFS: 10,
        MATCH_TIME: 180,
        MISS_LOCK: 2,
        HINT_FIRST: 70,
        HINT_EVERY: 40,
    };
    var K = '#1b1b26';
    var DiffGame = (function () {
        function DiffGame(defs, emit) {
            this.emit = emit || (function () { });
            var sc = DiffScene.generate();
            this.theme = sc.theme;
            this.original = sc.objs;
            var m = DiffScene.makeDiffs(sc.objs, CFG.N_DIFFS, sc.theme);
            this.changed = m.objs;
            this.diffs = m.diffs;
            this.sceneId = Math.random().toString(36).slice(2, 8);
            this.players = defs.map(function (d) { return ({ slot: d.slot, name: d.name, found: new Set(), lockT: 0, lastFoundAt: 1e9, misses: 0, flashT: 0, connected: true }); });
            this.state = 'countdown';
            this.countdown = 3.999;
            this.lastTick = 4;
            this.time = CFG.MATCH_TIME;
            this.clock = 0;
            this.hint = null;
            this.hintTimer = CFG.HINT_FIRST;
            this.revealT = -1;
            this.banner = null;
            this.sceneCanvas = document.createElement('canvas');
            this.sceneCanvas.width = DiffScene.SW;
            this.sceneCanvas.height = DiffScene.SH;
            DiffScene.draw(this.sceneCanvas.getContext('2d'), { theme: this.theme, objs: this.original }, 0, 0);
        }
        DiffGame.prototype.sceneMsg = function () { return { t: 'scene', id: this.sceneId, theme: this.theme, objs: this.changed }; };
        DiffGame.prototype.player = function (slot) { return this.players.find(function (p) { return p.slot === slot; }) || null; };
        DiffGame.prototype.update = function (dt) {
            var e_1, _a, e_2, _b, e_3, _c;
            this.clock += dt;
            try {
                for (var _d = __values(this.players), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var p = _e.value;
                    if (p.lockT > 0) {
                        p.lockT = Math.max(0, p.lockT - dt);
                        if (p.lockT === 0)
                            this.emit('hud', p);
                    }
                    p.flashT = Math.max(0, p.flashT - dt);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (this.banner) {
                this.banner.t += dt;
                if (this.banner.t > this.banner.dur)
                    this.banner = null;
            }
            if (this.hint) {
                this.hint.t -= dt;
                if (this.hint.t <= 0)
                    this.hint = null;
            }
            if (this.state === 'countdown') {
                this.countdown -= dt;
                var n = Math.ceil(this.countdown);
                if (n !== this.lastTick && n >= 1 && n <= 3) {
                    this.lastTick = n;
                    this.emit('sfx', 'beep');
                }
                if (this.countdown <= 0) {
                    this.state = 'play';
                    this.banner = { text: 'VIA! GUARDA IL TELEFONO', color: '#ffd23b', t: 0, dur: 1.4 };
                    this.emit('sfx', 'go');
                    this.emit('music', true);
                    try {
                        for (var _f = __values(this.players), _g = _f.next(); !_g.done; _g = _f.next()) {
                            var p = _g.value;
                            this.emit('hud', p);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
            }
            else if (this.state === 'play') {
                var before = Math.ceil(this.time);
                this.time = Math.max(0, this.time - dt);
                if (Math.ceil(this.time) !== before) {
                    try {
                        for (var _h = __values(this.players), _j = _h.next(); !_j.done; _j = _h.next()) {
                            var p = _j.value;
                            this.emit('hud', p);
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (_j && !_j.done && (_c = _h.return)) _c.call(_h);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                    if (this.time <= 5 && this.time > 0)
                        this.emit('sfx', 'tick');
                }
                this.hintTimer -= dt;
                if (this.hintTimer <= 0) {
                    this.hintTimer = CFG.HINT_EVERY;
                    this.giveHint();
                }
                if (this.time <= 0)
                    this.end(null);
            }
            else if (this.state === 'over') {
                this.revealT += dt;
            }
        };
        DiffGame.prototype.giveHint = function () {
            var _this = this;
            var best = -1, bc = 1e9;
            this.diffs.forEach(function (d, i) {
                var c = _this.players.filter(function (p) { return p.found.has(i); }).length;
                if (c < bc || (c === bc && Math.random() < 0.5)) {
                    bc = c;
                    best = i;
                }
            });
            if (best < 0 || bc === this.players.length)
                return;
            var d = this.diffs[best];
            this.hint = { x: d.x + (Math.random() * 16 - 8), y: d.y + (Math.random() * 16 - 8), r: 30, t: 4 };
            this.emit('sfx', 'hint');
        };
        DiffGame.prototype.tap = function (slot, x, y) {
            var p = this.player(slot);
            if (!p || this.state !== 'play' || p.lockT > 0)
                return;
            var i = this.diffs.findIndex(function (d, idx) { return !p.found.has(idx) && DiffScene.hits(d, x, y); });
            if (i >= 0) {
                p.found.add(i);
                p.lastFoundAt = this.clock;
                p.flashT = 0.5;
                this.emit('sfx', 'found');
                this.emit('buzz', { slot: slot, pattern: [40] });
                this.emit('hud', p);
                if (p.found.size === this.diffs.length)
                    this.end(p);
                else if (p.found.size === this.diffs.length - 1)
                    this.banner = { text: p.name + ': MANCA 1!', color: ROOM.PLAYERS[slot].color, t: 0, dur: 1.3 };
            }
            else {
                if (this.diffs.some(function (d, idx) { return p.found.has(idx) && DiffScene.hits(d, x, y); }))
                    return;
                p.misses++;
                p.lockT = CFG.MISS_LOCK;
                this.emit('sfx', 'miss');
                this.emit('buzz', { slot: slot, pattern: [80, 40, 80] });
                this.emit('hud', p);
            }
        };
        DiffGame.prototype.end = function (winner) {
            var e_4, _a;
            if (this.state === 'over')
                return;
            this.state = 'over';
            this.revealT = 0;
            this.banner = { text: winner ? winner.name + ' HA FINITO!' : 'TEMPO!', color: '#ffd23b', t: 0, dur: 2.2 };
            this.emit('sfx', 'whistle');
            this.emit('music', false);
            try {
                for (var _b = __values(this.players), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var p = _c.value;
                    this.emit('hud', p);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_4) throw e_4.error; }
            }
            this.emit('over', this.ranking());
        };
        DiffGame.prototype.ranking = function () {
            return this.players.slice().sort(function (a, b) { return b.found.size - a.found.size || a.lastFoundAt - b.lastFoundAt || a.misses - b.misses; });
        };
        DiffGame.prototype.hud = function (slot) {
            var _this = this;
            var p = this.player(slot);
            if (!p)
                return null;
            return {
                sceneId: this.sceneId,
                found: __spreadArray([], __read(p.found), false).map(function (i) { var d = _this.diffs[i]; return [Math.round(d.x), Math.round(d.y), Math.round(d.r)]; }),
                total: this.diffs.length,
                time: Math.ceil(this.time),
                lock: p.lockT > 0 ? 1 : 0,
                state: this.state,
                all: this.state === 'over' ? this.diffs.map(function (d) { return [Math.round(d.x), Math.round(d.y), Math.round(d.r)]; }) : null,
            };
        };
        DiffGame.prototype.draw = function (ctx, opts) {
            var _this = this;
            ctx.fillStyle = '#20152a';
            ctx.fillRect(0, 0, CFG.W, CFG.H);
            ctx.drawImage(this.sceneCanvas, CFG.SX, CFG.SY);
            ctx.fillStyle = K;
            ctx.fillRect(CFG.SX - 1, CFG.SY - 1, DiffScene.SW + 2, 1);
            ctx.fillRect(CFG.SX - 1, CFG.SY + DiffScene.SH, DiffScene.SW + 2, 1);
            var cx = function (x) { return CFG.SX + x; }, cy = function (y) { return CFG.SY + y; };
            if (this.hint && Math.floor(this.clock * 6) % 2)
                ring(ctx, cx(this.hint.x), cy(this.hint.y), this.hint.r, '#ffffff');
            if (this.state === 'over') {
                var n = Math.min(this.diffs.length, Math.floor(this.revealT / 0.15));
                for (var i = 0; i < n; i++) {
                    var d = this.diffs[i];
                    ring(ctx, cx(d.x), cy(d.y), d.r, '#ff3b3b');
                    ring(ctx, cx(d.x), cy(d.y), d.r + 1, '#ffffff');
                }
            }
            if (opts.demo)
                return;
            ctx.fillStyle = K;
            ctx.fillRect(0, 0, CFG.W, 14);
            PixelFont.draw(ctx, 'TROVA LE ' + this.diffs.length + ' DIFFERENZE: ' + DiffScene.THEMES[this.theme].name, 4, 4, { color: '#ffd23b', outline: null });
            var t = Math.ceil(this.time);
            var col = this.time <= 15 ? (Math.floor(this.clock * 4) % 2 ? '#ff3b3b' : '#ffd23b') : '#ffffff';
            PixelFont.draw(ctx, Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'), CFG.W - 4, 4, { color: col, outline: null, align: 'right' });
            var px0 = CFG.SX + DiffScene.SW + 4;
            this.players.forEach(function (p, i) {
                var y = CFG.SY + i * 45;
                var pc = ROOM.PLAYERS[p.slot];
                ctx.fillStyle = p.flashT > 0 && Math.floor(_this.clock * 16) % 2 ? '#ffffff' : '#2a2a3a';
                ctx.fillRect(px0, y, 56, 42);
                ctx.fillStyle = pc.color;
                ctx.fillRect(px0, y, 3, 42);
                PixelFont.draw(ctx, p.name.slice(0, 8), px0 + 5, y + 3, { color: pc.color, outline: null });
                PixelFont.draw(ctx, String(p.found.size), px0 + 5, y + 14, { color: '#ffffff', scale: 2, outline: null });
                PixelFont.draw(ctx, '/' + _this.diffs.length, px0 + 6 + PixelFont.width(String(p.found.size), 2), y + 21, { color: '#9aa0ad', outline: null });
                for (var k = 0; k < _this.diffs.length; k++) {
                    ctx.fillStyle = k < p.found.size ? pc.color : '#4a4c57';
                    ctx.fillRect(px0 + 5 + k * 5, y + 33, 4, 4);
                }
                if (p.lockT > 0)
                    PixelFont.draw(ctx, 'X', px0 + 48, y + 14, { color: '#ff3b3b' });
                if (!p.connected && Math.floor(_this.clock * 2) % 2)
                    PixelFont.draw(ctx, 'OFF', px0 + 36, y + 3, { color: '#ffffff', outline: null });
            });
            PixelFont.draw(ctx, 'TOCCA SUL TELEFONO DOVE VEDI UNA DIFFERENZA', CFG.SX + DiffScene.SW / 2, CFG.H - 10, { color: '#9aa0ad', align: 'center', outline: null });
            if (opts.roomCode)
                PixelFont.draw(ctx, opts.roomCode, CFG.W - 4, CFG.H - 10, { color: '#6b6f7a', align: 'right', outline: null });
            var mid = CFG.SY + DiffScene.SH / 2;
            if (this.state === 'countdown') {
                ctx.fillStyle = 'rgba(27,27,38,0.55)';
                ctx.fillRect(CFG.SX, CFG.SY, DiffScene.SW, DiffScene.SH);
                var n = Math.ceil(this.countdown);
                if (n >= 1 && n <= 3)
                    PixelFont.draw(ctx, String(n), CFG.SX + DiffScene.SW / 2, mid - 26, { color: '#ffd23b', scale: 6, align: 'center', shadow: '#a3172a' });
                PixelFont.draw(ctx, 'GUARDA BENE LA TV...', CFG.SX + DiffScene.SW / 2, mid + 28, { color: '#ffffff', align: 'center' });
            }
            if (this.banner) {
                var b = this.banner;
                if (!(b.t > b.dur - 0.3 && Math.floor(b.t * 16) % 2)) {
                    var scale = b.t < 0.06 ? 4 : 3;
                    while (scale > 1 && PixelFont.width(b.text, scale) > DiffScene.SW - 8)
                        scale--;
                    PixelFont.draw(ctx, b.text, CFG.SX + DiffScene.SW / 2, mid - 10, { color: b.color, scale: scale, align: 'center', shadow: K });
                }
            }
        };
        return DiffGame;
    }());
    function ring(ctx, x, y, r, c) {
        ctx.fillStyle = c;
        var n = Math.ceil(r * 6);
        for (var i = 0; i < n; i++) {
            var a = (i / n) * Math.PI * 2;
            ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
        }
    }
    window.DiffGame = DiffGame;
    window.DIFF_CFG = CFG;
})();

/* ---- js/games/diff/index.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    'use strict';
    var C = DIFF_CFG;
    Sfx.register('found', function (_a) {
        var tone = _a.tone, N = _a.N;
        [0, 7, 12].forEach(function (n, i) { return tone('square', N(76 + n), null, 0.07, 0.14, i * 0.06); });
    });
    Sfx.register('miss', function (_a) {
        var tone = _a.tone;
        tone('square', 200, 120, 0.15, 0.16);
        tone('square', 150, 90, 0.2, 0.14, 0.15);
    });
    Sfx.register('hint', function (_a) {
        var tone = _a.tone, N = _a.N;
        tone('triangle', N(84), null, 0.1, 0.2);
        tone('triangle', N(88), null, 0.1, 0.2, 0.12);
        tone('triangle', N(91), null, 0.2, 0.2, 0.24);
    });
    Sfx.register('whistle', function (_a) {
        var tone = _a.tone;
        tone('square', 1800, 1700, 0.25, 0.12);
        tone('square', 1800, 1300, 0.4, 0.12, 0.3);
    });
    var ctx = null;
    function ensureCanvas() {
        var cv = document.getElementById('game');
        cv.width = C.W;
        cv.height = C.H;
        ctx = cv.getContext('2d');
        ctx.imageSmoothingEnabled = false;
    }
    var DiffSession = (function () {
        function DiffSession(room, humans) {
            var e_1, _a;
            var _this = this;
            this.room = room;
            ensureCanvas();
            this.game = new DiffGame(humans.map(function (h) { return ({ slot: h.slot, name: h.name }); }), function (t, d) { return _this.onEvent(t, d); });
            try {
                for (var humans_1 = __values(humans), humans_1_1 = humans_1.next(); !humans_1_1.done; humans_1_1 = humans_1.next()) {
                    var h = humans_1_1.value;
                    room.send(h.slot, this.game.sceneMsg());
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (humans_1_1 && !humans_1_1.done && (_a = humans_1.return)) _a.call(humans_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        DiffSession.prototype.update = function (dt) { this.game.update(dt); };
        DiffSession.prototype.draw = function () { this.game.draw(ctx, { roomCode: this.room.code }); };
        DiffSession.prototype.input = function (slot, m) {
            if (m.t === 'tap')
                this.game.tap(slot, +m.x, +m.y);
            else if (m.t === 'needscene')
                this.room.send(slot, this.game.sceneMsg());
        };
        DiffSession.prototype.setConnected = function (slot, on) {
            var p = this.game.player(slot);
            if (p)
                p.connected = on;
            if (on)
                this.room.send(slot, this.game.sceneMsg());
        };
        DiffSession.prototype.hud = function (slot) { return this.game.hud(slot); };
        DiffSession.prototype.onEvent = function (type, data) {
            var _this = this;
            if (type === 'sfx')
                Sfx.play(data);
            else if (type === 'music') {
                if (data)
                    Sfx.startMusic('farm');
                else
                    Sfx.stopMusic();
            }
            else if (type === 'buzz')
                this.room.buzz(data.slot, data.pattern);
            else if (type === 'hud')
                this.room.hudChanged(data.slot);
            else if (type === 'over') {
                var ranking = data.map(function (p) { return ({ slot: p.slot, name: p.name, bot: false, detail: p.found.size + '/' + _this.game.diffs.length + ' TROVATE' }); });
                this.room.finish(ranking, { delay: 3000, voice: 'Winner! ' + data[0].name.toLowerCase() });
            }
        };
        DiffSession.prototype.stop = function () { Sfx.stopMusic(); };
        return DiffSession;
    }());
    function demo() {
        ensureCanvas();
        var g = new DiffGame([], function () { });
        var t = 0;
        return {
            update: function (dt) { t += dt; if (t > 6) {
                t = 0;
                g = new DiffGame([], function () { });
            } },
            draw: function () {
                ctx.fillStyle = '#20152a';
                ctx.fillRect(0, 0, C.W, C.H);
                ctx.drawImage(g.sceneCanvas, (C.W - DiffScene.SW) / 2, (C.H - DiffScene.SH) / 2);
            },
        };
    }
    GAMES.register({
        id: 'diff',
        title: 'TROVA LE DIFFERENZE',
        desc: 'Sulla TV l\'originale, sul telefono la copia con 10 differenze: toccale per primo! Occhio: se sbagli il telefono si blocca 2 secondi.',
        players: '1-4',
        layout: 'diff',
        available: true,
        icon: function (c, x, y) {
            var rows = ['.......kkkkkkk..........', '.....kkcccccccckk.......', '....kccwwcccccccck......', '...kccwwcccccccccck.....', '...kcwwccccccccccck.....',
                '..kccwcccccccccccccck...', '..kccccccccccccccccck...', '..kccccccccccccccccck...', '..kccccccccccccccccck...', '...kccccccccccccccck....',
                '...kcccccccccccccck.....', '....kccccccccccccck.....', '.....kkcccccccckkbb.....', '.......kkkkkkkk.kbbb....', '.................kbbb...',
                '..................kbbb..', '...................kbbb.', '....................kbbk', '.....................kk.'];
            var pal = { k: '#1b1b26', c: '#5ff2ff', w: '#ffffff', b: '#c27a3a' };
            rows.forEach(function (r, j) { return __spreadArray([], __read(r), false).forEach(function (ch, i) { if (pal[ch]) {
                c.fillStyle = pal[ch];
                c.fillRect(x + i, y + 2 + j, 1, 1);
            } }); });
        },
        demo: demo,
        create: function (room, humans) { return new DiffSession(room, humans); },
    });
})();

/* ---- js/games/kart/chars.js ---- */
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    'use strict';
    var K = '#1b1b26';
    var CHARS = [
        {
            id: 'generale',
            name: 'IL GENERALISSIMO',
            short: 'GENERALE',
            desc: 'Mascellone, medaglie e zero dubbi.',
            line: 'Avanti tutta! Chi si ferma è perduto, e anche un po\' lento!',
            voice: { lang: 'it-IT', pitch: 0.5, rate: 0.9 },
            pal: { k: K, s: '#f2b58a', S: '#c98a5c', h: '#1b1b26', g: '#ffd23b', u: '#5d6b3a', U: '#3f4a1d', w: '#ffffff', r: '#ff3b3b', b: '#2f8bff' },
            portrait: [
                '....kkkkkkkkkkkk....',
                '...khhhhhhhhhhhhk...',
                '..khhhhhhhhhhhhhhk..',
                '..kggggggggggggggk..',
                '.kkkkkkkkkkkkkkkkkk.',
                '...kssssssssssssk...',
                '...kskkksssskkksk...',
                '...ksswkssssswksk...',
                '...kssssssssssssk...',
                '...kssssSSSSssssk...',
                '...kSssssssssssSk...',
                '..kSsskkkkkkkkssSk..',
                '..kSsssssssssssssk..',
                '..kSSssssssssssSSk..',
                '...kSSSSSSSSSSSSk...',
                '....kkkkkkkkkkkk....',
                '..kuuuuugguuuuuuuk..',
                '.kuuurbuuuuuuggguuk.',
                '.kuuugguuuuuuuuuuuk.',
                '.kUUUUUUUUUUUUUUUUk.',
            ],
            back: ['..kkkkkk..', '.khhhhhhk.', 'kggggggggk', 'kkkkkkkkkk', '.kSSSSSSk.', '.kSSSSSSk.', '..kuuuuk..'],
        },
        {
            id: 'comandante',
            name: 'EL COMANDANTE',
            short: 'COMANDANTE',
            desc: 'Basco, barbone e sigaro sempre acceso.',
            line: '¡A la carrera, compañeros! ¡Hasta la meta!',
            voice: { lang: 'es-ES', pitch: 0.8, rate: 1.0 },
            pal: { k: K, s: '#e8b080', S: '#b8805a', h: '#1b1b26', r: '#ff3b3b', y: '#ffd23b', B: '#3a2a22', u: '#5d6b3a', U: '#3f4a1d', w: '#ffffff', c: '#c98a4a', f: '#ff9c3b' },
            portrait: [
                '.....kkkkkkkkkk.....',
                '...kkhhhhhhhhhhkk...',
                '..khhhhhhhhhhyhhhk..',
                '.khhhhhhhhhhyryhhhk.',
                '.khhhhhhhhhhhyhhhhk.',
                '..kkkkkkkkkkkkkkkk..',
                '..kBssssssssssssBk..',
                '..kBskkssssskksBk...',
                '..kBswkssssswksBk...',
                '..kBssssssssssssBk..',
                '..kBBssssSSssssBBk..',
                '..kBBBBkkkkkkBBBBk..',
                '..kBBBBBBBBccfBBBk..',
                '...kBBBBBBBBBBBBk...',
                '....kBBBBBBBBBBk....',
                '.....kkkkkkkkkk.....',
                '..kuuuuuuuuuuuuuuk..',
                '.kuuuuuuuuuuuuuuuuk.',
                '.kuuuuuuuuuuuuuuuuk.',
                '.kUUUUUUUUUUUUUUUUk.',
            ],
            back: ['..kkkkk...', '.khhhhhkk.', 'khhhhhhhhk', 'kkkkkkkkkk', '.kBBBBBBk.', '.kBBBBBBk.', '..kuuuuk..'],
        },
        {
            id: 'regina',
            name: 'LA REGINA DEL NILO',
            short: 'REGINA',
            desc: 'Copricapo dorato, trucco perfetto, sorpassi regali.',
            line: 'Inchinatevi alla vostra regina! E fate largo!',
            voice: { lang: 'it-IT', pitch: 1.3, rate: 0.95 },
            pal: { k: K, s: '#d9a06a', S: '#a8744a', b: '#2f8bff', g: '#ffd23b', e: '#1a3fa8', h: '#1b1b26', w: '#ffffff', r: '#ff3b3b', G: '#3fe05a' },
            portrait: [
                '......kkkkkkkk......',
                '....kkggggggggkk....',
                '...kgggggGGggggggk..',
                '..kbgbgbgbgbgbgbgk..',
                '..kgbkkkkkkkkkkbgk..',
                '.kbgkhhsssssshhkgbk.',
                '.kgbkesssssssseksgk.',
                '.kbgkewkssssewkkgbk.',
                '.kgbkssssssssssksgk.',
                '.kbgkssssSSssssskgk.',
                '.kgbksssssssssskgbk.',
                '.kbgkssssrrssssksgk.',
                '.kgbkkssssssssskkgk.',
                '.kbgb.kkkkkkkkk.bgbk',
                '.kgbg..kssssk..gbgk.',
                '.kbgb.kggggggk.bgbk.',
                '..kkkkgbgbgbgbgkkk..',
                '.kgggggggggggggggggk',
                '.kwwwwwwwwwwwwwwwwk.',
                '.kwwwwwwwwwwwwwwwwk.',
            ],
            back: ['..kkkkkk..', '.kggggggk.', 'kbgbgbgbgk', 'kgbgbgbgbk', 'kbgbgbgbgk', '.kgbgbgbk.', '..kwwwwk..'],
        },
        {
            id: 'televenditrice',
            name: 'LA TELEVENDITRICE',
            short: 'TELEVENDITA',
            desc: 'Capelli cotonati, occhialoni e telefono in mano.',
            line: 'Chiamate subito! Offerta imperdibile! Solo per oggi!',
            voice: { lang: 'it-IT', pitch: 1.5, rate: 1.25 },
            pal: { k: K, s: '#f2c49a', S: '#c99a6a', y: '#ffe14a', Y: '#e0a020', r: '#ff3b3b', p: '#ff7ab8', w: '#ffffff', b: '#1b1b26', P: '#b04cf0', g: '#9aa0ad' },
            portrait: [
                '...kkkkkkkkkkkkkk...',
                '..kyyyyyYyyyyyyyyk..',
                '.kyyyYyyyyyyyYyyyyk.',
                'kyyyyyyyyyyyyyyyyyyk',
                'kyyYkkkkkkkkkkkkYyyk',
                'kyyksssssssssssskyyk',
                'kyykrrrrrsssrrrrrkyk',
                'kyyrwwbwrsssrwbwwryk',
                'kyykrrrrrsssrrrrrkyk',
                'kyyksssssSSssssskyyk',
                'kyyksssssssssssskyyk',
                '.kyksssspppppsssskyk',
                '.kyyksssskksssskkyk.',
                '..kykkssssssssskkk..',
                '...kk.kkkkkkkk.kgk..',
                '.....kkssssssk.kgk..',
                '..kkPPPPPPPPPPkkgk..',
                '.kPPPPPPPPPPPPPPkk..',
                '.kPPPPwPPPPPPwPPPk..',
                '.kPPPPPPPPPPPPPPPk..',
            ],
            back: ['..kkkkkk..', '.kyyyyyyk.', 'kyyyYyyyyk', 'kyyyyyyYyk', 'kyYyyyyyyk', '.kyyyyyyk.', '..kPPPPk..'],
        },
    ];
    function drawRows(ctx, rows, pal, x, y, scale) {
        scale = scale || 1;
        rows.forEach(function (r, j) { return __spreadArray([], __read(r), false).forEach(function (ch, i) {
            if (ch === '.' || !pal[ch])
                return;
            ctx.fillStyle = pal[ch];
            ctx.fillRect(x + i * scale, y + j * scale, scale, scale);
        }); });
    }
    function drawPortrait(ctx, id, x, y, scale) {
        var c = CHARS.find(function (q) { return q.id === id; });
        if (c)
            drawRows(ctx, c.portrait, c.pal, x, y, scale);
    }
    window.KartChars = { CHARS: CHARS, drawPortrait: drawPortrait, drawRows: drawRows, get: function (id) { return CHARS.find(function (c) { return c.id === id; }); } };
})();

/* ---- js/games/kart/tracks.js ---- */
"use strict";
(function () {
    'use strict';
    var TRACKS = [
        {
            id: 'monza', name: 'MONZA', laps: 3,
            sub: "Il tempio della velocità: Rettifilo, Curva Grande, Lesmo, Ascari e la Parabolica",
            width: 64, walls: false, size: 4864,
            ground: '#4ea52f', ground2: '#5fb83a', runoff: '#d9b56a', sky: ["#5fb8ff", "#a6e0ff"], scenery: 'alps', deco: 'monza',
            pts: [
                [254.6, 3004.8], [258.2, 2963.6], [261.7, 2922.3], [265.2, 2881.1], [268.8, 2839.8], [272.3, 2798.6],
                [275.8, 2757.3], [279.4, 2716.1], [282.9, 2674.8], [286.4, 2633.6], [290.0, 2592.3], [293.5, 2551.1],
                [297.0, 2509.8], [300.6, 2468.6], [304.1, 2427.3], [307.6, 2386.1], [311.2, 2344.8], [314.7, 2303.6],
                [318.2, 2262.3], [321.8, 2221.1], [325.3, 2179.8], [328.8, 2138.6], [332.5, 2097.4], [336.4, 2056.1],
                [340.2, 2014.9], [344.0, 1973.7], [347.8, 1932.5], [351.7, 1891.2], [355.5, 1850.0], [359.3, 1808.8],
                [363.1, 1767.6], [376.4, 1730.5], [416.7, 1729.1], [452.1, 1714.5], [453.1, 1674.7],
                [442.5, 1634.7, { sign: 'RETTIFILO' }], [431.8, 1594.7], [421.2, 1554.7], [410.6, 1514.7], [401.7, 1474.3],
                [396.0, 1433.3], [393.6, 1392.0], [395.4, 1350.7], [398.5, 1309.4], [401.6, 1268.1], [404.7, 1226.8],
                [407.9, 1185.5], [411.0, 1144.3], [414.1, 1103.0], [417.7, 1061.8], [425.2, 1021.0], [435.0, 980.8],
                [448.1, 941.5], [463.7, 903.2], [481.1, 865.7], [501.4, 829.7], [524.0, 795.0], [549.8, 762.6],
                [577.7, 732.0], [606.7, 702.6], [638.0, 675.5], [670.9, 650.4], [704.7, 626.5], [740.6, 605.9],
                [777.0, 586.3], [814.1, 567.9], [852.6, 552.8], [891.7, 539.3], [931.6, 528.0],
                [971.6, 517.5, { sign: 'CURVA GRANDE' }], [1012.4, 510.4], [1053.2, 503.8], [1094.4, 500.1], [1135.7, 496.4],
                [1176.9, 492.9], [1218.2, 489.4], [1259.4, 485.8], [1300.7, 482.3], [1341.9, 478.8], [1383.2, 475.3],
                [1424.4, 471.8], [1465.7, 468.4], [1507.0, 466.0], [1548.3, 463.5], [1589.7, 461.1], [1631.0, 458.6],
                [1672.3, 456.2], [1713.7, 453.7], [1755.0, 451.2], [1796.3, 448.8], [1837.6, 446.3], [1878.9, 443.4],
                [1908.3, 417.9], [1919.8, 378.2], [1949.4, 352.9], [1990.1, 345.3], [2030.7, 337.0], [2071.0, 327.6],
                [2110.4, 314.9], [2149.8, 302.2], [2189.1, 289.1], [2228.3, 276.0], [2267.6, 262.9], [2306.9, 249.8],
                [2346.1, 236.7], [2385.4, 223.6], [2424.7, 210.5], [2463.9, 197.4, { sign: 'ROGGIA' }], [2503.2, 184.2],
                [2543.0, 173.0], [2584.1, 170.0], [2624.3, 178.9], [2660.7, 198.4], [2691.4, 225.7], [2714.8, 259.6],
                [2726.0, 299.3], [2730.4, 340.4], [2734.2, 381.6], [2737.9, 422.8], [2741.7, 464.1], [2745.7, 505.3],
                [2749.8, 546.5], [2754.0, 587.7], [2758.2, 628.9], [2762.4, 670.0], [2766.5, 711.2], [2770.7, 752.4],
                [2774.0, 793.6], [2767.0, 834.0], [2739.1, 863.3], [2703.4, 884.1], [2666.9, 903.7], [2630.4, 923.3],
                [2593.9, 942.9, { sign: 'LESMO' }], [2557.5, 962.4], [2521.0, 982.0], [2484.5, 1001.6], [2448.3, 1021.7],
                [2412.1, 1041.8], [2376.0, 1061.9], [2339.8, 1082.1], [2303.6, 1102.2], [2267.4, 1122.3], [2231.1, 1142.1],
                [2194.8, 1162.0], [2158.5, 1181.9], [2122.5, 1202.5], [2087.2, 1224.0], [2053.3, 1247.8], [2019.6, 1271.9],
                [1986.6, 1296.8], [1955.1, 1323.7], [1923.8, 1350.7], [1892.3, 1377.6], [1860.8, 1404.4], [1829.3, 1431.3],
                [1797.8, 1458.2], [1766.3, 1485.0], [1734.8, 1511.9], [1703.7, 1539.3], [1672.9, 1567.0], [1642.2, 1594.7],
                [1611.4, 1622.4], [1580.7, 1650.1], [1549.7, 1677.5], [1518.5, 1704.8], [1487.3, 1732.0],
                [1456.1, 1759.2, { sign: 'SERRAGLIO' }], [1424.9, 1786.4], [1393.7, 1813.6], [1362.5, 1840.8], [1331.3, 1868.0],
                [1300.1, 1895.2], [1268.9, 1922.5], [1237.7, 1949.7], [1206.5, 1976.9], [1175.3, 2004.1], [1144.1, 2031.4],
                [1112.9, 2058.6], [1081.8, 2085.8], [1050.6, 2113.1], [1021.0, 2142.0], [1004.8, 2178.7], [1007.4, 2219.9],
                [1012.5, 2261.0], [1013.3, 2302.3], [1005.2, 2342.7], [990.3, 2381.3], [966.9, 2415.4], [938.9, 2445.7],
                [906.8, 2471.9], [878.3, 2501.3], [865.2, 2540.3], [858.8, 2581.1], [853.7, 2622.2], [848.7, 2663.3],
                [843.7, 2704.4], [838.7, 2745.5], [833.7, 2786.6], [828.8, 2827.7], [823.8, 2868.8], [819.2, 2909.9],
                [814.9, 2951.1, { sign: 'ASCARI' }], [810.6, 2992.3], [806.3, 3033.5], [802.1, 3074.7], [797.8, 3115.8],
                [793.5, 3157.0], [789.2, 3198.2], [784.9, 3239.4], [780.6, 3280.5], [776.3, 3321.7], [772.0, 3362.9],
                [767.8, 3404.1], [763.5, 3445.3], [759.2, 3486.4], [754.9, 3527.6], [750.6, 3568.8], [746.3, 3610.0],
                [742.0, 3651.1], [737.7, 3692.3], [733.5, 3733.5], [729.2, 3774.7], [724.9, 3815.9], [720.6, 3857.0],
                [716.3, 3898.2], [712.0, 3939.4], [707.7, 3980.6], [703.4, 4021.7], [699.2, 4062.9], [694.9, 4104.1],
                [690.6, 4145.3], [686.3, 4186.4], [682.0, 4227.6], [677.7, 4268.8], [673.4, 4310.0], [669.2, 4351.2],
                [664.9, 4392.3], [660.6, 4433.5], [655.8, 4474.6], [649.0, 4515.4], [633.1, 4553.4], [605.6, 4584.2],
                [572.7, 4609.1], [534.9, 4625.5], [494.3, 4633.3], [453.2, 4629.0], [413.6, 4617.2], [375.5, 4601.0],
                [340.5, 4579.2], [308.1, 4553.5], [279.8, 4523.3], [255.5, 4489.8], [234.7, 4454.0], [218.7, 4415.8],
                [204.6, 4376.9], [193.2, 4337.1], [185.4, 4296.5, { sign: 'PARABOLICA' }], [180.4, 4255.4], [176.5, 4214.2],
                [175.9, 4172.9], [175.2, 4131.5], [174.3, 4090.1], [173.3, 4048.7], [172.2, 4007.3], [171.3, 3965.9],
                [170.5, 3924.5], [170.0, 3883.1], [170.7, 3841.7], [171.5, 3800.3], [173.9, 3759.0], [177.5, 3717.8],
                [181.2, 3676.5], [184.9, 3635.3], [189.2, 3594.1], [193.5, 3553.0], [197.8, 3511.8], [202.1, 3470.6],
                [206.5, 3429.4], [210.8, 3388.3], [215.1, 3347.1], [219.4, 3305.9], [223.7, 3264.7], [228.0, 3223.6],
                [232.6, 3182.4], [237.7, 3141.3], [242.8, 3100.3], [247.9, 3059.2], [253.0, 3018.1],
            ],
        },
        {
            id: 'spa', name: 'SPA', laps: 3,
            sub: "Le Ardenne: La Source, il sali-e-scendi di Eau Rouge e Raidillon, Pouhon e Blanchimont",
            width: 60, walls: false, size: 3840,
            ground: '#3f8a27', ground2: '#4ea52f', runoff: '#c9b89a', sky: ["#7a8fb8", "#b9c6dc"], scenery: 'forest', deco: 'spa',
            pts: [
                [822.2, 538.0], [805.2, 508.5], [788.3, 479.0], [771.3, 449.6], [754.3, 420.1], [737.3, 390.7],
                [720.4, 361.2], [703.4, 331.7], [686.4, 302.3], [669.4, 272.8], [652.5, 243.4, { sign: 'LA SOURCE' }],
                [635.5, 213.9], [630.6, 182.7], [659.0, 170.0], [690.5, 182.5], [720.9, 197.7], [751.4, 212.6],
                [782.1, 227.2], [812.8, 241.9, { hill: -1.0 }], [843.5, 256.5, { hill: -1.0 }], [874.2, 271.1, { hill: -1.0 }],
                [904.1, 287.1, { hill: -1.0 }], [933.2, 304.9, { hill: -1.0 }], [962.2, 322.6, { hill: -1.0 }],
                [989.7, 342.5, { hill: -1.0 }], [1017.1, 362.6, { hill: -1.0 }], [1044.4, 382.9, { hill: -1.0 }],
                [1070.5, 404.6, { hill: -1.0 }], [1096.7, 426.4, { hill: -1.0 }], [1121.5, 449.5, { hill: -1.0 }],
                [1144.6, 474.5, { hill: -1.0 }], [1167.6, 499.5, { hill: -1.0 }], [1189.5, 525.5, { hill: -0.3 }],
                [1211.5, 551.5, { sign: 'EAU ROUGE', hill: -0.3 }], [1233.4, 577.5, { hill: -0.3 }], [1255.3, 603.4, { hill: 1.8 }],
                [1277.3, 629.4, { hill: 1.8 }], [1299.2, 655.4, { hill: 1.8 }], [1321.1, 681.4, { hill: 1.8 }],
                [1343.1, 707.3, { hill: 1.8 }], [1365.0, 733.3, { sign: 'RAIDILLON', hill: 1.8 }], [1386.9, 759.3, { hill: 1.8 }],
                [1408.9, 785.3, { hill: 1.8 }], [1430.8, 811.3, { hill: 1.8 }], [1452.7, 837.2, { hill: 1.8 }],
                [1476.4, 861.6, { hill: 1.8 }], [1504.4, 880.6, { hill: 0.6 }], [1533.2, 898.8, { hill: 0.6 }],
                [1561.8, 917.2, { hill: 0.6 }], [1588.9, 937.4, { hill: 0.6 }], [1612.0, 962.1, { hill: 0.6 }],
                [1630.2, 990.9, { hill: 0.6 }], [1644.5, 1021.7, { hill: 0.6 }], [1654.2, 1054.2, { hill: 0.6 }],
                [1659.9, 1087.6, { hill: 0.6 }], [1664.0, 1121.4, { hill: 0.6 }], [1669.6, 1154.9, { hill: 0.6 }],
                [1681.0, 1186.8, { hill: 0.6 }], [1697.5, 1216.5, { hill: 0.6 }], [1715.6, 1245.3, { hill: 0.6 }], [1733.7, 1274.1],
                [1751.8, 1302.9], [1769.9, 1331.6], [1788.0, 1360.4, { sign: 'KEMMEL' }], [1806.1, 1389.2], [1824.3, 1418.0],
                [1842.4, 1446.7], [1860.5, 1475.5], [1878.6, 1504.3], [1896.8, 1533.0], [1914.9, 1561.8], [1933.0, 1590.5],
                [1947.6, 1621.2], [1961.8, 1652.2], [1974.4, 1683.7], [1984.4, 1716.2], [1994.0, 1748.8], [2003.5, 1781.5],
                [2012.9, 1814.1], [2022.3, 1846.8], [2031.7, 1879.5], [2041.2, 1912.1], [2050.6, 1944.8], [2060.0, 1977.5],
                [2069.4, 2010.1], [2078.9, 2042.8], [2088.3, 2075.5], [2097.7, 2108.1], [2107.1, 2140.8], [2116.6, 2173.5],
                [2126.1, 2206.1], [2135.6, 2238.7], [2145.1, 2271.4], [2154.7, 2304.0], [2164.2, 2336.7], [2173.7, 2369.3],
                [2183.2, 2402.0], [2192.7, 2434.6], [2202.2, 2467.2], [2211.7, 2499.9], [2221.2, 2532.5], [2230.8, 2565.2],
                [2240.3, 2597.8], [2249.8, 2630.5], [2259.3, 2663.1, { sign: 'LES COMBES' }], [2268.8, 2695.7],
                [2278.3, 2728.4], [2287.8, 2761.0], [2297.1, 2793.7], [2306.3, 2826.5], [2315.5, 2859.2], [2324.7, 2891.9],
                [2332.2, 2925.0], [2330.3, 2958.7], [2314.0, 2987.8], [2287.3, 3008.6], [2259.2, 3027.3], [2240.3, 3055.1],
                [2233.4, 3087.9, { sign: 'MALMEDY' }], [2238.0, 3121.4], [2245.5, 3154.6], [2252.9, 3187.8], [2260.4, 3221.0],
                [2267.9, 3254.1], [2269.3, 3287.9], [2260.4, 3320.2], [2239.7, 3347.0, { hill: -0.6 }],
                [2212.8, 3367.7, { hill: -0.6 }], [2184.8, 3387.0, { hill: -0.6 }], [2156.7, 3406.2, { hill: -0.6 }],
                [2128.7, 3425.4, { hill: -0.6 }], [2100.7, 3444.7, { hill: -0.6 }], [2072.6, 3463.9, { hill: -0.6 }],
                [2044.6, 3483.2, { hill: -0.6 }], [2016.6, 3502.4, { hill: -0.6 }], [1988.5, 3521.7, { hill: -0.6 }],
                [1960.5, 3540.9, { hill: -0.6 }], [1932.5, 3560.1, { hill: -0.6 }], [1904.5, 3579.4, { hill: -0.6 }],
                [1876.4, 3598.6, { sign: 'RIVAGE', hill: -0.6 }], [1848.4, 3617.9, { hill: -0.6 }], [1820.4, 3637.1, { hill: -0.6 }],
                [1789.6, 3651.4, { hill: -0.6 }], [1756.0, 3650.1, { hill: -0.6 }], [1725.4, 3636.5, { hill: -0.6 }],
                [1702.8, 3611.7, { hill: -0.6 }], [1692.1, 3579.9, { hill: -0.6 }], [1694.5, 3546.5], [1709.5, 3516.2],
                [1734.3, 3493.4], [1763.3, 3475.7], [1792.3, 3457.9], [1821.2, 3440.1], [1850.2, 3422.3], [1879.2, 3404.5],
                [1908.2, 3386.8], [1931.9, 3362.7], [1943.8, 3331.3], [1943.5, 3297.5], [1933.2, 3265.2], [1922.2, 3233.0],
                [1911.1, 3200.9], [1900.1, 3168.7], [1889.1, 3136.6], [1878.1, 3104.4], [1867.6, 3072.1], [1859.1, 3039.2],
                [1850.5, 3006.2], [1843.2, 2973.1], [1836.8, 2939.7], [1830.3, 2906.3], [1823.9, 2872.9], [1817.5, 2839.5],
                [1811.0, 2806.1], [1804.6, 2772.7], [1798.2, 2739.4], [1792.2, 2705.9], [1786.6, 2672.4], [1781.1, 2638.8],
                [1775.5, 2605.3], [1770.0, 2571.7], [1762.6, 2538.6], [1747.5, 2508.2], [1726.0, 2482.0],
                [1700.5, 2459.7, { sign: 'POUHON' }], [1671.2, 2442.7], [1639.1, 2432.1], [1605.4, 2427.6], [1571.5, 2425.3],
                [1537.6, 2423.0], [1503.7, 2421.7], [1469.9, 2425.4], [1437.1, 2434.4], [1405.5, 2446.9], [1376.1, 2463.6],
                [1349.5, 2484.6], [1325.0, 2508.1], [1305.5, 2536.0], [1289.3, 2565.9], [1274.6, 2596.4], [1261.9, 2628.0],
                [1249.2, 2659.5], [1236.5, 2691.0], [1223.8, 2722.6], [1211.1, 2754.1], [1198.4, 2785.7], [1185.7, 2817.2],
                [1173.0, 2848.7], [1160.2, 2880.3], [1147.5, 2911.8], [1134.7, 2943.3], [1122.0, 2974.8], [1109.2, 3006.3],
                [1096.5, 3037.9], [1082.3, 3068.7], [1064.2, 3097.2], [1039.1, 3119.8, { sign: 'FAGNES' }], [1008.9, 3135.1],
                [975.9, 3142.4], [942.2, 3140.4], [910.1, 3129.9], [880.8, 3112.8], [851.5, 3095.6], [819.4, 3085.3],
                [785.7, 3083.4], [752.5, 3090.0], [722.4, 3104.8], [698.3, 3128.3], [678.0, 3155.6], [659.3, 3184.0],
                [640.9, 3212.6], [622.6, 3241.2], [604.2, 3269.8], [585.9, 3298.5], [567.5, 3327.1], [549.2, 3355.7],
                [530.8, 3384.3], [512.5, 3412.9], [487.6, 3435.6], [456.0, 3447.1], [422.2, 3447.0], [392.0, 3431.7],
                [364.4, 3411.7], [336.9, 3391.8, { sign: 'STAVELOT' }], [309.3, 3371.9], [281.8, 3351.9], [254.3, 3331.9],
                [226.8, 3311.9], [204.7, 3286.4], [186.5, 3257.7], [175.3, 3225.7], [170.0, 3192.3], [171.7, 3158.5],
                [179.7, 3125.6], [191.5, 3093.7], [203.4, 3061.9], [215.1, 3030.0], [228.6, 2998.9], [245.3, 2969.2],
                [262.2, 2939.7], [281.8, 2912.0], [301.5, 2884.3], [323.9, 2858.7], [346.6, 2833.4], [369.4, 2808.2],
                [393.8, 2784.5], [418.3, 2760.9], [442.7, 2737.2], [467.1, 2713.6], [493.2, 2691.9], [520.1, 2671.0],
                [547.9, 2651.6], [577.3, 2634.5, { hill: 0.4 }], [607.1, 2618.2, { hill: 0.4 }], [637.3, 2602.6, { hill: 0.4 }],
                [667.5, 2587.0, { hill: 0.4 }], [697.7, 2571.3, { hill: 0.4 }], [727.9, 2555.7, { hill: 0.4 }],
                [758.1, 2540.0, { hill: 0.4 }], [788.3, 2524.4, { hill: 0.4 }], [818.5, 2508.8, { hill: 0.4 }],
                [848.7, 2493.1, { hill: 0.4 }], [878.3, 2476.5, { hill: 0.4 }], [907.1, 2458.5, { hill: 0.4 }],
                [934.0, 2437.6, { hill: 0.4 }], [959.6, 2415.3, { hill: 0.4 }], [983.7, 2391.5, { hill: 0.4 }],
                [1005.6, 2365.4, { hill: 0.4 }], [1026.2, 2338.4, { hill: 0.4 }], [1044.6, 2309.9, { hill: 0.4 }],
                [1060.9, 2280.0, { hill: 0.4 }], [1076.7, 2250.0, { hill: 0.4 }], [1090.8, 2219.0, { sign: 'BLANCHIMONT', hill: 0.4 }],
                [1105.0, 2188.1], [1119.0, 2157.1], [1133.0, 2126.2], [1147.0, 2095.2], [1161.0, 2064.2], [1174.5, 2033.0],
                [1185.4, 2000.9], [1191.6, 1967.5], [1192.6, 1933.5], [1188.0, 1899.9], [1178.1, 1867.6], [1165.7, 1835.9],
                [1153.3, 1804.2], [1140.9, 1772.6], [1128.6, 1740.9], [1116.4, 1709.2], [1104.1, 1677.4], [1092.1, 1645.6],
                [1080.1, 1613.8], [1068.2, 1582.0], [1056.2, 1550.1], [1045.2, 1518.0], [1036.7, 1485.1], [1029.4, 1451.9],
                [1022.6, 1418.6], [1017.5, 1385.0], [1013.0, 1351.3], [1009.6, 1317.5], [1006.8, 1283.6], [1004.4, 1249.7],
                [1002.1, 1215.8], [999.8, 1181.8], [997.5, 1147.9], [995.2, 1114.0], [992.9, 1080.1], [1002.8, 1049.2],
                [1035.3, 1046.1], [1069.2, 1047.0, { sign: 'BUS STOP' }], [1096.7, 1030.4], [1092.0, 998.0], [1074.2, 969.1],
                [1056.3, 940.1], [1038.5, 911.2], [1020.7, 882.2], [1003.0, 853.2], [986.1, 823.7], [969.2, 794.2],
                [952.2, 764.7], [935.3, 735.2], [918.4, 705.7], [901.5, 676.2], [884.6, 646.7], [867.7, 617.2],
                [850.8, 587.7], [833.8, 558.2],
            ],
        },
        {
            id: 'monaco', name: 'MONACO', laps: 3,
            sub: "Muretti a un palmo, il tornante, il tunnel, la piscina e gli yacht nel porto",
            width: 52, walls: true, size: 3520,
            ground: '#9aa0ad', ground2: '#8a8f9c', runoff: '#6b6f7a', sky: ["#4fc3ff", "#b8ecff"], scenery: 'city', deco: 'monaco',
            pts: [
                [1727.0, 778.5], [1730.0, 715.2], [1760.2, 658.0], [1799.7, 606.7], [1839.2, 555.3],
                [1877.8, 503.3, { sign: 'SAINTE DEVOTE' }], [1916.4, 451.2], [1954.9, 399.1], [1993.5, 347.1], [2032.1, 295.0],
                [2070.7, 243.0], [2109.1, 190.8], [2163.8, 170.0], [2215.0, 205.7], [2231.1, 267.1, { hill: 0.6 }],
                [2241.5, 330.0, { hill: 0.6 }], [2277.9, 383.4, { hill: 0.6 }], [2312.5, 438.1, { sign: 'BEAU RIVAGE', hill: 0.6 }],
                [2346.3, 489.9, { hill: 0.6 }], [2392.1, 457.5, { hill: 0.6 }], [2355.4, 409.2, { hill: 0.6 }],
                [2315.2, 358.4, { hill: 0.6 }], [2278.4, 305.4, { hill: 0.6 }], [2290.4, 245.1, { hill: 0.6 }],
                [2350.3, 221.4, { hill: 0.6 }], [2411.9, 201.4, { hill: 0.6 }], [2472.7, 179.1, { hill: 0.6 }],
                [2535.5, 181.9, { hill: 0.6 }], [2552.9, 239.9, { sign: 'MASSENET', hill: 0.6 }], [2550.4, 304.6], [2547.9, 369.4],
                [2545.3, 434.1], [2535.9, 498.2], [2526.3, 562.3], [2516.6, 626.4], [2503.8, 689.8, { sign: 'CASINO' }],
                [2488.3, 752.7], [2470.4, 814.9], [2447.1, 875.4], [2417.7, 932.9], [2385.3, 989.1], [2348.1, 1041.9],
                [2308.1, 1092.9], [2265.1, 1141.3], [2221.2, 1188.9], [2174.2, 1232.9], [2118.8, 1266.6, { sign: 'MIRABEAU' }],
                [2063.5, 1300.2], [2006.9, 1331.6], [1948.6, 1360.0], [1889.9, 1387.5], [1831.2, 1414.8], [1772.4, 1442.0],
                [1711.7, 1464.5], [1650.4, 1485.6], [1587.6, 1501.6, { sign: 'TORNANTE' }], [1524.6, 1516.4], [1461.5, 1531.2],
                [1397.5, 1541.4], [1333.5, 1551.7], [1276.5, 1573.2], [1255.7, 1631.3], [1193.4, 1641.5], [1134.0, 1620.4],
                [1069.7, 1628.8], [1005.4, 1637.2], [941.2, 1645.6, { sign: 'PORTIER' }], [876.9, 1653.9], [812.7, 1662.3],
                [748.5, 1671.5], [684.4, 1680.7, { tunnel: 1 }], [620.3, 1690.4, { tunnel: 1 }], [556.3, 1700.4, { tunnel: 1 }],
                [492.2, 1710.2, { tunnel: 1 }], [431.8, 1727.3, { tunnel: 1 }], [398.4, 1782.2, { tunnel: 1 }],
                [371.1, 1841.0, { sign: 'TUNNEL', tunnel: 1 }], [348.1, 1901.5, { tunnel: 1 }], [332.9, 1964.4, { tunnel: 1 }],
                [324.4, 2028.6, { tunnel: 1 }], [323.9, 2093.4, { tunnel: 1 }], [323.7, 2158.2, { tunnel: 1 }],
                [344.4, 2217.1, { tunnel: 1 }], [394.9, 2257.3, { tunnel: 1 }], [431.7, 2308.7, { tunnel: 1 }],
                [441.0, 2372.8, { tunnel: 1 }], [452.1, 2436.6, { tunnel: 1 }], [463.2, 2500.5, { tunnel: 1 }], [474.3, 2564.3],
                [486.9, 2627.8], [494.8, 2690.8], [444.1, 2729.6, { sign: 'CHICANE' }], [431.3, 2786.1], [451.5, 2847.6],
                [474.6, 2908.1], [502.2, 2966.7], [536.6, 3021.4], [576.5, 3072.2], [622.5, 3117.9], [679.4, 3148.8],
                [738.0, 3176.1], [762.6, 3234.0], [716.0, 3270.8], [653.3, 3287.2, { sign: 'TABAC' }], [589.6, 3298.9],
                [525.2, 3297.3], [483.5, 3255.4], [471.0, 3192.2], [432.1, 3140.9], [394.8, 3088.0], [360.0, 3033.4],
                [331.5, 2975.6], [309.5, 2914.7], [291.5, 2852.5, { sign: 'PISCINA' }], [273.5, 2790.2], [255.5, 2728.0],
                [237.5, 2665.7], [221.9, 2602.8], [209.8, 2539.2], [199.9, 2475.2], [190.7, 2411.0], [182.6, 2346.8],
                [177.0, 2282.2], [171.5, 2217.6], [170.0, 2152.9], [170.3, 2088.1], [173.9, 2023.4], [180.1, 1958.9],
                [191.5, 1895.3], [210.4, 1833.4], [228.0, 1771.1], [229.5, 1706.6], [252.7, 1653.8], [315.2, 1637.0],
                [379.8, 1633.0], [444.1, 1625.1], [508.4, 1617.0], [572.4, 1606.6], [635.5, 1592.5], [697.7, 1574.3],
                [759.9, 1556.2], [822.1, 1538.0], [884.6, 1521.0], [947.3, 1504.8, { sign: 'RASCASSE' }], [1011.3, 1494.4],
                [1075.5, 1486.2], [1139.2, 1476.6], [1199.5, 1453.1], [1258.1, 1425.4], [1316.7, 1397.8], [1376.0, 1371.6],
                [1436.6, 1349.3], [1499.9, 1335.2], [1563.6, 1323.7], [1627.8, 1314.6, { sign: 'NOGHES' }], [1691.7, 1303.9],
                [1753.5, 1285.0], [1808.6, 1251.1], [1854.5, 1205.5], [1891.8, 1152.8], [1905.2, 1090.1], [1898.2, 1025.8],
                [1878.8, 964.2], [1848.2, 907.7], [1798.2, 866.5], [1750.7, 822.6],
            ],
        },
    ];
    window.KartTracks = { TRACKS: TRACKS, get: function (id) { return TRACKS.find(function (t) { return t.id === id; }); } };
})();

/* ---- js/games/kart/world.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function () {
    'use strict';
    var TEXEL = 2;
    var SURF = { GRASS: 0, ROAD: 1, KERB: 2, SAND: 3, WALL: 4 };
    function catmull(p0, p1, p2, p3, t) {
        var t2 = t * t, t3 = t2 * t;
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
    }
    function sampleTrack(tr) {
        var P = tr.pts, n = P.length;
        var dense = [];
        for (var i = 0; i < n; i++) {
            var a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n], d = P[(i + 2) % n];
            var ob = b[2] || {}, oc = c[2] || {};
            for (var t = 0; t < 1; t += 0.02) {
                dense.push({
                    x: catmull(a[0], b[0], c[0], d[0], t), y: catmull(a[1], b[1], c[1], d[1], t),
                    hill: (ob.hill || 0) * (1 - t) + (oc.hill || 0) * t,
                    tunnel: !!(ob.tunnel && (oc.tunnel || t < 0.6)),
                    pt: i,
                });
            }
        }
        var out = [];
        var acc = 0;
        out.push(Object.assign({}, dense[0]));
        for (var i = 1; i <= dense.length; i++) {
            var p = dense[i - 1], q = dense[i % dense.length];
            var d = Math.hypot(q.x - p.x, q.y - p.y);
            acc += d;
            while (acc >= 4) {
                acc -= 4;
                var k = 1 - acc / (d || 1);
                out.push({ x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k, hill: q.hill, tunnel: q.tunnel, pt: q.pt });
            }
        }
        out.pop();
        for (var i = 0; i < out.length; i++) {
            var a = out[(i - 1 + out.length) % out.length], b = out[(i + 1) % out.length];
            out[i].dir = Math.atan2(b.y - a.y, b.x - a.x);
        }
        var start = out.findIndex(function (s) { return s.pt === 1; });
        return out.slice(start).concat(out.slice(0, start));
    }
    function hash(x, y) { var h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
    function strokePath(g, S, width, color, dash) {
        g.strokeStyle = color;
        g.lineWidth = width;
        g.lineJoin = 'round';
        g.lineCap = 'round';
        g.setLineDash(dash || []);
        g.beginPath();
        S.forEach(function (s, i) { return (i ? g.lineTo(s.x, s.y) : g.moveTo(s.x, s.y)); });
        g.closePath();
        g.stroke();
        g.setLineDash([]);
    }
    function build(tr) {
        var S = sampleTrack(tr);
        var W = tr.width;
        var WS = tr.size;
        var TS = WS / TEXEL;
        var tc = document.createElement('canvas');
        tc.width = tc.height = TS;
        var g = tc.getContext('2d');
        g.scale(1 / TEXEL, 1 / TEXEL);
        for (var y = 0; y < WS; y += 64)
            for (var x = 0; x < WS; x += 64) {
                g.fillStyle = ((x + y) / 64) % 2 ? tr.ground : tr.ground2;
                g.fillRect(x, y, 64, 64);
            }
        for (var i = 0; i < 12000; i++) {
            g.fillStyle = hash(i, 7) < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.10)';
            g.fillRect(Math.floor(hash(i, 1) * WS), Math.floor(hash(i, 2) * WS), 4, 4);
        }
        var harbor = null;
        if (tr.id === 'monaco') {
            harbor = new Path2D();
            var from = Math.floor(S.length * 0.53);
            for (var i = from; i < S.length; i++)
                (i === from ? harbor.moveTo(S[i].x, S[i].y) : harbor.lineTo(S[i].x, S[i].y));
            harbor.closePath();
            g.fillStyle = '#2f8bff';
            g.fill(harbor);
            g.save();
            g.clip(harbor);
            g.fillStyle = '#5fb0ff';
            for (var y = 0; y < WS; y += 28)
                for (var x = 0; x < WS; x += 44)
                    g.fillRect(x + (y % 56 ? 16 : 0), y, 16, 4);
            g.restore();
        }
        if (!tr.walls)
            strokePath(g, S, W + 44, tr.runoff);
        else
            strokePath(g, S, W + 14, '#c9ccd4');
        if (tr.walls)
            strokePath(g, S, W + 14, '#ff3b3b', [10, 10]);
        strokePath(g, S, W + 8, '#ffffff');
        strokePath(g, S, W + 8, '#e8202a', [8, 8]);
        strokePath(g, S, W, '#55565f');
        for (var i = 0; i < S.length; i++) {
            if (!S[i].tunnel)
                continue;
            g.fillStyle = '#3a3b42';
            g.beginPath();
            g.arc(S[i].x, S[i].y, W / 2, 0, Math.PI * 2);
            g.fill();
        }
        for (var i = 0; i < S.length * 12; i++) {
            var s = S[Math.floor(hash(i, 3) * S.length)];
            var off = (hash(i, 4) - 0.5) * W * 0.9;
            var nx = -Math.sin(s.dir), ny = Math.cos(s.dir);
            g.fillStyle = hash(i, 5) < 0.5 ? '#4a4b54' : '#62636d';
            g.fillRect(Math.round(s.x + nx * off), Math.round(s.y + ny * off), 4, 4);
        }
        for (var i = 0; i < S.length; i += 6) {
            if (S[i].tunnel)
                continue;
            g.fillStyle = 'rgba(255,255,255,0.35)';
            g.fillRect(Math.round(S[i].x) - 2, Math.round(S[i].y) - 2, 4, 4);
        }
        var s0 = S[0];
        var nx0 = -Math.sin(s0.dir), ny0 = Math.cos(s0.dir), tx0 = Math.cos(s0.dir), ty0 = Math.sin(s0.dir);
        for (var a = -W / 2; a < W / 2; a += 4)
            for (var b = 0; b < 8; b += 4) {
                g.fillStyle = ((a / 4 + b / 4) & 1) ? '#ffffff' : '#1b1b26';
                g.save();
                g.translate(s0.x + nx0 * a + tx0 * b, s0.y + ny0 * a + ty0 * b);
                g.rotate(s0.dir);
                g.fillRect(0, 0, 4, 4);
                g.restore();
            }
        for (var k = 1; k <= 4; k++) {
            var s = S[(S.length - 6 * k) % S.length];
            var side = k % 2 ? -1 : 1;
            var nx = -Math.sin(s.dir), ny = Math.cos(s.dir);
            g.fillStyle = '#ffffff';
            g.save();
            g.translate(s.x + nx * side * W * 0.22, s.y + ny * side * W * 0.22);
            g.rotate(s.dir);
            g.fillRect(-2, -8, 4, 16);
            g.restore();
        }
        var tex = new Uint32Array(g.getImageData(0, 0, TS, TS).data.buffer);
        var sc = document.createElement('canvas');
        sc.width = sc.height = TS;
        var h = sc.getContext('2d');
        h.scale(1 / TEXEL, 1 / TEXEL);
        var col = function (t) { return "rgb(".concat(t * 50, ",0,0)"); };
        h.fillStyle = col(tr.walls ? SURF.WALL : SURF.GRASS);
        h.fillRect(0, 0, WS, WS);
        if (!tr.walls)
            strokePath(h, S, W + 44, col(SURF.SAND));
        strokePath(h, S, W + 8, col(SURF.KERB));
        strokePath(h, S, W, col(SURF.ROAD));
        var raw = h.getImageData(0, 0, TS, TS).data;
        var surf = new Uint8Array(TS * TS);
        for (var i = 0; i < surf.length; i++)
            surf[i] = Math.round(raw[i * 4] / 50);
        var mm = document.createElement('canvas');
        mm.width = mm.height = 64;
        var m = mm.getContext('2d');
        m.scale(64 / WS, 64 / WS);
        strokePath(m, S, WS / 64 * 4, '#1b1b26');
        strokePath(m, S, WS / 64 * 2, '#ffffff');
        var deco = makeDeco(tr, S, harbor, g);
        return {
            track: tr, samples: S,
            tex: tex,
            texSize: TS, size: WS,
            surf: surf,
            minimap: mm,
            deco: deco,
            panorama: makePanorama(tr),
            surfAt: function (x, y) {
                var ix = (x / TEXEL) | 0, iy = (y / TEXEL) | 0;
                if (x < 0 || y < 0 || ix >= TS || iy >= TS)
                    return SURF.WALL;
                return surf[iy * TS + ix];
            },
            length: S.length * 4,
        };
    }
    function makeDeco(tr, S, harbor, g) {
        var e_1, _a;
        var out = [];
        var W = tr.width;
        var SIZE = tr.size;
        var near = function (x, y, r) { return S.some(function (s, i) { return (i % 3 === 0) && Math.hypot(s.x - x, s.y - y) < r; }); };
        var add = function (kind, x, y, extra) { if (x > 8 && y > 8 && x < SIZE - 8 && y < SIZE - 8)
            out.push(Object.assign({ kind: kind, x: x, y: y }, extra || {})); };
        tr.pts.forEach(function (p) {
            if (!p[2] || !p[2].sign)
                return;
            var s = S.reduce(function (best, q) { return (Math.hypot(q.x - p[0], q.y - p[1]) < Math.hypot(best.x - p[0], best.y - p[1]) ? q : best); }, S[0]);
            var nx = -Math.sin(s.dir), ny = Math.cos(s.dir);
            var d = W / 2 + (tr.walls ? 20 : 34);
            add('sign', s.x + nx * d, s.y + ny * d, { text: p[2].sign });
        });
        for (var i = 0; i < S.length; i += 7) {
            var s = S[i];
            var nx = -Math.sin(s.dir), ny = Math.cos(s.dir);
            try {
                for (var _b = (e_1 = void 0, __values([-1, 1])), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var side = _c.value;
                    if (hash(i, side + 5) < 0.45)
                        continue;
                    var d = W / 2 + (tr.walls ? 22 : 40) + hash(i, side + 9) * 40;
                    var x = s.x + nx * side * d, y = s.y + ny * side * d;
                    if (near(x, y, W / 2 + (tr.walls ? 18 : 30)))
                        continue;
                    if (tr.id === 'monza')
                        add(hash(i, 11) < 0.7 ? 'tree' : 'pine', x, y);
                    else if (tr.id === 'spa')
                        add(hash(i, 11) < 0.75 ? 'pine' : 'tree', x, y);
                    else if (s.tunnel)
                        continue;
                    else {
                        if (harbor && g.isPointInPath(harbor, x / TEXEL, y / TEXEL))
                            continue;
                        add(hash(i, 11) < 0.6 ? 'building' : 'palm', x, y, { c: Math.floor(hash(i, 13) * 5) });
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        for (var k = 4; k < 40; k += 9) {
            var s = S[k];
            var nx = -Math.sin(s.dir), ny = Math.cos(s.dir);
            add('stand', s.x - nx * (W / 2 + (tr.walls ? 20 : 34)), s.y - ny * (W / 2 + (tr.walls ? 20 : 34)));
        }
        if (tr.id === 'monza') {
            var cx = S.reduce(function (t, s) { return t + s.x; }, 0) / S.length, cy = S.reduce(function (t, s) { return t + s.y; }, 0) / S.length;
            for (var a = 0; a < Math.PI * 1.2; a += 0.06) {
                var x = cx + Math.cos(a + Math.PI) * 420, y = cy + Math.sin(a + Math.PI) * 260;
                if (!near(x, y, W / 2 + 40))
                    add('banking', x, y);
            }
        }
        if (tr.id === 'monaco') {
            for (var y = 0; y < SIZE; y += 70)
                for (var x = 0; x < SIZE; x += 70) {
                    if (hash(x, y) > 0.55 || !g.isPointInPath(harbor, x / TEXEL, y / TEXEL) || near(x, y, W / 2 + 40))
                        continue;
                    add('yacht', x + hash(y, x) * 20, y, { c: Math.floor(hash(x, y + 1) * 5) });
                }
        }
        return out;
    }
    function makePanorama(tr) {
        var c = document.createElement('canvas');
        c.width = 512;
        c.height = 40;
        var g = c.getContext('2d');
        var rect = function (x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); };
        if (tr.scenery === 'alps') {
            for (var x = 0; x < 512; x++) {
                var h = 14 + Math.sin(x * 0.05) * 6 + Math.sin(x * 0.13 + 1) * 5 + Math.sin(x * 0.021) * 6;
                rect(x, 40 - h, 1, h, '#7a8fb8');
                if (h > 22)
                    rect(x, 40 - h, 1, Math.min(4, h - 22), '#ffffff');
            }
            for (var x = 0; x < 512; x += 3) {
                var h = 5 + (hash(x, 1) * 5) | 0;
                rect(x, 40 - h, 3, h, '#2f7a24');
            }
        }
        else if (tr.scenery === 'forest') {
            for (var x = 0; x < 512; x++) {
                var h = 10 + Math.sin(x * 0.03) * 6 + Math.sin(x * 0.09) * 3;
                rect(x, 40 - h, 1, h, '#3f6a4a');
            }
            for (var x = 0; x < 512; x += 5) {
                var h = 10 + (hash(x, 2) * 14) | 0;
                for (var k = 0; k < h; k++)
                    rect(x + 2 - Math.floor(k / 4), 40 - k, 1 + Math.floor(k / 2) % 5, 1, '#1f4a2a');
            }
        }
        else {
            rect(0, 32, 512, 8, '#2f8bff');
            for (var x = 0; x < 512; x++) {
                var h = 16 + Math.sin(x * 0.02) * 8;
                rect(x, 32 - h, 1, h, '#8a9a6a');
            }
            for (var x = 0; x < 512; x += 9) {
                var h = 6 + (hash(x, 3) * 18) | 0, w = 6 + (hash(x, 4) * 4) | 0;
                var cols = ['#f2e6c9', '#ffd2a0', '#ffffff', '#ffb8a0', '#e8d8a8'];
                rect(x, 30 - h, w, h, cols[x % 5]);
                for (var yy = 32 - h; yy < 30; yy += 3)
                    rect(x + 1, yy, w - 2, 1, '#c9a07a');
            }
        }
        return c;
    }
    function preview(tr, size) {
        size = size || 64;
        var S = sampleTrack(tr);
        var c = document.createElement('canvas');
        c.width = c.height = size;
        var g = c.getContext('2d');
        var WS = tr.size;
        g.scale(size / WS, size / WS);
        strokePath(g, S, WS / size * 4, '#1b1b26');
        strokePath(g, S, WS / size * 2, '#ffffff');
        g.fillStyle = '#ff3b3b';
        g.fillRect(S[0].x - WS / size * 2, S[0].y - WS / size * 2, WS / size * 4, WS / size * 4);
        return c;
    }
    window.KartWorld = { build: build, preview: preview, SURF: SURF };
})();

/* ---- js/games/kart/art.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    'use strict';
    var K = '#1b1b26';
    function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function buildKart(color, dark, charId) {
        var e_1, _a;
        var ch = KartChars.get(charId);
        var views = {};
        var _loop_1 = function (view) {
            var c = cv(24, 18);
            var g = c.getContext('2d');
            var r = function (x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); };
            if (view === 'back' || view === 'front') {
                r(0, 10, 6, 8, K);
                r(1, 11, 4, 6, '#3a3d48');
                r(18, 10, 6, 8, K);
                r(19, 11, 4, 6, '#3a3d48');
                r(4, 9, 16, 7, K);
                r(5, 10, 14, 5, color);
                r(5, 14, 14, 1, dark);
                if (view === 'back') {
                    r(3, 7, 18, 3, K);
                    r(4, 8, 16, 1, color);
                    r(9, 15, 2, 2, '#6b6f7a');
                    r(13, 15, 2, 2, '#6b6f7a');
                }
                else {
                    r(6, 15, 12, 2, K);
                    r(7, 15, 10, 1, '#ffffff');
                    r(8, 11, 2, 2, '#ffe14a');
                    r(14, 11, 2, 2, '#ffe14a');
                }
                g.save();
                g.translate(7, 1);
                KartChars.drawRows(g, ch.back, ch.pal, 0, 0, 1);
                g.restore();
                if (view === 'front') {
                    r(9, 4, 6, 3, ch.pal.s || '#f2c49a');
                    r(10, 5, 1, 1, K);
                    r(13, 5, 1, 1, K);
                }
            }
            else {
                var fl = view === 'left';
                g.save();
                if (fl) {
                    g.translate(24, 0);
                    g.scale(-1, 1);
                }
                r(1, 11, 7, 7, K);
                r(2, 12, 5, 5, '#3a3d48');
                r(16, 12, 6, 6, K);
                r(17, 13, 4, 4, '#3a3d48');
                r(3, 9, 20, 5, K);
                r(4, 10, 18, 3, color);
                r(4, 12, 18, 1, dark);
                r(0, 6, 3, 5, K);
                r(0, 6, 2, 1, color);
                r(20, 9, 4, 3, K);
                r(21, 10, 3, 1, color);
                g.translate(7, 1);
                KartChars.drawRows(g, ch.back, ch.pal, 0, 0, 1);
                g.restore();
            }
            views[view] = c;
        };
        try {
            for (var _b = __values(['back', 'front', 'left', 'right']), _c = _b.next(); !_c.done; _c = _b.next()) {
                var view = _c.value;
                _loop_1(view);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return views;
    }
    var DECO = {};
    function rows(def, pal) {
        var c = cv(def[0].length, def.length);
        var g = c.getContext('2d');
        def.forEach(function (row, y) { return __spreadArray([], __read(row), false).forEach(function (ch, x) { if (pal[ch]) {
            g.fillStyle = pal[ch];
            g.fillRect(x, y, 1, 1);
        } }); });
        return c;
    }
    function init() {
        if (DECO.tree)
            return;
        DECO.tree = rows([
            '....kkkkkk....', '..kkggggggkk..', '.kgggGggggggk.', 'kggGgggggGgggk', 'kgggggGgggggGk', 'kgGggggggGgggk',
            'kgggggggggggGk', '.kggGgggggggk.', '..kkggggggkk..', '....kkbbkk....', '.....kbbk.....', '.....kbbk.....', '.....kbbk.....', '....kkbbkk....',
        ], { k: K, g: '#2f7a24', G: '#46a336', b: '#8a5a2c' });
        DECO.pine = rows([
            '......kk......', '.....kggk.....', '....kgGggk....', '...kggggGgk...', '....kgggGk....', '...kgGgggggk..', '..kgggggGgggk.',
            '...kggGgggk...', '..kggggggGggk.', '.kgggGgggggggk', 'kkkkkkkkkkkkkk', '.....kbbk.....', '.....kbbk.....',
        ], { k: K, g: '#1f5a2a', G: '#2f7a3a', b: '#5a3a22' });
        DECO.palm = rows([
            '..gg....gg....', '.gGgg..ggGgg..', 'gg..gggg...gg.', '.....gbg......', '.....kbk......', '......kbk.....', '......kbk.....',
            '......kbk.....', '.....kbk......', '.....kbk......', '.....kbk......', '....kkbkk.....',
        ], { k: K, g: '#2f7a24', G: '#46a336', b: '#c98a4a' });
        DECO.stand = rows([
            'kkkkkkkkkkkkkkkkkkkkkkkk', 'kwwwwwwwwwwwwwwwwwwwwwwk', 'kRRRRRRRRRRRRRRRRRRRRRRk', 'kprpbpypgprpbpypgprpbpyk',
            'kpppppppppppppppppppppppk'.slice(0, 24), 'kpypgprpbpypgprpbpypgprk', 'kppppppppppppppppppppppk', 'kgprpbpypgprpbpypgprpbpk',
            'kssssssssssssssssssssssk', 'ksk..................ksk', 'ksk..................ksk',
        ], { k: K, w: '#ffffff', R: '#ff3b3b', p: '#9aa0ad', r: '#ff7ab8', b: '#2f8bff', y: '#ffd23b', g: '#3fe05a', s: '#6b6f7a' });
        DECO.banking = rows([
            'kkkkkkkkkkkkkkkk', 'kccccccccccccccc', 'kcCcccccccCccccc', 'kccccccccccccccc', 'kcccCccccccccCcc', 'kccccccccccccccc', 'kkkkkkkkkkkkkkkk',
        ], { k: K, c: '#b9bcc4', C: '#9aa0ad' });
        var BCOL = ['#f2e6c9', '#ffd2a0', '#ffb8a0', '#e8d8a8', '#ffffff'];
        DECO.building = BCOL.map(function (col) { return rows([
            'kkkkkkkkkkkkkk', 'krrrrrrrrrrrrk', 'kcccccccccccck', 'kcwwcwwcwwcwwk'.slice(0, 14), 'kcbbcbbcbbcbbk'.slice(0, 14), 'kcccccccccccck', 'kcwwcwwcwwcwwk'.slice(0, 14),
            'kcbbcbbcbbcbbk'.slice(0, 14), 'kcccccccccccck', 'kcwwcwwcwwcwwk'.slice(0, 14), 'kcbbcbbcbbcbbk'.slice(0, 14), 'kccccckkcccccck'.slice(0, 14), 'kccccckkccccck', 'kkkkkkkkkkkkkk',
        ], { k: K, r: '#c2381f', c: col, w: '#9ccbff', b: '#5a8ac9' }); });
        DECO.yacht = ['#ffffff', '#f2e6c9', '#ffd23b', '#9ccbff', '#ffffff'].map(function (col) { return rows([
            '.......k........', '......kwk.......', '.....kwwwkkk....', '....kwbwbwwwk...', 'kkkkkkkkkkkkkkkk', 'kccccccccccccck.', '.kcccccccccccck.', '..kkkkkkkkkkkk..',
        ], { k: K, w: '#ffffff', b: '#2f8bff', c: col }); });
    }
    var signCache = new Map();
    function sign(text) {
        if (signCache.has(text))
            return signCache.get(text);
        var w = PixelFont.width(text) + 6;
        var c = cv(w, 18);
        var g = c.getContext('2d');
        g.fillStyle = K;
        g.fillRect(0, 0, w, 11);
        g.fillStyle = '#ffd23b';
        g.fillRect(1, 1, w - 2, 9);
        PixelFont.draw(g, text, w / 2, 2, { color: K, align: 'center', outline: null });
        g.fillStyle = K;
        g.fillRect(3, 11, 2, 7);
        g.fillRect(w - 5, 11, 2, 7);
        signCache.set(text, c);
        return c;
    }
    function decoImage(d) {
        init();
        if (d.kind === 'sign')
            return sign(d.text);
        if (d.kind === 'building')
            return DECO.building[d.c || 0];
        if (d.kind === 'yacht')
            return DECO.yacht[d.c || 0];
        return DECO[d.kind];
    }
    var DECO_SCALE = { tree: 2.2, pine: 2.6, palm: 2.6, stand: 2, banking: 3, building: 4, yacht: 2.2, sign: 0.7 };
    window.KartArt = { buildKart: buildKart, decoImage: decoImage, DECO_SCALE: DECO_SCALE };
})();

/* ---- js/games/kart/game.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    'use strict';
    var KC = {
        MAX_SPEED: 135,
        ACCEL: 70,
        BRAKE: 160,
        TURN: 2.3,
        TURBO_TIME: 1.3,
        TURBO_MULT: 1.45,
        TURBOS: 3,
        SURF_SPEED: [0.5, 1, 0.92, 0.42, 1],
        LIGHTS: 5,
        LIGHT_STEP: 0.7,
        FINISH_WAIT: 20,
        CPU_NAMES: ['CPU 1', 'CPU 2', 'CPU 3'],
    };
    var rand = function (a, b) { return a + Math.random() * (b - a); };
    var wrapA = function (a) { while (a > Math.PI)
        a -= Math.PI * 2; while (a < -Math.PI)
        a += Math.PI * 2; return a; };
    var KartRace = (function () {
        function KartRace(world, racers, emit) {
            var _this = this;
            this.world = world;
            this.emit = emit || (function () { });
            this.N = world.samples.length;
            this.laps = world.track.laps;
            this.karts = racers.map(function (r, i) {
                var s = world.samples[(_this.N - 8 - 9 * i) % _this.N];
                var side = i % 2 ? 1 : -1;
                var nx = -Math.sin(s.dir), ny = Math.cos(s.dir);
                var pc = ROOM.PLAYERS[r.slot];
                return {
                    slot: r.slot, name: r.name, isBot: !!r.isBot, char: r.char, connected: true,
                    x: s.x + nx * side * world.track.width * 0.22, y: s.y + ny * side * world.track.width * 0.22,
                    heading: s.dir, speed: 0, vdir: s.dir,
                    input: { steer: 0, brake: false, turbo: false },
                    idx: (_this.N - 8 - 9 * i) % _this.N, lap: 0, passedHalf: true, finished: false, finishTime: 0, place: 0,
                    turbos: KC.TURBOS, turboT: 0, surf: 1, bumpT: 0, wrongT: 0, offT: 0, z: 0,
                    sprites: KartArt.buildKart(pc.color, pc.dark, r.char),
                    bot: r.isBot ? { skill: rand(0.9, 0.97), look: rand(12, 18), wobble: rand(0, 6) } : null,
                };
            });
            this.state = 'lights';
            this.lightT = 0;
            this.lightsOn = 0;
            this.raceT = 0;
            this.clock = 0;
            this.firstHumanFinish = 0;
            this.banner = null;
            this.finishOrder = [];
        }
        KartRace.prototype.update = function (dt) {
            var e_1, _a;
            this.clock += dt;
            if (this.banner) {
                this.banner.t += dt;
                if (this.banner.t > this.banner.dur)
                    this.banner = null;
            }
            if (this.state === 'lights') {
                this.lightT += dt;
                var on = Math.min(KC.LIGHTS, Math.floor(this.lightT / KC.LIGHT_STEP));
                if (on > this.lightsOn) {
                    this.lightsOn = on;
                    this.emit('sfx', 'light');
                }
                if (this.lightT > KC.LIGHT_STEP * (KC.LIGHTS + 1) + rand(0, 0.02)) {
                    this.state = 'race';
                    this.lightsOn = 0;
                    this.banner = { text: 'VIA!', color: '#3fe05a', t: 0, dur: 1 };
                    this.emit('sfx', 'go');
                    this.emit('music', true);
                }
                return;
            }
            if (this.state === 'race')
                this.raceT += dt;
            try {
                for (var _b = __values(this.karts), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var k = _c.value;
                    if (k.isBot || k.finished)
                        this.botThink(k, dt);
                    this.physics(k, dt);
                    this.progress(k);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            this.collide();
            this.rank();
            if (this.state === 'race') {
                var humans = this.karts.filter(function (k) { return !k.isBot; });
                var allDone = humans.length ? humans.every(function (k) { return k.finished; }) : this.karts.every(function (k) { return k.finished; });
                var timeout = this.firstHumanFinish && this.raceT - this.firstHumanFinish > KC.FINISH_WAIT;
                if (allDone || timeout)
                    this.end();
            }
        };
        KartRace.prototype.physics = function (k, dt) {
            var inp = k.input;
            k.turboT = Math.max(0, k.turboT - dt);
            k.bumpT = Math.max(0, k.bumpT - dt);
            if (inp.turbo) {
                inp.turbo = false;
                if (k.turbos > 0 && k.turboT <= 0 && this.state === 'race') {
                    k.turbos--;
                    k.turboT = KC.TURBO_TIME;
                    this.emit('sfx', 'turbo');
                    this.emit('hud', k);
                }
            }
            k.surf = this.world.surfAt(k.x, k.y);
            var surfMul = KC.SURF_SPEED[k.surf] != null ? KC.SURF_SPEED[k.surf] : 1;
            var max = KC.MAX_SPEED * surfMul * (k.turboT > 0 ? KC.TURBO_MULT : 1) * (k.isBot ? k.bot.skill * this.rubber(k) : 1);
            var steer = Math.max(-1, Math.min(1, k.connected || k.isBot ? inp.steer : 0));
            if (inp.brake && (k.connected || k.isBot))
                k.speed -= KC.BRAKE * dt;
            else
                k.speed += KC.ACCEL * (k.turboT > 0 ? 2 : 1) * dt;
            if (k.speed > max)
                k.speed -= (k.speed - max) * Math.min(1, 2.5 * dt);
            if (k.speed < 0)
                k.speed = Math.max(k.speed, -30);
            var grip = Math.min(1, Math.abs(k.speed) / 50);
            k.heading = wrapA(k.heading + steer * KC.TURN * grip * dt * (inp.brake ? 1.25 : 1) * Math.sign(k.speed || 1));
            k.vdir = wrapA(k.vdir + wrapA(k.heading - k.vdir) * Math.min(1, dt * (k.surf === 1 ? 9 : 5)));
            var nx = k.x + Math.cos(k.vdir) * k.speed * dt, ny = k.y + Math.sin(k.vdir) * k.speed * dt;
            if (this.world.surfAt(nx, ny) === KartWorld.SURF.WALL) {
                var s = this.world.samples[k.idx];
                var dx = s.x - k.x, dy = s.y - k.y, d = Math.hypot(dx, dy) || 1;
                k.x += dx / d * 2;
                k.y += dy / d * 2;
                k.speed *= 0.45;
                k.vdir = k.heading = wrapA(k.heading + wrapA(s.dir - k.heading) * 0.5);
                if (k.bumpT <= 0) {
                    k.bumpT = 0.4;
                    this.emit('sfx', 'crash');
                    this.emit('buzz', { k: k, pattern: [90] });
                }
            }
            else {
                k.x = nx;
                k.y = ny;
            }
            if ((k.surf === 0 || k.surf === 3) && k.speed > 40) {
                k.offT -= dt;
                if (k.offT <= 0) {
                    k.offT = 0.35;
                    this.emit('buzz', { k: k, pattern: [25] });
                }
            }
        };
        KartRace.prototype.rubber = function (k) {
            var _this = this;
            var humans = this.karts.filter(function (q) { return !q.isBot; });
            if (!humans.length)
                return 1;
            var best = Math.max.apply(Math, __spreadArray([], __read(humans.map(function (q) { return _this.dist(q); })), false));
            var d = this.dist(k) - best;
            if (d < -300)
                return 1.07;
            if (d > 300)
                return 0.94;
            return 1;
        };
        KartRace.prototype.dist = function (k) { return k.lap * this.N + k.idx; };
        KartRace.prototype.progress = function (k) {
            var S = this.world.samples, N = this.N;
            var best = k.idx, bd = 1e9;
            for (var o = -25; o <= 25; o++) {
                var i = (k.idx + o + N) % N;
                var d = Math.pow((S[i].x - k.x), 2) + Math.pow((S[i].y - k.y), 2);
                if (d < bd) {
                    bd = d;
                    best = i;
                }
            }
            var prev = k.idx;
            k.idx = best;
            if (best > N * 0.4 && best < N * 0.6)
                k.passedHalf = true;
            if (prev > N * 0.85 && best < N * 0.15) {
                if (k.passedHalf) {
                    k.lap++;
                    k.passedHalf = false;
                    if (k.lap > this.laps && !k.finished)
                        this.finish(k);
                    else if (k.lap > 1) {
                        if (!k.isBot) {
                            this.emit('sfx', k.lap === this.laps ? 'lastlap' : 'lap');
                            this.emit('hud', k);
                        }
                        if (k.lap === this.laps && !k.isBot)
                            this.flash(k, 'ULTIMO GIRO!');
                    }
                    else if (!k.isBot)
                        this.emit('hud', k);
                }
            }
            else if (prev < N * 0.15 && best > N * 0.85) {
                k.lap--;
                k.passedHalf = true;
            }
            var fwd = Math.cos(wrapA(k.heading - S[best].dir));
            if (fwd < -0.3 && k.speed > 20 && this.state === 'race')
                k.wrongT += 1 / 60;
            else
                k.wrongT = 0;
            k.hill = S[best].hill || 0;
            k.tunnel = S[best].tunnel;
        };
        KartRace.prototype.finish = function (k) {
            k.finished = true;
            k.finishTime = this.raceT;
            this.finishOrder.push(k);
            k.place = this.finishOrder.length;
            if (!this.firstHumanFinish)
                this.firstHumanFinish = this.raceT;
            if (!k.isBot) {
                this.emit('sfx', k.place === 1 ? 'win1' : 'finish');
                this.emit('buzz', { k: k, pattern: [100, 60, 100, 60, 250] });
                this.flash(k, k.place === 1 ? 'VITTORIA!' : k.place + ' POSTO');
                this.emit('hud', k);
            }
        };
        KartRace.prototype.flash = function (k, text) { k.msg = { text: text, t: 2 }; };
        KartRace.prototype.rank = function () {
            var e_2, _a;
            var _this = this;
            var order = this.karts.slice().sort(function (a, b) {
                if (a.finished && b.finished)
                    return a.finishTime - b.finishTime;
                if (a.finished)
                    return -1;
                if (b.finished)
                    return 1;
                return _this.dist(b) - _this.dist(a);
            });
            order.forEach(function (k, i) { if (k.pos !== i + 1) {
                k.pos = i + 1;
                if (!k.isBot)
                    _this.emit('hud', k);
            } });
            try {
                for (var _b = __values(this.karts), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var k = _c.value;
                    if (k.msg) {
                        k.msg.t -= 1 / 60;
                        if (k.msg.t <= 0)
                            k.msg = null;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return order;
        };
        KartRace.prototype.collide = function () {
            var ks = this.karts;
            for (var i = 0; i < ks.length; i++)
                for (var j = i + 1; j < ks.length; j++) {
                    var a = ks[i], b = ks[j];
                    var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
                    if (d > 0.01 && d < 10) {
                        var p = (10 - d) / 2, nx = dx / d, ny = dy / d;
                        a.x -= nx * p;
                        a.y -= ny * p;
                        b.x += nx * p;
                        b.y += ny * p;
                        var avg = (a.speed + b.speed) / 2;
                        a.speed = a.speed * 0.7 + avg * 0.3;
                        b.speed = b.speed * 0.7 + avg * 0.3;
                        if (a.bumpT <= 0 || b.bumpT <= 0) {
                            a.bumpT = b.bumpT = 0.3;
                            this.emit('sfx', 'bump');
                            this.emit('buzz', { k: a, pattern: [40] });
                            this.emit('buzz', { k: b, pattern: [40] });
                        }
                    }
                }
        };
        KartRace.prototype.botThink = function (k, dt) {
            var S = this.world.samples, N = this.N;
            var look = Math.round(k.bot ? k.bot.look + k.speed * 0.06 : 14);
            var t = S[(k.idx + look) % N];
            var wob = k.bot ? Math.sin(this.clock * 0.7 + k.bot.wobble) * this.world.track.width * 0.18 : 0;
            var tx = t.x - Math.sin(t.dir) * wob, ty = t.y + Math.cos(t.dir) * wob;
            var want = Math.atan2(ty - k.y, tx - k.x);
            var diff = wrapA(want - k.heading);
            k.input.steer = Math.max(-1, Math.min(1, diff * 2.6));
            var far = S[(k.idx + look * 2) % N];
            var bend = Math.abs(wrapA(far.dir - S[k.idx].dir));
            k.input.brake = (bend > 0.9 && k.speed > 105) || (Math.abs(diff) > 0.8 && k.speed > 70);
            if (k.isBot && !k.finished && k.turbos > 0 && bend < 0.15 && k.speed > 120 && Math.random() < dt * 0.15)
                k.input.turbo = true;
        };
        KartRace.prototype.end = function () {
            if (this.state === 'done')
                return;
            this.state = 'done';
            this.emit('music', false);
            this.emit('over', this.rank());
        };
        return KartRace;
    }());
    window.KartRace = KartRace;
    window.KART = KC;
})();

/* ---- js/games/kart/render.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function () {
    'use strict';
    var W = 384, H = 216;
    var K = '#1b1b26';
    var CAM_BACK = 30, CAM_H = 15;
    var ctx = null;
    var buffers = new Map();
    function init(canvas) {
        canvas.width = W;
        canvas.height = H;
        ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
    }
    function viewports(n) {
        if (n <= 1)
            return [{ x: 0, y: 0, w: W, h: H }];
        if (n === 2)
            return [{ x: 0, y: 0, w: W, h: 107 }, { x: 0, y: 109, w: W, h: 107 }];
        return [{ x: 0, y: 0, w: 191, h: 107 }, { x: 193, y: 0, w: 191, h: 107 }, { x: 0, y: 109, w: 191, h: 107 }, { x: 193, y: 109, w: 191, h: 107 }];
    }
    function hexToABGR(hex) {
        var n = parseInt(hex.slice(1), 16);
        return (0xff000000 | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff)) >>> 0;
    }
    function buffer(w, h) {
        var key = w + 'x' + h;
        if (!buffers.has(key)) {
            var img = ctx.createImageData(w, h);
            buffers.set(key, { img: img, d32: new Uint32Array(img.data.buffer) });
        }
        return buffers.get(key);
    }
    function draw(race, focus, opts) {
        var e_1, _a;
        opts = opts || {};
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = K;
        ctx.fillRect(0, 0, W, H);
        var vps = viewports(focus.length);
        focus.forEach(function (k, i) { return drawView(race, k, vps[i]); });
        if (opts.demo)
            return;
        var mm = race.world.minimap;
        var mx = focus.length <= 1 ? W - 70 : (focus.length === 2 ? W - 70 : W / 2 - 32), my = focus.length <= 1 ? H - 70 : (focus.length === 2 ? H / 2 - 32 : H / 2 - 32);
        ctx.globalAlpha = 0.85;
        ctx.drawImage(mm, mx, my);
        ctx.globalAlpha = 1;
        try {
            for (var _b = __values(race.karts), _c = _b.next(); !_c.done; _c = _b.next()) {
                var k = _c.value;
                var pc = ROOM.PLAYERS[k.slot];
                var ms = race.world.size / 64;
                ctx.fillStyle = K;
                ctx.fillRect(Math.round(mx + k.x / ms) - 2, Math.round(my + k.y / ms) - 2, 5, 5);
                ctx.fillStyle = pc.color;
                ctx.fillRect(Math.round(mx + k.x / ms) - 1, Math.round(my + k.y / ms) - 1, 3, 3);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        drawLights(race);
        if (race.banner) {
            var b = race.banner;
            PixelFont.draw(ctx, b.text, W / 2, H / 2 - 10, { color: b.color, scale: b.t < 0.08 ? 5 : 4, align: 'center', shadow: K });
        }
        if (opts.roomCode && focus.length > 2)
            PixelFont.draw(ctx, opts.roomCode, W / 2, H - 8, { color: '#6b6f7a', align: 'center', outline: null });
    }
    function drawView(race, me, vp) {
        var e_2, _a, e_3, _b, e_4, _c;
        var world = race.world, tr = world.track;
        var w = vp.w, h = vp.h;
        var buf = buffer(w, h);
        var d32 = buf.d32, tex = world.tex, TS = world.texSize;
        var a = me.heading;
        var fx = Math.cos(a), fy = Math.sin(a);
        var camX = me.x - fx * CAM_BACK, camY = me.y - fy * CAM_BACK;
        var F = w * 0.78;
        var pitch = (me.hill || 0) * h * 0.06 + (me.bumpT > 0 ? Math.sin(race.clock * 60) * 1.5 : 0);
        var hy = Math.round(h * 0.36 + pitch);
        var sky0 = hexToABGR(tr.sky[0]), sky1 = hexToABGR(tr.sky[1]);
        var outside = hexToABGR(tr.walls ? '#6b6f7a' : tr.ground);
        var fog = hexToABGR(tr.sky[1]);
        for (var y = 0; y < h; y++) {
            var row = y * w;
            if (y <= hy) {
                var c = y < hy * 0.55 ? sky0 : sky1;
                d32.fill(c, row, row + w);
                continue;
            }
            var dist = CAM_H * F / (y - hy);
            var k = dist / F;
            var rx = -fy, ry = fx;
            var wx = camX + fx * dist - rx * (w / 2) * k;
            var wy = camY + fy * dist - ry * (w / 2) * k;
            var sx = rx * k, sy = ry * k;
            var fogged = dist > 700;
            for (var x = 0; x < w; x++) {
                var tx = (wx * 0.5) | 0, ty = (wy * 0.5) | 0;
                var c = (wx >= 0 && wy >= 0 && tx < TS && ty < TS) ? tex[ty * TS + tx] : outside;
                if (fogged)
                    c = ((((c & 0xfefefe) >>> 1) + ((fog & 0xfefefe) >>> 1)) | 0xff000000) >>> 0;
                d32[row + x] = c;
                wx += sx;
                wy += sy;
            }
        }
        ctx.putImageData(buf.img, vp.x, vp.y);
        ctx.save();
        ctx.beginPath();
        ctx.rect(vp.x, vp.y, w, h);
        ctx.clip();
        var pan = world.panorama;
        var off = ((-a / (Math.PI * 2)) * pan.width * 2) % pan.width;
        for (var px = off - pan.width; px < w; px += pan.width)
            ctx.drawImage(pan, Math.round(vp.x + px), vp.y + hy - pan.height + 1);
        var list = [];
        var project = function (x, y) {
            var dx = x - camX, dy = y - camY;
            var f = dx * fx + dy * fy;
            if (f < 6)
                return null;
            var s = -dx * fy + dy * fx;
            var sxp = w / 2 + s * F / f;
            if (sxp < -60 || sxp > w + 60)
                return null;
            return { f: f, sx: sxp, sy: hy + CAM_H * F / f, scale: F / f };
        };
        try {
            for (var _d = __values(world.deco), _e = _d.next(); !_e.done; _e = _d.next()) {
                var d = _e.value;
                var p = project(d.x, d.y);
                if (!p || p.f > 800)
                    continue;
                list.push({ p: p, img: KartArt.decoImage(d), ws: KartArt.DECO_SCALE[d.kind] || 2 });
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
            }
            finally { if (e_2) throw e_2.error; }
        }
        try {
            for (var _f = __values(race.karts), _g = _f.next(); !_g.done; _g = _f.next()) {
                var k = _g.value;
                if (k === me)
                    continue;
                var p = project(k.x, k.y);
                if (!p)
                    continue;
                var rel = Math.atan2(Math.sin(k.heading - a), Math.cos(k.heading - a));
                var view = Math.abs(rel) < Math.PI / 4 ? 'back' : Math.abs(rel) > Math.PI * 3 / 4 ? 'front' : rel > 0 ? 'right' : 'left';
                list.push({ p: p, img: k.sprites[view], ws: 0.75, kart: k });
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
            }
            finally { if (e_3) throw e_3.error; }
        }
        list.sort(function (A, B) { return B.p.f - A.p.f; });
        try {
            for (var list_1 = __values(list), list_1_1 = list_1.next(); !list_1_1.done; list_1_1 = list_1.next()) {
                var it = list_1_1.value;
                var s = it.p.scale * it.ws;
                var iw = Math.max(1, Math.round(it.img.width * s)), ih = Math.max(1, Math.round(it.img.height * s));
                if (ih > h * 0.9 || iw > w * 1.2)
                    continue;
                ctx.drawImage(it.img, Math.round(vp.x + it.p.sx - iw / 2), Math.round(vp.y + it.p.sy - ih), iw, ih);
                if (it.kart && it.p.f < 260) {
                    var pc = ROOM.PLAYERS[it.kart.slot];
                    PixelFont.draw(ctx, it.kart.isBot ? 'CPU' : 'P' + (it.kart.slot + 1), vp.x + it.p.sx, vp.y + it.p.sy - ih - 9, { color: pc.color, align: 'center' });
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (list_1_1 && !list_1_1.done && (_c = list_1.return)) _c.call(list_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        var steer = me.input.steer || 0;
        var myView = Math.abs(steer) > 0.55 && me.speed > 30 ? (steer > 0 ? 'right' : 'left') : 'back';
        var ks = Math.max(2, Math.floor(h / 54));
        var kw = 24 * ks, kh = 18 * ks;
        var kx = Math.round(vp.x + w / 2 - kw / 2 + steer * ks * 2), ky = Math.round(vp.y + h - kh - 4 * ks / 2 + (me.surf === 0 || me.surf === 3 ? (Math.floor(race.clock * 30) % 2) : 0));
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(kx + 2 * ks, ky + kh - ks, kw - 4 * ks, ks * 2);
        if (me.turboT > 0) {
            var fl = Math.floor(race.clock * 20) % 2;
            ctx.fillStyle = fl ? '#ffe14a' : '#ff9c3b';
            ctx.fillRect(kx + 9 * ks, ky + kh - ks, 2 * ks, (3 + fl * 2) * ks);
            ctx.fillRect(kx + 13 * ks, ky + kh - ks, 2 * ks, (3 + (1 - fl) * 2) * ks);
        }
        ctx.drawImage(me.sprites[myView], kx, ky, kw, kh);
        if ((me.surf === 0 || me.surf === 3) && me.speed > 30) {
            ctx.fillStyle = me.surf === 3 ? '#e8c983' : '#7dcf4a';
            for (var i = 0; i < 4; i++)
                ctx.fillRect(kx + Math.random() * kw, ky + kh - Math.random() * 3 * ks, ks, ks);
        }
        if (me.tunnel) {
            ctx.fillStyle = 'rgba(10,10,20,0.55)';
            ctx.fillRect(vp.x, vp.y, w, h);
            ctx.fillStyle = '#ffe14a';
            for (var i = 0; i < 6; i++) {
                var t = ((race.clock * me.speed / 40 + i / 6) % 1);
                var yy = vp.y + hy - t * t * hy, xx = w / 2 + (t * t) * w * 0.45;
                ctx.fillRect(Math.round(vp.x + xx), Math.round(yy), 1 + Math.floor(t * 3), 1);
                ctx.fillRect(Math.round(vp.x + w - xx), Math.round(yy), 1 + Math.floor(t * 3), 1);
            }
        }
        drawHUD(race, me, vp);
        ctx.restore();
    }
    function drawHUD(race, me, vp) {
        var pc = ROOM.PLAYERS[me.slot];
        var big = vp.h > 150 ? 3 : 2;
        var pos = me.pos || 1;
        PixelFont.draw(ctx, String(pos), vp.x + 4, vp.y + vp.h - 7 * big - 4, { color: pos === 1 ? '#ffd23b' : '#ffffff', scale: big, shadow: K });
        PixelFont.draw(ctx, '/' + race.karts.length, vp.x + 6 + 6 * big, vp.y + vp.h - 11, { color: '#ffffff' });
        var lap = Math.max(1, Math.min(race.laps, me.lap));
        PixelFont.draw(ctx, 'GIRO ' + lap + '/' + race.laps, vp.x + 4, vp.y + 4, { color: '#ffffff' });
        PixelFont.draw(ctx, me.name, vp.x + 4, vp.y + 13, { color: pc.color });
        for (var i = 0; i < KART.TURBOS; i++) {
            var x = vp.x + vp.w - 10 - i * 9, y = vp.y + 4;
            ctx.fillStyle = K;
            ctx.fillRect(x - 1, y - 1, 8, 9);
            ctx.fillStyle = i < me.turbos ? '#ff9c3b' : '#3a3d48';
            ctx.fillRect(x, y, 6, 7);
            if (i < me.turbos) {
                ctx.fillStyle = '#ffe14a';
                ctx.fillRect(x + 2, y + 1, 2, 4);
            }
        }
        var sp = Math.max(0, Math.min(1, me.speed / (KART.MAX_SPEED * KART.TURBO_MULT)));
        ctx.fillStyle = K;
        ctx.fillRect(vp.x + vp.w - 34, vp.y + vp.h - 8, 30, 5);
        ctx.fillStyle = me.turboT > 0 ? '#ff9c3b' : '#3fe05a';
        ctx.fillRect(vp.x + vp.w - 33, vp.y + vp.h - 7, Math.round(28 * sp), 3);
        if (me.wrongT > 1 && Math.floor(race.clock * 4) % 2)
            PixelFont.draw(ctx, 'CONTROMANO!', vp.x + vp.w / 2, vp.y + vp.h / 2 - 20, { color: '#ff3b3b', scale: 2, align: 'center' });
        if (me.msg)
            PixelFont.draw(ctx, me.msg.text, vp.x + vp.w / 2, vp.y + vp.h * 0.3, { color: '#ffd23b', scale: big, align: 'center', shadow: K });
        if (me.finished)
            PixelFont.draw(ctx, 'ARRIVATO ' + me.place + ' SU ' + race.karts.length, vp.x + vp.w / 2, vp.y + vp.h * 0.55, { color: '#ffffff', align: 'center' });
        if (!me.isBot && !me.connected && Math.floor(race.clock * 2) % 2)
            PixelFont.draw(ctx, 'OFFLINE', vp.x + vp.w / 2, vp.y + 30, { color: '#ffffff', align: 'center' });
    }
    function drawLights(race) {
        if (race.state !== 'lights')
            return;
        var n = KART.LIGHTS, bw = 16;
        var x0 = Math.round(W / 2 - (n * bw) / 2), y0 = 30;
        ctx.fillStyle = K;
        ctx.fillRect(x0 - 4, y0 - 4, n * bw + 8, 26);
        for (var i = 0; i < n; i++) {
            var on = i < race.lightsOn;
            ctx.fillStyle = '#2a2a3a';
            ctx.fillRect(x0 + i * bw + 1, y0, bw - 2, 18);
            ctx.fillStyle = on ? '#ff3b3b' : '#4a1010';
            ctx.fillRect(x0 + i * bw + 4, y0 + 3, bw - 8, 5);
            ctx.fillRect(x0 + i * bw + 4, y0 + 10, bw - 8, 5);
            if (on) {
                ctx.fillStyle = '#ff9c8a';
                ctx.fillRect(x0 + i * bw + 5, y0 + 4, 2, 1);
            }
        }
    }
    window.KartRender = { init: init, draw: draw, W: W, H: H };
})();

/* ---- js/games/kart/index.js ---- */
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
(function () {
    'use strict';
    var W = 384, H = 216, K = '#1b1b26';
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    Sfx.register('light', function (_a) {
        var tone = _a.tone;
        tone('square', 440, null, 0.25, 0.16);
    });
    Sfx.register('turbo', function (_a) {
        var tone = _a.tone, noise = _a.noise;
        tone('sawtooth', 120, 900, 0.5, 0.14);
        noise(0.5, 0.25, 6000, 600);
    });
    Sfx.register('crash', function (_a) {
        var noise = _a.noise, tone = _a.tone;
        noise(0.25, 0.5, 2500, 200);
        tone('square', 140, 60, 0.2, 0.15);
    });
    Sfx.register('bump', function (_a) {
        var tone = _a.tone;
        tone('square', 220, 160, 0.08, 0.12);
    });
    Sfx.register('lap', function (_a) {
        var tone = _a.tone, N = _a.N;
        [0, 4, 7].forEach(function (n, i) { return tone('square', N(79 + n), null, 0.08, 0.13, i * 0.08); });
    });
    Sfx.register('lastlap', function (_a) {
        var tone = _a.tone, N = _a.N;
        [0, 4, 7, 12, 7, 12].forEach(function (n, i) { return tone('square', N(79 + n), null, 0.08, 0.14, i * 0.08); });
    });
    Sfx.register('finish', function (_a) {
        var tone = _a.tone, N = _a.N;
        [0, 5, 9, 12].forEach(function (n, i) { return tone('square', N(72 + n), null, 0.12, 0.14, i * 0.12); });
    });
    Sfx.register('win1', function (_a) {
        var tone = _a.tone, N = _a.N;
        [0, 4, 7, 12, 16, 19, 24].forEach(function (n, i) { return tone('square', N(72 + n), null, 0.1, 0.15, i * 0.08); });
    });
    var ready = false;
    function ensure() {
        var cv = document.getElementById('game');
        if (!ready) {
            KartRender.init(cv);
            ready = true;
        }
        else {
            cv.width = W;
            cv.height = H;
        }
        return cv.getContext('2d');
    }
    var previews = {};
    function preview(tr) { if (!previews[tr.id])
        previews[tr.id] = KartWorld.preview(tr, 64); return previews[tr.id]; }
    var KartSession = (function () {
        function KartSession(room, humans) {
            this.room = room;
            this.ctx = ensure();
            this.humans = humans.map(function (h) { return ({ slot: h.slot, name: h.name, char: null, connected: true }); });
            this.stage = 'select';
            this.track = 'monza';
            this.race = null;
            this.clock = 0;
            this.autoT = 45;
        }
        KartSession.prototype.human = function (slot) { return this.humans.find(function (h) { return h.slot === slot; }) || null; };
        KartSession.prototype.startRace = function () {
            var e_1, _a, e_2, _b, e_3, _c;
            var _this = this;
            if (this.stage !== 'select')
                return;
            var free = function () { return KartChars.CHARS.map(function (c) { return c.id; }).filter(function (id) { return !_this.humans.some(function (h) { return h.char === id; }); }); };
            try {
                for (var _d = __values(this.humans), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var h = _e.value;
                    if (!h.char)
                        h.char = free()[0];
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                }
                finally { if (e_1) throw e_1.error; }
            }
            var racers = this.humans.map(function (h) { return ({ slot: h.slot, name: h.name, isBot: false, char: h.char }); });
            var left = free().sort(function () { return Math.random() - 0.5; });
            var _loop_1 = function (s) {
                if (racers.some(function (r) { return r.slot === s; }))
                    return "continue";
                var c = left.pop();
                racers.push({ slot: s, name: KartChars.get(c).short, isBot: true, char: c });
            };
            for (var s = 0; s < 4 && racers.length < 4; s++) {
                _loop_1(s);
            }
            racers.sort(function (a, b) { return a.slot - b.slot; });
            var world = KartWorld.build(KartTracks.get(this.track));
            this.race = new KartRace(world, racers, function (t, d) { return _this.onEvent(t, d); });
            try {
                for (var _f = __values(this.humans), _g = _f.next(); !_g.done; _g = _f.next()) {
                    var h = _g.value;
                    var k = this.kart(h.slot);
                    if (k)
                        k.connected = h.connected;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                }
                finally { if (e_2) throw e_2.error; }
            }
            this.stage = 'race';
            this.ctx = ensure();
            try {
                for (var _h = __values(this.humans), _j = _h.next(); !_j.done; _j = _h.next()) {
                    var h = _j.value;
                    this.room.hudChanged(h.slot);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_j && !_j.done && (_c = _h.return)) _c.call(_h);
                }
                finally { if (e_3) throw e_3.error; }
            }
        };
        KartSession.prototype.kart = function (slot) { return this.race ? this.race.karts.find(function (k) { return !k.isBot && k.slot === slot; }) : null; };
        KartSession.prototype.update = function (dt) {
            this.clock += dt;
            if (this.stage === 'select') {
                this.autoT -= dt;
                if (this.autoT <= 0)
                    this.startRace();
                return;
            }
            this.race.update(dt);
        };
        KartSession.prototype.draw = function () {
            var _this = this;
            if (this.stage === 'select')
                return this.drawSelect();
            var focus = this.humans.map(function (h) { return _this.kart(h.slot); }).filter(Boolean);
            KartRender.draw(this.race, focus.length ? focus : [this.race.karts[0]], { roomCode: this.room.code });
        };
        KartSession.prototype.drawSelect = function () {
            var _this = this;
            var g = this.ctx;
            g.fillStyle = '#20152a';
            g.fillRect(0, 0, W, H);
            for (var x = 0; x < W; x += 8)
                for (var y = 0; y < 16; y += 8) {
                    g.fillStyle = ((x + y) / 8) % 2 ? '#ffffff' : K;
                    g.fillRect(x, y, 8, 8);
                }
            PixelFont.draw(g, 'PIPPO KART', W / 2, 22, { color: '#ffd23b', scale: 3, align: 'center', shadow: '#a3172a' });
            PixelFont.draw(g, 'PISTA (SCEGLIE IL CAPO)', 8, 52, { color: '#9aa0ad', outline: null });
            KartTracks.TRACKS.forEach(function (tr, i) {
                var x = 8 + i * 74, y = 62, sel = tr.id === _this.track;
                g.fillStyle = sel ? '#ffd23b' : '#3a3d48';
                g.fillRect(x - 2, y - 2, 68, 80);
                g.fillStyle = sel ? '#3a2a10' : '#2a2a3a';
                g.fillRect(x, y, 64, 76);
                g.drawImage(preview(tr), x, y);
                PixelFont.draw(g, tr.name, x + 32, y + 66, { color: sel ? '#ffd23b' : '#ffffff', align: 'center', outline: null });
            });
            var tr = KartTracks.get(this.track);
            wrapText(g, tr.sub, 8, 148, 220, '#ffffff');
            PixelFont.draw(g, 'PILOTI', 238, 52, { color: '#9aa0ad', outline: null });
            KartChars.CHARS.forEach(function (c, i) {
                var x = 238 + (i % 2) * 72, y = 62 + Math.floor(i / 2) * 70;
                var by = _this.humans.find(function (h) { return h.char === c.id; });
                g.fillStyle = by ? ROOM.PLAYERS[by.slot].color : '#3a3d48';
                g.fillRect(x - 2, y - 2, 68, 66);
                g.fillStyle = '#2a2a3a';
                g.fillRect(x, y, 64, 62);
                KartChars.drawPortrait(g, c.id, x + 12, y + 2, 2);
                PixelFont.draw(g, c.short.slice(0, 10), x + 32, y + 44, { color: '#ffffff', align: 'center', outline: null });
                if (by)
                    PixelFont.draw(g, by.name, x + 32, y + 53, { color: ROOM.PLAYERS[by.slot].color, align: 'center', outline: null });
            });
            var missing = this.humans.filter(function (h) { return !h.char; }).length;
            var msg = missing ? 'SCEGLI IL PILOTA SUL TELEFONO!' : 'PRONTI! IL CAPO PREME VIA (O INVIO)';
            PixelFont.draw(g, msg, W / 2, H - 22, { color: Math.floor(this.clock * 3) % 2 ? '#ffd23b' : '#ffffff', align: 'center' });
            PixelFont.draw(g, 'PARTENZA AUTOMATICA TRA ' + Math.ceil(this.autoT), W / 2, H - 10, { color: '#6b6f7a', align: 'center', outline: null });
        };
        KartSession.prototype.key = function (k) {
            var e_4, _a;
            if (this.stage !== 'select')
                return;
            var ids = KartTracks.TRACKS.map(function (t) { return t.id; });
            var i = ids.indexOf(this.track);
            if (k === 'ArrowRight')
                this.track = ids[(i + 1) % ids.length];
            else if (k === 'ArrowLeft')
                this.track = ids[(i - 1 + ids.length) % ids.length];
            else if (k === 'Enter')
                this.startRace();
            try {
                for (var _b = __values(this.humans), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var h = _c.value;
                    this.room.hudChanged(h.slot);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_4) throw e_4.error; }
            }
        };
        KartSession.prototype.input = function (slot, m) {
            var e_5, _a, e_6, _b;
            var h = this.human(slot);
            if (!h)
                return;
            if (this.stage === 'select') {
                if (m.t === 'kchar' && KartChars.get(m.id) && !this.humans.some(function (o) { return o !== h && o.char === m.id; })) {
                    h.char = m.id;
                    Sfx.play('join');
                    try {
                        for (var _c = __values(this.humans), _d = _c.next(); !_d.done; _d = _c.next()) {
                            var o = _d.value;
                            this.room.hudChanged(o.slot);
                        }
                    }
                    catch (e_5_1) { e_5 = { error: e_5_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                        }
                        finally { if (e_5) throw e_5.error; }
                    }
                }
                else if (m.t === 'ktrack' && this.room.isLead(slot) && KartTracks.get(m.id)) {
                    this.track = m.id;
                    Sfx.play('tick');
                    try {
                        for (var _e = __values(this.humans), _f = _e.next(); !_f.done; _f = _e.next()) {
                            var o = _f.value;
                            this.room.hudChanged(o.slot);
                        }
                    }
                    catch (e_6_1) { e_6 = { error: e_6_1 }; }
                    finally {
                        try {
                            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                        }
                        finally { if (e_6) throw e_6.error; }
                    }
                }
                else if (m.t === 'kgo' && this.room.isLead(slot))
                    this.startRace();
                return;
            }
            var k = this.kart(slot);
            if (!k)
                return;
            if (m.t === 'kin') {
                k.input.steer = clamp(+m.s || 0, -1, 1);
                k.input.brake = !!m.b;
            }
            else if (m.t === 'turbo')
                k.input.turbo = true;
        };
        KartSession.prototype.setConnected = function (slot, on) {
            var h = this.human(slot);
            if (h)
                h.connected = on;
            var k = this.kart(slot);
            if (k) {
                k.connected = on;
                if (!on) {
                    k.input.steer = 0;
                    k.input.brake = false;
                }
            }
        };
        KartSession.prototype.hud = function (slot) {
            var base = {
                stage: this.stage, track: this.track, lead: this.room.isLead(slot),
                chars: this.humans.filter(function (h) { return h.char; }).map(function (h) { return [h.slot, h.char]; }),
                tracks: KartTracks.TRACKS.map(function (t) { return [t.id, t.name]; }),
            };
            if (this.stage === 'select')
                return base;
            var k = this.kart(slot);
            if (!k)
                return base;
            return Object.assign(base, {
                pos: k.pos || 1, n: this.race.karts.length, lap: Math.max(1, Math.min(this.race.laps, k.lap)), laps: this.race.laps,
                turbos: k.turbos, finished: k.finished ? k.place : 0, lights: this.race.state === 'lights' ? 1 : 0,
            });
        };
        KartSession.prototype.onEvent = function (type, data) {
            var _this = this;
            if (type === 'sfx')
                Sfx.play(data);
            else if (type === 'music') {
                if (data)
                    Sfx.startMusic('race');
                else
                    Sfx.stopMusic();
            }
            else if (type === 'buzz') {
                if (!data.k.isBot)
                    this.room.buzz(data.k.slot, data.pattern);
            }
            else if (type === 'hud') {
                if (!data.isBot)
                    this.room.hudChanged(data.slot);
            }
            else if (type === 'over') {
                var ranking = data.map(function (k) { return ({
                    slot: k.slot, name: k.name, bot: k.isBot,
                    detail: k.finished ? formatTime(k.finishTime) : 'GIRO ' + Math.max(1, Math.min(_this.race.laps, k.lap)),
                }); });
                this.room.finish(ranking, { delay: 2500, voice: 'Winner! ' + data[0].name.toLowerCase() });
            }
        };
        KartSession.prototype.stop = function () { Sfx.stopMusic(); };
        return KartSession;
    }());
    function formatTime(t) {
        var m = Math.floor(t / 60), s = (t % 60).toFixed(1);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }
    function wrapText(g, text, x, y, w, color) {
        var e_7, _a;
        var words = text.toUpperCase().split(' ');
        var line = '', yy = y;
        try {
            for (var words_1 = __values(words), words_1_1 = words_1.next(); !words_1_1.done; words_1_1 = words_1.next()) {
                var wd = words_1_1.value;
                var t = line ? line + ' ' + wd : wd;
                if (PixelFont.width(t) > w) {
                    PixelFont.draw(g, line, x, yy, { color: color, outline: null });
                    line = wd;
                    yy += 10;
                }
                else
                    line = t;
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (words_1_1 && !words_1_1.done && (_a = words_1.return)) _a.call(words_1);
            }
            finally { if (e_7) throw e_7.error; }
        }
        if (line)
            PixelFont.draw(g, line, x, yy, { color: color, outline: null });
    }
    function demo() {
        ensure();
        var ids = KartChars.CHARS.map(function (c) { return c.id; });
        var race = new KartRace(KartWorld.build(KartTracks.get('monza')), [0, 1, 2, 3].map(function (i) { return ({ slot: i, name: 'CPU', isBot: true, char: ids[i] }); }), function () { });
        race.state = 'race';
        return {
            update: function (dt) {
                var e_8, _a;
                race.update(dt);
                try {
                    for (var _b = __values(race.karts), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var k = _c.value;
                        k.finished = false;
                        if (k.lap > 2)
                            k.lap = 1;
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_8) throw e_8.error; }
                }
            },
            draw: function () { KartRender.draw(race, [race.karts[0]], { demo: true }); },
        };
    }
    GAMES.register({
        id: 'kart',
        title: 'PIPPO KART',
        desc: 'Kart in finto 3D su Monza, Spa e Monaco. Il telefono è il volante: inclinalo per sterzare! 3 turbo a testa.',
        players: '1-4 (schermo diviso, CPU nei posti liberi)',
        layout: 'kart',
        available: true,
        icon: function (c, x, y) {
            var views = KartArt.buildKart(ROOM.PLAYERS[0].color, ROOM.PLAYERS[0].dark, 'generale');
            c.drawImage(views.back, x, y + 3);
        },
        demo: demo,
        create: function (room, humans) { return new KartSession(room, humans); },
    });
})();

/* ---- js/games/upcoming.js ---- */
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    'use strict';
    function art(rows, pal) {
        return function (ctx, x, y) {
            rows.forEach(function (r, j) { return __spreadArray([], __read(r), false).forEach(function (ch, i) {
                if (ch === '.' || !pal[ch])
                    return;
                ctx.fillStyle = pal[ch];
                ctx.fillRect(x + i, y + j, 1, 1);
            }); });
        };
    }
    var K = '#1b1b26';
})();

/* ---- js/room/host.js ---- */
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
(function () {
    'use strict';
    var $ = function (id) { return document.getElementById(id); };
    var PLAYERS = ROOM.PLAYERS;
    var net = null;
    var phase = 'hub';
    var session = null;
    var demo = null;
    var selected = 'shooter';
    var playingId = null;
    var lastRanking = null;
    var slots = [null, null, null, null];
    var evening = [null, null, null, null];
    var waiting = new Map();
    var overShownAt = 0;
    var audioOn = false;
    var room = {
        code: null,
        key: null,
        isLead: function (slot) { var l = leadSlot(); return !!l && l.slot === slot; },
        send: function (slot, d) { var s = slots[slot]; if (s && s.connected)
            toPhone(s.cid, d); },
        buzz: function (slot, pattern) { var s = slots[slot]; if (s)
            toPhone(s.cid, { t: 'buzz', p: pattern }); },
        hudChanged: function (slot) { hudDirty.add(slot); },
        finish: function (ranking, opts) { onFinish(ranking, opts || {}); },
    };
    var canvas = $('game');
    function fit() {
        var w = canvas.width || 384, h = canvas.height || 216;
        var s = Math.min(innerWidth / w, innerHeight / h);
        var si = Math.floor(s);
        var scale = si >= 2 && si / s > 0.9 ? si : s;
        canvas.style.width = Math.floor(w * scale) + 'px';
        canvas.style.height = Math.floor(h * scale) + 'px';
    }
    addEventListener('resize', fit);
    function connect() {
        try {
            var saved = JSON.parse(sessionStorage.getItem('pgr-room') || 'null');
            if (saved) {
                room.code = saved.code;
                room.key = saved.key;
            }
        }
        catch (e) { }
        net = new Net(function () { return '/ws?role=host' + (room.code ? "&room=".concat(room.code, "&key=").concat(room.key) : ''); }, {
            onopen: function () { return setNetStatus('SERVER OK', 'ok'); },
            onclose: function () { return setNetStatus('CONNESSIONE PERSA... RIPROVO', 'bad'); },
            onmessage: onServerMessage,
        });
    }
    function setNetStatus(text, cls) {
        var el = $('netStatus');
        el.textContent = text;
        el.className = 'net-status ' + (cls || '');
    }
    function onServerMessage(m) {
        var e_1, _a;
        if (m.t === 'room') {
            var changed = m.code !== room.code;
            room.code = m.code;
            room.key = m.key;
            sessionStorage.setItem('pgr-room', JSON.stringify({ code: room.code, key: room.key }));
            if (changed)
                for (var i = 0; i < 4; i++) {
                    slots[i] = null;
                    evening[i] = null;
                }
            try {
                for (var _b = __values(m.ctrls || []), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var cid = _c.value;
                    var s = slotByCid(cid);
                    if (s) {
                        s.connected = true;
                        sendYou(s);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            showJoinInfo();
            refreshHub();
        }
        else if (m.t === 'cjoin') {
            var s = slotByCid(m.cid);
            if (s) {
                s.connected = true;
                if (session)
                    session.setConnected(s.slot, true);
                sendYou(s);
                refreshHub();
            }
        }
        else if (m.t === 'cleave') {
            var s = slotByCid(m.cid);
            waiting.delete(m.cid);
            if (s) {
                s.connected = false;
                s.leftAt = performance.now();
                if (session)
                    session.setConnected(s.slot, false);
                refreshHub();
                broadcastYou();
            }
        }
        else if (m.t === 'c') {
            onControllerMessage(m.cid, m.d || {});
        }
    }
    function toPhone(cid, d) { if (cid)
        net.send({ t: 'to', cid: cid, d: d }); }
    var slotByCid = function (cid) { return slots.find(function (s) { return s && s.cid === cid; }) || null; };
    var humans = function () { return slots.filter(Boolean); };
    var leadSlot = function () { return slots.find(function (s) { return s && s.connected; }) || null; };
    function cleanName(n) {
        n = PixelFont.norm(String(n || '').trim()).replace(/\s+/g, ' ').trim().slice(0, 9);
        return n || null;
    }
    function onControllerMessage(cid, d) {
        var s = slotByCid(cid);
        if (d.t === 'hello')
            return onHello(cid, d);
        if (!s)
            return;
        var lead = leadSlot() === s;
        switch (d.t) {
            case 'pick':
                if (lead && phase === 'hub' && GAMES.get(d.game)) {
                    selectGame(d.game);
                }
                return;
            case 'start':
                if (lead && phase === 'hub')
                    startMatch();
                return;
            case 'again':
                if (lead && phase === 'over')
                    startMatch(playingId);
                return;
            case 'lobby':
                if (lead && phase === 'over')
                    backToHub();
                return;
            case 'leave':
                if (phase !== 'game') {
                    slots[s.slot] = null;
                    evening[s.slot] = null;
                    refreshHub();
                    broadcastYou();
                }
                return;
            default:
                if (session && phase !== 'hub')
                    session.input(s.slot, d);
        }
    }
    function onHello(cid, d) {
        var name = cleanName(d.name) || 'GIOCATORE';
        var s = slotByCid(cid);
        if (s) {
            s.connected = true;
            if (phase !== 'game')
                s.name = name;
            if (session)
                session.setConnected(s.slot, true);
            refreshHub();
            broadcastYou();
            return;
        }
        s = slots.find(function (x) { return x && !x.connected && x.name === name; });
        if (s) {
            s.cid = cid;
            s.connected = true;
            if (session)
                session.setConnected(s.slot, true);
            refreshHub();
            broadcastYou();
            return;
        }
        if (phase === 'game') {
            waiting.set(cid, name);
            toPhone(cid, { t: 'wait', msg: 'PARTITA IN CORSO! ENTRERAI ALLA PROSSIMA' });
            return;
        }
        var free = slots.findIndex(function (x) { return !x; });
        if (free === -1) {
            toPhone(cid, { t: 'full', msg: 'STANZA PIENA (4 GIOCATORI)' });
            return;
        }
        addPlayer(free, name, cid);
        Sfx.play('join');
        refreshHub();
        broadcastYou();
    }
    function addPlayer(slot, name, cid) {
        var taken = slots.filter(function (x) { return x && x.slot !== slot; }).map(function (x) { return x.name; });
        if (taken.includes(name))
            name = (name.slice(0, 7) + ' ' + (slot + 1)).trim();
        slots[slot] = { slot: slot, name: name, cid: cid, connected: true };
        if (!evening[slot] || evening[slot].name !== name)
            evening[slot] = { name: name, pts: 0, wins: 0 };
    }
    function sendYou(s) {
        if (!s || !s.connected)
            return;
        var pc = PLAYERS[s.slot];
        var g = GAMES.get(phase === 'hub' ? selected : playingId);
        var msg = {
            t: 'you', slot: s.slot, name: s.name, color: pc.color, dark: pc.dark,
            lead: leadSlot() === s,
            phase: phase,
            room: room.code,
            game: g ? g.id : null, gameTitle: g ? g.title : '', layout: g ? g.layout : null,
            games: GAMES.list.map(function (x) { return ({ id: x.id, title: x.title, desc: x.desc, players: x.players, available: x.available }); }),
            players: humans().map(function (x) { return ({
                slot: x.slot, name: x.name, color: PLAYERS[x.slot].color, on: x.connected,
                pts: evening[x.slot] ? evening[x.slot].pts : 0,
            }); }),
        };
        if (phase === 'over' && lastRanking)
            msg.rank = lastRanking;
        toPhone(s.cid, msg);
        sendHud(s.slot, true);
    }
    function broadcastYou() {
        var e_2, _a;
        try {
            for (var _b = __values(humans()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var s = _c.value;
                sendYou(s);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
    }
    var hudDirty = new Set();
    var lastHud = new Map();
    function sendHud(slot, force) {
        if (!session || !session.hud)
            return;
        var s = slots[slot];
        if (!s || !s.connected)
            return;
        var h = session.hud(slot);
        if (!h)
            return;
        var key = JSON.stringify(h);
        if (!force && lastHud.get(s.cid) === key)
            return;
        lastHud.set(s.cid, key);
        toPhone(s.cid, Object.assign({ t: 'st' }, h));
    }
    function selectGame(id) {
        var g = GAMES.get(id);
        if (!g)
            return;
        selected = id;
        Sfx.play('tick');
        refreshHub();
        broadcastYou();
    }
    function startMatch(id) {
        var e_3, _a;
        if (phase === 'game')
            return;
        var g = GAMES.get(id || selected);
        if (!g || !g.available) {
            Sfx.play('empty');
            flashHint('QUESTO GIOCO ARRIVA PRESTO!');
            return;
        }
        try {
            for (var waiting_1 = __values(waiting), waiting_1_1 = waiting_1.next(); !waiting_1_1.done; waiting_1_1 = waiting_1.next()) {
                var _b = __read(waiting_1_1.value, 2), cid = _b[0], name = _b[1];
                var free = slots.findIndex(function (x) { return !x; });
                if (free === -1)
                    break;
                addPlayer(free, name, cid);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (waiting_1_1 && !waiting_1_1.done && (_a = waiting_1.return)) _a.call(waiting_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        waiting.clear();
        for (var i = 0; i < 4; i++)
            if (slots[i] && !slots[i].connected)
                slots[i] = null;
        if (session)
            session.stop();
        playingId = g.id;
        session = g.create(room, humans().map(function (s) { return ({ slot: s.slot, name: s.name }); }));
        phase = 'game';
        demo = null;
        lastHud.clear();
        lastRanking = null;
        $('hub').classList.add('hidden');
        $('over').classList.add('hidden');
        document.body.classList.add('playing');
        fit();
        broadcastYou();
    }
    function onFinish(ranking, opts) {
        if (phase !== 'game')
            return;
        phase = 'over';
        var hum = ranking.filter(function (r) { return !r.bot; });
        ranking.forEach(function (r) { r.pts = 0; });
        if (hum.length >= 2) {
            hum.forEach(function (r, i) {
                r.pts = ROOM.EVENING_POINTS[i] || 0;
                var e = evening[r.slot];
                if (e) {
                    e.pts += r.pts;
                    if (i === 0)
                        e.wins++;
                }
            });
        }
        lastRanking = ranking.map(function (r) { return ({ slot: r.slot, name: r.name, bot: !!r.bot, detail: r.detail || '', pts: r.pts }); });
        var delay = opts.delay || 0;
        overShownAt = performance.now() + delay;
        broadcastYou();
        setTimeout(function () {
            if (phase !== 'over')
                return;
            showOver(lastRanking);
            Sfx.play('win_jingle');
            if (opts.voice)
                setTimeout(function () { return Sfx.announce(opts.voice); }, 400);
        }, delay);
    }
    function showOver(ranking) {
        var w = ranking[0];
        var pc = PLAYERS[w.slot];
        $('winnerName').textContent = w.name + (w.bot ? ' (CPU)' : '');
        $('winnerName').style.color = pc.color;
        $('overGame').textContent = GAMES.get(playingId).title;
        var body = $('rankBody');
        body.innerHTML = '';
        ranking.forEach(function (r, i) {
            var tr = document.createElement('tr');
            if (i === 0)
                tr.className = 'first';
            var col = PLAYERS[r.slot].color;
            tr.innerHTML = "<td class=\"pos\">".concat(i + 1, "\u00B0</td><td class=\"sw\" style=\"background:").concat(col, "\"></td>") +
                "<td style=\"color:".concat(col, "\">").concat(escapeHtml(r.name)).concat(r.bot ? ' <small>CPU</small>' : '', "</td>") +
                "<td class=\"k\">".concat(escapeHtml(r.detail), "</td><td class=\"d\">").concat(r.pts ? '+' + r.pts + ' PT' : '', "</td>");
            body.appendChild(tr);
        });
        $('over').classList.remove('hidden');
    }
    function backToHub() {
        var e_4, _a;
        if (session)
            session.stop();
        session = null;
        phase = 'hub';
        Sfx.stopMusic();
        try {
            for (var waiting_2 = __values(waiting), waiting_2_1 = waiting_2.next(); !waiting_2_1.done; waiting_2_1 = waiting_2.next()) {
                var _b = __read(waiting_2_1.value, 2), cid = _b[0], name = _b[1];
                var free = slots.findIndex(function (x) { return !x; });
                if (free === -1)
                    break;
                addPlayer(free, name, cid);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (waiting_2_1 && !waiting_2_1.done && (_a = waiting_2.return)) _a.call(waiting_2);
            }
            finally { if (e_4) throw e_4.error; }
        }
        waiting.clear();
        newDemo();
        $('over').classList.add('hidden');
        $('hub').classList.remove('hidden');
        document.body.classList.remove('playing');
        refreshHub();
        broadcastYou();
    }
    function newDemo() {
        var g = GAMES.get(selected);
        var src = g && g.demo ? g : GAMES.get('shooter');
        demo = src.demo();
        fit();
    }
    function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]); }); }
    function showJoinInfo() {
        return __awaiter(this, void 0, void 0, function () {
            var base, info, e_5, url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        base = location.origin;
                        if (!/^(localhost|127\.|\[::1\])/.test(location.hostname)) return [3, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4, fetch('/api/info')];
                    case 2: return [4, (_a.sent()).json()];
                    case 3:
                        info = _a.sent();
                        if (info.lan && info.lan.length)
                            base = "".concat(location.protocol, "//").concat(info.lan[0], ":").concat(location.port || info.port);
                        return [3, 5];
                    case 4:
                        e_5 = _a.sent();
                        return [3, 5];
                    case 5:
                        url = "".concat(base, "/play?r=").concat(room.code);
                        $('joinUrl').textContent = base.replace(/^https?:\/\//, '') + '/play';
                        $('roomCode').textContent = room.code;
                        try {
                            QR.draw($('qr'), QR.make(url), 8);
                        }
                        catch (e) {
                            console.error(e);
                        }
                        $('qr').title = url;
                        return [2];
                }
            });
        });
    }
    function buildGameCards() {
        var e_6, _a;
        var wrap = $('gameCards');
        wrap.innerHTML = '';
        var _loop_1 = function (g) {
            var card = document.createElement('button');
            card.className = 'game-card' + (g.available ? '' : ' soon');
            card.dataset.id = g.id;
            var cv = document.createElement('canvas');
            cv.width = 24;
            cv.height = 24;
            try {
                g.icon(cv.getContext('2d'), 0, 0);
            }
            catch (e) { }
            card.appendChild(cv);
            var t = document.createElement('span');
            t.className = 'gtitle';
            t.textContent = g.title;
            card.appendChild(t);
            if (!g.available) {
                var b = document.createElement('span');
                b.className = 'badge';
                b.textContent = 'PRESTO';
                card.appendChild(b);
            }
            card.onclick = function () { if (selected === g.id)
                startMatch();
            else
                selectGame(g.id); };
            wrap.appendChild(card);
        };
        try {
            for (var _b = __values(GAMES.list), _c = _b.next(); !_c.done; _c = _b.next()) {
                var g = _c.value;
                _loop_1(g);
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_6) throw e_6.error; }
        }
    }
    function refreshHub() {
        var e_7, _a;
        try {
            for (var _b = __values(document.querySelectorAll('.game-card')), _c = _b.next(); !_c.done; _c = _b.next()) {
                var card = _c.value;
                card.classList.toggle('sel', card.dataset.id === selected);
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_7) throw e_7.error; }
        }
        var g = GAMES.get(selected);
        $('gameDesc').textContent = g.desc;
        $('gamePlayers').textContent = 'GIOCATORI: ' + g.players;
        $('playBtn').textContent = g.available ? 'GIOCA!' : 'PROSSIMAMENTE';
        $('playBtn').disabled = !g.available;
        var ul = $('slots');
        ul.innerHTML = '';
        for (var i = 0; i < 4; i++) {
            var s = slots[i];
            var pc = PLAYERS[i];
            var li = document.createElement('li');
            li.innerHTML = "<span class=\"num\" style=\"background:".concat(pc.color, "\">").concat(i + 1, "</span>");
            if (s) {
                var nm = document.createElement('span');
                nm.className = 'pname';
                nm.textContent = s.name;
                nm.style.color = pc.color;
                li.appendChild(nm);
                var tag = document.createElement('span');
                tag.className = 'tag' + (s.connected ? '' : ' off');
                tag.textContent = s.connected ? (leadSlot() === s ? 'CAPO' : '') : 'OFFLINE';
                li.appendChild(tag);
                var pts = document.createElement('span');
                pts.className = 'pts';
                pts.textContent = (evening[i] ? evening[i].pts : 0) + ' PT';
                li.appendChild(pts);
            }
            else {
                li.className = 'empty';
                li.innerHTML += '<span class="pname">IN ATTESA...</span>';
            }
            ul.appendChild(li);
        }
        var anyPts = evening.some(function (e) { return e && e.pts > 0; });
        $('resetBtn').classList.toggle('hidden', !anyPts);
        var n = humans().length;
        $('hubHint').textContent = n === 0 ? 'Inquadra il QR per entrare!'
            : n === 1 ? 'Sei da solo: nei giochi che lo prevedono arrivano i bot.'
                : "".concat(n, " giocatori in sala. Il capo sceglie il gioco dal telefono.");
    }
    var hintTimer = null;
    function flashHint(text) {
        var el = $('hubHint');
        el.textContent = text;
        el.classList.add('warn');
        clearTimeout(hintTimer);
        hintTimer = setTimeout(function () { el.classList.remove('warn'); refreshHub(); }, 1800);
    }
    setInterval(function () {
        if (phase !== 'hub')
            return;
        var changed = false;
        for (var i = 0; i < 4; i++) {
            var s = slots[i];
            if (s && !s.connected && performance.now() - s.leftAt > 20000) {
                slots[i] = null;
                changed = true;
            }
        }
        if (changed) {
            refreshHub();
            broadcastYou();
        }
    }, 2000);
    function enableAudio() {
        if (audioOn)
            return;
        Sfx.init();
        audioOn = true;
        $('audioBtn').classList.add('hidden');
        $('muteBtn').classList.remove('hidden');
        document.body.classList.add('audio-on');
    }
    addEventListener('pointerdown', enableAudio);
    addEventListener('keydown', enableAudio);
    $('playBtn').onclick = function () { return startMatch(); };
    $('againBtn').onclick = function () { return startMatch(playingId); };
    $('lobbyBtn').onclick = function () { return backToHub(); };
    $('resetBtn').onclick = function () {
        for (var i = 0; i < 4; i++)
            if (evening[i]) {
                evening[i].pts = 0;
                evening[i].wins = 0;
            }
        refreshHub();
        broadcastYou();
    };
    $('muteBtn').onclick = function () { $('muteBtn').textContent = Sfx.toggleMute() ? 'AUDIO OFF' : 'AUDIO ON'; };
    $('fsBtn').onclick = toggleFullscreen;
    function toggleFullscreen() {
        if (!document.fullscreenElement)
            document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(function () { });
        else
            document.exitFullscreen && document.exitFullscreen();
    }
    addEventListener('keydown', function (e) {
        var k = e.key;
        if (phase === 'hub') {
            var ids = GAMES.list.map(function (g) { return g.id; });
            var i = ids.indexOf(selected);
            if (k === 'ArrowRight' || k === 'ArrowDown')
                selectGame(ids[(i + 1) % ids.length]);
            else if (k === 'ArrowLeft' || k === 'ArrowUp')
                selectGame(ids[(i - 1 + ids.length) % ids.length]);
            else if (k === 'Enter')
                startMatch();
        }
        else if (phase === 'game' && session && session.key) {
            session.key(k);
        }
        else if (phase === 'over' && performance.now() > overShownAt) {
            if (k === 'Enter')
                startMatch(playingId);
            else if (k === 'Escape' || k === 'Backspace')
                backToHub();
        }
        if (k === 'f' || k === 'F')
            toggleFullscreen();
        else if (k === 'm' || k === 'M')
            $('muteBtn').click();
    });
    var STEP = 1 / 60;
    var acc = 0, last = performance.now(), hudTimer = 0, fullHudTimer = 0;
    function frame(now) {
        var e_8, _a, e_9, _b;
        var dt = (now - last) / 1000;
        last = now;
        if (dt > 0.25)
            dt = 0.25;
        acc += dt;
        var running = session || demo;
        while (acc >= STEP) {
            if (running)
                running.update(STEP);
            acc -= STEP;
        }
        if (running)
            running.draw();
        hudTimer += dt;
        fullHudTimer += dt;
        if (session && hudTimer > 0.1) {
            hudTimer = 0;
            try {
                for (var hudDirty_1 = __values(hudDirty), hudDirty_1_1 = hudDirty_1.next(); !hudDirty_1_1.done; hudDirty_1_1 = hudDirty_1.next()) {
                    var slot = hudDirty_1_1.value;
                    sendHud(slot);
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (hudDirty_1_1 && !hudDirty_1_1.done && (_a = hudDirty_1.return)) _a.call(hudDirty_1);
                }
                finally { if (e_8) throw e_8.error; }
            }
            hudDirty.clear();
            if (fullHudTimer > 0.5) {
                fullHudTimer = 0;
                try {
                    for (var _c = __values(humans()), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var s = _d.value;
                        sendHud(s.slot);
                    }
                }
                catch (e_9_1) { e_9 = { error: e_9_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                    }
                    finally { if (e_9) throw e_9.error; }
                }
            }
        }
        requestAnimationFrame(frame);
    }
    Logo.mount($('logo'));
    buildGameCards();
    newDemo();
    refreshHub();
    connect();
    requestAnimationFrame(frame);
    window.__host = {
        get session() { return session; }, get phase() { return phase; }, get selected() { return selected; },
        get game() { return session && session.game; },
        slots: slots,
        evening: evening,
        startMatch: startMatch,
        backToHub: backToHub,
        selectGame: selectGame,
    };
})();
