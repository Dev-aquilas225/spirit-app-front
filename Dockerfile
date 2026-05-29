FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY scripts/ ./scripts/
RUN npm install --legacy-peer-deps --ignore-scripts && \
    node scripts/patch-canvas.js || true

COPY . .

# Sourcer .env.production pour écraser les ARGs Coolify avant le build Expo
RUN set -a && . ./.env.production && set +a && \
    npx expo export --platform web

# ─── Stage 2 : nginx pour servir les fichiers statiques ───────────────────────
FROM nginx:alpine

# Copier le build Expo
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la config nginx et l'entrypoint
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
COPY .env.production /app/.env.production
RUN chmod +x /entrypoint.sh

EXPOSE 3000

# nginx écoute sur 3000 (pas 80)
RUN sed -i 's/listen 80/listen 3000/g' /etc/nginx/conf.d/default.conf 2>/dev/null || true

ENTRYPOINT ["/entrypoint.sh"]
