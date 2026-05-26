// contact.controller.ts — Handles contact form submission
// Saves message to DB and notifies admin via email
// Works for both anonymous and authenticated users

import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { sendContactMessage } from '../utils/email.utils.js'
import type { ContactDto } from '../schemas/contact.schemas.js'
import type { JwtPayload } from '../types/jwt.types.js'

export async function submitContact(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, email, phone, content } = req.body as ContactDto

  // Resolve userId from session cookie if present — not blocking if absent or invalid
  let userId: number | null = null
  const token = req.cookies?.accessToken
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
      userId = decoded.id
    } catch {
      // Expired or invalid token — treat as anonymous
    }
  }

  await prisma.message.create({
    data: { firstName, lastName, email, phone: phone ?? null, content, userId },
  })

  // Notify admin — fail-safe, email failure must not block the response
  await sendContactMessage({ firstName, lastName, email, phone, content })

  res.status(201).json({ message: 'Message envoyé avec succès' })
}