import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import type * as THREE from 'three'

import { usePermitActive, useZoneStopped } from '@/store/selectors'
import { Box } from './Primitives'
import { DECK_Y, FLOOR } from './layout'
import { SCENE } from './palette'

const COLUMN_X = [-4.8, -1.6, 1.6, 4.8]
const COLUMN_Z = [-3.8, 0, 3.8]
const CONCRETE_LEVELS = [1, 2, 3, 4] // slabs at 1.8 … 7.2

/** Tower-A: five cast floors and a lift core. The L6 steel deck (Sector 3) is its own zone below. */
export function TowerA() {
  return (
    <group>
      {/* Ground floor plinth */}
      <Box size={[10.4, 0.2, 8.4]} color={SCENE.concreteDark} position={[0, 0.1, 0]} />

      {/* Concrete columns L1–L5 */}
      {COLUMN_X.flatMap((x) =>
        COLUMN_Z.map((z) => (
          <Box key={`c-${x}-${z}`} size={[0.4, FLOOR * 4, 0.4]} color={SCENE.concrete} position={[x, FLOOR * 2, z]} />
        )),
      )}

      {/* Slabs */}
      {CONCRETE_LEVELS.map((l) => (
        <Box
          key={l}
          size={[10.4, 0.25, 8.4]}
          color={l === 4 ? '#3d3d44' : SCENE.concrete}
          position={[0, FLOOR * l, 0]}
        />
      ))}

      {/* Glazing on the lower two floors (north + west façades) */}
      {[0, 1].map((l) => (
        <group key={l}>
          <Box
            size={[10, FLOOR - 0.3, 0.06]}
            color={SCENE.glass}
            opacity={0.75}
            roughness={0.2}
            metalness={0.6}
            position={[0, FLOOR * l + FLOOR / 2 + 0.1, -4.1]}
          />
          <Box
            size={[0.06, FLOOR - 0.3, 8]}
            color={SCENE.glass}
            opacity={0.75}
            roughness={0.2}
            metalness={0.6}
            position={[-5.1, FLOOR * l + FLOOR / 2 + 0.1, 0]}
          />
        </group>
      ))}

      {/* Lift / stair core rising above the frame */}
      <Box size={[2.6, 10.6, 2.6]} color="#55555e" position={[-2.6, 5.3, -0.4]} />

      {/* Edge protection on L5 roof (west half) */}
      <EdgeBarrier x0={-5.2} x1={0} z0={-4.2} z1={4.2} y={FLOOR * 4} />
    </group>
  )
}

function EdgeBarrier({ x0, x1, z0, z1, y }: { x0: number; x1: number; z0: number; z1: number; y: number }) {
  const h = 0.55
  return (
    <group>
      <Box size={[x1 - x0, 0.05, 0.05]} color={SCENE.steel} position={[(x0 + x1) / 2, y + h, z0]} />
      <Box size={[x1 - x0, 0.05, 0.05]} color={SCENE.steel} position={[(x0 + x1) / 2, y + h, z1]} />
      <Box size={[0.05, 0.05, z1 - z0]} color={SCENE.steel} position={[x0, y + h, (z0 + z1) / 2]} />
    </group>
  )
}

/** Sector 3 — structural steel and metal decking at L6 with live welding. */
export function SteelDeck() {
  const hotWorkActive = usePermitActive('sector-3', 'hot-work')
  const stopped = useZoneStopped('sector-3')
  const welding = hotWorkActive && !stopped

  const columns: [number, number][] = [
    [0.2, -3.8],
    [2.6, -3.8],
    [4.8, -3.8],
    [0.2, 0.8],
    [2.6, 0.8],
    [4.8, 0.8],
  ]

  return (
    <group>
      {columns.map(([x, z]) => (
        <Box
          key={`${x}-${z}`}
          size={[0.22, FLOOR, 0.22]}
          color={SCENE.steelDark}
          metalness={0.7}
          roughness={0.4}
          position={[x, FLOOR * 4 + FLOOR / 2, z]}
        />
      ))}
      {/* Primary beams */}
      {[-3.8, -1.5, 0.8].map((z) => (
        <Box
          key={`b-${z}`}
          size={[5, 0.3, 0.16]}
          color={SCENE.steel}
          metalness={0.7}
          roughness={0.4}
          position={[2.5, DECK_Y - 0.15, z]}
        />
      ))}
      {[0.2, 2.6, 4.8].map((x) => (
        <Box
          key={`g-${x}`}
          size={[0.16, 0.3, 4.8]}
          color={SCENE.steel}
          metalness={0.7}
          roughness={0.4}
          position={[x, DECK_Y - 0.15, -1.5]}
        />
      ))}
      {/* Metal decking — partially laid */}
      <Box size={[5, 0.05, 3]} color="#5c5f66" metalness={0.6} roughness={0.5} position={[2.5, DECK_Y + 0.02, -2.5]} />
      {/* Bundled steel waiting for the crane */}
      <Box size={[2.2, 0.25, 0.6]} color={SCENE.steelDark} position={[3.2, DECK_Y + 0.17, 0]} />
      {/* Deck edge protection */}
      <EdgeBarrier x0={0} x1={5.2} z0={-4.1} z1={1} y={DECK_Y} />

      {welding && <WeldingSparks />}
    </group>
  )
}

function WeldingSparks() {
  const light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    if (!light.current) return
    const t = clock.elapsedTime
    light.current.intensity = 6 + Math.sin(t * 40) * 3 + Math.sin(t * 17) * 2 + (Math.random() > 0.9 ? 4 : 0)
  })
  return (
    <group position={[3.6, DECK_Y + 0.35, -2.6]}>
      <pointLight ref={light} color="#ffd8a8" distance={6} decay={1.6} />
      <Sparkles count={36} scale={[1, 0.8, 1]} size={2.6} speed={2.2} color="#fed7aa" noise={2} />
    </group>
  )
}
