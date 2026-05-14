// admin-product.controller.ts — Admin-specific product operations
// Full Sync (flush & fill) for sections/sizes, and standalone image upload

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { NotFoundError, BadRequestError } from '../utils/AppError.js'
import { verifyImageBuffer, uploadToCloudinary } from '../utils/cloudinary.utils.js'
import type { UpdateProductDto } from '../schemas/product.schemas.js'

// ─── Update product — Full Sync ───────────────────────────────────────────────
// Scalar fields: partial update (only provided fields are changed)
// Sections & sizes: flush all then fill — guarantees clean position ordering
export async function updateProduct(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  const data = req.body as UpdateProductDto

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Produit introuvable')

  await prisma.$transaction(async (tx) => {
    // Update scalar fields — slug is intentionally excluded (would break existing URLs)
    await tx.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined      && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.tagline !== undefined   && { tagline: data.tagline }),
        ...(data.price !== undefined     && { price: data.price }),
        ...(data.isActive !== undefined  && { isActive: data.isActive }),
      },
    })

    // Full Sync sizes
    if (data.sizes !== undefined) {
      await tx.productSize.deleteMany({ where: { productId: id } })
      if (data.sizes.length > 0) {
        await tx.productSize.createMany({
          data: data.sizes.map(s => ({ productId: id, size: s.size, stock: s.stock })),
        })
      }
    }

    // Full Sync sections
    if (data.sections !== undefined) {
      await tx.productSection.deleteMany({ where: { productId: id } })
      if (data.sections.length > 0) {
        await tx.productSection.createMany({
          data: data.sections.map(s => ({
            productId:       id,
            type:            s.type,
            position:        s.position,
            imageUrl:        s.imageUrl        ?? null,
            mirrorBackground: s.mirrorBackground ?? false,
            textSide:        s.textSide        ?? 'LEFT',
            title1:          s.title1          ?? null,
            description1:    s.description1    ?? null,
            text2:           s.text2           ?? null,
            desc2:           s.desc2           ?? null,
            text3:           s.text3           ?? null,
            desc3:           s.desc3           ?? null,
            text4:           s.text4           ?? null,
            desc4:           s.desc4           ?? null,
            specs:           s.specs           ?? null,
          })),
        })
      }
    }
  })

  // Fetch and return the full updated product
  const updated = await prisma.product.findUnique({
    where: { id },
    include: {
      images:   { orderBy: { position: 'asc' } },
      sizes:    true,
      sections: { orderBy: { position: 'asc' } },
    },
  })

  res.status(200).json(updated)
}

// ─── Upload image to Cloudinary ───────────────────────────────────────────────
// Standalone upload — returns URL only, not attached to any product or section yet
// The Builder (Phase 3) will use this URL to populate section.imageUrl
export async function uploadProductImage(req: Request, res: Response): Promise<void> {
  const file = req.file as Express.Multer.File
  if (!file) throw new BadRequestError('Aucun fichier fourni')

  await verifyImageBuffer(file.buffer)
  const url = await uploadToCloudinary(file.buffer)

  res.status(200).json({ url })
}