import app from './app';
import config from './config';
import logger from './utils/logger.utils';
import { testConnection as testDbConnection } from './database/connection';

const PORT = config.port || 3000;

const startServer = async () => {
  try {
    await testDbConnection();
    logger.info('Database connection verified.');

    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Access API at http://localhost:${PORT}${config.apiBasePath}`); // Updated to use apiBasePath
      logger.info(`Health check at http://localhost:${PORT}/health`);
      // Swagger docs info is now logged from app.ts
    });

    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
      process.on(signal, () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        server.close(() => {
          logger.info('HTTP server closed.');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
