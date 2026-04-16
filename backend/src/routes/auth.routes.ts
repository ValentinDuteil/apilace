// auth.routes.ts — Auth routes for Apilace
// Public routes: register, login, logout, refresh, forgotPassword, resetPassword
// Protected routes: me, updateMe, updatePassword, deleteMe

import { Router } from 'express'
import { csrfProtection } from '../middlewares/csrf.middleware.js'
import { authRateLimit } from '../middlewares/rateLimit.middleware.js'
import { requireAuth } from '../middlewares/requireAuth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  UpdateProfileSchema,
  UpdatePasswordSchema,
} from '../schemas/auth.schemas.js'
import {
  register,
  login,
  logout,
  refresh,
  me,
  updateMe,
  updatePassword,
  deleteMe,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js'

const router = Router()

// Public
router.post('/register', authRateLimit, validate(RegisterSchema), register)
router.post('/login', authRateLimit, validate(LoginSchema), login)
router.post('/logout', logout)
router.post('/refresh', refresh)
router.post('/forgot-password', authRateLimit, validate(ForgotPasswordSchema), forgotPassword)
router.post('/reset-password', authRateLimit, validate(ResetPasswordSchema), resetPassword)

// Protected
router.get('/me', requireAuth, me)
router.patch('/me', requireAuth, csrfProtection, validate(UpdateProfileSchema), updateMe)
router.patch('/password', requireAuth, csrfProtection, validate(UpdatePasswordSchema), updatePassword)
router.delete('/me', requireAuth, csrfProtection, deleteMe)

export default router