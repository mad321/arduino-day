import { create } from 'zustand'

import {
  ACTING_USER,
  auditFeed,
  hazardScenarios,
  observations as seedObservations,
  permits as seedPermits,
  siteMetrics,
  telemetry as seedTelemetry,
  zones as seedZones,
} from '@/data/mock-data'
import type {
  FeedEvent,
  FeedTone,
  Observation,
  ObservationKind,
  Permit,
  Severity,
  SiteMetrics,
  TelemetryReading,
  Zone,
  ZoneFilter,
} from '@/data/types'
import { playCue, type Cue } from '@/lib/sound'
import { PERMIT_LABEL, hasActivePermit, permitBlockers } from '@/lib/status'

export interface Toast {
  id: string
  tone: FeedTone
  title: string
  body?: string
  zoneId?: string
}

export interface FlagHazardInput {
  title: string
  severity: Severity
  kind: ObservationKind
}

interface SiteState {
  metrics: SiteMetrics
  /** PPE compliance before open observations' `ppeDrop` is applied. */
  ppeBaseline: number
  zones: Zone[]
  permits: Permit[]
  observations: Observation[]
  telemetry: Record<string, TelemetryReading[]>
  feed: FeedEvent[]
  toasts: Toast[]
  selectedZoneId: string | null
  hoveredZoneId: string | null
  filter: ZoneFilter
  soundEnabled: boolean

  selectZone: (id: string | null) => void
  hoverZone: (id: string | null) => void
  setFilter: (filter: ZoneFilter) => void
  toggleSound: () => void
  toggleChecklistItem: (zoneId: string, itemId: string) => void
  approvePermit: (permitId: string) => void
  flagHazard: (zoneId: string, input: FlagHazardInput) => void
  closeObservation: (observationId: string) => void
  issueStopWork: (zoneId: string, reason: string) => void
  liftStopWork: (zoneId: string) => void
  triggerScenario: (scenarioId?: string) => void
  tick: () => void
  dismissToast: (id: string) => void
  reset: () => void
}

let seq = 0
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`
let obsNumber = 417
const nextObservationId = () => `OBS-${String(obsNumber++).padStart(4, '0')}`

const FEED_LIMIT = 60
const TOAST_LIMIT = 4

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const noise = (amplitude: number) => (Math.random() * 2 - 1) * amplitude
const round = (v: number, decimals: number) => Number(v.toFixed(decimals))

/**
 * Recompute live readings. Open observations that carry a telemetry value force it
 * (e.g. an H₂S alarm); permit-gated readings drop to 0 when that work is not active.
 */
function computeTelemetry(
  current: Record<string, TelemetryReading[]>,
  zones: Zone[],
  permits: Permit[],
  observations: Observation[],
  withNoise: boolean,
) {
  const next: Record<string, TelemetryReading[]> = {}
  for (const [zoneId, readings] of Object.entries(current)) {
    const zone = zones.find((z) => z.id === zoneId)
    next[zoneId] = readings.map((r) => {
      const forcing = observations.find(
        (o) => o.zoneId === zoneId && o.status === 'open' && o.telemetryKey === r.key && o.telemetryValue !== undefined,
      )
      const gatedOff =
        r.requiresPermit && (zone?.stopWork.active || !hasActivePermit(permits, zoneId, r.requiresPermit))
      const target = forcing?.telemetryValue ?? (gatedOff ? 0 : r.nominal)
      const jitter = withNoise && !gatedOff ? noise(r.jitter) : 0
      return { ...r, value: round(Math.max(0, target + jitter), r.decimals) }
    })
  }
  return next
}

function initialState() {
  const zones = structuredClone(seedZones)
  const permits = structuredClone(seedPermits)
  const observations = structuredClone(seedObservations)
  return {
    metrics: structuredClone(siteMetrics),
    ppeBaseline: siteMetrics.ppeCompliance,
    zones,
    permits,
    observations,
    telemetry: computeTelemetry(seedTelemetry, zones, permits, observations, false),
    feed: structuredClone(auditFeed),
    toasts: [] as Toast[],
    selectedZoneId: null as string | null,
    hoveredZoneId: null as string | null,
    filter: 'all' as ZoneFilter,
  }
}

const ppeDropOf = (observations: Observation[]) =>
  observations.reduce((sum, o) => sum + (o.status === 'open' ? (o.ppeDrop ?? 0) : 0), 0)

const severityTone = (s: Severity): FeedTone => (s === 'critical' ? 'critical' : s === 'low' ? 'info' : 'caution')

export const useSiteStore = create<SiteState>()((set, get) => {
  const cue = (c: Cue) => {
    if (get().soundEnabled) playCue(c)
  }

  const feedEntry = (e: Omit<FeedEvent, 'id' | 'at'>): FeedEvent => ({ ...e, id: uid('EVT'), at: Date.now() })

  const withFeed = (feed: FeedEvent[], ...entries: Omit<FeedEvent, 'id' | 'at'>[]) =>
    [...entries.map(feedEntry), ...feed].slice(0, FEED_LIMIT)

  const toast = (t: Omit<Toast, 'id'>) =>
    set((s) => ({ toasts: [...s.toasts, { ...t, id: uid('TST') }].slice(-TOAST_LIMIT) }))

  const zoneById = (id: string) => get().zones.find((z) => z.id === id)

  return {
    ...initialState(),
    soundEnabled: false,

    selectZone: (id) => {
      if (id && id !== get().selectedZoneId) cue('select')
      set({ selectedZoneId: id })
    },

    hoverZone: (id) => set({ hoveredZoneId: id }),

    setFilter: (filter) => {
      cue('toggle')
      set({ filter })
    },

    toggleSound: () => {
      const enabled = !get().soundEnabled
      set({ soundEnabled: enabled })
      if (enabled) playCue('toggle')
    },

    toggleChecklistItem: (zoneId, itemId) => {
      const zone = zoneById(zoneId)
      const item = zone?.checklist.find((c) => c.id === itemId)
      if (!zone || !item) return
      const passed = !item.passed
      cue(passed ? 'toggle' : 'flag')
      set((s) => ({
        zones: s.zones.map((z) =>
          z.id === zoneId ? { ...z, checklist: z.checklist.map((c) => (c.id === itemId ? { ...c, passed } : c)) } : z,
        ),
        feed: withFeed(s.feed, {
          kind: 'inspection',
          tone: passed ? 'safe' : 'caution',
          message: `${zone.code}: "${item.label}" ${passed ? 'verified — passed' : 'marked FAILED'} by ${ACTING_USER}.`,
          zoneId,
        }),
      }))
    },

    approvePermit: (permitId) => {
      const { permits, observations } = get()
      const permit = permits.find((p) => p.id === permitId)
      const zone = permit && zoneById(permit.zoneId)
      if (!permit || !zone) return

      const blockers = permitBlockers(permit, zone, observations)
      if (blockers.length) {
        cue('flag')
        toast({ tone: 'caution', title: `Cannot approve ${permit.id}`, body: blockers.join(' · '), zoneId: zone.id })
        return
      }

      cue('approve')
      set((s) => {
        const nextPermits = s.permits.map((p) =>
          p.id === permitId ? { ...p, status: 'active' as const, validFrom: Date.now() } : p,
        )
        return {
          permits: nextPermits,
          telemetry: computeTelemetry(s.telemetry, s.zones, nextPermits, s.observations, false),
          feed: withFeed(s.feed, {
            kind: 'permit',
            tone: 'safe',
            message: `${PERMIT_LABEL[permit.type]} Permit ${permit.id} approved — ${zone.name}.`,
            zoneId: zone.id,
          }),
        }
      })
      toast({
        tone: 'safe',
        title: `${permit.id} approved`,
        body: `${PERMIT_LABEL[permit.type]} now active at ${zone.code}.`,
        zoneId: zone.id,
      })
    },

    flagHazard: (zoneId, input) => {
      const zone = zoneById(zoneId)
      if (!zone) return
      const obs: Observation = {
        id: nextObservationId(),
        zoneId,
        kind: input.kind,
        severity: input.severity,
        title: input.title,
        reportedBy: ACTING_USER,
        reportedAt: Date.now(),
        status: 'open',
      }
      cue(input.severity === 'critical' ? 'critical' : 'flag')
      set((s) => ({
        observations: [obs, ...s.observations],
        feed: withFeed(s.feed, {
          kind: input.kind === 'near-miss' ? 'near-miss' : 'hazard',
          tone: severityTone(input.severity),
          message: `${obs.id} flagged at ${zone.code} (${input.severity}): ${input.title}`,
          zoneId,
        }),
      }))
      toast({ tone: severityTone(input.severity), title: `Hazard flagged · ${zone.code}`, body: input.title, zoneId })
    },

    closeObservation: (observationId) => {
      const obs = get().observations.find((o) => o.id === observationId)
      if (!obs || obs.status === 'closed') return
      const zone = zoneById(obs.zoneId)
      cue('close')
      set((s) => {
        const observations = s.observations.map((o) =>
          o.id === observationId ? { ...o, status: 'closed' as const, closedAt: Date.now() } : o,
        )
        return {
          observations,
          metrics: { ...s.metrics, ppeCompliance: round(s.ppeBaseline - ppeDropOf(observations), 1) },
          telemetry: computeTelemetry(s.telemetry, s.zones, s.permits, observations, false),
          feed: withFeed(s.feed, {
            kind: 'closure',
            tone: 'safe',
            message: `Hazard closed: ${obs.title}${zone ? ` (${zone.code})` : ''}.`,
            zoneId: obs.zoneId,
          }),
        }
      })
      toast({ tone: 'safe', title: `${obs.id} closed`, body: obs.title, zoneId: obs.zoneId })
    },

    issueStopWork: (zoneId, reason) => {
      const zone = zoneById(zoneId)
      if (!zone || zone.stopWork.active) return
      const suspended = get().permits.filter((p) => p.zoneId === zoneId && p.status === 'active')
      cue('critical')
      set((s) => {
        const zones = s.zones.map((z) =>
          z.id === zoneId
            ? { ...z, stopWork: { active: true, issuedAt: Date.now(), issuedBy: ACTING_USER, reason } }
            : z,
        )
        const permits = s.permits.map((p) =>
          p.zoneId === zoneId && p.status === 'active' ? { ...p, status: 'suspended' as const } : p,
        )
        return {
          zones,
          permits,
          telemetry: computeTelemetry(s.telemetry, zones, permits, s.observations, false),
          feed: withFeed(s.feed, {
            kind: 'stop-work',
            tone: 'critical',
            message: `STOP-WORK issued at ${zone.code}: ${reason}${
              suspended.length ? ` — ${suspended.map((p) => p.id).join(', ')} suspended.` : '.'
            }`,
            zoneId,
          }),
        }
      })
      toast({
        tone: 'critical',
        title: `Stop-work · ${zone.name}`,
        body: suspended.length ? `${suspended.length} permit(s) suspended. Area to be cleared.` : reason,
        zoneId,
      })
    },

    liftStopWork: (zoneId) => {
      const zone = zoneById(zoneId)
      if (!zone || !zone.stopWork.active) return
      const openCritical = get().observations.some(
        (o) => o.zoneId === zoneId && o.status === 'open' && o.severity === 'critical',
      )
      if (openCritical) {
        cue('flag')
        toast({
          tone: 'caution',
          title: 'Stop-work stays in force',
          body: 'Close the critical hazard before lifting it.',
          zoneId,
        })
        return
      }
      const revalidate = get().permits.filter((p) => p.zoneId === zoneId && p.status === 'suspended')
      cue('approve')
      set((s) => {
        const zones = s.zones.map((z) => (z.id === zoneId ? { ...z, stopWork: { active: false } } : z))
        // Suspended permits are never silently re-activated: they return to "pending" for re-approval.
        const permits = s.permits.map((p) =>
          p.zoneId === zoneId && p.status === 'suspended' ? { ...p, status: 'pending' as const } : p,
        )
        return {
          zones,
          permits,
          telemetry: computeTelemetry(s.telemetry, zones, permits, s.observations, false),
          feed: withFeed(s.feed, {
            kind: 'stop-work',
            tone: 'safe',
            message: `Stop-work lifted at ${zone.code}${
              revalidate.length ? ` — ${revalidate.length} permit(s) require re-approval.` : '.'
            }`,
            zoneId,
          }),
        }
      })
      toast({
        tone: 'safe',
        title: `Stop-work lifted · ${zone.code}`,
        body: revalidate.length ? 'Suspended permits returned to pending for re-validation.' : undefined,
        zoneId,
      })
    },

    triggerScenario: (scenarioId) => {
      const { observations } = get()
      const isLive = (title: string) => observations.some((o) => o.status === 'open' && o.title === title)
      const pool = scenarioId
        ? hazardScenarios.filter((h) => h.id === scenarioId)
        : hazardScenarios.filter((h) => !isLive(h.observation.title))
      const scenario = pool[Math.floor(Math.random() * pool.length)]
      if (!scenario) {
        toast({ tone: 'info', title: 'All simulated hazards are already live', body: 'Close some to trigger more.' })
        return
      }
      if (isLive(scenario.observation.title)) {
        toast({
          tone: 'info',
          title: 'Scenario already live',
          body: scenario.observation.title,
          zoneId: scenario.zoneId,
        })
        return
      }
      const zone = zoneById(scenario.zoneId)
      if (!zone) return

      const obs: Observation = {
        id: nextObservationId(),
        zoneId: zone.id,
        ...scenario.observation,
        reportedBy: scenario.reportedBy,
        reportedAt: Date.now(),
        status: 'open',
      }
      const { severity } = obs
      cue(severity === 'critical' ? 'critical' : 'flag')
      set((s) => {
        const zones = scenario.failChecklistItem
          ? s.zones.map((z) =>
              z.id === zone.id
                ? {
                    ...z,
                    checklist: z.checklist.map((c) =>
                      c.id === scenario.failChecklistItem ? { ...c, passed: false } : c,
                    ),
                  }
                : z,
            )
          : s.zones
        const nextObs = [obs, ...s.observations]
        return {
          zones,
          observations: nextObs,
          telemetry: computeTelemetry(s.telemetry, zones, s.permits, nextObs, true),
          metrics: { ...s.metrics, ppeCompliance: round(s.ppeBaseline - ppeDropOf(nextObs), 1) },
          feed: withFeed(s.feed, {
            kind: obs.kind === 'near-miss' ? 'near-miss' : 'hazard',
            tone: severityTone(severity),
            message: `${obs.id} at ${zone.code} (${severity}): ${obs.title}`,
            zoneId: zone.id,
          }),
        }
      })
      toast({
        tone: severityTone(severity),
        title: severity === 'critical' ? `CRITICAL · ${zone.name}` : `New ${obs.kind.replace('-', ' ')} · ${zone.code}`,
        body: obs.title,
        zoneId: zone.id,
      })
    },

    tick: () =>
      set((s) => {
        const ppeBaseline = round(clamp(s.ppeBaseline + noise(0.25) + (96.8 - s.ppeBaseline) * 0.15, 94.5, 99.2), 1)
        return {
          ppeBaseline,
          metrics: {
            ...s.metrics,
            ppeCompliance: round(clamp(ppeBaseline - ppeDropOf(s.observations), 0, 100), 1),
            activeWorkers: Math.round(clamp(s.metrics.activeWorkers + noise(1.5), 180, 192)),
          },
          telemetry: computeTelemetry(s.telemetry, s.zones, s.permits, s.observations, true),
        }
      }),

    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    reset: () => {
      cue('toggle')
      set({ ...initialState() })
    },
  }
})
