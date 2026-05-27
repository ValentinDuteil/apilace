// LegalPage.tsx — Public legal document page for Apilace
// Fetches sections from API and renders them with dangerouslySetInnerHTML

import { useState, useEffect } from 'react'
import type { AxiosError } from 'axios'
import api from '../lib/axios'
import type { LegalType } from '../types/models.types'
import '../styles/LegalPage.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type LegalSection = {
  id: number
  title: string
  content: string
  position: number
}

type LegalPageData = {
  id: number
  type: LegalType
  updatedAt: string
  sections: LegalSection[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<LegalType, string> = {
  MENTIONS_LEGALES: 'Mentions légales',
  CGV: "Conditions générales d'utilisation et de vente",
  RGPD: 'Politique de confidentialité',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LegalPage({ type }: { type: LegalType }) {
  const [page, setPage] = useState<LegalPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    setPage(null)
    api.get<LegalPageData>(`/legal/${type}`)
      .then(res => setPage(res.data))
      .catch((err: AxiosError<{ message: string }>) => {
        setError(err.response?.data?.message ?? 'Impossible de charger cette page.')
      })
      .finally(() => setIsLoading(false))
  }, [type])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <div style={{ height: '80px' }} />
        <div className="legal-container">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="legal-skeleton" />
          ))}
        </div>
      </>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────────

  if (error || !page) {
    return (
      <>
        <div style={{ height: '80px' }} />
        <div className="legal-container">
          <p className="legal-error">{error ?? 'Page introuvable.'}</p>
        </div>
      </>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ height: '80px' }} />
      <div className="legal-container">

        <h1 className="legal-title">{PAGE_TITLES[type]}</h1>
        <p className="legal-updated">Dernière mise à jour : {formatDate(page.updatedAt)}</p>

        {/* ── Table of contents ── */}
        {page.sections.length > 1 && (
          <nav className="legal-toc">
            <p className="legal-toc-label">Sommaire</p>
            <ol className="legal-toc-list">
              {page.sections.map(section => (
                <li key={section.id}>
                  <a href={`#section-${section.id}`} className="legal-toc-link">
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* ── Sections ── */}
        <div className="legal-sections">
          {page.sections.map(section => (
            <article
              key={section.id}
              id={`section-${section.id}`}
              className="legal-section"
            >
              <h2 className="legal-section-title">{section.title}</h2>
              <div
                className="legal-section-content"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </article>
          ))}
        </div>

      </div>
    </>
  )
}
