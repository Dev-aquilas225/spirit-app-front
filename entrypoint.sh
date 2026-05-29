#!/bin/sh
set -e

WEBROOT=/usr/share/nginx/html
ENV_JS=$WEBROOT/env-config.js

# Charger .env.production (valeurs correctes commitées dans le repo)
if [ -f /app/.env.production ]; then
  set -a
  . /app/.env.production
  set +a
fi

# Générer env-config.js avec les valeurs de .env.production
# (ignore process.env de Coolify qui contient des valeurs obsolètes)
cat > "$ENV_JS" << ENVEOF
window.__ENV__ = {
  "EXPO_PUBLIC_API_BASE_URL":         "${EXPO_PUBLIC_API_BASE_URL:-https://api.oracle-plus.online}",
  "EXPO_PUBLIC_APP_URL":              "${EXPO_PUBLIC_APP_URL:-https://oracle-plus.online}",
  "EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB": "${EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB:-835702776630-0gh59t57sgp6oq67h7k02vgsoth2lgsh.apps.googleusercontent.com}",
  "EXPO_PUBLIC_ADMIN_EMAIL":          "${EXPO_PUBLIC_ADMIN_EMAIL:-christoinaquilas@gmail.com}",
  "EXPO_PUBLIC_VAPID_PUBLIC_KEY":     "${EXPO_PUBLIC_VAPID_PUBLIC_KEY:-BPahGBQRxKp2NBj98RWtp5gwIgmyjsc0cKzeAbquZdb5a9SEH7UV1SqPAFuB34W7LXc1uxNuPgHF_LL6cqZPZeE}"
};
ENVEOF

echo "[entrypoint] env-config.js généré — GOOGLE=${EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB:0:20}..."

# Injecter <script src="/env-config.js"> dans index.html si absent
HTML=$WEBROOT/index.html
if [ -f "$HTML" ] && ! grep -q 'env-config.js' "$HTML"; then
  sed -i 's|</head>|<script src="/env-config.js"></script></head>|' "$HTML"
fi

# Démarrer nginx
exec nginx -g 'daemon off;'
