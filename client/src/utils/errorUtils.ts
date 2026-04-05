/** Safe message from thrown or rejected values. */
export function getErrorMessage (e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  try {
    return String(e)
  } catch {
    return 'Error'
  }
}
