// cart.utils.ts — Cart helper for Apilace
// getOrCreateCart is used across the cart controller as a single source of truth
// It creates the cart if it doesn't exist yet, and always returns it with full item details

import { prisma } from '../lib/prisma.js'
import type { CartWithItems } from '../types/models.types.js'

export async function getOrCreateCart(userId: number): Promise<CartWithItems> {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: {
      items: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
        },
      },
    },
  })
}