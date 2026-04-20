// admin-order.controller.ts — Admin order management for Apilace
// List all orders, update status, refund via Stripe and restore stock

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { UnprocessableEntityError } from '../utils/AppError.js'
import { getOrderOrThrow } from '../utils/order.utils.js'
import type { UpdateOrderStatusDto } from '../schemas/order.schemas.js'

export async function getAdminOrders(req: Request, res: Response): Promise<void> {
  const status = req.query.status as string | undefined
  const storeId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit

  const where = {
    ...(status && { status: status as any }),
    ...(storeId && { storeId }),
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

  // TODO (S4) — send email to client via Resend when status changes to READY
  res.status(200).json(updated)
}

export async function refundOrder(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  const order = await getOrderOrThrow(id)

  const refundableStatuses = ['PAID', 'READY', 'COLLECTED', 'CANCELLED']
  if (!refundableStatuses.includes(order.status)) {
    throw new UnprocessableEntityError('Cette commande ne peut pas être remboursée')
  }

  if (!order.stripePaymentIntentId) {
    throw new UnprocessableEntityError('Aucun paiement Stripe associé à cette commande')
  }

  // TODO (S3) — trigger Stripe refund via stripePaymentIntentId
  // TODO (S4) — send refund confirmation email to client via Resend

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

  res.status(200).json({ message: 'Commande remboursée et stock restauré' })
}