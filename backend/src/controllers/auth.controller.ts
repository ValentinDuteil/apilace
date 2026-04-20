// auth.controller.ts — Handles all authentication logic for Apilace
// Access token + refresh token with rotation, both stored in HttpOnly cookies
// CSRF token generated here and stored in a readable cookie for the frontend interceptor

import { Request, Response } from 'express'
import * as argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { UnauthorizedError, NotFoundError, ConflictError } from '../utils/AppError.js'
import type { RegisterDto, LoginDto, UpdateProfileDto, UpdatePasswordDto } from '../schemas/auth.schemas.js'
import type { User } from '@prisma/client'
import type { SafeUser } from '../types/models.types.js'
import { getCallerRole } from '../utils/auth.utils.js'

const ACCESS_TOKEN_EXPIRY = '7d'
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000

// Hashes a high-entropy random token with sha256 for safe storage in the database
// Argon2 is intentionally not used here — it is designed to slow down brute force on
// predictable human passwords. Random tokens (32 bytes = 256 bits of entropy) are
// computationally impossible to reverse even with a fast hash like sha256
function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

// Strips passwordHash before sending user data to the client
function toSafeUser(user: User): SafeUser {
  const { passwordHash: _, ...safeUser } = user
  return safeUser
}

// Sets the three auth cookies on the response:
// - accessToken (HttpOnly) — read by requireAuth middleware
// - refreshToken (HttpOnly, path restricted) — only sent to /api/auth/refresh
// - XSRF-TOKEN (readable by JS) — axios interceptor attaches it as X-XSRF-TOKEN header
// sameSite 'lax' in dev (no HTTPS), 'none' in prod (cross-origin with HTTPS)
function setAuthCookies(res: Response, accessToken: string, rawRefreshToken: string): void {
  const isProduction = process.env.NODE_ENV === 'production'
  const base = {
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
  }

  res.cookie('accessToken', accessToken, { ...base, httpOnly: true, maxAge: REFRESH_TOKEN_EXPIRY_MS })
  res.cookie('refreshToken', rawRefreshToken, { ...base, httpOnly: true, maxAge: REFRESH_TOKEN_EXPIRY_MS, path: '/api/auth/refresh' })
  res.cookie('XSRF-TOKEN', crypto.randomBytes(32).toString('hex'), { ...base, httpOnly: false, maxAge: REFRESH_TOKEN_EXPIRY_MS })
}

function clearAuthCookies(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production'
  const base = {
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
  }

  res.clearCookie('accessToken', { ...base, httpOnly: true })
  res.clearCookie('refreshToken', { ...base, httpOnly: true, path: '/api/auth/refresh' })
  res.clearCookie('XSRF-TOKEN', { ...base, httpOnly: false })
}

async function createRefreshToken(userId: number): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex')

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    },
  })

  return rawToken
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
    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY })
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

  const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY })
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

  const newAccessToken = jwt.sign(
    { id: storedToken.user.id, role: storedToken.user.role },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )
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

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, isUsed: false },
    data: { isUsed: true },
  })

  const rawToken = crypto.randomBytes(32).toString('hex')

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS) },
  })

  // TODO (S4) — send reset email via Resend with link: /reinitialisation/${rawToken}
  console.log(`[DEV] Reset token for ${email}: ${rawToken}`)

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