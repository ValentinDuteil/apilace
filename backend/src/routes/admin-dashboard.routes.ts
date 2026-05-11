// admin-dashboard.routes.ts — Admin dashboard route

import { Router } from 'express'
import { getDashboardStats } from '../controllers/admin-dashboard.controller.js'

const router = Router()

router.get('/', getDashboardStats)

export default router