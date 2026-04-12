#!/bin/sh
set -e

echo "Aplicando schema a la base de datos..."
npx prisma db push --schema=./prisma/schema.prisma --skip-generate

echo "Iniciando servidor..."
exec node dist/index.js
