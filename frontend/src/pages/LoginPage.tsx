// LoginPage.tsx — Standalone login page
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

export default function LoginPage() {
  const { login } = useAuth()
  const { mergeAndClearLocal } = useCart()
  const navigate = useNavigate()

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
      navigate('/boutique')
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '2rem', fontWeight: 400, color: '#212529', letterSpacing: '1px', textAlign: 'center', marginBottom: '40px' }}>
          Connexion
        </h1>

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
          <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.875rem', color: '#842029', marginBottom: '16px', textAlign: 'center' }}>
            {error}
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
          <Link to="/mot-de-passe-oublie" style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.8rem', color: '#6c757d', textDecoration: 'none' }}>
            Mot de passe oublié ?
          </Link>
          <Link to="/inscription" style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.8rem', color: '#957d4c', textDecoration: 'none' }}>
            Créer un compte →
          </Link>
        </div>
      </div>
    </div>
  )
}