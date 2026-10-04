import * as THREE from 'three'

/**
 * Scene materials are kept neutral (concrete, steel, earth) so the only
 * saturated colours on the map are the status glows. A yellow crane or orange
 * netting would compete with the amber "caution" signal.
 */
export const SCENE = {
  boardTop: '#17171b',
  boardSide: '#0f0f12',
  earth: '#2a2420',
  asphalt: '#1d1d22',
  concrete: '#4a4a52',
  concreteDark: '#34343b',
  steel: '#71717a',
  steelDark: '#3f3f46',
  craneBody: '#c9ccd3',
  glass: '#1e3a5f',
  timber: '#5b4a3a',
  marking: '#a1a1aa',
  net: '#475569',
  vest: '#fb923c',
  helmet: '#f4f4f5',
  skin: '#c4a484',
  truckCab: '#334155',
} as const

let glowTexture: THREE.Texture | null = null

/** Soft radial gradient used for additive status glows on the ground. */
export function getGlowTexture() {
  if (glowTexture) return glowTexture
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.55, 'rgba(255,255,255,0.28)')
  g.addColorStop(0.82, 'rgba(255,255,255,0.5)')
  g.addColorStop(0.9, 'rgba(255,255,255,0.12)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  glowTexture = new THREE.CanvasTexture(canvas)
  glowTexture.colorSpace = THREE.SRGBColorSpace
  return glowTexture
}
