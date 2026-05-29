FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Install ALL deps including devDeps (nest CLI needed for build)
RUN npm ci --include=dev
COPY src/ ./src/
COPY nest-cli.json tsconfig*.json ./
RUN ./node_modules/.bin/nest build

FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist/
EXPOSE 4200
CMD ["node", "dist/main"]
