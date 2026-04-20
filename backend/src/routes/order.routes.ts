// order.routes.ts — Client order routes for Apilace
// All routes require authentication

import { Router } from 'express'
import { csrfProtection } from '../middlewares/csrf.middleware.js'
import { getOrders, getOrderById, cancelOrder, requestInvoice } from '../controllers/order.controller.js'

const router = Router()

router.get('/', getOrders)
router.get('/:id', getOrderById)
router.post('/:id/cancel', csrfProtection, cancelOrder)
router.post('/:id/invoice', csrfProtection, requestInvoice)

export default router