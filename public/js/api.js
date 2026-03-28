/** API client: orgs and batch jobs. */

import { buildBatchJobsUrl } from './filters.js'

export async function fetchOrgs () {
  const res = await fetch('/api/orgs')
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load orgs')
  return data.orgs || []
}

export async function fetchBatchJobs (targetOrg, refs) {
  const url = buildBatchJobsUrl(targetOrg, refs)
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load batch jobs')
  return { jobs: data.jobs || [], instanceUrl: data.instanceUrl ?? null }
}

/** @param {string} targetOrg
 * @param {number} limit */
export async function fetchScheduledJobs (targetOrg, limit) {
  const params = new URLSearchParams()
  params.set('targetOrg', targetOrg)
  params.set('limit', String(limit))
  const res = await fetch('/api/scheduled-jobs?' + params.toString())
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load scheduled jobs')
  return { scheduledJobs: data.scheduledJobs || [] }
}
