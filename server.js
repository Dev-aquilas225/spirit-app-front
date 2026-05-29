const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mjs': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Valeurs de production correctes — fallback si Coolify ne passe pas les env vars
const PROD_DEFAULTS = {
  EXPO_PUBLIC_API_BASE_URL:         'https://api.oracle-plus.online',
  EXPO_PUBLIC_APP_URL:              'https://oracle-plus.online',
  EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB: '835702776630-0gh59t57sgp6oq67h7k02vgsoth2lgsh.apps.googleusercontent.com',
  EXPO_PUBLIC_VAPID_PUBLIC_KEY:     'BPahGBQRxKp2NBj98RWtp5gwIgmyjsc0cKzeAbquZdb5a9SEH7UV1SqPAFuB34W7LXc1uxNuPgHF_LL6cqZPZeE',
  EXPO_PUBLIC_ADMIN_EMAIL:          'christoinaquilas@gmail.com,tchingankonggeorges@gmail.com',
};

// Génère le contenu de env-config.js depuis les env vars runtime
// Si une var est vide ou contient une ancienne valeur connue, utilise le fallback
function resolveEnv(key) {
  const val = process.env[key] || '';
  // Ignorer les anciennes valeurs connues (Client IDs Android/web obsolètes)
  const staleValues = [
    '734297398479-pm4vr7titln8uhol6t0m9oluu20g1hsr.apps.googleusercontent.com',
    '734297398479-rids78si56kck1u3sjrgnivfdtpr7e89.apps.googleusercontent.com',
    'BFHncpJ2BjhG6Jm7MBiQiHpExTBGAHida4LQGP_zRlcTFUQLdfXnhjCINl5bAqwAegwYj1vGaBcFL1biyv-UjKU',
  ];
  if (!val || staleValues.includes(val)) return PROD_DEFAULTS[key] || '';
  return val;
}

function buildEnvConfig() {
  const env = {
    EXPO_PUBLIC_API_BASE_URL:         resolveEnv('EXPO_PUBLIC_API_BASE_URL'),
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB: resolveEnv('EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB'),
    EXPO_PUBLIC_VAPID_PUBLIC_KEY:     resolveEnv('EXPO_PUBLIC_VAPID_PUBLIC_KEY'),
    EXPO_PUBLIC_ADMIN_EMAIL:          resolveEnv('EXPO_PUBLIC_ADMIN_EMAIL'),
  };
  return `window.__ENV__ = ${JSON.stringify(env)};`;
}

// Injecte <script src="/env-config.js"> dans le HTML avant </head>
function injectEnvScript(html) {
  if (html.includes('env-config.js')) return html;
  return html.replace('</head>', '<script src="/env-config.js"></script></head>');
}

function getCandidatePaths(requestPath) {
  const trimmedPath = requestPath.replace(/^\/+/, '');

  if (!trimmedPath) {
    return [path.join(distDir, 'index.html')];
  }

  const normalizedPath = path.normalize(trimmedPath);
  const absoluteBasePath = path.join(distDir, normalizedPath);

  return [
    absoluteBasePath,
    `${absoluteBasePath}.html`,
    path.join(absoluteBasePath, 'index.html'),
  ];
}

function isInsideDist(filePath) {
  const relativePath = path.relative(distDir, filePath);
  return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

function resolveFile(requestPath) {
  for (const candidate of getCandidatePaths(requestPath)) {
    if (!isInsideDist(candidate)) {
      continue;
    }

    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function serveFile(res, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const requestedPath = decodeURIComponent(url.pathname);

    // Route dynamique : variables d'environnement runtime
    if (requestedPath === '/env-config.js') {
      const body = buildEnvConfig();
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(body);
      return;
    }

    const resolvedFile = resolveFile(requestedPath);

    if (resolvedFile) {
      // Injecter le script dans les fichiers HTML
      if (resolvedFile.endsWith('.html')) {
        const html = fs.readFileSync(resolvedFile, 'utf-8');
        const body = injectEnvScript(html);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(body);
        return;
      }
      // Service worker : no-cache pour que le navigateur vérifie les mises à jour
      if (requestedPath === '/service-worker.js') {
        const extension = path.extname(resolvedFile).toLowerCase();
        const contentType = mimeTypes[extension] || 'application/javascript; charset=utf-8';
        res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
        fs.createReadStream(resolvedFile).pipe(res);
        return;
      }
      serveFile(res, resolvedFile);
      return;
    }

    const hasExtension = path.extname(requestedPath) !== '';
    if (hasExtension) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    // SPA fallback — injecter le script dans le HTML
    const fallbackFile = path.join(distDir, 'index.html');
    const html = fs.readFileSync(fallbackFile, 'utf-8');
    const body = injectEnvScript(html);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(body);
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(port, '0.0.0.0', () => {
    console.log(`Static server running on port ${port}`);
  });
}

module.exports = {
  createServer,
  resolveFile,
};
