import { Fragment, useEffect, useRef, type JSX, type MouseEvent } from 'react'
import { useAppStore } from '../../stores/appStore'
import { CRON_TRIGGER_STATE_REFERENCE } from '../../utils/constants'

export function ScheduleStateHelpModal (): JSX.Element {
  const open = useAppStore((s) => s.scheduleStateHelpOpen)
  const setScheduleStateHelpOpen = useAppStore((s) => s.setScheduleStateHelpOpen)

  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) closeBtnRef.current?.focus()
  }, [open])

  useEffect(() => {
    function onKey (e: KeyboardEvent): void {
      if (e.key !== 'Escape') return
      if (useAppStore.getState().scheduleStateHelpOpen) {
        useAppStore.getState().setScheduleStateHelpOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function onOverlayClick (e: MouseEvent<HTMLDivElement>): void {
    if (e.target === e.currentTarget) setScheduleStateHelpOpen(false)
  }

  return (
    <div
      id="schedule-state-help-overlay"
      className={'modal-overlay' + (open ? ' is-open' : '')}
      aria-hidden={!open}
      role="dialog"
      aria-labelledby="schedule-state-help-title"
      aria-modal="true"
      onClick={onOverlayClick}
    >
      <div className="modal-dialog modal-dialog--reference">
        <div className="modal-header">
          <h2 id="schedule-state-help-title" className="modal-title">
            Scheduled job states
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="modal-close"
            aria-label="Close reference"
            onClick={() => setScheduleStateHelpOpen(false)}
          >
            ×
          </button>
        </div>
        <div id="schedule-state-help-content" className="modal-content modal-content--reference">
          <p className="cron-state-help-intro">
            These are the usual values for <code>CronTrigger.State</code> in Salesforce—the same field shown in the{' '}
            <strong>State</strong> column. Your org may occasionally show other or legacy values.
          </p>
          <dl className="cron-state-help-list">
            {CRON_TRIGGER_STATE_REFERENCE.map((row) => (
              <Fragment key={row.code}>
                <dt>
                  <code>{row.code}</code>
                </dt>
                <dd>{row.description}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
