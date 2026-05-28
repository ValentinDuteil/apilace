// user.schemas.ts — Zod validation schemas for user management routes (admin)

import * as z from 'zod'

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['MEMBER', 'ADMIN'], { error: 'Rôle invalide' }),
})

export type UpdateUserRoleDto = z.infer<typeof UpdateUserRoleSchema>

export const UpdateUserSchema = z.object({
  firstName:  z.string().min(1, { error: 'Le prénom ne peut pas être vide.' }).optional(),
  lastName:   z.string().min(1, { error: 'Le nom ne peut pas être vide.' }).optional(),
  email:      z.string().email({ error: 'Adresse email invalide.' }).optional(),
  phone:      z.string().nullable().optional(),
  address:    z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  city:       z.string().nullable().optional(),
})

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>