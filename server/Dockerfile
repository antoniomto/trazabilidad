# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Instalar dependencias del workspace raíz primero (aprovecha cache de Docker)
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY server/package*.json ./server/
# npm workspaces requiere que todos los directorios del workspace existan
COPY client/package*.json ./client/

RUN npm install

# Copiar código fuente del servidor
COPY server ./server

# Compilar shared primero (Node.js runtime no puede ejecutar .ts)
RUN cd packages/shared && npx tsc

# Generar Prisma client y compilar TypeScript
RUN cd server && npx prisma generate && npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app/server

ENV NODE_ENV=production

# Copiar node_modules (ya incluye @prisma/client generado)
COPY --from=build /app/node_modules /app/node_modules

# Copiar artefactos de build del servidor
COPY --from=build /app/server/dist ./dist

# Copiar schema de Prisma (requerido para migrate deploy en runtime)
COPY --from=build /app/server/prisma ./prisma

# Copiar shared package (requerido por imports en runtime)
COPY --from=build /app/packages /app/packages

# Copiar entrypoint
COPY server/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3001

CMD ["./entrypoint.sh"]
