// path: server/src/utils/asyncHandler.ts
// Wraps async route handlers to automatically catch errors
// and forward them to the global error handler.
// Usage: router.get('/', asyncHandler(async (req, res) => { ... }))

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from '../types';

type AsyncFn<T extends Request = Request> =
  (req: T, res: Response, next: NextFunction) => Promise<void | Response>;

export function asyncHandler<T extends Request = Request>(fn: AsyncFn<T>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
}
