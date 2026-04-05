import type { JSX } from 'react'
import { useAppStore } from '../../stores/appStore'
import { STATUS_OPTIONS } from '../../utils/constants'

export function StatusFilters (): JSX.Element {
  const selectedStatuses = useAppStore((s) => s.selectedStatuses)
  const toggleStatusFilter = useAppStore((s) => s.toggleStatusFilter)
  const orgOk = !!useAppStore((s) => s.selectedOrg.trim())

  return (
    <section className="filters-section" id="filters-section">
      <fieldset className="status-filters" id="status-filters" disabled={!orgOk}>
        <legend>Filter by status</legend>
        <div className="status-checkboxes" id="status-checkboxes">
          {STATUS_OPTIONS.map((status) => (
            <label key={status} className="status-checkbox-label">
              <input
                type="checkbox"
                value={status}
                name="status"
                checked={selectedStatuses.includes(status)}
                onChange={(e) => toggleStatusFilter(status, e.target.checked)}
              />
              {' '}
              {status}
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  )
}
