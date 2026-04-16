// validate.middleware.ts — Request body validation middleware using Zod schemas
// Usage: router.post('/register', validate(RegisterSchema), authController.register)
// On failure, throws a BadRequestError with field-level details for the frontend

import { Request, Response, NextFunction } from 'express'
import { ZodType, ZodError, ZodIssue } from 'zod'
import { BadRequestError } from '../utils/AppError.js'

export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const zodError = result.error as ZodError
      // Map Zod issues to { champ, message } so the frontend can display
      // the error under the correct input field
      const details = zodError.issues.map((issue: ZodIssue) => ({
        champ: issue.path.join('.'),
        message: issue.message,
      }))
      throw new BadRequestError('Données invalides', details)
    }

    // Replace req.body with Zod-parsed data (extra fields are stripped)
    req.body = result.data
    next()
  }
}