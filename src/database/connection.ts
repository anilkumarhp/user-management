import { Pool } from 'pg';
import config from '@/config';
import logger from '@/utils/logger.utils';

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
});

pool.on('connect', () => {
  logger.info(`Database connected successfully to ${config.database.host}:${config.database.port}/${config.database.name}`);
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const testConnection = async () => {
  try {
    const client = await pool.connect();
    logger.info('Successfully acquired client from pool. Database connection test successful.');
    client.release();
  } catch (error) {
    logger.error('Failed to connect to the database:', error);
    throw error;
  }
};

export default pool;