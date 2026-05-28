// export.schemas.ts — Zod validation for CSV export query params
// Dates are coerced to Date objects, 'all' enums transformed to undefined, activeOnly to boolean

import * as z from 'zod'

const dateField = z.string().pipe(z.coerce.date()).optional()

export const ExportOrdersSchema = z.object({
  from:      dateField,
  to:        dateField,
  status:    z.enum(['PENDING', 'PAID', 'READY', 'COLLECTED', 'CANCELLED', 'REFUNDED', 'all'])
               .transform(v => v === 'all' ? undefined : v)
               .optional(),
  storeId:   z.coerce.number().int().positive().optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
})

export const ExportUsersSchema = z.object({
  from:      dateField,
  to:        dateField,
  role:      z.enum(['MEMBER', 'ADMIN', 'all'])
               .transform(v => v === 'all' ? undefined : v)
               .optional(),
  minOrders: z.coerce.number().int().nonnegative().optional(),
  minSpent:  z.coerce.number().nonnegative().optional(),
})

export const ExportNewsletterSchema = z.object({
  from:       dateField,
  to:         dateField,
  activeOnly: z.enum(['true', 'false'])
                .transform(v => v === 'true')
                .optional(),
})

export type ExportOrdersDto     = z.infer<typeof ExportOrdersSchema>
export type ExportUsersDto      = z.infer<typeof ExportUsersSchema>
export type ExportNewsletterDto = z.infer<typeof ExportNewsletterSchema>