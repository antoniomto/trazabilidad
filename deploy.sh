#!/bin/bash
set -e

ROOT=/root/trazabilidad
cd $ROOT

echo "=== Deploy Trazabilidad ==="

# Instalar Nginx si no está
if ! command -v nginx &> /dev/null; then
  apt-get install -y nginx
fi

# Instalar dependencias
echo "Instalando dependencias..."
rm -rf node_modules package-lock.json
npm install

# Compilar shared
echo "Compilando shared..."
npx tsc -p packages/shared/tsconfig.json

# Compilar servidor
echo "Compilando servidor..."
cd $ROOT/server
npx prisma generate
npm run build

# Aplicar schema SQLite
echo "Aplicando base de datos..."
mkdir -p $ROOT/server/data
DATABASE_URL="file:$ROOT/server/data/prod.db" npx prisma db push --skip-generate

# Compilar cliente
echo "Compilando cliente..."
cd $ROOT/client
npm run build

# Configurar Nginx
echo "Configurando Nginx..."
cat > /etc/nginx/sites-available/trazabilidad << EOF
server {
    listen 80;
    server_name _;
    root $ROOT/client/dist;
    index index.html;

    location /api/v1/alerts/stream {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_read_timeout 3600s;
        proxy_set_header Host \$host;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header Cookie \$http_cookie;
        proxy_pass_header Set-Cookie;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/trazabilidad /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Iniciar con PM2
echo "Iniciando servidor con PM2..."
cd $ROOT

if pm2 describe trazabilidad > /dev/null 2>&1; then
  pm2 restart trazabilidad
else
  pm2 start server/dist/index.js --name trazabilidad
fi

pm2 save

echo ""
echo "=== Deploy completado ==="
echo "Verificando..."
sleep 3
curl -s http://localhost/api/health || echo "Aun iniciando, espera unos segundos"
