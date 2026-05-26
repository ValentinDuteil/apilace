// AdminDashboardPage.tsx — Admin dashboard for Apilace
// Shows total revenue (shop only) and paginated/searchable order list

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import { STATUS_CONFIG } from '../../types/models.types'
import type { AdminOrder, DashboardStats, OrderStatus, Store } from '../../types/models.types'
import '../../styles/AdminDashboardPage.css'
import type { AxiosError } from 'axios'

// ─── Constants ───────────────────────────────────────────────────────────────

const LIMIT = 10

// Only forward transitions — no backwards, no terminal states
const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID: ['READY'],
  READY: ['COLLECTED'],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(amount: string | number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function getClientName(order: AdminOrder): string {
  const { firstName, lastName } = order.user
  if (firstName && lastName) return `${firstName} ${lastName[0]}.`
  if (firstName) return firstName
  return order.user.email
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const totalPages = Math.ceil(total / LIMIT)

  // Fetch dashboard stats
  useEffect(() => {
    api.get<DashboardStats>('/admin/dashboard')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setIsLoadingStats(false))
  }, [])

  // Fetch stores for filter dropdown
  useEffect(() => {
    api.get<Store[]>('/stores')
      .then(res => setStores(res.data))
      .catch(console.error)
  }, [])

  // Fetch orders
  const fetchOrders = useCallback(() => {
    setIsLoadingOrders(true)
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (storeFilter) params.set('storeId', storeFilter)

    api.get<{ data: AdminOrder[]; pagination: { total: number } }>(`/admin/orders?${params}`)
      .then(res => {
        setOrders(res.data.data)
        setTotal(res.data.pagination.total)
      })
      .catch(console.error)
      .finally(() => setIsLoadingOrders(false))
  }, [page, search, statusFilter, storeFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [search, statusFilter, storeFilter])

  // Debounce search input — 400ms
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Quick status update from the dashboard card
  async function handleStatusChange(orderId: number, newStatus: OrderStatus) {
    setUpdatingOrderId(orderId)
    setStatusError(null)
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus })
      // Optimistic update — reflect change immediately
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      // Refresh stats (order moved status → revenue may have changed)
      api.get<DashboardStats>('/admin/dashboard')
        .then(res => setStats(res.data))
        .catch(console.error)
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      setStatusError(axiosError.response?.data?.message ?? 'Erreur lors de la mise à jour du statut')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ height: '115px' }} />

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0px 40px 80px' }}>

        {/* ── Page title ── */}
        <h1 style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '3rem',
          fontWeight: 400,
          textAlign: 'center',
          color: '#212529',
          marginBottom: '48px',
        }}>
          Tableau de bord
        </h1>

        {/* ── Revenue card ── */}
        <div style={{
          maxWidth: '520px',
          margin: '0 auto 64px',
          background: '#f8f9fa',
          border: '1px solid rgba(33, 37, 41, 0.10)',
          padding: '40px',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '0.8rem',
            color: '#6c757d',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Total des recettes
          </p>

          {isLoadingStats ? (
            <div style={{
              height: '52px',
              background: 'linear-gradient(90deg, #e9e9e9 25%, #f5f5f5 50%, #e9e9e9 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }} />
          ) : (
            <p style={{
              fontFamily: 'CenturySchoolbook, serif',
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#212529',
            }}>
              {formatPrice(stats?.totalRevenue ?? 0)}
            </p>
          )}

          <p style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '0.75rem',
            color: '#adb5bd',
            fontStyle: 'italic',
            marginTop: '12px',
            lineHeight: 1.5,
          }}>
            Valeur totale des réservations confirmées via la boutique en ligne
            <br />(statuts : Payé, Prêt, Retiré — hors CA boutique physique)
          </p>
        </div>

        {/* ── Orders section ── */}
        <h2 style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '1.75rem',
          fontWeight: 400,
          textAlign: 'center',
          color: '#212529',
          marginBottom: '32px',
        }}>
          Dernières commandes
        </h2>

        {/* Status error (inline, non-blocking) */}
        {statusError && (
          <p style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '0.85rem',
            color: '#212529',
            background: 'rgba(33,37,41,0.05)',
            padding: '10px 16px',
            marginBottom: '16px',
          }}>
            {statusError}
          </p>
        )}

        {/* ── Search + filters ── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd', fontSize: '0.8rem', pointerEvents: 'none' }}
            />
            <input
              className="admin-search-input"
              type="text"
              placeholder="Rechercher par nom ou n° de commande..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Par statut</option>
            {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>

          {/* Store filter */}
          <select
            className="admin-filter-select"
            value={storeFilter}
            onChange={e => setStoreFilter(e.target.value)}
          >
            <option value="">Par magasin</option>
            {stores.map(s => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* ── Orders list ── */}
        {isLoadingOrders ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                height: '100px',
                background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                border: '1px solid rgba(33,37,41,0.07)',
              }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p style={{
            textAlign: 'center',
            fontFamily: 'CenturySchoolbook, serif',
            color: '#6c757d',
            padding: '48px 0',
          }}>
            Aucune commande trouvée.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orders.map(order => {
              const firstItem = order.items[0]
              const imgUrl = firstItem?.product?.images?.[0]?.url ?? null
              const productName = firstItem?.product?.name ?? '—'
              const productSlug = firstItem?.product?.slug ?? ''
              const validNext = VALID_TRANSITIONS[order.status]

              return (
                <div key={order.id} className="admin-order-card">

                  {/* Product image */}
                  <div style={{
                    width: '80px', height: '80px', flexShrink: 0,
                    background: '#f0ede8', overflow: 'hidden',
                  }}>
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={productName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-regular fa-image" style={{ color: '#adb5bd', fontSize: '1.4rem' }} />
                      </div>
                    )}
                  </div>

                  {/* Order info */}
                  <div className="admin-order-card-info" style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'CenturySchoolbook, serif', fontWeight: 600, fontSize: '0.95rem', color: '#212529', marginBottom: '3px' }}>
                      {getClientName(order)}
                    </p>
                    <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.85rem', color: '#6c757d', marginBottom: '3px' }}>
                      {productName}
                    </p>
                    <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.78rem', color: '#adb5bd', marginBottom: '2px' }}>
                      Commande #{order.id} — {formatDate(order.createdAt)}
                    </p>
                    <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.78rem', color: '#adb5bd' }}>
                      <i className="fa-solid fa-location-dot" style={{ marginRight: '5px' }} />
                      {order.store.name}
                    </p>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '1rem', fontWeight: 700, color: '#957d4c' }}>
                      {formatPrice(order.totalAmount)}
                    </p>
                    <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.75rem', color: '#adb5bd', marginTop: '2px' }}>
                      Acompte : {formatPrice(Number(order.totalAmount) * 0.3)}
                    </p>
                  </div>

                  {/* Status + actions */}
                  <div className="admin-order-card-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>

                    {/* Status — select if transition possible, badge otherwise */}
                    {validNext && validNext.length > 0 ? (
                      <select
                        className="admin-status-select"
                        value={order.status}
                        disabled={updatingOrderId === order.id}
                        onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        style={{ background: STATUS_CONFIG[order.status].bg, color: STATUS_CONFIG[order.status].color }}
                      >
                        <option value={order.status}>{STATUS_CONFIG[order.status].label}</option>
                        {validNext.map(s => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{
                        background: STATUS_CONFIG[order.status].bg,
                        color: STATUS_CONFIG[order.status].color,
                        fontFamily: 'CenturySchoolbook, serif',
                        fontSize: '0.8rem', padding: '6px 10px', display: 'inline-block',
                      }}>
                        {STATUS_CONFIG[order.status].label}
                      </span>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {productSlug && (
                        <Link to={`/boutique/${productSlug}`} className="admin-btn-secondary">
                          Voir le produit
                        </Link>
                      )}
                      <Link to={`/admin/commandes/${order.id}`} className="admin-btn-primary">
                        Voir la fiche
                      </Link>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '40px', flexWrap: 'wrap' }}>
            <button
              className="admin-pagination-btn"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`admin-pagination-btn${page === n ? ' admin-pagination-btn--active' : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              className="admin-pagination-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >
              ›
            </button>
          </div>
        )}

      </div>
    </>
  )
}