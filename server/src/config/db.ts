import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function connectDB() {
  try {
    await prisma.$connect()
    logger.info('✅ Base de datos conectada')
  } catch (err) {
    logger.error({ err }, '❌ Error conectando a la base de datos')
    process.exit(1)
  }
}
