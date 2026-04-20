// date.utils.ts — Date calculation utilities for Apilace
// All calculations are based on UTC to avoid timezone issues with international orders
// The frontend is responsible for displaying dates in the user's local timezone

export function daysSince(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

export function isWithinDays(date: Date, days: number): boolean {
  return daysSince(date) <= days
}