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
    const resolvedFile = resolveFile(requestedPath);

    if (resolvedFile) {
      serveFile(res, resolvedFile);
      return;
    }

    const hasExtension = path.extname(requestedPath) !== '';
    if (hasExtension) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const fallbackFile = path.join(distDir, 'index.html');
    serveFile(res, fallbackFile);
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
