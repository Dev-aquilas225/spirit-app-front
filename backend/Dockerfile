FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-cache
COPY dist/ ./dist/
EXPOSE 4200
CMD ["node", "dist/main"]
