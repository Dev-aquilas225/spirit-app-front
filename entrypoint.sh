#!/bin/sh
set -e

HTML=/usr/share/nginx/html/index.html
ENV_JS=/usr/share/nginx/html/env-config.js

# Générer env-config.js avec toutes les variables runtime
cat > "$ENV_JS" << ENVEOF
window.__ENV__ = {
  "EXPO_PUBLIC_API_BASE_URL":         "${EXPO_PUBLIC_API_BASE_URL:-}",
  "EXPO_PUBLIC_APP_URL":              "${EXPO_PUBLIC_APP_URL:-}",
  "EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB": "${EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB:-}",
  "EXPO_PUBLIC_ADMIN_EMAIL":          "${EXPO_PUBLIC_ADMIN_EMAIL:-}"
};
ENVEOF

# Injecter <script src="/env-config.js"> dans index.html avant </head>
if ! grep -q 'env-config.js' "$HTML"; then
  sed -i 's|</head>|<script src="/env-config.js"></script></head>|' "$HTML"
fi

exec nginx -g 'daemon off;'
