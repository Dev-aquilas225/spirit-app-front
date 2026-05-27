# ─── Stage 1 : Build Expo Web ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Dépendances natives requises par canvas (pdfjs-dist)
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev

COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts && node scripts/patch-canvas.js || true

COPY . .

# Build sans EXPO_PUBLIC_* — l'URL est injectée au runtime via window.__ENV__
RUN npx expo export --platform web

# ─── Stage 2 : Serve avec Nginx ──────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

# Copier le build statique
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint : génère env-config.js + injecte dans index.html au démarrage
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
