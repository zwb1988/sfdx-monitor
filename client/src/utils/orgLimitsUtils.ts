import type { OrgLimitRow } from '../types'

export function limitUsed (row: OrgLimitRow): number {
  return Math.max(0, row.max - row.remaining)
}

/** 0–100 when max > 0; null when no finite cap for the bar. */
export function consumptionPercent (row: OrgLimitRow): number | null {
  if (row.max <= 0) return null
  const u = limitUsed(row)
  return Math.min(100, (u / row.max) * 100)
}

export type LimitBarLevel = 'low' | 'mid' | 'high'

export function barLevelForPercent (pct: number): LimitBarLevel {
  if (pct >= 90) return 'high'
  if (pct >= 70) return 'mid'
  return 'low'
}

/** Highest usage first; rows with max <= 0 last (by name). */
export function sortOrgLimitsByConsumption (rows: OrgLimitRow[]): OrgLimitRow[] {
  return [...rows].sort((a, b) => {
    const pa = consumptionPercent(a)
    const pb = consumptionPercent(b)
    if (pa == null && pb == null) return a.name.localeCompare(b.name)
    if (pa == null) return 1
    if (pb == null) return -1
    if (pb !== pa) return pb - pa
    return a.name.localeCompare(b.name)
  })
}
