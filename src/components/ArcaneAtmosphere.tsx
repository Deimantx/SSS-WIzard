import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const ATMOSPHERE_TARGET_FRAME_MS = 1000 / 60
const ATMOSPHERE_BASE_ROTATION_PER_SECOND = 0.00035 * 60
const ATMOSPHERE_SECONDARY_ROTATION_PER_SECOND = 0.00016 * 60

interface ArcaneAtmosphereProps {
  accentColor?: string
  secondaryColor?: string
  opacity?: number
  intensity?: number
  particleSpeed?: number
  reducedMotion?: boolean
}

export function ArcaneAtmosphere({ accentColor = '#a894ff', secondaryColor = '#efbd77', opacity = 0.72, intensity = 1, particleSpeed = 1, reducedMotion = false }: ArcaneAtmosphereProps) {
  const ref = useRef<HTMLDivElement>(null)
  const settings = useRef({ accentColor, secondaryColor, opacity, intensity, particleSpeed, reducedMotion })
  const wakeRenderer = useRef<(() => void) | null>(null)
  settings.current = { accentColor, secondaryColor, opacity, intensity, particleSpeed, reducedMotion }

  useEffect(() => { wakeRenderer.current?.() }, [reducedMotion])

  useEffect(() => {
    const host = ref.current
    if (!host) return
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    camera.position.z = 9
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    host.appendChild(renderer.domElement)
    const createLayer = (count: number, size: number, layerOpacity: number, color: string) => {
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(count * 3)
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] = (Math.random() - 0.5) * 16
        positions[i + 1] = (Math.random() - 0.5) * 10
        positions[i + 2] = (Math.random() - 0.5) * 5
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const material = new THREE.PointsMaterial({ color, size, transparent: true, opacity: settings.current.opacity * layerOpacity * Math.max(0.55, settings.current.intensity) })
      const points = new THREE.Points(geometry, material)
      scene.add(points)
      return { geometry, material, points, layerOpacity }
    }
    const primary = createLayer(180, 0.035, 0.62, settings.current.accentColor)
    const secondary = createLayer(48, 0.075, 0.2, settings.current.secondaryColor)
    const targetPrimary = new THREE.Color(settings.current.accentColor)
    const targetSecondary = new THREE.Color(settings.current.secondaryColor)
    const resize = () => { const width = host.clientWidth || window.innerWidth; const height = host.clientHeight || window.innerHeight; camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false) }
    resize()
    window.addEventListener('resize', resize)
    let frame = 0
    let lastRenderAt = 0
    let lastMotionAt: number | null = null
    const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
    const isReduced = () => settings.current.reducedMotion || Boolean(media?.matches)
    const animate = (timestamp = performance.now()) => {
      frame = 0
      if (document.hidden) return
      if (lastRenderAt !== 0 && timestamp - lastRenderAt < ATMOSPHERE_TARGET_FRAME_MS) {
        frame = requestAnimationFrame(animate)
        return
      }
      const current = settings.current
      const deltaSeconds = lastMotionAt === null ? 0 : Math.min(0.1, Math.max(0, timestamp - lastMotionAt) / 1000)
      lastMotionAt = timestamp
      lastRenderAt = timestamp
      targetPrimary.set(current.accentColor)
      targetSecondary.set(current.secondaryColor)
      primary.material.color.lerp(targetPrimary, 0.08)
      secondary.material.color.lerp(targetSecondary, 0.08)
      primary.material.opacity += (current.opacity * primary.layerOpacity * Math.max(0.55, current.intensity) - primary.material.opacity) * 0.08
      secondary.material.opacity += (current.opacity * secondary.layerOpacity * Math.max(0.55, current.intensity) - secondary.material.opacity) * 0.08
      if (!isReduced()) {
        primary.points.rotation.y += ATMOSPHERE_BASE_ROTATION_PER_SECOND * deltaSeconds * current.intensity * current.particleSpeed
        primary.points.rotation.x = Math.sin(timestamp * 0.00008 * current.particleSpeed) * 0.08
        secondary.points.rotation.y -= ATMOSPHERE_SECONDARY_ROTATION_PER_SECOND * deltaSeconds * current.intensity * current.particleSpeed
        secondary.points.rotation.x = Math.sin(timestamp * 0.00005 * current.particleSpeed + 1.5) * 0.045
        frame = requestAnimationFrame(animate)
      }
      renderer.render(scene, camera)
    }
    const wake = () => { if (!document.hidden && frame === 0) { lastRenderAt = 0; lastMotionAt = null; animate() } }
    wakeRenderer.current = wake
    const visibility = () => { if (document.hidden) { if (frame) cancelAnimationFrame(frame); frame = 0; lastRenderAt = 0; lastMotionAt = null } else wake() }
    document.addEventListener('visibilitychange', visibility)
    animate()
    return () => { wakeRenderer.current = null; if (frame) cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('resize', resize); primary.geometry.dispose(); primary.material.dispose(); secondary.geometry.dispose(); secondary.material.dispose(); renderer.dispose(); if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement) }
  }, [])

  return <div ref={ref} className="atmosphere" aria-hidden="true" />
}
