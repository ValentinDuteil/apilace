// user.controller.ts — Admin user management for Apilace
// List, update role and soft delete user accounts

import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError, NotFoundError } from '../utils/AppError.js'
import type { UpdateUserRoleDto, UpdateUserDto } from '../schemas/user.schemas.js'
import type { User } from '@prisma/client'
import type { SafeUser } from '../types/models.types.js'

function toSafeUser(user: User): SafeUser {
  const { passwordHash, ...safeUser } = user
  return { ...safeUser, hasPassword: passwordHash !== null }
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getUsers(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 5
  const skip = (page - 1) * limit

  const search = req.query.search as string | undefined
  const role = req.query.role as string | undefined

  const where = {
    isDeleted: false,
    ...(role ? { role: role as 'MEMBER' | 'ADMIN' } : {}),
    ...(search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  }

  // prisma.$transaction runs both queries atomically — if one fails, both are rolled back
  // Here we use it to fetch users and count them in a single round-trip to the database
  const [usersRaw, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { orders: true } },
        orders: { select: { totalAmount: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  // Map raw user data to include order count and total spent, and exclude sensitive fields
  const users = usersRaw.map(({ _count, orders, passwordHash: _, ...user }) => ({
    ...user,
    orderCount: _count.orders,
    totalSpent: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
  }))

  res.status(200).json({
    data: users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export async function getUserById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) throw new NotFoundError('Utilisateur introuvable')

  const user = await prisma.user.findUnique({
    where: { id, isDeleted: false },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          store: { select: { name: true } },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user) throw new NotFoundError('Utilisateur introuvable')

  const { passwordHash, ...safeUser } = user
  res.json({ ...safeUser, hasPassword: passwordHash !== null })
}

// ─── Update profile ───────────────────────────────────────────────────────────

export async function updateUser(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) throw new NotFoundError('Utilisateur introuvable')

  const data = req.body as UpdateUserDto

  const user = await prisma.user.findUnique({ where: { id, isDeleted: false } })
  if (!user) throw new NotFoundError('Utilisateur introuvable')

  try {
    const updated = await prisma.user.update({ where: { id }, data })
    res.json(toSafeUser(updated))
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError('Cette adresse email est déjà utilisée.', 409)
    }
    throw error
  }
}

// ─── Update role ──────────────────────────────────────────────────────────────

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) throw new NotFoundError('Utilisateur introuvable')
  if (id === req.user!.id) throw new AppError('Vous ne pouvez pas modifier votre propre rôle.', 403)

  const { role } = req.body as UpdateUserRoleDto

  const user = await prisma.user.findUnique({ where: { id, isDeleted: false } })
  if (!user) throw new NotFoundError('Utilisateur introuvable')

  const updated = await prisma.user.update({ where: { id }, data: { role } })

  res.status(200).json(toSafeUser(updated))
}

// ─── Soft delete ──────────────────────────────────────────────────────────────

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) throw new NotFoundError('Utilisateur introuvable')
  if (id === req.user!.id) throw new AppError('Vous ne pouvez pas désactiver votre propre compte.', 403)

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