// ProductSectionEditor.tsx — WYSIWYG section builder for AdminProductFormPage
// IMAGE_TEXT sections: outer DnD context (sortable, deletable)
// PRODUCT_CTA section: anchored below, outside DnD, permanent — contains:
//   - Internal DnD for spec blocks (flat list → left/right rehydration)
//   - Sizes management module (chips + stock inputs + add buttons)
//   - Magic wand sync (full text, no truncation)
//   - Real save button wired to parent onSave handler

import React, { useRef, useEffect, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import api from '../lib/axios'
import type { DraftSection } from '../pages/admin/AdminProductFormPage'
import type {
  CtaSpecs,
  SpecSection,
  SpecItem,
  DraftSize,
} from '../types/models.types'

import '../styles/ProductPage.css'
import '../styles/ProductSectionEditor.css'

// ─── Ghost inputs ─────────────────────────────────────────────────────────────

interface GhostInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

function GhostInput({ value, onChange, placeholder, className, style }: GhostInputProps) {
  return (
    <input
      type="text"
      className={`admin-ghost-input${className ? ` ${className}` : ''}`}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={style}
    />
  )
}

// Auto-resizes to content via scrollHeight — used by ImageTextEditor and spec freetext blocks
function GhostTextarea({ value, onChange, placeholder, className, style }: GhostInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [value])

  return (
    <textarea
      ref={ref}
      className={`admin-ghost-input admin-ghost-textarea${className ? ` ${className}` : ''}`}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      style={style}
    />
  )
}

// ─── SortableSection ──────────────────────────────────────────────────────────
// Wraps IMAGE_TEXT sections — controls bar at top, add-below button at bottom edge
// Add-below: absolutely positioned, revealed on hover, inserts immediately after this section

interface SortableSectionProps {
  section: DraftSection
  onUpdate: (patch: Partial<DraftSection>) => void
  onDelete: () => void
  onImageUpload: (file: File) => Promise<void>
  onAddBelow: () => void
  children: React.ReactNode
}

function SortableSection({ section, onUpdate, onDelete, onImageUpload, onAddBelow, children }: SortableSectionProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section._draftId })

  return (
    <div
      ref={setNodeRef}
      className="section-editor-wrap"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      {/* Controls bar — revealed on section hover */}
      <div className="section-editor-controls">
        <div className="section-editor-controls-left">
          <button
            type="button"
            className="section-editor-btn"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            title="Déplacer"
            {...attributes}
            {...listeners}
          >
            <i className="fa-solid fa-grip-lines" />
          </button>

          <button
            type="button"
            className={`section-editor-btn${section.mirrorBackground ? ' section-editor-btn--active' : ''}`}
            onClick={() => onUpdate({ mirrorBackground: !section.mirrorBackground })}
            title="Miroir horizontal"
          >
            <i className="fa-solid fa-left-right" />
          </button>

          <button
            type="button"
            className="section-editor-btn"
            onClick={() => onUpdate({ textSide: section.textSide === 'LEFT' ? 'RIGHT' : 'LEFT' })}
            title={section.textSide === 'LEFT' ? 'Texte à gauche' : 'Texte à droite'}
          >
            <i className={`fa-solid fa-align-${section.textSide === 'LEFT' ? 'left' : 'right'}`} />
          </button>

          <button
            type="button"
            className="section-editor-btn"
            onClick={() => imageInputRef.current?.click()}
            title="Changer l'image de fond"
          >
            <i className="fa-solid fa-image" />
          </button>

          <button
            type="button"
            className={`section-editor-btn${section.textMode ? ' section-editor-btn--active' : ''}`}
            onClick={() => onUpdate({ textMode: !section.textMode })}
            title={section.textMode ? 'Mode texte libre (actif)' : 'Basculer en texte libre'}
          >
            <i className="fa-solid fa-align-justify" />
          </button>
        </div>

        <div className="section-editor-controls-right">
          <span className="section-editor-type-badge">Image & Texte</span>
          <button
            type="button"
            className="section-editor-btn section-editor-btn--danger"
            onClick={onDelete}
            title="Supprimer cette section"
          >
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onImageUpload(file)
          e.target.value = ''
        }}
      />

      {children}

      {/* Add-below button — centered at section bottom edge, revealed on section hover */}
      {/* Hidden during drag to avoid visual noise */}
      {!isDragging && (
        <button
          type="button"
          className="section-editor-add-below-btn"
          onClick={e => { e.stopPropagation(); onAddBelow() }}
          title="Insérer une section Image & Texte ici"
          aria-label="Insérer une section ici"
        >
          <i className="fa-solid fa-plus" />
        </button>
      )}
    </div>
  )
}

// ─── ImageTextEditor ──────────────────────────────────────────────────────────
// Visual clone of ImageTextSection (ProductPage) with ghost inputs overlaid
// reveal-up--visible forced — no scroll animation in admin context

function ImageTextEditor({ section, onUpdate }: {
  section: DraftSection
  onUpdate: (patch: Partial<DraftSection>) => void
}) {
  const imageUrl = section._imagePreview ?? section.imageUrl
  const textOnLeft = section.textSide === 'LEFT'

  const pairs: {
    textKey: keyof DraftSection
    descKey: keyof DraftSection
    tPlaceholder: string
    dPlaceholder: string
  }[] = [
      { textKey: 'text2', descKey: 'desc2', tPlaceholder: 'Caractéristique', dPlaceholder: 'Valeur' },
      { textKey: 'text3', descKey: 'desc3', tPlaceholder: 'Caractéristique', dPlaceholder: 'Valeur' },
      { textKey: 'text4', descKey: 'desc4', tPlaceholder: 'Caractéristique', dPlaceholder: 'Valeur' },
    ]

  return (
    <div className="product-section reveal-up reveal-up--visible">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="product-section-img"
          style={section.mirrorBackground ? { transform: 'scaleX(-1)' } : undefined}
        />
      ) : (
        <div className="section-editor-img-empty">
          <i className="fa-regular fa-image" />
          <span>Utilisez le bouton image dans la barre de contrôle pour ajouter un fond</span>
        </div>
      )}

      <div className="product-section-overlay">
        <div className={`product-overlay-content product-overlay-content--${textOnLeft ? 'left' : 'right'}`}>

          <GhostInput
            value={section.title1}
            onChange={v => onUpdate({ title1: v })}
            placeholder="TITRE DE SECTION"
            style={{
              fontFamily: 'CenturySchoolbook, serif',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '3px',
              marginBottom: '16px',
              display: 'block',
              textTransform: 'uppercase',
            }}
          />

          {section.textMode ? (
            <GhostTextarea
              value={section.description1}
              onChange={v => onUpdate({ description1: v })}
              placeholder="Texte libre de la section…"
              style={{
                fontFamily: 'CenturySchoolbook, serif',
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.65)',
                lineHeight: '1.8',
                display: 'block',
                minHeight: '80px',
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {pairs.map((pair, i) => (
                <div key={i} className="section-editor-pair">
                  <GhostInput
                    value={section[pair.textKey] as string}
                    onChange={v => onUpdate({ [pair.textKey]: v })}
                    placeholder={pair.tPlaceholder}
                    style={{
                      fontFamily: 'CenturySchoolbook, serif',
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.55)',
                      letterSpacing: '1px',
                    }}
                  />
                  <GhostInput
                    value={section[pair.descKey] as string}
                    onChange={v => onUpdate({ [pair.descKey]: v })}
                    placeholder={pair.dPlaceholder}
                    style={{
                      fontFamily: 'CenturySchoolbook, serif',
                      fontSize: '0.875rem',
                      color: '#DFCF95',
                      letterSpacing: '0.5px',
                      textAlign: 'right',
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SortableSpecBlock ────────────────────────────────────────────────────────

function SortableSpecBlock({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      className="section-editor-spec-sortable"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <button
        type="button"
        className="section-editor-spec-drag-handle"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        title="Réorganiser ce bloc"
        {...attributes}
        {...listeners}
      >
        <i className="fa-solid fa-grip-vertical" />
      </button>
      {children}
    </div>
  )
}

// ─── ProductCtaEditor ─────────────────────────────────────────────────────────

interface ProductCtaEditorProps {
  section: DraftSection
  onUpdate: (patch: Partial<DraftSection>) => void
  allSections: DraftSection[]
  sizes: DraftSize[]
  availableSizes: string[]
  onAddSize: (size: string) => void
  onUpdateSizeStock: (draftId: string, stock: number) => void
  onRemoveSize: (draftId: string) => void
  sizesError?: string
  onSave: () => void
  isSaving?: boolean
}

function ProductCtaEditor({
  section,
  onUpdate,
  allSections,
  sizes,
  availableSizes,
  onAddSize,
  onUpdateSizeStock,
  onRemoveSize,
  sizesError,
  onSave,
  isSaving,
}: ProductCtaEditorProps) {

  // ── Flat spec blocks — [L0, R0, L1, R1, L2, R2] ───────────────────────
  const flatBlocks = useMemo(() => {
    const left = section.specs?.left ?? []
    const right = section.specs?.right ?? []
    const result: Array<{ id: string; block: SpecSection }> = []
    const maxLen = Math.max(left.length, right.length)
    for (let i = 0; i < maxLen; i++) {
      if (left[i]) result.push({ id: `spec-l${i}`, block: left[i] })
      if (right[i]) result.push({ id: `spec-r${i}`, block: right[i] })
    }
    return result
  }, [section.specs])

  function rehydrateFromFlat(flat: Array<{ id: string; block: SpecSection }>): CtaSpecs {
    const left: SpecSection[] = []
    const right: SpecSection[] = []
    flat.forEach((item, i) => {
      if (i % 2 === 0) left.push(item.block)
      else right.push(item.block)
    })
    return { left, right }
  }

  // ── Spec DnD — fully isolated from outer IMAGE_TEXT context ───────────
  const specSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleSpecDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = flatBlocks.findIndex(b => b.id === active.id)
    const newIdx = flatBlocks.findIndex(b => b.id === over.id)
    onUpdate({ specs: rehydrateFromFlat(arrayMove(flatBlocks, oldIdx, newIdx)) })
  }

  // ── Flat block helpers ─────────────────────────────────────────────────

  function updateBlock(flatIdx: number, patch: Partial<SpecSection>) {
    const updated = flatBlocks.map((item, i) =>
      i === flatIdx ? { ...item, block: { ...item.block, ...patch } } : item
    )
    onUpdate({ specs: rehydrateFromFlat(updated) })
  }

  function removeBlock(flatIdx: number) {
    onUpdate({ specs: rehydrateFromFlat(flatBlocks.filter((_, i) => i !== flatIdx)) })
  }

  function addBlock() {
    if (flatBlocks.length >= 6) return
    const newBlock: SpecSection = { title: '', items: [{ label: '', value: '' }] }
    onUpdate({
      specs: rehydrateFromFlat([
        ...flatBlocks,
        { id: `spec-new-${Date.now()}`, block: newBlock },
      ]),
    })
  }

  function addItem(flatIdx: number) {
    const items = [...(flatBlocks[flatIdx].block.items ?? []), { label: '', value: '' }]
    updateBlock(flatIdx, { items })
  }

  function updateItem(flatIdx: number, iIdx: number, patch: Partial<SpecItem>) {
    const items = (flatBlocks[flatIdx].block.items ?? []).map((item, j) =>
      j === iIdx ? { ...item, ...patch } : item
    )
    updateBlock(flatIdx, { items })
  }

  function removeItem(flatIdx: number, iIdx: number) {
    const items = (flatBlocks[flatIdx].block.items ?? []).filter((_, j) => j !== iIdx)
    updateBlock(flatIdx, { items })
  }

  // Replace the entire block to cleanly switch modes
  function replaceBlock(flatIdx: number, newBlock: SpecSection) {
    const updated = flatBlocks.map((item, i) =>
      i === flatIdx ? { ...item, block: newBlock } : item
    )
    onUpdate({ specs: rehydrateFromFlat(updated) })
  }

  function switchBlockMode(flatIdx: number) {
    const block = flatBlocks[flatIdx].block
    if (block.text !== undefined) {
      // Text → items
      replaceBlock(flatIdx, { title: block.title, items: [{ label: '', value: '' }] })
    } else {
      // Items → text
      replaceBlock(flatIdx, { title: block.title, text: '' })
    }
  }

  // ── Sync — full text transferred, no truncation ────────────────────────
  function handleSync() {
    const left: SpecSection[] = []
    const right: SpecSection[] = []

    allSections.forEach((s, i) => {
      let block: SpecSection | null = null

      if (s.textMode) {
        if (!s.description1?.trim()) return
        // Complete description1 — no truncation
        block = {
          title: s.title1?.trim() || `Section ${i + 1}`,
          text: s.description1.trim(),
        }
      } else {
        const items = [
          s.text2 && s.desc2 ? { label: s.text2, value: s.desc2 } : null,
          s.text3 && s.desc3 ? { label: s.text3, value: s.desc3 } : null,
          s.text4 && s.desc4 ? { label: s.text4, value: s.desc4 } : null,
        ].filter((item): item is SpecItem => item !== null)
        if (items.length === 0) return
        block = { title: s.title1?.trim() || `Section ${i + 1}`, items }
      }

      if (block) left.length <= right.length ? left.push(block) : right.push(block)
    })

    onUpdate({ specs: { left, right } })
  }

  return (
    <div className="product-cta-section section-editor-cta">

      <div className="section-editor-sync-bar">
        <button
          type="button"
          className="section-editor-sync-btn"
          onClick={handleSync}
          title="Pré-remplir depuis les sections IMAGE_TEXT"
        >
          <i className="fa-solid fa-wand-magic-sparkles" />
          Synchroniser depuis les sections
        </button>
      </div>

      {/* Spec blocks grid with internal DnD */}
      <DndContext
        sensors={specSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSpecDragEnd}
      >
        <div className="product-cta-specs-grid reveal-up reveal-up--visible">
          <SortableContext
            items={flatBlocks.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {flatBlocks.map(({ id, block }, flatIdx) => (
              <SortableSpecBlock key={id} id={id}>
                <div className="product-cta-spec-section section-editor-spec-block">

                  <div className="section-editor-spec-header">
                    <input
                      type="text"
                      className="admin-ghost-input product-cta-spec-title"
                      value={block.title}
                      onChange={e => updateBlock(flatIdx, { title: e.target.value })}
                      placeholder="Titre du bloc"
                    />
                    {/* Mode toggle — mirrors the textMode button in ImageTextEditor */}
                    <button
                      type="button"
                      className={`section-editor-spec-mode-btn${block.text !== undefined ? ' section-editor-spec-mode-btn--active' : ''}`}
                      onClick={() => switchBlockMode(flatIdx)}
                      title={block.text !== undefined ? 'Passer en mode clé/valeur' : 'Passer en mode texte libre'}
                    >
                      <i className={`fa-solid fa-${block.text !== undefined ? 'list' : 'align-justify'}`} />
                    </button>
                    <button
                      type="button"
                      className="section-editor-spec-remove"
                      onClick={() => removeBlock(flatIdx)}
                      title="Supprimer ce bloc"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>

                  <div className="product-cta-spec-line" />

                  {/* Free text mode — GhostTextarea handles auto-resize via scrollHeight */}
                  {block.text !== undefined ? (
                    <GhostTextarea
                      value={block.text}
                      onChange={v => updateBlock(flatIdx, { text: v })}
                      placeholder="Texte libre…"
                      className="section-editor-spec-freetext"
                    />
                  ) : (
                    <div className="product-cta-spec-items">
                      {(block.items ?? []).map((item, iIdx) => (
                        <div key={iIdx} className="product-cta-spec-item section-editor-spec-item-row">
                          <input
                            type="text"
                            className="admin-ghost-input product-cta-spec-label"
                            value={item.label}
                            onChange={e => updateItem(flatIdx, iIdx, { label: e.target.value })}
                            placeholder="Caractéristique"
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              className="admin-ghost-input product-cta-spec-value"
                              value={item.value}
                              onChange={e => updateItem(flatIdx, iIdx, { value: e.target.value })}
                              placeholder="Valeur"
                            />
                            {(block.items ?? []).length > 1 && (
                              <button
                                type="button"
                                className="section-editor-spec-remove"
                                onClick={() => removeItem(flatIdx, iIdx)}
                              >
                                <i className="fa-solid fa-xmark" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {(block.items ?? []).length < 4 && (
                        <button
                          type="button"
                          className="section-editor-spec-add-item"
                          onClick={() => addItem(flatIdx)}
                        >
                          + Ligne
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </SortableSpecBlock>
            ))}
          </SortableContext>

          {flatBlocks.length < 6 && (
            <div className="section-editor-spec-empty">
              <button
                type="button"
                className="section-editor-spec-add-block"
                onClick={addBlock}
              >
                <i className="fa-solid fa-plus" />
                <span>Ajouter un bloc</span>
              </button>
            </div>
          )}
        </div>
      </DndContext>

      {/* Purchase zone — sizes + save button */}
      <div className="product-cta-bottom reveal-up reveal-up--visible">

        <p style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '2px',
          marginBottom: '20px',
        }}>
          TAILLE
        </p>

        <div className="section-editor-sizes-row">
          {sizes.map(s => (
            <div key={s._draftId} className="section-editor-size-chip">
              <span className="section-editor-size-chip-name">{s.size}</span>
              <input
                type="number"
                className="admin-ghost-input section-editor-size-stock"
                min="0"
                value={s.stock === 0 ? '' : s.stock}
                onChange={e => onUpdateSizeStock(s._draftId, parseInt(e.target.value) || 0)}
                placeholder="0"
                title="Stock"
              />
              <span className="section-editor-size-chip-unit">en stock</span>
              <button
                type="button"
                className="section-editor-size-chip-remove"
                onClick={() => onRemoveSize(s._draftId)}
                title="Supprimer cette taille"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          ))}

          {availableSizes.map(size => (
            <button
              key={size}
              type="button"
              className="section-editor-size-add"
              onClick={() => onAddSize(size)}
            >
              <i className="fa-solid fa-plus" />
              {size}
            </button>
          ))}
        </div>

        {sizesError && (
          <p className="section-editor-sizes-error">{sizesError}</p>
        )}

        {/* Real save button — replaces the decorative "AJOUTER À MA SÉLECTION" */}
        <button
          type="button"
          className="section-editor-cta-save-btn"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }} />Enregistrement…</>
          ) : (
            'ENREGISTRER LES MODIFICATIONS'
          )}
        </button>

      </div>

    </div>
  )
}

// ─── ProductSectionEditor ─────────────────────────────────────────────────────

interface ProductSectionEditorProps {
  sections: DraftSection[]
  onChange: (sections: DraftSection[]) => void
  sizes: DraftSize[]
  availableSizes: string[]
  onAddSize: (size: string) => void
  onUpdateSizeStock: (draftId: string, stock: number) => void
  onRemoveSize: (draftId: string) => void
  sizesError?: string
  onSave: () => void
  isSaving?: boolean
}

export default function ProductSectionEditor({
  sections,
  onChange,
  sizes,
  availableSizes,
  onAddSize,
  onUpdateSizeStock,
  onRemoveSize,
  sizesError,
  onSave,
  isSaving,
}: ProductSectionEditorProps) {

  const imageSections = sections.filter(s => s.type === 'IMAGE_TEXT')
  const ctaSection = sections.find(s => s.type === 'PRODUCT_CTA') ?? {
  _draftId: 'default-cta',
  type: 'PRODUCT_CTA' as const,
  imageUrl: null,
  mirrorBackground: false,
  textSide: 'LEFT' as const,
  title1: '', description1: '',
  text2: '', desc2: '',
  text3: '', desc3: '',
  text4: '', desc4: '',
  specs: { left: [], right: [] },
  textMode: false,
}

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = imageSections.findIndex(s => s._draftId === active.id)
    const newIdx = imageSections.findIndex(s => s._draftId === over.id)
    handleImageSectionsChange(arrayMove(imageSections, oldIdx, newIdx))
  }

  function handleImageSectionsChange(updated: DraftSection[]) {
    onChange([...updated, ctaSection])
  }

  function handleCtaUpdate(patch: Partial<DraftSection>) {
    onChange([...imageSections, { ...ctaSection, ...patch }])
  }

  function updateSection(draftId: string, patch: Partial<DraftSection>) {
    handleImageSectionsChange(
      imageSections.map(s => s._draftId === draftId ? { ...s, ...patch } : s)
    )
  }

  function deleteSection(draftId: string) {
    handleImageSectionsChange(imageSections.filter(s => s._draftId !== draftId))
  }

  async function uploadSectionImage(draftId: string, file: File) {
    const previewUrl = URL.createObjectURL(file)
    updateSection(draftId, { _imagePreview: previewUrl })
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await api.post<{ url: string }>('/admin/products/upload-image', formData)
      updateSection(draftId, { imageUrl: data.url, _imagePreview: undefined })
      URL.revokeObjectURL(previewUrl)
    } catch {
      updateSection(draftId, { _imagePreview: undefined })
      URL.revokeObjectURL(previewUrl)
    }
  }

  // Inserts a new IMAGE_TEXT section immediately after the target
  // findIndex returns -1 when targetId has no match (empty state) → splice at 0
  function addImageSectionBelow(targetId: string) {
    const newSection: DraftSection = {
      _draftId: crypto.randomUUID(),
      type: 'IMAGE_TEXT',
      imageUrl: null,
      mirrorBackground: false,
      textSide: 'LEFT',
      title1: '', description1: '',
      text2: '', desc2: '',
      text3: '', desc3: '',
      text4: '', desc4: '',
      specs: null,
      textMode: false,
    }
    const targetIdx = imageSections.findIndex(s => s._draftId === targetId)
    const updated = [...imageSections]
    updated.splice(targetIdx + 1, 0, newSection)
    handleImageSectionsChange(updated)
  }

  return (
    <div className="section-editor">

      {/* IMAGE_TEXT sections — drag & drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={imageSections.map(s => s._draftId)}
          strategy={verticalListSortingStrategy}
        >
          {imageSections.map(section => (
            <SortableSection
              key={section._draftId}
              section={section}
              onUpdate={patch => updateSection(section._draftId, patch)}
              onDelete={() => deleteSection(section._draftId)}
              onImageUpload={file => uploadSectionImage(section._draftId, file)}
              onAddBelow={() => addImageSectionBelow(section._draftId)}
            >
              <ImageTextEditor
                section={section}
                onUpdate={patch => updateSection(section._draftId, patch)}
              />
            </SortableSection>
          ))}
        </SortableContext>
      </DndContext>

      {/* Empty state — shown when no IMAGE_TEXT sections exist */}
      {imageSections.length === 0 && (
        <div className="section-editor-empty">
          <button
            type="button"
            className="section-editor-empty-add"
            onClick={() => addImageSectionBelow('')}
          >
            <i className="fa-solid fa-plus" />
            <span>Ajouter une première section</span>
          </button>
        </div>
      )}

      {/* PRODUCT_CTA — anchored below, outside DnD, permanent */}
      <ProductCtaEditor
        section={ctaSection}
        onUpdate={handleCtaUpdate}
        allSections={imageSections}
        sizes={sizes}
        availableSizes={availableSizes}
        onAddSize={onAddSize}
        onUpdateSizeStock={onUpdateSizeStock}
        onRemoveSize={onRemoveSize}
        sizesError={sizesError}
        onSave={onSave}
        isSaving={isSaving}
      />

    </div>
  )
}
