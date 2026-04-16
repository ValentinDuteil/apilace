// Extends Express Request type with custom properties
import { JwtPayload } from './jwt.types.js'

declare global {
  namespace Express {
    interface Request {
      // Attached by requireAuth middleware after JWT verification
      user?: JwtPayload
    }
  }
}

export {}