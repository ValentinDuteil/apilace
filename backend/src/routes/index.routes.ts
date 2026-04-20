// routes/index.ts — Centralizes all route registrations for Apilace
// Import this file once in app.ts instead of each route individually

import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.middleware.js'
import { requireAdmin } from '../middlewares/requireAdmin.middleware.js'

import authRoutes from './auth.routes.js'
import cartRoutes from './cart.routes.js'
import userRoutes from './user.routes.js'
import orderRoutes from './order.routes.js'
import adminOrderRoutes from './admin-order.routes.js'

import { publicStoreRouter, adminStoreRouter } from './store.routes.js'
import { publicProductRouter, adminProductRouter } from './product.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/cart', requireAuth, cartRoutes)
router.use('/stores', publicStoreRouter)
router.use('/products', publicProductRouter)
router.use('/orders', requireAuth, orderRoutes)
router.use('/admin/users', requireAuth, requireAdmin, userRoutes)
router.use('/admin/stores', requireAuth, requireAdmin, adminStoreRouter)
router.use('/admin/products', requireAuth, requireAdmin, adminProductRouter)
router.use('/admin/orders', requireAuth, requireAdmin, adminOrderRoutes)

export default router