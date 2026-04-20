// cart.routes.ts — Cart routes for Apilace
// All routes are protected — requires authenticated member

import { Router } from 'express'
import { validate } from '../middlewares/validate.middleware.js'
import { csrfProtection } from '../middlewares/csrf.middleware.js'
import { AddToCartSchema, UpdateCartItemSchema, MergeCartSchema } from '../schemas/cart.schemas.js'
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart,
} from '../controllers/cart.controller.js'

const router = Router()

router.get('/', getCart)
router.post('/', csrfProtection, validate(AddToCartSchema), addToCart)
router.patch('/items/:itemId', csrfProtection, validate(UpdateCartItemSchema), updateCartItem)
router.delete('/items/:itemId', csrfProtection, removeFromCart)
router.delete('/', csrfProtection, clearCart)
router.post('/merge', csrfProtection, validate(MergeCartSchema), mergeCart)

export default router