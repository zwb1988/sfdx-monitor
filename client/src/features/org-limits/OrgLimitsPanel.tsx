import { useState, type JSX } from 'react'
import { fetchOrgLimitsForStore } from '../../services/limitsFetch'
import { useAppStore } from '../../stores/appStore'
import { OrgLimitsTable } from './OrgLimitsTable'

export function OrgLimitsPanel (): JSX.Element {
  const [nameFilter, setNameFilter] = useState('')

  const selectedOrg = useAppStore((s) => s.selectedOrg)
  const activeTab = useAppStore((s) => s.activeTab)
  const limitsRequestInFlight = useAppStore((s) => s.limitsRequestInFlight)

  const orgOk = !!selectedOrg.trim()
  const onLimitsTab = activeTab === 'org-limits'
  const refreshDisabled = !orgOk || !onLimitsTab || limitsRequestInFlight

  function onRefreshNow (): void {
    const org = selectedOrg.trim()
    if (org && onLimitsTab) void fetchOrgLimitsForStore(org)
  }

  return (
    <section
      id="tab-panel-org-limits"
      className="tab-panel"
      role="tabpanel"
      aria-labelledby="tab-org-limits"
      hidden={!onLimitsTab}
    >
      <section className="controls controls-row">
        <div className="control-group">
          <label htmlFor="limits-name-search">Search limit by name</label>
          <input
            type="text"
            id="limits-name-search"
            placeholder="e.g. DailyApi"
            aria-label="Search limit by name"
            disabled={!orgOk}
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </div>
      </section>

      <section className="table-section">
        <div className="table-toolbar timezone-option">
          <div className="timezone-option-left" aria-hidden="true" />
          <div className="table-header-actions">
            <button
              type="button"
              id="org-limits-refresh-btn"
              className="refresh-btn btn-icon"
              aria-label="Refresh org limits"
              disabled={refreshDisabled}
              title="Refresh org limits"
              onClick={onRefreshNow}
            >
              ↻
            </button>
          </div>
        </div>
        <OrgLimitsTable nameFilter={nameFilter} />
      </section>
    </section>
  )
}
