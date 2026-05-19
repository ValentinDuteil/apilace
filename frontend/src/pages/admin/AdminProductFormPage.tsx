// AdminProductFormPage.tsx — Admin product creation and editing for Apilace
// Full WYSIWYG layout — mirrors the visual structure of the public ProductPage
//
// Floating panel : gear FAB (bottom-right) · slide-in from right
//                  back · slug · active toggle · save · feedback
// Hero           : name · tagline · price as ghost inputs over background image
//                  present in both create (empty) and edit (pre-filled) modes
// Description    : ghost textarea — hover text on product card in catalogue
// Sections       : ProductSectionEditor (IMAGE_TEXT dnd + anchored CTA with sizes)

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { AxiosError } from 'axios'
import api from '../../lib/axios'
import ProductSectionEditor from '../../components/ProductSectionEditor'
import type {
  ProductWithRelations,
  ProductImage,
  ProductSection,
  ProductSize,
  SectionType,
  TextSide,
  CtaSpecs,
  DraftSize,
} from '../../types/models.types'
import '../../styles/AdminProductFormPage.css'

// ─── Draft types ──────────────────────────────────────────────────────────────

export interface DraftSection {
  _draftId: string
  id?: number
  type: SectionType
  imageUrl: string | null
  _imagePreview?: string
  mirrorBackground: boolean
  textSide: TextSide
  title1: string
  description1: string
  text2: string
  desc2: string
  text3: string
  desc3: string
  text4: string
  desc4: string
  specs: CtaSpecs | null
  textMode: boolean
}

interface ProductDraft {
  name: string
  slug: string
  tagline: string
  description: string
  price: string
  isActive: boolean
  sizes: DraftSize[]
  sections: DraftSection[]
  images: ProductImage[]
}

type ApiValidationError = {
  message: string
  details?: { champ: string; message: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newDraftId(): string {
  return crypto.randomUUID()
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function sectionToDraft(s: ProductSection): DraftSection {
  return {
    _draftId: newDraftId(),
    id: s.id,
    type: s.type,
    imageUrl: s.imageUrl,
    mirrorBackground: s.mirrorBackground,
    textSide: s.textSide,
    title1: s.title1 ?? '',
    description1: s.description1 ?? '',
    text2: s.text2 ?? '',
    desc2: s.desc2 ?? '',
    text3: s.text3 ?? '',
    desc3: s.desc3 ?? '',
    text4: s.text4 ?? '',
    desc4: s.desc4 ?? '',
    specs: s.specs,
    textMode: false,
  }
}

function sizeToDraft(s: ProductSize): DraftSize {
  return { _draftId: newDraftId(), size: s.size, stock: s.stock }
}

function makeDefaultCtaSection(): DraftSection {
  return {
    _draftId: newDraftId(),
    type: 'PRODUCT_CTA',
    imageUrl: null,
    mirrorBackground: false,
    textSide: 'LEFT',
    title1: '',
    description1: '',
    text2: '', desc2: '',
    text3: '', desc3: '',
    text4: '', desc4: '',
    specs: { left: [], right: [] },
    textMode: false,
  }
}

function emptyDraft(): ProductDraft {
  return {
    name: '',
    slug: '',
    tagline: '',
    description: '',
    price: '',
    isActive: true,
    sizes: [],
    sections: [makeDefaultCtaSection()],
    images: [],
  }
}

function buildPayload(draft: ProductDraft, isEditing: boolean) {
  const base = {
    name: draft.name || undefined,
    tagline: draft.tagline || undefined,
    description: draft.description || undefined,
    price: draft.price ? parseFloat(draft.price) : undefined,
    isActive: draft.isActive,
    sizes: draft.sizes.map(s => ({ size: s.size, stock: s.stock })),
    sections: draft.sections.map((s, i) => ({
      type: s.type,
      position: i,
      imageUrl: s.imageUrl || null,
      mirrorBackground: s.mirrorBackground,
      textSide: s.textSide,
      title1: s.title1 || null,
      description1: s.description1 || null,
      text2: s.text2 || null,
      desc2: s.desc2 || null,
      text3: s.text3 || null,
      desc3: s.desc3 || null,
      text4: s.text4 || null,
      desc4: s.desc4 || null,
      specs: s.specs,
    })),
  }

  if (!isEditing) {
    return { ...base, slug: draft.slug }
  }

  return base
}

const SIZE_OPTIONS = ['S', 'M', 'L', 'Standard'] as const

// ─── FloatingActions ──────────────────────────────────────────────────────────

interface FloatingActionsProps {
  isOpen: boolean
  onToggle: () => void
  isEditing: boolean
  slug: string
  onSlugChange: (slug: string) => void
  isActive: boolean
  onToggleActive: () => void
  isSaving: boolean
  onSave: () => void
  globalError: string | null
}

function FloatingActions({
  isOpen,
  onToggle,
  isEditing,
  slug,
  onSlugChange,
  isActive,
  onToggleActive,
  isSaving,
  onSave,
  globalError,
}: FloatingActionsProps) {
  return (
    <>
      {isOpen && (
        <div className="ap-form__panel-overlay" onClick={onToggle} />
      )}

      <div
        className={`ap-form__panel${isOpen ? ' ap-form__panel--open' : ''}`}
        aria-hidden={!isOpen}
      >
        <div className="ap-form__panel-section ap-form__panel-section--top">
          <Link to="/admin/produits" className="ap-form__panel-back">
            <i className="fa-solid fa-arrow-left" />
            <span>Retour aux produits</span>
          </Link>
        </div>

        <div className="ap-form__panel-section">
          <p className="ap-form__panel-label">Slug</p>
          <div className="ap-form__panel-slug">
            <span className="ap-form__panel-slug-prefix">/</span>
            {isEditing ? (
              <span className="ap-form__panel-slug-value">{slug || '—'}</span>
            ) : (
              <input
                className="ap-form__panel-slug-input"
                type="text"
                value={slug}
                onChange={e => onSlugChange(e.target.value)}
                placeholder="slug-du-produit"
                autoComplete="off"
              />
            )}
          </div>
        </div>

        <div className="ap-form__panel-section">
          <p className="ap-form__panel-label">Visibilité boutique</p>
          <button
            type="button"
            className={`ap-form__panel-toggle${isActive ? ' ap-form__panel-toggle--on' : ''}`}
            onClick={onToggleActive}
          >
            <span className="ap-form__panel-toggle-track">
              <span className="ap-form__panel-toggle-thumb" />
            </span>
            <span className="ap-form__panel-toggle-label">
              {isActive ? 'Actif — visible en boutique' : 'Inactif — masqué'}
            </span>
          </button>
        </div>

        <div className="ap-form__panel-section">
          <button
            type="button"
            className="admin-btn-primary ap-form__panel-save"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                Enregistrement…
              </>
            ) : isEditing ? 'Enregistrer' : 'Créer le produit'}
          </button>
        </div>

        {globalError && (
          <div className="ap-form__panel-section">
            <p className="ap-form__panel-feedback ap-form__panel-feedback--error">
              <i className="fa-solid fa-circle-exclamation" />
              {globalError}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        className={`ap-form__fab${isOpen ? ' ap-form__fab--open' : ''}`}
        onClick={onToggle}
        title={isOpen ? 'Fermer le panneau' : 'Paramètres du produit'}
        aria-label={isOpen ? 'Fermer le panneau' : 'Ouvrir le panneau de gestion'}
      >
        <i className="fa-solid fa-gear" />
      </button>
    </>
  )
}

// ─── AdminProductFormPage ─────────────────────────────────────────────────────

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const [draft, setDraft] = useState<ProductDraft>(emptyDraft())
  const [isLoading, setIsLoading] = useState(!!id)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [pendingHeroFile, setPendingHeroFile] = useState<File | null>(null)
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null)

  const heroImageInputRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  // ─── Load product ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return

    setIsLoading(true)
    setGlobalError(null)

    api.get<ProductWithRelations>(`/admin/products/${id}`)
      .then(({ data }) => {
        setDraft({
          name: data.name,
          slug: data.slug,
          tagline: data.tagline ?? '',
          description: data.description ?? '',
          price: String(Number(data.price)),
          isActive: data.isActive,
          sizes: data.sizes.map(sizeToDraft),
          sections: (() => {
            const mapped = [...data.sections]
              .sort((a, b) => a.position - b.position)
              .map(sectionToDraft)
            if (!mapped.some(s => s.type === 'PRODUCT_CTA')) {
              mapped.push(makeDefaultCtaSection())
            }
            return mapped
          })(),
          images: [...data.images].sort((a, b) => a.position - b.position),
        })
      })
      .catch(() => setGlobalError('Impossible de charger le produit.'))
      .finally(() => setIsLoading(false))
  }, [id])

  useEffect(() => {
    const el = descriptionRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft.description])

  // ─── Field helpers ─────────────────────────────────────────────────────────

  function setField<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
    setFieldErrors(prev => {
      if (!prev[key as string]) return prev
      const next = { ...prev }
      delete next[key as string]
      return next
    })
  }

  function handleNameChange(name: string) {
    setDraft(prev => ({
      ...prev,
      name,
      ...(isEditing ? {} : { slug: toSlug(name) }),
    }))
    setFieldErrors(prev => {
      if (!prev['name']) return prev
      const next = { ...prev }
      delete next['name']
      return next
    })
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setIsSaving(true)
    setFieldErrors({})
    setGlobalError(null)

    try {
      const payload = buildPayload(draft, isEditing)

      if (isEditing) {
        // Edit mode — patch then preview
        await api.patch(`/admin/products/${id}`, payload)
        navigate(`/boutique/${draft.slug}`)
      } else {
        // Create mode — post, optionally upload hero, then go to editor
        const { data: newProduct } = await api.post<{ id: number }>('/admin/products', payload)

        if (pendingHeroFile) {
          // Clear state before any async work — prevents ERR_FILE_NOT_FOUND on next render
          const fileToUpload = pendingHeroFile
          const previewToRevoke = heroPreviewUrl
          setHeroPreviewUrl(null)
          setPendingHeroFile(null)

          try {
            const formData = new FormData()
            formData.append('image', fileToUpload)
            await api.post(`/admin/products/${newProduct.id}/images`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          } catch (uploadError) {
            const axiosError = uploadError as AxiosError<ApiValidationError>
            setGlobalError(
              axiosError.response?.data?.message ?? "Erreur lors de l'envoi de l'image."
            )
            setIsPanelOpen(true)
          } finally {
            if (previewToRevoke) URL.revokeObjectURL(previewToRevoke)
          }
        }

        // Always navigate — product was created regardless of image result
        navigate(`/admin/produits/${newProduct.id}/modifier`)
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiValidationError>
      const details = axiosError.response?.data?.details
      if (details?.length) {
        const errors: Record<string, string> = {}
        for (const { champ, message } of details) errors[champ] = message
        setFieldErrors(errors)
      } else {
        setGlobalError(axiosError.response?.data?.message ?? 'Une erreur est survenue.')
      }
      setIsPanelOpen(true)
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Hero image upload ─────────────────────────────────────────────────────

  async function handleHeroImageUpload(file: File) {
    const MAX_SIZE = 5 * 1024 * 1024 // 5 MB — matches Multer server limit
    if (file.size > MAX_SIZE) {
      setGlobalError('Image trop volumineuse — 5 Mo maximum.')
      setIsPanelOpen(true)
      return
    }

    if (isEditing) {
      // Edit mode — upload immediately, new image becomes primary (backend handles demotion)
      setIsUploadingImage(true)
      try {
        const formData = new FormData()
        formData.append('image', file)
        const { data } = await api.post<ProductImage>(
          `/admin/products/${id}/images`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        // Replace images in draft — new primary at the top
        setDraft(prev => ({
          ...prev,
          images: [data, ...prev.images.map(img => ({ ...img, isPrimary: false }))],
        }))
      } catch (error) {
        const axiosError = error as AxiosError<ApiValidationError>
        setGlobalError(
          axiosError.response?.data?.message ?? "Erreur lors de l'envoi de l'image."
        )
        setIsPanelOpen(true)
      } finally {
        setIsUploadingImage(false)
      }
    } else {
      // Create mode — local blob preview, upload deferred to handleSave
      if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl)
      const url = URL.createObjectURL(file)
      setPendingHeroFile(file)
      setHeroPreviewUrl(url)
    }
  }

  // ─── Size helpers ──────────────────────────────────────────────────────────

  const usedSizes = new Set(draft.sizes.map(s => s.size))
  const availableSizes = SIZE_OPTIONS.filter(s => !usedSizes.has(s))

  function addSize(size: string) {
    setDraft(prev => ({
      ...prev,
      sizes: [...prev.sizes, { _draftId: newDraftId(), size, stock: 0 }],
    }))
  }

  function updateSizeStock(draftId: string, stock: number) {
    setDraft(prev => ({
      ...prev,
      sizes: prev.sizes.map(s => s._draftId === draftId ? { ...s, stock } : s),
    }))
  }

  function removeSize(draftId: string) {
    setDraft(prev => ({ ...prev, sizes: prev.sizes.filter(s => s._draftId !== draftId) }))
  }

  // Primary image — blob preview in create mode, or isPrimary from API in edit mode
  const primaryImageUrl =
    heroPreviewUrl ??
    draft.images.find(img => img.isPrimary)?.url ??
    draft.images[0]?.url ??
    null

  // ─── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="ap-form" style={{ marginTop: '-45px' }}>
        <div className="ap-form__hero-skeleton" />
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="ap-form" style={{ marginTop: '-45px' }}>

      <FloatingActions
        isOpen={isPanelOpen}
        onToggle={() => setIsPanelOpen(v => !v)}
        isEditing={isEditing}
        slug={draft.slug}
        onSlugChange={v => setField('slug', v)}
        isActive={draft.isActive}
        onToggleActive={() => setField('isActive', !draft.isActive)}
        isSaving={isSaving}
        onSave={handleSave}
        globalError={globalError}
      />

      {/* ── Hero editor ───────────────────────────────────────────────────── */}
      <div className="ap-form__hero">

        {primaryImageUrl ? (
          <img src={primaryImageUrl} alt="" className="ap-form__hero-img" />
        ) : (
          <div className="ap-form__hero-empty">
            <i className="fa-regular fa-image" />
            <span>Cliquez sur le bouton caméra pour ajouter une image de fond</span>
          </div>
        )}

        <button
          type="button"
          className="ap-form__hero-upload-btn"
          onClick={() => heroImageInputRef.current?.click()}
          disabled={isUploadingImage}
          title="Changer l'image de fond"
        >
          {isUploadingImage
            ? <i className="fa-solid fa-spinner fa-spin" />
            : <i className="fa-solid fa-camera" />
          }
        </button>
        <input
          ref={heroImageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleHeroImageUpload(file)
            e.target.value = ''
          }}
        />

        <div className="ap-form__hero-overlay">
          <div className="ap-form__hero-content">

            <input
              className="ap-form__ghost ap-form__ghost--name"
              type="text"
              value={draft.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Nom du produit"
            />
            {fieldErrors['name'] && (
              <p className="ap-form__ghost-error">{fieldErrors['name']}</p>
            )}

            <input
              className="ap-form__ghost ap-form__ghost--tagline"
              type="text"
              value={draft.tagline}
              onChange={e => setField('tagline', e.target.value)}
              placeholder="Tagline du produit…"
            />

            <div className="ap-form__ghost-price-wrap">
              <input
                className="ap-form__ghost ap-form__ghost--price"
                type="number"
                min="0"
                step="0.01"
                value={draft.price}
                onChange={e => setField('price', e.target.value)}
                placeholder="15000"
              />
              <span className="ap-form__ghost-price-suffix">€</span>
            </div>
            {fieldErrors['price'] && (
              <p className="ap-form__ghost-error">{fieldErrors['price']}</p>
            )}

            <div className="ap-form__hero-cta-preview">AJOUTER À MA SÉLECTION</div>

          </div>
        </div>

      </div>

      {/* ── Description zone ──────────────────────────────────────────────── */}
      <div className="ap-form__description-zone">
        <div className="ap-form__description-header">
          <span className="ap-form__description-badge">
            <i className="fa-solid fa-eye" />
            Texte de survol — Catalogue
          </span>
        </div>
        <textarea
          ref={descriptionRef}
          className="ap-form__ghost ap-form__ghost--description"
          value={draft.description}
          onChange={e => {
            setField('description', e.target.value)
            const el = descriptionRef.current
            if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px` }
          }}
          rows={2}
          placeholder="Ce texte s'affiche au survol du produit dans le catalogue…"
        />
      </div>

      {/* ── Sections ──────────────────────────────────────────────────────── */}
      <ProductSectionEditor
        sections={draft.sections}
        onChange={sections => setField('sections', sections)}
        sizes={draft.sizes}
        availableSizes={availableSizes as string[]}
        onAddSize={addSize}
        onUpdateSizeStock={updateSizeStock}
        onRemoveSize={removeSize}
        sizesError={fieldErrors['sizes']}
        onSave={handleSave}
        isSaving={isSaving}
      />

    </div>
  )
}
