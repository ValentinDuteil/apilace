// requireAdmin.middleware.ts — Verifies that the authenticated user has the ADMIN role
// Always used after requireAuth in the middleware chain

import { Request, Response, NextFunction } from 'express'
import { ForbiddenError } from '../utils/AppError.js'

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    throw new ForbiddenError('Accès réservé aux administrateurs')
  }
  next()
}