// CartContext.tsx — Manages cart state for Apilace
// Visitors: cart stored in localStorage only
// Members: cart stored in BDD, synced via API
// On login: localStorage cart is merged into BDD cart via POST /api/cart/merge

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import api from '../lib/axios'
import type { Cart, LocalCartItem, CartContextValue } from '../types/models.types'

const CART_STORAGE_KEY = 'apilace_cart'

function getLocalCart(): LocalCartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveLocalCart(items: LocalCartItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [localItems, setLocalItems] = useState<LocalCartItem[]>(getLocalCart)

  // Persist local cart to localStorage on every change
  useEffect(() => {
    saveLocalCart(localItems)
  }, [localItems])

  // Total items count — used by Navbar badge
  const itemCount = cart
    ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
    : localItems.reduce((sum, item) => sum + item.quantity, 0)

  async function fetchCart(): Promise<void> {
    const res = await api.get<Cart>('/cart')
    setCart(res.data)
  }

  async function addToCart(productId: number, size: string, quantity: number): Promise<void> {
    const res = await api.post<Cart>('/cart', { productId, size, quantity })
    setCart(res.data)
  }

  async function updateItem(itemId: number, quantity: number): Promise<void> {
    const res = await api.patch<Cart>(`/cart/items/${itemId}`, { quantity })
    setCart(res.data)
  }

  async function removeItem(itemId: number): Promise<void> {
    const res = await api.delete<Cart>(`/cart/items/${itemId}`)
    setCart(res.data)
  }

  async function clearCart(): Promise<void> {
    await api.delete('/cart')
    setCart(null)
  }

  // Visitor actions — localStorage only
  function addLocalItem(item: LocalCartItem): void {
    setLocalItems(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.size === item.size)
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId && i.size === item.size
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
  }

  function removeLocalItem(productId: number, size: string): void {
    setLocalItems(prev => prev.filter(i => !(i.productId === productId && i.size === size)))
  }

  function updateLocalItem(productId: number, size: string, quantity: number): void {
    setLocalItems(prev =>
      prev.map(i =>
        i.productId === productId && i.size === size ? { ...i, quantity } : i
      )
    )
  }

  function clearLocalCart(): void {
    setLocalItems([])
  }

  // Called by AuthContext.login() — sends localStorage cart to BDD then clears it
  async function mergeAndClearLocal(): Promise<void> {
    if (localItems.length === 0) {
      await fetchCart()
      return
    }

    await api.post('/cart/merge', {
      items: localItems.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
    })

    clearLocalCart()
    await fetchCart()
  }

  return (
    <CartContext.Provider value={{
      cart,
      localItems,
      itemCount,
      fetchCart,
      addToCart,
      updateItem,
      removeItem,
      clearCart,
      addLocalItem,
      removeLocalItem,
      updateLocalItem,
      clearLocalCart,
      mergeAndClearLocal,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}