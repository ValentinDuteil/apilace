// LoginModal.tsx — Login modal triggered from CartPage when user is not authenticated
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { login } = useAuth()
  const { mergeAndClearLocal } = useCart()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return }
    setError(null)
    setIsLoading(true)
    try {
      await login(email, password, async () => {
        await mergeAndClearLocal()
      })
      onClose()
      onSuccess?.()
    } catch {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <>
      <div
        className={`cart-modal-overlay${isOpen ? ' cart-modal-overlay--open' : ''}`}
        onClick={onClose}
      />
      <div className={`cart-modal${isOpen ? ' cart-modal--open' : ''}`}>
        <button type="button" className="cart-modal-close" onClick={onClose} aria-label="Fermer">
          <i className="fa-solid fa-xmark" />
        </button>

        <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.75rem', color: '#6c757d', letterSpacing: '3px', marginBottom: '32px' }}>
          CONNEXION
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Adresse email"
            className="login-modal-input"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mot de passe"
            className="login-modal-input"
          />
        </div>

        {error && (
          <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.875rem', color: '#212529', marginBottom: '16px' }}>
            {error}
          </p>
        )}

        <button
          type="button"
          className="login-modal-btn"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Connexion...' : 'SE CONNECTER'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <Link
            to="/mot-de-passe-oublie"
            onClick={onClose}
            style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.8rem', color: '#6c757d', textDecoration: 'none' }}
          >
            Mot de passe oublié ?
          </Link>
          <Link
            to="/inscription"
            onClick={onClose}
            style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.8rem', color: '#957d4c', textDecoration: 'none' }}
          >
            Créer un compte →
          </Link>
        </div>
      </div>
    </>
  )
}