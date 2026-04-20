import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'

import { requireAdmin } from './middlewares/requireAdmin.middleware.js'
import { requireAuth } from './middlewares/requireAuth.middleware.js'
import { publicStoreRouter, adminStoreRouter } from './routes/store.routes.js'
import { publicProductRouter, adminProductRouter } from './routes/product.routes.js'


import { notFound } from './middlewares/notFound.middleware.js'
import { errorHandler } from './middlewares/errorHandler.middleware.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Apilace API is running 🚀' })
})

app.use('/api/auth', authRoutes)
app.use('/api/admin/users', requireAuth, requireAdmin, userRoutes)
app.use('/api/stores', publicStoreRouter)
app.use('/api/admin/stores', requireAuth, requireAdmin, adminStoreRouter)
app.use('/api/products', publicProductRouter)
app.use('/api/admin/products', requireAuth, requireAdmin, adminProductRouter)

// Must be mounted last — catches unknown routes then handles all errors
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app