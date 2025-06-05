import '@/interfaces/express.interface'; // Ensures global augmentation is loaded
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import config from '@/config';
import logger from '@/utils/logger.utils';
import errorHandler from '@/middlewares/error.middleware';
import v1ApiRoutes from '@/api/v1/routes';
import swaggerSpec from '@/config/swagger.config';

const app: Application = express();

// Global Middlewares
app.use(cors({ origin: config.cors.origin }));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const morganFormat = config.env === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
  skip: (req: Request, res: Response) => {
    if (req.originalUrl.startsWith('/api-docs')) return true;
    return false;
  }
}));

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', message: 'User Management Service is healthy.' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true, 
}));
logger.info(`API documentation available at http://localhost:${config.port}/api-docs`);

app.use(config.apiBasePath, v1ApiRoutes);

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl.startsWith(config.apiBasePath)) {
    const error: Error & { statusCode?: number } = new Error(`API Route Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    return next(error);
  }
  const error: Error & { statusCode?: number } = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);

export default app;