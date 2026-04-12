#!/bin/bash
set -e

echo "=== Deploy Trazabilidad ==="

# Instalar Nginx si no está
if ! command -v nginx &> /dev/null; then
  echo "Instalando Nginx..."
  apt-get install -y nginx
fi

# Ir al directorio del proyecto
cd ~/trazabilidad

# Instalar dependencias
echo "Instalando dependencias..."
npm install --ignore-scripts
npm rebuild

# Compilar shared
echo "Compilando shared..."
cd packages/shared && npx tsc && cd ../..

# Compilar servidor
echo "Compilando servidor..."
cd server && npx prisma generate && npm run build && cd ..

# Aplicar schema SQLite
echo "Aplicando schema de base de datos..."
cd server && DATABASE_URL="file:$(pwd)/data/prod.db" npx prisma db push --skip-generate && cd ..

# Compilar cliente
echo "Compilando cliente..."
cd client && npm run build && cd ..

# Configurar Nginx
echo "Configurando Nginx..."
cat > /etc/nginx/sites-available/trazabilidad << EOF
server {
    listen 80;
    server_name _;
    root $(pwd)/client/dist;
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

# Iniciar o reiniciar con PM2
echo "Iniciando servidor con PM2..."
mkdir -p server/data

if pm2 describe trazabilidad > /dev/null 2>&1; then
  pm2 restart trazabilidad
else
  pm2 start server/dist/index.js \
    --name trazabilidad \
    --env production
fi

pm2 save

echo ""
echo "=== Deploy completado ==="
echo "Abre: http://$(curl -s ifconfig.me)/api/health"
