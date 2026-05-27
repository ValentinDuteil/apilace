// legal.controller.ts — Public read + admin flush & fill for legal pages

import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

// ─── Public ──────────────────────────────────────────────────────────────────

export async function getLegalPage(req: Request, res: Response) {
  const { type } = req.params as { type: string }

  const validTypes = ['CGV', 'RGPD', 'MENTIONS_LEGALES']
  if (!validTypes.includes(type)) {
    throw new AppError('Page légale introuvable.', 404)
  }

  const page = await prisma.legalPage.findUnique({
    where: { type: type as 'CGV' | 'RGPD' | 'MENTIONS_LEGALES' },
    include: {
      sections: { orderBy: { position: 'asc' } },
    },
  })

  if (!page) throw new AppError('Page légale introuvable.', 404)

  res.json(page)
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function updateLegalPage(req: Request, res: Response) {
  const { type } = req.params as { type: string }

  const validTypes = ['CGV', 'RGPD', 'MENTIONS_LEGALES']
  if (!validTypes.includes(type)) {
    throw new AppError('Page légale introuvable.', 404)
  }

  const legalType = type as 'CGV' | 'RGPD' | 'MENTIONS_LEGALES'
  const { sections } = req.body as {
    sections: Array<{ title: string; content: string; position: number }>
  }

  const page = await prisma.legalPage.findUnique({ where: { type: legalType } })
  if (!page) throw new AppError('Page légale introuvable.', 404)

  // Flush & fill — same pattern as admin-product sections
  await prisma.$transaction(async (tx) => {
    await tx.legalSection.deleteMany({ where: { legalPageId: page.id } })
    await tx.legalSection.createMany({
      data: sections.map((s, i) => ({
        title: s.title,
        content: s.content,
        position: i,
        legalPageId: page.id,
      })),
    })
  })

  const updated = await prisma.legalPage.findUnique({
    where: { type: legalType },
    include: { sections: { orderBy: { position: 'asc' } } },
  })

  res.json(updated)
}