// cart.controller.ts — Cart management for Apilace
// All routes are protected — visitors manage their cart in localStorage (frontend only)
// Stock is not reserved on add — it is verified at checkout before Stripe session creation

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { NotFoundError } from '../utils/AppError.js'
import { getOrCreateCart } from '../utils/cart.utils.js'
import type { AddToCartDto, UpdateCartItemDto, MergeCartDto } from '../schemas/cart.schemas.js'

export async function getCart(req: Request, res: Response): Promise<void> {
  const cart = await getOrCreateCart(req.user!.id)
  res.status(200).json(cart)
}

export async function addToCart(req: Request, res: Response): Promise<void> {
  const { productId, size, quantity } = req.body as AddToCartDto

  const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } })
  if (!product) throw new NotFoundError('Produit introuvable ou indisponible')

  const cart = await getOrCreateCart(req.user!.id)

  const existingItem = cart.items.find(
    item => item.productId === productId && item.size === size
  )

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    })
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, size, quantity },
    })
  }

  const updatedCart = await getOrCreateCart(req.user!.id)
  res.status(200).json(updatedCart)
}

export async function updateCartItem(req: Request, res: Response): Promise<void> {
  const itemId = parseInt(req.params.itemId as string)
  const { quantity } = req.body as UpdateCartItemDto

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  })

  if (!item) throw new NotFoundError('Article introuvable dans le panier')

  // Ensure the item belongs to the authenticated user's cart
  if (item.cart.userId !== req.user!.id) throw new NotFoundError('Article introuvable dans le panier')

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } })

  const updatedCart = await getOrCreateCart(req.user!.id)
  res.status(200).json(updatedCart)
}

export async function removeFromCart(req: Request, res: Response): Promise<void> {
  const itemId = parseInt(req.params.itemId as string)

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  })

  if (!item) throw new NotFoundError('Article introuvable dans le panier')

  // Ensure the item belongs to the authenticated user's cart
  if (item.cart.userId !== req.user!.id) throw new NotFoundError('Article introuvable dans le panier')

  await prisma.cartItem.delete({ where: { id: itemId } })

  const updatedCart = await getOrCreateCart(req.user!.id)
  res.status(200).json(updatedCart)
}

export async function clearCart(req: Request, res: Response): Promise<void> {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } })

  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  }

  res.status(200).json({ message: 'Panier vidé' })
}

export async function mergeCart(req: Request, res: Response): Promise<void> {
  const { items } = req.body as MergeCartDto

  const cart = await getOrCreateCart(req.user!.id)

  for (const incomingItem of items) {
    const { productId, size, quantity } = incomingItem

    // Skip inactive or unknown products silently
    const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } })
    if (!product) continue

    const existingItem = cart.items.find(
      item => item.productId === productId && item.size === size
    )

    if (existingItem) {
      // Keep the highest quantity between localStorage and BDD
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: Math.max(existingItem.quantity, quantity) },
      })
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, size, quantity },
      })
    }
  }

  const updatedCart = await getOrCreateCart(req.user!.id)
  res.status(200).json(updatedCart)
}