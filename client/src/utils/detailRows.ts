/** Build key/value rows for batch and schedule detail modals (from legacy modal.js). */

import {
  BATCH_DETAIL_LABELS,
  BATCH_DETAIL_ORDER,
  SCHEDULE_DETAIL_LABELS,
  SCHEDULE_DETAIL_ORDER
} from './constants'
import { formatDate } from './format'
import { getProgress, statusClass } from './jobUtils'
import type { JobRecord } from '../types'

export interface DetailRow {
  key: string
  label: string
  value: string
  isStatus?: boolean
  statusClassName?: string
}

function formatBatchDetailValue (key: string, value: unknown, _job: JobRecord, useUtc: boolean): string {
  if (value === undefined || value === null || value === '') return '—'
  if (key === 'status') return String(value)
  if (key === 'startedAt' || key === 'completedAt') {
    return formatDate(String(value), useUtc)
  }
  if (key === 'id' || key === 'apexClassId' || key === 'createdById' || key === 'parentJobId') return String(value)
  return String(value)
}

function formatScheduleDetailValue (key: string, value: unknown, useUtc: boolean): string {
  if (value === undefined || value === null || value === '') return '—'
  if (key === 'nextFireTime' || key === 'previousFireTime') {
    return formatDate(String(value), useUtc)
  }
  if (key === 'id' || key === 'cronJobDetailId' || key === 'apexClassId') return String(value)
  return String(value)
}

function labelFromKey (key: string, labels: Record<string, string>): string {
  return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}

export function buildBatchDetailRows (job: JobRecord, useUtc: boolean): DetailRow[] {
  const progress = getProgress(job)
  const statusCls = statusClass(job.status)
  const seen = new Set<string>()
  const rows: DetailRow[] = []

  for (const key of BATCH_DETAIL_ORDER) {
    if (!(key in job)) continue
    seen.add(key)
    const label = BATCH_DETAIL_LABELS[key] || labelFromKey(key, BATCH_DETAIL_LABELS)
    const raw = job[key]
    let value = formatBatchDetailValue(key, raw, job, useUtc)
    if (value === '—' && raw !== undefined && raw !== null && raw !== '') value = String(raw)
    rows.push({ key, label, value, isStatus: key === 'status', statusClassName: key === 'status' ? statusCls : undefined })
  }
  for (const key of Object.keys(job)) {
    if (seen.has(key)) continue
    const label = BATCH_DETAIL_LABELS[key] || labelFromKey(key, BATCH_DETAIL_LABELS)
    const raw = job[key]
    let value = formatBatchDetailValue(key, raw, job, useUtc)
    if (value === '—' && raw !== undefined && raw !== null && raw !== '') value = String(raw)
    rows.push({ key, label, value, isStatus: key === 'status', statusClassName: key === 'status' ? statusCls : undefined })
  }

  const progressStr = progress != null ? progress + '%' : '—'
  const totalIdx = rows.findIndex((r) => r.key === 'totalJobItems')
  const progressRow: DetailRow = { key: 'progress', label: 'Progress', value: progressStr }
  if (totalIdx >= 0) {
    rows.splice(totalIdx + 1, 0, progressRow)
  } else {
    rows.push(progressRow)
  }
  return rows
}

export function buildScheduleDetailRows (job: JobRecord, useUtc: boolean): DetailRow[] {
  const seen = new Set<string>()
  const rows: DetailRow[] = []

  for (const key of SCHEDULE_DETAIL_ORDER) {
    if (!(key in job)) continue
    seen.add(key)
    const label = SCHEDULE_DETAIL_LABELS[key] || key
    const raw = job[key]
    let value = formatScheduleDetailValue(key, raw, useUtc)
    if (value === '—' && raw !== undefined && raw !== null && raw !== '') value = String(raw)
    rows.push({ key, label, value })
  }
  for (const key of Object.keys(job)) {
    if (seen.has(key)) continue
    const label = SCHEDULE_DETAIL_LABELS[key] || labelFromKey(key, SCHEDULE_DETAIL_LABELS)
    const raw = job[key]
    let value = formatScheduleDetailValue(key, raw, useUtc)
    if (value === '—' && raw !== undefined && raw !== null && raw !== '') value = String(raw)
    rows.push({ key, label, value })
  }
  return rows
}
