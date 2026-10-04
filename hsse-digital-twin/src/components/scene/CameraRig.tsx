import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import { useReducedMotion } from 'framer-motion'

import { useSiteStore } from '@/store/site-store'
import { cameraApi } from './camera-api'

const ISO_AZIMUTH = Math.PI / 4
const ISO_POLAR = Math.atan(Math.SQRT2) // true isometric: camera on the (1,1,1) diagonal
const HOME_TARGET: [number, number, number] = [0, 4, 0]
// Must match <InspectionPanel>: lg:w-[420px] lg:right-3 on desktop, max-h-[55vh] bottom sheet on mobile.
const PANEL_DESKTOP_PX = 420 + 12
const PANEL_MOBILE_VH = 0.55
const DESKTOP_MIN_PX = 1024

/** Fit the 40 × 30 site plus crane height into the viewport. */
function fitZoom(width: number, height: number) {
  return Math.max(7, Math.min(width / 56, height / 44))
}

const hudRect = (name: string) => {
  const el = document.querySelector(`[data-hud="${name}"]`)
  const rect = el?.getBoundingClientRect()
  return rect && rect.height > 0 ? rect : undefined
}

/**
 * Camera-space focal offset (world units) that centres the view in the part of the
 * screen the floating HUD leaves free, measured from the live DOM so it holds at every
 * breakpoint: KPI block on the left (lg–xl) or across the top (2xl, mobile), header,
 * ticker, and the inspection panel when open.
 */
function freeAreaOffset(width: number, height: number, zoom: number, panelOpen: boolean): [number, number] {
  const desktop = width >= DESKTOP_MIN_PX
  let top = hudRect('header')?.bottom ?? 0
  let bottom = hudRect('footer')?.top ?? height
  let left = 0
  let right = width

  const kpi = hudRect('kpi')
  // On mobile the KPI strip is hidden while the bottom sheet is open.
  if (kpi && (desktop || !panelOpen)) {
    // A wide, short KPI box is a row across the top; the 2×2 block occupies the left column.
    if (kpi.width > kpi.height * 2.5) top = Math.max(top, kpi.bottom)
    else left = kpi.right
  }
  if (panelOpen) {
    if (desktop) right = width - PANEL_DESKTOP_PX
    else bottom = Math.min(bottom, height * (1 - PANEL_MOBILE_VH) - 8)
  }

  const dx = (left + right) / 2 - width / 2
  const dy = (top + bottom) / 2 - height / 2
  // camera-controls applies the offset in screen convention (+x right, +y down):
  // moving the camera right/down shifts the scene left/up, hence both negations.
  return [-dx / zoom, -dy / zoom]
}

export function CameraRig() {
  const controls = useRef<CameraControls>(null)
  const size = useThree((s) => s.size)
  const selectedZoneId = useSiteStore((s) => s.selectedZoneId)
  const reducedMotion = useReducedMotion() ?? false
  const baseZoom = fitZoom(size.width, size.height)

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const d = 60
    c.setLookAt(
      HOME_TARGET[0] + d * Math.sin(ISO_POLAR) * Math.sin(ISO_AZIMUTH),
      HOME_TARGET[1] + d * Math.cos(ISO_POLAR),
      HOME_TARGET[2] + d * Math.sin(ISO_POLAR) * Math.cos(ISO_AZIMUTH),
      ...HOME_TARGET,
      false,
    )
    // Run once on mount; zoom/focus is handled by the effect below.
  }, [])

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const animate = !reducedMotion
    const zone = selectedZoneId ? useSiteStore.getState().zones.find((z) => z.id === selectedZoneId) : undefined

    if (zone) {
      const [x, y, z] = zone.footprint.center
      // Tall assets (the crane) need a wider frame than ground-level zones.
      const zoom = baseZoom * (zone.volumeHeight > 10 ? 1.15 : 1.8)
      void c.moveTo(x, (y + zone.anchor[1]) / 2, z, animate)
      void c.zoomTo(zoom, animate)
      void c.setFocalOffset(...freeAreaOffset(size.width, size.height, zoom, true), 0, animate)
    } else {
      void c.moveTo(...HOME_TARGET, animate)
      void c.zoomTo(baseZoom, animate)
      void c.setFocalOffset(...freeAreaOffset(size.width, size.height, baseZoom, false), 0, animate)
    }
  }, [selectedZoneId, baseZoom, size.width, size.height, reducedMotion])

  useEffect(() => {
    cameraApi.reset = () => {
      const c = controls.current
      if (!c) return
      useSiteStore.getState().selectZone(null)
      void c.rotateTo(ISO_AZIMUTH, ISO_POLAR, !reducedMotion)
      void c.moveTo(...HOME_TARGET, !reducedMotion)
      void c.zoomTo(baseZoom, !reducedMotion)
      void c.setFocalOffset(...freeAreaOffset(size.width, size.height, baseZoom, false), 0, !reducedMotion)
    }
    cameraApi.rotate = (quarterTurns) => {
      void controls.current?.rotate((Math.PI / 2) * quarterTurns, 0, !reducedMotion)
    }
  }, [baseZoom, size.width, size.height, reducedMotion])

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={0.4}
      minZoom={baseZoom * 0.6}
      maxZoom={baseZoom * 5}
      minPolarAngle={0.35}
      maxPolarAngle={1.3}
      dollyToCursor
    />
  )
}
