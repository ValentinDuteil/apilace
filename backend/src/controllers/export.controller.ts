// export.controller.ts — Admin CSV exports for orders, users and newsletter
// Separator: semicolon (;) — UTF-8 BOM for French Excel compatibility

import type { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'
import {
  ExportOrdersSchema,
  ExportUsersSchema,
  ExportNewsletterSchema,
} from '../schemas/export.schemas.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(csvEscape).join(';')
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// Set time to end of day UTC to include all records from the 'to' date
function toDateEnd(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(23, 59, 59, 999)
  return d
}

function sendCsv(res: Response, filename: string, rows: string[]): void {
  const today = new Date().toISOString().split('T')[0]
  const bom = '\uFEFF'
  const content = bom + rows.join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}-${today}.csv"`)
  res.send(content)
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING:   'En attente de paiement',
  PAID:      'Payée',
  READY:     'Prête en boutique',
  COLLECTED: 'Récupérée',
  CANCELLED: 'Annulée',
  REFUNDED:  'Remboursée',
}

const ROLE_LABELS: Record<string, string> = {
  MEMBER: 'Membre',
  ADMIN:  'Administrateur',
}

// ─── Export orders ────────────────────────────────────────────────────────────

export async function exportOrders(req: Request, res: Response) {
  const parsed = ExportOrdersSchema.safeParse(req.query)
  if (!parsed.success) throw new AppError('Paramètres de filtres invalides.', 400)
  const filters = parsed.data

  const where: Prisma.OrderWhereInput = {}

  if (filters.status)    where.status  = filters.status
  if (filters.storeId)   where.storeId = filters.storeId
  if (filters.minAmount) where.totalAmount = { gte: filters.minAmount }
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: filters.from }          : {}),
      ...(filters.to   ? { lte: toDateEnd(filters.to) } : {}),
    }
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user:  { select: { firstName: true, lastName: true, email: true, phone: true } },
      store: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
  })

  const header = csvRow([
    'N° commande',
    'Statut',
    'Montant total (€)',
    'Acompte Stripe 30% (€)',
    'Solde boutique 70% (€)',
    'Produits',
    'Prénom client',
    'Nom client',
    'Email client',
    'Téléphone client',
    'Magasin',
    'Date',
  ])

  const rows = [header, ...orders.map(o => {
    const total    = Number(o.totalAmount)
    const deposit  = Math.round(total * 0.3)
    const balance  = Math.round(total * 0.7)
    // Aggregate all items into one cell: "Nom produit (Taille x Qté)"
    const products = o.items
      .map(i => `${i.product?.name ?? '—'} (${i.size} x${i.quantity})`)
      .join(' | ')

    return csvRow([
      o.id,
      ORDER_STATUS_LABELS[o.status] ?? o.status,
      total,
      deposit,
      balance,
      products,
      o.user.firstName ?? '',
      o.user.lastName  ?? '',
      o.user.email,
      o.user.phone     ?? '',
      o.store.name,
      formatDate(o.createdAt),
    ])
  })]

  sendCsv(res, 'commandes', rows)
}

// ─── Export users ─────────────────────────────────────────────────────────────

export async function exportUsers(req: Request, res: Response) {
  const parsed = ExportUsersSchema.safeParse(req.query)
  if (!parsed.success) throw new AppError('Paramètres de filtres invalides.', 400)
  const filters = parsed.data

  const where: Prisma.UserWhereInput = { isDeleted: false }

  if (filters.role) where.role = filters.role
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: filters.from }          : {}),
      ...(filters.to   ? { lte: toDateEnd(filters.to) } : {}),
    }
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      orders: { select: { totalAmount: true } },
    },
  })

  // In-memory filter for minOrders and minSpent
  // Note: move to Prisma _count when volume requires it (Phase 5)
  const filtered = users.filter(u => {
    const orderCount = u.orders.length
    const totalSpent = u.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
    if (filters.minOrders !== undefined && orderCount < filters.minOrders) return false
    if (filters.minSpent  !== undefined && totalSpent < filters.minSpent)  return false
    return true
  })

  const header = csvRow([
    'N° client',
    'Prénom',
    'Nom',
    'Email',
    'Téléphone',
    'Rôle',
    'Nb commandes',
    'Total dépensé (€)',
    'Membre depuis',
  ])

  const rows = [header, ...filtered.map(u => {
    const totalSpent = u.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
    return csvRow([
      u.id,
      u.firstName ?? '',
      u.lastName  ?? '',
      u.email,
      u.phone     ?? '',
      ROLE_LABELS[u.role] ?? u.role,
      u.orders.length,
      totalSpent,
      formatDate(u.createdAt),
    ])
  })]

  sendCsv(res, 'clients', rows)
}

// ─── Export newsletter ────────────────────────────────────────────────────────

export async function exportNewsletter(req: Request, res: Response) {
  const parsed = ExportNewsletterSchema.safeParse(req.query)
  if (!parsed.success) throw new AppError('Paramètres de filtres invalides.', 400)
  const filters = parsed.data

  const where: Prisma.NewsletterWhereInput = {}

  // Default to active-only when no param sent (undefined !== false)
  const activeOnly = filters.activeOnly !== false
  if (activeOnly) where.isActive = true

  if (filters.from || filters.to) {
    where.subscribedAt = {
      ...(filters.from ? { gte: filters.from }          : {}),
      ...(filters.to   ? { lte: toDateEnd(filters.to) } : {}),
    }
  }

  const subscribers = await prisma.newsletter.findMany({
    where,
    orderBy: { subscribedAt: 'desc' },
  })

  const header = csvRow(['Email', 'Statut', 'Inscrit le'])

  const rows = [header, ...subscribers.map(s => csvRow([
    s.email,
    s.isActive ? 'Actif' : 'Désabonné',
    formatDate(s.subscribedAt),
  ]))]

  sendCsv(res, 'newsletter', rows)
}