// admin-order.controller.ts — Admin order management for Apilace
// List all orders, update status, refund via Stripe and restore stock

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { UnprocessableEntityError } from '../utils/AppError.js'
import { stripe } from '../lib/stripe.js'
import { getOrderOrThrow } from '../utils/order.utils.js'
import type { UpdateOrderStatusDto } from '../schemas/order.schemas.js'
import { 
  sendOrderReady, 
  sendRefundConfirmation,
  sendRefundAudit } from '../utils/email.utils.js'

export async function getAdminOrders(req: Request, res: Response): Promise<void> {
  const status = req.query.status as string | undefined
  const storeId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined
  const search = req.query.search as string | undefined
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit

  const where = {
    ...(status && { status: status as any }),
    ...(storeId && { storeId }),
    ...(search && {
      OR: [
        ...(!isNaN(parseInt(search)) ? [{ id: parseInt(search) }] : []),
        { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
        { user: { lastName: { contains: search, mode: 'insensitive' as const } } },
      ],
    }),
  }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
        store: true,
        user: true,
      },
    }),
    prisma.order.count({ where }),
  ])

  res.status(200).json({
    data: orders,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}

export async function getAdminOrderById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  const order = await getOrderOrThrow(id)
  res.status(200).json(order)
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  const { status } = req.body as UpdateOrderStatusDto

  const order = await getOrderOrThrow(id)

  // Enforce valid status transitions
  const validTransitions: Record<string, string[]> = {
    PAID: ['READY'],
    READY: ['COLLECTED'],
  }

  if (!validTransitions[order.status]?.includes(status)) {
    throw new UnprocessableEntityError(`Transition de statut invalide : ${order.status} → ${status}`)
  }

  const updated = await prisma.order.update({ where: { id }, data: { status } })

  // Notify the client when their watch is ready for pickup
  if (status === 'READY') {
    await sendOrderReady(order.user.email, {
      orderId: id,
      firstName: order.user.firstName,
      store: order.store,
    })
  }

  res.status(200).json(updated)
}

export async function refundOrder(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  const order = await getOrderOrThrow(id)

  // Guard — an admin cannot refund their own order
  if (order.userId === req.user!.id) {
    throw new UnprocessableEntityError('Un administrateur ne peut pas rembourser sa propre commande')
  }

  const refundableStatuses = ['PAID', 'READY', 'COLLECTED', 'CANCELLED']
  if (!refundableStatuses.includes(order.status)) {
    throw new UnprocessableEntityError('Cette commande ne peut pas être remboursée')
  }

  if (!order.stripePaymentIntentId) {
    throw new UnprocessableEntityError('Aucun paiement Stripe associé à cette commande')
  }

  // Call Stripe first — if it fails, DB stays untouched
  await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId })

  // Restore stock for each order item in the same transaction
  await prisma.$transaction([
    prisma.order.update({ where: { id }, data: { status: 'REFUNDED' } }),
    ...order.items.map(item =>
      prisma.productSize.update({
        where: { productId_size: { productId: item.productId, size: item.size } },
        data: { stock: { increment: item.quantity } },
      })
    ),
  ])

  // Notify client and send admin audit trail — both fail-safe
  const clientName = [order.user.firstName, order.user.lastName].filter(Boolean).join(' ') || order.user.email
  await sendRefundConfirmation(order.user.email, {
    orderId: id,
    firstName: order.user.firstName,
    totalAmount: Number(order.totalAmount),
  })
  await sendRefundAudit({
    orderId: id,
    clientEmail: order.user.email,
    clientName,
    totalAmount: Number(order.totalAmount),
  })

  res.status(200).json({ message: 'Commande remboursée et stock restauré' })
}