// routes/index.ts — Centralizes all route registrations for Apilace
// Import this file once in app.ts instead of each route individually

import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.middleware.js'
import { requireAdmin } from '../middlewares/requireAdmin.middleware.js'
import { csrfProtection } from '../middlewares/csrf.middleware.js'

import authRoutes from './auth.routes.js'
import cartRoutes from './cart.routes.js'
import userRoutes from './user.routes.js'
import orderRoutes from './order.routes.js'
import checkoutRoutes from './checkout.routes.js'
import adminOrderRoutes from './admin-order.routes.js'

import { publicStoreRouter, adminStoreRouter } from './store.routes.js'
import { publicProductRouter, adminProductRouter } from './product.routes.js'

const router = Router()

// Public routes — no auth, no CSRF
router.use('/auth', authRoutes)
router.use('/stores', publicStoreRouter)
router.use('/products', publicProductRouter)

// Protected routes — requireAuth + csrfProtection on mutations
router.use('/cart', requireAuth, csrfProtection, cartRoutes)
router.use('/orders', requireAuth, csrfProtection, orderRoutes)
router.use('/checkout', requireAuth, csrfProtection, checkoutRoutes)

// Admin routes
router.use('/admin/users', requireAuth, requireAdmin, csrfProtection, userRoutes)
router.use('/admin/stores', requireAuth, requireAdmin, csrfProtection, adminStoreRouter)
router.use('/admin/products', requireAuth, requireAdmin, csrfProtection, adminProductRouter)
router.use('/admin/orders', requireAuth, requireAdmin, csrfProtection, adminOrderRoutes)

export default router