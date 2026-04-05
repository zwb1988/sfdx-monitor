import type { JSX } from 'react'
import { useAppStore } from '../../stores/appStore'

export function StatusMessage (): JSX.Element {
  const message = useAppStore((s) => s.statusMessage)
  const variant = useAppStore((s) => s.statusVariant)

  const className =
    'status-message status-message--tabs' + (variant ? ' ' + variant : '')

  return (
    <p id="status-message" className={className} aria-live="polite">
      {message}
    </p>
  )
}
