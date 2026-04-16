// auth.schemas.ts — Zod validation schemas for all auth routes
// Zod v4 syntax: custom error messages use { error: "..." } object notation
// These schemas are used by the validate middleware before each controller

import * as z from 'zod'
// Reusable password schema — factorized to avoid repetition across Register, ResetPassword and UpdatePassword schemas
const PasswordSchema = z.string()
  .min(8, { error: "Le mot de passe doit contenir au moins 8 caractères" })
  .regex(/[A-Z]/, { error: "Le mot de passe doit contenir au moins une majuscule" })
  .regex(/[0-9]/, { error: "Le mot de passe doit contenir au moins un chiffre" })
  .regex(/[^a-zA-Z0-9]/, { error: "Le mot de passe doit contenir au moins un caractère spécial" })

export const RegisterSchema = z.object({
  email: z.string().email({ error: "Adresse email invalide" }),
  password: PasswordSchema,
  firstName: z.string().min(1, { error: "Le prénom est requis" }),
  lastName: z.string().min(1, { error: "Le nom est requis" }),
  phone: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
})

export const LoginSchema = z.object({
  email: z.string().email({ error: "Adresse email invalide" }),
  password: z.string().min(1, { error: "Le mot de passe est requis" }),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ error: "Adresse email invalide" }),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, { error: "Token invalide" }),
  password: PasswordSchema,
  confirmPassword: z.string().min(1, { error: "La confirmation est requise" }),
}).refine(data => data.password === data.confirmPassword, {
  error: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, { error: "Le prénom est requis" }).optional(),
  lastName: z.string().min(1, { error: "Le nom est requis" }).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
})

export const UpdatePasswordSchema = z.object({
  oldPassword: z.string().min(1, { error: "L'ancien mot de passe est requis" }),
  newPassword: PasswordSchema,
})

// Inferred types — used in controllers for type safety
export type RegisterDto = z.infer<typeof RegisterSchema>
export type LoginDto = z.infer<typeof LoginSchema>
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>
export type UpdatePasswordDto = z.infer<typeof UpdatePasswordSchema>