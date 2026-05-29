# ─── Stage 1 : Build Expo Web ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY scripts/ ./scripts/

# Installer sans postinstall (évite l'erreur canvas sur alpine), puis patcher manuellement
RUN npm install --legacy-peer-deps --ignore-scripts && \
    node scripts/patch-canvas.js || true

COPY . .

# Build sans EXPO_PUBLIC_* — l'URL est injectée au runtime via window.__ENV__
RUN npx expo export --platform web

# ─── Stage 2 : Serve avec Node.js (port 3000) ────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Déclarer les ARGs Coolify pour les recevoir au build
ARG EXPO_PUBLIC_API_BASE_URL=https://api.oracle-plus.online
ARG EXPO_PUBLIC_APP_URL=https://oracle-plus.online
ARG EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=
ARG EXPO_PUBLIC_VAPID_PUBLIC_KEY=
ARG EXPO_PUBLIC_ADMIN_EMAIL=

# Convertir en ENV runtime pour que server.js et entrypoint.sh les lisent
ENV EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL
ENV EXPO_PUBLIC_APP_URL=$EXPO_PUBLIC_APP_URL
ENV EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=$EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB
ENV EXPO_PUBLIC_VAPID_PUBLIC_KEY=$EXPO_PUBLIC_VAPID_PUBLIC_KEY
ENV EXPO_PUBLIC_ADMIN_EMAIL=$EXPO_PUBLIC_ADMIN_EMAIL

# Copier le build statique et le serveur
COPY --from=builder /app/dist ./dist
COPY server.js ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
