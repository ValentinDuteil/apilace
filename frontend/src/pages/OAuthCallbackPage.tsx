// OAuthCallbackPage.tsx — Landing page after Google OAuth redirect
// Hydrates AuthContext via /auth/me, merges local cart, then redirects to /boutique

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

export default function OAuthCallbackPage() {
  const { refreshUser } = useAuth()
  const { mergeAndClearLocal } = useCart()
  const navigate = useNavigate()
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    async function finalizeLogin() {
      try {
        await refreshUser()
        await mergeAndClearLocal()
        navigate('/boutique', { replace: true })
      } catch {
        setHasError(true)
      }
    }
    finalizeLogin()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (hasError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '1rem', color: '#212529', marginBottom: '24px' }}>
            Une erreur est survenue lors de la connexion avec Google.
          </p>
          <button className="login-modal-btn" onClick={() => navigate('/connexion')}>
            Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.9rem', color: '#6c757d', letterSpacing: '1px' }}>
        Connexion en cours...
      </p>
    </div>
  )
}