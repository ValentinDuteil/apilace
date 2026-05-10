// admin-dashboard.controller.ts — Dashboard statistics for Apilace admin
// Returns total revenue and order counts by status

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const [revenueResult, ordersByStatus] = await prisma.$transaction([
    // Revenue = full price of confirmed orders (PAID, READY, COLLECTED)
    // totalAmount stores the full price — only 30% was charged via Stripe
    prisma.order.aggregate({
      where: { status: { in: ['PAID', 'READY', 'COLLECTED'] } },
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ])

  const countMap = Object.fromEntries(
    ordersByStatus.map(r => [r.status, r._count.id])
  )

  res.status(200).json({
    totalRevenue: Number(revenueResult._sum.totalAmount ?? 0),
    orderCountByStatus: {
      PENDING:   countMap['PENDING']   ?? 0,
      PAID:      countMap['PAID']      ?? 0,
      READY:     countMap['READY']     ?? 0,
      COLLECTED: countMap['COLLECTED'] ?? 0,
      CANCELLED: countMap['CANCELLED'] ?? 0,
      REFUNDED:  countMap['REFUNDED']  ?? 0,
    },
  })
}