export function timeAgo(ts: number, now = Date.now()) {
  const minutes = Math.round((now - ts) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  return `${hours} h ${minutes % 60} min ago`
}

export function timeLeft(until: number, now = Date.now()) {
  const minutes = Math.max(0, Math.round((until - now) / 60_000))
  if (minutes < 60) return `${minutes} min left`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min left`
}
