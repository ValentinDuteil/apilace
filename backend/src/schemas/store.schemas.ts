// store.schemas.ts — Zod validation schemas for store management routes

import * as z from 'zod'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

// A single day slot — either 0, 2 or 4 fields filled
// 0 fields = closed, 2 fields = no lunch break, 4 fields = lunch break
const DaySlotSchema = z.object({
  open1:  z.string().regex(timeRegex, { error: 'Format invalide (HH:mm)' }).optional(),
  close1: z.string().regex(timeRegex, { error: 'Format invalide (HH:mm)' }).optional(),
  open2:  z.string().regex(timeRegex, { error: 'Format invalide (HH:mm)' }).optional(),
  close2: z.string().regex(timeRegex, { error: 'Format invalide (HH:mm)' }).optional(),
}).refine(data => {
  // open1 and close1 must both be present or both absent
  const slot1 = [data.open1, data.close1].filter(Boolean).length
  if (slot1 === 1) return false

  // open2 and close2 must both be present or both absent
  const slot2 = [data.open2, data.close2].filter(Boolean).length
  if (slot2 === 1) return false

  // slot2 cannot exist without slot1
  if (slot2 === 2 && slot1 === 0) return false

  return true
}, { error: 'Horaires invalides — renseignez 0, 2 ou 4 champs par jour' })

const OpeningHoursSchema = z.object({
  lun: DaySlotSchema.optional(),
  mar: DaySlotSchema.optional(),
  mer: DaySlotSchema.optional(),
  jeu: DaySlotSchema.optional(),
  ven: DaySlotSchema.optional(),
  sam: DaySlotSchema.optional(),
  dim: DaySlotSchema.optional(),
})

export const CreateStoreSchema = z.object({
  name:         z.string().min(1, { error: 'Le nom est requis' }),
  address:      z.string().min(1, { error: "L'adresse est requise" }),
  city:         z.string().min(1, { error: 'La ville est requise' }),
  postalCode:   z.string().min(1, { error: 'Le code postal est requis' }),
  openingHours: OpeningHoursSchema,
})

export const UpdateStoreSchema = CreateStoreSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type CreateStoreDto = z.infer<typeof CreateStoreSchema>
export type UpdateStoreDto = z.infer<typeof UpdateStoreSchema>