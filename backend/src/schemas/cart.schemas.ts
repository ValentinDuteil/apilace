// cart.schemas.ts — Zod validation schemas for cart routes

import * as z from 'zod'

export const AddToCartSchema = z.object({
  productId: z.number().int({ error: 'ID produit invalide' }),
  size:      z.enum(['S', 'M', 'L', 'Standard'], { error: 'Taille invalide' }),
  quantity:  z.number().int().min(1, { error: 'La quantité doit être au moins 1' }),
})

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1, { error: 'La quantité doit être au moins 1' }),
})

export const MergeCartSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int({ error: 'ID produit invalide' }),
    size:      z.enum(['S', 'M', 'L', 'Standard'], { error: 'Taille invalide' }),
    quantity:  z.number().int().min(1, { error: 'La quantité doit être au moins 1' }),
  })).min(1, { error: 'Le panier est vide' }),
})

export type AddToCartDto = z.infer<typeof AddToCartSchema>
export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>
export type MergeCartDto = z.infer<typeof MergeCartSchema>