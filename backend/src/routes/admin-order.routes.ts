// admin-order.routes.ts — Admin order routes for Apilace
// All routes require authentication and admin role (enforced in index.routes.ts)

import { Router } from 'express'
import { validate } from '../middlewares/validate.middleware.js'
import { csrfProtection } from '../middlewares/csrf.middleware.js'
import { UpdateOrderStatusSchema } from '../schemas/order.schemas.js'
import {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  refundOrder,
} from '../controllers/admin-order.controller.js'

const router = Router()

router.get('/', getAdminOrders)
router.get('/:id', getAdminOrderById)
router.patch('/:id/status', csrfProtection, validate(UpdateOrderStatusSchema), updateOrderStatus)
router.post('/:id/refund', csrfProtection, refundOrder)

export default router