// ── AddToCartModal ────────────────────────────────────────────────────────────

import { useNavigate } from "react-router-dom"
import type { ProductWithRelations } from "../types/models.types"

export default function AddToCartModal({ isOpen, onClose, product, selectedSize }: {
  isOpen: boolean
  onClose: () => void
  product: ProductWithRelations
  selectedSize: string | null
}) {
  const navigate = useNavigate()
  const imageUrl = product.images.find(img => img.isPrimary)?.url ?? product.images[0]?.url ?? null

  return (
    <>
      <div
        className={`cart-modal-overlay${isOpen ? ' cart-modal-overlay--open' : ''}`}
        onClick={onClose}
      />
      <div className={`cart-modal${isOpen ? ' cart-modal--open' : ''}`}>
        <button type="button" className="cart-modal-close" onClick={onClose} aria-label="Fermer">
          <i className="fa-solid fa-xmark" />
        </button>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
          {imageUrl && (
            <img src={imageUrl} alt={product.name} style={{ width: '90px', height: '90px', objectFit: 'cover', flexShrink: 0 }} />
          )}
          <div>
            <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '1rem', color: '#212529', marginBottom: '6px' }}>
              {product.name}
            </p>
            {selectedSize && (
              <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.875rem', color: '#6c757d', marginBottom: '6px' }}>
                Taille : {selectedSize}
              </p>
            )}
            <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '1rem', color: '#957d4c' }}>
              {Number(product.price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
        </div>

        <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.9rem', color: '#2d6a4f', marginBottom: '28px', letterSpacing: '0.5px' }}>
          ✓ Ajouté à votre sélection
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            className="product-viewcart-btn"
            onClick={() => { onClose(); navigate('/panier') }}
          >
            VOIR MA SÉLECTION
          </button>
          <button type="button" className="product-continue-btn" onClick={onClose}>
            CONTINUER MES ACHATS
          </button>
        </div>
      </div>
    </>
  )
}