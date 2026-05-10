// LoginPage.tsx — Standalone login page

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import type { ApiValidationError } from '../types/models.types'

// ─── Sub-component ───────────────────────────────────────────────────────────

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

export default function LoginPage() {
  const { login }              = useAuth()
  const { mergeAndClearLocal } = useCart()
  const navigate               = useNavigate()

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isLoading,   setIsLoading]   = useState(false)

  function clearFieldError(champ: string) {
    setFieldErrors(prev => {
      if (!prev[champ]) return prev
      const next = { ...prev }
      delete next[champ]
      return next
    })
  }

  async function handleSubmit() {
    if (!email || !password) {
      setGlobalError('Veuillez remplir tous les champs.')
      return
    }
    setGlobalError(null)
    setFieldErrors({})
    setIsLoading(true)
    try {
      await login(email, password, async () => { await mergeAndClearLocal() })
      navigate('/boutique')
    } catch (err) {
      const axiosError = err as AxiosError<ApiValidationError>
      const details = axiosError.response?.data?.details
      if (details?.length) {
        const errors: Record<string, string> = {}
        for (const { champ, message } of details) errors[champ] = message
        setFieldErrors(errors)
      } else {
        setGlobalError('Email ou mot de passe incorrect.')
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
          fontSize: '2rem', fontWeight: 400, color: '#212529',
          letterSpacing: '1px', textAlign: 'center', marginBottom: '40px',
        }}>
          Connexion
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); clearFieldError('email') }}
            onKeyDown={handleKeyDown}
            placeholder="Adresse email"
            className="login-modal-input"
            style={{ borderColor: fieldErrors.email ? '#842029' : undefined }}
          />
          <FieldError message={fieldErrors.email} />

          <div style={{ marginTop: '12px' }}>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); clearFieldError('password') }}
              onKeyDown={handleKeyDown}
              placeholder="Mot de passe"
              className="login-modal-input"
              style={{ borderColor: fieldErrors.password ? '#842029' : undefined }}
            />
            <FieldError message={fieldErrors.password} />
          </div>
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

        <button
          type="button"
          className="login-modal-btn"
          onClick={handleSubmit}
          disabled={isLoading}
          style={{ marginBottom: '20px' }}
        >
          {isLoading ? 'Connexion...' : 'SE CONNECTER'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Link
            to="/mot-de-passe-oublie"
            style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.8rem', color: '#6c757d', textDecoration: 'none' }}
          >
            Mot de passe oublié ?
          </Link>
          <Link
            to="/inscription"
            style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.8rem', color: '#957d4c', textDecoration: 'none' }}
          >
            Créer un compte →
          </Link>
        </div>

      </div>
    </div>
  )
}