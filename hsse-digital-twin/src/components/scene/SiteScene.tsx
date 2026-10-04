import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'

import { useSiteStore } from '@/store/site-store'
import { CameraRig } from './CameraRig'
import { Excavation } from './Excavation'
import { Scaffolding } from './Scaffolding'
import { SiteBoard } from './SiteBoard'
import { SteelDeck, TowerA } from './TowerA'
import { TowerCrane } from './TowerCrane'
import { UnloadingBay } from './UnloadingBay'
import { Workers } from './Workers'
import { ZoneHitArea } from './ZoneHitArea'
import { ZoneOverlay } from './ZoneOverlay'

/** Fullscreen isometric digital twin (orthographic camera, orbit + zoom). */
export function SiteScene() {
  const zones = useSiteStore((s) => s.zones)
  // Stable DOM layer for the zone pins. drei <Html> otherwise mounts into a container that can
  // change after first render, which left the first pin's React root empty.
  const pinLayer = useRef<HTMLDivElement>(null)

  return (
    <>
      <Canvas
        orthographic
        shadows="percentage"
        dpr={[1, 2]}
        camera={{ position: [35, 39, 35], zoom: 20, near: 0.1, far: 500 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ position: 'fixed', inset: 0 }}
        aria-label="Isometric 3D model of the Tower-A construction site"
      >
        <color attach="background" args={['#0a0a0c']} />
        <Lights />
        <CameraRig />

        <SiteBoard />
        <TowerA />
        <ZoneHitArea zoneId="sector-3">
          <SteelDeck />
        </ZoneHitArea>
        <ZoneHitArea zoneId="scaffold-b">
          <Scaffolding />
        </ZoneHitArea>
        <ZoneHitArea zoneId="crane">
          <TowerCrane />
        </ZoneHitArea>
        <ZoneHitArea zoneId="unloading">
          <UnloadingBay />
        </ZoneHitArea>
        <ZoneHitArea zoneId="excavation">
          <Excavation />
        </ZoneHitArea>
        <Workers />

        {zones.map((zone) => (
          <ZoneOverlay key={zone.id} zone={zone} pinLayer={pinLayer} />
        ))}
      </Canvas>
      <div ref={pinLayer} className="pointer-events-none fixed inset-0 z-[15] overflow-hidden" />
    </>
  )
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#cbd5e1', '#0c0a09', 0.7]} />
      <directionalLight
        position={[18, 32, 14]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
      >
        <orthographicCamera attach="shadow-camera" args={[-30, 30, 26, -26, 1, 100]} />
      </directionalLight>
      {/* Cool rim light for the command-centre look */}
      <directionalLight position={[-22, 14, -18]} intensity={0.55} color="#60a5fa" />
    </>
  )
}
