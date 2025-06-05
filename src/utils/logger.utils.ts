import winston from 'winston';
import config from '@/config';

const { format, transports } = winston;
const { combine, timestamp, printf, colorize, errors, json } = format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    config.env === 'development' ? colorize() : json(),
    logFormat
  ),
  transports: [
    new transports.Console(),
  ],
  exceptionHandlers: [
    new transports.Console(),
  ],
  rejectionHandlers: [
    new transports.Console(),
  ],
});

export default logger;