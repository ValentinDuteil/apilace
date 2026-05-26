// ContactPage.tsx — Contact form page
// Pre-fills fields for authenticated users
// Works for both anonymous visitors and members

import { useState, useEffect } from 'react'
import type { AxiosError } from 'axios'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import type { ApiValidationError } from '../types/models.types'
import '../styles/ContactPage.css'

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p style={{
      fontFamily: 'CenturySchoolbook, serif',
      fontSize: '0.78rem', color: '#842029', marginTop: '4px',
    }}>
      {message}
    </p>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ContactPage() {
  const { user } = useAuth()

  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
    content:   '',
  })
  const [fieldErrors,  setFieldErrors]  = useState<Record<string, string>>({})
  const [globalError,  setGlobalError]  = useState<string | null>(null)
  const [isLoading,    setIsLoading]    = useState(false)
  const [isSuccess,    setIsSuccess]    = useState(false)

  // Pre-fill from authenticated user
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        firstName: prev.firstName || user.firstName || '',
        lastName:  prev.lastName  || user.lastName  || '',
        email:     prev.email     || user.email     || '',
      }))
    }
  }, [user])

  function clearFieldError(champ: string) {
    setFieldErrors(prev => {
      if (!prev[champ]) return prev
      const next = { ...prev }
      delete next[champ]
      return next
    })
  }

  async function handleSubmit() {
    setGlobalError(null)
    setFieldErrors({})
    setIsLoading(true)

    try {
      await api.post('/contact', form)
      setIsSuccess(true)
    } catch (err) {
      const axiosError = err as AxiosError<ApiValidationError>
      const details = axiosError.response?.data?.details
      if (details?.length) {
        const errors: Record<string, string> = {}
        for (const { champ, message } of details) errors[champ] = message
        setFieldErrors(errors)
      } else {
        setGlobalError(axiosError.response?.data?.message ?? 'Une erreur est survenue.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Success state ────────────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', padding: '40px 24px', textAlign: 'center',
      }}>
        <div>
          <i className="fa-solid fa-circle-check" style={{ fontSize: '2rem', color: '#957d4c', marginBottom: '24px', display: 'block' }} />
          <h1 style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '1.8rem', fontWeight: 400, color: '#212529',
            letterSpacing: '1px', marginBottom: '16px',
          }}>
            Message envoyé
          </h1>
          <p style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '0.95rem', color: '#6c757d', lineHeight: 1.7,
            maxWidth: '400px', margin: '0 auto',
          }}>
            Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
          </p>
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ height: '115px' }} />

      <div style={{ padding: '0px 24px 80px' }}>
        <h1 style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '3rem', fontWeight: 400,
          textAlign: 'center', color: '#212529',
          letterSpacing: '1px', marginBottom: '12px',
        }}>
          Contactez-nous
        </h1>
        <p style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '0.9rem', color: '#6c757d',
          textAlign: 'center', marginBottom: '48px',
        }}>
          Une question, une demande particulière ? Nous vous répondons par email.
        </p>

        <div style={{ maxWidth: '680px', margin: '0 auto' }}>

          {/* First name + Last name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <input
                type="text"
                value={form.firstName}
                onChange={e => { setForm(p => ({ ...p, firstName: e.target.value })); clearFieldError('firstName') }}
                placeholder="Prénom *"
                className="login-modal-input"
                style={{ borderColor: fieldErrors.firstName ? '#842029' : undefined }}
              />
              <FieldError message={fieldErrors.firstName} />
            </div>
            <div>
              <input
                type="text"
                value={form.lastName}
                onChange={e => { setForm(p => ({ ...p, lastName: e.target.value })); clearFieldError('lastName') }}
                placeholder="Nom *"
                className="login-modal-input"
                style={{ borderColor: fieldErrors.lastName ? '#842029' : undefined }}
              />
              <FieldError message={fieldErrors.lastName} />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              value={form.email}
              onChange={e => { setForm(p => ({ ...p, email: e.target.value })); clearFieldError('email') }}
              placeholder="Adresse email *"
              className="login-modal-input"
              style={{ borderColor: fieldErrors.email ? '#842029' : undefined }}
            />
            <FieldError message={fieldErrors.email} />
          </div>

          {/* Phone — optional */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="Téléphone (optionnel)"
              className="login-modal-input"
            />
          </div>

          {/* Message */}
          <div style={{ marginBottom: '24px' }}>
            <textarea
              value={form.content}
              onChange={e => { setForm(p => ({ ...p, content: e.target.value })); clearFieldError('content') }}
              placeholder="Votre message *"
              rows={6}
              className="login-modal-input contact-textarea"
              style={{
                borderColor: fieldErrors.content ? '#842029' : undefined,
                resize: 'vertical', minHeight: '140px',
              }}
            />
            <FieldError message={fieldErrors.content} />
          </div>

          {globalError && (
            <p style={{
              fontFamily: 'CenturySchoolbook, serif',
              fontSize: '0.875rem', color: '#842029',
              marginBottom: '16px', textAlign: 'center',
            }}>
              {globalError}
            </p>
          )}

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              className="login-modal-btn"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Envoi en cours...' : 'ENVOYER'}
            </button>
          </div>

        </div>
      </div>
    </>
  )
}