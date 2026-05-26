// OrderDetailPage.tsx — Member order detail for Apilace
// Shows order summary, product specs from CTA section, and member actions

import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { AxiosError } from 'axios'
import api from '../lib/axios'
import type { Order, ProductWithRelations, CtaSpecs } from '../types/models.types'
import StatusBadge from '../components/StatusBadge'
import '../styles/OrderDetailPage.css'

// ─── Constants ───────────────────────────────────────────────────────────────

const CANCELLATION_DAYS = 14

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(amount: string | number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(Number(amount))
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function isWithinDays(dateStr: string, days: number): boolean {
  return Date.now() - new Date(dateStr).getTime() < days * 24 * 60 * 60 * 1000
}

// ─── Sub-component — specs column ────────────────────────────────────────────

function SpecsColumn({ sections }: { sections: CtaSpecs['left'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {sections.map((section, i) => (
        <div key={i}>
          <p style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '1rem', fontWeight: 600, color: '#212529',
            marginBottom: '10px',
            borderBottom: '1px solid rgba(33,37,41,0.08)',
            paddingBottom: '6px',
          }}>
            {section.title}
          </p>
          {section.items && section.items.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
              {section.items.map((item, j) => (
                <div key={j}>
                  <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.75rem', color: '#adb5bd', marginBottom: '2px' }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.9rem', color: '#212529' }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
          {section.text && (
            <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.85rem', color: '#6c757d', lineHeight: 1.6 }}>
              {section.text}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [order, setOrder] = useState<Order | null>(null)
  const [product, setProduct] = useState<ProductWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [invoiceSuccess, setInvoiceSuccess] = useState(false)
  const [isRequestingInvoice, setIsRequestingInvoice] = useState(false)

  // Load order
  useEffect(() => {
    if (!id) return
    api.get<Order>(`/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(() => setFetchError('Commande introuvable.'))
      .finally(() => setIsLoading(false))
  }, [id])

  // Load full product with specs once order is loaded
  useEffect(() => {
    const slug = order?.items[0]?.product?.slug
    if (!slug) return
    api.get<ProductWithRelations>(`/products/${slug}`)
      .then(res => setProduct(res.data))
      .catch(console.error)
  }, [order])

  async function handleCancel() {
    if (!order) return
    setIsCancelling(true)
    setCancelError(null)
    try {
      await api.post(`/orders/${order.id}/cancel`)
      setOrder(prev => prev ? { ...prev, status: 'CANCELLED' } : prev)
      setShowCancelModal(false)
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      setCancelError(axiosError.response?.data?.message ?? "Erreur lors de l'annulation.")
    } finally {
      setIsCancelling(false)
    }
  }

  async function handleRequestInvoice() {
    if (!order) return
    setIsRequestingInvoice(true)
    try {
      await api.post(`/orders/${order.id}/invoice`)
      setInvoiceSuccess(true)
      setTimeout(() => setInvoiceSuccess(false), 4000)
    } catch {
      // Silent — invoice request is best-effort
    } finally {
      setIsRequestingInvoice(false)
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <div style={{ height: '115px' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              height: '64px', marginBottom: '16px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
            }} />
          ))}
        </div>
      </>
    )
  }

  if (fetchError || !order) {
    return (
      <>
        <div style={{ height: '115px' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'CenturySchoolbook, serif', color: '#6c757d', marginBottom: '24px' }}>
            {fetchError ?? 'Commande introuvable.'}
          </p>
          <Link to="/mon-compte" style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.85rem', color: '#957d4c', textDecoration: 'none' }}>
            ← Retour à mes informations
          </Link>
        </div>
      </>
    )
  }

  // ─── Derived values ───────────────────────────────────────────────────────

  const firstItem = order.items[0]
  const imgUrl = firstItem?.product?.images?.[0]?.url ?? null
  const ctaSection = product?.sections?.find(s => s.type === 'PRODUCT_CTA')
  const specs = ctaSection?.specs as CtaSpecs | null | undefined
  const canCancel = ['PAID', 'READY'].includes(order.status)
    && isWithinDays(order.createdAt, CANCELLATION_DAYS)
  const canRequestInvoice = ['PAID', 'READY', 'COLLECTED'].includes(order.status)

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ height: '115px' }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* ── Back link ── */}
        <Link
          to="/mon-compte"
          style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '0.8rem', color: '#6c757d',
            textDecoration: 'none', display: 'inline-block', marginBottom: '40px',
          }}
        >
          ← Retour à mes informations
        </Link>

        {/* ── Title ── */}
        <h1 style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '3rem', fontWeight: 400,
          textAlign: 'center', color: '#212529', marginBottom: '40px',
        }}>
          Détails de mon acquisition
        </h1>

        {/* ── Golden wrapper — product card + specs ── */}
        <div style={{
          background: 'rgba(149, 125, 76, 0.07)',
          border: '1px solid rgba(149, 125, 76, 0.22)',
          padding: '20px',
          marginBottom: '48px',
          maxWidth: '800px',
          margin: '0 auto 48px',
        }}>

          {/* ── Product card — gray background, image flush to edges ── */}
          <div style={{
            display: 'flex',
            background: '#f0ede8',
            overflow: 'hidden',
            marginBottom: specs ? '32px' : '0',
          }}>

            {/* Image — flush to card edges, stretches full card height */}
            <div style={{ width: '140px', flexShrink: 0, alignSelf: 'stretch' }}>
              {imgUrl
                ? <img
                  src={imgUrl}
                  alt={firstItem?.product?.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                : <div style={{
                  width: '100%', height: '100%', minHeight: '160px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="fa-regular fa-image" style={{ color: '#adb5bd', fontSize: '2rem' }} />
                </div>
              }
            </div>

            {/* Central info with separators */}
            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>

              <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.78rem', color: '#adb5bd', marginBottom: '12px' }}>
                Votre achat du {formatDate(order.createdAt)}
              </p>

              <div style={{ borderTop: '1px solid rgba(149,125,76,0.10)', marginBottom: '12px' }} />

              <p style={{ fontFamily: 'CenturySchoolbook, serif', fontWeight: 600, fontSize: '1.05rem', color: '#212529', marginBottom: '4px' }}>
                {firstItem?.product?.name ?? '—'}
              </p>
              <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.85rem', color: '#6c757d', marginBottom: '12px' }}>
                Taille : {firstItem?.size}
              </p>

              <div style={{ borderTop: '1px solid rgba(149,125,76,0.10)', marginBottom: '12px' }} />

              <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.85rem', color: '#6c757d', marginBottom: '12px' }}>
                <i className="fa-solid fa-location-dot" style={{ color: '#957d4c', marginRight: '6px' }} />
                Magasin de retrait : {order.store.name}
              </p>

              <div style={{ borderTop: '1px solid rgba(149,125,76,0.10)', marginBottom: '12px' }} />

              <p style={{ fontFamily: 'CenturySchoolbook, serif', fontWeight: 700, fontSize: '1.1rem', color: '#957d4c', marginBottom: '2px' }}>
                {formatPrice(order.totalAmount)} TTC
              </p>
              <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.78rem', color: '#adb5bd' }}>
                dont {formatPrice(Number(order.totalAmount) * 0.3)} d'acompte versé
              </p>

            </div>

            {/* Right column — status + invoice button */}
            <div style={{
              width: '180px', flexShrink: 0, padding: '20px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'flex-end', justifyContent: 'space-between',
            }}>

              <StatusBadge status={order.status} />

              {invoiceSuccess
                ? <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.78rem', color: '#2d6a4f' }}>
                  Demande envoyée ✓
                </p>
                : <button
                  type="button"
                  onClick={handleRequestInvoice}
                  disabled={!canRequestInvoice || isRequestingInvoice}
                  style={{
                    fontFamily: 'CenturySchoolbook, serif',
                    fontSize: '0.78rem', letterSpacing: '1px',
                    color: canRequestInvoice ? '#ffffff' : '#adb5bd',
                    background: canRequestInvoice ? '#957d4c' : 'transparent',
                    border: canRequestInvoice ? 'none' : '1px solid rgba(173,181,189,0.4)',
                    padding: '9px 16px',
                    cursor: canRequestInvoice ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                  }}
                >
                  {isRequestingInvoice ? 'Envoi...' : 'Demander une facture'}
                </button>
              }

            </div>
          </div>

          {/* ── Specs inside the golden wrapper ── */}
          {specs && (specs.left.length > 0 || specs.right.length > 0) && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '40px', padding: '0 4px',
            }}>
              <SpecsColumn sections={specs.left} />
              <SpecsColumn sections={specs.right} />
            </div>
          )}

        </div>

        {/* ── Refund / cancel action ── */}
        {canCancel && (
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 16px' }}>
            <button
              type="button"
              onClick={() => { setShowCancelModal(true); setCancelError(null) }}
              className="order-cancel-btn"
            >
              Demander un remboursement
            </button>
          </div>
        )}

        {order.status === 'PAID' && !isWithinDays(order.createdAt, CANCELLATION_DAYS) && (
          <p style={{
            fontFamily: 'CenturySchoolbook, serif', fontSize: '0.78rem',
            color: '#adb5bd', fontStyle: 'italic', textAlign: 'center',
            maxWidth: '800px', margin: '0 auto',
          }}>
            Le délai de rétractation de 14 jours est dépassé.
          </p>
        )}

      </div>

      {/* ── Cancel modal ── */}
      <div
        className={`cart-modal-overlay${showCancelModal ? ' cart-modal-overlay--open' : ''}`}
        onClick={() => !isCancelling && setShowCancelModal(false)}
      />
      <div className={`cart-modal${showCancelModal ? ' cart-modal--open' : ''}`}>
        <button className="cart-modal-close" onClick={() => setShowCancelModal(false)}>
          <i className="fa-solid fa-xmark" />
        </button>
        <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '1.1rem', color: '#212529', marginBottom: '16px' }}>
          Annuler la réservation #{order.id} ?
        </p>
        <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.9rem', color: '#6c757d', lineHeight: 1.6, marginBottom: '24px' }}>
          Votre demande sera transmise à notre équipe. Après validation,
          l'acompte de <strong>{formatPrice(Number(order.totalAmount) * 0.3)}</strong> sera
          remboursé conformément à votre droit de rétractation sous 5 à 10 jours ouvrés.
        </p>
        {cancelError && (
          <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.85rem', color: '#212529', background: 'rgba(33,37,41,0.05)', padding: '10px 14px', marginBottom: '16px' }}>
            {cancelError}
          </p>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            className="login-modal-btn"
            style={{ background: 'transparent', color: '#6c757d', border: '1px solid rgba(33,37,41,0.2)', width: 'auto', padding: '10px 20px' }}
            onClick={() => setShowCancelModal(false)}
            disabled={isCancelling}
          >
            Conserver ma réservation
          </button>
          <button
            className="login-modal-btn"
            style={{ background: '#212529', width: 'auto', padding: '10px 20px' }}
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? 'Annulation...' : "Confirmer l'annulation"}
          </button>
        </div>
      </div>
    </>
  )
}