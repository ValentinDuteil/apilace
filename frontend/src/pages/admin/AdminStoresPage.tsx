// AdminStoresPage.tsx — Store management for Apilace admin
// Combined list + create/edit form on a single page

import { useState, useEffect, useRef, useCallback } from 'react'
import type { AxiosError } from 'axios'
import api from '../../lib/axios'
import type { Store, OpeningHours, ApiValidationError } from '../../types/models.types'
import '../../styles/AdminDashboardPage.css'
import '../../styles/AdminStoresPage.css'

// ─── Constants ───────────────────────────────────────────────────────────────

const STORES_PER_PAGE = 3

const DAYS: { key: keyof OpeningHours; label: string }[] = [
  { key: 'lun', label: 'Lundi' },
  { key: 'mar', label: 'Mardi' },
  { key: 'mer', label: 'Mercredi' },
  { key: 'jeu', label: 'Jeudi' },
  { key: 'ven', label: 'Vendredi' },
  { key: 'sam', label: 'Samedi' },
  { key: 'dim', label: 'Dimanche' },
]

// ─── Types ───────────────────────────────────────────────────────────────────

type DayHours = { open1: string; close1: string; open2: string; close2: string }
type FormHours = Record<keyof OpeningHours, DayHours>

type StoreForm = {
  name: string
  address: string
  postalCode: string
  city: string
  email: string
  phone: string
  openingHours: FormHours
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPTY_DAY: DayHours = { open1: '', close1: '', open2: '', close2: '' }

const INITIAL_FORM: StoreForm = {
  name: '', address: '', postalCode: '', city: '', email: '', phone: '',
  openingHours: {
    lun: { ...EMPTY_DAY }, mar: { ...EMPTY_DAY }, mer: { ...EMPTY_DAY },
    jeu: { ...EMPTY_DAY }, ven: { ...EMPTY_DAY }, sam: { ...EMPTY_DAY },
    dim: { ...EMPTY_DAY },
  },
}

function formatHours(day: OpeningHours[keyof OpeningHours]): string {
  if (!day?.open1 || !day?.close1) return 'Fermé'
  const slot1 = `${day.open1} – ${day.close1}`
  if (day.open2 && day.close2) return `${slot1} / ${day.open2} – ${day.close2}`
  return slot1
}

function storeToForm(store: Store): StoreForm {
  const hours: FormHours = {
    lun: { ...EMPTY_DAY }, mar: { ...EMPTY_DAY }, mer: { ...EMPTY_DAY },
    jeu: { ...EMPTY_DAY }, ven: { ...EMPTY_DAY }, sam: { ...EMPTY_DAY },
    dim: { ...EMPTY_DAY },
  }
  for (const { key } of DAYS) {
    const slot = store.openingHours[key]
    if (slot) {
      hours[key] = {
        open1: slot.open1 ?? '',
        close1: slot.close1 ?? '',
        open2: slot.open2 ?? '',
        close2: slot.close2 ?? '',
      }
    }
  }
  return {
    name: store.name,
    address: store.address,
    postalCode: store.postalCode,
    city: store.city,
    email: store.email ?? '',
    phone: store.phone ?? '',
    openingHours: hours,
  }
}

function formToPayload(form: StoreForm) {
  const openingHours: OpeningHours = {}
  for (const { key } of DAYS) {
    const slot = form.openingHours[key]
    if (slot.open1 && slot.close1) {
      openingHours[key] = {
        open1: slot.open1,
        close1: slot.close1,
        ...(slot.open2 && slot.close2 ? { open2: slot.open2, close2: slot.close2 } : {}),
      }
    }
  }
  return {
    name: form.name,
    address: form.address,
    postalCode: form.postalCode,
    city: form.city,
    email: form.email || undefined,
    phone: form.phone || undefined,
    openingHours,
  }
}

// ─── Sub-component ───────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [form, setForm] = useState<StoreForm>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.ceil(stores.length / STORES_PER_PAGE)
  const pagedStores = stores.slice((page - 1) * STORES_PER_PAGE, page * STORES_PER_PAGE)

  const fetchStores = useCallback(() => {
    setIsLoading(true)
    api.get<Store[]>('/admin/stores')
      .then(res => setStores(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => { fetchStores() }, [fetchStores])

  function handleEdit(store: Store) {
    setEditingStore(store)
    setForm(storeToForm(store))
    setGlobalError(null)
    setFieldErrors({})
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function handleCancelEdit() {
    setEditingStore(null)
    setForm(INITIAL_FORM)
    setGlobalError(null)
    setFieldErrors({})
  }

  function setField(field: keyof Omit<StoreForm, 'openingHours'>, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function clearFieldError(champ: string) {
    setFieldErrors(prev => {
      if (!prev[champ]) return prev
      const next = { ...prev }
      delete next[champ]
      return next
    })
  }

  function setDayHours(day: keyof OpeningHours, slot: keyof DayHours, value: string) {
    setForm(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: { ...prev.openingHours[day], [slot]: value },
      },
    }))
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setGlobalError(null)
    setFieldErrors({})
    try {
      const payload = formToPayload(form)
      if (editingStore) {
        const res = await api.patch<Store>(`/admin/stores/${editingStore.id}`, payload)
        setStores(prev => prev.map(s => s.id === editingStore.id ? res.data : s))
      } else {
        const res = await api.post<Store>('/admin/stores', payload)
        setStores(prev => [...prev, res.data])
      }
      setEditingStore(null)
      setForm(INITIAL_FORM)
    } catch (error) {
      const axiosError = error as AxiosError<ApiValidationError>
      const details = axiosError.response?.data?.details
      if (details?.length) {
        const errors: Record<string, string> = {}
        const hoursErrors = details.filter(d => d.champ.startsWith('openingHours'))
        const fieldLevelErrors = details.filter(d => !d.champ.startsWith('openingHours'))
        for (const { champ, message } of fieldLevelErrors) errors[champ] = message
        setFieldErrors(errors)
        if (hoursErrors.length > 0) {
          setGlobalError('Horaires invalides — vérifiez les plages horaires renseignées.')
        }
      } else {
        setGlobalError(axiosError.response?.data?.message ?? 'Une erreur est survenue.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleActive(store: Store) {
    try {
      const res = await api.patch<Store>(`/admin/stores/${store.id}`, { isActive: !store.isActive })
      setStores(prev => prev.map(s => s.id === store.id ? res.data : s))
      setPage(1)
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      console.error(axiosError.response?.data?.message)
    }
  }

  function openDeleteModal(store: Store) {
    setDeleteTarget(store)
    setDeleteConfirmed(false)
    setDeleteError(null)
  }

  function closeDeleteModal() {
    if (isDeleting) return
    setDeleteTarget(null)
    setDeleteConfirmed(false)
    setDeleteError(null)
  }

  async function handlePermanentDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await api.delete(`/admin/stores/${deleteTarget.id}`)
      setStores(prev => prev.filter(s => s.id !== deleteTarget.id))
      setPage(1)
      closeDeleteModal()
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      setDeleteError(axiosError.response?.data?.message ?? 'Erreur lors de la suppression.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <div style={{ height: '115px' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px' }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} style={{
              height: '160px', marginBottom: '16px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }} />
          ))}
        </div>
      </>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ height: '115px' }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px 80px' }}>

        {/* ── Title ── */}
        <h1 style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '2rem', fontWeight: 400,
          textAlign: 'center', color: '#212529', marginBottom: '48px',
        }}>
          Points de retrait
        </h1>

        {/* ── Store list ── */}
        {stores.length === 0 ? (
          <p style={{
            textAlign: 'center', fontFamily: 'CenturySchoolbook, serif',
            color: '#6c757d', marginBottom: '64px',
          }}>
            Aucun point de retrait enregistré.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {pagedStores.map(store => (
                <div
                  key={store.id}
                  className="admin-store-card"
                  style={{ opacity: store.isActive ? 1 : 0.65, position: 'relative' }}
                >
                  {/* ── Info ── */}
                  <div style={{ flex: 1 }}>
                    <button
                      className="admin-store-delete-btn"
                      onClick={() => openDeleteModal(store)}
                      aria-label="Supprimer définitivement"
                      title="Supprimer définitivement"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <p style={{
                        fontFamily: 'CenturySchoolbook, serif',
                        fontWeight: 600, fontSize: '1rem', color: '#212529',
                      }}>
                        {store.name}
                      </p>
                      {!store.isActive && (
                        <span style={{
                          fontFamily: 'CenturySchoolbook, serif', fontSize: '0.75rem',
                          background: '#f8d7da', color: '#721c24', padding: '2px 8px',
                        }}>
                          Désactivé
                        </span>
                      )}
                    </div>
                    <p className="admin-detail-meta">{store.address}</p>
                    <p className="admin-detail-meta">{store.postalCode} {store.city}</p>
                    {store.email && <p className="admin-detail-meta">{store.email}</p>}
                    {store.phone && <p className="admin-detail-meta">{store.phone}</p>}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                      <button className="admin-btn-secondary" onClick={() => handleEdit(store)}>
                        Modifier
                      </button>
                      <button
                        className={store.isActive ? 'admin-btn-danger' : 'admin-btn-primary'}
                        onClick={() => handleToggleActive(store)}
                      >
                        {store.isActive ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </div>
                  </div>

                  {/* ── Opening hours ── */}
                  <div className="admin-store-hours">
                    <p className="admin-detail-card-title" style={{ marginBottom: '10px' }}>
                      Horaires d'ouverture
                    </p>
                    {DAYS.map(({ key, label }) => (
                      <div key={key} style={{
                        display: 'flex', gap: '16px', marginBottom: '3px',
                        fontFamily: 'CenturySchoolbook, serif', fontSize: '0.82rem',
                      }}>
                        <span style={{ width: '76px', color: '#6c757d', flexShrink: 0 }}>
                          {label}
                        </span>
                        <span style={{ color: store.openingHours[key] ? '#212529' : '#adb5bd' }}>
                          {formatHours(store.openingHours[key])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination — OUTSIDE the map ── */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '48px' }}>
                <button
                  className="admin-pagination-btn"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                >‹</button>
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
                >›</button>
              </div>
            )}
          </>
        )}

        {/* ── Separator ── */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(to right, #ffffff, rgba(149,125,76,0.4) 50%, #ffffff)',
          marginBottom: '64px',
        }} />

        {/* ── Form ── */}
        <div ref={formRef}>
          <h2 style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '1.75rem', fontWeight: 400,
            textAlign: 'center', color: '#212529', marginBottom: '40px',
          }}>
            {editingStore ? `Modifier — ${editingStore.name}` : 'Créer un point de retrait'}
          </h2>

          {/* Basic fields */}
          <div className="admin-form-grid" style={{ marginBottom: '32px' }}>
            <div>
              <label className="admin-form-label">Nom de l'entreprise *</label>
              <input
                className="admin-form-input"
                type="text"
                value={form.name}
                onChange={e => { setField('name', e.target.value); clearFieldError('name') }}
                placeholder="Manufacture Horlogère..."
                style={{ borderColor: fieldErrors.name ? '#842029' : undefined }}
              />
              <FieldError message={fieldErrors.name} />
            </div>
            <div>
              <label className="admin-form-label">Adresse *</label>
              <input
                className="admin-form-input"
                type="text"
                value={form.address}
                onChange={e => { setField('address', e.target.value); clearFieldError('address') }}
                placeholder="12 rue de la Paix"
                style={{ borderColor: fieldErrors.address ? '#842029' : undefined }}
              />
              <FieldError message={fieldErrors.address} />
            </div>
            <div>
              <label className="admin-form-label">Téléphone</label>
              <input
                className="admin-form-input"
                type="tel"
                value={form.phone}
                onChange={e => { setField('phone', e.target.value); clearFieldError('phone') }}
                placeholder="06 00 00 00 00"
                style={{ borderColor: fieldErrors.phone ? '#842029' : undefined }}
              />
              <FieldError message={fieldErrors.phone} />
            </div>
            <div>
              <label className="admin-form-label">Code postal *</label>
              <input
                className="admin-form-input"
                type="text"
                value={form.postalCode}
                onChange={e => { setField('postalCode', e.target.value); clearFieldError('postalCode') }}
                placeholder="75001"
                style={{ borderColor: fieldErrors.postalCode ? '#842029' : undefined }}
              />
              <FieldError message={fieldErrors.postalCode} />
            </div>
            <div>
              <label className="admin-form-label">Email</label>
              <input
                className="admin-form-input"
                type="email"
                value={form.email}
                onChange={e => { setField('email', e.target.value); clearFieldError('email') }}
                placeholder="contact@partenaire.fr"
                style={{ borderColor: fieldErrors.email ? '#842029' : undefined }}
              />
              <FieldError message={fieldErrors.email} />
            </div>
            <div>
              <label className="admin-form-label">Ville *</label>
              <input
                className="admin-form-input"
                type="text"
                value={form.city}
                onChange={e => { setField('city', e.target.value); clearFieldError('city') }}
                placeholder="Paris"
                style={{ borderColor: fieldErrors.city ? '#842029' : undefined }}
              />
              <FieldError message={fieldErrors.city} />
            </div>
          </div>

          {/* Opening hours */}
          <p className="admin-section-title" style={{ marginBottom: '8px' }}>
            Horaires d'ouverture
          </p>
          <p style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '0.8rem', color: '#adb5bd',
            fontStyle: 'italic', marginBottom: '20px',
          }}>
            Laissez vide pour un jour fermé. La plage 2 est optionnelle (coupure déjeuner).
          </p>

          <div className="admin-hours-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <span style={{ width: '80px' }} />
            <span style={{
              flex: 1, textAlign: 'center',
              fontFamily: 'CenturySchoolbook, serif',
              fontSize: '0.72rem', color: '#6c757d',
              letterSpacing: '1.5px', textTransform: 'uppercase',
            }}>
              Plage 1
            </span>
            <span style={{
              flex: 1, textAlign: 'center',
              fontFamily: 'CenturySchoolbook, serif',
              fontSize: '0.72rem', color: '#adb5bd',
              letterSpacing: '1.5px', textTransform: 'uppercase',
            }}>
              Plage 2 (optionnelle)
            </span>
          </div>

          <div style={{ marginBottom: '32px' }}>
            {DAYS.map(({ key, label }) => (
              <div key={key} className="admin-hours-row">
                <span style={{
                  width: '80px', flexShrink: 0,
                  fontFamily: 'CenturySchoolbook, serif',
                  fontSize: '0.85rem', color: '#212529',
                }}>
                  {label}
                </span>
                <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                  <input className="admin-hours-input" type="time"
                    value={form.openingHours[key].open1}
                    onChange={e => setDayHours(key, 'open1', e.target.value)} />
                  <span style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.8rem', color: '#adb5bd' }}>à</span>
                  <input className="admin-hours-input" type="time"
                    value={form.openingHours[key].close1}
                    onChange={e => setDayHours(key, 'close1', e.target.value)} />
                </div>
                <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                  <input className="admin-hours-input" type="time"
                    value={form.openingHours[key].open2}
                    onChange={e => setDayHours(key, 'open2', e.target.value)} />
                  <span style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.8rem', color: '#adb5bd' }}>à</span>
                  <input className="admin-hours-input" type="time"
                    value={form.openingHours[key].close2}
                    onChange={e => setDayHours(key, 'close2', e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          {globalError && (
            <p className="admin-modal-error" style={{ marginBottom: '16px' }}>
              {globalError}
            </p>
          )}

          {/* Submit — centré */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {editingStore && (
              <button className="admin-btn-secondary" onClick={handleCancelEdit} disabled={isSubmitting}>
                Annuler
              </button>
            )}
            <button className="admin-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? 'Enregistrement...'
                : editingStore ? 'Enregistrer les modifications' : 'Créer le point de retrait'
              }
            </button>
          </div>
        </div>

      </div>

      {/* ── Modal suppression définitive ── */}
      <div
        className={`admin-modal-overlay${deleteTarget ? ' admin-modal-overlay--open' : ''}`}
        onClick={closeDeleteModal}
      />
      <div className={`admin-modal${deleteTarget ? ' admin-modal--open' : ''}`}>
        <button className="cart-modal-close" onClick={closeDeleteModal}>
          <i className="fa-solid fa-xmark" />
        </button>
        <p className="admin-modal-title">Supprimer définitivement ?</p>
        <p className="admin-modal-body">
          <strong>{deleteTarget?.name}</strong> sera supprimé de façon irréversible.
          Cette action est impossible si des commandes sont associées à ce point de retrait.
        </p>
        <label className="admin-modal-checkbox-label">
          <input
            type="checkbox"
            checked={deleteConfirmed}
            onChange={e => setDeleteConfirmed(e.target.checked)}
          />
          <span>Je confirme la suppression définitive de ce point de retrait.</span>
        </label>
        {deleteError && <p className="admin-modal-error" style={{ marginTop: '12px' }}>{deleteError}</p>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button className="admin-btn-secondary" onClick={closeDeleteModal} disabled={isDeleting}>
            Annuler
          </button>
          <button
            className="admin-btn-danger"
            onClick={handlePermanentDelete}
            disabled={!deleteConfirmed || isDeleting}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
          </button>
        </div>
      </div>
    </>
  )
}