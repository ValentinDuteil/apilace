// ProductPage.tsx — Product detail page with editorial IMAGE_TEXT and PRODUCT_CTA sections
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useReveal } from '../hooks/useReveal'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import type { ProductWithRelations, ProductSection, SpecSection as SpecSectionType } from '../types/models.types'

import NotFoundState from '../components/NotFoundState'
import AddToCartModal from '../components/AddToCartModal'
import SizeGuideModal from '../components/SizeGuideModal'

import '../styles/ProductPage.css'

// ── HeroSection ───────────────────────────────────────────────────────────────

function HeroSection({ product, onScrollToCta }: {
  product: ProductWithRelations
  onScrollToCta: () => void
}) {
  const { ref, isVisible } = useReveal(0.1)
  const imageUrl = product.images.find(img => img.isPrimary)?.url ?? product.images[0]?.url ?? null

  return (
    <div className="product-section">
      {imageUrl && (
        <img src={imageUrl} alt={product.name} className="product-section-img" />
      )}
      <div className="product-section-overlay">
        <div
          ref={ref}
          className={`product-overlay-content product-overlay-content--left reveal-up${isVisible ? ' reveal-up--visible' : ''}`}
        >
          <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '2.5rem', fontWeight: 400, color: '#ffffff', letterSpacing: '2px', lineHeight: 1.3, marginBottom: '20px' }}>
            {product.name}
          </p>
          {product.tagline && (
            <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '1rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: '32px' }}>
              {product.tagline}
            </p>
          )}
          <button type="button" className="product-hero-cta" onClick={onScrollToCta}>
            AJOUTER À MA SÉLECTION
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ImageTextSection ──────────────────────────────────────────────────────────

function ImageTextSection({ section }: { section: ProductSection }) {
  const { ref, isVisible } = useReveal(0.2)
  const textOnLeft = section.textSide === 'LEFT'

  const pairs = [
    { label: section.text2, value: section.desc2 },
    { label: section.text3, value: section.desc3 },
    { label: section.text4, value: section.desc4 },
  ].filter(p => p.label && p.value)

  return (
    <div
      ref={ref}
      className={`product-section reveal-up${isVisible ? ' reveal-up--visible' : ''}`}>
      {section.imageUrl && (
        <img
          src={section.imageUrl}
          alt={section.title1 ?? ''}
          className="product-section-img"
          style={section.mirrorBackground ? { transform: 'scaleX(-1)' } : undefined}
        />
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

// ── SpecSectionBlock ──────────────────────────────────────────────────────────

function SpecSectionBlock({ section }: { section: SpecSectionType }) {
  return (
    <div className="product-cta-spec-section">
      <p className="product-cta-spec-title">{section.title}</p>
      <div className="product-cta-spec-line" />
      {section.items && section.items.length > 0 ? (
        <div className="product-cta-spec-items">
          {section.items.map((item, i) => (
            <div key={i} className="product-cta-spec-item">
              <span className="product-cta-spec-label">{item.label}</span>
              <span className="product-cta-spec-value">{item.value}</span>
            </div>
          ))}
        </div>
      ) : section.text ? (
        <p className="product-cta-spec-text">{section.text}</p>
      ) : null}
    </div>
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
  onOpenSizeGuide: () => void
}

function ProductCtaSection({ section, product, selectedSize, noSizeError, addError, onSelectSize, onAddToCart, onOpenSizeGuide }: CtaProps) {
  const specs = section.specs
  const specsReveal = useReveal(0.1)
  const bottomReveal = useReveal(0.15)

  return (
    <div className="product-cta-section">

      {/* 2×3 interleaved grid — ensures row alignment */}
      {specs && (
        <div
          ref={specsReveal.ref}
          className={`product-cta-specs-grid reveal-up${specsReveal.isVisible ? ' reveal-up--visible' : ''}`}
        >
          {[0, 1, 2].flatMap(i => [
            specs.left[i]
              ? <SpecSectionBlock key={`left-${i}`} section={specs.left[i]} />
              : <div key={`left-empty-${i}`} />,
            specs.right[i]
              ? <SpecSectionBlock key={`right-${i}`} section={specs.right[i]} />
              : <div key={`right-empty-${i}`} />,
          ])}
        </div>
      )}

      {/* PDF link — inactive until fileUrl added in S5 */}
      <span className="product-cta-pdf">Fiche produit complète</span>

      {/* Purchase zone */}
      <div
        ref={bottomReveal.ref}
        className={`product-cta-bottom reveal-up${bottomReveal.isVisible ? ' reveal-up--visible' : ''}`}>
        <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', marginBottom: '14px' }}>
          TAILLE
        </p>

        <div className="product-cta-sizes-row">
          {product.sizes.map(s => (
            <SizeButton
              key={s.id}
              size={s.size}
              isSelected={selectedSize === s.size}
              isDisabled={s.stock === 0}
              onClick={() => onSelectSize(s.size)}
            />
          ))}
          <button type="button" className="product-cta-size-guide" onClick={onOpenSizeGuide}>
            Voir le guide des tailles
          </button>
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
          AJOUTER À MA SÉLECTION
        </button>

        <p className="product-cta-stripe">
          <i className="fa-solid fa-lock" style={{ marginRight: '6px', fontSize: '0.7rem' }} />
          Paiement 100% sécurisé via Stripe
        </p>
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
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false)

  const ctaRef = useRef<HTMLDivElement>(null)

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
      <div style={{ marginTop: '-45px', background: '#1a1a1a' }}>
        <HeroSection
          product={product}
          onScrollToCta={() => ctaRef.current?.scrollIntoView({ behavior: 'smooth' })}
        />
        {sections.map(section => {
          if (section.type === 'IMAGE_TEXT') {
            return <ImageTextSection key={section.id} section={section} />
          }
          if (section.type === 'PRODUCT_CTA') {
            return (
              <div key={section.id} ref={ctaRef}>
                <ProductCtaSection
                  section={section}
                  product={product}
                  selectedSize={selectedSize}
                  noSizeError={noSizeError}
                  addError={addError}
                  onSelectSize={handleSelectSize}
                  onAddToCart={handleAddToCart}
                  onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
                />
              </div>
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

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />
    </>
  )
}