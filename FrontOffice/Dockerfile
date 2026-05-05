# ── Stage 1 : Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Vite injects env vars at build time. The CD pipeline can override this value.
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm ci || npm install --no-audit --no-fund

COPY . .
RUN npm run build

# ── Stage 2 : Production (Nginx) ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Copier les fichiers buildés dans le répertoire Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration Nginx pour le routing SPA + healthcheck
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
