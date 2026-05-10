// CartPage.tsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import type { Store } from '../types/models.types'
import LoginModal from '../components/LoginModal'
import '../styles/CartPage.css'
import type { AxiosError } from 'axios'

const DEPOSIT_RATE = 0.3

function CartItemRow({ imageUrl, name, size, price, onRemove }: {
  imageUrl: string | null
  name: string
  size: string
  price: number
  onRemove: () => void
}) {
  return (
    <div className="cart-item-row">
      <div className="cart-item-visual">
        {imageUrl
          ? <img src={imageUrl} alt={name} className="cart-item-img" />
          : <div className="cart-item-img-placeholder" />
        }
      </div>
      <div className="cart-item-details">
        <p className="cart-item-name">{name}</p>
        <p className="cart-item-size">Taille : {size}</p>
      </div>
      <div className="cart-item-right">
        <p className="cart-item-price">
          {price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
        </p>
        <button type="button" className="cart-item-remove" onClick={onRemove} aria-label="Retirer">
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
    </div>
  )
}

export default function CartPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { cart, localItems, fetchCart, removeItem, removeLocalItem } = useCart()

  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('')
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [storeError, setStoreError] = useState<string | null>(null)
  const [termsError, setTermsError] = useState<string | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isCartFetching, setIsCartFetching] = useState(false)
  const hasFetchedCart = useRef(false)

  useEffect(() => {
    api.get('/stores').then(res => setStores(res.data)).catch(() => { })
  }, [])

  useEffect(() => {
    if (user && !cart && !hasFetchedCart.current) {
      hasFetchedCart.current = true
      setIsCartFetching(true)
      fetchCart().finally(() => setIsCartFetching(false))
    }
  }, [user]) // eslint-disable-line

  const isVisitor = !user && !authLoading
  const memberItems = cart?.items ?? []
  const isEmpty = isVisitor ? localItems.length === 0 : memberItems.length === 0

  // Replicate backend rounding logic to ensure visual consistency 
  // with the final Stripe checkout amount.
  const total = isVisitor
    ? localItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
    : memberItems.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0)

  const deposit = isVisitor
    ? localItems.reduce((sum, i) => sum + Math.round(Number(i.price) * DEPOSIT_RATE * 100) / 100, 0)
    : memberItems.reduce((sum, i) => sum + Math.round(Number(i.product.price) * DEPOSIT_RATE * 100) / 100, 0)
  const balance = total - deposit

  const handleCommander = async () => {
    let hasError = false
    if (!selectedStoreId) { setStoreError('Veuillez sélectionner un magasin de retrait.'); hasError = true }
    if (!hasAcceptedTerms) { setTermsError('Veuillez confirmer votre engagement.'); hasError = true }
    if (hasError) return
    if (!user) { setIsLoginModalOpen(true); return }

    setIsCheckingOut(true)
    setCheckoutError(null)
    try {
      const { data } = await api.post('/checkout/session', { storeId: Number(selectedStoreId) })
      window.location.href = data.url
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      setCheckoutError(axiosError.response?.data?.message ?? 'Une erreur est survenue.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (authLoading || isCartFetching) {
    return <div className="cart-loading"><div className="cart-skeleton" /></div>
  }

  if (isEmpty) {
    return (
      <div className="cart-empty">
        <p className="cart-empty-title">Votre sélection est vide.</p>
        <Link to="/boutique" className="cart-enrich-link">Découvrir la collection →</Link>
      </div>
    )
  }

  return (
    <div className="cart-layout">
      {/* ── Header ── */}
      <div className="cart-header">
        <h1 className="cart-title">Votre Sélection</h1>
      </div>

      {/* ── Items ── */}
      <div className="cart-items-list">
        {isVisitor
          ? localItems.map(item => (
            <CartItemRow
              key={`${item.productId}-${item.size}`}
              imageUrl={item.imageUrl}
              name={item.name}
              size={item.size}
              price={Number(item.price)}
              onRemove={() => removeLocalItem(item.productId, item.size)}
            />
          ))
          : memberItems.map(item => (
            <CartItemRow
              key={item.id}
              imageUrl={item.product.images[0]?.url ?? null}
              name={item.product.name}
              size={item.size}
              price={Number(item.product.price)}
              onRemove={() => removeItem(item.id)}
            />
          ))
        }
      </div>

      {/* ── Engagement block ── */}
      <div className="cart-engagement">

        {/* Valeur totale */}
        <div className="cart-engagement-total">
          <span>Valeur de la sélection</span>
          <span>{total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
        </div>

        {/* Store selector */}
        <div className="cart-store">
          <label htmlFor="store-select" className="cart-store-label">Magasin de retrait</label>
          <select
            id="store-select"
            className="cart-store-select"
            value={selectedStoreId}
            onChange={e => { setSelectedStoreId(Number(e.target.value) || ''); setStoreError(null) }}
          >
            <option value="">Sélectionner un magasin</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
            ))}
          </select>
          {storeError && <p className="cart-error-text">{storeError}</p>}
        </div>

        {/* Deposit highlight */}
        <div className="cart-deposit-block">
          <p className="cart-deposit-label">Engagement de réservation (30%)</p>
          <p className="cart-deposit-amount">
            {deposit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
          <p className="cart-balance-label">
            Solde à régulariser lors de la remise en boutique :{' '}
            <strong>{balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
          </p>
        </div>

        {/* Italic description */}
        <p className="cart-reservation-text">
          Afin de garantir la disponibilité de vos créations et de préparer votre accueil en boutique,
          un engagement de réservation est requis ce jour. Le solde sera à régulariser lors de la remise
          en main propre de votre pièce.
        </p>

        {/* Terms checkbox */}
        <div className="cart-terms">
          <label className="cart-terms-label">
            <input
              type="checkbox"
              checked={hasAcceptedTerms}
              onChange={e => { setHasAcceptedTerms(e.target.checked); setTermsError(null) }}
              className="cart-terms-checkbox"
            />
            <span>
              Je confirme ma sélection et procède à l'engagement de réservation de 30 %.
              Je reconnais que ce versement constitue un acompte validant la préparation de ma commande.
            </span>
          </label>
          {termsError && <p className="cart-error-text">{termsError}</p>}
        </div>

        {checkoutError && <p className="cart-error-text cart-checkout-error">{checkoutError}</p>}

        {/* CTA */}
        <button
          type="button"
          className="cart-pay-btn"
          onClick={handleCommander}
          disabled={isCheckingOut}
        >
          {isCheckingOut ? 'Redirection en cours...' : 'CONFIRMER LA RÉSERVATION'}
        </button>

        <p className="cart-stripe-badge">
          <i className="fa-solid fa-lock" style={{ marginRight: '6px', fontSize: '0.7rem' }} />
          Paiement 100% sécurisé via Stripe
        </p>

        <Link to="/boutique" className="cart-enrich-link">
          Enrichir ma sélection
        </Link>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  )
}