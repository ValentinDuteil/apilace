// product.schemas.ts — Zod validation schemas for product management routes

import * as z from 'zod'

const SectionTypeSchema = z.enum(['IMAGE_TEXT', 'PRODUCT_CTA'], { error: 'Type de section invalide' })
const TextSideSchema = z.enum(['LEFT', 'RIGHT'], { error: 'Côté invalide' })

const ProductSectionSchema = z.object({
  type: SectionTypeSchema,
  position: z.number().int({ error: 'Position invalide' }),
  imageUrl: z.string().url({ error: 'URL invalide' }).optional(),
  textSide: TextSideSchema.optional(),
  title1: z.string().optional(),
  description1: z.string().optional(),
  text2: z.string().optional(),
  desc2: z.string().optional(),
  text3: z.string().optional(),
  desc3: z.string().optional(),
  text4: z.string().optional(),
  desc4: z.string().optional(),
})

const ProductSizeSchema = z.object({
  size: z.enum(['S', 'M', 'L', 'Standard'], { error: 'Taille invalide' }),
  stock: z.number().int().min(0, { error: 'Le stock ne peut pas être négatif' }),
})

export const CreateProductSchema = z.object({
  name: z.string().min(1, { error: 'Le nom est requis' }),
  slug: z.string().min(1, { error: 'Le slug est requis' })
    .regex(/^[a-z0-9-]+$/, { error: 'Le slug ne peut contenir que des minuscules, chiffres et tirets' }),
  description: z.string().optional(),
  price: z.number().positive({ error: 'Le prix doit être positif' }),
  isActive: z.boolean().optional(),
  sizes: z.array(ProductSizeSchema).min(1, { error: 'Au moins une taille est requise' }),
  sections: z.array(ProductSectionSchema).optional(),
})

export const UpdateProductSchema = CreateProductSchema.partial()

export const UpdateStockSchema = z.object({
  size: z.enum(['S', 'M', 'L', 'Standard'], { error: 'Taille invalide' }),
  stock: z.number().int().min(0, { error: 'Le stock ne peut pas être négatif' }),
})

export type CreateProductDto = z.infer<typeof CreateProductSchema>
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>
export type UpdateStockDto = z.infer<typeof UpdateStockSchema>