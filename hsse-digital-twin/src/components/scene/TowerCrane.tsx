import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

import { STATUS_HEX } from '@/lib/status'
import { useCraneOperational, useZoneStatus } from '@/store/selectors'
import { Box } from './Primitives'
import { CRANE_MAST_H as MAST_H, CRANE_PAD as PAD, CRANE_POS, JIB_LENGTH, SLEW_Y } from './layout'
import { SCENE } from './palette'

const HALF = 0.55

// Pick (unloading bay) and place (Sector 3 deck) targets, relative to the mast.
const PICK = {
  angle: Math.atan2(-(8 - CRANE_POS[2]), 12.5 - CRANE_POS[0]),
  radius: Math.hypot(12.5 - CRANE_POS[0], 8 - CRANE_POS[2]),
  drop: SLEW_Y - 1.2,
}
const PLACE = {
  angle: Math.atan2(-(-1.5 - CRANE_POS[2]), 3 - CRANE_POS[0]),
  radius: Math.hypot(3 - CRANE_POS[0], -1.5 - CRANE_POS[2]),
  drop: SLEW_Y - 10,
}
const PARKED_DROP = 1.6

function zigzag(axis: 'x' | 'y', from: number, to: number, step: number, a: THREE.Vector3Tuple, b: THREE.Vector3Tuple) {
  const pts: THREE.Vector3Tuple[] = []
  let flip = false
  for (let t = from; t <= to + 1e-6; t += step) {
    const base = flip ? b : a
    pts.push(axis === 'y' ? [base[0], t, base[2]] : [t, base[1], base[2]])
    flip = !flip
  }
  return pts
}

/**
 * Tower crane TC-1. It only slews through its pick-and-place cycle while the
 * lifting permit is active and nothing critical is open; otherwise it parks
 * with the hook raised — the crane itself is a status indicator.
 */
export function TowerCrane() {
  const operational = useCraneOperational()
  const status = useZoneStatus('crane')

  const slew = useRef<THREE.Group>(null)
  const trolley = useRef<THREE.Group>(null)
  const cable = useRef<THREE.Mesh>(null)
  const hook = useRef<THREE.Group>(null)
  const lamp = useRef<THREE.MeshStandardMaterial>(null)
  const anim = useRef({ phase: 0, speed: 0, blend: 0 })

  useFrame(({ clock }, delta) => {
    const a = anim.current
    const dt = Math.min(delta, 0.1)
    a.speed = THREE.MathUtils.damp(a.speed, operational ? 1 : 0, 1.5, dt)
    a.blend = THREE.MathUtils.damp(a.blend, operational ? 1 : 0, 1.2, dt)
    a.phase += dt * 0.32 * a.speed

    const s = (1 - Math.cos(a.phase)) / 2 // 0 at pick, 1 at place
    const angle = THREE.MathUtils.lerp(PICK.angle, PLACE.angle, s)
    const radius = THREE.MathUtils.lerp(PICK.radius, PLACE.radius, s)
    const travelLift = Math.sin(Math.PI * s) * 6 // hook rises mid-transit
    const workingDrop = Math.max(2, THREE.MathUtils.lerp(PICK.drop, PLACE.drop, s) - travelLift)
    const drop = THREE.MathUtils.lerp(PARKED_DROP, workingDrop, a.blend)

    if (slew.current) slew.current.rotation.y = angle
    if (trolley.current) trolley.current.position.x = radius
    if (cable.current) {
      cable.current.scale.y = drop
      cable.current.position.y = -drop / 2
    }
    if (hook.current) hook.current.position.y = -drop
    if (lamp.current) {
      const pulse = status === 'critical' ? 0.5 + 0.5 * Math.sin(clock.elapsedTime * 8) : 1
      lamp.current.emissiveIntensity = 1.5 + pulse * 2
    }
  })

  const lampColor = STATUS_HEX[status]

  return (
    <group position={CRANE_POS}>
      <Box size={[3, PAD, 3]} color={SCENE.concreteDark} position={[0, PAD / 2, 0]} />

      {/* Mast chords */}
      {[
        [-HALF, -HALF],
        [HALF, -HALF],
        [-HALF, HALF],
        [HALF, HALF],
      ].map(([x, z]) => (
        <Box
          key={`${x}-${z}`}
          size={[0.1, MAST_H, 0.1]}
          color={SCENE.craneBody}
          metalness={0.4}
          roughness={0.5}
          position={[x, PAD + MAST_H / 2, z]}
        />
      ))}
      {/* Mast lacing on each face */}
      {(
        [
          [
            [-HALF, 0, HALF],
            [HALF, 0, HALF],
          ],
          [
            [-HALF, 0, -HALF],
            [HALF, 0, -HALF],
          ],
          [
            [HALF, 0, -HALF],
            [HALF, 0, HALF],
          ],
          [
            [-HALF, 0, -HALF],
            [-HALF, 0, HALF],
          ],
        ] as [THREE.Vector3Tuple, THREE.Vector3Tuple][]
      ).map(([a, b], i) => (
        <Line key={i} points={zigzag('y', PAD, PAD + MAST_H, 1.1, a, b)} color={SCENE.craneBody} lineWidth={1} />
      ))}

      <group ref={slew} position={[0, SLEW_Y, 0]}>
        {/* Slewing ring + operator cab */}
        <Box size={[1.6, 0.5, 1.6]} color="#a1a1aa" position={[0, 0.25, 0]} />
        <Box size={[1.1, 1.1, 1.0]} color={SCENE.craneBody} position={[0.9, 0.35, 1.05]} />
        <mesh position={[1.46, 0.45, 1.05]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.8, 0.6]} />
          <meshStandardMaterial color={SCENE.glass} emissive="#38bdf8" emissiveIntensity={0.25} />
        </mesh>

        {/* Status lamp on the slewing unit — mirrors the zone status colour */}
        <mesh position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial
            ref={lamp}
            color={lampColor}
            emissive={lampColor}
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>

        {/* Jib */}
        {[-0.45, 0.45].map((z) => (
          <Box
            key={z}
            size={[JIB_LENGTH - 0.8, 0.08, 0.08]}
            color={SCENE.craneBody}
            position={[(JIB_LENGTH + 0.8) / 2, 0.6, z]}
          />
        ))}
        <Box
          size={[JIB_LENGTH - 0.8, 0.08, 0.08]}
          color={SCENE.craneBody}
          position={[(JIB_LENGTH + 0.8) / 2, 1.4, 0]}
        />
        <Line
          points={zigzag('x', 0.8, JIB_LENGTH, 1.0, [0, 0.6, 0.45], [0, 1.4, 0])}
          color={SCENE.craneBody}
          lineWidth={1}
        />
        <Line
          points={zigzag('x', 0.8, JIB_LENGTH, 1.0, [0, 0.6, -0.45], [0, 1.4, 0])}
          color={SCENE.craneBody}
          lineWidth={1}
        />

        {/* Counter-jib + counterweights */}
        {[-0.45, 0.45].map((z) => (
          <Box key={`cj-${z}`} size={[5, 0.1, 0.1]} color={SCENE.craneBody} position={[-3.1, 0.6, z]} />
        ))}
        <Box size={[4.6, 0.05, 0.95]} color="#71717a" position={[-3.1, 0.66, 0]} />
        {[0, 1, 2].map((i) => (
          <Box key={i} size={[0.38, 1.3, 1.1]} color={SCENE.concrete} position={[-4.6 - i * 0.4, 0.1, 0]} />
        ))}

        {/* Trolley, hoist rope and hook block */}
        <group ref={trolley} position={[PICK.radius, 0.45, 0]}>
          <Box size={[0.7, 0.25, 1.0]} color="#a1a1aa" />
          <mesh ref={cable}>
            <cylinderGeometry args={[0.025, 0.025, 1, 4]} />
            <meshStandardMaterial color="#d4d4d8" />
          </mesh>
          <group ref={hook}>
            <Box size={[0.45, 0.5, 0.3]} color="#52525b" position={[0, -0.2, 0]} />
            <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.16, 0.05, 6, 12, Math.PI * 1.4]} />
              <meshStandardMaterial color="#a1a1aa" metalness={0.8} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
