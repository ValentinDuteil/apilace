// RegisterPage.tsx — Account creation page for Apilace

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import type { ApiValidationError } from '../types/models.types'

// ─── Password rules — mirror backend PasswordSchema ──────────────────────────

const PASSWORD_RULES = [
  { label: '8 caractères minimum', test: (v: string) => v.length >= 8 },
  { label: 'Une majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Un chiffre', test: (v: string) => /[0-9]/.test(v) },
  { label: 'Un caractère spécial', test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
]

// ─── Sub-component — field-level error ───────────────────────────────────────

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

export default function RegisterPage() {
  const { login } = useAuth()
  const { mergeAndClearLocal } = useCart()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const passwordValid = PASSWORD_RULES.every(rule => rule.test(password))
  const passwordsMatch = confirmPassword === '' || password === confirmPassword

  // Clear a specific field error when the user starts correcting it
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

    // Client-side checks before hitting the API
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setGlobalError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    if (!passwordValid) {
      setGlobalError('Le mot de passe ne respecte pas les critères requis.')
      return
    }
    if (password !== confirmPassword) {
      setGlobalError('Les mots de passe ne correspondent pas.')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/auth/register', { email, password, firstName, lastName })
      await login(email, password, async () => { await mergeAndClearLocal() })
      navigate('/boutique')
      // Fire-and-forget — newsletter subscription failure must never block registration
      if (newsletterOptIn) {
        api.post('/newsletter/subscribe', { email }).catch(() => { })
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiValidationError>
      const details = axiosError.response?.data?.details

      if (details && details.length > 0) {
        // Map backend Zod errors to field-level display
        const errors: Record<string, string> = {}
        for (const { champ, message } of details) {
          errors[champ] = message
        }
        setFieldErrors(errors)
      } else {
        setGlobalError(axiosError.response?.data?.message ?? 'Une erreur est survenue.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        <h1 style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '3rem', fontWeight: 400, color: '#212529',
          letterSpacing: '1px', textAlign: 'center', marginBottom: '40px',
        }}>
          Créer un compte
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>

          {/* First Name & Last Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <input
                type="text"
                value={firstName}
                onChange={e => { setFirstName(e.target.value); clearFieldError('firstName') }}
                onKeyDown={handleKeyDown}
                placeholder="Prénom *"
                className="login-modal-input"
                style={{ borderColor: fieldErrors.firstName ? '#842029' : undefined }}
              />
              <FieldError message={fieldErrors.firstName} />
            </div>
            <div>
              <input
                type="text"
                value={lastName}
                onChange={e => { setLastName(e.target.value); clearFieldError('lastName') }}
                onKeyDown={handleKeyDown}
                placeholder="Nom *"
                className="login-modal-input"
                style={{ borderColor: fieldErrors.lastName ? '#842029' : undefined }}
              />
              <FieldError message={fieldErrors.lastName} />
            </div>
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearFieldError('email') }}
              onKeyDown={handleKeyDown}
              placeholder="Adresse email *"
              className="login-modal-input"
              style={{ borderColor: fieldErrors.email ? '#842029' : undefined }}
            />
            <FieldError message={fieldErrors.email} />
          </div>

          {/* Password + Rules */}
          <div>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); clearFieldError('password') }}
              onFocus={() => setShowRules(true)}
              onKeyDown={handleKeyDown}
              placeholder="Mot de passe *"
              className="login-modal-input"
              style={{ borderColor: fieldErrors.password ? '#842029' : undefined }}
            />
            <FieldError message={fieldErrors.password} />
            {(showRules || password) && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {PASSWORD_RULES.map((rule, i) => {
                  const ok = rule.test(password)
                  return (
                    <p key={i} style={{
                      fontFamily: 'CenturySchoolbook, serif',
                      fontSize: '0.78rem',
                      color: ok ? '#2d6a4f' : '#adb5bd',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      transition: 'color 0.2s ease',
                    }}>
                      <i
                        className={`fa-solid ${ok ? 'fa-circle-check' : 'fa-circle'}`}
                        style={{ fontSize: '0.65rem' }}
                      />
                      {rule.label}
                    </p>
                  )
                })}
              </div>
            )}
          </div>

          {/* Frontend confirmation password */}
          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Confirmer le mot de passe *"
              className="login-modal-input"
              style={{ borderColor: !passwordsMatch ? '#842029' : undefined }}
            />
            {!passwordsMatch && (
              <FieldError message="Les mots de passe ne correspondent pas." />
            )}
          </div>

        </div>

        {/* ─── Newsletter opt-in ──────────────────────────────────────── */}
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          cursor: 'pointer', marginBottom: '8px',
        }}>
          <input
            type="checkbox"
            checked={newsletterOptIn}
            onChange={e => setNewsletterOptIn(e.target.checked)}
            style={{ marginTop: '3px', accentColor: '#957d4c', cursor: 'pointer' }}
          />
          <span style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '0.82rem', color: '#6c757d', lineHeight: 1.5,
          }}>
            Je souhaite recevoir les actualités et nouveautés Apilace
          </span>
        </label>

        {globalError && (
          <p style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '0.875rem', color: '#842029',
            marginBottom: '16px', textAlign: 'center',
          }}>
            {globalError}
          </p>
        )}

        <button
          type="button"
          className="login-modal-btn"
          onClick={handleSubmit}
          disabled={isLoading}
          style={{ marginBottom: '20px' }}
        >
          {isLoading ? 'Création en cours...' : 'CRÉER MON COMPTE'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <Link
            to="/connexion"
            style={{
              fontFamily: 'CenturySchoolbook, serif',
              fontSize: '0.8rem', color: '#6c757d', textDecoration: 'none',
            }}
          >
            Déjà un compte ? Se connecter →
          </Link>
        </div>

      </div>
    </div>
  )
}