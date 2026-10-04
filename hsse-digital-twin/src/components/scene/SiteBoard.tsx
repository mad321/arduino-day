import { useMemo } from 'react'
import * as THREE from 'three'
import { Grid } from '@react-three/drei'

import { Box } from './Primitives'
import { BOARD, PIT } from './layout'
import { SCENE } from './palette'

/**
 * The site as a diorama tile: a thick slab with a through-hole for the CS-2
 * excavation, floating over an infinite tactical grid.
 */
export function SiteBoard() {
  const geometry = useMemo(() => {
    const { width, depth, thickness } = BOARD
    const shape = new THREE.Shape()
    shape.moveTo(-width / 2, -depth / 2)
    shape.lineTo(width / 2, -depth / 2)
    shape.lineTo(width / 2, depth / 2)
    shape.lineTo(-width / 2, depth / 2)
    shape.closePath()

    // Shape Y maps to world -Z after the -90° X rotation below.
    const hole = new THREE.Path()
    const x0 = PIT.x - PIT.width / 2
    const x1 = PIT.x + PIT.width / 2
    const y0 = -(PIT.z + PIT.depth / 2)
    const y1 = -(PIT.z - PIT.depth / 2)
    hole.moveTo(x0, y0)
    hole.lineTo(x0, y1)
    hole.lineTo(x1, y1)
    hole.lineTo(x1, y0)
    hole.closePath()
    shape.holes.push(hole)

    return new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false })
  }, [])

  return (
    <group>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -BOARD.thickness, 0]} receiveShadow>
        <meshStandardMaterial attach="material-0" color={SCENE.boardTop} roughness={0.95} />
        <meshStandardMaterial attach="material-1" color={SCENE.earth} roughness={1} />
      </mesh>

      {/* Pit floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PIT.x, PIT.floor, PIT.z]} receiveShadow>
        <planeGeometry args={[PIT.width, PIT.depth]} />
        <meshStandardMaterial color="#1f1a17" roughness={1} />
      </mesh>

      {/* Board edge trim */}
      <lineSegments position={[0, 0.005, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(BOARD.width, 0.01, BOARD.depth)]} />
        <lineBasicMaterial color="#3f3f46" />
      </lineSegments>

      <Grid
        position={[0, -BOARD.thickness - 0.05, 0]}
        infiniteGrid
        cellSize={2}
        cellThickness={0.6}
        cellColor="#1c1c22"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#2a2a33"
        fadeDistance={140}
        fadeStrength={2.5}
      />

      <SiteSurface />
      <SiteFence />
      <SiteCabins />
    </group>
  )
}

function SiteSurface() {
  return (
    <group>
      {/* Haul road from Gate 2 (east) into the unloading bay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15.5, 0.01, 8]} receiveShadow>
        <planeGeometry args={[9, 4]} />
        <meshStandardMaterial color={SCENE.asphalt} roughness={1} />
      </mesh>
      {[12.5, 15, 17.5].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x + 1.5, 0.02, 8]}>
          <planeGeometry args={[1.2, 0.12]} />
          <meshBasicMaterial color={SCENE.marking} transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Unloading bay pad with hatched marshalling box */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12.5, 0.015, 8]} receiveShadow>
        <planeGeometry args={[9, 6.5]} />
        <meshStandardMaterial color="#26262c" roughness={0.9} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[9.2 + i * 0.5, 0.025, 5.6]}>
          <planeGeometry args={[0.08, 1.2]} />
          <meshBasicMaterial color={SCENE.marking} transparent opacity={0.35} />
        </mesh>
      ))}

      {/* Pedestrian walkway (segregated) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, 0.012, 11.5]} receiveShadow>
        <planeGeometry args={[22, 1.4]} />
        <meshStandardMaterial color="#222228" roughness={1} />
      </mesh>

      {/* Material laydown: rebar bundles and pipe stacks */}
      {[0, 1, 2].map((i) => (
        <Box
          key={`rebar-${i}`}
          size={[4, 0.25, 0.5]}
          color={SCENE.steelDark}
          position={[15, 0.15 + i * 0.27, 1 + (i % 2) * 0.1]}
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`pipe-${i}`} rotation={[0, 0, Math.PI / 2]} position={[15, 0.3, -1.5 + i * 0.62]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 3.4, 10]} />
          <meshStandardMaterial color="#52525b" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function SiteFence() {
  const { width, depth } = BOARD
  const inset = 0.6
  const x = width / 2 - inset
  const z = depth / 2 - inset
  const posts: [number, number, number][] = []
  for (let i = -x; i <= x + 0.01; i += 2.5) {
    posts.push([i, 0.6, -z])
    if (Math.abs(i - 18.5) > 3) posts.push([i, 0.6, z])
  }
  for (let j = -z + 2.5; j < z; j += 2.5) {
    posts.push([-x, 0.6, j])
    // leave a gap on the east side for Gate 2
    if (Math.abs(j - 8) > 2.4) posts.push([x, 0.6, j])
  }
  return (
    <group>
      {posts.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.08, 1.2, 0.08]} />
          <meshStandardMaterial color="#52525b" />
        </mesh>
      ))}
      {/* fence mesh panels */}
      <mesh position={[0, 0.6, -z]}>
        <planeGeometry args={[width - inset * 2, 1.1]} />
        <meshBasicMaterial color="#71717a" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[-x, 0.6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth - inset * 2, 1.1]} />
        <meshBasicMaterial color="#71717a" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

function SiteCabins() {
  return (
    <group position={[-14.5, 0, -10]}>
      {[0, 1].map((i) => (
        <group key={i} position={[i * 3.4, 0, 0]}>
          <Box size={[3, 1.4, 2.2]} color="#3f3f46" position={[0, 0.7, 0]} />
          <Box size={[3, 1.4, 2.2]} color="#46464f" position={[0, 2.1, 0]} />
          {[0.7, 2.1].map((y) => (
            <mesh key={y} position={[0, y + 0.1, 1.11]}>
              <planeGeometry args={[2, 0.5]} />
              <meshStandardMaterial color={SCENE.glass} emissive="#0ea5e9" emissiveIntensity={0.15} />
            </mesh>
          ))}
        </group>
      ))}
      {/* muster point marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.7, 0.02, 3]}>
        <ringGeometry args={[0.9, 1.05, 32]} />
        <meshBasicMaterial color="#a1a1aa" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}
