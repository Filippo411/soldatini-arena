/**
 * Crea public/legacy/host.js: tutto il codice dello schermo grande in un unico file
 * compatibile con i browser vecchi delle smart TV (JavaScript "ES5").
 *
 * Va rilanciato dopo ogni modifica al codice dello schermo grande:
 *    npm install -g typescript   (una volta sola)
 *    node tools/build-legacy.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const m = html.match(/HOST_SCRIPTS\s*=\s*(\[[\s\S]*?\]);/);
if (!m) throw new Error('Lista HOST_SCRIPTS non trovata in index.html');
const list = JSON.parse(m[1].replace(/'/g, '"').replace(/,\s*\]/, ']'));

let out = '/* Generato da tools/build-legacy.js: NON modificare a mano */\n';
out += fs.readFileSync(path.join(root, 'js/legacy-polyfills.js'), 'utf8') + '\n';
for (const src of list) {
  const code = fs.readFileSync(path.join(root, src), 'utf8');
  const res = ts.transpileModule(code, {
    fileName: src,

    compilerOptions: { ignoreDeprecations: '6.0', target: ts.ScriptTarget.ES5, module: ts.ModuleKind.None, allowJs: true, downlevelIteration: true, removeComments: true },
  });
  out += `\n/* ---- ${src} ---- */\n` + res.outputText;
}
fs.writeFileSync(path.join(root, 'legacy', 'host.js'), out);
console.log('legacy/host.js:', Math.round(out.length / 1024), 'KB da', list.length, 'file');
