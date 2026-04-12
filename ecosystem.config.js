module.exports = {
  apps: [
    {
      name: 'trazabilidad',
      script: 'server/dist/index.js',
      cwd: '/root/trazabilidad',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        PLANT_TIMEZONE: 'America/Mexico_City',
        // Las siguientes se leen del .env.production en el VPS
      },
    },
  ],
}
