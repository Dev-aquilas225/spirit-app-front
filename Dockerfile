FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY scripts/ ./scripts/
RUN npm install --legacy-peer-deps --ignore-scripts && \
    node scripts/patch-canvas.js || true

# Copier les sources pour le build Expo
COPY app ./app
COPY src ./src
COPY assets ./assets
COPY public ./public
COPY hooks ./hooks
COPY components ./components
COPY constants ./constants
COPY .env.production app.json tsconfig.json metro.config.js eslint.config.js ./

# Sourcer .env.production pour écraser les ARGs Coolify avant le build Expo
RUN set -a && . ./.env.production && set +a && \
    npx expo export --platform web

# Copier server.js et entrypoint.sh EN DERNIER
# Ce layer est invalidé à chaque changement de ces fichiers
COPY server.js entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
