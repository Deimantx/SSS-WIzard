import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function ArcaneAtmosphere({ accentColor = '#a894ff', secondaryColor = '#efbd77', opacity = 0.72, intensity = 1, reducedMotion = false }: { accentColor?: string; secondaryColor?: string; opacity?: number; intensity?: number; reducedMotion?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = ref.current
    if (!host) return
    const osReducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const shouldReduceMotion = reducedMotion || osReducedMotion
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
      const material = new THREE.PointsMaterial({ color, size, transparent: true, opacity: opacity * layerOpacity * Math.max(0.55, intensity) })
      const points = new THREE.Points(geometry, material)
      scene.add(points)
      return { geometry, material, points }
    }
    const primary = createLayer(180, 0.035, 0.62, accentColor)
    const secondary = createLayer(48, 0.075, 0.2, secondaryColor)
    const resize = () => { const width = host.clientWidth || window.innerWidth; const height = host.clientHeight || window.innerHeight; camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false) }
    resize()
    window.addEventListener('resize', resize)
    let frame = 0
    const animate = () => { if (document.hidden) return; if (!shouldReduceMotion) frame = requestAnimationFrame(animate); if (!shouldReduceMotion) { primary.points.rotation.y += 0.00035 * intensity; primary.points.rotation.x = Math.sin(performance.now() * 0.00008) * 0.08; secondary.points.rotation.y -= 0.00016 * intensity; secondary.points.rotation.x = Math.sin(performance.now() * 0.00005 + 1.5) * 0.045 } renderer.render(scene, camera) }
    const visibility = () => { if (!document.hidden) animate(); else cancelAnimationFrame(frame) }
    document.addEventListener('visibilitychange', visibility)
    animate()
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('resize', resize); primary.geometry.dispose(); primary.material.dispose(); secondary.geometry.dispose(); secondary.material.dispose(); renderer.dispose(); if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement) }
  }, [accentColor, secondaryColor, opacity, intensity, reducedMotion])
  return <div ref={ref} className="atmosphere" aria-hidden="true" />
}
