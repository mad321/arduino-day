import { HardHat, RotateCcw, Shuffle, Siren, Users, Volume2, VolumeX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { hazardScenarios } from '@/data/mock-data'
import type { ZoneFilter } from '@/data/types'
import { useNow } from '@/hooks/use-now'
import { STATUS_HEX, STATUS_LABEL, zoneMatchesFilter } from '@/lib/status'
import { useZoneStatuses } from '@/store/selectors'
import { useSiteStore } from '@/store/site-store'
import { ZONE_ICON } from '../zone-icons'

const FILTERS: { value: ZoneFilter; label: string; short: string }[] = [
  { value: 'all', label: 'All Zones', short: 'All' },
  { value: 'high-risk', label: 'High-Risk Only', short: 'High-Risk' },
  { value: 'active-permits', label: 'Active Permits', short: 'Permits' },
]

export function HeaderBar() {
  const metrics = useSiteStore((s) => s.metrics)
  const filter = useSiteStore((s) => s.filter)
  const setFilter = useSiteStore((s) => s.setFilter)
  const zones = useSiteStore((s) => s.zones)
  const permits = useSiteStore((s) => s.permits)

  return (
    <header className="glass pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/30">
          <HardHat className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium tracking-[0.18em] text-zinc-500 uppercase">
            Smart HSSE · Digital Twin
          </div>
          <h1 className="truncate text-sm font-semibold text-zinc-100">
            <span className="text-zinc-400">Active Site:</span> {metrics.siteName}
          </h1>
        </div>
        <LiveBadge />
      </div>

      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(v) => v && setFilter(v as ZoneFilter)}
        aria-label="Zone filter"
        className="order-last w-full justify-between sm:order-none sm:w-fit"
      >
        {FILTERS.map((f) => {
          const count = zones.filter((z) => zoneMatchesFilter(z, permits, f.value)).length
          return (
            <ToggleGroupItem key={f.value} value={f.value} className="flex-1 sm:flex-none">
              <span className="hidden md:inline">{f.label}</span>
              <span className="md:hidden">{f.short}</span>
              <span className="rounded bg-zinc-700/60 px-1 font-mono text-[10px] text-zinc-300">{count}</span>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>

      <div className="ml-auto flex items-center gap-2">
        <ShiftSummary />
        <ZoneStatusStrip />
        <SimulateMenu />
        <SoundToggle />
      </div>
    </header>
  )
}

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-safe/30 bg-safe/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-safe">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-safe opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-safe" />
      </span>
      LIVE
    </span>
  )
}

function ShiftSummary() {
  const metrics = useSiteStore((s) => s.metrics)
  const now = useNow(1000)
  return (
    <div className="hidden items-center gap-3 border-r border-zinc-800 pr-3 text-xs lg:flex">
      <div className="hidden text-right leading-tight 2xl:block">
        <div className="font-medium text-zinc-200">
          {metrics.shift.name} · {metrics.shift.start}–{metrics.shift.end}
        </div>
        <div className="flex items-center justify-end gap-1 text-zinc-500">
          <Users className="size-3" />
          {metrics.activeWorkers} on site · {metrics.supervisorsOnDuty} supervisors
        </div>
      </div>
      <span
        className="flex items-center gap-1 text-zinc-400 2xl:hidden"
        title={`${metrics.shift.name} · ${metrics.activeWorkers} on site`}
      >
        <Users className="size-3.5" />
        {metrics.activeWorkers}
      </span>
      <div className="font-mono text-base font-semibold text-zinc-100 tabular-nums">
        {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
    </div>
  )
}

/** Compact strategy-game style roster: one chip per zone, coloured by status. */
function ZoneStatusStrip() {
  const zones = useSiteStore((s) => s.zones)
  const selectZone = useSiteStore((s) => s.selectZone)
  const statuses = useZoneStatuses()
  return (
    <div className="hidden items-center gap-1 2xl:flex" aria-label="Zone status">
      {zones.map((z) => {
        const Icon = ZONE_ICON[z.kind]
        const hex = STATUS_HEX[statuses[z.id]]
        return (
          <Tooltip key={z.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => selectZone(z.id)}
                className="grid size-7 cursor-pointer place-items-center rounded-md border transition-colors hover:bg-zinc-800"
                style={{ borderColor: `${hex}66`, color: hex, backgroundColor: `${hex}14` }}
                aria-label={`${z.name}: ${STATUS_LABEL[statuses[z.id]]}`}
              >
                <Icon className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{z.name}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

function SimulateMenu() {
  const triggerScenario = useSiteStore((s) => s.triggerScenario)
  const reset = useSiteStore((s) => s.reset)
  const zones = useSiteStore((s) => s.zones)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-critical/40 text-critical hover:bg-critical/10 hover:text-critical"
        >
          <Siren />
          <span className="hidden sm:inline">Simulate</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem onSelect={() => triggerScenario()}>
          <Shuffle />
          Trigger random hazard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Scenarios</DropdownMenuLabel>
        {hazardScenarios.map((h) => {
          const zone = zones.find((z) => z.id === h.zoneId)
          const critical = h.observation.severity === 'critical'
          return (
            <DropdownMenuItem key={h.id} onSelect={() => triggerScenario(h.id)}>
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: critical ? STATUS_HEX.critical : STATUS_HEX.caution }}
              />
              <span className="flex-1 truncate">{h.label}</span>
              <span className="font-mono text-[10px] text-zinc-500">{zone?.code}</span>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => reset()} className="text-zinc-400">
          <RotateCcw />
          Reset site to shift start
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SoundToggle() {
  const enabled = useSiteStore((s) => s.soundEnabled)
  const toggle = useSiteStore((s) => s.toggleSound)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          aria-pressed={enabled}
          aria-label={enabled ? 'Mute sound cues' : 'Enable sound cues'}
        >
          {enabled ? <Volume2 className="text-brand" /> : <VolumeX className="text-zinc-500" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{enabled ? 'Sound cues on' : 'Sound cues muted'}</TooltipContent>
    </Tooltip>
  )
}
