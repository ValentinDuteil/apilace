// order.schemas.ts — Zod validation schemas for order routes

import * as z from 'zod'

export const CreateCheckoutSessionSchema = z.object({
  storeId: z.number().int({ error: 'ID magasin invalide' }),
})

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['READY', 'COLLECTED'], { error: 'Statut invalide' }),
})

export const CancelOrderSchema = z.object({
  reason: z.string().min(1, { error: 'La raison est requise' }).optional(),
})

export type CreateCheckoutSessionDto = z.infer<typeof CreateCheckoutSessionSchema>
export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusSchema>
export type CancelOrderDto = z.infer<typeof CancelOrderSchema>