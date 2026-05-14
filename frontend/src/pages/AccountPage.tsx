// AccountPage.tsx — Member account page for Apilace
// Profile editing, password change, order history, account deletion

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { AxiosError } from 'axios'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import { STATUS_CONFIG } from '../types/models.types'
import type { Order, ApiValidationError } from '../types/models.types'
import '../styles/AccountPage.css'

// ─── Constants ───────────────────────────────────────────────────────────────

const PASSWORD_RULES = [
  { label: '8 caractères minimum', test: (v: string) => v.length >= 8 },
  { label: 'Une majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Un chiffre', test: (v: string) => /[0-9]/.test(v) },
  { label: 'Un caractère spécial', test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(amount: string | number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(Number(amount))
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

export default function AccountPage() {
  const { user, logout, refreshUser } = useAuth()

  // ── Profile state ──
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    postalCode: user?.postalCode ?? '',
    city: user?.city ?? '',
  })
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({})
  const [profileGlobalError, setProfileGlobalError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // ── Password state ──
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' })
  const [pwdFieldErrors, setPwdFieldErrors] = useState<Record<string, string>>({})
  const [pwdGlobalError, setPwdGlobalError] = useState<string | null>(null)
  const [pwdSuccess, setPwdSuccess] = useState(false)
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false)
  const [showPwdRules, setShowPwdRules] = useState(false)

  // ── Orders state ──
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)

  // ── Delete state ──
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const newPasswordValid = PASSWORD_RULES.every(r => r.test(pwdForm.newPassword))
  const passwordsMatch = pwdForm.confirmNewPassword === '' || pwdForm.newPassword === pwdForm.confirmNewPassword

  // Sync profile form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
        postalCode: user.postalCode ?? '',
        city: user.city ?? '',
      })
    }
  }, [user])

  // Fetch orders on mount
  useEffect(() => {
    api.get<Order[]>('/orders')
      .then(res => setOrders(res.data))
      .catch(console.error)
      .finally(() => setIsLoadingOrders(false))
  }, [])

  // ── Profile handlers ──────────────────────────────────────────────────────

  function clearProfileFieldError(champ: string) {
    setProfileFieldErrors(prev => {
      if (!prev[champ]) return prev
      const next = { ...prev }
      delete next[champ]
      return next
    })
  }

  async function handleProfileSubmit() {
    setIsUpdatingProfile(true)
    setProfileGlobalError(null)
    setProfileFieldErrors({})
    try {
      await api.patch('/auth/me', profileForm)
      await refreshUser()
      setShowProfileModal(false)
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
      setShowProfileModal(false)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // ── Password handlers ─────────────────────────────────────────────────────

  function clearPwdFieldError(champ: string) {
    setPwdFieldErrors(prev => {
      if (!prev[champ]) return prev
      const next = { ...prev }
      delete next[champ]
      return next
    })
  }

  async function handlePasswordSubmit() {
    setPwdGlobalError(null)
    setPwdFieldErrors({})

    if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmNewPassword) {
      setPwdGlobalError('Veuillez remplir tous les champs.')
      return
    }
    if (!newPasswordValid) {
      setPwdGlobalError('Le nouveau mot de passe ne respecte pas les critères requis.')
      return
    }
    if (pwdForm.newPassword !== pwdForm.confirmNewPassword) {
      setPwdGlobalError('Les mots de passe ne correspondent pas.')
      return
    }

    setIsUpdatingPwd(true)
    try {
      await api.patch('/auth/password', {
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword,
      })
      setPwdForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' })
      setPwdSuccess(true)
      setShowPwdRules(false)
      setTimeout(() => setPwdSuccess(false), 3000)
    } catch (error) {
      const axiosError = error as AxiosError<ApiValidationError>
      const details = axiosError.response?.data?.details
      if (details?.length) {
        const errors: Record<string, string> = {}
        for (const { champ, message } of details) errors[champ] = message
        setPwdFieldErrors(errors)
      } else {
        setPwdGlobalError(axiosError.response?.data?.message ?? 'Une erreur est survenue.')
      }
    } finally {
      setIsUpdatingPwd(false)
    }
  }

  // ── Delete handler ────────────────────────────────────────────────────────

  async function handleDeleteAccount() {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await api.delete('/auth/me')
      await logout()
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      setDeleteError(axiosError.response?.data?.message ?? 'Une erreur est survenue.')
      setIsDeleting(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ height: '115px' }} />

      <div style={{ padding: '48px 24px 80px' }}>

        {/* ── Title ── */}
        <h1 style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '2rem', fontWeight: 400,
          textAlign: 'center', color: '#212529', marginBottom: '48px',
        }}>
          Mes informations
        </h1>

        {/* ==SECTION 1 — Mes informations== */}

        <div style={{ maxWidth: '800px', margin: '0 auto 0' }}>
          {profileSuccess && (
            <p className="account-success-msg">Profil mis à jour ✓</p>
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

            {/* Email — readonly */}
            <div>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                placeholder="Email"
                className="login-modal-input"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <p style={{
                fontFamily: 'CenturySchoolbook, serif',
                fontSize: '0.75rem', color: '#adb5bd', marginTop: '4px',
              }}>
                L'adresse email ne peut pas être modifiée.
              </p>
            </div>

            {/* Prénom + Nom */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={e => { setProfileForm(p => ({ ...p, firstName: e.target.value })); clearProfileFieldError('firstName') }}
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
                  onChange={e => { setProfileForm(p => ({ ...p, lastName: e.target.value })); clearProfileFieldError('lastName') }}
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
                onChange={e => { setProfileForm(p => ({ ...p, phone: e.target.value })); clearProfileFieldError('phone') }}
                placeholder="Téléphone"
                className="login-modal-input"
                style={{ borderColor: profileFieldErrors.phone ? '#842029' : undefined }}
              />
              <FieldError message={profileFieldErrors.phone} />
            </div>

            {/* Adresse */}
            <div>
              <input
                type="text"
                value={profileForm.address}
                onChange={e => { setProfileForm(p => ({ ...p, address: e.target.value })); clearProfileFieldError('address') }}
                placeholder="Adresse"
                className="login-modal-input"
                style={{ borderColor: profileFieldErrors.address ? '#842029' : undefined }}
              />
              <FieldError message={profileFieldErrors.address} />
            </div>

            {/* Code postal + Ville */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <input
                  type="text"
                  value={profileForm.postalCode}
                  onChange={e => { setProfileForm(p => ({ ...p, postalCode: e.target.value })); clearProfileFieldError('postalCode') }}
                  placeholder="Code postal"
                  className="login-modal-input"
                  style={{ borderColor: profileFieldErrors.postalCode ? '#842029' : undefined }}
                />
                <FieldError message={profileFieldErrors.postalCode} />
              </div>
              <div>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={e => { setProfileForm(p => ({ ...p, city: e.target.value })); clearProfileFieldError('city') }}
                  placeholder="Ville"
                  className="login-modal-input"
                  style={{ borderColor: profileFieldErrors.city ? '#842029' : undefined }}
                />
                <FieldError message={profileFieldErrors.city} />
              </div>
            </div>

          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              className="login-modal-btn"
              onClick={() => setShowProfileModal(true)}
              disabled={isUpdatingProfile}
            >
              Enregistrer les modifications
            </button>
          </div>
        </div>

        <Separator />

        {/* ══ SECTION 2 — Change Password ══ */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '1.4rem', fontWeight: 400,
            color: '#212529', marginBottom: '32px', textAlign: 'center',
          }}>
            Changer de mot de passe
          </h2>

          {pwdSuccess && <p className="account-success-msg">Mot de passe modifié ✓</p>}
          {pwdGlobalError && (
            <p style={{
              fontFamily: 'CenturySchoolbook, serif',
              fontSize: '0.875rem', color: '#842029',
              marginBottom: '16px', textAlign: 'center',
            }}>
              {pwdGlobalError}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>

            <div>
              <input
                type="password"
                value={pwdForm.oldPassword}
                onChange={e => { setPwdForm(p => ({ ...p, oldPassword: e.target.value })); clearPwdFieldError('oldPassword') }}
                placeholder="Ancien mot de passe"
                className="login-modal-input"
                style={{ borderColor: pwdFieldErrors.oldPassword ? '#842029' : undefined }}
              />
              <FieldError message={pwdFieldErrors.oldPassword} />
            </div>

            <div>
              <input
                type="password"
                value={pwdForm.newPassword}
                onChange={e => { setPwdForm(p => ({ ...p, newPassword: e.target.value })); clearPwdFieldError('newPassword') }}
                onFocus={() => setShowPwdRules(true)}
                placeholder="Nouveau mot de passe"
                className="login-modal-input"
                style={{ borderColor: pwdFieldErrors.newPassword ? '#842029' : undefined }}
              />
              <FieldError message={pwdFieldErrors.newPassword} />
              {(showPwdRules || pwdForm.newPassword) && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {PASSWORD_RULES.map((rule, i) => {
                    const ok = rule.test(pwdForm.newPassword)
                    return (
                      <p key={i} style={{
                        fontFamily: 'CenturySchoolbook, serif',
                        fontSize: '0.78rem',
                        color: ok ? '#2d6a4f' : '#adb5bd',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'color 0.2s ease',
                      }}>
                        <i className={`fa-solid ${ok ? 'fa-circle-check' : 'fa-circle'}`} style={{ fontSize: '0.65rem' }} />
                        {rule.label}
                      </p>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <input
                type="password"
                value={pwdForm.confirmNewPassword}
                onChange={e => setPwdForm(p => ({ ...p, confirmNewPassword: e.target.value }))}
                placeholder="Confirmer le nouveau mot de passe"
                className="login-modal-input"
                style={{ borderColor: !passwordsMatch ? '#842029' : undefined }}
              />
              {!passwordsMatch && <FieldError message="Les mots de passe ne correspondent pas." />}
            </div>

          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              className="login-modal-btn"
              onClick={handlePasswordSubmit}
              disabled={isUpdatingPwd}
            >
              {isUpdatingPwd ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </div>
        </div>

        <Separator />

        {/* ══ SECTION 3 — Orders ══ */}

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '1.4rem', fontWeight: 400,
            color: '#212529', marginBottom: '32px', textAlign: 'center',
          }}>
            Mes acquisitions
          </h2>

          {isLoadingOrders ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} style={{
                  height: '80px',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'CenturySchoolbook, serif',
                color: '#6c757d', marginBottom: '16px',
              }}>
                Vous n'avez pas encore de commandes.
              </p>
              <Link
                to="/boutique"
                style={{
                  fontFamily: 'CenturySchoolbook, serif',
                  fontSize: '0.85rem', color: '#957d4c', textDecoration: 'none',
                }}
              >
                Découvrir la collection →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {orders.map(order => {
                const firstItem = order.items[0]
                const imgUrl = firstItem?.product?.images?.[0]?.url ?? null
                const name = firstItem?.product?.name ?? '—'
                return (
                  <Link
                    key={order.id}
                    to={`/mon-compte/commandes/${order.id}`}
                    className="account-order-card"
                  >
                    {/* Image */}
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

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: 'CenturySchoolbook, serif',
                        fontWeight: 600, fontSize: '0.95rem', color: '#212529',
                        marginBottom: '2px',
                      }}>
                        {name}
                      </p>
                      <p style={{
                        fontFamily: 'CenturySchoolbook, serif',
                        fontSize: '0.8rem', color: '#adb5bd',
                      }}>
                        Commande #{order.id} — {formatDate(order.createdAt)}
                      </p>
                    </div>

                    {/* Right: amount + status */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{
                        fontFamily: 'CenturySchoolbook, serif',
                        fontWeight: 700, color: '#957d4c', fontSize: '0.95rem',
                        marginBottom: '6px',
                      }}>
                        {formatPrice(order.totalAmount)}
                      </p>
                      <span style={{
                        background: STATUS_CONFIG[order.status].bg,
                        color: STATUS_CONFIG[order.status].color,
                        fontFamily: 'CenturySchoolbook, serif',
                        fontSize: '0.75rem', padding: '3px 8px',
                        display: 'inline-block',
                      }}>
                        {STATUS_CONFIG[order.status].label}
                      </span>
                    </div>

                    {/* Arrow */}
                    <i className="fa-solid fa-chevron-right" style={{ color: '#adb5bd', fontSize: '0.75rem', flexShrink: 0 }} />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* == SECTION 4 — Account Deletion == */}

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '1.4rem', fontWeight: 400,
            color: '#212529', marginBottom: '16px', textAlign: 'center',
          }}>
            Clôture du compte
          </h2>
          <div className="account-delete-zone">
            <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.75rem', textAlign: 'center', color: '#6c757d', lineHeight: 1.6, marginBottom: '16px' }}>
              En clôturant votre compte, vos informations personnelles seront définitivement
              effacées de notre base de membres. Conformément à la législation en vigueur,
              nous conserverons uniquement l'historique de vos transactions à des fins
              comptables et fiscales. Veuillez noter que cette action n'entraîne aucun
              remboursement automatique ; toute demande relative à une commande passée doit
              être finalisée avant la clôture.
            </p>
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setShowDeleteModal(true); setDeleteConfirmed(false); setDeleteError(null) }}
                style={{
                  fontFamily: 'CenturySchoolbook, serif',
                  fontSize: '0.8rem', letterSpacing: '1px',
                  color: '#212529', background: 'transparent',
                  border: '1px solid rgba(33,37,41,0.25)', padding: '10px 20px',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                Supprimer mon compte
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── Modal : Profile confirmation ─────────────────────────────── */}
      <div
        className={`cart-modal-overlay${showProfileModal ? ' cart-modal-overlay--open' : ''}`}
        onClick={() => !isUpdatingProfile && setShowProfileModal(false)}
      />
      <div className={`cart-modal${showProfileModal ? ' cart-modal--open' : ''}`}>
        <button className="cart-modal-close" onClick={() => setShowProfileModal(false)}>
          <i className="fa-solid fa-xmark" />
        </button>
        <p style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '1.1rem', color: '#212529', marginBottom: '16px',
        }}>
          Confirmer les modifications ?
        </p>
        <p style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '0.9rem', color: '#6c757d', marginBottom: '24px',
        }}>
          Vos informations personnelles seront mises à jour.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            className="login-modal-btn"
            style={{ background: 'transparent', color: '#6c757d', border: '1px solid rgba(33,37,41,0.2)', width: 'auto', padding: '10px 20px' }}
            onClick={() => setShowProfileModal(false)}
            disabled={isUpdatingProfile}
          >
            Annuler
          </button>
          <button
            className="login-modal-btn"
            style={{ width: 'auto', padding: '10px 20px' }}
            onClick={handleProfileSubmit}
            disabled={isUpdatingProfile}
          >
            {isUpdatingProfile ? 'Enregistrement...' : 'Confirmer'}
          </button>
        </div>
      </div>

      {/* ── Modal : suppression compte ──────────────────────────────── */}
      <div
        className={`cart-modal-overlay${showDeleteModal ? ' cart-modal-overlay--open' : ''}`}
        onClick={() => !isDeleting && setShowDeleteModal(false)}
      />
      <div className={`cart-modal${showDeleteModal ? ' cart-modal--open' : ''}`}>
        <button className="cart-modal-close" onClick={() => setShowDeleteModal(false)}>
          <i className="fa-solid fa-xmark" />
        </button>
        <p style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '1.1rem', color: '#212529', marginBottom: '16px',
        }}>
          Supprimer votre compte ?
        </p>
        <p style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '0.9rem', color: '#6c757d', lineHeight: 1.6, marginBottom: '16px',
        }}>
          Cette action est irréversible. Toutes vos données personnelles seront anonymisées.
        </p>
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '0.9rem', color: '#212529',
          cursor: 'pointer', marginBottom: '8px',
        }}>
          <input
            type="checkbox"
            checked={deleteConfirmed}
            onChange={e => setDeleteConfirmed(e.target.checked)}
            style={{ marginTop: '3px', accentColor: '#842029' }}
          />
          <span>Je confirme la suppression définitive de mon compte.</span>
        </label>
        {deleteError && (
          <p style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '0.85rem', color: '#842029',
            background: '#f8d7da', padding: '10px 14px', marginTop: '12px',
          }}>
            {deleteError}
          </p>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            className="login-modal-btn"
            style={{ background: 'transparent', color: '#6c757d', border: '1px solid rgba(33,37,41,0.2)', width: 'auto', padding: '10px 20px' }}
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Annuler
          </button>
          <button
            className="login-modal-btn"
            style={{ background: deleteConfirmed ? '#212529' : '#adb5bd', width: 'auto', padding: '10px 20px' }}
            onClick={handleDeleteAccount}
            disabled={!deleteConfirmed || isDeleting}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer mon compte'}
          </button>
        </div>
      </div>
    </>
  )
}