import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error({ err, path: req.path }, 'Unhandled error')
  res.status(500).json({ error: 'Error interno del servidor' })
}
