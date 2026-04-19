// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// pdfjs-dist/build/pdf.js tente de require('canvas') pour son NodeCanvasFactory
// (rendu côté serveur Node.js). On remplace ce module par un objet vide :
// dans le navigateur, le rendu se fait via l'API Canvas HTML native, pas via
// le package npm 'canvas'.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  canvas: path.resolve(__dirname, 'src/utils/canvas-shim.js'),
};

module.exports = config;
