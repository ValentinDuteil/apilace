// ProductPage.tsx — Product detail page with editorial IMAGE_TEXT and PRODUCT_CTA sections
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import type { ProductWithRelations, ProductSection } from '../types/models.types'

import NotFoundState from '../components/NotFoundState'
import AddToCartModal from '../components/AddToCartModal'

import '../styles/ProductPage.css'

// ── ImageTextSection ──────────────────────────────────────────────────────────

function ImageTextSection({ section }: { section: ProductSection }) {
  const textOnLeft = section.textSide === 'LEFT'

  const pairs = [
    { label: section.text2, value: section.desc2 },
    { label: section.text3, value: section.desc3 },
    { label: section.text4, value: section.desc4 },
  ].filter(p => p.label && p.value)

  return (
    <div className="product-section">
      {section.imageUrl && (
        <img src={section.imageUrl} alt={section.title1 ?? ''} className="product-section-img" />
      )}
      <div className="product-section-overlay">
        <div className={`product-overlay-content product-overlay-content--${textOnLeft ? 'left' : 'right'}`}>
          {section.title1 && (
            <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '3px', marginBottom: '16px' }}>
              {section.title1.toUpperCase()}
            </p>
          )}
          {section.description1 && (
            <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '1.1rem', color: '#ffffff', lineHeight: 1.8, marginBottom: pairs.length > 0 ? '36px' : 0 }}>
              {section.description1}
            </p>
          )}
          {pairs.length > 0 && (
            <dl style={{ display: 'flex', flexDirection: 'column' }}>
              {pairs.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                  <dt style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', letterSpacing: '1px' }}>
                    {p.label}
                  </dt>
                  <dd style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.875rem', color: '#DFCF95', letterSpacing: '0.5px' }}>
                    {p.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  )
}

// ── SizeButton ────────────────────────────────────────────────────────────────

function SizeButton({ size, isSelected, isDisabled, onClick }: {
  size: string
  isSelected: boolean
  isDisabled: boolean
  onClick: () => void
}) {
  let cls = 'product-size-btn'
  if (isSelected) cls += ' product-size-btn--selected'
  if (isDisabled) cls += ' product-size-btn--disabled'

  return (
    <button type="button" className={cls} onClick={onClick} disabled={isDisabled}>
      {size}
    </button>
  )
}

// ── ProductCtaSection ─────────────────────────────────────────────────────────

interface CtaProps {
  section: ProductSection
  product: ProductWithRelations
  selectedSize: string | null
  noSizeError: boolean
  addError: string | null
  onSelectSize: (size: string) => void
  onAddToCart: () => void
}

function ProductCtaSection({ section, product, selectedSize, noSizeError, addError, onSelectSize, onAddToCart }: CtaProps) {
  const textOnLeft = section.textSide === 'LEFT'

  return (
    <div className="product-section">
      {section.imageUrl && (
        <img src={section.imageUrl} alt={section.title1 ?? product.name} className="product-section-img" />
      )}
      <div className="product-section-overlay">
        <div className={`product-overlay-content product-overlay-content--${textOnLeft ? 'left' : 'right'}`}>
          <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '2px', color: '#ffffff', marginBottom: '10px' }}>
            {section.title1 ?? product.name}
          </p>
          {section.description1 && (
            <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: '20px' }}>
              {section.description1}
            </p>
          )}
          <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '1.4rem', color: '#DFCF95', marginBottom: '32px', letterSpacing: '1px' }}>
            {Number(product.price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
          <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', marginBottom: '12px' }}>
            TAILLE
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {product.sizes.map(s => (
              <SizeButton
                key={s.id}
                size={s.size}
                isSelected={selectedSize === s.size}
                isDisabled={s.stock === 0}
                onClick={() => onSelectSize(s.size)}
              />
            ))}
          </div>
          {noSizeError && (
            <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.875rem', color: '#f5a0a0', marginTop: '6px' }}>
              Veuillez sélectionner une taille.
            </p>
          )}
          {addError && (
            <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.875rem', color: '#f5a0a0', marginTop: '6px' }}>
              {addError}
            </p>
          )}
          <button type="button" className="product-cta-btn" onClick={onAddToCart}>
            AJOUTER AU PANIER
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ProductPage ───────────────────────────────────────────────────────────────

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const { addToCart, addLocalItem } = useCart()

  const [product, setProduct] = useState<ProductWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [noSizeError, setNoSizeError] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    setNotFound(false)
    setSelectedSize(null)
    setNoSizeError(false)
    setAddError(null)

    api.get(`/products/${slug}`)
      .then(res => setProduct(res.data))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true)
      })
      .finally(() => setIsLoading(false))
  }, [slug])

  const handleSelectSize = (size: string) => {
    setSelectedSize(size)
    setNoSizeError(false)
    setAddError(null)
  }

  const handleAddToCart = async () => {
    if (!selectedSize) { setNoSizeError(true); return }
    if (!product) return

    setAddError(null)
    try {
      if (user) {
        await addToCart(product.id, selectedSize, 1)
      } else {
        const imageUrl = product.images.find(img => img.isPrimary)?.url ?? product.images[0]?.url ?? null
        addLocalItem({ productId: product.id, size: selectedSize, quantity: 1, name: product.name, price: product.price, imageUrl })
      }
      setIsModalOpen(true)
    } catch {
      setAddError('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ marginTop: '-45px' }}>
        <div className="product-section-skeleton" />
        <div className="product-section-skeleton" style={{ opacity: 0.6 }} />
      </div>
    )
  }

  // ── 404 ───────────────────────────────────────────────────────────────────

  if (notFound || !product) {
    return <NotFoundState message="Ce produit est introuvable." />
  }

  const sections = [...product.sections].sort((a, b) => a.position - b.position)

  return (
    <>
      <div style={{ marginTop: '-45px' }}>
        {sections.map(section => {
          if (section.type === 'IMAGE_TEXT') {
            return <ImageTextSection key={section.id} section={section} />
          }
          if (section.type === 'PRODUCT_CTA') {
            return (
              <ProductCtaSection
                key={section.id}
                section={section}
                product={product}
                selectedSize={selectedSize}
                noSizeError={noSizeError}
                addError={addError}
                onSelectSize={handleSelectSize}
                onAddToCart={handleAddToCart}
              />
            )
          }
          return null
        })}
      </div>

      <AddToCartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        selectedSize={selectedSize}
      />
    </>
  )
}