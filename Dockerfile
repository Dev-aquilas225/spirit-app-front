FROM node:20-alpine

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
COPY scripts/ ./scripts/
RUN npm install --legacy-peer-deps --ignore-scripts && \
    node scripts/patch-canvas.js || true

# Copier les sources (inclut .env.production, server.js, entrypoint.sh)
COPY . .

# Utiliser .env.production pour le build Expo
# Coolify injecte ses ARGs mais ne peut pas modifier les fichiers du repo
RUN cp .env.production .env && npx expo export --platform web

RUN chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
