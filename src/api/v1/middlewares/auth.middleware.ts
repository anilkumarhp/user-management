import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyAccessToken } from '@/utils/jwt.utils';
import { AuthenticatedUser } from '@/interfaces/user.interface';
import { UserRoles } from '@/constants/roles.constants';
import logger from '@/utils/logger.utils';

/**
 * Middleware to authenticate requests using JWT access token.
 * Attaches user information to req.user if authentication is successful.
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({ // Send response
      status: 'error',
      message: 'Access token is missing or invalid.',
    });
    return; // Explicitly return to satisfy Promise<void>
  }

  try {
    const decodedUser = await verifyAccessToken(token);
    req.user = decodedUser as AuthenticatedUser; // Attach user to request object
    next(); // Call next for successful authentication
  } catch (error: any) {
    logger.warn('JWT authentication failed:', { error: error.message });
    let message = 'Access token is invalid or expired.';
    if (error.name === 'TokenExpiredError') {
        message = 'Access token has expired.';
    } else if (error.name === 'JsonWebTokenError') {
        message = 'Access token is malformed.';
    }
    res.status(StatusCodes.UNAUTHORIZED).json({ // Send response
      status: 'error',
      message: message,
    });
    return; // Explicitly return
  }
};

/**
 * Middleware factory to authorize requests based on user roles.
 * @param requiredRoles - An array of roles, user must have at least one to be authorized.
 */
export const authorizeRoles = (requiredRoles: UserRoles[]) => {
  return (req: Request, res: Response, next: NextFunction): void => { // This inner function is synchronous
    if (!req.user || !req.user.roles) {
      logger.warn('Authorization attempt without authenticated user or roles.');
      res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Authentication required for this action.',
      });
      return; // Exit
    }

    const userRoles = req.user.roles;
    const hasRequiredRole = userRoles.some(role => requiredRoles.includes(role));

    if (!hasRequiredRole) {
      logger.warn(`Forbidden access attempt by user ${req.user.email} for roles ${requiredRoles.join(', ')}. User has roles: ${userRoles.join(', ')}`);
      res.status(StatusCodes.FORBIDDEN).json({
        status: 'error',
        message: 'You do not have sufficient permissions to access this resource.',
      });
      return; // Exit
    }
    next(); // Call next for successful authorization
  };
};