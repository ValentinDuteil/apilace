// order.utils.ts — Order helper for Apilace
// getOrderOrThrow centralizes order fetching with ownership check

import { prisma } from '../lib/prisma.js'
import { NotFoundError } from './AppError.js'
import type { OrderWithRelations } from '../types/models.types.js'

// Fetches a full order by id
// If userId is provided, verifies the order belongs to that user
export async function getOrderOrThrow(id: number, userId?: number): Promise<OrderWithRelations> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      store: true,
      user: true,
    },
  })

  if (!order) throw new NotFoundError('Commande introuvable')
  if (userId && order.userId !== userId) throw new NotFoundError('Commande introuvable')

  return order as OrderWithRelations
}