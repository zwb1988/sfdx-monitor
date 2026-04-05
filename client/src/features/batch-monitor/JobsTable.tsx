import type { CSSProperties, JSX, MouseEvent } from 'react'
import { TableRowCount } from '../../components/ui/TableRowCount'
import { useAppStore } from '../../stores/appStore'
import type { JobRecord } from '../../types'
import {
  BATCH_TABLE_SORT_KEYS,
  type BatchTableSortKey,
  isBatchTableSortKey
} from '../../utils/constants'
import { formatDate } from '../../utils/format'
import { getProgress, statusClass } from '../../utils/jobUtils'
import { getSortedBatchJobs } from '../../utils/tableSort'

const BATCH_HEADER_LABELS: Record<BatchTableSortKey, string> = {
  id: 'Batch ID',
  apexClassName: 'Apex Class Name',
  jobType: 'Job Type',
  jobItemsProcessed: 'Job Items Processed',
  status: 'Status',
  totalJobItems: 'Total Job Items',
  progress: 'Progress',
  startedAt: 'Started',
  completedAt: 'Completed'
}

export function JobsTable (): JSX.Element {
  const jobs = useAppStore((s) => s.jobs)
  const sortKey = useAppStore((s) => s.sortKey)
  const sortDir = useAppStore((s) => s.sortDir)
  const showLocalTz = useAppStore((s) => s.showLocalTz)
  const toggleSort = useAppStore((s) => s.toggleSort)
  const openBatchDetail = useAppStore((s) => s.openBatchDetail)

  const useUtc = !showLocalTz
  const sorted = getSortedBatchJobs(jobs, sortKey, sortDir)

  function headerClass (key: BatchTableSortKey): string {
    let c = 'sortable'
    if (key === sortKey) {
      c += sortDir === 'asc' ? ' sort-asc' : ' sort-desc'
    }
    return c
  }

  function onHeadClick (e: MouseEvent<HTMLTableSectionElement>): void {
    const th = (e.target as HTMLElement).closest('th[data-sort]')
    if (!th) return
    const key = th.getAttribute('data-sort')
    if (key != null && isBatchTableSortKey(key)) toggleSort(key)
  }

  return (
    <div className="table-wrapper">
      <TableRowCount count={sorted.length} />
      <table id="batch-jobs-table" className="jobs-table" aria-label="Batch jobs">
        <thead onClick={onHeadClick}>
          <tr>
            {BATCH_TABLE_SORT_KEYS.map((key) => (
              <th key={key} data-sort={key} className={headerClass(key)}>
                {BATCH_HEADER_LABELS[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody id="jobs-tbody">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={9}>No batch jobs</td>
            </tr>
          ) : (
            sorted.map((job, idx) => (
              <JobRow
                key={String(job.id ?? 'job-' + idx)}
                job={job}
                useUtc={useUtc}
                onOpenDetail={openBatchDetail}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function JobRow ({
  job,
  useUtc,
  onOpenDetail
}: {
  job: JobRecord
  useUtc: boolean
  onOpenDetail: (j: JobRecord) => void
}): JSX.Element {
  const progress = getProgress(job)
  const statusCls = statusClass(job.status)
  const batchId = job.id != null ? String(job.id) : '—'

  return (
    <tr>
      <td>
        {job.id != null ? (
          <button
            type="button"
            className="batch-id-trigger"
            data-job-id={String(job.id)}
            title="View batch details"
            onClick={() => onOpenDetail(job)}
          >
            {batchId}
          </button>
        ) : (
          batchId
        )}
      </td>
      <td>{String(job.apexClassName ?? '')}</td>
      <td>{String(job.jobType ?? '')}</td>
      <td>{String(job.jobItemsProcessed ?? '')}</td>
      <td>
        <span className={'status-badge ' + statusCls}>{String(job.status ?? '')}</span>
      </td>
      <td>{String(job.totalJobItems ?? '')}</td>
      <td className="progress-cell">
        {progress != null ? (
          <div
            className="progress-ring"
            style={{ '--progress': progress } as CSSProperties}
            aria-label={progress + '%'}
          >
            <span className="progress-value">{progress}%</span>
          </div>
        ) : (
          <span className="progress-na">—</span>
        )}
      </td>
      <td>{formatDate(job.startedAt != null ? String(job.startedAt) : null, useUtc)}</td>
      <td>{formatDate(job.completedAt != null ? String(job.completedAt) : null, useUtc)}</td>
    </tr>
  )
}
