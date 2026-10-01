import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { Errors } from '../lib/errors';

type Target = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(Errors.validation(result.error.flatten().fieldErrors));
    }
    req[target] = result.data;
    next();
  };
}
