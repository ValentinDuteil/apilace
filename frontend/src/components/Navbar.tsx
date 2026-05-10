// Navbar.tsx — Fixed navigation bar for Apilace e-commerce
// Three states: visitor / member / admin
// Sidebar logic: 50vw on desktop, full-screen on mobile
// Smart scroll: hides on scroll down, reveals on scroll up

import React, { useState, useEffect, useRef } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

const VITRINE_LINKS = [
  { label: 'Notre histoire', href: 'https://apilace.com/pages/conception' },
  { label: 'Créations', href: 'https://apilace.com/pages/creations' },
  { label: 'Devis en ligne', href: 'https://custom.apilace.com/' },
  { label: 'Configurateur 3D', href: 'https://demo-apilace.netlify.app/' },
  { label: 'Actualités', href: 'https://apilace.com/pages/actualites' },
  { label: 'Nous contacter', href: 'https://apilace.com/pages/contact' },
]

const ADMIN_LINKS = [
  { label: 'Tableau de bord', to: '/admin' },
  { label: 'Ma clientèle', to: '/admin/utilisateurs' },
  { label: 'Nouveau produit', to: '/admin/produits/nouveau' },
  { label: 'Éditer un produit', to: '/boutique' },
  { label: 'Points de retrait', to: '/admin/magasins' },
]

const SCROLL_THRESHOLD = 80

export default function Navbar() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const lastScrollYRef = useRef(0)

  // Smart scroll — hide on scroll down, reveal on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY

      if (currentY <= SCROLL_THRESHOLD) {
        // Always visible at the top of the page
        setIsHidden(false)
      } else if (currentY > lastScrollYRef.current) {
        // Scrolling down — hide
        setIsHidden(true)
      } else {
        // Scrolling up — reveal
        setIsHidden(false)
      }

      lastScrollYRef.current = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  async function handleLogout() {
    close()
    await logout()
    // Redirect to vitrine after logout
    window.location.href = 'https://apilace.com'
  }

  return (
    <>
      {/* ── Fixed Header ── */}
      <header style={{
        ...headerStyle,
        transform: isHidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.4s ease',
      }}>
        {/* ── Wrapper centré ── */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 40px', height: '100%' }}>
          {/* Left Section: Menu trigger & Desktop Auth Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flex: 1 }}>
            <button
              onClick={open}
              aria-label="Open menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#DFCF95' }}
            >
              <i className="fa-solid fa-bars" style={{ fontSize: '26px' }} />
            </button>

            <nav className="navbar-desktop-links">
              <NavLink to="/boutique" className="navbar-nav-link">Boutique</NavLink>
              {!user ? (
                <>
                  <NavLink to="/inscription" className="navbar-nav-link">Inscription</NavLink>
                  <NavLink to="/connexion" className="navbar-nav-link">Connexion</NavLink>
                </>
              ) : (
                <span style={welcomeStyle}>
                  Bienvenue {user.firstName ? `${user.firstName} !` : '!'}
                </span>
              )}
            </nav>
          </div>

          {/* Center Section: Brand Identity */}
          <Link to="/boutique" style={logoContainerStyle}>
            <span style={logoTextStyle}>Apilace</span>
            <img src="/img/logo_apilace.png" alt="Apilace" style={logoImgStyle} />
          </Link>

          {/* Right Section: Vitrine External Links & Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flex: 1, justifyContent: 'flex-end' }}>
            {/* No inline gap/display here: letting CSS .navbar-desktop-links handle consistency */}
            <nav className="navbar-desktop-links">
              <a href="https://custom.apilace.com/" target="_blank" rel="noopener noreferrer" className="navbar-external-link">
                <i className="fa-regular fa-clock" style={{ marginRight: '6px' }} />
                Configurateur
              </a>
              <a href="https://apilace.com/pages/actualites" target="_blank" rel="noopener noreferrer" className="navbar-external-link">
                Actualités
              </a>
              <a href="https://apilace.com/pages/contact" target="_blank" rel="noopener noreferrer" className="navbar-external-link">
                Contact
              </a>
            </nav>

            {/* Cart Widget */}
            <Link to="/panier" style={{ position: 'relative', textDecoration: 'none', color: '#DFCF95' }}>
              <i className="fa-solid fa-cart-shopping" style={{ fontSize: '18px' }} />
              {itemCount > 0 && (
                <span style={cartBadgeStyle}>
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Sidebar Overlay ── */}
      <div className={`sidebar-backdrop${isOpen ? ' sidebar-backdrop--open' : ''}`} onClick={close} />

      {/* ── Navigation Sidebar ── */}
      <div className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={sidebarTitleStyle}>Apilace</h1>
          <button onClick={close} aria-label="Close menu" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff' }}>
            <i className="fa-solid fa-xmark" style={{ fontSize: '24px' }} />
          </button>
        </div>

        {/* Main Navigation Group */}
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          <SidebarExternalLink href="https://apilace.com/#" onClick={close}>Accueil</SidebarExternalLink>
          <SidebarInternalLink to="/boutique" onClick={close}>Boutique</SidebarInternalLink>
          <SidebarInternalLink to="/panier" onClick={close}>Mon panier</SidebarInternalLink>

          {!user ? (
            <>
              <SidebarInternalLink to="/connexion" onClick={close}>Connexion</SidebarInternalLink>
              <SidebarInternalLink to="/inscription" onClick={close}>Inscription</SidebarInternalLink>
            </>
          ) : (
            <>
              <SidebarInternalLink to="/mon-compte" onClick={close}>Mon compte</SidebarInternalLink>
              <SidebarButton onClick={handleLogout}>Déconnexion</SidebarButton>
            </>
          )}
        </nav>

        <SidebarSeparator />

        {/* Admin Section (Visible only for ADMIN role) */}
        {user?.role === 'ADMIN' && (
          <>
            <nav style={{ display: 'flex', flexDirection: 'column' }}>
              {ADMIN_LINKS.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={close}
                  style={{ ...sidebarLinkStyle, color: '#957d4c' }}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <SidebarSeparator />
          </>
        )}

        {/* External Vitrine Links Group */}
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          {VITRINE_LINKS.map(link => (
            <SidebarExternalLink key={link.href} href={link.href} onClick={close}>
              {link.label}
            </SidebarExternalLink>
          ))}
        </nav>
      </div>

      {/* Spacer to prevent content overlapping under fixed header */}
      <div style={{ height: '115px' }} />
    </>
  )
}

// ── Sidebar Sub-components ──────────────────────────────────────────

function SidebarInternalLink({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={sidebarLinkStyle}
    >
      {children}
    </NavLink>
  )
}

function SidebarExternalLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} style={sidebarLinkStyle}>
      {children}
    </a>
  )
}

function SidebarButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ ...sidebarLinkStyle, background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
      {children}
    </button>
  )
}

function SidebarSeparator() {
  return <div style={{
    height: '1px',
    background: 'linear-gradient(to right, #262626, #957d4c 50%, #262626)',
    margin: '20px 0',
    flexShrink: 0,
  }} />
}

// ── Style Objects (Internal CSS-in-JS) ────────────────────────────────────────────

const headerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  backgroundColor: '#ffffff',
  height: '70px',
  display: 'flex',
  alignItems: 'center',
  padding: '0',
  borderBottom: '1px solid rgba(33, 37, 41, 0.1)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  overflow: 'visible'
}

const logoContainerStyle: React.CSSProperties = {
  textDecoration: 'none',
  position: 'relative',
  display: 'block',
  width: '150px',
  height: '40px',
  alignSelf: 'flex-start',
  paddingTop: '4px'
}

const logoTextStyle: React.CSSProperties = {
  position: 'absolute',
  width: '150px',
  left: 0,
  top: 0,
  fontFamily: "'CenturySchoolbook', serif",
  fontSize: '1.5rem',
  textAlign: 'center',
  textTransform: 'uppercase',
  color: '#212529',
}

const logoImgStyle: React.CSSProperties = {
  height: '65px',
  position: 'absolute',
  left: 'calc(50% - 37.79px)',
  top: '35px',
}

const cartBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-8px',
  right: '-8px',
  backgroundColor: '#957d4c',
  color: '#fff',
  borderRadius: '50%',
  width: '18px',
  height: '18px',
  fontSize: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold'
}

const sidebarLinkStyle: React.CSSProperties = {
  fontFamily: "'CenturySchoolbook', serif",
  color: '#ffffff',
  textDecoration: 'none',
  padding: '12px 0',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '1.5rem',
  fontWeight: '300'
}

const sidebarTitleStyle: React.CSSProperties = {
  fontFamily: "'CenturySchoolbook', serif",
  fontSize: '3.5rem',
  fontWeight: '300',
  letterSpacing: '6px',
  color: '#ffffff',
  textTransform: 'uppercase',
}

const welcomeStyle: React.CSSProperties = {
  fontFamily: "'CenturySchoolbook', serif",
  fontSize: '14px',
  color: '#957d4c'
}