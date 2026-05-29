# ─── Stage 1 : Build Expo Web ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY scripts/ ./scripts/

RUN npm install --legacy-peer-deps --ignore-scripts && \
    node scripts/patch-canvas.js || true

COPY . .

# Écrire le .env avec les valeurs correctes juste avant le build
# (contourne l'injection Coolify qui corrompt ENV/ARG)
RUN printf 'EXPO_PUBLIC_API_BASE_URL=https://api.oracle-plus.online\n\
EXPO_PUBLIC_APP_URL=https://oracle-plus.online\n\
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=835702776630-0gh59t57sgp6oq67h7k02vgsoth2lgsh.apps.googleusercontent.com\n\
EXPO_PUBLIC_VAPID_PUBLIC_KEY=BPahGBQRxKp2NBj98RWtp5gwIgmyjsc0cKzeAbquZdb5a9SEH7UV1SqPAFuB34W7LXc1uxNuPgHF_LL6cqZPZeE\n\
EXPO_PUBLIC_ADMIN_EMAIL=christoinaquilas@gmail.com\n' > .env

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
