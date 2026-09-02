import { ArrowDown, Flame, Gauge, HeartPulse, Hourglass, Layers, Shield, Sparkles, Swords, Zap } from 'lucide-react'
import type { EnemyPatternIconKind } from '../../game/presentation/combat/enemyPatternIconPresentation'

const labels: Record<EnemyPatternIconKind, string> = {
  'basic-attack': 'basic attack',
  'direct-damage': 'direct damage',
  'dot-damage': 'damage over time',
  barrier: 'barrier',
  heal: 'healing',
  buff: 'buff',
  debuff: 'debuff',
  control: 'control',
  resource: 'resource',
  'multi-effect': 'multiple effects',
}

export function getEnemyPatternIconLabel(kind: EnemyPatternIconKind) {
  return labels[kind]
}

export function EnemyPatternIcon({ kind }: { kind: EnemyPatternIconKind }) {
  const props = { size: 16, strokeWidth: 1.8, 'aria-hidden': true as const }
  if (kind === 'basic-attack') return <Swords {...props} />
  if (kind === 'direct-damage') return <Zap {...props} />
  if (kind === 'dot-damage') return <Flame {...props} />
  if (kind === 'barrier') return <Shield {...props} />
  if (kind === 'heal') return <HeartPulse {...props} />
  if (kind === 'buff') return <Sparkles {...props} />
  if (kind === 'debuff') return <ArrowDown {...props} />
  if (kind === 'control') return <Hourglass {...props} />
  if (kind === 'resource') return <Gauge {...props} />
  return <Layers {...props} />
}
