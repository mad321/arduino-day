import type { ThreeElements } from '@react-three/fiber'

type BoxProps = ThreeElements['mesh'] & {
  size: [number, number, number]
  color: string
  roughness?: number
  metalness?: number
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
}

/** Shadow-casting box with a standard material — the building block for the whole site. */
export function Box({
  size,
  color,
  roughness = 0.85,
  metalness = 0.1,
  opacity,
  emissive,
  emissiveIntensity,
  ...props
}: BoxProps) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  )
}

/** Thin bar between two points (scaffold tubes, braces, tripod legs). */
export function Tube({
  from,
  to,
  radius = 0.05,
  color,
  metalness = 0.6,
}: {
  from: [number, number, number]
  to: [number, number, number]
  radius?: number
  color: string
  metalness?: number
}) {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const dz = to[2] - from[2]
  const length = Math.hypot(dx, dy, dz)
  const mid: [number, number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]
  // Orient a Y-aligned cylinder along the from→to vector.
  const yaw = Math.atan2(dx, dz)
  const pitch = Math.acos(dy / length)
  return (
    <group position={mid} rotation={[0, yaw, 0]}>
      <mesh rotation={[pitch, 0, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, length, 6]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={0.5} />
      </mesh>
    </group>
  )
}
