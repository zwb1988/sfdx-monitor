/** Bucket job start ISO timestamps into calendar day + hour for charts and heatmap. */

export type ChartTimeZone = 'local' | 'utc'

function pad2 (n: number): string {
  return String(n).padStart(2, '0')
}

export function bucketStartTime (iso: string, zone: ChartTimeZone): { dateKey: string; hour: number } | null {
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return null
  const d = new Date(ms)
  if (zone === 'utc') {
    return {
      dateKey: d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate()),
      hour: d.getUTCHours()
    }
  }
  return {
    dateKey: d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()),
    hour: d.getHours()
  }
}

export interface DayHourHeatmap {
  days: string[]
  counts: number[][]
  maxCount: number
}

export function buildDayHourHeatmap (startTimes: string[], zone: ChartTimeZone): DayHourHeatmap {
  const pairCounts = new Map<string, number>()
  const daySet = new Set<string>()
  for (const iso of startTimes) {
    const b = bucketStartTime(iso, zone)
    if (!b) continue
    daySet.add(b.dateKey)
    const k = b.dateKey + '\t' + b.hour
    pairCounts.set(k, (pairCounts.get(k) ?? 0) + 1)
  }
  const days = [...daySet].sort((a, b) => a.localeCompare(b))
  const counts = days.map((d) =>
    Array.from({ length: 24 }, (_, h) => pairCounts.get(d + '\t' + h) ?? 0)
  )
  let maxCount = 0
  for (const row of counts) {
    for (const c of row) {
      if (c > maxCount) maxCount = c
    }
  }
  return { days, counts, maxCount }
}

/** Hourly counts for one calendar day (same zone as heatmap). */
export function buildStartsPerHourForDay (
  startTimes: string[],
  zone: ChartTimeZone,
  dateKey: string
): number[] {
  const per = Array.from({ length: 24 }, () => 0)
  for (const iso of startTimes) {
    const b = bucketStartTime(iso, zone)
    if (b && b.dateKey === dateKey) per[b.hour]++
  }
  return per
}

export interface ApexClassHourRank {
  apexClassName: string
  count: number
}

/** Top Apex classes by start count for one calendar day + hour (heatmap tooltip). */
export function buildTopApexClassesForDayHour (
  jobStarts: Array<{ startedAt: string; apexClassName: string }>,
  zone: ChartTimeZone,
  dateKey: string,
  hour: number,
  topN = 20
): ApexClassHourRank[] {
  const m = new Map<string, number>()
  for (const j of jobStarts) {
    const b = bucketStartTime(j.startedAt, zone)
    if (!b || b.dateKey !== dateKey || b.hour !== hour) continue
    const name = j.apexClassName != null ? String(j.apexClassName) : '—'
    m.set(name, (m.get(name) ?? 0) + 1)
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([apexClassName, count]) => ({ apexClassName, count }))
}

/** For each hour 0–23, top Apex classes by start count on the given calendar day (zone-aware). */
export function buildTopApexClassesByHourForDay (
  jobStarts: Array<{ startedAt: string; apexClassName: string }>,
  zone: ChartTimeZone,
  dateKey: string,
  topN = 20
): Map<number, ApexClassHourRank[]> {
  const perHour = new Map<number, Map<string, number>>()
  for (let h = 0; h < 24; h++) perHour.set(h, new Map())

  for (const j of jobStarts) {
    const b = bucketStartTime(j.startedAt, zone)
    if (!b || b.dateKey !== dateKey) continue
    const m = perHour.get(b.hour)
    if (!m) continue
    const name = j.apexClassName != null ? String(j.apexClassName) : '—'
    m.set(name, (m.get(name) ?? 0) + 1)
  }

  const out = new Map<number, ApexClassHourRank[]>()
  for (let h = 0; h < 24; h++) {
    const m = perHour.get(h) ?? new Map()
    const rows = [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([apexClassName, count]) => ({ apexClassName, count }))
    out.set(h, rows)
  }
  return out
}

export interface DailyVolumeRow {
  date: string
  count: number
}

export function buildDailyVolume (startTimes: string[], zone: ChartTimeZone): DailyVolumeRow[] {
  const byDay = new Map<string, number>()
  for (const iso of startTimes) {
    const b = bucketStartTime(iso, zone)
    if (!b) continue
    byDay.set(b.dateKey, (byDay.get(b.dateKey) ?? 0) + 1)
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))
}
