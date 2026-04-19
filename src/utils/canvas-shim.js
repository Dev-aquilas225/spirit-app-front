// Shim vide — pdfjs-dist tente de require('canvas') pour le rendu Node.js
// (NodeCanvasFactory). On le remplace par un objet vide car on est dans le
// navigateur où le rendu se fait via l'API Canvas HTML native.
module.exports = {};
