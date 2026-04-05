# ─── Stage 1 : Build Expo Web ─────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# L'URL de l'API est baked à la compilation (variable EXPO_PUBLIC_*)
# Coolify la passe via "Build Variables" dans l'interface
ARG EXPO_PUBLIC_API_BASE_URL
ENV EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL}

COPY package*.json ./
RUN npm ci

COPY . .

# Export statique Expo Web → dossier dist/
RUN npx expo export --platform web

# ─── Stage 2 : Serve avec Nginx ───────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

# Copier le build statique
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8002

CMD ["nginx", "-g", "daemon off;"]
