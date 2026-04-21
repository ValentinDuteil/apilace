// checkout.routes.ts — Checkout routes for Apilace
// All routes require authentication — validated in index.routes.ts

import { Router } from 'express'
import { createCheckoutSession } from '../controllers/checkout.controller.js'
import { validateBody } from '../middlewares/validate.middleware.js'
import { createCheckoutSessionSchema } from '../schemas/checkout.schemas.js'

const router = Router()

router.post('/session', validateBody(createCheckoutSessionSchema), createCheckoutSession)

export default router