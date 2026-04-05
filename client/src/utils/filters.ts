/** Filter and query params: interval, limit, statuses, build API URL. */

import type { JobRecord } from '../types'
import { type BatchJobStatusOption, MAX_LIMIT, MIN_INTERVAL, MIN_LIMIT } from './constants'

/** CronTrigger.State value for removed/aborted schedules (API is typically `DELETED`). */
export function isScheduledJobDeleted (state: unknown): boolean {
  return String(state ?? '').toUpperCase() === 'DELETED'
}

export function filterScheduledJobsHideDeleted (
  jobs: JobRecord[],
  hideDeleted: boolean
): JobRecord[] {
  if (!hideDeleted) return jobs
  return jobs.filter((j) => !isScheduledJobDeleted(j.state))
}

export function clampInterval (value: string | number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  if (isNaN(n) || n < MIN_INTERVAL) return MIN_INTERVAL
  return n
}

export function clampLimit (value: string | number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  if (isNaN(n) || n < MIN_LIMIT) return MIN_LIMIT
  return Math.min(n, MAX_LIMIT)
}

export interface BatchQueryParams {
  limit: number
  jobId: string
  search: string
  selectedStatuses: BatchJobStatusOption[]
}

export function buildBatchJobsUrl (targetOrg: string, params: BatchQueryParams): string {
  const sp = new URLSearchParams()
  sp.set('targetOrg', targetOrg)
  sp.set('limit', String(clampLimit(params.limit)))
  const jobId = params.jobId.trim()
  if (jobId) sp.set('jobId', jobId)
  const search = params.search.trim()
  if (search) sp.set('search', search)
  sp.set('statuses', params.selectedStatuses.join(','))
  return '/api/batch-jobs?' + sp.toString()
}
