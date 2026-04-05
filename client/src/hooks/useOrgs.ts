import { useEffect } from 'react'
import { fetchOrgs } from '../services/api'
import { useAppStore } from '../stores/appStore'
import { getErrorMessage } from '../utils/errorUtils'

export function useOrgs (): void {
  useEffect(() => {
    let alive = true
    const { setOrgs, setOrgsLoading, setStatus } = useAppStore.getState()
    setOrgsLoading(true)
    setStatus('Loading orgs…', 'loading')
    fetchOrgs()
      .then((orgs) => {
        if (!alive) return
        setOrgs(orgs)
        setOrgsLoading(false)
        setStatus('Select an org', null)
      })
      .catch((e: unknown) => {
        if (!alive) return
        setStatus(getErrorMessage(e) || 'Failed to load orgs', 'error')
        setOrgsLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])
}
