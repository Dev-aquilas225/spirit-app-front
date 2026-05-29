#!/bin/sh
set -e

WEBROOT=/usr/share/nginx/html
ENV_JS=$WEBROOT/env-config.js

# Lire les valeurs directement depuis .env.production — ignore les vars d'env
# injectées par Coolify qui peuvent contenir des valeurs obsolètes.
_get() {
  grep "^$1=" /app/.env.production 2>/dev/null | cut -d'=' -f2- | tr -d '\r'
}

API_URL=$(_get EXPO_PUBLIC_API_BASE_URL)
APP_URL=$(_get EXPO_PUBLIC_APP_URL)
GOOGLE_ID=$(_get EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB)
VAPID=$(_get EXPO_PUBLIC_VAPID_PUBLIC_KEY)
ADMIN=$(_get EXPO_PUBLIC_ADMIN_EMAIL)

# Fallbacks si .env.production absent
API_URL=${API_URL:-https://api.oracle-plus.online}
APP_URL=${APP_URL:-https://oracle-plus.online}
GOOGLE_ID=${GOOGLE_ID:-835702776630-0gh59t57sgp6oq67h7k02vgsoth2lgsh.apps.googleusercontent.com}
VAPID=${VAPID:-BPahGBQRxKp2NBj98RWtp5gwIgmyjsc0cKzeAbquZdb5a9SEH7UV1SqPAFuB34W7LXc1uxNuPgHF_LL6cqZPZeE}
ADMIN=${ADMIN:-christoinaquilas@gmail.com}

cat > "$ENV_JS" << ENVEOF
window.__ENV__ = {
  "EXPO_PUBLIC_API_BASE_URL":         "${API_URL}",
  "EXPO_PUBLIC_APP_URL":              "${APP_URL}",
  "EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB": "${GOOGLE_ID}",
  "EXPO_PUBLIC_ADMIN_EMAIL":          "${ADMIN}",
  "EXPO_PUBLIC_VAPID_PUBLIC_KEY":     "${VAPID}"
};
ENVEOF

echo "[entrypoint] env-config.js généré — GOOGLE=${GOOGLE_ID}"

# Injecter <script src="/env-config.js"> dans index.html si absent
HTML=$WEBROOT/index.html
if [ -f "$HTML" ] && ! grep -q 'env-config.js' "$HTML"; then
  sed -i 's|</head>|<script src="/env-config.js"></script></head>|' "$HTML"
fi

exec nginx -g 'daemon off;'
