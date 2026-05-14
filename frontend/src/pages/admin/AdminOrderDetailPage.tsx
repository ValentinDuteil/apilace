// AdminOrderDetailPage.tsx — Order detail and management for Apilace admin

import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { AxiosError } from 'axios'
import api from '../../lib/axios'
import type { AdminOrder, OrderStatus } from '../../types/models.types'
import '../../styles/AdminDashboardPage.css'
import StatusBadge from '../../components/StatusBadge'

// ─── Constants ───────────────────────────────────────────────────────────────

type ModalType = 'ready' | 'collected' | 'refund' | null

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

function getClientName(order: AdminOrder): string {
  const { firstName, lastName } = order.user
  if (firstName && lastName) return `${firstName} ${lastName[0]}.`
  if (firstName) return firstName
  return order.user.email
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [hasConfirmed, setHasConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.get<AdminOrder>(`/admin/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(() => setFetchError('Commande introuvable.'))
      .finally(() => setIsLoading(false))
  }, [id])

  function openModal(type: ModalType) {
    setHasConfirmed(false)
    setActionError(null)
    setActiveModal(type)
  }

  function closeModal() {
    if (isSubmitting) return
    setActiveModal(null)
    setHasConfirmed(false)
    setActionError(null)
  }

  async function handleStatusChange(newStatus: OrderStatus) {
    if (!order) return
    setIsSubmitting(true)
    setActionError(null)
    try {
      await api.patch(`/admin/orders/${order.id}/status`, { status: newStatus })
      setOrder(prev => prev ? { ...prev, status: newStatus } : prev)
      closeModal()
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      setActionError(axiosError.response?.data?.message ?? 'Erreur lors de la mise à jour.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRefund() {
    if (!order) return
    setIsSubmitting(true)
    setActionError(null)
    try {
      await api.post(`/admin/orders/${order.id}/refund`)
      setOrder(prev => prev ? { ...prev, status: 'REFUNDED' } : prev)
      closeModal()
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      setActionError(axiosError.response?.data?.message ?? 'Erreur lors du remboursement.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <div style={{ height: '115px' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 40px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              height: '72px',
              marginBottom: '16px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }} />
          ))}
        </div>
      </>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────────

  if (fetchError || !order) {
    return (
      <>
        <div style={{ height: '115px' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 40px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'CenturySchoolbook, serif', color: '#6c757d', marginBottom: '24px' }}>
            {fetchError ?? 'Commande introuvable.'}
          </p>
          <Link to="/admin" className="admin-btn-secondary">
            ← Retour au tableau de bord
          </Link>
        </div>
      </>
    )
  }

  // ─── Derived values ───────────────────────────────────────────────────────

  const deposit = Number(order.totalAmount) * 0.3
  const balance = Number(order.totalAmount) * 0.7
  const firstItem = order.items[0]
  const productName = firstItem?.product?.name ?? '—'
  const productSlug = firstItem?.product?.slug ?? ''

  const canMakeReady = order.status === 'PAID'
  const canMarkCollected = order.status === 'READY'
  const canRefund = ['PAID', 'READY', 'COLLECTED', 'CANCELLED'].includes(order.status)
    && !!order.stripePaymentIntentId

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ height: '115px' }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 40px 80px' }}>

        {/* ── Back ── */}
        <Link
          to="/admin"
          className="admin-btn-secondary"
          style={{ display: 'inline-block', marginBottom: '40px' }}
        >
          ← Retour au tableau de bord
        </Link>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          flexWrap: 'wrap', marginBottom: '8px',
        }}>
          <h1 style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '1.75rem', fontWeight: 400, color: '#212529',
          }}>
            Commande #{order.id}
          </h1>
          <StatusBadge status={order.status} />
        </div>
        <p style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '0.85rem', color: '#adb5bd', marginBottom: '40px',
        }}>
          Passée le {formatDate(order.createdAt)}
        </p>

        {/* ── Client + Store ── */}
        <div className="admin-detail-grid">

          <div className="admin-detail-card">
            <p className="admin-detail-card-title">Client</p>
            <p className="admin-detail-value">{getClientName(order)}</p>
            <p className="admin-detail-meta">{order.user.email}</p>
            {order.user.phone && (
              <p className="admin-detail-meta">{order.user.phone}</p>
            )}
            <a
              href={`mailto:${order.user.email}?subject=Votre commande %23${order.id} — Apilace`}
              className="admin-btn-secondary"
              style={{ display: 'inline-block', marginTop: '16px' }}
            >
              <i className="fa-solid fa-envelope" style={{ marginRight: '6px' }} />
              Contacter le client
            </a>
          </div>

          <div className="admin-detail-card">
            <p className="admin-detail-card-title">Magasin de retrait</p>
            <p className="admin-detail-value">{order.store.name}</p>
            <p className="admin-detail-meta">{order.store.address}</p>
            <p className="admin-detail-meta">{order.store.postalCode} {order.store.city}</p>
            {order.store.email && (
              <a
                href={`mailto:${order.store.email}?subject=Commande %23${order.id} — Apilace`}
                className="admin-btn-secondary"
                style={{ display: 'inline-block', marginTop: '16px' }}
              >
                <i className="fa-solid fa-envelope" style={{ marginRight: '6px' }} />
                Contacter le magasin
              </a>
            )}
          </div>

        </div>

        {/* ── Articles ── */}
        <p className="admin-section-title" style={{ marginBottom: '16px' }}>
          Articles commandés
        </p>
        <div style={{ marginBottom: '40px' }}>
          {order.items.map(item => {
            const imgUrl = item.product?.images?.[0]?.url ?? null
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '16px 0',
                borderBottom: '1px solid rgba(33,37,41,0.08)',
              }}>
                <div style={{
                  width: '64px', height: '64px',
                  background: '#f0ede8', flexShrink: 0, overflow: 'hidden',
                }}>
                  {imgUrl
                    ? <img
                      src={imgUrl}
                      alt={item.product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    : <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="fa-regular fa-image" style={{ color: '#adb5bd' }} />
                    </div>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: 'CenturySchoolbook, serif',
                    fontWeight: 600, fontSize: '0.95rem', color: '#212529',
                  }}>
                    {item.product.name}
                  </p>
                  <p style={{
                    fontFamily: 'CenturySchoolbook, serif',
                    fontSize: '0.85rem', color: '#6c757d',
                  }}>
                    Taille : {item.size} — Quantité : {item.quantity}
                  </p>
                </div>
                <p style={{
                  fontFamily: 'CenturySchoolbook, serif',
                  fontWeight: 700, color: '#957d4c', fontSize: '1rem', flexShrink: 0,
                }}>
                  {formatPrice(item.unitPrice)}
                </p>
              </div>
            )
          })}
        </div>

        {/* ── Récapitulatif financier ── */}
        <div style={{
          background: '#f8f9fa',
          border: '1px solid rgba(33,37,41,0.08)',
          padding: '28px',
          marginBottom: '40px',
        }}>
          <p className="admin-section-title" style={{ marginBottom: '20px' }}>
            Récapitulatif financier
          </p>
          <div className="admin-finance-row">
            <span>Valeur totale de la commande</span>
            <span style={{ fontWeight: 600 }}>{formatPrice(order.totalAmount)}</span>
          </div>
          <div className="admin-finance-row">
            <span>Acompte versé via Stripe (30%)</span>
            <span style={{ color: '#2d6a4f', fontWeight: 600 }}>{formatPrice(deposit)}</span>
          </div>
          <div className="admin-finance-row" style={{
            borderTop: '1px solid rgba(33,37,41,0.10)',
            paddingTop: '12px', marginTop: '4px',
          }}>
            <span style={{ fontWeight: 600 }}>Solde à encaisser en boutique</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#957d4c' }}>
              {formatPrice(balance)}
            </span>
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {canMakeReady && (
            <button className="admin-btn-primary" onClick={() => openModal('ready')}>
              <i className="fa-solid fa-box" style={{ marginRight: '8px' }} />
              Marquer comme prêt
            </button>
          )}
          {canMarkCollected && (
            <button className="admin-btn-primary" onClick={() => openModal('collected')}>
              <i className="fa-solid fa-circle-check" style={{ marginRight: '8px' }} />
              Confirmer le retrait
            </button>
          )}
          {canRefund && (
            <button className="admin-btn-danger" onClick={() => openModal('refund')}>
              <i className="fa-solid fa-rotate-left" style={{ marginRight: '8px' }} />
              Rembourser
            </button>
          )}
          {productSlug && (
            <Link to={`/boutique/${productSlug}`} className="admin-btn-secondary">
              Voir le produit
            </Link>
          )}
        </div>

      </div>

      {/* ── Overlay ── */}
      <div
        className={`admin-modal-overlay${activeModal ? ' admin-modal-overlay--open' : ''}`}
        onClick={closeModal}
      />

      {/* ── Modal : PAID → READY ── */}
      <div className={`admin-modal${activeModal === 'ready' ? ' admin-modal--open' : ''}`}>
        <button className="cart-modal-close" onClick={closeModal}>
          <i className="fa-solid fa-xmark" />
        </button>
        <p className="admin-modal-title">Mettre la commande à disposition ?</p>
        <p className="admin-modal-body">
          <strong>{productName}</strong> sera marquée comme disponible en retrait
          à <strong>{order.store.name}</strong>.
        </p>
        <p className="admin-modal-notice">
          <i className="fa-solid fa-envelope" style={{ marginRight: '8px', color: '#957d4c' }} />
          Un email de notification sera automatiquement envoyé
          à <strong>{getClientName(order)}</strong>.
        </p>
        {actionError && <p className="admin-modal-error">{actionError}</p>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button className="admin-btn-secondary" onClick={closeModal} disabled={isSubmitting}>
            Annuler
          </button>
          <button
            className="admin-btn-primary"
            onClick={() => handleStatusChange('READY')}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'En cours...' : 'Confirmer et notifier le client'}
          </button>
        </div>
      </div>

      {/* ── Modal : READY → COLLECTED ── */}
      <div className={`admin-modal${activeModal === 'collected' ? ' admin-modal--open' : ''}`}>
        <button className="cart-modal-close" onClick={closeModal}>
          <i className="fa-solid fa-xmark" />
        </button>
        <p className="admin-modal-title">Confirmer la remise en main propre ?</p>
        <p className="admin-modal-body">
          Cette action marque la vente comme <strong>définitivement conclue</strong>.
          Elle ne pourra plus être annulée — uniquement remboursée.
        </p>
        <label className="admin-modal-checkbox-label">
          <input
            type="checkbox"
            checked={hasConfirmed}
            onChange={e => setHasConfirmed(e.target.checked)}
          />
          <span>
            Je confirme avoir remis la pièce et encaissé le solde
            de <strong>{formatPrice(balance)}</strong> en boutique.
          </span>
        </label>
        {actionError && <p className="admin-modal-error">{actionError}</p>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button className="admin-btn-secondary" onClick={closeModal} disabled={isSubmitting}>
            Annuler
          </button>
          <button
            className="admin-btn-primary"
            onClick={() => handleStatusChange('COLLECTED')}
            disabled={!hasConfirmed || isSubmitting}
          >
            {isSubmitting ? 'En cours...' : 'Confirmer'}
          </button>
        </div>
      </div>

      {/* ── Modal : Remboursement ── */}
      <div className={`admin-modal${activeModal === 'refund' ? ' admin-modal--open' : ''}`}>
        <button className="cart-modal-close" onClick={closeModal}>
          <i className="fa-solid fa-xmark" />
        </button>
        <p className="admin-modal-title">Rembourser cette commande ?</p>
        <p className="admin-modal-body">
          L'acompte de <strong>{formatPrice(deposit)}</strong> sera remboursé via Stripe
          et le stock sera automatiquement restauré.
        </p>
        {order.status === 'COLLECTED' && (
          <p className="admin-modal-notice">
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px', color: '#957d4c' }} />
            Le solde de <strong>{formatPrice(balance)}</strong> encaissé en boutique devra faire
            l'objet d'un virement bancaire séparé. Contactez <strong>{order.user.email}</strong> pour
            obtenir les coordonnées bancaires du client. Aucun remboursement en espèces n'est possible
            pour ce montant.
          </p>
        )}
        <label className="admin-modal-checkbox-label">
          <input
            type="checkbox"
            checked={hasConfirmed}
            onChange={e => setHasConfirmed(e.target.checked)}
          />
          <span>
            Je confirme le remboursement de <strong>{formatPrice(deposit)}</strong> au client.
          </span>
        </label>
        {actionError && <p className="admin-modal-error">{actionError}</p>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button className="admin-btn-secondary" onClick={closeModal} disabled={isSubmitting}>
            Annuler
          </button>
          <button
            className="admin-btn-danger"
            onClick={handleRefund}
            disabled={!hasConfirmed || isSubmitting}
          >
            {isSubmitting ? 'En cours...' : 'Confirmer le remboursement'}
          </button>
        </div>
      </div>
    </>
  )
}