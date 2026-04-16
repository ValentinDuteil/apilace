// requireAuth.middleware.ts — Verifies the JWT access token from the HttpOnly cookie
// Attaches the decoded user payload to req.user for use in protected controllers

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../utils/AppError.js'

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken

  if (!token) {
    throw new UnauthorizedError('Token manquant')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; role: string }
    req.user = decoded
    next()
  } catch {
    throw new UnauthorizedError('Token invalide ou expiré')
  }
}