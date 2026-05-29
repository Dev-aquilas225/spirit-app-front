#!/bin/sh
set -e

# Charger le .env Coolify s'il existe (monté dans /app/.env ou /.env)
for f in /app/.env /.env; do
  if [ -f "$f" ]; then
    set -a
    . "$f"
    set +a
    break
  fi
done

HTML=/app/dist/index.html
ENV_JS=/app/dist/env-config.js

# 1. Générer env-config.js avec toutes les variables runtime
cat > "$ENV_JS" << ENVEOF
window.__ENV__ = {
  "EXPO_PUBLIC_API_BASE_URL":         "${EXPO_PUBLIC_API_BASE_URL:-}",
  "EXPO_PUBLIC_APP_URL":              "${EXPO_PUBLIC_APP_URL:-}",
  "EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB": "${EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB:-}",
  "EXPO_PUBLIC_ADMIN_EMAIL":          "${EXPO_PUBLIC_ADMIN_EMAIL:-}",
  "EXPO_PUBLIC_VAPID_PUBLIC_KEY":     "${EXPO_PUBLIC_VAPID_PUBLIC_KEY:-}"
};
ENVEOF

# 2. Injecter <script src="/env-config.js"> dans index.html avant </head>
if ! grep -q 'env-config.js' "$HTML"; then
  sed -i 's|</head>|<script src="/env-config.js"></script></head>|' "$HTML"
fi

# 3. Démarrer le serveur Node.js sur port 3000 (Traefik attend ce port)
export PORT=3000
exec node server.js
