import { useMemo } from 'react'

const PARTICLE_COUNT = 8

export function CombatAmbientBackdrop({ bossActive, combatActive }: { bossActive: boolean; combatActive: boolean }) {
  const particles = useMemo(() => Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
    id: `combat-mote-${index}`,
    left: `${12 + (index * 37) % 78}%`,
    top: `${15 + (index * 53) % 70}%`,
    delay: `${(index % 5) * -1.4}s`,
    duration: `${12 + (index % 4) * 3}s`,
  })), [])

  return <div className={`combat-ambient-layer${combatActive ? ' is-combat-active' : ''}${bossActive ? ' is-boss-active' : ''}`} aria-hidden="true">
    <div className="combat-ambient-particles">{particles.map((particle) => <i key={particle.id} style={{ '--particle-left': particle.left, '--particle-top': particle.top, '--particle-delay': particle.delay, '--particle-duration': particle.duration } as React.CSSProperties} />)}</div>
  </div>
}
