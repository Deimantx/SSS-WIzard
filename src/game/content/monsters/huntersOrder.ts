import type { MonsterId } from '../../types'
import { basic, type MonsterDefinition } from './monsterTypes'

const target = (id: MonsterId, name: string, subtitle: string, health: number, damage: number, color: string, icon: NonNullable<MonsterDefinition['ui']>['portraitIcon'], lootItem: MonsterDefinition['loot'][number]['itemId'], lootChance: number): MonsterDefinition => ({
  id, bestiaryCategory: 'monster', name, subtitle, maxHealth: health, basicAttackDamage: damage,
  basicAttackTimeMs: 1900, defense: Math.round(health * 0.025), color, ui: { portraitIcon: icon }, hunter: { family: id === 'runehorn-brute' ? 'Runebeasts' : 'Gloamridge Predators', alignment: id === 'runehorn-brute' ? 'Leymarked' : 'Wild', contractTier: 'routine', exclusive: true, contractRequired: true, huntingGroundId: 'hunters-ground' },
  traitIds: [], resonanceYield: { air: 32 },
  actions: {}, actionPatterns: { default: { id: 'default', steps: [basic('strike-1'), basic('strike-2'), basic('strike-3')] } },
  defaultActionPatternId: 'default', loot: [{ itemId: lootItem, min: 1, max: 2, chance: lootChance }],
})

export const HUNTERS_ORDER_MONSTERS: Partial<Record<MonsterId, MonsterDefinition>> = {
  'ashen-tracker': target('ashen-tracker', 'Ashen Tracker', 'A lean scavenger that follows old battle trails.', 590, 27, '#b98b64', 'wolf', 'fire-fragment', 0.16),
  'gloamfang-stalker': target('gloamfang-stalker', 'Gloamfang Stalker', 'A night hunter trained by the dark ridges.', 650, 30, '#8f87a8', 'claw', 'air-fragment', 0.14),
  'runehorn-brute': target('runehorn-brute', 'Runehorn Brute', 'A plated grazer with leyline marks in its horns.', 820, 32, '#9a9670', 'stone', 'earth-fragment', 0.18),
  'nightglass-alpha': { ...target('nightglass-alpha', 'Nightglass Alpha', 'The ground’s dominant predator; its hide turns glancing spells.', 1120, 39, '#8e6c86', 'boss', 'prismatic-fragment', 0.12), defense: 30, bestiaryCategory: 'boss', hunter: { family: 'Gloamridge Predators', alignment: 'Nightglass', contractTier: 'prestigious', exclusive: true, contractRequired: true, huntingGroundId: 'hunters-ground' } },
}

export const HUNTER_EXCLUSIVE_MONSTER_IDS: readonly MonsterId[] = ['ashen-tracker', 'gloamfang-stalker', 'runehorn-brute', 'nightglass-alpha']

