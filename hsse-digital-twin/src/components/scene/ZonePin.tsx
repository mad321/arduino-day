import { AnimatePresence, motion } from 'framer-motion'
import { FileCheck2, TriangleAlert } from 'lucide-react'

import type { Zone, ZoneStatus } from '@/data/types'
import { cn } from '@/lib/utils'
import { STATUS_HEX, STATUS_LABEL } from '@/lib/status'
import { useSiteStore } from '@/store/site-store'
import { ZONE_ICON } from '../zone-icons'

interface ZonePinProps {
  zone: Zone
  status: ZoneStatus
  dimmed: boolean
  focused: boolean
  selected: boolean
}

/** HTML marker anchored to the zone's world position (rendered inside drei <Html>). */
export function ZonePin({ zone, status, dimmed, focused, selected }: ZonePinProps) {
  const selectZone = useSiteStore((s) => s.selectZone)
  const hoverZone = useSiteStore((s) => s.hoverZone)
  const activePermits = useSiteStore(
    (s) => s.permits.filter((p) => p.zoneId === zone.id && p.status === 'active').length,
  )
  const openFlags = useSiteStore(
    (s) => s.observations.filter((o) => o.zoneId === zone.id && o.status === 'open' && o.severity !== 'low').length,
  )
  const hex = STATUS_HEX[status]
  const Icon = ZONE_ICON[zone.kind]

  return (
    <div
      className="flex -translate-x-1/2 -translate-y-full flex-col items-center transition-opacity duration-300 select-none"
      style={{ opacity: dimmed ? 0.3 : 1 }}
    >
      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="mb-1.5 rounded-md border border-zinc-800 bg-zinc-950/90 px-2.5 py-1.5 text-center whitespace-nowrap shadow-xl backdrop-blur-sm"
          >
            <div className="text-xs font-semibold text-zinc-100">{zone.name}</div>
            <div className="text-[10px] font-medium tracking-wide uppercase" style={{ color: hex }}>
              {STATUS_LABEL[status]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        aria-label={`${zone.name}: ${STATUS_LABEL[status]}. Open inspection panel.`}
        aria-pressed={selected}
        onClick={() => selectZone(zone.id)}
        onPointerEnter={() => hoverZone(zone.id)}
        onPointerLeave={() => hoverZone(null)}
        className={cn(
          'pointer-events-auto relative flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border bg-zinc-950/85 py-1 pr-2.5 pl-1 shadow-lg backdrop-blur-sm transition-transform duration-200 outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-white/60',
          selected && 'scale-110 hover:scale-110',
        )}
        style={{
          borderColor: `${hex}aa`,
          boxShadow: `0 0 ${selected ? 26 : 16}px -2px ${hex}${selected ? 'aa' : '66'}`,
        }}
      >
        <span
          className="relative grid size-7 place-items-center rounded-full"
          style={{ backgroundColor: `${hex}22`, color: hex }}
        >
          {status === 'critical' && (
            <span className="absolute inset-0 animate-ping rounded-full" style={{ backgroundColor: `${hex}55` }} />
          )}
          <Icon className="relative size-4" />
        </span>
        <span className="font-mono text-[11px] font-semibold tracking-wide text-zinc-100">{zone.code}</span>
        {activePermits > 0 && (
          <span className="flex items-center gap-0.5 rounded bg-zinc-800/90 px-1 py-px text-[10px] font-medium text-zinc-300">
            <FileCheck2 className="size-3" />
            {activePermits}
          </span>
        )}
        {openFlags > 0 && (
          <span
            className="flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-semibold"
            style={{ backgroundColor: `${STATUS_HEX.caution}22`, color: STATUS_HEX.caution }}
          >
            <TriangleAlert className="size-3" />
            {openFlags}
          </span>
        )}
      </button>
      <span className="h-5 w-px" style={{ background: `linear-gradient(${hex}, transparent)` }} />
      <span className="size-1.5 rounded-full" style={{ backgroundColor: hex, boxShadow: `0 0 8px ${hex}` }} />
    </div>
  )
}
