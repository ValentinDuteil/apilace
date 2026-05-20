// ResetPasswordPage.tsx — Password reset via token from email link
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import api from '../lib/axios'
import type { ApiValidationError } from '../types/models.types'

// ─── Constants ───────────────────────────────────────────────────────────────

const PASSWORD_RULES = [
  { label: '8 caractères minimum',   test: (v: string) => v.length >= 8 },
  { label: 'Une majuscule',          test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Un chiffre',             test: (v: string) => /[0-9]/.test(v) },
  { label: 'Un caractère spécial',   test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p style={{
      fontFamily: 'CenturySchoolbook, serif',
      fontSize: '0.78rem', color: '#212529', marginTop: '4px',
    }}>
      {message}
    </p>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const { token }  = useParams<{ token: string }>()
  const navigate   = useNavigate()

  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors,     setFieldErrors]     = useState<Record<string, string>>({})
  const [globalError,     setGlobalError]     = useState<string | null>(null)
  const [isLoading,       setIsLoading]       = useState(false)
  const [showRules,       setShowRules]       = useState(false)

  const passwordValid  = PASSWORD_RULES.every(r => r.test(newPassword))
  const passwordsMatch = confirmPassword === '' || newPassword === confirmPassword

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

    if (!newPassword || !confirmPassword) {
      setGlobalError('Veuillez remplir tous les champs.')
      return
    }
    if (!passwordValid) {
      setGlobalError('Le mot de passe ne respecte pas les critères requis.')
      return
    }
    if (newPassword !== confirmPassword) {
      setGlobalError('Les mots de passe ne correspondent pas.')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password: newPassword, confirmPassword })
      navigate('/connexion')
    } catch (error) {
      const axiosError = error as AxiosError<ApiValidationError>
      const details = axiosError.response?.data?.details
      if (details?.length) {
        const errors: Record<string, string> = {}
        for (const { champ, message } of details) errors[champ] = message
        setFieldErrors(errors)
      } else {
        setGlobalError(axiosError.response?.data?.message ?? 'Lien invalide ou expiré.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        <h1 style={{
          fontFamily: 'CenturySchoolbook, serif',
          fontSize: '2rem', fontWeight: 400,
          textAlign: 'center', color: '#212529',
          letterSpacing: '1px', marginBottom: '40px',
        }}>
          Nouveau mot de passe
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>

          <div>
            <input
              type="password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); clearFieldError('newPassword') }}
              onFocus={() => setShowRules(true)}
              placeholder="Nouveau mot de passe"
              className="login-modal-input"
              style={{ borderColor: fieldErrors.newPassword ? '#212529' : undefined }}
            />
            <FieldError message={fieldErrors.password} />
            {(showRules || newPassword) && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {PASSWORD_RULES.map((rule, i) => {
                  const ok = rule.test(newPassword)
                  return (
                    <p key={i} style={{
                      fontFamily: 'CenturySchoolbook, serif', fontSize: '0.78rem',
                      color: ok ? '#2d6a4f' : '#adb5bd',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      transition: 'color 0.2s ease',
                    }}>
                      <i className={`fa-solid ${ok ? 'fa-circle-check' : 'fa-circle'}`} style={{ fontSize: '0.65rem' }} />
                      {rule.label}
                    </p>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              className="login-modal-input"
              style={{ borderColor: !passwordsMatch ? '#212529' : undefined }}
            />
            {!passwordsMatch && <FieldError message="Les mots de passe ne correspondent pas." />}
          </div>

        </div>

        {globalError && (
          <p style={{
            fontFamily: 'CenturySchoolbook, serif',
            fontSize: '0.875rem', color: '#212529',
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
        >
          {isLoading ? 'Réinitialisation...' : 'RÉINITIALISER MON MOT DE PASSE'}
        </button>

      </div>
    </div>
  )
}