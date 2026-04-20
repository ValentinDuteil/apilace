// models.types.ts — Shared model types for Apilace
// Centralizes all domain types used across controllers and utilities
// Organized by domain: Auth, User, Product

import type { 
  User, 
  Product, 
  ProductImage, 
  ProductSize, 
  ProductSection, 
  OrderItem, 
  Order, 
  Cart, 
  CartItem 
} from '@prisma/client'

// ─── Auth ────────────────────────────────────────────────────────────────────

export type SafeUser = Omit<User, 'passwordHash'>

// ─── Product ─────────────────────────────────────────────────────────────────

export type CloudinaryImageData = {
  url: string
  isPrimary: boolean
  position: number
}

export type ProductWithImages = Product & {
  images: ProductImage[]
}

export type ProductWithRelations = Product & {
  images: ProductImage[]
  sizes: ProductSize[]
  sections: ProductSection[]
  orderItems: (OrderItem & { order: Order })[]
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export type CartItemWithProduct = CartItem & {
  product: Product & {
    images: ProductImage[]
  }
}

export type CartWithItems = Cart & {
  items: CartItemWithProduct[]
}