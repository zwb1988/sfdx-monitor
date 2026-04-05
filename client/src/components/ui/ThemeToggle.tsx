import type { JSX } from 'react'
import { useAppStore } from '../../stores/appStore'

export function ThemeToggle (): JSX.Element {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      id="theme-toggle"
      className="theme-toggle"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggleTheme}
    >
      {isDark ? '☀' : '🌙'}
    </button>
  )
}
