export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export function formatRelative(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function nextDoseTime(lastDoseIso, frequencyHours) {
  if (!lastDoseIso) return null;
  const next = new Date(new Date(lastDoseIso).getTime() + frequencyHours * 3600000);
  return next;
}

export function isDueNow(lastDoseIso, frequencyHours) {
  if (!lastDoseIso) return true;
  const next = nextDoseTime(lastDoseIso, frequencyHours);
  return Date.now() >= next.getTime();
}

export function formatNextDue(lastDoseIso, frequencyHours) {
  if (!lastDoseIso) return 'Not logged yet';
  if (isDueNow(lastDoseIso, frequencyHours)) return 'Due now';
  const next = nextDoseTime(lastDoseIso, frequencyHours);
  const diff = next.getTime() - Date.now();
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 0) return `Due in ${hrs}h ${mins}m`;
  return `Due in ${mins}m`;
}
