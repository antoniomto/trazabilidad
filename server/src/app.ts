import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env'
import authRoutes from './routes/auth.routes'
import lotsRoutes from './routes/lots.routes'
import phasesRoutes from './routes/phases.routes'
import alertsRoutes from './routes/alerts.routes'
import adminRoutes from './routes/admin.routes'
import { errorHandler } from './middleware/errorHandler'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(
    cors({
      origin: env.ALLOWED_ORIGIN,
      credentials: true,
    })
  )
  app.use(express.json())
  app.use(cookieParser())

  // Health check
  app.get('/api/health', async (_req, res) => {
    res.json({ status: 'ok', uptime: Math.floor(process.uptime()) })
  })

  // Routes
  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/lots', lotsRoutes)
  app.use('/api/v1/phases', phasesRoutes)
  app.use('/api/v1/alerts', alertsRoutes)
  app.use('/api/v1/admin', adminRoutes)

  app.use(errorHandler)

  return app
}
