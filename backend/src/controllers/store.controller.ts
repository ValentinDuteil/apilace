// store.controller.ts — Store management for Apilace
// Public: list active stores — Admin: full CRUD

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { NotFoundError, UnprocessableEntityError } from '../utils/AppError.js'
import type { CreateStoreDto, UpdateStoreDto } from '../schemas/store.schemas.js'

export async function getStores(_req: Request, res: Response): Promise<void> {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  res.status(200).json(stores)
}

export async function getAdminStores(_req: Request, res: Response): Promise<void> {
  const stores = await prisma.store.findMany({
    orderBy: { name: 'asc' },
  })

  res.status(200).json(stores)
}

export async function createStore(req: Request, res: Response): Promise<void> {
  const data = req.body as CreateStoreDto

  const store = await prisma.store.create({ data })

  res.status(201).json(store)
}

export async function updateStore(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  const data = req.body as UpdateStoreDto

  const store = await prisma.store.findUnique({ where: { id } })
  if (!store) throw new NotFoundError('Point de retrait introuvable')

  // Only update fields that were explicitly provided
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  )

  const updated = await prisma.store.update({ where: { id }, data: filteredData })

  res.status(200).json(updated)
}

export async function deleteStore(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)

  const store = await prisma.store.findUnique({ 
    where: { id },
    include: { _count: { select: { orders: true } } }, 
  })
  if (!store) throw new NotFoundError('Point de retrait introuvable')

  if (store._count.orders > 0) {
    throw new UnprocessableEntityError(
      `Impossible de supprimer : ${store._count.orders} commande(s) sont liées à ce point de retrait. Désactivez-le à la place.`
    )
  }
  
  // Soft delete — preserves store data for existing orders (PAID/READY)
  await prisma.store.update({ where: { id }, data: { isActive: false } })

  res.status(204).send()
}