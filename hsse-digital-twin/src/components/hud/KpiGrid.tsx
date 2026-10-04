import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { CircleCheck, FileCheck2, HardHat, ShieldCheck, TriangleAlert, Trophy } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import type { PermitType, Severity } from '@/data/types'
import { cn } from '@/lib/utils'
import { PERMIT_SHORT, STATUS_HEX } from '@/lib/status'
import { useSiteStore } from '@/store/site-store'
import { CountUp } from './CountUp'

export function KpiGrid() {
  // On mobile the bottom-sheet inspection panel needs the room; KPIs return when it closes.
  const panelOpen = useSiteStore((s) => s.selectedZoneId !== null)
  return (
    <div
      data-hud="kpi"
      className={cn(
        'scrollbar-thin pointer-events-auto -mx-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 lg:mx-0 lg:grid lg:w-fit lg:grid-cols-2 lg:overflow-visible lg:px-0 2xl:grid-cols-4',
        panelOpen && 'max-lg:hidden',
      )}
    >
      <LtiCard />
      <PermitsCard />
      <PpeCard />
      <HazardsCard />
    </div>
  )
}

function KpiCard({
  icon,
  label,
  children,
  footer,
  onClick,
  accent,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
  footer?: ReactNode
  onClick?: () => void
  accent?: string
}) {
  const Comp = onClick ? motion.button : motion.div
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        'glass relative flex w-[186px] shrink-0 snap-start flex-col gap-1.5 overflow-hidden p-3 text-left lg:w-[196px]',
        onClick &&
          'cursor-pointer transition-colors hover:border-zinc-700 focus-visible:ring-2 focus-visible:ring-ring/50 outline-none',
      )}
    >
      {accent && (
        <span
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
      )}
      <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
        {icon}
        {label}
      </div>
      {children}
      {footer && <div className="mt-auto text-[11px] text-zinc-500 max-lg:hidden">{footer}</div>}
    </Comp>
  )
}

function LtiCard() {
  const { ltiFreeDays, ltiMilestones } = useSiteStore((s) => s.metrics)
  const achieved = [...ltiMilestones].reverse().find((m) => m <= ltiFreeDays) ?? 0
  const next = ltiMilestones.find((m) => m > ltiFreeDays)
  const progress = next ? ((ltiFreeDays - achieved) / (next - achieved)) * 100 : 100

  return (
    <KpiCard
      icon={<ShieldCheck className="size-3.5 text-safe" />}
      label="LTI-Free Days"
      accent={STATUS_HEX.clear}
      footer={next ? `${next - ltiFreeDays} days to ${next}-day milestone` : 'All milestones achieved'}
    >
      <div className="flex items-end justify-between gap-2">
        <CountUp value={ltiFreeDays} className="font-mono text-3xl leading-none font-semibold text-zinc-50" />
        {achieved > 0 && (
          <span className="flex items-center gap-1 rounded-md border border-brand/30 bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
            <Trophy className="size-3" />
            {achieved}+
          </span>
        )}
      </div>
      <Progress value={progress} indicatorClassName="bg-safe" aria-label="Progress to next LTI-free milestone" />
    </KpiCard>
  )
}

const HIGH_RISK_TYPES: PermitType[] = ['height', 'hot-work', 'confined-space', 'lifting']

function PermitsCard() {
  const permits = useSiteStore((s) => s.permits)
  const setFilter = useSiteStore((s) => s.setFilter)
  const active = permits.filter((p) => p.status === 'active' && HIGH_RISK_TYPES.includes(p.type))
  const pending = permits.filter((p) => p.status === 'pending').length
  const suspended = permits.filter((p) => p.status === 'suspended').length
  const breakdown = HIGH_RISK_TYPES.map((t) => [t, active.filter((p) => p.type === t).length] as const).filter(
    ([, n]) => n > 0,
  )

  return (
    <KpiCard
      icon={<FileCheck2 className="size-3.5 text-brand" />}
      label="High-Risk PTW"
      onClick={() => setFilter('active-permits')}
      footer={
        <span className="flex flex-wrap gap-x-2">
          {pending > 0 && <span className="text-caution">{pending} awaiting approval</span>}
          {suspended > 0 && <span className="text-critical">{suspended} suspended</span>}
          {!pending && !suspended && 'No permits waiting'}
        </span>
      }
    >
      <div className="flex items-baseline gap-1.5">
        <CountUp value={active.length} className="font-mono text-3xl leading-none font-semibold text-zinc-50" />
        <span className="text-xs text-zinc-400">active</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {breakdown.map(([type, n]) => (
          <span key={type} className="rounded bg-zinc-800 px-1.5 py-px text-[10px] text-zinc-300">
            {n} {PERMIT_SHORT[type]}
          </span>
        ))}
        {breakdown.length === 0 && <span className="text-[10px] text-zinc-500">None active</span>}
      </div>
    </KpiCard>
  )
}

function PpeCard() {
  const { ppeCompliance, ppeTarget } = useSiteStore((s) => s.metrics)
  const tone = ppeCompliance >= ppeTarget ? 'clear' : ppeCompliance >= ppeTarget - 5 ? 'caution' : 'critical'
  const hex = STATUS_HEX[tone]
  const r = 22
  const c = 2 * Math.PI * r

  return (
    <KpiCard
      icon={<HardHat className="size-3.5" style={{ color: hex }} />}
      label="PPE Compliance"
      accent={hex}
      footer={
        <span className="flex items-center gap-1">
          <span className="size-1.5 animate-pulse rounded-full bg-safe" />
          Live · target ≥ {ppeTarget}%
        </span>
      }
    >
      <div className="flex items-center gap-3">
        <svg
          viewBox="0 0 56 56"
          className="size-14 -rotate-90"
          role="img"
          aria-label={`PPE compliance ${ppeCompliance}%`}
        >
          <circle cx="28" cy="28" r={r} fill="none" stroke="#27272a" strokeWidth="5" />
          <circle
            cx="28"
            cy="28"
            r={r}
            fill="none"
            stroke={hex}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - ppeCompliance / 100)}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.4s' }}
          />
          {/* target tick */}
          <line
            x1="28"
            y1={28 - r - 4}
            x2="28"
            y2={28 - r + 4}
            stroke="#a1a1aa"
            strokeWidth="1.2"
            transform={`rotate(${(ppeTarget / 100) * 360 + 90} 28 28)`}
          />
        </svg>
        <div>
          <div className="font-mono text-2xl leading-none font-semibold" style={{ color: hex }}>
            <CountUp value={ppeCompliance} decimals={1} />%
          </div>
          <div className="mt-1 text-[10px] text-zinc-500">{tone === 'clear' ? 'On target' : 'Below target'}</div>
        </div>
      </div>
    </KpiCard>
  )
}

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low']

function HazardsCard() {
  const observations = useSiteStore((s) => s.observations)
  const selectZone = useSiteStore((s) => s.selectZone)
  const open = observations.filter((o) => o.status === 'open')
  const closed = observations.filter((o) => o.status === 'closed').length
  const counts = SEVERITY_ORDER.map((sev) => [sev, open.filter((o) => o.severity === sev).length] as const).filter(
    ([, n]) => n,
  )
  const worst = SEVERITY_ORDER.flatMap((sev) => open.filter((o) => o.severity === sev))[0]
  const tone = open.some((o) => o.severity === 'critical')
    ? 'critical'
    : open.some((o) => o.severity !== 'low')
      ? 'caution'
      : 'clear'

  return (
    <KpiCard
      icon={<TriangleAlert className="size-3.5" style={{ color: STATUS_HEX[tone] }} />}
      label="Open Hazards"
      accent={tone === 'clear' ? undefined : STATUS_HEX[tone]}
      onClick={worst ? () => selectZone(worst.zoneId) : undefined}
      footer={
        <span className="flex items-center gap-1 text-safe">
          <CircleCheck className="size-3" />
          {closed} closed this shift
        </span>
      }
    >
      <div className="flex items-baseline gap-1.5">
        <CountUp value={open.length} className="font-mono text-3xl leading-none font-semibold text-zinc-50" />
        <span className="text-xs text-zinc-400">hunts / near-misses</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {counts.map(([sev, n]) => (
          <span
            key={sev}
            className="rounded px-1.5 py-px text-[10px] capitalize"
            style={{
              backgroundColor:
                sev === 'low' ? '#27272a' : `${sev === 'critical' ? STATUS_HEX.critical : STATUS_HEX.caution}22`,
              color: sev === 'low' ? '#d4d4d8' : sev === 'critical' ? STATUS_HEX.critical : STATUS_HEX.caution,
            }}
          >
            {n} {sev}
          </span>
        ))}
      </div>
    </KpiCard>
  )
}
