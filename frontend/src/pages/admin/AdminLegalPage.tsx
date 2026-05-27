// AdminLegalPage.tsx — Admin editor for legal documents
// TipTap WYSIWYG per section + @dnd-kit drag & drop reordering

import { useState, useEffect, useRef, useCallback } from 'react'
import type { AxiosError } from 'axios'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
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
import api from '../../lib/axios'
import type { LegalType } from '../../types/models.types'
import '../../styles/AdminLegalPage.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type DraftSection = {
  _draftId: string
  id?: number
  title: string
  content: string
}

type ApiValidationError = {
  message: string
  details?: { champ: string; message: string }[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEGAL_TYPES: LegalType[] = ['MENTIONS_LEGALES', 'CGV', 'RGPD']

const TYPE_LABELS: Record<LegalType, string> = {
  MENTIONS_LEGALES: 'Mentions légales',
  CGV: 'CGV',
  RGPD: 'RGPD',
}

// ─── TipTap editor ────────────────────────────────────────────────────────────

interface TiptapEditorProps {
  initialContent: string
  onChange: (html: string) => void
}

function TiptapEditor({ initialContent, onChange }: TiptapEditorProps) {
  // Ref pattern: onUpdate captures a stable ref, not the closure.
  // This ensures the editor always calls the latest onChange without re-initializing.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        protocols: ['http', 'https', 'mailto'],
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => onChangeRef.current(editor.getHTML()),
  })

  function handleAddLink() {
    const url = window.prompt('URL du lien (ex: https://... ou mailto:...)')
    if (!url || !editor) return
    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="legal-editor">
      <div className="legal-editor-toolbar">
        <button
          type="button"
          title="Gras"
          className={`legal-toolbar-btn${editor?.isActive('bold') ? ' legal-toolbar-btn--active' : ''}`}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          title="Italique"
          className={`legal-toolbar-btn${editor?.isActive('italic') ? ' legal-toolbar-btn--active' : ''}`}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </button>

        <div className="legal-toolbar-sep" />

        <button
          type="button"
          title="Liste à puces"
          className={`legal-toolbar-btn${editor?.isActive('bulletList') ? ' legal-toolbar-btn--active' : ''}`}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <i className="fa-solid fa-list-ul" />
        </button>
        <button
          type="button"
          title="Liste numérotée"
          className={`legal-toolbar-btn${editor?.isActive('orderedList') ? ' legal-toolbar-btn--active' : ''}`}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <i className="fa-solid fa-list-ol" />
        </button>

        <div className="legal-toolbar-sep" />

        <button
          type="button"
          title="Ajouter un lien"
          className={`legal-toolbar-btn${editor?.isActive('link') ? ' legal-toolbar-btn--active' : ''}`}
          onClick={handleAddLink}
        >
          <i className="fa-solid fa-link" />
        </button>
        <button
          type="button"
          title="Supprimer le lien"
          className="legal-toolbar-btn"
          onClick={() => editor?.chain().focus().unsetLink().run()}
          disabled={!editor?.isActive('link')}
        >
          <i className="fa-solid fa-link-slash" />
        </button>
      </div>

      <EditorContent editor={editor} className="legal-editor-body" />
    </div>
  )
}

// ─── Sortable section card ────────────────────────────────────────────────────

interface SortableSectionProps {
  section: DraftSection
  onTitleChange: (draftId: string, title: string) => void
  onContentChange: (draftId: string, content: string) => void
  onDelete: (draftId: string) => void
}

function SortableLegalSection({
  section,
  onTitleChange,
  onContentChange,
  onDelete,
}: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section._draftId })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
      }}
      className="legal-card"
    >
      {/* ── Card header ── */}
      <div className="legal-card-header">
        <button
          type="button"
          className="legal-card-handle"
          aria-label="Réorganiser la clause"
          {...attributes}
          {...listeners}
        >
          <i className="fa-solid fa-grip-vertical" />
        </button>

        <input
          type="text"
          className="legal-card-title-input"
          value={section.title}
          onChange={e => onTitleChange(section._draftId, e.target.value)}
          placeholder="Titre de la clause…"
        />

        <button
          type="button"
          className="legal-card-delete"
          title="Supprimer cette clause"
          onClick={() => onDelete(section._draftId)}
        >
          <i className="fa-solid fa-trash" />
        </button>
      </div>

      {/* ── TipTap editor ── */}
      <TiptapEditor
        initialContent={section.content}
        onChange={html => onContentChange(section._draftId, html)}
      />
    </div>
  )
}

// ─── AdminLegalPage ───────────────────────────────────────────────────────────

export default function AdminLegalPage() {
  const [activeType, setActiveType] = useState<LegalType>('MENTIONS_LEGALES')
  const [sections, setSections] = useState<DraftSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [globalError, setGlobalError] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  // ─── Load document ────────────────────────────────────────────────────────

  const loadDocument = useCallback((type: LegalType) => {
    setIsLoading(true)
    setSaveStatus('idle')
    setGlobalError(null)

    api
      .get<{
        sections: Array<{ id: number; title: string; content: string; position: number }>
      }>(`/legal/${type}`)
      .then(res => {
        setSections(
          res.data.sections.map(s => ({
            _draftId: crypto.randomUUID(),
            id: s.id,
            title: s.title,
            content: s.content,
          }))
        )
      })
      .catch(() => setGlobalError('Impossible de charger ce document.'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    loadDocument(activeType)
  }, [activeType, loadDocument])

  // ─── Section handlers ─────────────────────────────────────────────────────

  function handleTitleChange(draftId: string, title: string) {
    setSections(prev =>
      prev.map(s => (s._draftId === draftId ? { ...s, title } : s))
    )
  }

  function handleContentChange(draftId: string, content: string) {
    setSections(prev =>
      prev.map(s => (s._draftId === draftId ? { ...s, content } : s))
    )
  }

  function handleDelete(draftId: string) {
    setSections(prev => prev.filter(s => s._draftId !== draftId))
  }

  function handleAddSection() {
    setSections(prev => [
      ...prev,
      { _draftId: crypto.randomUUID(), title: '', content: '<p></p>' },
    ])
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSections(prev => {
      const oldIndex = prev.findIndex(s => s._draftId === active.id)
      const newIndex = prev.findIndex(s => s._draftId === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    setIsSaving(true)
    setSaveStatus('idle')
    setGlobalError(null)

    try {
      await api.put(`/admin/legal/${activeType}`, {
        sections: sections.map((s, i) => ({
          title: s.title,
          content: s.content,
          position: i,
        })),
      })
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      const axiosError = error as AxiosError<ApiValidationError>
      setGlobalError(
        axiosError.response?.data?.message ?? 'Erreur lors de la sauvegarde.'
      )
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ height: '115px' }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 40px 80px' }}>

        {/* ── Header ── */}
        <h1 style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '3rem',
          fontWeight: 400,
          color: '#212529',
          marginBottom: '40px',
        }}>
          Textes légaux
        </h1>

        {/* ── Document tabs ── */}
        <div className="legal-admin-tabs">
          {LEGAL_TYPES.map(type => (
            <button
              key={type}
              type="button"
              className={`legal-admin-tab${activeType === type ? ' legal-admin-tab--active' : ''}`}
              onClick={() => setActiveType(type)}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* ── Actions bar ── */}
        <div className="legal-admin-bar">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={handleAddSection}
            disabled={isLoading}
          >
            <i className="fa-solid fa-plus" style={{ marginRight: '8px' }} />
            Ajouter une clause
          </button>

          <div className="legal-admin-bar-right">
            {saveStatus === 'success' && (
              <span className="legal-feedback legal-feedback--success">
                <i className="fa-solid fa-circle-check" />
                Enregistré
              </span>
            )}
            {globalError && (
              <span className="legal-feedback legal-feedback--error">{globalError}</span>
            )}
            <button
              type="button"
              className="admin-btn-primary"
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} />
                  Enregistrement…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk" style={{ marginRight: '8px' }} />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {isLoading && (
          <div style={{ marginTop: '24px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: '200px',
                  marginBottom: '16px',
                  background:
                    'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            ))}
          </div>
        )}

        {/* ── Sortable section list ── */}
        {!isLoading && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map(s => s._draftId)}
              strategy={verticalListSortingStrategy}
            >
              {/* key=activeType forces full remount of editors on tab switch */}
              <div
                key={activeType}
                style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {sections.map(section => (
                  <SortableLegalSection
                    key={section._draftId}
                    section={section}
                    onTitleChange={handleTitleChange}
                    onContentChange={handleContentChange}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* ── Empty state ── */}
        {!isLoading && sections.length === 0 && (
          <p style={{
            fontFamily: 'CenturySchoolbook, serif',
            color: '#6c757d',
            textAlign: 'center',
            padding: '64px 0',
          }}>
            Aucune clause pour ce document. Cliquez sur "Ajouter une clause" pour commencer.
          </p>
        )}

      </div>
    </>
  )
}
