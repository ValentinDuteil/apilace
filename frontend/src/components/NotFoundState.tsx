// NotFoundState.tsx — Inline not found state for resource fetch errors
import { Link } from 'react-router-dom'

interface NotFoundStateProps {
  message?: string
  backTo?: string
  backLabel?: string
}

export default function NotFoundState({
  message = 'Cette page est introuvable.',
  backTo = '/boutique',
  backLabel = 'Retour à la boutique',
}: NotFoundStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '16px' }}>
      <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '1.1rem', color: '#6c757d', letterSpacing: '1px' }}>
        {message}
      </p>
      <Link to={backTo} style={{ fontFamily: 'CenturySchoolbook, serif', color: '#957d4c', fontSize: '0.9rem', letterSpacing: '1px' }}>
        {backLabel}
      </Link>
    </div>
  )
}