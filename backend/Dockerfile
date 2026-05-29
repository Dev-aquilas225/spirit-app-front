FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src/ ./src/
COPY nest-cli.json tsconfig*.json ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-cache
COPY --from=builder /app/dist ./dist/
EXPOSE 4200
# start-period=120s : laisse le temps à NestJS + MySQL de démarrer avant le premier check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD wget -qO- http://localhost:4200/api/v1/health || exit 1
CMD ["node", "dist/main"]
