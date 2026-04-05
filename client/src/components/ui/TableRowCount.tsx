import type { JSX } from 'react'

/** Visible row count above jobs / schedule tables. */

export function TableRowCount ({ count }: { count: number }): JSX.Element {
  const text = count === 1 ? '1 row' : `${count} rows`
  return (
    <p className="table-row-count" aria-live="polite">
      Showing {text}
    </p>
  )
}
