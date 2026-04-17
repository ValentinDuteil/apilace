// user.schemas.ts — Zod validation schemas for user management routes (admin)

import * as z from 'zod'

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['MEMBER', 'ADMIN'], { error: 'Rôle invalide' }),
})

export type UpdateUserRoleDto = z.infer<typeof UpdateUserRoleSchema>