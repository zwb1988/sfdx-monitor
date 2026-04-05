import { create } from 'zustand'
import {
  type BatchJobStatusOption,
  type BatchTableSortKey,
  DEFAULT_LIMIT,
  DEFAULT_STATUSES,
  type ScheduleSortKey,
  type ScheduleTableSortKey,
  THEME_STORAGE_KEY
} from '../utils/constants'
import { clampInterval } from '../utils/filters'
import type { DetailModalState, JobRecord, Org, StatusVariant, TabId } from '../types'

function readInitialTheme (): 'dark' | 'light' {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY)
    if (t === 'dark' || t === 'light') return t
  } catch { /* ignore */ }
  return 'dark'
}

function persistTheme (theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch { /* ignore */ }
}

export interface AppStore {
  orgs: Org[]
  orgsLoading: boolean
  selectedOrg: string
  activeTab: TabId
  theme: 'dark' | 'light'
  statusMessage: string
  statusVariant: StatusVariant

  requestInFlight: boolean
  scheduleRequestInFlight: boolean
  lastRefreshedAt: string | null
  lastInstanceUrl: string | null
  jobs: JobRecord[]
  scheduledJobs: JobRecord[]

  sortKey: BatchTableSortKey
  sortDir: 'asc' | 'desc'
  scheduleSortKey: ScheduleSortKey
  scheduleSortDir: 'asc' | 'desc'

  intervalSeconds: number
  jobIdFilter: string
  searchQuery: string
  limit: number
  selectedStatuses: BatchJobStatusOption[]

  showLocalTz: boolean
  scheduleShowLocalTz: boolean
  scheduleHideDeletedJobs: boolean

  detailModal: DetailModalState
  scheduleStateHelpOpen: boolean

  setOrgs: (orgs: Org[]) => void
  setOrgsLoading: (v: boolean) => void
  setSelectedOrg: (org: string) => void
  setActiveTab: (tab: TabId) => void
  applyThemeToDocument: (theme: 'dark' | 'light') => void
  setTheme: (theme: 'dark' | 'light') => void
  toggleTheme: () => void
  setStatus: (message: string, variant: StatusVariant) => void

  setRequestInFlight: (v: boolean) => void
  setScheduleRequestInFlight: (v: boolean) => void
  setLastRefreshedAt: (iso: string | null) => void
  setLastInstanceUrl: (url: string | null) => void
  setJobs: (jobs: JobRecord[]) => void
  setScheduledJobs: (jobs: JobRecord[]) => void

  toggleSort: (key: BatchTableSortKey) => void
  toggleScheduleSort: (key: ScheduleTableSortKey) => void

  setIntervalSeconds: (n: number) => void
  setJobIdFilter: (s: string) => void
  setSearchQuery: (s: string) => void
  setLimit: (n: number) => void
  setSelectedStatuses: (statuses: BatchJobStatusOption[]) => void
  toggleStatusFilter: (status: BatchJobStatusOption, checked: boolean) => void

  setShowLocalTz: (v: boolean) => void
  setScheduleShowLocalTz: (v: boolean) => void
  setScheduleHideDeletedJobs: (v: boolean) => void

  openBatchDetail: (job: JobRecord) => void
  openScheduleDetail: (job: JobRecord) => void
  closeDetailModal: () => void
  setScheduleStateHelpOpen: (v: boolean) => void

  clearJobsForEmptyOrg: () => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  orgs: [],
  orgsLoading: true,
  selectedOrg: '',
  activeTab: 'batch-monitor',
  theme: readInitialTheme(),
  statusMessage: '',
  statusVariant: null,

  requestInFlight: false,
  scheduleRequestInFlight: false,
  lastRefreshedAt: null,
  lastInstanceUrl: null,
  jobs: [],
  scheduledJobs: [],

  sortKey: 'startedAt',
  sortDir: 'desc',
  scheduleSortKey: 'nextFireTime',
  scheduleSortDir: 'asc',

  intervalSeconds: 10,
  jobIdFilter: '',
  searchQuery: '',
  limit: DEFAULT_LIMIT,
  selectedStatuses: [...DEFAULT_STATUSES],

  showLocalTz: false,
  scheduleShowLocalTz: false,
  scheduleHideDeletedJobs: true,

  detailModal: null,
  scheduleStateHelpOpen: false,

  setOrgs: (orgs) => set({ orgs }),
  setOrgsLoading: (orgsLoading) => set({ orgsLoading }),

  setSelectedOrg: (selectedOrg) => {
    const trimmed = selectedOrg.trim()
    if (!trimmed) {
      set({
        selectedOrg: '',
        jobs: [],
        scheduledJobs: [],
        lastRefreshedAt: null,
        statusMessage: 'Select an org',
        statusVariant: null
      })
    } else {
      set({ selectedOrg: trimmed })
    }
  },

  setActiveTab: (activeTab) => set({ activeTab }),

  applyThemeToDocument: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
  },

  setTheme: (theme) => {
    persistTheme(theme)
    set({ theme })
    get().applyThemeToDocument(theme)
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },

  setStatus: (statusMessage, statusVariant) => set({ statusMessage, statusVariant }),

  setRequestInFlight: (requestInFlight) => set({ requestInFlight }),
  setScheduleRequestInFlight: (scheduleRequestInFlight) => set({ scheduleRequestInFlight }),
  setLastRefreshedAt: (lastRefreshedAt) => set({ lastRefreshedAt }),
  setLastInstanceUrl: (lastInstanceUrl) => set({ lastInstanceUrl }),

  setJobs: (jobs) => set({ jobs }),

  setScheduledJobs: (scheduledJobs) =>
    set((s) => {
      let scheduleSortKey = s.scheduleSortKey
      let scheduleSortDir = s.scheduleSortDir
      if (scheduleSortKey === 'timesTriggered') {
        scheduleSortKey = 'nextFireTime'
        scheduleSortDir = 'asc'
      }
      return { scheduledJobs, scheduleSortKey, scheduleSortDir }
    }),

  toggleSort: (key) =>
    set((s) => {
      if (s.sortKey === key) {
        return { sortDir: s.sortDir === 'asc' ? 'desc' : 'asc' }
      }
      return { sortKey: key, sortDir: 'asc' }
    }),

  toggleScheduleSort: (key) =>
    set((s) => {
      if (s.scheduleSortKey === key) {
        return { scheduleSortDir: s.scheduleSortDir === 'asc' ? 'desc' : 'asc' }
      }
      return { scheduleSortKey: key, scheduleSortDir: 'asc' }
    }),

  setIntervalSeconds: (intervalSeconds) => set({ intervalSeconds: clampInterval(intervalSeconds) }),
  setJobIdFilter: (jobIdFilter) => set({ jobIdFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLimit: (limit) => set({ limit }),
  setSelectedStatuses: (selectedStatuses) => set({ selectedStatuses }),

  toggleStatusFilter: (status, checked) =>
    set((s) => {
      const next = new Set(s.selectedStatuses)
      if (checked) next.add(status)
      else next.delete(status)
      return { selectedStatuses: [...next] }
    }),

  setShowLocalTz: (showLocalTz) => set({ showLocalTz }),
  setScheduleShowLocalTz: (scheduleShowLocalTz) => set({ scheduleShowLocalTz }),
  setScheduleHideDeletedJobs: (scheduleHideDeletedJobs) => set({ scheduleHideDeletedJobs }),

  openBatchDetail: (job) => set({ detailModal: { mode: 'batch', job } }),
  openScheduleDetail: (job) => set({ detailModal: { mode: 'schedule', job } }),
  closeDetailModal: () => set({ detailModal: null }),
  setScheduleStateHelpOpen: (scheduleStateHelpOpen) => set({ scheduleStateHelpOpen }),

  clearJobsForEmptyOrg: () =>
    set({
      jobs: [],
      scheduledJobs: [],
      lastRefreshedAt: null
    })
}))
