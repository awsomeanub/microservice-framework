import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

type RequestLocation = 'body' | 'query' | 'params';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const validationErrors: Array<{ location: RequestLocation; errors: ZodError }> = [];

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          validationErrors.push({ location: 'params', errors: result.error });
        } else {
          req.params = result.data;
        }
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          validationErrors.push({ location: 'query', errors: result.error });
        } else {
          req.query = result.data;
        }
      }

      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          validationErrors.push({ location: 'body', errors: result.error });
        } else {
          req.body = result.data;
        }
      }

      if (validationErrors.length > 0) {
        const details = validationErrors.flatMap(({ location, errors }) =>
          errors.errors.map((err) => ({
            location,
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          }))
        );

        throw new ValidationError('Validation failed', details);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
