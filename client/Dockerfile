# ── Stage 1: Build React ──────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY packages/shared ./packages/shared
COPY client/package*.json ./client/
# npm workspaces requiere que todos los directorios del workspace existan
COPY server/package*.json ./server/

RUN npm install

COPY client ./client

# Compilar shared primero (Vite/Rollup necesita el dist, no los .ts fuente)
RUN cd packages/shared && npx tsc

RUN cd client && npm run build

# ── Stage 2: Nginx sirve los estáticos ───────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
