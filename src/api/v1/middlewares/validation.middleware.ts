// This is a generic validation middleware we can reuse.
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';

/**
 * Creates a validation middleware for Express routes using a Joi schema.
 * @param schema - The Joi schema to validate against.
 * @param property - The property of the request object to validate ('body', 'query', 'params').
 * @returns An Express middleware function.
 */
const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown properties where appropriate
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      const joiError: any = new Error('Validation failed');
      joiError.isJoi = true;
      joiError.details = error.details; // Keep original Joi details
      joiError.statusCode = StatusCodes.BAD_REQUEST;
      return next(joiError);
    }
    // Only reassign req.body or req.params if they are the target of validation
    // req.query is often best left as Express parses it, Joi validation ensures it's correct.
    if (property === 'body') {
        req.body = value;
    } else if (property === 'params') {
        req.params = value;
    }
    // For 'query', we've validated it, but we don't reassign req.query
    // The controller will use req.query which has been validated to conform to the schema.
    // If `stripUnknown` is true for query, unknown query params are removed from `value`,
    // but req.query would still have them. This is usually fine.
    // If you strictly need req.query to only contain validated and known properties,
    // you might consider a different approach or carefully reassigning.
    // For now, this approach is safer to avoid the "only a getter" error.
    next();
  };
};

export default validateRequest;