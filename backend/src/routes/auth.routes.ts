// auth.routes.ts — Auth routes for Apilace
// Public routes: register, login, logout, refresh, forgotPassword, resetPassword
// Protected routes: me, updateMe, updatePassword, deleteMe

import { Router } from 'express'
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
router.post('/register', validate(RegisterSchema), register)
router.post('/login', validate(LoginSchema), login)
router.post('/logout', logout)
router.post('/refresh', refresh)
router.post('/forgot-password', validate(ForgotPasswordSchema), forgotPassword)
router.post('/reset-password', validate(ResetPasswordSchema), resetPassword)

// Protected
router.get('/me', requireAuth, me)
router.patch('/me', requireAuth, validate(UpdateProfileSchema), updateMe)
router.patch('/password', requireAuth, validate(UpdatePasswordSchema), updatePassword)
router.delete('/me', requireAuth, deleteMe)

export default router