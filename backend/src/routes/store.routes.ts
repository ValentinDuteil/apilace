// store.routes.ts — Store routes for Apilace
// Public: list active stores — Admin: full CRUD

import { Router } from 'express'
import { validate } from '../middlewares/validate.middleware.js'
import { csrfProtection } from '../middlewares/csrf.middleware.js'
import { CreateStoreSchema, UpdateStoreSchema } from '../schemas/store.schemas.js'
import {
  getStores,
  getAdminStores,
  createStore,
  updateStore,
  deleteStore,
} from '../controllers/store.controller.js'

const router = Router()

export const publicStoreRouter = router
router.get('/', getStores)

export const adminStoreRouter = Router()
adminStoreRouter.get('/', getAdminStores)
adminStoreRouter.post('/', csrfProtection, validate(CreateStoreSchema), createStore)
adminStoreRouter.patch('/:id', csrfProtection, validate(UpdateStoreSchema), updateStore)
adminStoreRouter.delete('/:id', csrfProtection, deleteStore)