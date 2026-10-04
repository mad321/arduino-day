import type { ReactNode } from 'react'
import type { ThreeEvent } from '@react-three/fiber'

import { useSiteStore } from '@/store/site-store'

/** Makes a 3D asset hoverable/clickable as its zone. Ignores clicks that were really orbit drags. */
export function ZoneHitArea({ zoneId, children }: { zoneId: string; children: ReactNode }) {
  const hoverZone = useSiteStore((s) => s.hoverZone)
  const selectZone = useSiteStore((s) => s.selectZone)

  return (
    <group
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        hoverZone(zoneId)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        if (useSiteStore.getState().hoveredZoneId === zoneId) hoverZone(null)
        document.body.style.cursor = ''
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (e.delta > 4) return
        selectZone(zoneId)
      }}
    >
      {children}
    </group>
  )
}
