import { Box, Tube } from './Primitives'
import { SCENE } from './palette'
import { PIT } from './layout'

const EDGE = 0.7
const STEEL = '#6b7280'

/** CS-2: shored deep excavation with trench box, rescue tripod and edge barriers. */
export function Excavation() {
  const x0 = PIT.x - PIT.width / 2
  const x1 = PIT.x + PIT.width / 2
  const z0 = PIT.z - PIT.depth / 2
  const z1 = PIT.z + PIT.depth / 2
  const depth = -PIT.floor

  return (
    <group>
      {/* Trench box panels on the long sides */}
      {[z0 + 0.12, z1 - 0.12].map((z) => (
        <Box
          key={z}
          size={[PIT.width - 0.3, depth - 0.2, 0.12]}
          color={STEEL}
          metalness={0.5}
          roughness={0.6}
          position={[PIT.x, PIT.floor + depth / 2 - 0.05, z]}
        />
      ))}
      {/* Hydraulic struts */}
      {[-1.6, 0, 1.6].flatMap((dx) =>
        [-0.8, -2.2].map((y) => (
          <Tube
            key={`${dx}-${y}`}
            from={[PIT.x + dx, y, z0 + 0.2]}
            to={[PIT.x + dx, y, z1 - 0.2]}
            radius={0.06}
            color="#f4f4f5"
            metalness={0.3}
          />
        )),
      )}

      {/* Access ladder */}
      <Tube from={[x1 - 0.5, PIT.floor, z0 + 1.6]} to={[x1 - 0.2, 0.9, z0 + 1.6]} radius={0.03} color="#a1a1aa" />
      <Tube from={[x1 - 0.5, PIT.floor, z0 + 2.2]} to={[x1 - 0.2, 0.9, z0 + 2.2]} radius={0.03} color="#a1a1aa" />
      {Array.from({ length: 10 }, (_, i) => {
        const t = (i + 0.5) / 10
        const x = x1 - 0.5 + 0.3 * t
        const y = PIT.floor + (0.9 - PIT.floor) * t
        return <Tube key={i} from={[x, y, z0 + 1.6]} to={[x, y, z0 + 2.2]} radius={0.02} color="#a1a1aa" />
      })}

      {/* Rescue davit + winch at the controlled entry (east edge) */}
      <RescueDavit position={[x1 + 0.45, 0, PIT.z]} />

      {/* Edge barrier (posts + rails), open at the controlled entry */}
      {(
        [
          [x0 - EDGE, z0 - EDGE, x1 + EDGE, z0 - EDGE],
          [x0 - EDGE, z1 + EDGE, x1 + EDGE, z1 + EDGE],
          [x0 - EDGE, z0 - EDGE, x0 - EDGE, z1 + EDGE],
        ] as const
      ).map(([ax, az, bx, bz], i) => (
        <group key={i}>
          <Tube from={[ax, 1.0, az]} to={[bx, 1.0, bz]} radius={0.035} color="#d4d4d8" metalness={0.2} />
          <Tube from={[ax, 0.5, az]} to={[bx, 0.5, bz]} radius={0.03} color="#d4d4d8" metalness={0.2} />
        </group>
      ))}
      {[
        [x0 - EDGE, z0 - EDGE],
        [x1 + EDGE, z0 - EDGE],
        [x0 - EDGE, z1 + EDGE],
        [x1 + EDGE, z1 + EDGE],
        [PIT.x, z0 - EDGE],
        [PIT.x, z1 + EDGE],
      ].map(([x, z]) => (
        <Box key={`${x}-${z}`} size={[0.08, 1.05, 0.08]} color="#a1a1aa" position={[x, 0.52, z]} />
      ))}

      {/* Spoil heap — kept back from the edge */}
      <mesh position={[-17, 0.55, 11.6]} castShadow receiveShadow>
        <coneGeometry args={[1.7, 1.1, 7]} />
        <meshStandardMaterial color={SCENE.earth} roughness={1} flatShading />
      </mesh>

      {/* Gas monitor station */}
      <Box size={[0.4, 0.7, 0.3]} color="#3f3f46" position={[x1 + 1.3, 0.35, z0 - 0.2]} />
      <mesh position={[x1 + 1.3, 0.75, z0 - 0.04]}>
        <planeGeometry args={[0.28, 0.16]} />
        <meshStandardMaterial color="#0f172a" emissive="#22d3ee" emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Edge-mounted davit with a man-rated winch — the retrieval system for the entrants. */
function RescueDavit({ position }: { position: [number, number, number] }) {
  const [x, , z] = position
  const top = 2.6
  const reach = 1.5
  return (
    <group>
      <Box size={[0.6, 0.12, 0.6]} color="#3f3f46" position={[x, 0.06, z]} />
      <Tube from={[x, 0, z]} to={[x, top, z]} radius={0.07} color="#e4e4e7" metalness={0.5} />
      <Tube from={[x, top, z]} to={[x - reach, top - 0.15, z]} radius={0.06} color="#e4e4e7" metalness={0.5} />
      <Tube from={[x, top - 0.9, z]} to={[x - 0.7, top - 0.1, z]} radius={0.04} color="#e4e4e7" metalness={0.5} />
      <Box size={[0.32, 0.3, 0.26]} color="#52525b" position={[x + 0.22, 1.3, z]} />
      <mesh position={[x - reach, (top - 0.15 + PIT.floor + 1.2) / 2, z]}>
        <cylinderGeometry args={[0.012, 0.012, top - 0.15 - PIT.floor - 1.2, 4]} />
        <meshStandardMaterial color="#d4d4d8" />
      </mesh>
    </group>
  )
}
