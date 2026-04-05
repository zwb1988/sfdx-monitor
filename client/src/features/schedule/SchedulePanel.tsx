import type { JSX } from 'react'
import { ExportCsvIcon } from '../../components/ui/ExportCsvIcon'
import { useAppStore } from '../../stores/appStore'
import { exportScheduledJobsCsv } from '../../utils/csvExport'
import { filterScheduledJobsHideDeleted } from '../../utils/filters'
import { getTimezoneOffsetString } from '../../utils/format'
import { ScheduleTable } from './ScheduleTable'

export function SchedulePanel ({
  refreshScheduledJobs
}: {
  refreshScheduledJobs: () => Promise<void>
}): JSX.Element {
  const selectedOrg = useAppStore((s) => s.selectedOrg)
  const activeTab = useAppStore((s) => s.activeTab)
  const scheduleShowLocalTz = useAppStore((s) => s.scheduleShowLocalTz)
  const scheduleHideDeletedJobs = useAppStore((s) => s.scheduleHideDeletedJobs)
  const scheduleRequestInFlight = useAppStore((s) => s.scheduleRequestInFlight)
  const scheduledJobs = useAppStore((s) => s.scheduledJobs)
  const scheduleSortKey = useAppStore((s) => s.scheduleSortKey)
  const scheduleSortDir = useAppStore((s) => s.scheduleSortDir)

  const setScheduleShowLocalTz = useAppStore((s) => s.setScheduleShowLocalTz)
  const setScheduleHideDeletedJobs = useAppStore((s) => s.setScheduleHideDeletedJobs)
  const setScheduleStateHelpOpen = useAppStore((s) => s.setScheduleStateHelpOpen)

  const orgOk = !!selectedOrg.trim()
  const onScheduleTab = activeTab === 'batch-schedule'
  const refreshExportDisabled = !orgOk || scheduleRequestInFlight

  function onExportCsv (): void {
    const org = selectedOrg.trim()
    if (org) {
      const rows = filterScheduledJobsHideDeleted(scheduledJobs, scheduleHideDeletedJobs)
      exportScheduledJobsCsv(rows, scheduleSortKey, scheduleSortDir, org)
    }
  }

  return (
    <section
      id="tab-panel-batch-schedule"
      className="tab-panel"
      role="tabpanel"
      aria-labelledby="tab-batch-schedule"
      hidden={!onScheduleTab}
    >
      <section className="schedule-section table-section">
        <div className="table-toolbar timezone-option">
          <div className="timezone-option-left">
            <label className="timezone-option-label">
              <input
                type="checkbox"
                id="schedule-show-local-tz"
                aria-describedby="schedule-timezone-display"
                disabled={!orgOk}
                checked={scheduleShowLocalTz}
                onChange={(e) => setScheduleShowLocalTz(e.target.checked)}
              />
              Show in local time
            </label>
            <span id="schedule-timezone-display" className="timezone-display" aria-live="polite">
              {scheduleShowLocalTz ? getTimezoneOffsetString() : 'UTC'}
            </span>
            <label className="timezone-option-label">
              <input
                type="checkbox"
                id="schedule-hide-deleted"
                disabled={!orgOk}
                checked={scheduleHideDeletedJobs}
                onChange={(e) => setScheduleHideDeletedJobs(e.target.checked)}
              />
              Hide deleted jobs
            </label>
          </div>
          <div className="table-header-actions schedule-toolbar-actions">
            <button
              type="button"
              id="schedule-state-info-btn"
              className="info-icon-btn btn-icon"
              aria-label="Scheduled job state reference"
              title="What scheduled job states mean"
              onClick={() => setScheduleStateHelpOpen(true)}
            >
              ℹ
            </button>
            <button
              type="button"
              id="schedule-export-csv-btn"
              className="export-csv-btn btn-icon"
              aria-label="Export scheduled jobs as CSV"
              disabled={refreshExportDisabled}
              title="Download all rows as CSV (full records)"
              onClick={onExportCsv}
            >
              <ExportCsvIcon />
            </button>
            <button
              type="button"
              id="schedule-refresh-btn"
              className="refresh-btn btn-icon"
              aria-label="Refresh scheduled jobs"
              disabled={refreshExportDisabled}
              title="Refresh scheduled jobs"
              onClick={refreshScheduledJobs}
            >
              ↻
            </button>
          </div>
        </div>
        <ScheduleTable />
      </section>
    </section>
  )
}
