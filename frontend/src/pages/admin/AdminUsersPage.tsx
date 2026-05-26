// AdminUsersPage.tsx — Client list for Apilace admin
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type { AxiosError } from 'axios'
import api from '../../lib/axios'
import type { SafeUserWithStats } from '../../types/models.types'
import '../../styles/AdminDashboardPage.css'
import '../../styles/AdminUsersPage.css'

// ─── Constants ───────────────────────────────────────────────────────────────

const LIMIT = 6

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDisplayName(user: SafeUserWithStats): string {
  if (user.firstName && user.lastName) return `${user.firstName}.${user.lastName[0]}`
  if (user.firstName) return user.firstName
  return user.email
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<SafeUserWithStats[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const totalPages = Math.ceil(total / LIMIT)

  useEffect(() => { setPage(1) }, [search, roleFilter])

  const fetchUsers = useCallback(() => {
    if (isInitialLoad) setIsInitialLoad(true)
    else setIsFetching(true)

    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)

    api.get<{ data: SafeUserWithStats[]; pagination: { total: number } }>(`/admin/users?${params}`)
      .then(res => { setUsers(res.data.data); setTotal(res.data.pagination.total) })
      .catch(console.error)
      .finally(() => { setIsInitialLoad(false); setIsFetching(false) })
  }, [page, search, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleRoleChange(user: SafeUserWithStats, newRole: 'MEMBER' | 'ADMIN') {
    setActionError(null)
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      setActionError(axiosError.response?.data?.message ?? 'Erreur lors du changement de rôle.')
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isInitialLoad) {
    return (
      <>
        <div style={{ height: '115px' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px' }}>
          <div className="admin-users-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                height: '220px',
                background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
              }} />
            ))}
          </div>
        </div>
      </>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ height: '115px' }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0px 40px 80px' }}>

        <h1 style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '3rem', fontWeight: 400,
          textAlign: 'center', color: '#212529', marginBottom: '48px',
        }}>
          Ma clientèle
        </h1>

        {/* ── Search + filter ── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <i className="fa-solid fa-magnifying-glass" style={{
              position: 'absolute', left: '14px', top: '50%',
              transform: 'translateY(-50%)', color: '#adb5bd',
              fontSize: '0.8rem', pointerEvents: 'none',
            }} />
            <input
              className="admin-search-input"
              type="text"
              placeholder="Rechercher un client par nom, mail..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <select
            className="admin-filter-select"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="MEMBER">Membres</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {actionError && (
          <p style={{
            fontFamily: 'CenturySchoolbook, serif', fontSize: '0.85rem',
            color: '#212529', background: 'rgba(33,37,41,0.05)',
            padding: '10px 16px', marginBottom: '16px',
          }}>
            {actionError}
          </p>
        )}

        {/* ── Grid ── */}
        <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {users.length === 0 ? (
            <p style={{ textAlign: 'center', fontFamily: 'CenturySchoolbook, serif', color: '#6c757d' }}>
              Aucun client trouvé.
            </p>
          ) : (
            <div className="admin-users-grid">
              {users.map(user => (
                <div key={user.id} className="admin-user-card">

                  {/* Name */}
                  <p className="admin-user-card-name">{formatDisplayName(user)}</p>

                  <div className="admin-user-card-separator" />

                  {/* Member since */}
                  <p className="admin-user-card-meta">
                    Membre depuis le {formatDate(user.createdAt)}
                  </p>

                  {/* Role select */}
                  <select
                    className="admin-user-role-select"
                    value={user.role}
                    onChange={e => handleRoleChange(user, e.target.value as 'MEMBER' | 'ADMIN')}
                  >
                    <option value="MEMBER">Membre</option>
                    <option value="ADMIN">Admin</option>
                  </select>

                  <div className="admin-user-card-separator" />

                  {/* Stats */}
                  <p className="admin-user-card-meta">
                    {user.orderCount} commande{user.orderCount !== 1 ? 's' : ''}
                  </p>
                  <p className="admin-user-card-meta">
                    Total : <strong>{formatPrice(user.totalSpent)} TTC</strong>
                  </p>

                  {/* CTA */}
                  <Link
                    to={`/admin/utilisateurs/${user.id}`}
                    className="admin-user-card-btn"
                  >
                    Voir le profil client
                  </Link>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '40px', flexWrap: 'wrap' }}>
            <button className="admin-pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`admin-pagination-btn${page === n ? ' admin-pagination-btn--active' : ''}`}
                onClick={() => setPage(n)}
              >{n}</button>
            ))}
            <button className="admin-pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
          </div>
        )}

      </div>
    </>
  )
}