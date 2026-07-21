// Pure scheduler-date math (unit-testable; no DB or Electron imports).

/** Advance an ISO date by one scheduler period (Monthly when frequency is unknown). */
export function advanceDate(date: string, frequency: string | null): string {
  const d = new Date(`${date}T00:00:00Z`)
  switch (frequency) {
    case 'Daily':
      d.setUTCDate(d.getUTCDate() + 1)
      break
    case 'Weekly':
      d.setUTCDate(d.getUTCDate() + 7)
      break
    case 'Quarterly':
      d.setUTCMonth(d.getUTCMonth() + 3)
      break
    case 'Annually':
      d.setUTCFullYear(d.getUTCFullYear() + 1)
      break
    case 'Monthly':
    default:
      d.setUTCMonth(d.getUTCMonth() + 1)
  }
  return d.toISOString().slice(0, 10)
}
