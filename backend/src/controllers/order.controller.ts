// order.controller.ts — Client order management for Apilace
// List orders, get order detail, cancel order (14-day retraction), request invoice

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { UnprocessableEntityError } from '../utils/AppError.js'
import { getOrderOrThrow } from '../utils/order.utils.js'
import { isWithinDays } from '../utils/date.utils.js'

const CANCELLABLE_STATUSES = ['PAID', 'READY']
const CANCELLATION_DELAY_DAYS = 14

export async function getOrders(req: Request, res: Response): Promise<void> {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
      store: true,
    },
  })

  res.status(200).json(orders)
}

export async function getOrderById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  const order = await getOrderOrThrow(id, req.user!.id)
  res.status(200).json(order)
}

export async function cancelOrder(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  const order = await getOrderOrThrow(id, req.user!.id)

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new UnprocessableEntityError('Cette commande ne peut plus être annulée')
  }

  // Verify the 14-day retraction right — measured from order creation date
if (!isWithinDays(order.createdAt, CANCELLATION_DELAY_DAYS)) {
  throw new UnprocessableEntityError('Le délai de rétractation de 14 jours est dépassé')
}

  await prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } })

  // TODO (S4) — notify admin via Resend that a cancellation was requested
  res.status(200).json({ message: 'Commande annulée' })
}

export async function requestInvoice(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  await getOrderOrThrow(id, req.user!.id)

  // TODO (S4) — send invoice request email to admin via Resend
  res.status(200).json({ message: 'Demande de facture envoyée' })
}