// StatusBadge.tsx — Shared order status badge
import { STATUS_CONFIG } from '../types/models.types'
import type { OrderStatus } from '../types/models.types'

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '7px',
      background: cfg.bg, padding: '5px 12px',
    }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: cfg.dot }} />
      <span style={{
        fontFamily: 'CenturySchoolbook, serif',
        fontSize: '0.75rem', letterSpacing: '0.5px',
        color: cfg.color, whiteSpace: 'nowrap',
      }}>
        {cfg.label}
      </span>
    </div>
  )
}