// ShopPage.tsx — Editorial full-width product listing with infinite scroll
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import type { Product, ProductImage, ProductSize } from '../types/models.types'

type ShopProduct = Product & {
  images: ProductImage[]
  sizes: ProductSize[]
}

const PAGE_LIMIT = 4

function ShopSkeleton() {
  return <div className="shop-skeleton" aria-hidden="true" />
}

export default function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pageRef = useRef(1)
  const hasMoreRef = useRef(true)
  const loadingRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { user } = useAuth()

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return
    loadingRef.current = true
    setIsLoading(true)

    try {
      const { data } = await api.get(`/products?page=${pageRef.current}&limit=${PAGE_LIMIT}`)
      setProducts(prev => [...prev, ...data.data])
      hasMoreRef.current = pageRef.current < data.pagination.totalPages
      pageRef.current += 1
    } catch {
      setError('Impossible de charger les produits.')
    } finally {
      loadingRef.current = false
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadMore()
  }, [loadMore])

  // Infinite scroll — triggers loadMore 300px before sentinel is visible
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '300px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div style={{ marginTop: '-45px' }}>
      {products.map(product => {
        const imageUrl = product.images[0]?.url ?? null

        return (
          <div key={product.id} className="shop-item">
            <Link to={`/boutique/${product.slug}`} style={{ display: 'block' }}>
              {imageUrl ? (
                <img src={imageUrl} alt={product.name} className="shop-item-img" />
              ) : (
                <div className="shop-item-img" style={{ background: '#f0ede8' }} />
              )}
              <div className="shop-item-overlay">
                <div className="shop-item-overlay-text">
                  <p style={{
                    fontFamily: 'CenturySchoolbook, serif',
                    fontSize: '2rem',
                    fontWeight: 400,
                    letterSpacing: '3px',
                    marginBottom: '10px',
                  }}>
                    {product.name}
                  </p>
                  {product.tagline && (
                    <p style={{
                      fontFamily: 'CenturySchoolbook, serif',
                      fontSize: '1rem',
                      fontWeight: 300,
                      opacity: 0.85,
                      letterSpacing: '1px',
                    }}>
                      {product.tagline}
                    </p>
                  )}
                </div>
              </div>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link
                to={`/admin/produits/${product.id}/modifier`}
                className="shop-item-edit"
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: '#957d4c',
                  color: '#ffffff',
                  padding: '8px 20px',
                  fontFamily: 'CenturySchoolbook, serif',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  letterSpacing: '1px',
                }}
              >
                Éditer
              </Link>
            )}
          </div>
        )
      })}

      {isLoading && (
        <>
          <ShopSkeleton />
          <ShopSkeleton />
        </>
      )}

      {error && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          fontFamily: 'CenturySchoolbook, serif',
          color: '#842029',
        }}>
          {error}
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '8rem 2rem',
          fontFamily: 'CenturySchoolbook, serif',
          color: '#6c757d',
          fontSize: '1.1rem',
          letterSpacing: '1px',
        }}>
          Aucun produit disponible pour le moment.
        </div>
      )}

      <div ref={sentinelRef} style={{ height: 0 }} />
    </div>
  )
}
