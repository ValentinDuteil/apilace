// models.types.ts — Frontend domain types for Apilace
// Mirrors backend models.types.ts without Prisma imports

// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role = 'MEMBER' | 'ADMIN'

export type OrderStatus = 'PENDING' | 'PAID' | 'READY' | 'COLLECTED' | 'CANCELLED' | 'REFUNDED'

export const STATUS_CONFIG: Record<OrderStatus, { label: string; dot: string; color: string; bg: string }> = {
  PENDING:   { label: 'Paiement en cours de vérification', dot: '#adb5bd', color: '#6c757d',  bg: 'rgba(173,181,189,0.08)' },
  PAID:      { label: 'Commande confirmée',                dot: '#c9a96e', color: '#957d4c',  bg: 'rgba(201,169,110,0.08)' },
  READY:     { label: 'Mis à disposition en boutique',     dot: '#957d4c', color: '#6b5a3e',  bg: 'rgba(149,125,76,0.12)'  },
  COLLECTED: { label: 'Acquisition récupérée',             dot: '#4a3f2f', color: '#4a3f2f',  bg: 'rgba(74,63,47,0.08)'    },
  CANCELLED: { label: 'Annulée',                           dot: '#4a1d1d', color: '#4a1d1d',  bg: 'rgba(74,29,29,0.06)'    },
  REFUNDED:  { label: 'Remboursée',                        dot: '#b8a070', color: '#7a6040',  bg: 'rgba(184,160,112,0.10)' },
}

export type SectionType = 'IMAGE_TEXT' | 'PRODUCT_CTA'

export type TextSide = 'LEFT' | 'RIGHT'

export type LegalType = 'CGV' | 'RGPD' | 'MENTIONS_LEGALES'



// ─── Auth ────────────────────────────────────────────────────────────────────

export type SafeUser = {
  id: number
  email: string
  googleId: string | null
  hasPassword: boolean
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

export type SafeUserWithStats = SafeUser & {
  orderCount: number
  totalSpent: number
}

// ─── CTA Specs ───────────────────────────────────────────────────────────────

export type SpecItem = {
  label: string
  value: string
}

export type SpecSection = {
  title: string
  items?: SpecItem[]
  text?: string
}

export type CtaSpecs = {
  left: SpecSection[]
  right: SpecSection[]
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
  mirrorBackground: boolean
  textSide: TextSide
  title1: string | null
  description1: string | null
  text2: string | null
  desc2: string | null
  text3: string | null
  desc3: string | null
  text4: string | null
  desc4: string | null
  specs: CtaSpecs | null
}

export type Product = {
  id: number
  name: string
  slug: string
  description: string | null
  tagline: string | null
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
  email: string | null
  phone: string | null
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

// ─── Contexts ────────────────────────────────────────────────────────────────

export type LocalCartItem = {
  productId: number
  size: string
  quantity: number
  name: string
  price: string
  imageUrl: string | null
}

export interface AuthContextValue {
  user: SafeUser | null
  isLoading: boolean
  login: (email: string, password: string, onSuccess?: () => Promise<void>) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export interface CartContextValue {
  cart: Cart | null
  localItems: LocalCartItem[]
  itemCount: number
  fetchCart: () => Promise<void>
  addToCart: (productId: number, size: string, quantity: number) => Promise<void>
  updateItem: (itemId: number, quantity: number) => Promise<void>
  removeItem: (itemId: number) => Promise<void>
  clearCart: () => Promise<void>
  addLocalItem: (item: LocalCartItem) => void
  removeLocalItem: (productId: number, size: string) => void
  updateLocalItem: (productId: number, size: string, quantity: number) => void
  clearLocalCart: () => void
  mergeAndClearLocal: () => Promise<void>
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export type AdminOrder = Order & {
  user: SafeUser
}

export type DashboardStats = {
  totalRevenue: number
  orderCountByStatus: Record<OrderStatus, number>
}

// ─── Admin Draft Types ────────────────────────────────────────────────────────
// UI-only types used in the admin product builder (AdminProductFormPage + ProductSectionEditor)
// DraftSection stays local to AdminProductFormPage — it carries UI-only flags (textMode, _imagePreview)
// DraftSize is shared here because ProductSectionEditor receives it as a prop
 
export type DraftSize = {
  // Stable React key — generated with crypto.randomUUID(), never sent to the API
  _draftId: string
  size: string
  stock: number
}

// ─── API Errors ──────────────────────────────────────────────────────────────

export type ApiValidationError = {
  message: string
  details?: { champ: string; message: string }[]
}