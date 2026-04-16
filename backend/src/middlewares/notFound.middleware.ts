// notFound.middleware.ts — Catches all requests to undefined routes
// Must be mounted just before errorHandler in app.ts

import { Request, Response, NextFunction } from 'express'
import { NotFoundError } from '../utils/AppError.js'

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route introuvable : ${req.method} ${req.originalUrl}`))
}