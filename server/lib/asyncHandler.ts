import type { Request, Response, NextFunction, RequestHandler } from "express"

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>

// envuelve un handler async para que cualquier error caiga al middleware de errores
export const asyncHandler =
  (fn: AsyncHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
