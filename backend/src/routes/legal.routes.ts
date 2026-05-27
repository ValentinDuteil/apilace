// legal.routes.ts — Public GET + admin PUT for legal pages

import { Router } from 'express'
import { getLegalPage, updateLegalPage } from '../controllers/legal.controller.js'
import { requireAuth } from '../middlewares/requireAuth.middleware.js'
import { requireAdmin } from '../middlewares/requireAdmin.middleware.js'
import { csrfProtection } from '../middlewares/csrf.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { updateLegalPageSchema } from '../schemas/legal.schemas.js'

export const publicLegalRouter = Router()
export const adminLegalRouter = Router()

publicLegalRouter.get('/:type', getLegalPage)

adminLegalRouter.put(
  '/:type',
  requireAuth,
  requireAdmin,
  csrfProtection,
  validate(updateLegalPageSchema),
  updateLegalPage
)