// newsletter.schemas.ts — Validation schemas for newsletter routes

import * as z from 'zod'

export const SubscribeSchema = z.object({
  email: z.string().email({ error: 'Adresse email invalide' }),
})

export type SubscribeDto = z.infer<typeof SubscribeSchema>