import type { JSX } from 'react'
import { ThemeToggle } from '../ui/ThemeToggle'

export function Header (): JSX.Element {
  return (
    <header className="header">
      <h1 className="header-title">Salesforce Monitor</h1>
      <div className="theme-switcher">
        <ThemeToggle />
      </div>
    </header>
  )
}
