/** Kunci tanggal lokal YYYY-MM-DD (bukan UTC, agar "hari ini" sesuai zona waktu pengguna). */
export function dayKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function lastNDays(n: number, now = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now)
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() - (n - 1 - i))
    return d
  })
}

const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' })

export function relativeTime(iso: string, now = new Date()): string {
  const diffSec = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
  const abs = Math.abs(diffSec)
  if (abs < 60) return 'baru saja'
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  return rtf.format(Math.round(diffSec / 86400), 'day')
}

export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 19) return 'Selamat sore'
  return 'Selamat malam'
}
