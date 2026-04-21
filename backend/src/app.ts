import express from 'express'

import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

import router from './routes/index.routes.js'

import { handleStripeWebhook } from './controllers/stripe-webhook.controller.js'
import { stripeWebhook } from './middlewares/stripe.middleware.js'

import { notFound } from './middlewares/notFound.middleware.js'
import { errorHandler } from './middlewares/errorHandler.middleware.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))

// Stripe webhook — must be mounted before express.json()
// Requires raw body to verify Stripe signature
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook,
  handleStripeWebhook
)

app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Apilace API is running 🚀' })
})

app.use('/api', router)

// Must be mounted last — catches unknown routes then handles all errors
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app