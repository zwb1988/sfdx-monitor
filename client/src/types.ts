/** Loose API row shapes (SOQL / CLI). */

export type JobRecord = Record<string, unknown>

export interface Org {
  alias?: string
  username?: string
}

export type TabId = 'batch-monitor' | 'batch-schedule' | 'org-limits'

export interface OrgLimitRow {
  name: string
  max: number
  remaining: number
}

export type DetailModalState =
  | { mode: 'batch'; job: JobRecord }
  | { mode: 'schedule'; job: JobRecord }
  | null

export type StatusVariant = 'loading' | 'error' | null
