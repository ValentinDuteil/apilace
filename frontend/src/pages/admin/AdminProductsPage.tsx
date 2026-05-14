import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import '../../styles/AdminProductsPage.css'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminProduct {
  id: number
  name: string
  slug: string
  price: string
  isActive: boolean
  images: { url: string; isPrimary: boolean }[]
  sizes: { size: string; stock: number }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPrimaryImage(images: AdminProduct['images']): string | null {
  return images.find(i => i.isPrimary)?.url ?? images[0]?.url ?? null
}

function getTotalStock(sizes: AdminProduct['sizes']): number {
  return sizes.reduce((acc, s) => acc + s.stock, 0)
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<AdminProduct[]>('/admin/products')
      .then(({ data }) => setProducts(data))
      .catch(() => setError('Impossible de charger les produits.'))
      .finally(() => setIsLoading(false))
  }, [])

  // ─── Toggle isActive ───────────────────────────────────────────────────────
  async function handleToggle(id: number) {
    setTogglingId(id)
    try {
      const { data } = await api.patch<AdminProduct>(`/admin/products/${id}/toggle`)
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: data.isActive } : p))
    } catch {
      setError('Erreur lors du changement de statut.')
    } finally {
      setTogglingId(null)
    }
  }

  // ─── Filtered list ─────────────────────────────────────────────────────────
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  )

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="ap-products">

      <div className="ap-products__header">
        <h1 className="ap-products__title">Produits</h1>
        <Link to="/admin/produits/nouveau" className="admin-btn-primary">
          <i className="fa-solid fa-plus" style={{ marginRight: '8px' }} />
          Nouveau produit
        </Link>
      </div>

      <div className="ap-products__search-wrap">
        <i className="fa-solid fa-magnifying-glass ap-products__search-icon" />
        <input
          className="ap-products__search"
          type="text"
          placeholder="Rechercher par nom ou slug…"
          value={search}
          onChange={e => { setSearch(e.target.value); setError(null) }}
        />
      </div>

      {error && (
        <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.88rem', color: '#4a1d1d', marginBottom: '16px' }}>
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="ap-products__list">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ap-products__skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="ap-products__empty">
          {search ? 'Aucun produit ne correspond à la recherche.' : 'Aucun produit pour l\'instant.'}
        </p>
      ) : (
        <div className="ap-products__list">
          {filtered.map(product => {
            const img = getPrimaryImage(product.images)
            const stock = getTotalStock(product.sizes)
            return (
              <div key={product.id} className="ap-products__row">

                {/* Thumbnail */}
                <div className="ap-products__img-wrap">
                  {img
                    ? <img src={img} alt={product.name} className="ap-products__img" />
                    : <div className="ap-products__img-placeholder"><i className="fa-regular fa-image" /></div>
                  }
                </div>

                {/* Name + slug */}
                <div className="ap-products__info">
                  <span className="ap-products__name">{product.name}</span>
                  <span className="ap-products__slug">/{product.slug}</span>
                </div>

                {/* Price */}
                <div className="ap-products__price">
                  {Number(product.price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>

                {/* Stock */}
                <div className="ap-products__stock" style={{ color: stock === 0 ? '#4a1d1d' : '#6c757d' }}>
                  {stock} en stock
                </div>

                {/* isActive toggle */}
                <button
                  className={`ap-products__toggle${product.isActive ? ' ap-products__toggle--on' : ''}`}
                  onClick={() => handleToggle(product.id)}
                  disabled={togglingId === product.id}
                  title={product.isActive ? 'Désactiver' : 'Activer'}
                >
                  <span className="ap-products__toggle-thumb" />
                </button>

                {/* Edit link */}
                <Link
                  to={`/admin/produits/${product.id}/modifier`}
                  className="admin-btn-secondary ap-products__edit-btn"
                >
                  <i className="fa-solid fa-pen" style={{ marginRight: '6px' }} />
                  Modifier
                </Link>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}