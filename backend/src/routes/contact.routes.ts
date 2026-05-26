// contact.routes.ts — Public contact form route

import { Router } from 'express'
import { authRateLimit } from '../middlewares/rateLimit.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { ContactSchema } from '../schemas/contact.schemas.js'
import { submitContact } from '../controllers/contact.controller.js'

const router = Router()

router.post('/', authRateLimit, validate(ContactSchema), submitContact)

export default router