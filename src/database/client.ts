import { PrismaClient } from '@prisma/client';
import logger from '@/utils/logger.utils';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['info', 'warn', 'error'],
});

// Optional: Graceful shutdown for Prisma Client
// Prisma recommends connecting lazily and doesn't always require explicit disconnect
// on typical server shutdown, but it can be good practice in some scenarios.
// The Prisma client instance itself might handle some signals.
// For more complex scenarios or if you encounter issues, refer to Prisma docs on connection management.
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Disconnecting Prisma Client...`);
  await prisma.$disconnect()
    .then(() => logger.info('Prisma Client disconnected successfully.'))
    .catch((err) => logger.error('Error disconnecting Prisma Client:', err))
    .finally(() => process.exit(0));
}

// Listen for termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default prisma;