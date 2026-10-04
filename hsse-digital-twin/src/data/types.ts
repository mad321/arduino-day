export type Vec3 = [number, number, number]

/** Inherent risk from the zone's risk assessment. Independent of current status. */
export type RiskLevel = 'low' | 'medium' | 'high'

/** Current operational status — drives the green / amber / red colour coding. */
export type ZoneStatus = 'clear' | 'caution' | 'critical'

export type ZoneKind = 'crane' | 'scaffold' | 'steel-deck' | 'unloading' | 'excavation'

export type PermitType = 'height' | 'hot-work' | 'confined-space' | 'lifting'
export type PermitStatus = 'active' | 'pending' | 'suspended' | 'closed'

export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type ObservationKind = 'near-miss' | 'hazard' | 'unsafe-act' | 'unsafe-condition'

export type FeedKind = 'inspection' | 'permit' | 'hazard' | 'near-miss' | 'closure' | 'stop-work' | 'system'
export type FeedTone = 'info' | 'safe' | 'caution' | 'critical'

export type ZoneFilter = 'all' | 'high-risk' | 'active-permits'

export interface ChecklistItem {
  id: string
  label: string
  passed: boolean
}

export interface TelemetryReading {
  key: string
  label: string
  unit: string
  value: number
  /** Value the mock simulation drifts around. */
  nominal: number
  jitter: number
  decimals: number
  /** Inclusive safe operating range; omitted for plain counters. */
  safeRange?: [number, number]
  /**
   * Reading only applies while a permit of this type is active in the zone
   * (e.g. hook load needs a lifting permit; entrants drop to 0 when CS work is suspended).
   */
  requiresPermit?: PermitType
}

export interface StopWorkNotice {
  active: boolean
  issuedAt?: number
  issuedBy?: string
  reason?: string
}

export interface Zone {
  id: string
  code: string
  name: string
  kind: ZoneKind
  description: string
  riskLevel: RiskLevel
  riskAssessmentRef: string
  supervisor: string
  crew: number
  /** World position of the floating HTML pin. */
  anchor: Vec3
  /** Ground footprint used for the status glow: centre and [width, depth]. */
  footprint: { center: Vec3; size: [number, number] }
  /** Height of the translucent risk volume shown on hover / selection. */
  volumeHeight: number
  checklist: ChecklistItem[]
  stopWork: StopWorkNotice
}

export interface Permit {
  id: string
  type: PermitType
  zoneId: string
  status: PermitStatus
  scope: string
  issuer: string
  receiver: string
  validFrom: number
  validUntil: number
}

export interface Observation {
  id: string
  zoneId: string
  kind: ObservationKind
  severity: Severity
  title: string
  reportedBy: string
  reportedAt: number
  status: 'open' | 'closed'
  closedAt?: number
  /** While open, forces the zone's telemetry reading `telemetryKey` to `telemetryValue`. */
  telemetryKey?: string
  telemetryValue?: number
  /** While open, lowers live PPE compliance by this many percentage points. */
  ppeDrop?: number
}

export interface SiteMetrics {
  siteName: string
  siteCode: string
  shift: { name: string; start: string; end: string }
  ltiFreeDays: number
  ltiMilestones: number[]
  activeWorkers: number
  supervisorsOnDuty: number
  ppeCompliance: number
  ppeTarget: number
}

export interface FeedEvent {
  id: string
  at: number
  kind: FeedKind
  tone: FeedTone
  message: string
  zoneId?: string
}

/** A scripted incident the "Simulate" control can inject. */
export interface HazardScenario {
  id: string
  zoneId: string
  label: string
  observation: Pick<Observation, 'kind' | 'severity' | 'title' | 'telemetryKey' | 'telemetryValue' | 'ppeDrop'>
  reportedBy: string
  failChecklistItem?: string
}
