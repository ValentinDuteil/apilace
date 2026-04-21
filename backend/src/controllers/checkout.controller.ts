// checkout.controller.ts — Checkout session creation for Apilace
// Validates cart + stock + store, creates Stripe session, then persists PENDING order

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { stripe } from '../lib/stripe.js'
import { NotFoundError, UnprocessableEntityError } from '../utils/AppError.js'
import type { CreateCheckoutSessionDto } from '../schemas/checkout.schemas.js'

export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  const { storeId } = req.body as CreateCheckoutSessionDto
  const userId = req.user!.id

  // 1. Validate store
  const store = await prisma.store.findUnique({ where: { id: storeId, isActive: true } })
  if (!store) throw new NotFoundError('Point de retrait introuvable ou inactif')

  // 2. Load cart with product + size info
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              sizes: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  })

  if (!cart || cart.items.length === 0) {
    throw new UnprocessableEntityError('Le panier est vide')
  }

  // 3. Check stock for each item
  for (const item of cart.items) {
    if (!item.product.isActive) {
      throw new UnprocessableEntityError(`Le produit "${item.product.name}" n'est plus disponible`)
    }

    const productSize = item.product.sizes.find(s => s.size === item.size)
    if (!productSize || productSize.stock < item.quantity) {
      throw new UnprocessableEntityError(
        `Stock insuffisant pour "${item.product.name}" (taille ${item.size})`
      )
    }
  }

  // 4. Build Stripe line items + compute total
  const totalAmount = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  )

  // 5. Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: cart.items.map(item => ({
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(Number(item.product.price) * 100), // convert to cents
        product_data: {
          name: `${item.product.name} — Taille ${item.size}`,
          ...(item.product.images[0] && { images: [item.product.images[0].url] }),
        },
      },
      quantity: item.quantity,
    })),
    success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/panier`,
  })

  // 6. Persist PENDING order — cart cleared later in Stripe webhook after payment confirmation
  await prisma.order.create({
    data: {
      userId,
      storeId,
      stripeSessionId: session.id,
      status: 'PENDING',
      totalAmount,
      items: {
        create: cart.items.map(item => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
      },
    },
  })

  res.status(201).json({ url: session.url })
}