// export.routes.ts — Admin CSV export routes
// GET only — no CSRF needed (read-only operations)

import { Router } from 'express'
import {
  exportOrders,
  exportUsers,
  exportNewsletter,
} from '../controllers/export.controller.js'

const router = Router()

router.get('/orders',     exportOrders)
router.get('/users',      exportUsers)
router.get('/newsletter', exportNewsletter)

export default router