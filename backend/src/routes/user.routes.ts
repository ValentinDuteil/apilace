// user.routes.ts — Admin user management routes
// All routes require authentication and admin role (enforced in app.ts)

import { Router } from 'express'
import { validate } from '../middlewares/validate.middleware.js'
import { csrfProtection } from '../middlewares/csrf.middleware.js'
import { 
  UpdateUserRoleSchema, 
  UpdateUserSchema 
} from '../schemas/user.schemas.js'
import { 
  getUsers, 
  getUserById, 
  updateUser, 
  updateUserRole, 
  deleteUser 
} from '../controllers/user.controller.js'

const router = Router()

router.get('/', getUsers)
router.get('/:id', getUserById)
router.patch('/:id', csrfProtection, validate(UpdateUserSchema), updateUser)
router.patch('/:id/role', csrfProtection, validate(UpdateUserRoleSchema), updateUserRole)
router.delete('/:id', csrfProtection, deleteUser)

export default router