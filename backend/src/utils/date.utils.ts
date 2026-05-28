// date.utils.ts — Date calculation utilities for Apilace
// All calculations use Date.UTC() to guarantee pure UTC timestamps
// The frontend is responsible for displaying dates in the user's local timezone

export function daysSince(date: Date | string): number {
  const now = new Date()
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const d = new Date(date)
  const dateUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  return Math.floor((todayUtc - dateUtc) / (1000 * 60 * 60 * 24))
}

export function isWithinDays(date: Date | string, days: number): boolean {
  const since = daysSince(date)
  return since >= 0 && since <= days  // guards against future dates returning false positives
}