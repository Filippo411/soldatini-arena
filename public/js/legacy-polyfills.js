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
