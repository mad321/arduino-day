import { lazy, Suspense, useRef } from 'react'
import { MotionConfig } from 'framer-motion'

import { ActivityTicker } from '@/components/hud/ActivityTicker'
import { HeaderBar } from '@/components/hud/HeaderBar'
import { InspectionPanel } from '@/components/hud/InspectionPanel'
import { KpiGrid } from '@/components/hud/KpiGrid'
import { MapControls } from '@/components/hud/MapControls'
import { Toasts } from '@/components/hud/Toasts'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useHudInsets } from '@/hooks/use-hud-insets'
import { useSimulationClock } from '@/hooks/use-simulation-clock'

// three.js + drei are most of the bundle; load them after the HUD has painted.
const SiteScene = lazy(() => import('@/components/scene/SiteScene').then((m) => ({ default: m.SiteScene })))

export default function App() {
  const header = useRef<HTMLDivElement>(null)
  const footer = useRef<HTMLDivElement>(null)
  useSimulationClock()
  useHudInsets(header, footer)

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <Suspense fallback={<SceneLoading />}>
          <SiteScene />
        </Suspense>

        {/* Floating HUD — the container ignores the pointer so the 3D canvas stays interactive in the gaps */}
        <div className="pointer-events-none fixed inset-0 z-30 flex flex-col gap-2 p-3">
          <div ref={header} data-hud="header">
            <HeaderBar />
          </div>
          <KpiGrid />
          <div className="flex-1" />
          <div ref={footer} data-hud="footer" className="flex flex-col gap-2">
            <MapControls />
            <ActivityTicker />
          </div>
        </div>

        <InspectionPanel />
        <Toasts />
      </TooltipProvider>
    </MotionConfig>
  )
}

function SceneLoading() {
  return (
    <div className="fixed inset-0 grid place-items-center">
      <div className="flex items-center gap-3 text-sm text-zinc-500">
        <span className="size-2 animate-ping rounded-full bg-brand" />
        Loading digital twin…
      </div>
    </div>
  )
}
