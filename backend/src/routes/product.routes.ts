// product.routes.ts — Product routes for Apilace
// Public: list active products, get product by slug
// Admin: full CRUD with image upload and stock management

import { Router } from 'express'
import { validate } from '../middlewares/validate.middleware.js'
import { csrfProtection } from '../middlewares/csrf.middleware.js'
import { upload } from '../middlewares/upload.middleware.js'
import { CreateProductSchema, UpdateProductSchema } from '../schemas/product.schemas.js'
import {
  getProducts,
  getProductBySlug,
  getAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  toggleProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
} from '../controllers/product.controller.js'

const router = Router()

// Public
export const publicProductRouter = router
router.get('/', getProducts)
router.get('/:slug', getProductBySlug)

// Admin
export const adminProductRouter = Router()
adminProductRouter.get('/', getAdminProducts)
adminProductRouter.get('/:id', getAdminProductById)
adminProductRouter.post('/', csrfProtection, upload.array('images', 10), validate(CreateProductSchema), createProduct)
adminProductRouter.patch('/:id', csrfProtection, validate(UpdateProductSchema), updateProduct)
adminProductRouter.patch('/:id/toggle', csrfProtection, toggleProduct)
adminProductRouter.delete('/:id', csrfProtection, deleteProduct)
adminProductRouter.post('/:id/images', csrfProtection, upload.single('image'), addProductImage)
adminProductRouter.delete('/:id/images/:imageId', csrfProtection, deleteProductImage)