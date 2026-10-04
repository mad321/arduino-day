import { useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges, Html, Line } from '@react-three/drei'
import * as THREE from 'three'

import type { Zone } from '@/data/types'
import { STATUS_HEX } from '@/lib/status'
import { useZoneStatus, useZoneVisibleInFilter } from '@/store/selectors'
import { useSiteStore } from '@/store/site-store'
import { ZonePin } from './ZonePin'
import { getGlowTexture } from './palette'
import { CRANE_POS, JIB_LENGTH } from './layout'

const PULSE = { clear: 0.6, caution: 1.6, critical: 5 }

/** Status glow, boundary, hover volume and the floating HTML pin for one zone. */
export function ZoneOverlay({ zone, pinLayer }: { zone: Zone; pinLayer: RefObject<HTMLDivElement | null> }) {
  const status = useZoneStatus(zone.id)
  // A critical zone is never dimmed by a view filter.
  const inFilter = useZoneVisibleInFilter(zone.id) || status === 'critical'
  const hovered = useSiteStore((s) => s.hoveredZoneId === zone.id)
  const selected = useSiteStore((s) => s.selectedZoneId === zone.id)
  const focused = hovered || selected

  const color = useMemo(() => new THREE.Color(STATUS_HEX[status]), [status])
  const glowMat = useRef<THREE.MeshBasicMaterial>(null)
  const volumeMat = useRef<THREE.MeshBasicMaterial>(null)
  const volumeGroup = useRef<THREE.Group>(null)

  const [cx, cy, cz] = zone.footprint.center
  const [w, d] = zone.footprint.size

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    const dim = inFilter ? 1 : 0.15
    const wave = 0.5 + 0.5 * Math.sin(t * PULSE[status])
    if (glowMat.current) {
      const base = status === 'critical' ? 0.55 + wave * 0.45 : status === 'caution' ? 0.45 + wave * 0.2 : 0.35
      glowMat.current.opacity = THREE.MathUtils.damp(
        glowMat.current.opacity,
        base * dim * (focused ? 1.5 : 1),
        8,
        delta,
      )
      glowMat.current.color.lerp(color, 0.15)
    }
    if (volumeMat.current && volumeGroup.current) {
      const target = focused && inFilter && zone.kind !== 'crane' ? 1 : 0
      const k = THREE.MathUtils.damp(volumeGroup.current.scale.y, Math.max(target, 0.001), 10, delta)
      volumeGroup.current.scale.y = k
      volumeGroup.current.visible = k > 0.01
      volumeMat.current.opacity = 0.09 * k
      volumeMat.current.color.lerp(color, 0.2)
    }
  })

  const outline = useMemo<[number, number, number][]>(() => {
    const y = cy + 0.03
    return [
      [cx - w / 2, y, cz - d / 2],
      [cx + w / 2, y, cz - d / 2],
      [cx + w / 2, y, cz + d / 2],
      [cx - w / 2, y, cz + d / 2],
      [cx - w / 2, y, cz - d / 2],
    ]
  }, [cx, cy, cz, w, d])

  return (
    <group>
      {/* Ground glow */}
      <mesh position={[cx, cy + 0.04, cz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <planeGeometry args={[w * 1.35, d * 1.35]} />
        <meshBasicMaterial
          ref={glowMat}
          map={getGlowTexture()}
          color={color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Zone boundary */}
      <Line
        points={outline}
        color={STATUS_HEX[status]}
        lineWidth={focused ? 2 : 1.2}
        dashed
        dashSize={0.5}
        gapSize={0.35}
        transparent
        opacity={inFilter ? 0.9 : 0.2}
      />

      {/* Risk volume on hover / selection (the crane shows its slew radius instead) */}
      <group ref={volumeGroup} position={[cx, cy, cz]} scale={[1, 0.001, 1]} visible={false}>
        <mesh position={[0, zone.volumeHeight / 2, 0]} renderOrder={3}>
          <boxGeometry args={[w, zone.volumeHeight, d]} />
          <meshBasicMaterial
            ref={volumeMat}
            color={color}
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
          <Edges color={STATUS_HEX[status]} />
        </mesh>
      </group>

      {zone.kind === 'crane' && focused && <SwingRadius color={STATUS_HEX[status]} />}

      <Html
        position={zone.anchor}
        portal={pinLayer as RefObject<HTMLElement>}
        zIndexRange={[20, 10]}
        style={{ pointerEvents: 'none' }}
      >
        <ZonePin zone={zone} status={status} dimmed={!inFilter} focused={focused} selected={selected} />
      </Html>
    </group>
  )
}

/** Crane slew radius — the overlap with other zones is the point of showing it. */
function SwingRadius({ color }: { color: string }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = []
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2
      pts.push([CRANE_POS[0] + Math.cos(a) * JIB_LENGTH, 0.06, CRANE_POS[2] + Math.sin(a) * JIB_LENGTH])
    }
    return pts
  }, [])
  return (
    <Line points={points} color={color} lineWidth={1.5} dashed dashSize={0.8} gapSize={0.5} transparent opacity={0.7} />
  )
}
