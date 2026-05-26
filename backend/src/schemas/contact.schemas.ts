// contact.schemas.ts — Validation schema for the contact form

import * as z from 'zod'

export const ContactSchema = z.object({
  firstName: z.string().min(1, { error: 'Le prénom est requis' }),
  lastName:  z.string().min(1, { error: 'Le nom est requis' }),
  email:     z.string().email({ error: 'Adresse email invalide' }),
  phone:     z.string().optional(),
  content:   z.string().min(10, { error: 'Le message doit contenir au moins 10 caractères' }),
})

export type ContactDto = z.infer<typeof ContactSchema>