// rateLimit.middleware.ts — Rate limiting for sensitive auth routes
// Prevents brute force attacks on login, register and password reset endpoints

import rateLimit from 'express-rate-limit'

// TODO (before prod) — reduce max to 10 attempts
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Trop de tentatives, veuillez réessayer dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
})