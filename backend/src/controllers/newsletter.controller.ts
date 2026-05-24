// newsletter.controller.ts — Newsletter subscribe/unsubscribe logic

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { NotFoundError } from '../utils/AppError.js'
import type { SubscribeDto } from '../schemas/newsletter.schemas.js'
import { generateRandomToken } from '../utils/session.utils.js'
import { sendNewsletterConfirmation } from '../utils/email.utils.js'

// ─── Public — Subscribe ───────────────────────────────────────────────────────

export async function subscribe(req: Request, res: Response): Promise<void> {
  const { email } = req.body as SubscribeDto

  const existing = await prisma.newsletter.findUnique({ where: { email } })

  if (existing) {
    // Reactivate silently if previously unsubscribed
    if (!existing.isActive) {
      const updated = await prisma.newsletter.update({
        where: { email },
        data: { isActive: true, unsubscribeToken: generateRandomToken() },
      })
      await sendNewsletterConfirmation(email, updated.unsubscribeToken)
    }
    // Already active — return success without revealing subscription status
    res.status(200).json({ message: 'Inscription confirmée' })
    return
  }

  const record = await prisma.newsletter.create({
    data: { email, unsubscribeToken: generateRandomToken() },
  })
  await sendNewsletterConfirmation(email, record.unsubscribeToken)
  res.status(201).json({ message: 'Inscription confirmée' })
}

// ─── Public — Unsubscribe via email link (RGPD) ───────────────────────────────

export async function unsubscribeByToken(req: Request, res: Response): Promise<void> {
  const { token } = req.query as { token?: string }

  const record = token
    ? await prisma.newsletter.findUnique({ where: { unsubscribeToken: token } })
    : null

  if (!record) {
    // Invalid or missing token — redirect to frontend without exposing details
    res.redirect(`${process.env.FRONTEND_URL}/boutique`)
    return
  }

  await prisma.newsletter.update({
    where: { id: record.id },
    data: { isActive: false },
  })

  // Redirect to frontend — a toast can be shown via query param if needed later
  res.redirect(`${process.env.FRONTEND_URL}/boutique`)
}

// ─── Protected — Get subscription status for the authenticated user ───────────

export async function getStatus(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) throw new NotFoundError('Utilisateur introuvable')

  const record = await prisma.newsletter.findUnique({ where: { email: user.email } })

  res.status(200).json({ isSubscribed: record?.isActive ?? false })
}

// ─── Protected — Unsubscribe from account page ────────────────────────────────

export async function unsubscribeAuthenticated(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) throw new NotFoundError('Utilisateur introuvable')

  await prisma.newsletter.updateMany({
    where: { email: user.email },
    data: { isActive: false },
  })

  res.status(200).json({ message: 'Désinscription confirmée' })
}

// ─── Admin — Paginated subscriber list ───────────────────────────────────────

export async function getSubscribers(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = 20
  const skip = (page - 1) * limit

  const [subscribers, total] = await prisma.$transaction([
    prisma.newsletter.findMany({
      where: { isActive: true },
      orderBy: { subscribedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.newsletter.count({ where: { isActive: true } }),
  ])

  res.status(200).json({ subscribers, total, page, totalPages: Math.ceil(total / limit) })
}