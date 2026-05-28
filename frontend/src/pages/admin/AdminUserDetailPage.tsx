// AdminUserDetailPage.tsx — Admin view of a single user profile for Apilace
// Layout mirrors AccountPage — always-editable profile, role, auth, order history, deactivation

import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import api from '../../lib/axios'
import type { SafeUser, OrderStatus } from '../../types/models.types'
import StatusBadge from '../../components/StatusBadge'
import '../../styles/AdminUserDetailPage.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type UserOrder = {
  id: number
  status: OrderStatus
  totalAmount: string
  createdAt: string
  store: { name: string }
  items: Array<{
    id: number
    product: { name: string; images: Array<{ url: string }> }
  }>
}

type AdminUserDetail = SafeUser & { orders: UserOrder[] }

type ProfileForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  postalCode: string
  city: string
}

type ApiValidationError = {
  message: string
  details?: { champ: string; message: string }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatPrice(amount: string | number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(Number(amount))
}

function getDisplayName(user: AdminUserDetail): string {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  return user.email
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p style={{
      fontFamily: 'CenturySchoolbook, serif',
      fontSize: '0.78rem', color: '#842029', marginTop: '4px',
    }}>
      {message}
    </p>
  )
}

function Separator() {
  return (
    <div style={{
      height: '1px',
      background: 'linear-gradient(to right, #ffffff, rgba(33,37,41,0.15) 50%, #ffffff)',
      margin: '48px auto', maxWidth: '800px',
    }} />
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // ─── Profile form state ───────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
  })
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({})
  const [profileGlobalError, setProfileGlobalError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // ─── Role state ───────────────────────────────────────────────────────────
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [roleError, setRoleError] = useState<string | null>(null)

  // ─── Deactivate modal state ───────────────────────────────────────────────
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [hasConfirmedDeactivate, setHasConfirmedDeactivate] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)

  // ─── Fetch user ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return
    api.get<AdminUserDetail>(`/admin/users/${id}`)
      .then(res => {
        setUser(res.data)
        setProfileForm({
          firstName: res.data.firstName ?? '',
          lastName: res.data.lastName ?? '',
          email: res.data.email,
          phone: res.data.phone ?? '',
          address: res.data.address ?? '',
          postalCode: res.data.postalCode ?? '',
          city: res.data.city ?? '',
        })
      })
      .catch(() => setFetchError('Utilisateur introuvable.'))
      .finally(() => setIsLoading(false))
  }, [id])

  // ─── Profile handlers ─────────────────────────────────────────────────────

  function clearFieldError(champ: string) {
    setProfileFieldErrors(prev => {
      if (!prev[champ]) return prev
      const next = { ...prev }
      delete next[champ]
      return next
    })
  }

  async function handleProfileSubmit() {
    if (!draft_email_valid()) return
    setIsSavingProfile(true)
    setProfileGlobalError(null)
    setProfileFieldErrors({})

    try {
      const payload = {
        firstName: profileForm.firstName || undefined,
        lastName: profileForm.lastName || undefined,
        email: profileForm.email.trim() || undefined,
        phone: profileForm.phone || null,
        address: profileForm.address || null,
        postalCode: profileForm.postalCode || null,
        city: profileForm.city || null,
      }
      const res = await api.patch<SafeUser>(`/admin/users/${id}`, payload)
      setUser(prev => prev ? { ...prev, ...res.data } : prev)
      setProfileForm({
        firstName: res.data.firstName ?? '',
        lastName: res.data.lastName ?? '',
        email: res.data.email,
        phone: res.data.phone ?? '',
        address: res.data.address ?? '',
        postalCode: res.data.postalCode ?? '',
        city: res.data.city ?? '',
      })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (error) {
      const axiosError = error as AxiosError<ApiValidationError>
      const details = axiosError.response?.data?.details
      if (details?.length) {
        const errors: Record<string, string> = {}
        for (const { champ, message } of details) errors[champ] = message
        setProfileFieldErrors(errors)
      } else {
        setProfileGlobalError(axiosError.response?.data?.message ?? 'Une erreur est survenue.')
      }
    } finally {
      setIsSavingProfile(false)
    }
  }

  function draft_email_valid(): boolean {
    if (!profileForm.email.trim()) {
      setProfileFieldErrors({ email: "L'adresse email ne peut pas être vide." })
      return false
    }
    return true
  }

  // ─── Role handler ─────────────────────────────────────────────────────────

  async function handleRoleChange(newRole: 'MEMBER' | 'ADMIN') {
    if (!user) return
    setIsChangingRole(true)
    setRoleError(null)
    try {
      const { data } = await api.patch<SafeUser>(`/admin/users/${id}/role`, { role: newRole })
      setUser(prev => prev ? { ...prev, ...data } : prev)
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      setRoleError(axiosError.response?.data?.message ?? 'Erreur lors du changement de rôle.')
    } finally {
      setIsChangingRole(false)
    }
  }

  // ─── Deactivate handler ───────────────────────────────────────────────────

  async function handleDeactivate() {
    if (!user) return
    setIsDeactivating(true)
    setDeactivateError(null)
    try {
      await api.delete(`/admin/users/${id}`)
      navigate('/admin/utilisateurs')
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      setDeactivateError(axiosError.response?.data?.message ?? 'Erreur lors de la désactivation.')
    } finally {
      setIsDeactivating(false)
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <div style={{ height: '115px' }} />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              height: '52px', marginBottom: '14px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
            }} />
          ))}
        </div>
      </>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────────

  if (fetchError || !user) {
    return (
      <>
        <div style={{ height: '115px' }} />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'CenturySchoolbook, serif', color: '#6c757d', marginBottom: '24px' }}>
            {fetchError ?? 'Utilisateur introuvable.'}
          </p>
          <Link to="/admin/utilisateurs" className="admin-btn-secondary">
            ← Retour à Ma clientèle
          </Link>
        </div>
      </>
    )
  }

  // ─── Derived ─────────────────────────────────────────────────────────────

  const totalSpent = user.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ height: '115px' }} />

      <div style={{ padding: '0 24px 80px' }}>

        {/* ── Back ── */}
        <div style={{ maxWidth: '800px', margin: '0 auto 40px' }}>
          <Link to="/admin/utilisateurs" className="admin-btn-secondary">
            ← Retour à Ma clientèle
          </Link>
        </div>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '3rem', fontWeight: 400, color: '#212529',
            marginBottom: '8px',
          }}>
            {getDisplayName(user)}
          </h1>
          <span
  className={`admin-user-role-badge admin-user-role-badge--${user.role.toLowerCase()} admin-user-role-badge--toggle`}
  onClick={() => !isChangingRole && handleRoleChange(user.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}
  title={user.role === 'ADMIN' ? 'Cliquer pour passer en Membre' : 'Cliquer pour passer en Administrateur'}
  style={{ cursor: isChangingRole ? 'wait' : 'pointer' }}
>
  {isChangingRole ? '…' : (user.role === 'ADMIN' ? 'Administrateur' : 'Membre')}
</span>
{roleError && (
  <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.8rem', color: '#842029', marginTop: '6px' }}>
    {roleError}
  </p>
)}
          <p style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '0.85rem', color: '#adb5bd', marginTop: '8px',
          }}>
            Membre depuis le {formatDate(user.createdAt)}
          </p>
        </div>

        {/* ══ SECTION 1 — Profil ══ */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 className="admin-user-section-title">Profil</h2>

          {profileSuccess && (
            <p className="admin-user-success-msg">Profil mis à jour ✓</p>
          )}
          {profileGlobalError && (
            <p style={{
              fontFamily: 'CenturySchoolbook, serif',
              fontSize: '0.875rem', color: '#842029',
              marginBottom: '16px', textAlign: 'center',
            }}>
              {profileGlobalError}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>

            {/* Email — editable by admin */}
            <div>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => { setProfileForm(p => ({ ...p, email: e.target.value })); clearFieldError('email') }}
                placeholder="Email"
                className="login-modal-input"
                style={{ borderColor: profileFieldErrors.email ? '#842029' : undefined }}
              />
              <FieldError message={profileFieldErrors.email} />
            </div>

            {/* Prénom + Nom */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={e => { setProfileForm(p => ({ ...p, firstName: e.target.value })); clearFieldError('firstName') }}
                  placeholder="Prénom"
                  className="login-modal-input"
                  style={{ borderColor: profileFieldErrors.firstName ? '#842029' : undefined }}
                />
                <FieldError message={profileFieldErrors.firstName} />
              </div>
              <div>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={e => { setProfileForm(p => ({ ...p, lastName: e.target.value })); clearFieldError('lastName') }}
                  placeholder="Nom"
                  className="login-modal-input"
                  style={{ borderColor: profileFieldErrors.lastName ? '#842029' : undefined }}
                />
                <FieldError message={profileFieldErrors.lastName} />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="Téléphone"
                className="login-modal-input"
              />
            </div>

            {/* Adresse */}
            <div>
              <input
                type="text"
                value={profileForm.address}
                onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))}
                placeholder="Adresse"
                className="login-modal-input"
              />
            </div>

            {/* Code postal + Ville */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <input
                  type="text"
                  value={profileForm.postalCode}
                  onChange={e => setProfileForm(p => ({ ...p, postalCode: e.target.value }))}
                  placeholder="Code postal"
                  className="login-modal-input"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="Ville"
                  className="login-modal-input"
                />
              </div>
            </div>

          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              className="login-modal-btn"
              onClick={handleProfileSubmit}
              disabled={isSavingProfile}
            >
              Enregistrer les modifications
            </button>
          </div>
        </div>

        <Separator />

        {/* ══ SECTION 2 — Compte ══ */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 className="admin-user-section-title">Compte</h2>

          {/* Auth type */}
          <p style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '0.85rem', color: '#6c757d',
            textAlign: 'center', marginBottom: '12px',
          }}>
            Authentification
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
            {user.hasPassword && (
              <span className="admin-user-auth-badge">
                <i className="fa-solid fa-lock" />
                Email
              </span>
            )}
            {user.googleId && (
              <span className="admin-user-auth-badge">
                <i className="fa-brands fa-google" />
                Google
              </span>
            )}
          </div>

        </div>

        <Separator />

        {/* ══ SECTION 3 — Historique des commandes ══ */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 className="admin-user-section-title">Historique des commandes</h2>
          <p className="admin-user-section-meta">
            {user.orders.length} commande{user.orders.length !== 1 ? 's' : ''} · {formatPrice(totalSpent)} TTC
          </p>

          {user.orders.length === 0 ? (
            <p style={{
              fontFamily: 'CenturySchoolbook, serif',
              color: '#adb5bd', fontSize: '0.9rem', textAlign: 'center',
            }}>
              Aucune commande pour ce client.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {user.orders.map(order => {
                const firstItem = order.items[0]
                const imgUrl = firstItem?.product?.images?.[0]?.url ?? null
                const name = firstItem?.product?.name ?? '—'
                return (
                  <Link
                    key={order.id}
                    to={`/admin/commandes/${order.id}`}
                    className="admin-user-order-card"
                  >
                    <div style={{
                      width: '60px', height: '60px', flexShrink: 0,
                      background: '#f0ede8', overflow: 'hidden',
                    }}>
                      {imgUrl
                        ? <img src={imgUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-regular fa-image" style={{ color: '#adb5bd' }} />
                        </div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: 'CenturySchoolbook, serif',
                        fontWeight: 600, fontSize: '0.95rem', color: '#212529', marginBottom: '2px',
                      }}>
                        {name}
                      </p>
                      <p style={{
                        fontFamily: 'CenturySchoolbook, serif',
                        fontSize: '0.8rem', color: '#adb5bd',
                      }}>
                        Commande #{order.id} — {order.store.name} — {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{
                        fontFamily: 'CenturySchoolbook, serif',
                        fontWeight: 700, color: '#957d4c', fontSize: '0.95rem', marginBottom: '6px',
                      }}>
                        {formatPrice(order.totalAmount)}
                      </p>
                      <StatusBadge status={order.status} />
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ color: '#adb5bd', fontSize: '0.75rem', flexShrink: 0 }} />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* ══ SECTION 4 — Désactivation ══ */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 className="admin-user-section-title">Désactivation du compte</h2>
          <div className="admin-user-danger-zone">
            <p style={{
              fontFamily: 'CenturySchoolbook, serif',
              fontSize: '0.75rem', textAlign: 'center', color: '#6c757d',
              lineHeight: 1.6, marginBottom: '16px',
            }}>
              En désactivant ce compte, le client ne pourra plus se connecter. Conformément aux
              obligations légales et comptables, l'historique des commandes sera conservé.
              Les tokens de session actifs seront immédiatement invalidés.
            </p>
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="admin-user-deactivate-btn"
                onClick={() => { setShowDeactivateModal(true); setHasConfirmedDeactivate(false); setDeactivateError(null) }}
              >
                Désactiver le compte
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── Modal : Deactivate ── */}
      <div
        className={`cart-modal-overlay${showDeactivateModal ? ' cart-modal-overlay--open' : ''}`}
        onClick={() => !isDeactivating && setShowDeactivateModal(false)}
      />
      <div className={`cart-modal${showDeactivateModal ? ' cart-modal--open' : ''}`}>
        <button className="cart-modal-close" onClick={() => setShowDeactivateModal(false)}>
          <i className="fa-solid fa-xmark" />
        </button>
        <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '1.1rem', color: '#212529', marginBottom: '16px' }}>
          Désactiver ce compte ?
        </p>
        <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.9rem', color: '#6c757d', lineHeight: 1.6, marginBottom: '16px' }}>
          Le compte de <strong>{getDisplayName(user)}</strong> sera désactivé. Le client ne pourra plus se connecter.
        </p>
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          fontFamily: 'CenturySchoolbook, serif', fontSize: '0.9rem', color: '#212529',
          cursor: 'pointer', marginBottom: '8px',
        }}>
          <input
            type="checkbox"
            checked={hasConfirmedDeactivate}
            onChange={e => setHasConfirmedDeactivate(e.target.checked)}
            style={{ marginTop: '3px', accentColor: '#842029' }}
          />
          <span>Je confirme la désactivation de ce compte.</span>
        </label>
        {deactivateError && (
          <p style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '0.85rem', color: '#842029',
            background: '#f8d7da', padding: '10px 14px', marginTop: '12px',
          }}>
            {deactivateError}
          </p>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            className="login-modal-btn login-modal-btn--outline"
            style={{ width: 'auto', padding: '10px 20px' }}
            onClick={() => setShowDeactivateModal(false)}
            disabled={isDeactivating}
          >
            Annuler
          </button>
          <button
            className="login-modal-btn"
            style={{
              background: hasConfirmedDeactivate ? '#212529' : '#adb5bd',
              width: 'auto', padding: '10px 20px',
            }}
            onClick={handleDeactivate}
            disabled={!hasConfirmedDeactivate || isDeactivating}
          >
            {isDeactivating ? 'Désactivation...' : 'Désactiver le compte'}
          </button>
        </div>
      </div>
    </>
  )
}
