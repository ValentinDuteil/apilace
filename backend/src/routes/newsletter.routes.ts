// newsletter.routes.ts

import { Router } from 'express'
import { authRateLimit } from '../middlewares/rateLimit.middleware.js'
import { requireAuth } from '../middlewares/requireAuth.middleware.js'
import { requireAdmin } from '../middlewares/requireAdmin.middleware.js'
import { csrfProtection } from '../middlewares/csrf.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { SubscribeSchema } from '../schemas/newsletter.schemas.js'
import {
  subscribe,
  unsubscribeByToken,
  getStatus,
  unsubscribeAuthenticated,
  getSubscribers,
} from '../controllers/newsletter.controller.js'

const router = Router()

// Public — no auth
router.post('/subscribe', authRateLimit, validate(SubscribeSchema), subscribe)
router.get('/unsubscribe', unsubscribeByToken)

// Protected member — requireAuth + CSRF sur la mutation
router.get('/status', requireAuth, getStatus)
router.delete('/unsubscribe', requireAuth, csrfProtection, unsubscribeAuthenticated)

// Admin
router.get('/subscribers', requireAuth, requireAdmin, getSubscribers)

export default router