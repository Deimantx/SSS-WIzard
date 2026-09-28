import type { MonsterId } from '../../types'
import { action, applyStatus, basic, delayCurrentAction, scaledDirectDamage, scaledDot, type MonsterDefinition } from './monsterTypes'

const target = (id: MonsterId, name: string, subtitle: string, health: number, damage: number, color: string, icon: NonNullable<MonsterDefinition['ui']>['portraitIcon'], lootItem: MonsterDefinition['loot'][number]['itemId'], lootChance: number): MonsterDefinition => ({
  id, bestiaryCategory: 'monster', name, subtitle, maxHealth: health, basicAttackDamage: damage,
  basicAttackTimeMs: 1900, defense: Math.round(health * 0.025), color, ui: { portraitIcon: icon }, hunter: { family: id === 'runehorn-brute' ? 'Runebeasts' : 'Gloamridge Predators', alignment: id === 'runehorn-brute' ? 'Leymarked' : 'Wild', contractTier: 'routine', exclusive: true, contractRequired: true, huntingGroundId: 'hunters-ground' },
  traitIds: [], resonanceYield: { air: 32 },
  actions: {}, actionPatterns: { default: { id: 'default', steps: [basic('strike-1'), basic('strike-2'), basic('strike-3')] } },
  defaultActionPatternId: 'default', loot: [{ itemId: lootItem, min: 1, max: 2, chance: lootChance }],
})

export const HUNTERS_ORDER_MONSTERS: Partial<Record<MonsterId, MonsterDefinition>> = {
  'ashen-tracker': {
    ...target('ashen-tracker', 'Ashen Tracker', 'A lean scavenger that follows old battle trails, opening with a burst of speed before raking its quarry.', 590, 27, '#b98b64', 'wolf', 'fire-fragment', 0.16),
    basicAttackTimeMs: 1750,
    ui: { portraitIcon: 'wolf', bestiary: { roleTags: ['Fast Pursuit', 'Bleed'] } },
    traitIds: ['ashen-tracker-pursuit'],
    actions: { 'trail-rake': { id: 'trail-rake', name: 'Trail Rake', description: 'A fast rake that leaves a bleeding wound.', actionTimeMs: 1350, effects: [scaledDirectDamage('physical', 1.15), scaledDot('bleeding', 'physical', 1.1, 6000)], tags: ['special', 'physical', 'melee', 'debuff'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('trail-rake-1', 'trail-rake'), basic('basic-2'), basic('basic-3'), action('trail-rake-2', 'trail-rake')] } },
  },
  'gloamfang-stalker': {
    ...target('gloamfang-stalker', 'Gloamfang Stalker', 'A night hunter that vanishes into the ridge shadow before committing to a punishing pounce.', 650, 30, '#8f87a8', 'claw', 'air-fragment', 0.14),
    ui: { portraitIcon: 'claw', bestiary: { roleTags: ['Ambush', 'Evasion', 'Vulnerable Quarry'] } },
    traitIds: ['gloamfang-shadowstep'],
    actions: { 'shadow-pounce': { id: 'shadow-pounce', name: 'Shadow Pounce', description: 'Marks the quarry as Vulnerable before striking hard and delaying its next cast.', actionTimeMs: 1650, effects: [applyStatus('vulnerable', 'opponent', 6500), scaledDirectDamage('physical', 1.65), delayCurrentAction(450)], tags: ['special', 'physical', 'melee', 'control', 'debuff'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('shadow-pounce-1', 'shadow-pounce'), basic('basic-2'), basic('basic-3'), action('shadow-pounce-2', 'shadow-pounce')] } },
  },
  'runehorn-brute': {
    ...target('runehorn-brute', 'Runehorn Brute', 'A plated grazer that braces behind rune-lit armor, then charges to slow its quarry.', 820, 32, '#9a9670', 'stone', 'earth-fragment', 0.18),
    basicAttackTimeMs: 2300,
    defense: 28,
    ui: { portraitIcon: 'stone', bestiary: { roleTags: ['Armored', 'Fortified', 'Charge'] } },
    traitIds: ['runehorn-leyplate'],
    actions: {
      'leyplate-guard': { id: 'leyplate-guard', name: 'Leyplate Guard', description: 'Raises a brief Fortified stance.', actionTimeMs: 1500, effects: [applyStatus('fortified', 'self', 6500)], tags: ['special', 'buff'] },
      'rune-charge': { id: 'rune-charge', name: 'Rune Charge', description: 'A heavy horn charge that chills the quarry.', actionTimeMs: 2200, effects: [scaledDirectDamage('physical', 1.6), applyStatus('chilled', 'opponent', 4500)], tags: ['special', 'physical', 'melee', 'control'] },
    },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('leyplate-guard-step', 'leyplate-guard'), basic('basic-2'), action('rune-charge-1', 'rune-charge'), basic('basic-3'), action('rune-charge-2', 'rune-charge')] } },
  },
  'nightglass-alpha': {
    ...target('nightglass-alpha', 'Nightglass Alpha', 'Gloamridge’s apex predator. Its mirrored hide blunts early assaults; a Shadow Mark sets up crushing pounces before the Alpha enters a relentless frenzy.', 3600, 64, '#8e6c86', 'boss', 'prismatic-fragment', 0.12),
    basicAttackTimeMs: 2350,
    defense: 48,
    bestiaryCategory: 'boss',
    ui: { portraitIcon: 'boss', bestiary: { roleTags: ['Apex Hunt', 'Damage Mitigation', 'Mark and Pounce', 'Frenzy', '2 Phases'], phaseLabels: { default: 'Nightglass Hide', frenzy: 'Nightglass Frenzy' }, phaseOrder: ['default', 'frenzy'] } },
    traitIds: ['nightglass-alpha-hide', 'nightglass-alpha-frenzy'],
    hunter: { family: 'Gloamridge Predators', alignment: 'Nightglass', contractTier: 'prestigious', exclusive: true, contractRequired: true, huntingGroundId: 'hunters-ground' },
    actions: {
      'shadow-mark': { id: 'shadow-mark', name: 'Shadow Mark', description: 'Curses and exposes its quarry to the Alpha’s follow-up.', actionTimeMs: 1750, effects: [applyStatus('cursed', 'opponent', 12000), applyStatus('vulnerable', 'opponent', 12000)], tags: ['special', 'debuff'] },
      'alpha-pounce': { id: 'alpha-pounce', name: 'Alpha Pounce', description: 'A crushing leap that hits harder while the quarry is Vulnerable.', actionTimeMs: 1900, effects: [scaledDirectDamage('physical', 2.15), delayCurrentAction(700)], tags: ['special', 'physical', 'melee', 'control'] },
      'frenzy-pounce': { id: 'frenzy-pounce', name: 'Frenzy Pounce', description: 'A rapid, repeated strike in the Alpha’s final phase.', actionTimeMs: 1550, effects: [scaledDirectDamage('physical', 1.8), applyStatus('bleeding', 'opponent', 6500)], tags: ['special', 'physical', 'melee', 'debuff'] },
    },
    actionPatterns: {
      default: { id: 'default', steps: [basic('basic-1'), action('shadow-mark-step-1', 'shadow-mark'), basic('basic-2'), action('alpha-pounce-step-1', 'alpha-pounce'), basic('basic-3'), action('shadow-mark-step-2', 'shadow-mark'), action('alpha-pounce-step-2', 'alpha-pounce')] },
      frenzy: { id: 'frenzy', steps: [action('shadow-mark-frenzy', 'shadow-mark'), action('frenzy-pounce-1', 'frenzy-pounce'), basic('basic-1'), action('frenzy-pounce-2', 'frenzy-pounce'), basic('basic-2')] },
    },
  },
}

export const HUNTER_EXCLUSIVE_MONSTER_IDS: readonly MonsterId[] = ['ashen-tracker', 'gloamfang-stalker', 'runehorn-brute', 'nightglass-alpha']

