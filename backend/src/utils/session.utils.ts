// session.utils.ts — Shared session management utilities
// Extracted from auth.controller.ts to be reused by googleOAuth.controller.ts

import { Response } from 'express'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

export const ACCESS_TOKEN_EXPIRY = '7d'
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

// Hashes a high-entropy random token with sha256 for safe storage in the database
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

export function getBaseCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
  }
}

// Sets the three auth cookies: accessToken, refreshToken (path-restricted), XSRF-TOKEN
export function setAuthCookies(res: Response, accessToken: string, rawRefreshToken: string): void {
  const base = getBaseCookieOptions()
  res.cookie('accessToken', accessToken, { ...base, httpOnly: true, maxAge: REFRESH_TOKEN_EXPIRY_MS })
  res.cookie('refreshToken', rawRefreshToken, { ...base, httpOnly: true, maxAge: REFRESH_TOKEN_EXPIRY_MS, path: '/api/auth/refresh' })
  res.cookie('XSRF-TOKEN', crypto.randomBytes(32).toString('hex'), { ...base, httpOnly: false, maxAge: REFRESH_TOKEN_EXPIRY_MS })
}

export function clearAuthCookies(res: Response): void {
  const base = getBaseCookieOptions()
  res.clearCookie('accessToken', { ...base, httpOnly: true })
  res.clearCookie('refreshToken', { ...base, httpOnly: true, path: '/api/auth/refresh' })
  res.clearCookie('XSRF-TOKEN', { ...base, httpOnly: false })
}

export async function createRefreshToken(userId: number): Promise<string> {
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

// Issues a signed JWT access token for the given user
export function signAccessToken(userId: number, role: string): string {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY })
}

// Generates a cryptographically secure random hex token (256 bits of entropy)
export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex')
}