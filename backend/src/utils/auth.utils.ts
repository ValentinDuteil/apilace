// auth.utils.ts — Reusable authentication utilities for Apilace controllers
// Use getCallerRole() when you need to adapt behaviour based on the caller's role
// without blocking the request (use requireAuth/requireAdmin middlewares for that)

import { Request } from 'express'
import jwt from 'jsonwebtoken'
import { JwtPayload } from '../types/jwt.types.js'

// Returns the role of the currently authenticated user from the access token cookie
// Returns null if no token is present or if the token is invalid/expired
export function getCallerRole(req: Request): string | null {
  const token = req.cookies?.accessToken
  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    return decoded.role
  } catch {
    return null
  }
}