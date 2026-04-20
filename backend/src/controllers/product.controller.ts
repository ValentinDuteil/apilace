// product.controller.ts — Product management for Apilace
// Public: list active products, get product by slug
// Admin: full CRUD with Cloudinary image upload and stock management

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { NotFoundError, BadRequestError, UnprocessableEntityError } from '../utils/AppError.js'
import { verifyImageBuffer, uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.utils.js'
import type { CreateProductDto, UpdateProductDto } from '../schemas/product.schemas.js'
import type { CloudinaryImageData, ProductWithRelations } from '../types/models.types.js'

const ACTIVE_ORDER_STATUSES = ['PAID', 'READY']

export async function getProducts(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 6
  const skip = (page - 1) * limit

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: { isActive: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        sizes: true,
      },
    }),
    prisma.product.count({ where: { isActive: true } }),
  ])

  res.status(200).json({
    data: products,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}

export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  const slug = req.params.slug as string

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { position: 'asc' } },
      sizes: true,
      sections: { orderBy: { position: 'asc' } },
    },
  })

  if (!product) throw new NotFoundError('Produit introuvable')

  res.status(200).json(product)
}

export async function getAdminProducts(_req: Request, res: Response): Promise<void> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      sizes: true,
    },
  })

  res.status(200).json(products)
}

export async function getAdminProductById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: 'asc' } },
      sizes: true,
      sections: { orderBy: { position: 'asc' } },
    },
  })

  if (!product) throw new NotFoundError('Produit introuvable')

  res.status(200).json(product)
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const data = req.body as CreateProductDto
  const files = req.files as Express.Multer.File[]

  const imageData: CloudinaryImageData[] = []

  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      await verifyImageBuffer(files[i].buffer)
      const url = await uploadToCloudinary(files[i].buffer)
      imageData.push({ url, isPrimary: i === 0, position: i })
    }
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      isActive: data.isActive ?? true,
      images: { create: imageData },
      sizes: { create: data.sizes },
      sections: data.sections ? { create: data.sections } : undefined,
    },
    include: { images: true, sizes: true, sections: true },
  })

  res.status(201).json(product)
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  const data = req.body as UpdateProductDto

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new NotFoundError('Produit introuvable')

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      // slug is intentionally excluded — changing it after creation would break existing URLs
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price && { price: data.price }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: { images: true, sizes: true, sections: true },
  })

  res.status(200).json(updated)
}

export async function toggleProduct(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new NotFoundError('Produit introuvable')

  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  })

  res.status(200).json(updated)
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      orderItems: { include: { order: true } },
      images: true,
    },
  }) as ProductWithRelations | null

  if (!product) throw new NotFoundError('Produit introuvable')

  // Block deletion if the product has any active orders
  const hasActiveOrders = product.orderItems.some(
    item => ACTIVE_ORDER_STATUSES.includes(item.order.status)
  )
  if (hasActiveOrders) {
    throw new UnprocessableEntityError('Impossible de supprimer un produit ayant des commandes actives — désactivez-le plutôt')
  }

  // Delete all images from Cloudinary before removing from database
  for (const image of product.images) {
    await deleteFromCloudinary(image.url)
  }

  await prisma.product.delete({ where: { id } })

  res.status(204).send()
}

export async function addProductImage(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string)
  const file = req.file as Express.Multer.File

  if (!file) throw new BadRequestError('Aucun fichier fourni')

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new NotFoundError('Produit introuvable')

  await verifyImageBuffer(file.buffer)
  const url = await uploadToCloudinary(file.buffer)

  const lastImage = await prisma.productImage.findFirst({
    where: { productId: id },
    orderBy: { position: 'desc' },
  })

  const image = await prisma.productImage.create({
    data: {
      productId: id,
      url,
      isPrimary: false,
      position: lastImage ? lastImage.position + 1 : 0,
    },
  })

  res.status(201).json(image)
}

export async function deleteProductImage(req: Request, res: Response): Promise<void> {
  const imageId = parseInt(req.params.imageId as string)

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    include: {
      product: {
        include: {
          images: true,
          orderItems: { include: { order: true } },
        },
      },
    },
  })

  if (!image) throw new NotFoundError('Image introuvable')

  // Block if it's the only image remaining on the product
  if (image.product.images.length === 1) {
    throw new UnprocessableEntityError('Impossible de supprimer la seule image du produit')
  }

  // Block if the product has active orders
  const hasActiveOrders = image.product.orderItems.some(
    item => ACTIVE_ORDER_STATUSES.includes(item.order.status)
  )
  if (hasActiveOrders) {
    throw new UnprocessableEntityError('Impossible de supprimer une image avec des commandes actives en cours')
  }

  // Block if it's the primary image
  if (image.isPrimary) {
    throw new UnprocessableEntityError("Impossible de supprimer l'image principale — définissez-en une autre d'abord")
  }

  await deleteFromCloudinary(image.url)
  await prisma.productImage.delete({ where: { id: imageId } })

  res.status(204).send()
}