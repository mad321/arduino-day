import { beforeEach, describe, expect, it } from 'vitest'

import { deriveZoneStatus } from '@/lib/status'
import { useSiteStore } from './site-store'

const state = () => useSiteStore.getState()
const permit = (id: string) => state().permits.find((p) => p.id === id)!
const zone = (id: string) => state().zones.find((z) => z.id === id)!
const reading = (zoneId: string, key: string) => state().telemetry[zoneId].find((r) => r.key === key)!.value
const statusOf = (id: string) => deriveZoneStatus(zone(id), state().permits, state().observations)

beforeEach(() => state().reset())

describe('permit approval', () => {
  it('refuses to approve while the lift plan check is failed', () => {
    state().approvePermit('PTW-2026-093')
    expect(permit('PTW-2026-093').status).toBe('pending')
    expect(state().toasts.at(-1)?.tone).toBe('caution')
  })

  it('activates the permit once checks pass, which brings the hook load reading live', () => {
    expect(reading('crane', 'hook')).toBe(0)
    state().toggleChecklistItem('crane', 'crn-liftplan')
    state().approvePermit('PTW-2026-093')
    expect(permit('PTW-2026-093').status).toBe('active')
    expect(reading('crane', 'hook')).toBeCloseTo(2.4, 1)
  })
})

describe('stop-work', () => {
  it('suspends active permits, turns the zone red and withdraws entrants', () => {
    state().issueStopWork('excavation', 'test')
    expect(permit('PTW-2026-088').status).toBe('suspended')
    expect(statusOf('excavation')).toBe('critical')
    expect(reading('excavation', 'entrants')).toBe(0)
    expect(state().feed[0].kind).toBe('stop-work')
  })

  it('cannot be lifted while a critical hazard is open, and never re-activates permits silently', () => {
    state().triggerScenario('cs-h2s')
    state().issueStopWork('excavation', 'H2S alarm')
    state().liftStopWork('excavation')
    expect(zone('excavation').stopWork.active).toBe(true)

    const alarm = state().observations.find((o) => o.zoneId === 'excavation' && o.severity === 'critical')!
    state().closeObservation(alarm.id)
    state().liftStopWork('excavation')
    expect(zone('excavation').stopWork.active).toBe(false)
    expect(permit('PTW-2026-088').status).toBe('pending')
  })
})

describe('simulated scenarios', () => {
  it('H₂S alarm forces the reading, fails the gas check and turns the zone critical', () => {
    state().triggerScenario('cs-h2s')
    expect(reading('excavation', 'h2s')).toBeCloseTo(12, 0)
    expect(zone('excavation').checklist.find((c) => c.id === 'exc-gas')!.passed).toBe(false)
    expect(statusOf('excavation')).toBe('critical')
  })

  it('closing the alarm restores the reading but the gas test must still be re-verified', () => {
    state().triggerScenario('cs-h2s')
    const alarm = state().observations[0]
    state().closeObservation(alarm.id)
    expect(reading('excavation', 'h2s')).toBe(0)
    expect(statusOf('excavation')).toBe('caution')
    state().toggleChecklistItem('excavation', 'exc-gas')
    expect(statusOf('excavation')).toBe('clear')
  })

  it('PPE breach lowers live compliance until the observation is closed', () => {
    const before = state().metrics.ppeCompliance
    state().triggerScenario('ppe-gate')
    expect(state().metrics.ppeCompliance).toBeCloseTo(before - 2.4, 1)
    state().closeObservation(state().observations[0].id)
    expect(state().metrics.ppeCompliance).toBeCloseTo(before, 1)
  })

  it('does not inject the same live scenario twice', () => {
    state().triggerScenario('crane-wind')
    const count = state().observations.length
    state().triggerScenario('crane-wind')
    expect(state().observations.length).toBe(count)
  })
})
