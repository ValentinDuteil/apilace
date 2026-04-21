// checkout.schemas.ts — Zod validation schemas for checkout routes

import { z } from 'zod'

export const createCheckoutSessionSchema = z.object({
  storeId: z.number({ error: 'Le point de retrait est requis' }).int().positive(),
})

export type CreateCheckoutSessionDto = z.infer<typeof createCheckoutSessionSchema>