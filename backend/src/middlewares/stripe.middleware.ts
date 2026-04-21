// stripe.middleware.ts — Stripe webhook signature verification
// Uses express.raw() body (mounted in app.ts before express.json())
// Rejects any request with an invalid or missing Stripe signature

import { Request, Response, NextFunction } from 'express'
import { stripe } from '../lib/stripe.js'
import { BadRequestError } from '../utils/AppError.js'

export function stripeWebhook(req: Request, _res: Response, next: NextFunction): void {
  const signature = req.headers['stripe-signature'] as string

  if (!signature) throw new BadRequestError('Signature Stripe manquante')

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not defined')
  }

  try {
    req.stripeEvent = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch {
    throw new BadRequestError('Signature Stripe invalide')
  }

  next()
}