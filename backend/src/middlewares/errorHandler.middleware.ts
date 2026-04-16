// errorHandler.middleware.ts — Global error handling middleware for Express
// Must be mounted last in app.ts, after all routes
// Distinguishes anticipated errors (AppError) from unexpected bugs (500)

import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError.js'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err)

  if (err instanceof AppError) {
    // Anticipated error — use the statusCode and message defined in AppError
    // Spread details only if present (Zod validation errors)
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.details && { details: err.details }),
    })
  } else {
    // Unexpected bug — never expose internal details to the client
    res.status(500).json({ message: 'Erreur serveur' })
  }
}