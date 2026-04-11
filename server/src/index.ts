import 'dotenv/config'
import './lib/logger'
import './config/env'
import { logger } from './lib/logger'
import { connectDB } from './config/db'
import { createApp } from './app'
import { startAlertChecker } from './jobs/alertChecker'
import { env } from './config/env'

async function main() {
  await connectDB()
  const app = createApp()
  app.listen(env.PORT, () => {
    logger.info(`🚀 Servidor corriendo en http://localhost:${env.PORT}`)
  })
  startAlertChecker()
}

main().catch((err) => {
  logger.error({ err }, 'Error fatal al iniciar el servidor')
  process.exit(1)
})
