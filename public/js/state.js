/** Shared application state. */

export const state = {
  pollTimer: null,
  requestInFlight: false,
  scheduleRequestInFlight: false,
  activeTab: 'batch-monitor',
  lastRefreshedAt: null,
  jobsCache: [],
  scheduledJobsCache: [],
  lastInstanceUrl: null,
  currentBatchDetailJob: null,
  currentScheduleDetailJob: null,
  sortKey: 'startedAt',
  sortDir: 'desc',
  scheduleSortKey: 'nextFireTime',
  scheduleSortDir: 'asc'
}
