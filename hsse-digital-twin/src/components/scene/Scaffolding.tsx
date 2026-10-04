import * as THREE from 'three'

import { Box, Tube } from './Primitives'
import { SCENE } from './palette'
import { FLOOR } from './layout'

const STANDARDS_X = [-5.4, -3.6, -1.8, 0, 1.8, 3.6, 5.4]
const ROW_INNER = 4.6
const ROW_OUTER = 5.6
const LIFTS = [1, 2, 3, 4].map((l) => l * FLOOR)
const TOP = LIFTS[LIFTS.length - 1] + 1.0
const TUBE = '#8b8f98'

/** Scaffolding Zone B — independent tied scaffold on the south façade of Tower-A. */
export function Scaffolding() {
  const xMin = STANDARDS_X[0]
  const xMax = STANDARDS_X[STANDARDS_X.length - 1]
  const length = xMax - xMin

  return (
    <group>
      {/* Base plates / sole boards */}
      {STANDARDS_X.flatMap((x) =>
        [ROW_INNER, ROW_OUTER].map((z) => (
          <Box key={`sb-${x}-${z}`} size={[0.35, 0.05, 0.35]} color={SCENE.timber} position={[x, 0.03, z]} />
        )),
      )}

      {/* Standards */}
      {STANDARDS_X.flatMap((x) =>
        [ROW_INNER, ROW_OUTER].map((z) => (
          <Tube key={`s-${x}-${z}`} from={[x, 0, z]} to={[x, TOP, z]} radius={0.045} color={TUBE} />
        )),
      )}

      {LIFTS.map((y) => (
        <group key={y}>
          {/* Ledgers */}
          <Tube from={[xMin, y, ROW_INNER]} to={[xMax, y, ROW_INNER]} radius={0.04} color={TUBE} />
          <Tube from={[xMin, y, ROW_OUTER]} to={[xMax, y, ROW_OUTER]} radius={0.04} color={TUBE} />
          {/* Guardrail + mid-rail on the outer face */}
          <Tube from={[xMin, y + 1.0, ROW_OUTER]} to={[xMax, y + 1.0, ROW_OUTER]} radius={0.035} color={TUBE} />
          <Tube from={[xMin, y + 0.5, ROW_OUTER]} to={[xMax, y + 0.5, ROW_OUTER]} radius={0.03} color={TUBE} />
          {/* Boarded platform + toe board */}
          <Box size={[length, 0.06, 1.0]} color={SCENE.timber} position={[0, y + 0.05, (ROW_INNER + ROW_OUTER) / 2]} />
          <Box size={[length, 0.15, 0.03]} color={SCENE.timber} position={[0, y + 0.13, ROW_OUTER - 0.02]} />
          {/* Transoms */}
          {STANDARDS_X.map((x) => (
            <Tube
              key={x}
              from={[x, y - 0.05, ROW_INNER - 0.2]}
              to={[x, y - 0.05, ROW_OUTER + 0.1]}
              radius={0.03}
              color={TUBE}
            />
          ))}
        </group>
      ))}

      {/* Façade bracing (zig-zag on the outer face) */}
      {STANDARDS_X.slice(0, -1).map((x, i) => {
        const y0 = (i % 2) * FLOOR * 2
        return (
          <Tube
            key={`br-${x}`}
            from={[x, y0, ROW_OUTER + 0.06]}
            to={[STANDARDS_X[i + 1], y0 + FLOOR * 2, ROW_OUTER + 0.06]}
            radius={0.03}
            color={TUBE}
          />
        )
      })}

      {/* Debris netting on the top two lifts */}
      <mesh position={[0, LIFTS[2] + FLOOR / 2 + 0.4, ROW_OUTER + 0.1]}>
        <planeGeometry args={[length, FLOOR * 2]} />
        <meshStandardMaterial color={SCENE.net} transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Access ladder bay at the west end */}
      <Tube from={[xMin - 0.35, 0, 5.0]} to={[xMin - 0.35, LIFTS[0] + 1, 5.0]} radius={0.03} color="#a1a1aa" />
      <Tube from={[xMin - 0.35, 0, 5.4]} to={[xMin - 0.35, LIFTS[0] + 1, 5.4]} radius={0.03} color="#a1a1aa" />
      {Array.from({ length: 8 }, (_, i) => (
        <Tube
          key={i}
          from={[xMin - 0.35, 0.3 + i * 0.3, 5.0]}
          to={[xMin - 0.35, 0.3 + i * 0.3, 5.4]}
          radius={0.02}
          color="#a1a1aa"
        />
      ))}
    </group>
  )
}
