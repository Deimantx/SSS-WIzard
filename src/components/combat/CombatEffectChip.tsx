import { CircleDot, Flame, HeartPulse, Shield, Sparkles, TimerReset, Wrench, type LucideIcon } from 'lucide-react'
import type { CombatEffectPresentation, CombatEffectPresentationTone } from '../../game/presentation/combat'

interface CombatEffectToneMeta {
  label: string
  className: string
  Icon: LucideIcon
}

const TONE_META: Record<CombatEffectPresentationTone, CombatEffectToneMeta> = {
  damage: { label: 'DAMAGE', className: 'effect-tone-damage', Icon: Flame },
  heal: { label: 'HEAL', className: 'effect-tone-heal', Icon: HeartPulse },
  barrier: { label: 'BARRIER', className: 'effect-tone-barrier', Icon: Shield },
  control: { label: 'CONTROL', className: 'effect-tone-control', Icon: TimerReset },
  dot: { label: 'DOT', className: 'effect-tone-dot', Icon: Flame },
  buff: { label: 'BUFF', className: 'effect-tone-buff', Icon: Sparkles },
  debuff: { label: 'DEBUFF', className: 'effect-tone-debuff', Icon: CircleDot },
  utility: { label: 'UTILITY', className: 'effect-tone-utility', Icon: Wrench },
}

export const getCombatEffectToneMeta = (tone: CombatEffectPresentationTone) => TONE_META[tone]

const effectLabel = (effect: CombatEffectPresentation) => {
  if (effect.tone === 'damage') return effect.label
  if (effect.tone === 'dot') return `DOT / ${effect.label.replace(/^Applies /, '').toUpperCase()}`
  if (effect.tone === 'control') return `CONTROL / ${effect.label.replace(/^Applies /, '').toUpperCase()}`
  if ((effect.tone === 'buff' || effect.tone === 'debuff') && effect.kind === 'status') return `${TONE_META[effect.tone].label} / ${effect.label.replace(/^Applies /, '').toUpperCase()}`
  return effect.tone === 'utility' && effect.label ? `UTILITY / ${effect.label.toUpperCase()}` : TONE_META[effect.tone].label
}

const baseLabel = (effect: CombatEffectPresentation) => effect.kind === 'damage' ? 'Base Damage' : effect.kind === 'heal' ? 'Base Healing' : 'Base Barrier'
const damageTypeLabel = (effect: CombatEffectPresentation) => effect.damageType ? ` ${effect.damageType[0].toUpperCase()}${effect.damageType.slice(1)}` : ''

/** Compact semantic effect token shared by combat and the permanent Bestiary dossier. */
export function CombatEffectChip({ effect, detailed = false }: { effect: CombatEffectPresentation; detailed?: boolean }) {
  const meta = getCombatEffectToneMeta(effect.tone)
  const Icon = meta.Icon
  const damageClass = effect.damageType ? ` damage-${effect.damageType}` : ''
  const detail = [effect.detail, effect.timeLabel].filter(Boolean).join(' / ')
  return <span className={`enemy-intel-action-effect ${meta.className}${damageClass}`} aria-label={[effectLabel(effect), effect.value, detailed ? detail : undefined].filter(Boolean).join(' / ')}>
    <Icon size={11} aria-hidden="true" />
    <b>{effectLabel(effect)}</b>
    {effect.value && detailed && effect.basePreview && <strong>{baseLabel(effect)}: {effect.basePreview}{damageTypeLabel(effect)}</strong>}
    {effect.value && detailed && effect.kind === 'status' && effect.totalBasePreview && <strong>Total Base Damage: {effect.totalBasePreview}</strong>}
    {effect.value && (!detailed || (!effect.basePreview && !(effect.kind === 'status' && effect.totalBasePreview))) && <strong>{effect.value}</strong>}
    {detailed && effect.kind === 'status' && effect.totalBasePreview && effect.value && <small>Damage Per Tick: {effect.value}</small>}
    {detailed && effect.scalingLabel && <small>Scaling: {effect.scalingLabel}</small>}
    {detailed && detail && <small>{detail}</small>}
  </span>
}
