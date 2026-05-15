// stripe-webhook.controller.ts — Handles incoming Stripe webhook events
// Processes checkout.session.completed : moves order to PAID, decrements stock, clears cart

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { NotFoundError } from '../utils/AppError.js'
import { sendOrderConfirmation } from '../utils/email.utils.js'

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const event = req.stripeEvent!

  // Stripe sends dozens of different event types
  // switch/case makes it easy to handle each type separately and add new ones later
  switch (event.type) {
    // The event we care about — fired when payment is confirmed on Stripe's page
    case 'checkout.session.completed': {
      await handleCheckoutSessionCompleted(event.data.object)
      // break — without this, JS would fall through and execute the next cases
      break
    }
    // All other Stripe event types (payment_intent.created, charge.updated, etc.)
    // Ignored for now — can be extended in V2 if needed
    default:
      break
  }

  // Always acknowledge receipt to Stripe — otherwise it retries for 72h
  res.status(200).json({ received: true })
}

async function handleCheckoutSessionCompleted(
  session: import('stripe').Stripe.Checkout.Session
): Promise<void> {
  const { id: stripeSessionId, payment_intent: paymentIntent } = session

  const order = await prisma.order.findUnique({
    where: { stripeSessionId },
    include: {
      items: { include: { product: { select: { name: true } } } },
      user: { include: { cart: true } },
      store: true,
    },
  })

  if (!order) throw new NotFoundError(`Commande introuvable pour la session Stripe ${stripeSessionId}`)

  // Idempotency guard — webhook can fire more than once for the same event
  if (order.status !== 'PENDING') return

  await prisma.$transaction([
    // 1. Move order to PAID + attach payment intent id
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        stripePaymentIntentId: typeof paymentIntent === 'string' ? paymentIntent : null,
      },
    }),

    // 2. Decrement stock for each ordered item
    ...order.items.map(item =>
      prisma.productSize.update({
        where: { productId_size: { productId: item.productId, size: item.size } },
        data: { stock: { decrement: item.quantity } },
      })
    ),

    // 3. Clear the user's cart
    ...(order.user.cart
      ? [prisma.cartItem.deleteMany({ where: { cartId: order.user.cart.id } })]
      : []
    ),
  ])

  // Send confirmation email — fail-safe, a Resend error will not throw here
  await sendOrderConfirmation(order.user.email, {
    orderId: order.id,
    firstName: order.user.firstName,
    items: order.items.map(item => ({
      productName: item.product.name,
      size: item.size,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })),
    totalAmount: Number(order.totalAmount),
    store: {
      name: order.store.name,
      address: order.store.address,
      city: order.store.city,
      postalCode: order.store.postalCode,
    },
  })
}