// Footer.tsx — Site footer for Apilace e-commerce
// Mirrors vitrine footer: gold background, 3 columns, auth-aware sitemap

import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Footer() {
  const { user, logout } = useAuth()

  async function handleLogout() {
    await logout()
    window.location.href = 'https://apilace.com'
  }

  return (
    <footer style={footerStyle}>

      {/* 3-column grid */}
      <div className="footer-grid">

        {/* Column 1 — Sitemap */}
        <div>
          <h4 style={columnTitleStyle}>Plan du site</h4>
          <hr style={dividerStyle} />
          <ul style={listStyle}>
            <li><a href="https://apilace.com/#" target="_blank" rel="noopener noreferrer" className="footer-link">Accueil</a></li>
            <li><Link to="/boutique" className="footer-link">Boutique</Link></li>
            {!user ? (
              <>
                <li><Link to="/inscription" className="footer-link">Inscription</Link></li>
                <li><Link to="/connexion" className="footer-link">Connexion</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/mon-compte" className="footer-link">Mon compte</Link></li>
                <li>
                  <button onClick={handleLogout} className="footer-link">
                    Déconnexion
                  </button>
                </li>
              </>
            )}
          </ul>

          <hr style={dividerStyle} />
          <ul style={listStyle}>
            <li><a href="https://apilace.com/pages/conception" target="_blank" rel="noopener noreferrer" className="footer-link">Notre histoire</a></li>
            <li><a href="https://apilace.com/pages/creations" target="_blank" rel="noopener noreferrer" className="footer-link">Créations</a></li>
          </ul>

          <hr style={dividerStyle} />
          <ul style={listStyle}>
            <li><a href="https://custom.apilace.com/" target="_blank" rel="noopener noreferrer" className="footer-link">Configurateur</a></li>
            <li><a href="https://apilace.com/pages/actualites" target="_blank" rel="noopener noreferrer" className="footer-link">Actualités</a></li>
            <li><a href="https://apilace.com/pages/contact" target="_blank" rel="noopener noreferrer" className="footer-link">Contact</a></li>
          </ul>
        </div>

        {/* Column 2 — Social media */}
        <div>
          <h4 style={columnTitleStyle}>Réseaux sociaux</h4>
          <hr style={dividerStyle} />
          <ul style={listStyle}>
            <li>
              <a href="https://www.facebook.com/people/Apilace/100090095918686/" target="_blank" rel="noopener noreferrer" className="footer-link footer-social-link">
                <i className="fa-brands fa-facebook" style={{ marginRight: '8px' }} />
                Facebook
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/apilace" target="_blank" rel="noopener noreferrer" className="footer-link footer-social-link">
                <i className="fa-brands fa-instagram" style={{ marginRight: '8px' }} />
                Instagram
              </a>
            </li>
            <li>
              <a href="https://www.youtube.com/channel/UCSOx8Z0xDMQzlYrXT1cP4zg" target="_blank" rel="noopener noreferrer" className="footer-link footer-social-link">
                <i className="fa-brands fa-youtube" style={{ marginRight: '8px' }} />
                YouTube
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/in/louis-desnoyers-907756314/" target="_blank" rel="noopener noreferrer" className="footer-link footer-social-link">
                <i className="fa-brands fa-linkedin" style={{ marginRight: '8px' }} />
                LinkedIn
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3 — Legal */}
        <div>
          <h4 style={columnTitleStyle}>Mentions légales</h4>
          <hr style={dividerStyle} />
          <ul style={listStyle}>
            <li><Link to="/mentions-legales" className="footer-link">Mentions légales</Link></li>
            <li><Link to="/cgv" className="footer-link">Conditions générales d'utilisation et de vente (CGUV)</Link></li>
            <li><Link to="/confidentialite" className="footer-link">Politique de confidentialité</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom — Logo placeholder + brand + copyright */}
      <div style={bottomStyle}>
        {/* Replace with <img src="/img/LOGO_BLANC.png" width="150" alt="Apilace" /> when logo is available */}
        <div style={logoPlaceholderStyle}>A</div>
        <span style={brandNameStyle}>APILACE</span>
        <p style={copyrightStyle}>&copy; Copyright 2026</p>
      </div>

    </footer>
  )
}

// ── Style objects ────────────────────────────────────────────────────────────

const footerStyle: CSSProperties = {
  backgroundColor: '#957d4c',
  color: '#ffffff',
  padding: '60px 48px 32px',
}

const columnTitleStyle: CSSProperties = {
  fontFamily: "'CenturySchoolbook', serif",
  fontSize: '16px',
  fontWeight: 'normal',
  color: '#ffffff',
  marginBottom: '16px',
}

const dividerStyle: CSSProperties = {
  border: 'none',
  borderTop: '1px solid rgba(255,255,255,0.3)',
  margin: '12px 0',
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: '0 0 8px 0',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
}

const bottomStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: '48px',
  gap: '8px',
}

const logoPlaceholderStyle: CSSProperties = {
  width: '60px',
  height: '60px',
  border: '2px solid rgba(255,255,255,0.6)',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(255,255,255,0.8)',
  fontSize: '24px',
  marginBottom: '8px',
}

const brandNameStyle: CSSProperties = {
  fontFamily: "'CenturySchoolbook', serif",
  fontSize: '22px',
  letterSpacing: '4px',
  color: '#ffffff',
}

const copyrightStyle: CSSProperties = {
  fontSize: '13px',
  color: 'rgba(255,255,255,0.7)',
  margin: 0,
}