import { useEffect, useRef, type JSX, type MouseEvent } from 'react'
import { useAppStore } from '../../stores/appStore'
import { buildBatchDetailRows, buildScheduleDetailRows } from '../../utils/detailRows'

export function DetailModal (): JSX.Element {
  const detailModal = useAppStore((s) => s.detailModal)
  const closeDetailModal = useAppStore((s) => s.closeDetailModal)
  const showLocalTz = useAppStore((s) => s.showLocalTz)
  const scheduleShowLocalTz = useAppStore((s) => s.scheduleShowLocalTz)

  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const open = detailModal != null
  const mode = detailModal?.mode
  const job = detailModal?.job

  const useUtcBatch = !showLocalTz
  const useUtcSchedule = !scheduleShowLocalTz

  const title =
    mode === 'schedule' ? 'Scheduled job details' : 'Batch details'

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
      <div className="modal-dialog">
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
          {open && (
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
