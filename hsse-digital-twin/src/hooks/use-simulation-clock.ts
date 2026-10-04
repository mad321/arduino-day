import { useEffect } from 'react'

import { useSiteStore } from '@/store/site-store'

/** Drives the mock "live" feeds (telemetry, PPE, headcount). Pauses while the tab is hidden. */
export function useSimulationClock(intervalMs = 2500) {
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') useSiteStore.getState().tick()
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
}
