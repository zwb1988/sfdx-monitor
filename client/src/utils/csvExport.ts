import type { BatchTableSortKey, ScheduleSortKey } from './constants'
import { getSortedBatchJobs, getSortedScheduledJobs } from './tableSort'
import type { JobRecord } from '../types'

function csvEscapeCell (val: unknown): string {
  const s = val == null || val === undefined ? '' : String(val)
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function rowsToCsv (headers: string[], rows: unknown[][]): string {
  if (headers.length === 0 && rows.length === 0) {
    return ''
  }
  const lines = [headers.map(csvEscapeCell).join(',')]
  for (const row of rows) {
    lines.push(row.map(csvEscapeCell).join(','))
  }
  return lines.join('\r\n')
}

function downloadCsv (filename: string, csvText: string): void {
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function sanitizeFilenamePart (s: string): string {
  return String(s || 'org').replace(/[^\w.-]+/g, '_').replace(/^_|_$/g, '').slice(0, 64) || 'org'
}

function timestampForFilename (): string {
  return new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
}

function collectUnionKeys (records: JobRecord[]): string[] {
  const keys = new Set<string>()
  for (const r of records) {
    if (!r || typeof r !== 'object') continue
    for (const k of Object.keys(r)) keys.add(k)
  }
  return [...keys].sort((a, b) => a.localeCompare(b))
}

function serializeForCsv (v: unknown): string {
  if (v === null || v === undefined) return ''
  const t = typeof v
  if (t === 'object') {
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  return String(v)
}

function exportRecordsDynamicCsv (sortedRecords: JobRecord[], filenameBase: string, orgAlias: string): void {
  const keys = collectUnionKeys(sortedRecords)
  const rows = sortedRecords.map((r) => keys.map((k) => serializeForCsv(r[k])))
  const org = sanitizeFilenamePart(orgAlias)
  const csv = rowsToCsv(keys, rows)
  downloadCsv(filenameBase + '_' + org + '_' + timestampForFilename() + '.csv', csv)
}

export function exportBatchJobsCsv (
  jobs: JobRecord[],
  sortKey: BatchTableSortKey,
  sortDir: 'asc' | 'desc',
  orgAlias: string
): void {
  const sorted = getSortedBatchJobs(jobs, sortKey, sortDir)
  exportRecordsDynamicCsv(sorted, 'batch-jobs', orgAlias)
}

export function exportScheduledJobsCsv (
  jobs: JobRecord[],
  scheduleSortKey: ScheduleSortKey,
  scheduleSortDir: 'asc' | 'desc',
  orgAlias: string
): void {
  const sorted = getSortedScheduledJobs(jobs, scheduleSortKey, scheduleSortDir)
  exportRecordsDynamicCsv(sorted, 'scheduled-jobs', orgAlias)
}
