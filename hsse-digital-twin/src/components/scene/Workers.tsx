import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'

import type { PermitType } from '@/data/types'
import { useSiteStore } from '@/store/site-store'
import { SCENE } from './palette'
import { DECK_Y, FLOOR, PIT } from './layout'

type V3 = [number, number, number]

interface WorkerSpec {
  at: V3
  /** Optional patrol target — the worker walks back and forth between `at` and `to`. */
  to?: V3
  zoneId?: string
  /** Hidden unless a permit of this type is active in the zone (work stops → crew withdraws). */
  needsPermit?: PermitType
  /** Hidden while this checklist item is failed (e.g. the fire watch has left their post). */
  role?: string
  kneel?: boolean
  speed?: number
}

const CREW: WorkerSpec[] = [
  // Scaffolding Zone B
  {
    at: [-3, FLOOR * 2 + 0.08, 5.1],
    to: [1.5, FLOOR * 2 + 0.08, 5.1],
    zoneId: 'scaffold-b',
    needsPermit: 'height',
    speed: 0.25,
  },
  { at: [2.8, FLOOR * 3 + 0.08, 5.1], zoneId: 'scaffold-b', needsPermit: 'height' },
  {
    at: [-1.2, FLOOR * 4 + 0.08, 5.1],
    to: [3.5, FLOOR * 4 + 0.08, 5.1],
    zoneId: 'scaffold-b',
    needsPermit: 'height',
    speed: 0.18,
  },
  // Sector 3 deck: two welders + fire watch
  { at: [3.3, DECK_Y + 0.05, -2.9], zoneId: 'sector-3', needsPermit: 'hot-work', kneel: true },
  { at: [4.1, DECK_Y + 0.05, -2.2], zoneId: 'sector-3', needsPermit: 'hot-work', kneel: true },
  { at: [1.0, DECK_Y + 0.05, -3.4], zoneId: 'sector-3', role: 's3-firewatch' },
  {
    at: [1.2, DECK_Y + 0.05, 0.2],
    to: [4.2, DECK_Y + 0.05, 0.2],
    zoneId: 'sector-3',
    needsPermit: 'height',
    speed: 0.2,
  },
  // CS-2: two entrants in the pit, standby attendant at the edge
  { at: [PIT.x - 1.2, PIT.floor, PIT.z - 0.6], zoneId: 'excavation', needsPermit: 'confined-space' },
  { at: [PIT.x + 0.4, PIT.floor, PIT.z + 0.8], zoneId: 'excavation', needsPermit: 'confined-space', kneel: true },
  { at: [PIT.x + PIT.width / 2 + 1.1, 0, PIT.z + 1.2], zoneId: 'excavation', role: 'exc-standby' },
  // Unloading bay: banksman + rigger
  { at: [9.4, 0, 11], zoneId: 'unloading', role: 'unl-banksman' },
  { at: [11, 0, 5.8], to: [14.5, 0, 5.8], zoneId: 'unloading', speed: 0.22 },
  // General movement on the segregated walkway
  { at: [-12, 0, 11.6], to: [4, 0, 11.6], speed: 0.08 },
  { at: [6, 0, 11.4], to: [-8, 0, 11.4], speed: 0.06 },
  { at: [-12.5, 0, -6.5], to: [-6, 0, -6.5], speed: 0.1 },
]

export function Workers() {
  const zones = useSiteStore((s) => s.zones)
  const permits = useSiteStore((s) => s.permits)

  return (
    <group>
      {CREW.map((w, i) => {
        const zone = w.zoneId ? zones.find((z) => z.id === w.zoneId) : undefined
        const permitOk =
          !w.needsPermit ||
          permits.some((p) => p.zoneId === w.zoneId && p.type === w.needsPermit && p.status === 'active')
        const roleOk = !w.role || zone?.checklist.find((c) => c.id === w.role)?.passed !== false
        const evacuated = zone?.stopWork.active && !w.role
        if (!permitOk || !roleOk || evacuated) return null
        return <Worker key={i} spec={w} seed={i} />
      })}
    </group>
  )
}

function Worker({ spec, seed }: { spec: WorkerSpec; seed: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime + seed * 1.7
    if (spec.to) {
      const k = (1 - Math.cos(t * (spec.speed ?? 0.15) * Math.PI)) / 2
      const dx = spec.to[0] - spec.at[0]
      const dz = spec.to[2] - spec.at[2]
      g.position.set(spec.at[0] + dx * k, spec.at[1] + Math.abs(Math.sin(t * 9)) * 0.03, spec.at[2] + dz * k)
      const heading = Math.sin(t * (spec.speed ?? 0.15) * Math.PI) >= 0 ? 1 : -1
      g.rotation.y = Math.atan2(dx * heading, dz * heading)
    } else {
      g.rotation.y = Math.sin(t * 0.4) * 0.6
    }
  })

  const h = spec.kneel ? 0.7 : 1
  return (
    <group ref={ref} position={spec.at}>
      <group scale={[1, h, 1]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.42, 4, 8]} />
          <meshStandardMaterial color={SCENE.vest} roughness={0.7} />
        </mesh>
      </group>
      <mesh position={[0, 0.82 * h + 0.05, 0]} castShadow>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color={SCENE.skin} />
      </mesh>
      <mesh position={[0, 0.82 * h + 0.11, 0]}>
        <sphereGeometry args={[0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={SCENE.helmet} roughness={0.4} />
      </mesh>
    </group>
  )
}
