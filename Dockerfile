FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY scripts/ ./scripts/
RUN npm install --legacy-peer-deps --ignore-scripts && \
    node scripts/patch-canvas.js || true

COPY . .

# Lire les valeurs depuis .env.production et les exporter explicitement
# avant le build Expo — ignore les ARGs injectés par Coolify
RUN set -a && . ./.env.production && set +a && \
    npx expo export --platform web

RUN chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
