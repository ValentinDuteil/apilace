// AppError.ts — Custom error classes for the Apilace API
// Extends the native Error class to add HTTP status codes and operational flags
// Usage: throw new ConflictError("Email already exists") in any controller
// errorHandler middleware will catch these and return the appropriate HTTP response

export class AppError extends Error {
  statusCode: number
  isOperational: boolean
  // Optional array of field-level errors, used for Zod validation failures
  details?: { champ: string; message: string }[]

  constructor(message: string, statusCode: number, details?: { champ: string; message: string }[]) {
    super(message)
    this.statusCode = statusCode
    // isOperational = true means the error was anticipated (not a bug)
    // errorHandler uses this to distinguish a known error from an unexpected 500
    this.isOperational = true
    this.details = details
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: { champ: string; message: string }[]) {
    super(message, 400, details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Non autorisé') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accès refusé') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource introuvable') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflit') {
    super(message, 409)
  }
}

export class UnprocessableEntityError extends AppError {
  // Used for business logic errors — e.g. insufficient stock, non-cancellable order
  constructor(message = 'Action impossible') {
    super(message, 422)
  }
}

export class TeaPotError extends AppError {
  constructor(message = "I'm a teapot") {
    super(message, 418)
  }
}