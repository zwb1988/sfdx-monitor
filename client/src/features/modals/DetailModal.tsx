import { useEffect, useRef, type JSX, type MouseEvent } from 'react'
import { useAppStore } from '../../stores/appStore'
import type { JobRecord } from '../../types'
import { buildBatchDetailRows, buildScheduleDetailRows } from '../../utils/detailRows'
import { formatDate } from '../../utils/format'

export function DetailModal (): JSX.Element {
  const detailModal = useAppStore((s) => s.detailModal)
  const closeDetailModal = useAppStore((s) => s.closeDetailModal)
  const openBatchDetail = useAppStore((s) => s.openBatchDetail)
  const showLocalTz = useAppStore((s) => s.showLocalTz)
  const scheduleShowLocalTz = useAppStore((s) => s.scheduleShowLocalTz)

  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const open = detailModal != null
  const mode = detailModal?.mode
  const job = detailModal?.mode !== 'analysis-failures' ? detailModal?.job : undefined

  const useUtcBatch = !showLocalTz
  const useUtcSchedule = !scheduleShowLocalTz

  const title =
    mode === 'schedule'
      ? 'Scheduled job details'
      : mode === 'analysis-failures' && detailModal?.mode === 'analysis-failures'
        ? `Failed batch jobs · ${detailModal.apexClassName}`
        : 'Batch details'

  const rows =
    job == null
      ? []
      : mode === 'schedule'
        ? buildScheduleDetailRows(job, useUtcSchedule)
        : buildBatchDetailRows(job, useUtcBatch)

  useEffect(() => {
    if (!open) return
    closeBtnRef.current?.focus()
  }, [open, mode, job])

  useEffect(() => {
    function onKey (e: KeyboardEvent): void {
      if (e.key !== 'Escape') return
      const helpOpen = useAppStore.getState().scheduleStateHelpOpen
      if (helpOpen) return
      if (useAppStore.getState().detailModal) {
        useAppStore.getState().closeDetailModal()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function onOverlayClick (e: MouseEvent<HTMLDivElement>): void {
    if (e.target === e.currentTarget) closeDetailModal()
  }

  return (
    <div
      id="batch-detail-overlay"
      className={'modal-overlay' + (open ? ' is-open' : '')}
      aria-hidden={!open}
      role="dialog"
      aria-labelledby="batch-detail-title"
      aria-modal="true"
      onClick={onOverlayClick}
    >
      <div className={'modal-dialog' + (mode === 'analysis-failures' ? ' modal-dialog--wide' : '')}>
        <div className="modal-header">
          <h2 id="batch-detail-title" className="modal-title">
            {title}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={closeDetailModal}
          >
            ×
          </button>
        </div>
        <div id="batch-detail-content" className="modal-content">
          {open && mode === 'analysis-failures' && detailModal?.mode === 'analysis-failures' && (
            <div className="analysis-failures-table-wrap">
              <table className="jobs-table analysis-failures-table">
                <thead>
                  <tr>
                    <th scope="col">Job Id</th>
                    <th scope="col">Started</th>
                    <th scope="col">Failure message</th>
                  </tr>
                </thead>
                <tbody>
                  {detailModal.jobs.map((j, idx) => (
                    <tr key={String(j.id ?? j.Id ?? idx)}>
                      <td>
                        <button
                          type="button"
                          className="batch-id-trigger"
                          onClick={() => openBatchDetail(j)}
                        >
                          {String(j.id ?? j.Id ?? '—')}
                        </button>
                      </td>
                      <td>
                        {formatDate(
                          (j.startedAt ?? j.CreatedDate) as string | null | undefined,
                          useUtcBatch
                        )}
                      </td>
                      <td className="analysis-failures-msg">
                        {failureMessageFromJob(j)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {open && mode !== 'analysis-failures' && (
            <ul className="batch-detail-list">
              {rows.map((row) => (
                <li key={row.key}>
                  <span className="batch-detail-label">{row.label}</span>
                  <span className="batch-detail-value">
                    {row.isStatus && row.value !== '—' ? (
                      <span className={'status-badge ' + (row.statusClassName ?? '')}>{row.value}</span>
                    ) : (
                      row.value
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function failureMessageFromJob (job: JobRecord): string {
  const ext = job.extendedStatus ?? job.ExtendedStatus
  if (ext != null && String(ext).trim() !== '') return String(ext)
  const st = job.status ?? job.Status
  if (st != null && String(st).trim() !== '') return String(st)
  return '—'
}
