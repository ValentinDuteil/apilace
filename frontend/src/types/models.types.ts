// models.types.ts — Frontend domain types for Apilace
// Mirrors backend models.types.ts without Prisma imports

// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role = 'MEMBER' | 'ADMIN'

export type OrderStatus = 'PENDING' | 'PAID' | 'READY' | 'COLLECTED' | 'CANCELLED' | 'REFUNDED'

export type SectionType = 'IMAGE_TEXT' | 'PRODUCT_CTA'

export type TextSide = 'LEFT' | 'RIGHT'

export type LegalType = 'CGV' | 'RGPD' | 'MENTIONS_LEGALES'

// ─── Auth ────────────────────────────────────────────────────────────────────

export type SafeUser = {
  id: number
  email: string
  googleId: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  address: string | null
  postalCode: string | null
  city: string | null
  role: Role
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductImage = {
  id: number
  productId: number
  url: string
  isPrimary: boolean
  position: number
}

export type ProductSize = {
  id: number
  productId: number
  size: string
  stock: number
}

export type ProductSection = {
  id: number
  productId: number
  type: SectionType
  position: number
  imageUrl: string | null
  textSide: TextSide
  title1: string | null
  description1: string | null
  text2: string | null
  desc2: string | null
  text3: string | null
  desc3: string | null
  text4: string | null
  desc4: string | null
}

export type Product = {
  id: number
  name: string
  slug: string
  description: string | null
  price: string // Decimal serialized as string by Prisma over JSON
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ProductWithRelations = Product & {
  images: ProductImage[]
  sizes: ProductSize[]
  sections: ProductSection[]
}

// ─── Store ───────────────────────────────────────────────────────────────────

export type OpeningHours = {
  lun?: { open1: string; close1: string; open2?: string; close2?: string } | null
  mar?: { open1: string; close1: string; open2?: string; close2?: string } | null
  mer?: { open1: string; close1: string; open2?: string; close2?: string } | null
  jeu?: { open1: string; close1: string; open2?: string; close2?: string } | null
  ven?: { open1: string; close1: string; open2?: string; close2?: string } | null
  sam?: { open1: string; close1: string; open2?: string; close2?: string } | null
  dim?: { open1: string; close1: string; open2?: string; close2?: string } | null
}

export type Store = {
  id: number
  name: string
  address: string
  city: string
  postalCode: string
  openingHours: OpeningHours
  isActive: boolean
  createdAt: string
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export type CartItem = {
  id: number
  cartId: number
  productId: number
  size: string
  quantity: number
  product: Product & { images: ProductImage[] }
}

export type Cart = {
  id: number
  userId: number
  createdAt: string
  updatedAt: string
  items: CartItem[]
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderItem = {
  id: number
  orderId: number
  productId: number
  size: string
  quantity: number
  unitPrice: string
  product: Product & { images: ProductImage[] }
}

export type Order = {
  id: number
  userId: number
  storeId: number
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  status: OrderStatus
  totalAmount: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  store: Store
}