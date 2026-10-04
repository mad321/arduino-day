import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'

import { Box } from './Primitives'
import { SCENE } from './palette'

/** Flatbed delivery truck reversed into UNL-1, carrying structural steel bundles. */
export function UnloadingBay() {
  const beacon = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (beacon.current) beacon.current.emissiveIntensity = Math.sin(clock.elapsedTime * 6) > 0.3 ? 3 : 0.2
  })

  return (
    <group position={[13, 0, 8.4]}>
      {/* Chassis + flatbed */}
      <Box size={[6.2, 0.3, 2.1]} color="#27272a" position={[-0.4, 0.75, 0]} />
      <Box size={[4.6, 0.12, 2.3]} color="#3f3f46" position={[-1.2, 1.0, 0]} />
      {/* Cab (facing east toward Gate 2) */}
      <Box size={[1.8, 1.7, 2.2]} color={SCENE.truckCab} position={[2.1, 1.55, 0]} roughness={0.5} metalness={0.3} />
      <mesh position={[3.01, 1.85, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.8, 0.7]} />
        <meshStandardMaterial color={SCENE.glass} emissive="#38bdf8" emissiveIntensity={0.2} />
      </mesh>
      {/* Reversing beacon */}
      <mesh position={[2.1, 2.5, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.18, 12]} />
        <meshStandardMaterial ref={beacon} color="#fbbf24" emissive="#fbbf24" toneMapped={false} />
      </mesh>
      {/* Wheels */}
      {[2.2, -1.0, -2.4].flatMap((x) =>
        [-1.05, 1.05].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.45, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.35, 14]} />
            <meshStandardMaterial color="#111114" roughness={0.9} />
          </mesh>
        )),
      )}
      {/* Steel bundles on the bed */}
      {[-0.5, 0.5].map((z) =>
        [0, 1].map((layer) => (
          <Box
            key={`${z}-${layer}`}
            size={[4, 0.28, 0.75]}
            color={SCENE.steel}
            metalness={0.6}
            roughness={0.45}
            position={[-1.2, 1.2 + layer * 0.3, z]}
          />
        )),
      )}
      {/* Timber dunnage */}
      {[-2.8, -1.2, 0.4].map((x) => (
        <Box key={x} size={[0.15, 0.08, 2]} color={SCENE.timber} position={[x, 1.08, 0]} />
      ))}

      {/* Pedestrian barriers along the bay edge */}
      {Array.from({ length: 5 }, (_, i) => (
        <Box
          key={`bar-${i}`}
          size={[1.5, 0.9, 0.08]}
          color="#52525b"
          opacity={0.85}
          position={[-4 + i * 1.7, 0.45, -3.1]}
        />
      ))}
    </group>
  )
}
