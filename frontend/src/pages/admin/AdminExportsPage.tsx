// AdminExportsPage.tsx — Admin CSV export page for Apilace
// Three export sections: orders, users, newsletter — each with filters

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { AxiosError } from 'axios'
import api from '../../lib/axios'
import '../../styles/AdminDashboardPage.css'
import '../../styles/AdminExportsPage.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type Store = { id: number; name: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Parse error message from Axios response — handles JSON and Blob response bodies
async function parseAxiosError(error: unknown): Promise<string> {
  const axiosError = error as AxiosError
  if (axiosError.response?.data instanceof Blob) {
    try {
      const text = await axiosError.response.data.text()
      const json = JSON.parse(text) as { message?: string }
      return json.message ?? "Erreur lors de l'export."
    } catch {
      return "Erreur lors de l'export."
    }
  }
  const data = axiosError.response?.data as { message?: string } | undefined
  return data?.message ?? "Erreur lors de l'export."
}

async function downloadCsv(
  endpoint: string,
  params: Record<string, string>,
  filename: string,
  setLoading: (v: boolean) => void,
  setError: (v: string | null) => void
): Promise<void> {
  setLoading(true)
  setError(null)
  try {
    // Trim all values and exclude empty ones before sending to backend
    const cleanParams = Object.fromEntries(
      Object.entries(params)
        .map(([k, v]) => [k, v.trim()] as [string, string])
        .filter(([_, v]) => v !== '')
    )
    const response = await api.get(endpoint, {
      params: cleanParams,
      responseType: 'blob',
    })
    const today = new Date().toISOString().split('T')[0]
    const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${today}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    setError(await parseAxiosError(error))
  } finally {
    setLoading(false)
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminExportsPage() {
  const [stores, setStores] = useState<Store[]>([])

  // Using Record<string, string> avoids unnecessary type casting when passing to downloadCsv
  const [orderFilters, setOrderFilters]         = useState<Record<string, string>>({ from: '', to: '', status: '', storeId: '', minAmount: '' })
  const [isExportingOrders, setIsExportingOrders] = useState(false)
  const [orderError, setOrderError]             = useState<string | null>(null)

  const [userFilters, setUserFilters]           = useState<Record<string, string>>({ from: '', to: '', role: '', minOrders: '', minSpent: '' })
  const [isExportingUsers, setIsExportingUsers]   = useState(false)
  const [userError, setUserError]               = useState<string | null>(null)

  const [newsletterFilters, setNewsletterFilters]       = useState<Record<string, string>>({ from: '', to: '', activeOnly: 'true' })
  const [isExportingNewsletter, setIsExportingNewsletter] = useState(false)
  const [newsletterError, setNewsletterError]           = useState<string | null>(null)

  useEffect(() => {
    api.get<Store[]>('/admin/stores')
      .then(res => setStores(res.data))
      .catch(console.error)
  }, [])

  // Clear the section error as soon as the admin edits a filter
  function updateOrderFilter(field: string, value: string) {
    setOrderError(null)
    setOrderFilters(f => ({ ...f, [field]: value }))
  }

  function updateUserFilter(field: string, value: string) {
    setUserError(null)
    setUserFilters(f => ({ ...f, [field]: value }))
  }

  function updateNewsletterFilter(field: string, value: string) {
    setNewsletterError(null)
    setNewsletterFilters(f => ({ ...f, [field]: value }))
  }

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

        {/* ── Title ── */}
        <h1 style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '3rem', fontWeight: 400, color: '#212529',
          textAlign: 'center', marginBottom: '8px',
        }}>
          Exports CSV
        </h1>
        <p style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '0.85rem', color: '#adb5bd',
          textAlign: 'center', marginBottom: '48px',
        }}>
          Générez et téléchargez vos données filtrées — compatible Excel, Google Sheets, Numbers.
        </p>

        {/* ══ SECTION 1 — Commandes ══ */}
        <div className="admin-detail-card" style={{ marginBottom: '24px' }}>
          <div className="admin-export-card-header">
            <div>
              <p className="admin-detail-card-title">
                <i className="fa-solid fa-file-invoice" style={{ marginRight: '8px', color: '#957d4c' }} />
                Commandes
              </p>
              <p className="admin-export-card-desc">
                Statut, montants, acompte Stripe, solde boutique, client, magasin.
              </p>
            </div>
          </div>

          <div className="admin-export-grid">

            <div className="admin-export-field">
              <label className="admin-export-label">Du</label>
              <input type="date" className="admin-export-input"
                value={orderFilters.from}
                onChange={e => updateOrderFilter('from', e.target.value)}
              />
            </div>

            <div className="admin-export-field">
              <label className="admin-export-label">Au</label>
              <input type="date" className="admin-export-input"
                value={orderFilters.to}
                onChange={e => updateOrderFilter('to', e.target.value)}
              />
            </div>

            <div className="admin-export-field">
              <label className="admin-export-label">Statut</label>
              <select className="admin-export-input"
                value={orderFilters.status}
                onChange={e => updateOrderFilter('status', e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="PENDING">En attente de paiement</option>
                <option value="PAID">Payée</option>
                <option value="READY">Prête en boutique</option>
                <option value="COLLECTED">Récupérée</option>
                <option value="CANCELLED">Annulée</option>
                <option value="REFUNDED">Remboursée</option>
              </select>
            </div>

            <div className="admin-export-field">
              <label className="admin-export-label">Magasin</label>
              <select className="admin-export-input"
                value={orderFilters.storeId}
                onChange={e => updateOrderFilter('storeId', e.target.value)}
              >
                <option value="">Tous les magasins</option>
                {stores.map(s => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="admin-export-field">
              <label className="admin-export-label">Montant minimum (€)</label>
              <input type="number" min="0" className="admin-export-input"
                placeholder="Ex : 10000"
                value={orderFilters.minAmount}
                onChange={e => updateOrderFilter('minAmount', e.target.value)}
              />
            </div>

          </div>

          {orderError && <p className="admin-export-error">{orderError}</p>}

          <div className="admin-export-footer">
            <button className="admin-btn-secondary"
              onClick={() => { setOrderError(null); setOrderFilters({ from: '', to: '', status: '', storeId: '', minAmount: '' }) }}
            >
              Réinitialiser
            </button>
            <button className="admin-btn-primary" disabled={isExportingOrders}
              onClick={() => downloadCsv('/admin/exports/orders', orderFilters, 'commandes', setIsExportingOrders, setOrderError)}
            >
              {isExportingOrders
                ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} />Génération…</>
                : <><i className="fa-solid fa-download" style={{ marginRight: '8px' }} />Télécharger</>
              }
            </button>
          </div>
        </div>

        {/* ══ SECTION 2 — Clients ══ */}
        <div className="admin-detail-card" style={{ marginBottom: '24px' }}>
          <div className="admin-export-card-header">
            <div>
              <p className="admin-detail-card-title">
                <i className="fa-solid fa-users" style={{ marginRight: '8px', color: '#957d4c' }} />
                Clients
              </p>
              <p className="admin-export-card-desc">
                Coordonnées, rôle, nombre de commandes, total dépensé, date d'inscription.
              </p>
            </div>
          </div>

          <div className="admin-export-grid">

            <div className="admin-export-field">
              <label className="admin-export-label">Inscrit du</label>
              <input type="date" className="admin-export-input"
                value={userFilters.from}
                onChange={e => updateUserFilter('from', e.target.value)}
              />
            </div>

            <div className="admin-export-field">
              <label className="admin-export-label">Au</label>
              <input type="date" className="admin-export-input"
                value={userFilters.to}
                onChange={e => updateUserFilter('to', e.target.value)}
              />
            </div>

            <div className="admin-export-field">
              <label className="admin-export-label">Rôle</label>
              <select className="admin-export-input"
                value={userFilters.role}
                onChange={e => updateUserFilter('role', e.target.value)}
              >
                <option value="">Tous les rôles</option>
                <option value="MEMBER">Membres</option>
                <option value="ADMIN">Administrateurs</option>
              </select>
            </div>

            <div className="admin-export-field">
              <label className="admin-export-label">Commandes minimum</label>
              <input type="number" min="0" className="admin-export-input"
                placeholder="Ex : 1"
                value={userFilters.minOrders}
                onChange={e => updateUserFilter('minOrders', e.target.value)}
              />
            </div>

            <div className="admin-export-field">
              <label className="admin-export-label">Total dépensé minimum (€)</label>
              <input type="number" min="0" className="admin-export-input"
                placeholder="Ex : 5000"
                value={userFilters.minSpent}
                onChange={e => updateUserFilter('minSpent', e.target.value)}
              />
            </div>

          </div>

          {userError && <p className="admin-export-error">{userError}</p>}

          <div className="admin-export-footer">
            <button className="admin-btn-secondary"
              onClick={() => { setUserError(null); setUserFilters({ from: '', to: '', role: '', minOrders: '', minSpent: '' }) }}
            >
              Réinitialiser
            </button>
            <button className="admin-btn-primary" disabled={isExportingUsers}
              onClick={() => downloadCsv('/admin/exports/users', userFilters, 'clients', setIsExportingUsers, setUserError)}
            >
              {isExportingUsers
                ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} />Génération…</>
                : <><i className="fa-solid fa-download" style={{ marginRight: '8px' }} />Télécharger</>
              }
            </button>
          </div>
        </div>

        {/* ══ SECTION 3 — Newsletter ══ */}
        <div className="admin-detail-card">
          <div className="admin-export-card-header">
            <div>
              <p className="admin-detail-card-title">
                <i className="fa-solid fa-envelope" style={{ marginRight: '8px', color: '#957d4c' }} />
                Newsletter
              </p>
              <p className="admin-export-card-desc">
                Email, statut d'abonnement, date d'inscription.
              </p>
            </div>
          </div>

          <div className="admin-export-grid">

            <div className="admin-export-field">
              <label className="admin-export-label">Inscrit du</label>
              <input type="date" className="admin-export-input"
                value={newsletterFilters.from}
                onChange={e => updateNewsletterFilter('from', e.target.value)}
              />
            </div>

            <div className="admin-export-field">
              <label className="admin-export-label">Au</label>
              <input type="date" className="admin-export-input"
                value={newsletterFilters.to}
                onChange={e => updateNewsletterFilter('to', e.target.value)}
              />
            </div>

            <div className="admin-export-field">
              <label className="admin-export-label">Abonnés</label>
              <select className="admin-export-input"
                value={newsletterFilters.activeOnly}
                onChange={e => updateNewsletterFilter('activeOnly', e.target.value)}
              >
                <option value="true">Actifs seulement</option>
                <option value="false">Tous (actifs + désabonnés)</option>
              </select>
            </div>

          </div>

          {newsletterError && <p className="admin-export-error">{newsletterError}</p>}

          <div className="admin-export-footer">
            <button className="admin-btn-secondary"
              onClick={() => { setNewsletterError(null); setNewsletterFilters({ from: '', to: '', activeOnly: 'true' }) }}
            >
              Réinitialiser
            </button>
            <button className="admin-btn-primary" disabled={isExportingNewsletter}
              onClick={() => downloadCsv('/admin/exports/newsletter', newsletterFilters, 'newsletter', setIsExportingNewsletter, setNewsletterError)}
            >
              {isExportingNewsletter
                ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} />Génération…</>
                : <><i className="fa-solid fa-download" style={{ marginRight: '8px' }} />Télécharger</>
              }
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
