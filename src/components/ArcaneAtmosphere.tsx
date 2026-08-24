import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function ArcaneAtmosphere() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = ref.current
    if (!host) return
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    camera.position.z = 9
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    host.appendChild(renderer.domElement)
    const points = new THREE.BufferGeometry()
    const positions = new Float32Array(180 * 3)
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (Math.random() - 0.5) * 16
      positions[i + 1] = (Math.random() - 0.5) * 10
      positions[i + 2] = (Math.random() - 0.5) * 5
    }
    points.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({ color: 0xa894ff, size: 0.035, transparent: true, opacity: 0.45 })
    const particles = new THREE.Points(points, material)
    scene.add(particles)
    const resize = () => { const width = host.clientWidth || window.innerWidth; const height = host.clientHeight || window.innerHeight; camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false) }
    resize()
    window.addEventListener('resize', resize)
    let frame = 0
    const animate = () => { if (document.hidden) return; frame = requestAnimationFrame(animate); particles.rotation.y += 0.00035; particles.rotation.x = Math.sin(performance.now() * 0.00008) * 0.08; renderer.render(scene, camera) }
    const visibility = () => { if (!document.hidden) animate(); else cancelAnimationFrame(frame) }
    document.addEventListener('visibilitychange', visibility)
    animate()
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('resize', resize); points.dispose(); material.dispose(); renderer.dispose(); host.removeChild(renderer.domElement) }
  }, [])
  return <div ref={ref} className="atmosphere" aria-hidden="true" />
}
