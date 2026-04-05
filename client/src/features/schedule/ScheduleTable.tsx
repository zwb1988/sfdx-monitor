import type { JSX, MouseEvent } from 'react'
import { TableRowCount } from '../../components/ui/TableRowCount'
import { useAppStore } from '../../stores/appStore'
import {
  SCHEDULE_TABLE_SORT_KEYS,
  type ScheduleTableSortKey,
  isScheduleTableSortKey
} from '../../utils/constants'
import { filterScheduledJobsHideDeleted } from '../../utils/filters'
import { formatDate } from '../../utils/format'
import { getSortedScheduledJobs } from '../../utils/tableSort'

const SCHEDULE_HEADER_LABELS: Record<ScheduleTableSortKey, string> = {
  name: 'Name',
  state: 'State',
  cronExpression: 'Cron expression',
  nextFireTime: 'Next fire',
  previousFireTime: 'Previous fire',
  apexClassName: 'Apex class name'
}

export function ScheduleTable (): JSX.Element {
  const scheduledJobs = useAppStore((s) => s.scheduledJobs)
  const scheduleSortKey = useAppStore((s) => s.scheduleSortKey)
  const scheduleSortDir = useAppStore((s) => s.scheduleSortDir)
  const scheduleShowLocalTz = useAppStore((s) => s.scheduleShowLocalTz)
  const scheduleHideDeletedJobs = useAppStore((s) => s.scheduleHideDeletedJobs)
  const toggleScheduleSort = useAppStore((s) => s.toggleScheduleSort)
  const openScheduleDetail = useAppStore((s) => s.openScheduleDetail)

  const useUtc = !scheduleShowLocalTz
  const visible = filterScheduledJobsHideDeleted(scheduledJobs, scheduleHideDeletedJobs)
  const sorted = getSortedScheduledJobs(visible, scheduleSortKey, scheduleSortDir)

  function headerClass (key: ScheduleTableSortKey): string {
    let c = 'sortable'
    if (key === scheduleSortKey) {
      c += scheduleSortDir === 'asc' ? ' sort-asc' : ' sort-desc'
    }
    return c
  }

  function onHeadClick (e: MouseEvent<HTMLTableSectionElement>): void {
    const th = (e.target as HTMLElement).closest('th[data-sort]')
    if (!th) return
    const key = th.getAttribute('data-sort')
    if (key != null && isScheduleTableSortKey(key)) toggleScheduleSort(key)
  }

  return (
    <div className="table-wrapper">
      <TableRowCount count={sorted.length} />
      <table id="schedule-jobs-table" className="jobs-table schedule-table" aria-label="Scheduled Apex jobs">
        <thead onClick={onHeadClick}>
          <tr>
            {SCHEDULE_TABLE_SORT_KEYS.map((key) => (
              <th key={key} data-sort={key} className={headerClass(key)}>
                {SCHEDULE_HEADER_LABELS[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody id="scheduled-tbody">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={6}>No scheduled Apex jobs</td>
            </tr>
          ) : (
            sorted.map((row, idx) => (
              <tr key={String(row.id ?? 'row-' + idx)}>
                <td>
                  {row.id != null ? (
                    <button
                      type="button"
                      className="schedule-name-trigger"
                      data-schedule-id={String(row.id)}
                      title={String(row.name ?? '—')}
                      onClick={() => openScheduleDetail(row)}
                    >
                      {String(row.name ?? '—')}
                    </button>
                  ) : (
                    <span className="schedule-name-plain" title={String(row.name ?? '—')}>
                      {String(row.name ?? '—')}
                    </span>
                  )}
                </td>
                <td>{String(row.state ?? '—')}</td>
                <td>{String(row.cronExpression ?? '—')}</td>
                <td>{formatDate(row.nextFireTime != null ? String(row.nextFireTime) : null, useUtc)}</td>
                <td>{formatDate(row.previousFireTime != null ? String(row.previousFireTime) : null, useUtc)}</td>
                <td>{String(row.apexClassName ?? '—')}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
