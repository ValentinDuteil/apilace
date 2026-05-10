// CheckoutSuccessPage.tsx — Post-payment confirmation page
// Stripe redirects here after successful checkout
import { Link } from 'react-router-dom'

export default function CheckoutSuccessPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '40px 24px', textAlign: 'center' }}>

      <i className="fa-regular fa-circle-check" style={{ fontSize: '3rem', color: '#957d4c', marginBottom: '32px' }} />

      <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.75rem', color: '#6c757d', letterSpacing: '3px', marginBottom: '24px' }}>
        RÉSERVATION CONFIRMÉE
      </p>

      <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '1.1rem', color: '#212529', lineHeight: 1.8, marginBottom: '12px', maxWidth: '480px' }}>
        Votre acompte de réservation a bien été reçu.
      </p>

      <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.9rem', color: '#6c757d', lineHeight: 1.8, marginBottom: '56px', maxWidth: '480px', fontStyle: 'italic' }}>
        Notre équipe prépare votre création avec soin. Vous serez contacté dès qu'elle sera disponible pour le retrait en boutique.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
        <Link
          to="/mon-compte/commandes"
          style={{ display: 'block', padding: '16px', background: '#957d4c', color: '#ffffff', fontFamily: 'CenturySchoolbook, serif', fontSize: '0.85rem', letterSpacing: '2px', textDecoration: 'none', textAlign: 'center', transition: 'background 0.2s ease' }}
        >
          VOIR MES COMMANDES
        </Link>
        <Link
          to="/boutique"
          style={{ display: 'block', padding: '16px', background: 'transparent', color: '#6c757d', fontFamily: 'CenturySchoolbook, serif', fontSize: '0.85rem', letterSpacing: '1px', textDecoration: 'none', textAlign: 'center', border: '1px solid rgba(33,37,41,0.15)' }}
        >
          Enrichir ma sélection
        </Link>
      </div>
    </div>
  )
}