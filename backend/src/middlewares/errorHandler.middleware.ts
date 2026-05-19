// errorHandler.middleware.ts — Global error handling middleware for Express
// Must be mounted last in app.ts, after all routes
// Distinguishes anticipated errors (AppError) from unexpected bugs (500)

import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError.js'
import { Prisma } from '@prisma/client'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err)

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.details && { details: err.details }),
    })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Zod error shape for Prisma unique constraint violation
      const rawTarget = err.meta?.target
      const fields = Array.isArray(rawTarget) && rawTarget.length > 0
        ? rawTarget as string[]
        : (err.message.match(/\(`([^`]+)`\)/) ?? [, null])[1]
          ? [(err.message.match(/\(`([^`]+)`\)/) as RegExpMatchArray)[1]]
          : []
      res.status(409).json({
        message: 'Données invalides',
        details: fields.map(field => ({
          champ: field,
          message: 'Cette valeur est déjà utilisée',
        })),
      })
      return
    }
    // Other Prisma errors can be handled here with more specific messages if desired
    res.status(500).json({ message: 'Erreur serveur' })
    return
  }

  res.status(500).json({ message: 'Erreur serveur' })
}
