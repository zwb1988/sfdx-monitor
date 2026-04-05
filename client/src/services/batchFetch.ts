import { fetchBatchJobs } from './api'
import { useAppStore } from '../stores/appStore'
import { getErrorMessage } from '../utils/errorUtils'
import { clampInterval } from '../utils/filters'
import { formatDateWithSeconds } from '../utils/format'

/** One batch-jobs fetch using current store filters; updates jobs and status. */
export async function fetchBatchJobsForStore (targetOrg: string): Promise<void> {
  const st = useAppStore.getState()
  if (st.requestInFlight) return
  st.setRequestInFlight(true)
  st.setStatus('Loading…', 'loading')
  try {
    const { jobs, instanceUrl } = await fetchBatchJobs(targetOrg, {
      limit: st.limit,
      jobId: st.jobIdFilter,
      search: st.searchQuery,
      selectedStatuses: st.selectedStatuses
    })
    const next = useAppStore.getState()
    next.setLastInstanceUrl(instanceUrl)
    next.setJobs(jobs)
    const nowIso = new Date().toISOString()
    next.setLastRefreshedAt(nowIso)
    const sec = clampInterval(next.intervalSeconds)
    const lastStr = ' Last refreshed: ' + formatDateWithSeconds(nowIso)
    next.setStatus('Refresh every ' + sec + ' second(s).' + lastStr, null)
  } catch (e: unknown) {
    useAppStore.getState().setStatus(getErrorMessage(e) || 'Error loading batch jobs', 'error')
    useAppStore.getState().setJobs([])
  } finally {
    useAppStore.getState().setRequestInFlight(false)
  }
}
