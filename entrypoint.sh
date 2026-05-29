#!/bin/sh
set -e

# Charger les valeurs dans cet ordre de priorité :
# 1. Variables déjà dans process.env (injectées par Coolify au runtime)
# 2. .env.production commité dans le repo (valeurs de production correctes)
# 3. .env Coolify monté (si présent)
for f in /app/.env.production /app/.env /.env; do
  if [ -f "$f" ]; then
    set -a
    . "$f"
    set +a
  fi
done

HTML=/app/dist/index.html
ENV_JS=/app/dist/env-config.js

# 1. Générer env-config.js MAINTENANT avec les valeurs chargées ci-dessus
#    (avant que Coolify puisse écraser process.env dans Node.js)
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
echo "[entrypoint] Contenu fichier: $(cat $ENV_JS | head -c 120)"

# 2. Injecter <script src="/env-config.js"> dans index.html avant </head>
if ! grep -q 'env-config.js' "$HTML"; then
  sed -i 's|</head>|<script src="/env-config.js"></script></head>|' "$HTML"
fi

# 3. Démarrer le serveur Node.js sur port 3000
export PORT=3000
exec node server.js
