// ============================================================
// validate.ts — Request Validation Middleware
//
// WHY: A reusable factory middleware that validates req.body,
// req.params, or req.query against a Zod schema before the
// request reaches the controller. Throws a ZodError that the
// global error handler formats automatically.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

type RequestPart = 'body' | 'params' | 'query';

export function validate(schema: ZodTypeAny, part: RequestPart = 'body') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[part]);
      req[part] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(err);
      } else {
        next(err);
      }
    }
  };
}
