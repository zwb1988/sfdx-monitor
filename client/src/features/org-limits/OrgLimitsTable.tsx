import type { JSX } from 'react'
import { TableRowCount } from '../../components/ui/TableRowCount'
import { useAppStore } from '../../stores/appStore'
import type { OrgLimitRow } from '../../types'
import {
  barLevelForPercent,
  consumptionPercent,
  limitUsed,
  sortOrgLimitsByConsumption
} from '../../utils/orgLimitsUtils'

function formatInt (n: number): string {
  return Number.isFinite(n) ? String(Math.round(n)) : '—'
}

function ConsumptionBar ({ row }: { row: OrgLimitRow }): JSX.Element {
  const pct = consumptionPercent(row)
  if (pct == null) {
    return <span className="limit-bar-na">—</span>
  }
  const level = barLevelForPercent(pct)
  return (
    <div className="limit-bar-cell">
      <div className="limit-bar-track" role="img" aria-label={`${Math.round(pct)}% used`}>
        <div
          className={'limit-bar-fill limit-bar-fill--' + level}
          style={{ width: pct + '%' }}
        />
      </div>
      <span className="limit-bar-pct">{Math.round(pct)}%</span>
    </div>
  )
}

export function OrgLimitsTable ({ nameFilter }: { nameFilter: string }): JSX.Element {
  const orgLimits = useAppStore((s) => s.orgLimits)
  const q = nameFilter.trim().toLowerCase()
  const filtered =
    q.length > 0
      ? orgLimits.filter((r) => r.name.toLowerCase().includes(q))
      : orgLimits
  const sorted = sortOrgLimitsByConsumption(filtered)

  return (
    <div className="table-wrapper">
      <TableRowCount count={sorted.length} />
      <table id="org-limits-table" className="jobs-table limits-table" aria-label="Org API limits">
        <thead>
          <tr>
            <th scope="col">Limit</th>
            <th scope="col">Max</th>
            <th scope="col">Remaining</th>
            <th scope="col">Used</th>
            <th scope="col">Consumption</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={5}>
                {orgLimits.length === 0 ? 'No limits loaded' : 'No limits match your search'}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={row.name}>
                <td className="limits-col-name">{row.name}</td>
                <td>{formatInt(row.max)}</td>
                <td>{formatInt(row.remaining)}</td>
                <td>{row.max > 0 ? formatInt(limitUsed(row)) : '—'}</td>
                <td className="limits-col-consumption">
                  <ConsumptionBar row={row} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
