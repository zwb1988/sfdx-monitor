/** API client: orgs, batch jobs, scheduled jobs. */

import { buildBatchJobsUrl, type BatchQueryParams } from '../utils/filters'
import type { JobRecord, Org, OrgLimitRow } from '../types'

interface OrgListJson {
  error?: string
  orgs?: Org[]
}

interface BatchJobsJson {
  error?: string
  jobs?: JobRecord[]
  instanceUrl?: string | null
}

export interface BatchJobsResult {
  jobs: JobRecord[]
  instanceUrl: string | null
}

interface OrgLimitsJson {
  error?: string
  limits?: OrgLimitRow[]
}

interface ScheduledJobsJson {
  error?: string
  scheduledJobs?: JobRecord[]
}

export interface ScheduledJobsResult {
  scheduledJobs: JobRecord[]
}

export async function fetchOrgs (): Promise<Org[]> {
  const res = await fetch('/api/orgs')
  const data = await res.json() as OrgListJson
  if (!res.ok) throw new Error(data.error || 'Failed to load orgs')
  return data.orgs ?? []
}

export async function fetchBatchJobs (targetOrg: string, params: BatchQueryParams): Promise<BatchJobsResult> {
  const url = buildBatchJobsUrl(targetOrg, params)
  const res = await fetch(url)
  const data = await res.json() as BatchJobsJson
  if (!res.ok) throw new Error(data.error || 'Failed to load batch jobs')
  return { jobs: data.jobs ?? [], instanceUrl: data.instanceUrl ?? null }
}

export async function fetchOrgLimits (targetOrg: string): Promise<OrgLimitRow[]> {
  const params = new URLSearchParams()
  params.set('targetOrg', targetOrg)
  const res = await fetch('/api/org-limits?' + params.toString())
  const data = await res.json() as OrgLimitsJson
  if (!res.ok) throw new Error(data.error || 'Failed to load org limits')
  return data.limits ?? []
}

export async function fetchScheduledJobs (targetOrg: string): Promise<ScheduledJobsResult> {
  const params = new URLSearchParams()
  params.set('targetOrg', targetOrg)
  const res = await fetch('/api/scheduled-jobs?' + params.toString())
  const data = await res.json() as ScheduledJobsJson
  if (!res.ok) throw new Error(data.error || 'Failed to load scheduled jobs')
  return { scheduledJobs: data.scheduledJobs ?? [] }
}
