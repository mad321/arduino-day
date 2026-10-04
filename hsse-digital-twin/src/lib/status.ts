import type {
  FeedTone,
  Observation,
  Permit,
  PermitStatus,
  PermitType,
  RiskLevel,
  Severity,
  Zone,
  ZoneFilter,
  ZoneStatus,
} from '@/data/types'

export const STATUS_HEX: Record<ZoneStatus, string> = {
  clear: '#10b981',
  caution: '#f59e0b',
  critical: '#ef4444',
}

export const STATUS_LABEL: Record<ZoneStatus, string> = {
  clear: 'Safe · Compliant',
  caution: 'Caution · Action Needed',
  critical: 'Critical · Stop Work',
}

export const STATUS_BADGE: Record<ZoneStatus, 'safe' | 'caution' | 'critical'> = {
  clear: 'safe',
  caution: 'caution',
  critical: 'critical',
}

export const RISK_LABEL: Record<RiskLevel, string> = { low: 'Low', medium: 'Medium', high: 'High' }
export const RISK_BADGE: Record<RiskLevel, 'safe' | 'caution' | 'critical'> = {
  low: 'safe',
  medium: 'caution',
  high: 'critical',
}

export const SEVERITY_BADGE: Record<Severity, 'outline' | 'caution' | 'critical'> = {
  low: 'outline',
  medium: 'caution',
  high: 'caution',
  critical: 'critical',
}

export const PERMIT_LABEL: Record<PermitType, string> = {
  height: 'Work at Height',
  'hot-work': 'Hot Work',
  'confined-space': 'Confined Space',
  lifting: 'Lifting Operation',
}

export const PERMIT_SHORT: Record<PermitType, string> = {
  height: 'Height',
  'hot-work': 'Hot Work',
  'confined-space': 'Confined Space',
  lifting: 'Lifting',
}

export const PERMIT_STATUS_BADGE: Record<PermitStatus, 'safe' | 'caution' | 'critical' | 'outline'> = {
  active: 'safe',
  pending: 'caution',
  suspended: 'critical',
  closed: 'outline',
}

export const TONE_HEX: Record<FeedTone, string> = {
  info: '#a1a1aa',
  safe: STATUS_HEX.clear,
  caution: STATUS_HEX.caution,
  critical: STATUS_HEX.critical,
}

/**
 * Zone status is computed from the underlying records, never stored, so the
 * colour on the map always agrees with the permits, observations and checks.
 *
 *  - red:   stop-work notice in force, or an open critical observation
 *  - amber: open medium/high observation, a permit awaiting (re)approval, or a failed check
 *  - green: otherwise (low-severity hazard-hunt items are tracked but don't flag the zone)
 */
export function deriveZoneStatus(zone: Zone, permits: Permit[], observations: Observation[]): ZoneStatus {
  if (zone.stopWork.active) return 'critical'

  const open = observations.filter((o) => o.zoneId === zone.id && o.status === 'open')
  if (open.some((o) => o.severity === 'critical')) return 'critical'
  if (open.some((o) => o.severity === 'high' || o.severity === 'medium')) return 'caution'

  const zonePermits = permits.filter((p) => p.zoneId === zone.id)
  if (zonePermits.some((p) => p.status === 'pending' || p.status === 'suspended')) return 'caution'

  if (zone.checklist.some((c) => !c.passed)) return 'caution'
  return 'clear'
}

export function zoneMatchesFilter(zone: Zone, permits: Permit[], filter: ZoneFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'high-risk') return zone.riskLevel === 'high'
  return permits.some((p) => p.zoneId === zone.id && p.status === 'active')
}

/** Reasons a pending permit cannot be approved yet. Empty array = approvable. */
export function permitBlockers(permit: Permit, zone: Zone, observations: Observation[]): string[] {
  const blockers: string[] = []
  if (permit.status !== 'pending') blockers.push('Permit is not awaiting approval')
  if (zone.stopWork.active) blockers.push('Stop-work notice in force')
  const failed = zone.checklist.filter((c) => !c.passed)
  if (failed.length) blockers.push(`${failed.length} pre-use check${failed.length > 1 ? 's' : ''} not passed`)
  if (observations.some((o) => o.zoneId === zone.id && o.status === 'open' && o.severity === 'critical')) {
    blockers.push('Open critical hazard in zone')
  }
  return blockers
}

export function isOutOfRange(value: number, range?: [number, number]) {
  if (!range) return false
  return value < range[0] || value > range[1]
}

export function formatClock(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function hasActivePermit(permits: Permit[], zoneId: string, type?: PermitType) {
  return permits.some((p) => p.zoneId === zoneId && p.status === 'active' && (!type || p.type === type))
}

/** Crane slews only with an active lifting permit, no stop-work and no open critical hazard. */
export function isCraneOperational(zone: Zone | undefined, permits: Permit[], observations: Observation[]) {
  if (!zone || zone.stopWork.active) return false
  if (!hasActivePermit(permits, zone.id, 'lifting')) return false
  return !observations.some((o) => o.zoneId === zone.id && o.status === 'open' && o.severity === 'critical')
}
