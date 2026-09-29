import type { MonsterId } from '../../types'
import { action, applyStatus, basic, delayCurrentAction, scaledDirectDamage, scaledDot, type MonsterDefinition } from './monsterTypes'

type HunterMonsterConfig = { id: MonsterId; name: string; subtitle: string; health: number; damage: number; attackTime: number; defense: number; color: string; icon: NonNullable<MonsterDefinition['ui']>['portraitIcon']; lootItem: MonsterDefinition['loot'][number]['itemId']; lootChance: number; family: string; alignment: string; resonance: NonNullable<MonsterDefinition['resonanceYield']> }
const target = (config: HunterMonsterConfig): MonsterDefinition => ({
  id: config.id, bestiaryCategory: 'monster', name: config.name, subtitle: config.subtitle, maxHealth: config.health, basicAttackDamage: config.damage,
  basicAttackTimeMs: config.attackTime, defense: config.defense, color: config.color, ui: { portraitIcon: config.icon }, hunter: { family: config.family, alignment: config.alignment, contractTier: 'routine', exclusive: true, contractRequired: true, huntingGroundId: 'hunters-ground' },
  traitIds: [], resonanceYield: config.resonance,
  actions: {}, actionPatterns: { default: { id: 'default', steps: [basic('strike-1'), basic('strike-2'), basic('strike-3')] } },
  defaultActionPatternId: 'default', loot: [{ itemId: config.lootItem, min: 1, max: 2, chance: config.lootChance }],
})

export const HUNTERS_ORDER_MONSTERS: Partial<Record<MonsterId, MonsterDefinition>> = {
  'ashen-tracker': {
    ...target({ id: 'ashen-tracker', name: 'Ashen Tracker', subtitle: 'A lean scavenger that follows old battle trails, opening with a burst of speed before raking its quarry.', health: 590, damage: 27, attackTime: 1750, defense: 15, color: '#b98b64', icon: 'wolf', lootItem: 'fire-fragment', lootChance: 0.16, family: 'Gloamridge Predators', alignment: 'Wild', resonance: { fire: 20, air: 32 } }),
    basicAttackTimeMs: 1750,
    ui: { portraitIcon: 'wolf', bestiary: { roleTags: ['Fast Pursuit', 'Bleed'] } },
    traitIds: ['ashen-tracker-pursuit'],
    actions: { 'trail-rake': { id: 'trail-rake', name: 'Trail Rake', description: 'A fast rake that leaves a bleeding wound.', actionTimeMs: 1350, effects: [scaledDirectDamage('physical', 1.15), scaledDot('bleeding', 'physical', 1.1, 6000)], tags: ['special', 'physical', 'melee', 'debuff'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('trail-rake-1', 'trail-rake'), basic('basic-2'), basic('basic-3'), action('trail-rake-2', 'trail-rake')] } },
  },
  'gloamfang-stalker': {
    ...target({ id: 'gloamfang-stalker', name: 'Gloamfang Stalker', subtitle: 'A night hunter that vanishes into the ridge shadow before committing to a punishing pounce.', health: 650, damage: 30, attackTime: 1900, defense: 16, color: '#8f87a8', icon: 'claw', lootItem: 'air-fragment', lootChance: 0.14, family: 'Gloamridge Predators', alignment: 'Wild', resonance: { air: 40 } }),
    ui: { portraitIcon: 'claw', bestiary: { roleTags: ['Ambush', 'Evasion', 'Vulnerable Quarry'] } },
    traitIds: ['gloamfang-shadowstep'],
    actions: { 'shadow-pounce': { id: 'shadow-pounce', name: 'Shadow Pounce', description: 'Marks the quarry as Vulnerable before striking hard and delaying its next cast.', actionTimeMs: 1650, effects: [applyStatus('vulnerable', 'opponent', 6500), scaledDirectDamage('physical', 1.65), delayCurrentAction(450)], tags: ['special', 'physical', 'melee', 'control', 'debuff'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('shadow-pounce-1', 'shadow-pounce'), basic('basic-2'), basic('basic-3'), action('shadow-pounce-2', 'shadow-pounce')] } },
  },
  'runehorn-brute': {
    ...target({ id: 'runehorn-brute', name: 'Runehorn Brute', subtitle: 'A plated grazer that braces behind rune-lit armor, then charges to slow its quarry.', health: 820, damage: 32, attackTime: 2300, defense: 28, color: '#9a9670', icon: 'stone', lootItem: 'earth-fragment', lootChance: 0.18, family: 'Runebeasts', alignment: 'Leymarked', resonance: { earth: 48 } }),
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
  'veilwing-harrier': {
    ...target({ id: 'veilwing-harrier', name: 'Veilwing Harrier', subtitle: 'A swift ridge flier that cuts through the air and breaks a caster’s rhythm.', health: 640, damage: 29, attackTime: 1650, defense: 14, color: '#7896aa', icon: 'wolf', lootItem: 'air-fragment', lootChance: 0.18, family: 'Gloamridge Predators', alignment: 'Wild', resonance: { air: 46 } }),
    ui: { portraitIcon: 'wolf', bestiary: { roleTags: ['Fast', 'Disruption', 'Air-aligned'] } },
    actions: { 'razor-gale': { id: 'razor-gale', name: 'Razor Gale', description: 'A cutting gust strikes the quarry and delays its current action.', actionTimeMs: 1150, effects: [scaledDirectDamage('physical', 1.2), delayCurrentAction(450)], tags: ['special', 'physical', 'control'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('razor-gale-1', 'razor-gale'), basic('basic-2'), basic('basic-3'), action('razor-gale-2', 'razor-gale')] } },
  },
  'cinderback-mauler': {
    ...target({ id: 'cinderback-mauler', name: 'Cinderback Mauler', subtitle: 'An ember-scarred bruiser that answers every opening with a burning impact.', health: 760, damage: 34, attackTime: 2100, defense: 21, color: '#a9664e', icon: 'bear', lootItem: 'fire-fragment', lootChance: 0.2, family: 'Runebeasts', alignment: 'Embermarked', resonance: { fire: 52 } }),
    ui: { portraitIcon: 'bear', bestiary: { roleTags: ['Bruiser', 'Burning', 'Heavy Strike'] } },
    actions: { 'cinder-slam': { id: 'cinder-slam', name: 'Cinder Slam', description: 'A heavy blow scorches the quarry with lingering Fire damage.', actionTimeMs: 2050, effects: [scaledDirectDamage('physical', 1.55), scaledDot('burning', 'fire', 1.15, 7000)], tags: ['special', 'physical', 'fire', 'melee', 'debuff'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('cinder-slam-1', 'cinder-slam'), basic('basic-3'), action('cinder-slam-2', 'cinder-slam')] } },
  },
  'gloomroot-hexer': {
    ...target({ id: 'gloomroot-hexer', name: 'Gloomroot Hexer', subtitle: 'A ley-twisted mystic that binds its quarry with a curse before raising a ward.', health: 700, damage: 27, attackTime: 2000, defense: 18, color: '#677c68', icon: 'mage', lootItem: 'earth-fragment', lootChance: 0.18, family: 'Gloamridge Mystics', alignment: 'Leymarked', resonance: { earth: 50 } }),
    ui: { portraitIcon: 'mage', bestiary: { roleTags: ['Hexer', 'Control', 'Leymarked'] } },
    actions: {
      'root-hex': { id: 'root-hex', name: 'Root Hex', description: 'A ley-charged strike leaves the quarry Cursed.', actionTimeMs: 1700, effects: [scaledDirectDamage('arcane', 1.15), applyStatus('cursed', 'opponent', 7500)], tags: ['special', 'arcane', 'debuff'] },
      'ley-barrier': { id: 'ley-barrier', name: 'Ley Barrier', description: 'The Hexer braces behind a Fortified ward.', actionTimeMs: 1550, effects: [applyStatus('fortified', 'self', 6500)], tags: ['special', 'buff'] },
    },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('root-hex-1', 'root-hex'), basic('basic-2'), action('ley-barrier-1', 'ley-barrier'), basic('basic-3'), action('root-hex-2', 'root-hex')] } },
  },
  'nightglass-alpha': {
    ...target({ id: 'nightglass-alpha', name: 'Nightglass Alpha', subtitle: 'Gloamridge’s apex predator. Its mirrored hide blunts early assaults; a Shadow Mark sets up crushing pounces before the Alpha enters a relentless frenzy.', health: 3600, damage: 64, attackTime: 2350, defense: 48, color: '#8e6c86', icon: 'boss', lootItem: 'prismatic-fragment', lootChance: 0.12, family: 'Gloamridge Predators', alignment: 'Nightglass', resonance: { air: 80 } }),
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

export const HUNTER_EXCLUSIVE_MONSTER_IDS: readonly MonsterId[] = Object.values(HUNTERS_ORDER_MONSTERS).flatMap((monster) => monster?.hunter?.exclusive ? [monster.id] : [])
export const HUNTER_REGULAR_MONSTER_IDS: readonly MonsterId[] = HUNTER_EXCLUSIVE_MONSTER_IDS.filter((id) => HUNTERS_ORDER_MONSTERS[id]?.bestiaryCategory === 'monster')

