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
CMD ["node", "dist/main"]
