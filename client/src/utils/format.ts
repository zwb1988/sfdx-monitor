/** Formatting and display utilities. */

export function formatDate (isoString: string | null | undefined, useUtc: boolean): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    const opts: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short' }
    if (useUtc) opts.timeZone = 'UTC'
    return d.toLocaleString(undefined, opts)
  } catch {
    return isoString
  }
}

export function formatDateWithSeconds (isoString: string | null | undefined): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })
  } catch {
    return String(isoString)
  }
}

export function getTimezoneOffsetString (): string {
  const min = -new Date().getTimezoneOffset()
  const h = Math.floor(Math.abs(min) / 60)
  const m = Math.abs(min) % 60
  const sign = min >= 0 ? '+' : '-'
  if (m === 0) return 'UTC' + sign + h
  return 'UTC' + sign + h + ':' + String(m).padStart(2, '0')
}
