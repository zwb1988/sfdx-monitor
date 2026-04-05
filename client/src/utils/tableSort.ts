import type { BatchTableSortKey, ScheduleSortKey } from './constants'
import type { JobRecord } from '../types'
import { compare, compareScheduled, getProgress } from './jobUtils'

export function getSortedBatchJobs (
  jobs: JobRecord[],
  sortKey: BatchTableSortKey,
  sortDir: 'asc' | 'desc'
): JobRecord[] {
  const arr = (jobs || []).slice()
  arr.sort((a, b) => {
    const c = compare(a, b, sortKey, getProgress)
    return sortDir === 'asc' ? c : -c
  })
  return arr
}

export function getSortedScheduledJobs (
  jobs: JobRecord[],
  scheduleSortKey: ScheduleSortKey,
  scheduleSortDir: 'asc' | 'desc'
): JobRecord[] {
  const arr = (jobs || []).slice()
  arr.sort((a, b) => {
    const c = compareScheduled(a, b, scheduleSortKey)
    return scheduleSortDir === 'asc' ? c : -c
  })
  return arr
}
