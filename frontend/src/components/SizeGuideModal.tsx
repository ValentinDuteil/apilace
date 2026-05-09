// SizeGuideModal.tsx — Placeholder until admin uploads size guide image in S5
export default function SizeGuideModal({ isOpen, onClose }: {
  isOpen: boolean
  onClose: () => void
}) {
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
          GUIDE DES TAILLES
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', border: '1px solid rgba(33,37,41,0.1)' }}>
          <p style={{ fontFamily: 'CenturySchoolbook, serif', fontSize: '0.875rem', color: '#adb5bd', letterSpacing: '1px', textAlign: 'center' }}>
            Voir le guide des tailles
          </p>
        </div>
      </div>
    </>
  )
}