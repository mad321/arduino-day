import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Ban,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  FileCheck2,
  Flag,
  Gauge,
  Lock,
  OctagonX,
  ShieldAlert,
  Stamp,
  TriangleAlert,
  User,
  X,
} from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Observation, ObservationKind, Permit, Severity, TelemetryReading, Zone } from '@/data/types'
import { useNow } from '@/hooks/use-now'
import {
  PERMIT_LABEL,
  PERMIT_STATUS_BADGE,
  RISK_BADGE,
  RISK_LABEL,
  SEVERITY_BADGE,
  STATUS_BADGE,
  STATUS_HEX,
  STATUS_LABEL,
  formatClock,
  isOutOfRange,
  permitBlockers,
} from '@/lib/status'
import { timeAgo, timeLeft } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useSelectedZone, useZoneStatus } from '@/store/selectors'
import { useSiteStore } from '@/store/site-store'
import { ZONE_ICON } from '../zone-icons'

const NO_READINGS: TelemetryReading[] = []

/** Slide-over on desktop, bottom sheet on mobile. Opens when a zone pin or 3D asset is clicked. */
export function InspectionPanel() {
  const zone = useSelectedZone()
  const selectZone = useSiteStore((s) => s.selectZone)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role="alertdialog"]')) selectZone(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectZone])

  return (
    <AnimatePresence mode="wait">
      {zone && (
        <motion.aside
          key={zone.id}
          role="complementary"
          aria-label={`Inspection: ${zone.name}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className={cn(
            'glass pointer-events-auto fixed z-40 flex flex-col overflow-hidden',
            // mobile: bottom sheet
            'inset-x-2 bottom-2 max-h-[55vh] rounded-2xl',
            // desktop: right slide-over between header and ticker
            'lg:inset-x-auto lg:top-(--hud-top) lg:right-3 lg:bottom-(--hud-bottom) lg:max-h-none lg:w-[420px]',
          )}
        >
          <PanelBody zone={zone} onClose={() => selectZone(null)} />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function PanelBody({ zone, onClose }: { zone: Zone; onClose: () => void }) {
  const status = useZoneStatus(zone.id)
  const permits = useSiteStore((s) => s.permits).filter((p) => p.zoneId === zone.id)
  const observations = useSiteStore((s) => s.observations).filter((o) => o.zoneId === zone.id)
  const telemetry = useSiteStore((s) => s.telemetry[zone.id] ?? NO_READINGS)
  const [flagOpen, setFlagOpen] = useState(false)
  const hex = STATUS_HEX[status]
  const Icon = ZONE_ICON[zone.kind]

  return (
    <>
      {/* Header */}
      <div className="relative border-b border-zinc-800 p-4 pb-3">
        <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: hex, boxShadow: `0 0 12px ${hex}` }} />
        <div className="flex items-start gap-3">
          <div
            className="grid size-10 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: `${hex}1f`, color: hex }}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-500">{zone.code}</span>
              <span className="font-mono text-xs text-zinc-600">·</span>
              <span className="font-mono text-xs text-zinc-500">{zone.riskAssessmentRef}</span>
            </div>
            <h2 className="truncate text-base leading-tight font-semibold text-zinc-50" title={zone.name}>
              {zone.name}
            </h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close inspection panel">
            <X />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <motion.div key={status} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Badge variant={STATUS_BADGE[status]} className="gap-1.5 px-2 py-1 text-[11px]">
              <span
                className={cn('size-1.5 rounded-full', status === 'critical' && 'animate-pulse')}
                style={{ backgroundColor: hex }}
              />
              {STATUS_LABEL[status]}
            </Badge>
          </motion.div>
          <Badge variant="outline" className="gap-1 text-[11px] text-zinc-300">
            <User />
            {zone.supervisor}
          </Badge>
          <Badge variant="outline" className="text-[11px] text-zinc-300">
            Crew {zone.crew}
          </Badge>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
        {zone.stopWork.active && <StopWorkBanner zone={zone} />}

        <Section icon={<ShieldAlert />} title="Risk Assessment">
          <div className="flex items-center gap-2">
            <Badge variant={RISK_BADGE[zone.riskLevel]} className="text-[11px]">
              {RISK_LABEL[zone.riskLevel]} risk
            </Badge>
            <span className="text-xs text-zinc-500">Inherent rating · {zone.riskAssessmentRef}</span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">{zone.description}</p>
        </Section>

        <Section icon={<FileCheck2 />} title="Permits to Work" aside={`${permits.length} linked`}>
          {permits.length === 0 && (
            <p className="text-xs text-zinc-500">No permit required for routine work in this zone.</p>
          )}
          <AnimatePresence initial={false}>
            {permits.map((p) => (
              <PermitCard key={p.id} permit={p} zone={zone} />
            ))}
          </AnimatePresence>
        </Section>

        {telemetry.length > 0 && (
          <Section icon={<Gauge />} title="Live Telemetry" aside={<LiveDot />}>
            <div className="grid grid-cols-2 gap-2">
              {telemetry.map((r) => (
                <TelemetryTile key={r.key} reading={r} />
              ))}
            </div>
          </Section>
        )}

        <Checklist zone={zone} />

        <Observations zoneId={zone.id} observations={observations} />

        <AnimatePresence>
          {flagOpen && <FlagHazardForm zone={zone} onDone={() => setFlagOpen(false)} />}
        </AnimatePresence>
      </div>

      <ActionBar zone={zone} permits={permits} flagOpen={flagOpen} onFlag={() => setFlagOpen((v) => !v)} />
    </>
  )
}

function Section({
  icon,
  title,
  aside,
  children,
}: {
  icon: ReactNode
  title: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase [&_svg]:size-3.5">
          {icon}
          {title}
        </h3>
        {aside && <span className="text-[11px] text-zinc-500">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

function LiveDot() {
  return (
    <span className="flex items-center gap-1">
      <span className="size-1.5 animate-pulse rounded-full bg-safe" />
      live
    </span>
  )
}

function StopWorkBanner({ zone }: { zone: Zone }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg border border-critical/50 bg-critical/10 p-3"
    >
      <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-critical">
        <OctagonX className="size-4" />
        STOP-WORK IN FORCE
      </div>
      <p className="mt-1 text-xs text-zinc-300">{zone.stopWork.reason}</p>
      <p className="mt-1 text-[11px] text-zinc-500">
        Issued {zone.stopWork.issuedAt ? formatClock(zone.stopWork.issuedAt) : ''} by {zone.stopWork.issuedBy}. All
        permits suspended; area to be cleared.
      </p>
    </motion.div>
  )
}

function PermitCard({ permit, zone }: { permit: Permit; zone: Zone }) {
  const observations = useSiteStore((s) => s.observations)
  const approvePermit = useSiteStore((s) => s.approvePermit)
  const now = useNow()
  const blockers = permit.status === 'pending' ? permitBlockers(permit, zone, observations) : []
  const validity = Math.min(100, Math.max(0, ((now - permit.validFrom) / (permit.validUntil - permit.validFrom)) * 100))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        'relative overflow-hidden rounded-lg border bg-zinc-950/50 p-3',
        permit.status === 'pending'
          ? 'border-caution/40'
          : permit.status === 'suspended'
            ? 'border-critical/40'
            : 'border-zinc-800',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-sm font-semibold text-zinc-100">{permit.id}</div>
          <div className="text-xs text-zinc-400">{PERMIT_LABEL[permit.type]}</div>
        </div>
        <motion.div
          key={permit.status}
          initial={{ scale: 1.4, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        >
          <Badge variant={PERMIT_STATUS_BADGE[permit.status]} className="uppercase">
            {permit.status === 'active' && <Stamp />}
            {permit.status}
          </Badge>
        </motion.div>
      </div>
      <p className="mt-1.5 text-xs text-zinc-300">{permit.scope}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
        <span>
          {permit.issuer} → {permit.receiver}
        </span>
        <span>
          {formatClock(permit.validFrom)}–{formatClock(permit.validUntil)}
        </span>
      </div>
      {permit.status === 'active' && (
        <div className="mt-2 space-y-1">
          <Progress value={validity} className="h-1" indicatorClassName="bg-zinc-500" />
          <div className="text-right text-[10px] text-zinc-500">{timeLeft(permit.validUntil, now)}</div>
        </div>
      )}
      {permit.status === 'pending' && (
        <div className="mt-2.5 space-y-2">
          {blockers.length > 0 && (
            <ul className="space-y-1">
              {blockers.map((b) => (
                <li key={b} className="flex items-center gap-1.5 text-[11px] text-caution">
                  <Lock className="size-3" />
                  {b}
                </li>
              ))}
            </ul>
          )}
          <Button size="sm" className="w-full" disabled={blockers.length > 0} onClick={() => approvePermit(permit.id)}>
            <Stamp />
            Approve {permit.id}
          </Button>
        </div>
      )}
    </motion.div>
  )
}

function TelemetryTile({ reading }: { reading: TelemetryReading }) {
  const alarm = isOutOfRange(reading.value, reading.safeRange)
  const [lo, hi] = reading.safeRange ?? [0, 0]
  const pct = reading.safeRange ? Math.min(100, (reading.value / (hi * 1.25 || 1)) * 100) : 0
  return (
    <div
      className={cn(
        'rounded-lg border bg-zinc-950/50 p-2.5 transition-colors',
        alarm ? 'border-critical/60 bg-critical/10' : 'border-zinc-800',
      )}
    >
      <div className="truncate text-[10px] text-zinc-500">{reading.label}</div>
      <div
        className={cn(
          'font-mono text-lg leading-tight font-semibold tabular-nums',
          alarm ? 'text-critical' : 'text-zinc-100',
        )}
      >
        {reading.value.toFixed(reading.decimals)}
        <span className="ml-0.5 text-[10px] font-normal text-zinc-500">{reading.unit}</span>
      </div>
      {reading.safeRange && (
        <>
          <div className="relative mt-1 h-1 rounded-full bg-zinc-800">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: alarm ? STATUS_HEX.critical : STATUS_HEX.clear }}
            />
            <div
              className="absolute inset-y-[-2px] w-px bg-zinc-400"
              style={{ left: `${(hi / (hi * 1.25)) * 100}%` }}
            />
          </div>
          <div className="mt-0.5 text-[9px] text-zinc-600">
            safe {lo}–{hi} {reading.unit}
          </div>
        </>
      )}
    </div>
  )
}

function Checklist({ zone }: { zone: Zone }) {
  const toggle = useSiteStore((s) => s.toggleChecklistItem)
  const passed = zone.checklist.filter((c) => c.passed).length
  const total = zone.checklist.length

  return (
    <Section icon={<ClipboardCheck />} title="Pre-use Inspection" aside={`${passed}/${total} passed`}>
      <Progress value={(passed / total) * 100} indicatorClassName={passed === total ? 'bg-safe' : 'bg-caution'} />
      <ul className="space-y-1">
        {zone.checklist.map((item) => (
          <li key={item.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => toggle(zone.id, item.id)}
                  aria-pressed={item.passed}
                  className="group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-800/70"
                >
                  <motion.span
                    key={String(item.passed)}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'flex w-14 shrink-0 items-center justify-center gap-1 rounded border px-1 py-0.5 text-[10px] font-bold',
                      item.passed
                        ? 'border-safe/40 bg-safe/15 text-safe'
                        : 'border-critical/40 bg-critical/15 text-critical',
                    )}
                  >
                    {item.passed ? <CircleCheck className="size-3" /> : <CircleX className="size-3" />}
                    {item.passed ? 'PASS' : 'FAIL'}
                  </motion.span>
                  <span className={cn('flex-1', !item.passed && 'text-zinc-100')}>{item.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {item.passed ? 'Mark as failed' : 'Re-verify and mark as passed'}
              </TooltipContent>
            </Tooltip>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Observations({ zoneId, observations }: { zoneId: string; observations: Observation[] }) {
  const close = useSiteStore((s) => s.closeObservation)
  const now = useNow()
  const open = observations.filter((o) => o.status === 'open')
  const closed = observations.length - open.length

  return (
    <Section icon={<TriangleAlert />} title="Hazards & Near-Misses" aside={`${open.length} open · ${closed} closed`}>
      {open.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-safe">
          <CircleCheck className="size-3.5" /> No open observations in this zone.
        </p>
      )}
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {open.map((o) => (
            <motion.li
              key={o.id}
              layout
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24, transition: { duration: 0.25 } }}
              className={cn(
                'flex items-start gap-2 rounded-lg border bg-zinc-950/50 p-2.5',
                o.severity === 'critical' ? 'border-critical/50' : 'border-zinc-800',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant={SEVERITY_BADGE[o.severity]} className="text-[10px] uppercase">
                    {o.severity}
                  </Badge>
                  <span className="font-mono text-[10px] text-zinc-500">{o.id}</span>
                  <span className="text-[10px] text-zinc-600 capitalize">{o.kind.replace('-', ' ')}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-200">{o.title}</p>
                <p className="mt-0.5 text-[10px] text-zinc-500">
                  {o.reportedBy} · {timeAgo(o.reportedAt, now)}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-zinc-400 hover:text-safe"
                    onClick={() => close(o.id)}
                    aria-label={`Close ${o.id}`}
                  >
                    <CircleCheck />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mark corrective action complete</TooltipContent>
              </Tooltip>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <span className="sr-only" aria-live="polite">
        {open.length} open observations in zone {zoneId}
      </span>
    </Section>
  )
}

const KINDS: { value: ObservationKind; label: string }[] = [
  { value: 'hazard', label: 'Hazard' },
  { value: 'near-miss', label: 'Near-miss' },
  { value: 'unsafe-act', label: 'Unsafe act' },
]
const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical']

function FlagHazardForm({ zone, onDone }: { zone: Zone; onDone: () => void }) {
  const flagHazard = useSiteStore((s) => s.flagHazard)
  const [kind, setKind] = useState<ObservationKind>('hazard')
  const [severity, setSeverity] = useState<Severity>('medium')
  const [title, setTitle] = useState('')

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        flagHazard(zone.id, { title: title.trim(), severity, kind })
        onDone()
      }}
    >
      <div className="space-y-2.5 rounded-lg border border-caution/40 bg-caution/5 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-caution">
          <Flag className="size-3.5" /> Flag hazard at {zone.code}
        </div>
        <ToggleGroup
          type="single"
          value={kind}
          onValueChange={(v) => v && setKind(v as ObservationKind)}
          className="w-full"
        >
          {KINDS.map((k) => (
            <ToggleGroupItem key={k.value} value={k.value} className="flex-1">
              {k.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          type="single"
          value={severity}
          onValueChange={(v) => v && setSeverity(v as Severity)}
          className="w-full"
          aria-label="Severity"
        >
          {SEVERITIES.map((s) => (
            <ToggleGroupItem
              key={s}
              value={s}
              className={cn(
                'flex-1 capitalize',
                s === 'critical' && 'data-[state=on]:bg-critical/20 data-[state=on]:text-critical',
                (s === 'high' || s === 'medium') && 'data-[state=on]:bg-caution/15 data-[state=on]:text-caution',
              )}
            >
              {s}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What did you observe?"
          maxLength={120}
          className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950/80 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!title.trim()}>
            Submit observation
          </Button>
        </div>
      </div>
    </motion.form>
  )
}

const STOP_REASONS = [
  'Imminent danger to persons',
  'Control measures not in place',
  'Atmospheric / environmental limit exceeded',
  'Unauthorised work in progress',
]

function ActionBar({
  zone,
  permits,
  flagOpen,
  onFlag,
}: {
  zone: Zone
  permits: Permit[]
  flagOpen: boolean
  onFlag: () => void
}) {
  const observations = useSiteStore((s) => s.observations)
  const approvePermit = useSiteStore((s) => s.approvePermit)
  const issueStopWork = useSiteStore((s) => s.issueStopWork)
  const liftStopWork = useSiteStore((s) => s.liftStopWork)
  const [reason, setReason] = useState(STOP_REASONS[0])

  const pending = permits.find((p) => p.status === 'pending')
  const blockers = pending ? permitBlockers(pending, zone, observations) : ['No permit awaiting approval']
  const openCritical = observations.some(
    (o) => o.zoneId === zone.id && o.status === 'open' && o.severity === 'critical',
  )

  return (
    <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 bg-zinc-950/60 p-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={blockers.length ? 0 : -1}
            className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Button
              size="sm"
              className="w-full"
              disabled={blockers.length > 0}
              onClick={() => pending && approvePermit(pending.id)}
            >
              <Stamp />
              Approve
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{blockers.length ? blockers.join(' · ') : `Approve ${pending?.id}`}</TooltipContent>
      </Tooltip>

      <Button
        size="sm"
        variant="outline"
        className={cn(
          'w-full border-caution/40 text-caution hover:bg-caution/10 hover:text-caution',
          flagOpen && 'bg-caution/10',
        )}
        onClick={onFlag}
        aria-expanded={flagOpen}
      >
        <Flag />
        Flag Hazard
      </Button>

      {zone.stopWork.active ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="safe" className="w-full" onClick={() => liftStopWork(zone.id)}>
              <Ban />
              Lift Stop
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {openCritical
              ? 'Close the critical hazard first'
              : 'Suspended permits will return to pending for re-approval'}
          </TooltipContent>
        </Tooltip>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive" className="w-full">
              <OctagonX />
              Stop-Work
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-critical">
                <OctagonX className="size-5" /> Issue Stop-Work Notice
              </AlertDialogTitle>
              <AlertDialogDescription>
                All work in <span className="font-medium text-zinc-200">{zone.name}</span> stops immediately.{' '}
                {permits.filter((p) => p.status === 'active').length} active permit(s) will be suspended and need
                re-approval before work resumes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <fieldset className="space-y-1.5">
              <legend className="mb-1 text-xs font-medium text-zinc-400">Reason</legend>
              {STOP_REASONS.map((r) => (
                <label
                  key={r}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                    reason === r
                      ? 'border-critical/60 bg-critical/10 text-zinc-100'
                      : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900',
                  )}
                >
                  <input
                    type="radio"
                    name="stop-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-[#ef4444]"
                  />
                  {r}
                </label>
              ))}
            </fieldset>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-critical text-white hover:bg-critical/90"
                onClick={() => issueStopWork(zone.id, reason)}
              >
                Issue Stop-Work
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
