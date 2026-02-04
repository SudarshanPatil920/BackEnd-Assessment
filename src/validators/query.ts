import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/errorHandler';

export const experienceListQuerySchema = z.object({
  location: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.preprocess(
    (val) => val ?? '1',
    z.string().regex(/^\d+$/).transform(Number)
  ),
  limit: z.preprocess(
    (val) => val ?? '10',
    z.string().regex(/^\d+$/).transform(Number)
  ),
  sort: z.enum(['asc', 'desc']).optional().default('asc')
});

export const validateQuery = <T extends z.ZodSchema>(schema: T) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const processedQuery: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(req.query)) {
        processedQuery[key] = value === undefined ? undefined : String(value);
      }
      const validated = schema.parse(processedQuery);
      req.query = validated as unknown as Request['query'];
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters', error.errors));
      } else {
        next(error);
      }
    }
  };
};
