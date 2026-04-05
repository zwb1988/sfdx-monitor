import { fetchOrgLimits } from './api'
import { useAppStore } from '../stores/appStore'
import { getErrorMessage } from '../utils/errorUtils'
import { clampInterval } from '../utils/filters'
import { formatDateWithSeconds } from '../utils/format'

/** One org-limits fetch; updates orgLimits and status (when on org-limits tab). */
export async function fetchOrgLimitsForStore (targetOrg: string): Promise<void> {
  const st = useAppStore.getState()
  if (st.limitsRequestInFlight) return
  st.setLimitsRequestInFlight(true)
  st.setStatus('Loading…', 'loading')
  try {
    const limits = await fetchOrgLimits(targetOrg)
    const next = useAppStore.getState()
    next.setOrgLimits(limits)
    const nowIso = new Date().toISOString()
    const sec = clampInterval(next.intervalSeconds)
    const lastStr = ' Last refreshed: ' + formatDateWithSeconds(nowIso)
    next.setStatus('Refresh every ' + sec + ' second(s).' + lastStr, null)
  } catch (e: unknown) {
    useAppStore.getState().setStatus(getErrorMessage(e) || 'Error loading org limits', 'error')
    useAppStore.getState().setOrgLimits([])
  } finally {
    useAppStore.getState().setLimitsRequestInFlight(false)
  }
}
