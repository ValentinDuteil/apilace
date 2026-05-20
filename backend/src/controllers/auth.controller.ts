// auth.controller.ts — Handles all authentication logic for Apilace
// Access token + refresh token with rotation, both stored in HttpOnly cookies
// CSRF token generated here and stored in a readable cookie for the frontend interceptor

import {
  Request,
  Response
} from 'express'
import * as argon2 from 'argon2'
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import {
  UnauthorizedError,
  NotFoundError,
  ConflictError
} from '../utils/AppError.js'
import type {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  UpdatePasswordDto
} from '../schemas/auth.schemas.js'
import type { User } from '@prisma/client'
import type { SafeUser } from '../types/models.types.js'
import { getCallerRole } from '../utils/auth.utils.js'
import { sendPasswordReset } from '../utils/email.utils.js'
import {
  hashToken,
  setAuthCookies,
  clearAuthCookies,
  createRefreshToken,
  signAccessToken,
} from '../utils/session.utils.js'

const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000

// Strips passwordHash before sending user data to the client
function toSafeUser(user: User): SafeUser {
  const { passwordHash: _, ...safeUser } = user
  return safeUser
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, firstName, lastName, phone, address, postalCode, city } = req.body as RegisterDto

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new ConflictError('Identifiants invalides')

  const passwordHash = await argon2.hash(password)

  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName, phone, address, postalCode, city },
  })

  // If the request comes from an authenticated admin, don't overwrite their session cookies
  const isAdmin = getCallerRole(req) === 'ADMIN'

  if (!isAdmin) {
    const accessToken = signAccessToken(user.id, user.role)
    const rawRefreshToken = await createRefreshToken(user.id)
    setAuthCookies(res, accessToken, rawRefreshToken)
  }

  res.status(201).json(toSafeUser(user))
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginDto

  const user = await prisma.user.findUnique({ where: { email, isDeleted: false } })
  if (!user || !user.passwordHash) throw new UnauthorizedError('Identifiants invalides')

  const valid = await argon2.verify(user.passwordHash, password)
  if (!valid) throw new UnauthorizedError('Identifiants invalides')

  const accessToken = signAccessToken(user.id, user.role)
  const rawRefreshToken = await createRefreshToken(user.id)

  setAuthCookies(res, accessToken, rawRefreshToken)
  res.status(200).json({ message: 'Connexion réussie' })
}

export async function logout(req: Request, res: Response): Promise<void> {
  const rawRefreshToken = req.cookies?.refreshToken

  if (rawRefreshToken) {
    // Delete the refresh token from the database to fully invalidate the session
    await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(rawRefreshToken) } })
  }

  clearAuthCookies(res)
  res.status(200).json({ message: 'Déconnexion réussie' })
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const rawRefreshToken = req.cookies?.refreshToken
  if (!rawRefreshToken) throw new UnauthorizedError('Token manquant')

  const storedToken = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashToken(rawRefreshToken), expiresAt: { gt: new Date() } },
    include: { user: true },
  })

  if (!storedToken || storedToken.user.isDeleted) throw new UnauthorizedError('Session expirée')

  // Rotation — delete the used token and issue a completely fresh pair
  await prisma.refreshToken.delete({ where: { id: storedToken.id } })

  const newAccessToken = signAccessToken(storedToken.user.id, storedToken.user.role)
  const newRawRefreshToken = await createRefreshToken(storedToken.user.id)

  setAuthCookies(res, newAccessToken, newRawRefreshToken)
  res.status(200).json({ message: 'Token renouvelé' })
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id, isDeleted: false } })
  if (!user) throw new NotFoundError('Utilisateur introuvable')

  res.status(200).json(toSafeUser(user))
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const data = req.body as UpdateProfileDto

  // Only update fields that were explicitly provided — undefined fields are ignored by Prisma
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  )

  const user = await prisma.user.update({ where: { id: req.user!.id }, data: filteredData })

  res.status(200).json(toSafeUser(user))
}

export async function updatePassword(req: Request, res: Response): Promise<void> {
  const { oldPassword, newPassword } = req.body as UpdatePasswordDto

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user || !user.passwordHash) throw new NotFoundError('Utilisateur introuvable')

  const valid = await argon2.verify(user.passwordHash, oldPassword)
  if (!valid) throw new UnauthorizedError('Ancien mot de passe incorrect')

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await argon2.hash(newPassword) } })

  res.status(200).json({ message: 'Mot de passe mis à jour' })
}

export async function deleteMe(req: Request, res: Response): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({ where: { id: req.user!.id }, data: { isDeleted: true } }),
    // Invalidate all active sessions immediately on account deletion
    prisma.refreshToken.deleteMany({ where: { userId: req.user!.id } }),
  ])

  clearAuthCookies(res)
  res.status(200).json({ message: 'Compte supprimé' })
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body
  // Always return the same response to avoid revealing whether an email exists in the database
  const genericResponse = { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' }

  const user = await prisma.user.findUnique({ where: { email, isDeleted: false } })
  if (!user) { res.status(200).json(genericResponse); return }

  if (!user.passwordHash) {
    throw new UnauthorizedError('Ce compte utilise la connexion Google. Connectez-vous via le bouton Google.')
  }

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, isUsed: false },
    data: { isUsed: true },
  })

  const rawToken = crypto.randomBytes(32).toString('hex')

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS) },
  })

  // Send reset email — fail-safe, a Resend error will not throw here
  await sendPasswordReset(email, { firstName: user.firstName, resetToken: rawToken })

  res.status(200).json(genericResponse)
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: { tokenHash: hashToken(token), isUsed: false, expiresAt: { gt: new Date() } },
  })

  if (!resetToken) throw new UnauthorizedError('Token invalide ou expiré')

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash: await argon2.hash(password) } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { isUsed: true } }),
    // Invalidate all active sessions after a password reset for security
    prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } }),
  ])

  res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' })
}