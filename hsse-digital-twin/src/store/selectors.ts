import { useMemo } from 'react'

import type { ZoneStatus } from '@/data/types'
import { deriveZoneStatus, isCraneOperational, zoneMatchesFilter } from '@/lib/status'
import { useSiteStore } from './site-store'

/** Status per zone id, derived from permits / observations / checklists. */
export function useZoneStatuses(): Record<string, ZoneStatus> {
  const zones = useSiteStore((s) => s.zones)
  const permits = useSiteStore((s) => s.permits)
  const observations = useSiteStore((s) => s.observations)
  return useMemo(
    () => Object.fromEntries(zones.map((z) => [z.id, deriveZoneStatus(z, permits, observations)])),
    [zones, permits, observations],
  )
}

export function useZoneStatus(zoneId: string): ZoneStatus {
  return useZoneStatuses()[zoneId] ?? 'clear'
}

/** Whether a zone passes the active header filter (non-matching zones are dimmed, not hidden). */
export function useZoneVisibleInFilter(zoneId: string): boolean {
  const zone = useSiteStore((s) => s.zones.find((z) => z.id === zoneId))
  const permits = useSiteStore((s) => s.permits)
  const filter = useSiteStore((s) => s.filter)
  return zone ? zoneMatchesFilter(zone, permits, filter) : true
}

export function useSelectedZone() {
  const id = useSiteStore((s) => s.selectedZoneId)
  return useSiteStore((s) => (id ? s.zones.find((z) => z.id === id) : undefined))
}

export function useCraneOperational() {
  const zone = useSiteStore((s) => s.zones.find((z) => z.id === 'crane'))
  const permits = useSiteStore((s) => s.permits)
  const observations = useSiteStore((s) => s.observations)
  return useMemo(() => isCraneOperational(zone, permits, observations), [zone, permits, observations])
}

export function useZoneStopped(zoneId: string) {
  return useSiteStore((s) => s.zones.find((z) => z.id === zoneId)?.stopWork.active ?? false)
}

export function usePermitActive(zoneId: string, type: string) {
  return useSiteStore((s) => s.permits.some((p) => p.zoneId === zoneId && p.type === type && p.status === 'active'))
}
