import { useEffect, useState, type JSX } from 'react'
import { ExportCsvIcon } from '../../components/ui/ExportCsvIcon'
import { fetchBatchJobsForStore } from '../../services/batchFetch'
import { useAppStore } from '../../stores/appStore'
import { DEFAULT_LIMIT } from '../../utils/constants'
import { exportBatchJobsCsv } from '../../utils/csvExport'
import { clampLimit } from '../../utils/filters'
import { getTimezoneOffsetString } from '../../utils/format'
import { JobsTable } from './JobsTable'
import { StatusFilters } from './StatusFilters'

export function BatchMonitorPanel (): JSX.Element {
  const selectedOrg = useAppStore((s) => s.selectedOrg)
  const activeTab = useAppStore((s) => s.activeTab)
  const jobIdFilter = useAppStore((s) => s.jobIdFilter)
  const limit = useAppStore((s) => s.limit)
  const jobs = useAppStore((s) => s.jobs)
  const sortKey = useAppStore((s) => s.sortKey)
  const sortDir = useAppStore((s) => s.sortDir)
  const showLocalTz = useAppStore((s) => s.showLocalTz)
  const requestInFlight = useAppStore((s) => s.requestInFlight)

  const setJobIdFilter = useAppStore((s) => s.setJobIdFilter)
  const setLimit = useAppStore((s) => s.setLimit)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const setShowLocalTz = useAppStore((s) => s.setShowLocalTz)

  const orgOk = !!selectedOrg.trim()
  const onBatchTab = activeTab === 'batch-monitor'
  const refreshDisabled = !orgOk || !onBatchTab || requestInFlight

  const [localSearch, setLocalSearch] = useState(() => useAppStore.getState().searchQuery)

  useEffect(() => {
    const t = window.setTimeout(() => setSearchQuery(localSearch), 300)
    return () => window.clearTimeout(t)
  }, [localSearch, setSearchQuery])

  function onRefreshNow (): void {
    const org = selectedOrg.trim()
    if (org && onBatchTab) void fetchBatchJobsForStore(org)
  }

  function onExportCsv (): void {
    const org = selectedOrg.trim()
    if (org && onBatchTab) {
      exportBatchJobsCsv(jobs, sortKey, sortDir, org)
    }
  }

  return (
    <section
      id="tab-panel-batch-monitor"
      className="tab-panel"
      role="tabpanel"
      aria-labelledby="tab-batch-monitor"
      hidden={!onBatchTab}
    >
      <section className="controls controls-row">
        <div className="control-group">
          <label htmlFor="job-id-input">Job ID (monitor single job)</label>
          <input
            type="text"
            id="job-id-input"
            placeholder="e.g. 707xx0000012345"
            aria-label="Job ID filter"
            disabled={!orgOk}
            value={jobIdFilter}
            onChange={(e) => setJobIdFilter(e.target.value)}
          />
        </div>
        <div className="control-group">
          <label htmlFor="search-input">Search by class name</label>
          <input
            type="text"
            id="search-input"
            placeholder="Apex class name"
            aria-label="Search batch by name"
            disabled={!orgOk}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
        <div className="control-group">
          <label htmlFor="limit-input">Number of results</label>
          <input
            type="number"
            id="limit-input"
            min={1}
            max={2000}
            aria-label="SOQL result limit"
            disabled={!orgOk}
            value={limit}
            onChange={(e) => {
              const raw = e.target.value
              const v = clampLimit(raw === '' ? DEFAULT_LIMIT : raw)
              setLimit(v)
            }}
            onBlur={(e) => {
              const v = clampLimit(e.target.value === '' ? DEFAULT_LIMIT : e.target.value)
              setLimit(v)
            }}
          />
        </div>
      </section>

      <StatusFilters />

      <section className="table-section">
        <div className="table-toolbar timezone-option">
          <div className="timezone-option-left">
            <label className="timezone-option-label">
              <input
                type="checkbox"
                id="show-local-tz"
                aria-describedby="timezone-display"
                disabled={!orgOk}
                checked={showLocalTz}
                onChange={(e) => setShowLocalTz(e.target.checked)}
              />
              Show in local time
            </label>
            <span id="timezone-display" className="timezone-display" aria-live="polite">
              {showLocalTz ? getTimezoneOffsetString() : 'UTC'}
            </span>
          </div>
          <div className="table-header-actions">
            <button
              type="button"
              id="batch-export-csv-btn"
              className="export-csv-btn btn-icon"
              aria-label="Export batch jobs as CSV"
              disabled={refreshDisabled}
              title="Download all rows as CSV (full records)"
              onClick={onExportCsv}
            >
              <ExportCsvIcon />
            </button>
            <button
              type="button"
              id="refresh-now-btn"
              className="refresh-btn btn-icon"
              aria-label="Refresh now"
              disabled={refreshDisabled}
              title="Refresh now"
              onClick={onRefreshNow}
            >
              ↻
            </button>
          </div>
        </div>
        <JobsTable />
      </section>
    </section>
  )
}
