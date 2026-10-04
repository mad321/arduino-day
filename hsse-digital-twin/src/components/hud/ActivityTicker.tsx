import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  CircleCheck,
  ClipboardCheck,
  FileCheck2,
  Megaphone,
  OctagonX,
  Siren,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'

import type { FeedKind } from '@/data/types'
import { TONE_HEX, formatClock } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useSiteStore } from '@/store/site-store'

const FEED_ICON: Record<FeedKind, LucideIcon> = {
  inspection: ClipboardCheck,
  permit: FileCheck2,
  hazard: TriangleAlert,
  'near-miss': Siren,
  closure: CircleCheck,
  'stop-work': OctagonX,
  system: Megaphone,
}

/** Bottom activity feed — newest first, scrolls horizontally, never auto-scrolls (readability over motion). */
export function ActivityTicker() {
  const feed = useSiteStore((s) => s.feed)
  const zones = useSiteStore((s) => s.zones)
  const selectZone = useSiteStore((s) => s.selectZone)

  return (
    <footer className="glass pointer-events-auto flex items-stretch overflow-hidden">
      <div className="hidden shrink-0 flex-col justify-center gap-0.5 border-r border-zinc-800 px-3 sm:flex">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-zinc-300 uppercase">
          <Activity className="size-3.5 text-brand" />
          Site Activity
        </div>
        <div className="text-[10px] text-zinc-500">{feed.length} events this shift</div>
      </div>
      <ol
        tabIndex={0}
        aria-label="Site activity feed, newest first"
        aria-live="polite"
        className="scrollbar-thin flex flex-1 gap-2 overflow-x-auto p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <AnimatePresence initial={false}>
          {feed.map((e, i) => {
            const Icon = FEED_ICON[e.kind]
            const hex = TONE_HEX[e.tone]
            const zone = e.zoneId ? zones.find((z) => z.id === e.zoneId) : undefined
            return (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, x: -24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="shrink-0"
              >
                <button
                  type="button"
                  disabled={!zone}
                  onClick={() => zone && selectZone(zone.id)}
                  className={cn(
                    'relative flex h-full max-w-[340px] items-center gap-2 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/60 py-1.5 pr-3 pl-3 text-left transition-colors',
                    zone && 'cursor-pointer hover:border-zinc-700 hover:bg-zinc-900',
                    i === 0 && 'border-zinc-700',
                  )}
                >
                  <span className="absolute inset-y-0 left-0 w-0.5" style={{ backgroundColor: hex }} />
                  <Icon className="size-3.5 shrink-0" style={{ color: hex }} />
                  <span className="font-mono text-[11px] whitespace-nowrap text-zinc-500 tabular-nums">
                    {formatClock(e.at)}
                  </span>
                  <span className="truncate text-xs text-zinc-200">{e.message}</span>
                </button>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ol>
    </footer>
  )
}
