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

# Copier le build statique et le serveur
# Les env vars (EXPO_PUBLIC_*) sont injectées par Coolify au runtime via son .env
COPY --from=builder /app/dist ./dist
COPY server.js ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
