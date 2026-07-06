import { Request, Response, NextFunction } from "express";

/**
 * Wraps async route handlers so that any rejected promise
 * is automatically forwarded to Express' global error handler.
 *
 * Without this helper, every controller would need its own
 * try/catch block that simply calls next(error).
 */
const asyncHandler =
  (
    fn: (
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<void>
  ) =>
  (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;