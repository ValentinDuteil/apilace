// legal.schemas.ts — Zod validation for legal page updates

import { z } from 'zod/v4'

export const updateLegalPageSchema = z.object({
  sections: z
    .array(
      z.object({
        title:    z.string().min(1, { message: 'Le titre est requis.' }),
        content:  z.string().min(1, { message: 'Le contenu est requis.' }),
        position: z.number().int().nonnegative(),
      })
    )
    .min(1, { message: 'Au moins une section est requise.' }),
})