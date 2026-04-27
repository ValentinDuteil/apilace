import type { LegalType } from '../types/models.types'

export default function LegalPage({ type }: { type: LegalType }) {
  return <div>LegalPage — {type}</div>
}
