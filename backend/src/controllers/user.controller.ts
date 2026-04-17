// user.controller.ts — Admin user management for Apilace
// List, update role and soft delete user accounts

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { NotFoundError } from '../utils/AppError.js'
import type { UpdateUserRoleDto } from '../schemas/user.schemas.js'
import type { User } from '@prisma/client'

// Omit<User, 'passwordHash'> creates a new type identical to User but without the passwordHash field
// This guarantees at the TypeScript level that we never accidentally send the hash to the client
type SafeUser = Omit<User, 'passwordHash'>

function toSafeUser(user: User): SafeUser {
  const { passwordHash: _, ...safeUser } = user
  return safeUser
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 5
  const skip = (page - 1) * limit

  // prisma.$transaction runs both queries atomically — if one fails, both are rolled back
  // Here we use it to fetch users and count them in a single round-trip to the database
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: { isDeleted: false },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where: { isDeleted: false } }),
  ])

  res.status(200).json({
    data: users.map(toSafeUser),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  const { role } = req.body as UpdateUserRoleDto

  const user = await prisma.user.findUnique({ where: { id, isDeleted: false } })
  if (!user) throw new NotFoundError('Utilisateur introuvable')

  const updated = await prisma.user.update({ where: { id }, data: { role } })

  res.status(200).json(toSafeUser(updated))
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)

  const user = await prisma.user.findUnique({ where: { id, isDeleted: false } })
  if (!user) throw new NotFoundError('Utilisateur introuvable')

  // Soft delete — data is preserved for accounting and legal purposes
  // Refresh tokens are invalidated immediately to terminate all active sessions
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { isDeleted: true } }),
    prisma.refreshToken.deleteMany({ where: { userId: id } }),
  ])

  res.status(204).send()
}