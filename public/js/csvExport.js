/** Build CSV from full record objects and trigger browser download. */

import { getSortedBatchJobs } from './table.js'
import { getSortedScheduledJobs } from './scheduleTable.js'

function csvEscapeCell (val) {
  const s = val == null || val === undefined ? '' : String(val)
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function rowsToCsv (headers, rows) {
  if (headers.length === 0 && rows.length === 0) {
    return ''
  }
  const lines = [headers.map(csvEscapeCell).join(',')]
  for (const row of rows) {
    lines.push(row.map(csvEscapeCell).join(','))
  }
  return lines.join('\r\n')
}

function downloadCsv (filename, csvText) {
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

function sanitizeFilenamePart (s) {
  return String(s || 'org').replace(/[^\w.-]+/g, '_').replace(/^_|_$/g, '').slice(0, 64) || 'org'
}

function timestampForFilename () {
  return new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
}

/** Union of all own enumerable keys across records, sorted for stable columns. */
function collectUnionKeys (records) {
  const keys = new Set()
  for (const r of records) {
    if (!r || typeof r !== 'object') continue
    for (const k of Object.keys(r)) keys.add(k)
  }
  return [...keys].sort((a, b) => a.localeCompare(b))
}

function serializeForCsv (v) {
  if (v === null || v === undefined) return ''
  const t = typeof v
  if (t === 'object') {
    try {
      return JSON.stringify(v)
    } catch (_) {
      return String(v)
    }
  }
  return String(v)
}

function exportRecordsDynamicCsv (sortedRecords, filenameBase, refs) {
  const keys = collectUnionKeys(sortedRecords)
  const rows = sortedRecords.map((r) => keys.map((k) => serializeForCsv(r[k])))
  const org = sanitizeFilenamePart(refs?.orgSelect?.value)
  const csv = rowsToCsv(keys, rows)
  downloadCsv(filenameBase + '_' + org + '_' + timestampForFilename() + '.csv', csv)
}

export function exportBatchJobsCsv (state, refs) {
  const sorted = getSortedBatchJobs(state.jobsCache, state)
  exportRecordsDynamicCsv(sorted, 'batch-jobs', refs)
}

export function exportScheduledJobsCsv (state, refs) {
  const sorted = getSortedScheduledJobs(state.scheduledJobsCache, state)
  exportRecordsDynamicCsv(sorted, 'scheduled-jobs', refs)
}
