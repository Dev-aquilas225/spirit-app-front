#!/bin/sh
set -e

HTML=/usr/share/nginx/html/index.html
ENV_JS=/usr/share/nginx/html/env-config.js

# 1. Générer env-config.js avec les variables runtime
cat > "$ENV_JS" <<EOF
window.__ENV__ = {
  "EXPO_PUBLIC_API_BASE_URL": "${EXPO_PUBLIC_API_BASE_URL:-}"
};
EOF

# 2. Injecter <script src="/env-config.js"> dans index.html avant </head>
#    (seulement si pas déjà présent)
if ! grep -q 'env-config.js' "$HTML"; then
  sed -i 's|</head>|<script src="/env-config.js"></script></head>|' "$HTML"
fi

# 3. Démarrer nginx
exec nginx -g 'daemon off;'
