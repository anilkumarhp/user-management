import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import logger from '@/utils/logger.utils';
import { Prisma } from '@prisma/client'; // Import Prisma for its error types

export interface AppErrorProperties {
  statusCode?: number;
  isOperational?: boolean;
  errors?: any[];
  isJoi?: boolean;
  details?: { message: string; path: string[] }[];
}

const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected internal server error occurred.';
  let isOperationalError = false;
  let responseErrors: any[] | undefined = undefined;
  let stackTrace: string | undefined = undefined;

  // Prisma Error Handling
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    isOperationalError = true; // Prisma errors are generally operational
    switch (err.code) {
      case 'P2002': // Unique constraint failed
        const target = err.meta?.target as string[] | undefined;
        message = `A record with this ${target?.join(', ') || 'value'} already exists.`;
        statusCode = StatusCodes.CONFLICT;
        break;
      case 'P2025': // Record to update/delete does not exist
        message = `Record not found. ${err.meta?.cause || ''}`;
        statusCode = StatusCodes.NOT_FOUND;
        break;
      // Add more Prisma error codes as needed
      default:
        message = `Database request error: ${err.code}. Please contact support.`;
        // Keep statusCode as 500 for unhandled known Prisma errors or set specific ones.
        break;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    isOperationalError = true;
    message = 'Invalid input data for database operation.';
    statusCode = StatusCodes.BAD_REQUEST;
    // err.message often contains detailed field issues from Prisma
    responseErrors = [{ field: 'prismaValidation', message: err.message }];
  }


  // General error property extraction (if not a handled Prisma error)
  if (err && typeof err === 'object' && !isOperationalError) { 
    statusCode = typeof err.statusCode === 'number' ? err.statusCode : statusCode;
    isOperationalError = err.isOperational === true || isOperationalError; 
    responseErrors = Array.isArray(err.errors) ? err.errors : responseErrors;
    stackTrace = err.stack || stackTrace;

    if (err.message && typeof err.message === 'string') {
      if (isOperationalError && message === 'An unexpected internal server error occurred.') { 
        message = err.message;
      } else if (process.env.NODE_ENV === 'development' && message === 'An unexpected internal server error occurred.') {
        message = err.message;
      }
    }
  } else if (err instanceof Error && !isOperationalError) {
      message = process.env.NODE_ENV === 'development' ? err.message : message;
      stackTrace = err.stack;
  } else if (typeof err === 'string' && !isOperationalError) {
      message = err;
  }


  logger.error(`Error: ${err.message || err || 'Unknown error'}`, {
    statusCode,
    stack: stackTrace,
    path: req.path,
    method: req.method,
    isOperational: isOperationalError,
    errors: responseErrors,
    prismaCode: err?.code, 
    prismaMeta: err?.meta, 
  });

  if (err && err.isJoi === true && Array.isArray(err.details)) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.details.map((detail: { message: string; path: string[] }) => ({
        field: detail.path && Array.isArray(detail.path) ? detail.path.join('.') : 'unknown_field',
        message: detail.message || 'No message provided for this field.',
      })),
    });
    return;
  }
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(responseErrors && { errors: responseErrors }),
    ...(process.env.NODE_ENV === 'development' && stackTrace && { stack: stackTrace }),
  });
};

export default errorHandler;