import { describe, expect, it } from 'vitest'

import { observations, permits, zones } from '@/data/mock-data'
import type { Observation, Permit, Zone } from '@/data/types'
import { deriveZoneStatus, permitBlockers, zoneMatchesFilter } from './status'

const zone = (id: string, patch: Partial<Zone> = {}): Zone => ({
  ...structuredClone(zones.find((z) => z.id === id)!),
  ...patch,
})
const obs = (patch: Partial<Observation>): Observation => ({
  id: 'OBS-T',
  zoneId: 'scaffold-b',
  kind: 'hazard',
  severity: 'medium',
  title: 'test',
  reportedBy: 'test',
  reportedAt: 0,
  status: 'open',
  ...patch,
})

describe('deriveZoneStatus', () => {
  it('is clear when checks pass, permits are active and nothing significant is open', () => {
    expect(deriveZoneStatus(zone('scaffold-b'), permits, observations)).toBe('clear')
  })

  it('keeps low-severity hazard-hunt items from flagging the zone', () => {
    expect(deriveZoneStatus(zone('scaffold-b'), permits, [obs({ severity: 'low' })])).toBe('clear')
  })

  it('is caution for a medium/high observation, a pending permit or a failed check', () => {
    expect(deriveZoneStatus(zone('scaffold-b'), permits, [obs({ severity: 'high' })])).toBe('caution')
    expect(deriveZoneStatus(zone('crane'), permits, [])).toBe('caution') // PTW-2026-093 pending
    const failed = zone('scaffold-b')
    failed.checklist[0].passed = false
    expect(deriveZoneStatus(failed, permits, [])).toBe('caution')
  })

  it('is critical for an open critical observation or a stop-work notice', () => {
    expect(deriveZoneStatus(zone('scaffold-b'), permits, [obs({ severity: 'critical' })])).toBe('critical')
    expect(deriveZoneStatus(zone('scaffold-b', { stopWork: { active: true } }), permits, [])).toBe('critical')
  })
})

describe('permitBlockers', () => {
  const pending = permits.find((p) => p.id === 'PTW-2026-093')!

  it('blocks approval while a pre-use check has failed', () => {
    expect(permitBlockers(pending, zone('crane'), [])).toEqual(['1 pre-use check not passed'])
  })

  it('allows approval once every check passes', () => {
    const crane = zone('crane')
    crane.checklist.forEach((c) => (c.passed = true))
    expect(permitBlockers(pending, crane, [])).toEqual([])
  })

  it('blocks approval under stop-work or with an open critical hazard', () => {
    const crane = zone('crane', { stopWork: { active: true } })
    crane.checklist.forEach((c) => (c.passed = true))
    const blockers = permitBlockers(pending, crane, [obs({ zoneId: 'crane', severity: 'critical' })])
    expect(blockers).toContain('Stop-work notice in force')
    expect(blockers).toContain('Open critical hazard in zone')
  })

  it('rejects permits that are not pending', () => {
    const active: Permit = { ...pending, status: 'active' }
    expect(permitBlockers(active, zone('crane'), [])).toContain('Permit is not awaiting approval')
  })
})

describe('zoneMatchesFilter', () => {
  it('filters by inherent risk and by active permits', () => {
    expect(zones.filter((z) => zoneMatchesFilter(z, permits, 'high-risk')).map((z) => z.id)).not.toContain('unloading')
    expect(zones.filter((z) => zoneMatchesFilter(z, permits, 'active-permits')).map((z) => z.id)).toEqual([
      'scaffold-b',
      'sector-3',
      'excavation',
    ])
  })
})
