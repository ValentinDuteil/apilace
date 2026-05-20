// googleOAuth.controller.ts — Google OAuth 2.0 handlers for Apilace
// GET /auth/google        → redirect to Google consent screen
// GET /auth/google/callback → exchange code, upsert user, set session cookies

import { Request, Response } from 'express'
import { OAuth2Client } from 'google-auth-library'
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { UnauthorizedError } from '../utils/AppError.js'
import {
  setAuthCookies,
  createRefreshToken,
  signAccessToken,
  getBaseCookieOptions,
} from '../utils/session.utils.js'

const OAUTH_STATE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes — single-use CSRF token

function buildOAuth2Client(): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_CALLBACK_URL!
  )
}

// ─── Step 1 : Redirect to Google ─────────────────────────────────────────────

export async function redirectToGoogle(req: Request, res: Response): Promise<void> {
  const state = crypto.randomBytes(32).toString('hex')

  // Store state in a short-lived HttpOnly cookie to verify on callback (anti-CSRF)
  res.cookie('oauth_state', state, {
    ...getBaseCookieOptions(),
    httpOnly: true,
    maxAge: OAUTH_STATE_EXPIRY_MS,
  })

  const url = buildOAuth2Client().generateAuthUrl({
    access_type: 'online',
    scope: ['email', 'profile'],
    state,
  })

  res.redirect(url)
}

// ─── Step 2 : Handle Google callback ─────────────────────────────────────────

export async function handleGoogleCallback(req: Request, res: Response): Promise<void> {
  const { code, state } = req.query as { code?: string; state?: string }
  const storedState = req.cookies?.oauth_state

  // Consume the state cookie immediately — it is single-use
  res.clearCookie('oauth_state', getBaseCookieOptions())

  if (!state || !storedState || state !== storedState) throw new UnauthorizedError('État OAuth invalide')
  if (!code) throw new UnauthorizedError('Code OAuth manquant')

  // Exchange authorization code for Google tokens + verify ID token
  const client = buildOAuth2Client()
  const { tokens } = await client.getToken(code)

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID!,
  })

  const payload = ticket.getPayload()
  if (!payload?.email || !payload.sub) throw new UnauthorizedError('Profil Google invalide')

  const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload

  // ─── Find or create user ──────────────────────────────────────────────────
  // Priority: googleId match → email match (silent linking) → create new account

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }], isDeleted: false },
  })

  if (user) {
    // Silently link googleId if the user previously registered with email/password
    if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId } })
    }
  } else {
    // New user — no password for OAuth accounts
    user = await prisma.user.create({
      data: {
        email,
        googleId,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
      },
    })
  }

  // ─── Issue Apilace session ────────────────────────────────────────────────

  const accessToken = signAccessToken(user.id, user.role)
  const rawRefreshToken = await createRefreshToken(user.id)

  setAuthCookies(res, accessToken, rawRefreshToken)

  res.redirect(`${process.env.FRONTEND_URL}/oauth/callback`)
}