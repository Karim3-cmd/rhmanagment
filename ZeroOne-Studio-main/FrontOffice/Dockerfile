# ── Stage 1 : Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2 : Production (Nginx) ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Copier les fichiers buildés dans le répertoire Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration Nginx pour le routing SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
