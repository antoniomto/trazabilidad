#!/bin/sh
set -e

echo "Corriendo migraciones de base de datos..."
npx prisma migrate deploy --schema=/app/server/prisma/schema.prisma

echo "Iniciando servidor..."
exec node dist/index.js
