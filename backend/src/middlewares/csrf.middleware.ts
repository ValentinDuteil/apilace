// csrf.middleware.ts — Double-submit cookie CSRF protection
// Verifies that the X-XSRF-TOKEN header matches the XSRF-TOKEN cookie
// Only applied on protected (authenticated) routes — public routes are not CSRF-vulnerable
// The XSRF-TOKEN cookie is set by setAuthCookies() on login/register and is readable by JS
// Axios interceptor on the frontend automatically attaches it as X-XSRF-TOKEN header

import { Request, Response, NextFunction } from 'express'
import { ForbiddenError } from '../utils/AppError.js'

export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(req.method)) { next(); return }

  const cookieToken = req.cookies?.['XSRF-TOKEN']
  const headerToken = req.headers['x-xsrf-token'] as string

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new ForbiddenError('Token CSRF invalide')
  }

  next()
}