#!/usr/bin/env node
/**
 * patch-canvas.js — postinstall
 *
 * Le bundler SSR d'Expo Router résout les modules via Node.js (pas Metro),
 * donc extraNodeModules ne s'applique pas. Ce script remplace
 * node_modules/canvas/lib/bindings.js par un stub vide pour que
 * pdfjs-dist puisse être bundlé sans le binaire natif canvas.node.
 */
const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '../node_modules/canvas/lib/bindings.js');

if (!fs.existsSync(target)) {
  console.log('[patch-canvas] canvas/lib/bindings.js introuvable, rien à faire.');
  process.exit(0);
}

const stub = `// Stub — remplacé par scripts/patch-canvas.js (postinstall)
// pdfjs-dist importe canvas pour NodeCanvasFactory (rendu SSR Node.js).
// Dans le navigateur, le rendu utilise l'API Canvas HTML native.
module.exports = {};
`;

fs.writeFileSync(target, stub, 'utf8');
console.log('[patch-canvas] node_modules/canvas/lib/bindings.js patché avec succès.');
