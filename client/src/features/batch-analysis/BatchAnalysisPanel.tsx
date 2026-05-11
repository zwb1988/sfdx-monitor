import { useCallback, useEffect, useMemo, useState, type JSX } from 'react'
import { fetchBatchAnalysis } from '../../services/api'
import { useAppStore } from '../../stores/appStore'
import type { BatchAnalysisPayload } from '../../types'
import type { ApexClassHourRank, ChartTimeZone } from '../../utils/batchAnalysisBuckets'
import {
  buildDailyVolume,
  buildDayHourHeatmap,
  buildStartsPerHourForDay,
  buildTopApexClassesByHourForDay
} from '../../utils/batchAnalysisBuckets'
import { formatDate, formatDurationMs } from '../../utils/format'
import {
  BatchDailyVolumeChart,
  BatchHeatmapChart,
  BatchHourlyLineChart
} from './BatchAnalysisECharts'
import { useChartTheme } from './useChartTheme'

export function BatchAnalysisPanel (): JSX.Element {
  const selectedOrg = useAppStore((s) => s.selectedOrg)
  const activeTab = useAppStore((s) => s.activeTab)
  const openAnalysisFailuresModal = useAppStore((s) => s.openAnalysisFailuresModal)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chartZone, setChartZone] = useState<ChartTimeZone>('local')
  const [payload, setPayload] = useState<BatchAnalysisPayload | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [durationFilter, setDurationFilter] = useState('')

  const chartColors = useChartTheme()
  const handleSelectDay = useCallback((day: string) => {
    setSelectedDay(day)
  }, [])

  const orgOk = !!selectedOrg.trim()
  const onAnalysisTab = activeTab === 'batch-analysis'

  useEffect(() => {
    if (!orgOk) {
      const t = window.setTimeout(() => {
        setPayload(null)
        setError(null)
        setLoading(false)
        setSelectedDay(null)
      }, 0)
      return () => window.clearTimeout(t)
    }
  }, [orgOk])

  const startTimes = useMemo(() => payload?.startTimes ?? [], [payload])
  const jobStarts = useMemo(() => payload?.jobStarts ?? [], [payload])
  const heatmap = useMemo(() => buildDayHourHeatmap(startTimes, chartZone), [startTimes, chartZone])
  const dailyVolume = useMemo(() => buildDailyVolume(startTimes, chartZone), [startTimes, chartZone])

  const resolvedDay = useMemo(() => {
    const days = heatmap.days
    if (days.length === 0) return null
    if (selectedDay != null && days.includes(selectedDay)) return selectedDay
    return days[days.length - 1]
  }, [heatmap.days, selectedDay])

  const hourlyForSelectedDay = useMemo(() => {
    if (resolvedDay == null) return Array.from({ length: 24 }, () => 0)
    return buildStartsPerHourForDay(startTimes, chartZone, resolvedDay)
  }, [startTimes, chartZone, resolvedDay])

  const apexClassesByHourForDay = useMemo((): Map<number, ApexClassHourRank[]> => {
    if (resolvedDay == null) return new Map()
    return buildTopApexClassesByHourForDay(jobStarts, chartZone, resolvedDay)
  }, [jobStarts, chartZone, resolvedDay])

  const durationRows = useMemo(() => payload?.durationByClass ?? [], [payload])
  const filteredDurationRows = useMemo(() => {
    const q = durationFilter.trim().toLowerCase()
    if (!q) return durationRows
    return durationRows.filter((r) => r.apexClassName.toLowerCase().includes(q))
  }, [durationRows, durationFilter])

  const failureGroups = payload?.failuresByClass ?? []

  function performBatchAnalysis (): void {
    if (!onAnalysisTab || !orgOk) return
    const org = selectedOrg.trim()
    setLoading(true)
    setError(null)
    void fetchBatchAnalysis(org)
      .then((data) => {
        setPayload(data)
        setError(null)
      })
      .catch((e: unknown) => {
        setPayload(null)
        setError(e instanceof Error ? e.message : 'Failed to load batch analysis')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const summary = payload?.summary

  const zoneLabel = chartZone === 'utc' ? 'UTC' : 'Local'

  return (
    <section
      id="tab-panel-batch-analysis"
      className="tab-panel"
      role="tabpanel"
      aria-labelledby="tab-batch-analysis"
      hidden={!onAnalysisTab}
    >
      <section className="controls controls-row batch-analysis-top-controls">
        <div className="control-group">
          <span id="chart-zone-label" className="control-label-static">
            Chart time zone
          </span>
          <select
            id="batch-analysis-chart-zone"
            aria-labelledby="chart-zone-label"
            disabled={!orgOk || loading}
            value={chartZone}
            onChange={(e) => setChartZone(e.target.value === 'utc' ? 'utc' : 'local')}
          >
            <option value="local">Browser local time</option>
            <option value="utc">UTC</option>
          </select>
        </div>
        <div className="control-group control-group--batch-analysis-action">
          <span className="control-label-static" aria-hidden="true">
            Analysis
          </span>
          <button
            type="button"
            id="batch-analysis-perform-btn"
            className="btn-batch-analysis"
            disabled={!orgOk || loading || !onAnalysisTab}
            onClick={performBatchAnalysis}
          >
            Analyze Batches
          </button>
        </div>
      </section>

      <p className="batch-analysis-lede">
        Loads all <code>AsyncApexJob</code> batch rows via <strong>Bulk API 2.0</strong>{' '}
        (<code>sf data export bulk</code> to a temp CSV, then analyzed locally). Salesforce may retain only
        recent history (often on the order of days). This tab does not use the global polling interval or status line.
      </p>

      <section className="batch-analysis-metrics" aria-label="Batch analysis summary">
        <div className="batch-analysis-metric">
          <span className="batch-analysis-metric-label">Date range (job start)</span>
          <span className="batch-analysis-metric-value">
            {summary?.dateRangeMin != null && summary?.dateRangeMax != null
              ? (
              <>
                {formatDate(summary.dateRangeMin, chartZone === 'utc')}
                {' → '}
                {formatDate(summary.dateRangeMax, chartZone === 'utc')}
              </>
                )
              : '—'}
          </span>
        </div>
        <div className="batch-analysis-metric">
          <span className="batch-analysis-metric-label">Retrieved / executed</span>
          <span className="batch-analysis-metric-value">
            {summary != null
              ? `${summary.totalRetrieved.toLocaleString()} / ${summary.executedCount.toLocaleString()}`
              : '—'}
          </span>
          <span className="batch-analysis-metric-hint">All rows / terminal (completed, failed, aborted)</span>
        </div>
        <div className="batch-analysis-metric">
          <span className="batch-analysis-metric-label">Avg batch duration</span>
          <span className="batch-analysis-metric-value">
            {summary != null ? formatDurationMs(summary.overallAvgDurationMs) : '—'}
          </span>
          <span className="batch-analysis-metric-hint">Terminal jobs with start and end time</span>
        </div>
        <div className="batch-analysis-metric">
          <span className="batch-analysis-metric-label">Max execution time</span>
          <span className="batch-analysis-metric-value">
            {summary != null ? formatDurationMs(summary.maxDurationMs) : '—'}
          </span>
        </div>
      </section>

      <section className="table-section batch-analysis-section">
        {orgOk && loading && (
          <p className="batch-analysis-loading-banner" role="status">
            Running batch analysis…
          </p>
        )}

        {!orgOk && <p className="batch-analysis-placeholder">Select an environment to analyze batch history.</p>}
        {orgOk && !payload && !loading && (
          <p className="batch-analysis-placeholder">
            Click <strong>Analyze Batches</strong> to load results.
          </p>
        )}
        {orgOk && error != null && (
          <p className="batch-analysis-placeholder error" role="alert">
            {error}
          </p>
        )}

        {orgOk && payload != null && (
          <div className={'batch-analysis-body' + (loading ? ' batch-analysis-body--refreshing' : '')}>
            <div className="batch-analysis-block">
              <h3 className="batch-analysis-heading">Starts by day and hour</h3>
              <p className="batch-analysis-muted batch-analysis-chart-hint">
                Interactive heatmap (Apache ECharts). Click a cell to select that day for the line chart below.
              </p>
              <div className="batch-analysis-echart">
                <BatchHeatmapChart
                  heatmap={heatmap}
                  colors={chartColors}
                  jobStarts={jobStarts}
                  chartZone={chartZone}
                  onSelectDay={handleSelectDay}
                />
              </div>
            </div>

            <div className="batch-analysis-block">
              <h3 className="batch-analysis-heading">Batch starts per hour (one day)</h3>
              <div className="control-group analysis-day-picker">
                <label htmlFor="batch-analysis-day-select">Day</label>
                <select
                  id="batch-analysis-day-select"
                  aria-label="Day for hourly line chart"
                  disabled={heatmap.days.length === 0 || loading}
                  value={resolvedDay ?? ''}
                  onChange={(e) => setSelectedDay(e.target.value || null)}
                >
                  {heatmap.days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              {resolvedDay != null && (
                <div className="batch-analysis-echart">
                  <BatchHourlyLineChart
                    counts={hourlyForSelectedDay}
                    dayLabel={resolvedDay}
                    zoneLabel={zoneLabel}
                    colors={chartColors}
                    apexByHour={apexClassesByHourForDay}
                  />
                </div>
              )}
            </div>

            <div className="batch-analysis-block">
              <h3 className="batch-analysis-heading">Daily volume</h3>
              <p className="batch-analysis-muted batch-analysis-chart-hint">
                Click a bar to select that day for the hourly chart above.
              </p>
              <div className="batch-analysis-echart">
                <BatchDailyVolumeChart
                  rows={dailyVolume}
                  colors={chartColors}
                  onSelectDay={handleSelectDay}
                  selectedDay={resolvedDay}
                />
              </div>
            </div>

            <div className="batch-analysis-block">
              <h3 className="batch-analysis-heading">Duration by Apex class (completed jobs)</h3>
              <section className="controls controls-row batch-analysis-duration-filter">
                <div className="control-group">
                  <label htmlFor="duration-class-filter">Filter by class name</label>
                  <input
                    id="duration-class-filter"
                    type="search"
                    placeholder="Substring match"
                    autoComplete="off"
                    disabled={loading}
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(e.target.value)}
                  />
                </div>
              </section>
              <div className="table-wrapper">
                <table className="jobs-table analysis-metrics-table">
                  <thead>
                    <tr>
                      <th scope="col">Apex class</th>
                      <th scope="col">Completed</th>
                      <th scope="col">Avg</th>
                      <th scope="col">p50</th>
                      <th scope="col">p90</th>
                      <th scope="col">p95</th>
                    </tr>
                  </thead>
                  <tbody>
                    {durationRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="batch-analysis-muted">
                          No completed batch jobs with measurable duration.
                        </td>
                      </tr>
                    )}
                    {durationRows.length > 0 && filteredDurationRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="batch-analysis-muted">
                          No classes match this filter.
                        </td>
                      </tr>
                    )}
                    {filteredDurationRows.map((row) => (
                      <tr key={row.apexClassName}>
                        <td>{row.apexClassName}</td>
                        <td>{row.completedCount.toLocaleString()}</td>
                        <td>{formatDurationMs(row.avgDurationMs)}</td>
                        <td>{formatDurationMs(row.p50Ms)}</td>
                        <td>{formatDurationMs(row.p90Ms)}</td>
                        <td>{formatDurationMs(row.p95Ms)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="batch-analysis-block">
              <h3 className="batch-analysis-heading">Failures by Apex class</h3>
              <div className="table-wrapper">
                <table className="jobs-table analysis-metrics-table">
                  <thead>
                    <tr>
                      <th scope="col">Apex class</th>
                      <th scope="col">Failures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failureGroups.length === 0 && (
                      <tr>
                        <td colSpan={2} className="batch-analysis-muted">
                          No failed batch jobs in retrieved history.
                        </td>
                      </tr>
                    )}
                    {failureGroups.map((row) => (
                      <tr key={row.apexClassName}>
                        <td>
                          <button
                            type="button"
                            className="schedule-name-trigger"
                            title="View failure messages"
                            onClick={() => openAnalysisFailuresModal(row.apexClassName, row.jobs)}
                          >
                            {row.apexClassName}
                          </button>
                        </td>
                        <td>{row.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}
