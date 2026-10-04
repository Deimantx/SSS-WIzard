import type { CombatLocationId } from './combatLocationIds'
import type { MonsterId } from '../../types'

/** Explicit normal-enemy transfers used to establish the five elemental lanes. */
export const COMBAT_ROSTER_MOVE_TO: Partial<Record<MonsterId, CombatLocationId>> = {
  'leybound-husk': 'rootscar-hollow', 'prism-stalker': 'rootscar-hollow',
  'thorn-maw': 'whispering-woods', 'rootbound-stalker': 'whispering-woods',
  'tempest-stag': 'runeblight-expanse', 'volt-wisp': 'runeblight-expanse', 'gale-scribe': 'runeblight-expanse', 'charged-seeker': 'runeblight-expanse', 'thundercoil-serpent': 'runeblight-expanse',
  'bound-echo': 'stormvault-gallery', 'whisper-archivist': 'stormvault-gallery', 'graveglass-shade': 'stormvault-gallery',
  'vault-devourer': 'graveglass-hollow', 'sealbound-custodian': 'graveglass-hollow',
  'emberglyph-adept': 'starfallen-observatory', 'black-seal-parasite': 'starfallen-observatory', 'voidseal-arbiter': 'starfallen-observatory',
  'frostscript-adept': 'hall-of-unbound-names', 'steamvein-marauder': 'hall-of-unbound-names',
  'inkbound-specter': 'pyrehold-bastion',
  'smokeveil-assassin': 'stormspire-monastery',
  'depthbound-knight': 'vault-of-the-black-sigil', 'pressure-wraith': 'vault-of-the-black-sigil',
  'stormcurrent-hunter': 'stormspire-monastery',
  'rainveil-monk': 'abyssal-reservoir',
  'obsidian-custodian': 'vault-of-the-black-sigil', 'runeplate-golem': 'vault-of-the-black-sigil',
  'starbound-eye': 'nullstone-archive', 'astral-husk': 'nullstone-archive',
}

/** Bosses retained as authored sequence encounters inside the primary dungeon spine. */
export const COMBAT_SEQUENCE_BOSSES: Partial<Record<CombatLocationId, readonly MonsterId[]>> = {
  'broken-meridian': ['sepulcher-flamekeeper'],
  'black-gate': ['deep-bell-saint'],
}
