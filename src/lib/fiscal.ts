/** Day after previous FY end with the same month/day one year earlier. */
export function fyStartDate(fyEndDate: string): string {
  const end = parseISODate(fyEndDate)
  const start = new Date(end)
  start.setFullYear(start.getFullYear() - 1)
  start.setDate(start.getDate() + 1)
  return toISODate(start)
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDisplayDate(iso: string): string {
  const date = parseISODate(iso)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function daysUntil(iso: string, from = new Date()): number {
  const target = parseISODate(iso)
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  return Math.ceil((target.getTime() - start.getTime()) / 86_400_000)
}

export function todayISO(): string {
  return toISODate(new Date())
}
