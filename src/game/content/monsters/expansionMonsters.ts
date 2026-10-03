import type { CombatLocationId, MonsterId } from '../../types'
import type { ElementId } from '../elements/elements'
import type { StatusId, TraitDefinition, TraitId } from '../../systems/combat/combatTypes'
import { TRAIT_DEFINITIONS } from '../traits/traits'
import { makeCombatMonster } from './combatMonsterAuthoring'
import type { CombatMonsterSpecial } from './combatMonsterAuthoring'
import { action, applyStatus, basic, type MonsterDefinition } from './monsterTypes'

type Row = [id: string, name: string, element: ElementId, first: string, second: string]
type SetRow = [locationId: CombatLocationId, element: ElementId, rows: Row[]]

// Provisional expansion values use the nearby content curve. EXPANSION BALANCE PASS REQUIRED.
const SETS: SetRow[] = [
  ['brineveil-marsh','water',[
    ['mirefin-lurker','Mirefin Lurker','water','Bog Lunge','Submerge'],['brinefang-eel','Brinefang Eel','water','Shock Current','Coil Snap'],['tidebloom-warden','Tidebloom Warden','water','Reed Lash','Blooming Tide'],['fenwater-hexer','Fenwater Hexer','water','Bog Hex','Flood Pulse'],['saltglass-crab','Saltglass Crab','water','Glassclaw','Carapace Lock'],['runesunk-oracle','Runesunk Oracle','arcane','Sunken Rune','Tidal Reading'],['mistwing-skimmer','Mistwing Skimmer','air','Mist Dive','Crosswind'],
  ]],
  ['cinderwild-expanse','fire',[
    ['ashclaw-jackal','Ashclaw Jackal','fire','Searing Bite','Pack Rush'],['emberhide-ram','Emberhide Ram','fire','Cinder Charge','Ember Hide'],['cinderwing-hawk','Cinderwing Hawk','fire','Flare Dive','Ash Veil'],['magma-tick','Magma Tick','fire','Magma Bite','Heat Swell'],['pyrebark-treant','Pyrebark Treant','fire','Cinder Branch','Smoldering Bark'],['stormsmoke-imp','Stormsmoke Imp','air','Smoke Gust','Static Cinder'],['sootbound-augur','Sootbound Augur','arcane','Ash Rune','Furnace Omen'],
  ]],
  ['skybreak-cliffs','air',[
    ['razorwind-raptor','Razorwind Raptor','air','Razor Dive','Wing Shear'],['galehorn-ibex','Galehorn Ibex','air','Wind Charge','Horn Brace'],['cloudmaw-drake','Cloudmaw Drake','air','Gale Breath','Stormbite'],['stormfeather-harrier','Stormfeather Harrier','air','Featherstorm','Slipstream'],['whistling-wraith','Whistling Wraith','air','Sonic Lash','Dissipate'],['raincoil-serpent','Raincoil Serpent','water','Raincoil Bite','Stormcoil'],['cindercrest-roc','Cindercrest Roc','fire','Cinder Dive','Burning Updraft'],
  ]],
  ['runeblight-expanse','arcane',[
    ['leybound-husk','Leybound Husk','arcane','Ley Strike','Overload Shell'],['prism-stalker','Prism Stalker','arcane','Prism Fang','Refraction'],['runic-parasite','Runic Parasite','arcane','Mana Gnaw','Glyph Leech'],['echo-knight','Echo Knight','arcane','Echo Slash','Repeated Form'],['aether-maw','Aether Maw','arcane','Void Bite','Aether Collapse'],['frostscript-adept','Frostscript Adept','water','Frostscript Bolt','Null Script'],['emberglyph-adept','Emberglyph Adept','fire','Glyph Flame','Rune Burst'],
  ]],
  ['pyrehold-bastion','fire',[
    ['furnace-guard','Furnace Guard','fire','Brand Cleave','Furnace Shield'],['molten-penitent','Molten Penitent','fire','Penance Flame','Last Ember'],['ashen-duelist','Ashen Duelist','fire','Twin Brands','Riposte Veil'],['brandkeeper','Brandkeeper','fire','Searing Seal','Brand Wall'],['cinder-apostle','Cinder Apostle','fire','Pyre Sermon','Flame Catechism'],['steamvein-marauder','Steamvein Marauder','water','Scalding Slash','Steam Guard'],['smokeveil-assassin','Smokeveil Assassin','air','Smoke Cut','Vanish'],
  ]],
  ['abyssal-reservoir','water',[
    ['depthbound-knight','Depthbound Knight','water','Pressure Slash','Pressure Guard'],['pressure-wraith','Pressure Wraith','water','Compression Wave','Phase Drift'],['brine-hulk','Brine Hulk','water','Brine Slam','Saline Recovery'],['glassfin-horror','Glassfin Horror','water','Glassfin Rend','Undertow Dash'],['undertow-priest','Undertow Priest','water','Undertow Bolt','Deep Mend'],['nullwater-scribe','Nullwater Scribe','arcane','Nullwater Script','Pressure Rune'],['stormcurrent-hunter','Stormcurrent Hunter','air','Current Spear','Slipstream'],
  ]],
  ['scalding-rift','fire',[
    ['scaldspawn','Scaldspawn','fire','Scald Claw','Steam Burst'],['furnace-serpent','Furnace Serpent','fire','Coil Flame','Boiling Shed'],['redsteam-reaver','Redsteam Reaver','fire','Redsteam Cleave','Vapor Rush'],['boilborn-slime','Boilborn Slime','water','Boiling Splash','Steam Shell'],['pressure-eel','Pressure Eel','water','Pressure Bite','Discharge'],['vaporbound-siren','Vaporbound Siren','water','Scalding Song','Vapor Veil'],['brineforged-brute','Brineforged Brute','water','Brine Hammer','Scald Plate'],
  ]],
  ['mistclaw-highlands','air',[
    ['mistclaw-lynx','Mistclaw Lynx','air','Mist Pounce','Claw Flurry'],['stormhorn-elk','Stormhorn Elk','air','Gale Charge','Storm Antlers'],['razorwing-kite','Razorwing Kite','air','Razor Sweep','Updraft'],['riverhide-boar','Riverhide Boar','water','River Rush','Thick Hide'],['cloudwater-serpent','Cloudwater Serpent','water','Mist Bite','Cloudcoil'],['runemark-stag','Runemark Stag','arcane','Rune Gore','Leyflash'],['slateback-yak','Slateback Yak','earth','Slate Charge','Stone Hide'],
  ]],
  ['cinderhex-barrens','arcane',[
    ['hexjaw-hyena','Hexjaw Hyena','arcane','Hex Bite','Pack Echo'],['runehide-scavenger','Runehide Scavenger','arcane','Rune Rend','Scavenged Ward'],['glasshorn-beast','Glasshorn Beast','arcane','Prism Charge','Glasshide'],['ashmane-lion','Ashmane Lion','fire','Ember Pounce','Roaring Heat'],['emberback-rhino','Emberback Rhino','fire','Cinder Charge','Furnace Hide'],['dustshell-tortoise','Dustshell Tortoise','earth','Shell Ram','Dustshell'],['galeclaw-vulture','Galeclaw Vulture','air','Gale Talon','Carrion Dive'],
  ]],
  ['cinder-sepulcher','fire',[
    ['emberbound-dead','Emberbound Dead','fire','Gravebrand','Ashen Return'],['furnace-acolyte','Furnace Acolyte','fire','Funeral Flame','Cinder Rite'],['basalt-guardian','Basalt Guardian','earth','Tomb Crush','Basalt Ward'],['ashen-archivist','Ashen Archivist','arcane','Ash Script','Ember Record'],
  ]],
  ['temple-of-the-sunken-bell','water',[
    ['bell-drowned-monk','Bell-Drowned Monk','water','Bell Palm','Tidal Breath'],['tidal-reliquary-guard','Tidal Reliquary Guard','water','Reliquary Strike','Tidal Ward'],['coralbound-sentinel','Coralbound Sentinel','earth','Coral Crush','Reef Armor'],['squall-priest','Squall Priest','air','Squall Bolt','Rain Chant'],
  ]],
  ['stormspire-monastery','air',[
    ['zephyr-disciple','Zephyr Disciple','air','Wind Palm','Quick Step'],['skychain-sentinel','Skychain Sentinel','air','Chain Lash','Skychain Ward'],['stonebell-keeper','Stonebell Keeper','earth','Bell Crush','Stone Resonance'],['rainveil-monk','Rainveil Monk','water','Rain Palm','Veil Step'],
  ]],
  ['nullstone-archive','arcane',[
    ['null-scribe','Null Scribe','arcane','Null Script','Cancel Rune'],['obsidian-custodian','Obsidian Custodian','earth','Obsidian Slam','Archive Guard'],['runeplate-golem','Runeplate Golem','earth','Runeplate Crush','Stoneplate'],['emberseal-keeper','Emberseal Keeper','fire','Seal Flame','Ember Lock'],
  ]],
]

const PHASE_TRAITS: Record<string, TraitDefinition> = {}
const BOSS_PHASES: Record<string, { traitName: string; secondPhase: string; haste?: boolean }> = {
  'moonwake-leviathan': { traitName: 'Rising Tide', secondPhase: 'awakened' },
  'furnace-maw': { traitName: 'Overheat', secondPhase: 'overheated', haste: true },
  'tempest-sovereign': { traitName: 'Crowned Tempest', secondPhase: 'sovereign-storm', haste: true },
  'unmade-magister': { traitName: 'Unbound Formula', secondPhase: 'unbound' },
  'pyrehold-castellan': { traitName: 'Castellan’s Last Command', secondPhase: 'last-command' },
  'drowned-regent': { traitName: 'Sovereign Depths', secondPhase: 'deep-throne' },
  'steam-tyrant': { traitName: 'Critical Pressure', secondPhase: 'critical-pressure', haste: true },
  'sepulcher-flamekeeper': { traitName: 'Eternal Flame', secondPhase: 'eternal-flame' },
  'deep-bell-saint': { traitName: 'Second Toll', secondPhase: 'second-toll' },
  'abbot-ninth-gale': { traitName: 'Ninth Wind', secondPhase: 'ninth-wind', haste: true },
  'closed-index': { traitName: 'Open Index', secondPhase: 'open-index' },
}

const STEAM_TYRANT_SPECIALS: Record<string, Partial<CombatMonsterSpecial>> = {
  'Boiling Crown': { damage: [{ type: 'fire', coefficient: 1 }, { type: 'water', coefficient: 1 }], description: 'Boiling Crown deals 1.00× Basic Fire and 1.00× Basic Water damage.' },
  'Scalding Edict': { damage: [{ type: 'fire', coefficient: 1.35 }], dot: { statusId: 'burning', damageType: 'fire', coefficient: 0.35, durationMs: 4000 }, description: 'Scalding Edict deals 1.35× Basic Fire damage and applies Burning with authored Fire damage over time.' },
  'Steam Hammer': { damage: [{ type: 'water', coefficient: 1.4 }], description: 'Steam Hammer deals 1.40× Basic Water damage.' },
  'Vapor Armor': { barrier: 0.1, description: 'Vapor Armor raises a Barrier equal to 10% of Max Health.' },
  'Flash Boil': { damage: [{ type: 'fire', coefficient: 1.2 }], delayOpponentMs: 500, description: 'Flash Boil deals 1.20× Basic Fire damage and delays the opponent’s current action by 500 ms.' },
  'Pressure Rupture': { damage: [{ type: 'fire', coefficient: 1.2 }, { type: 'water', coefficient: 1.2 }], description: 'Pressure Rupture is a long cast that deals 1.20× Basic Fire and 1.20× Basic Water damage.' },
}

const makeExplicitPattern = (id: string, specialNames: string[], sequence: readonly (string | null)[]) => ({
  id,
  steps: sequence.map((name, index) => name === null ? basic(`${id}-b${index}`) : action(`${id}-a${index}`, `skill-${specialNames.indexOf(name) + 1}`)),
})
const boss = (id: string, name: string, affinity: ElementId, locationId: CombatLocationId, first: string[], second: string[], specialNames: string[]): MonsterDefinition => {
  const phaseTrait = `${id}-phase` as TraitId
  const secondPattern = 'phase-two'
  const phase = BOSS_PHASES[id]
  PHASE_TRAITS[phaseTrait] = {
    id: phaseTrait, name: phase.traitName, description: `At 50% Health, enters the ${phase.secondPhase} phase once${phase.haste ? ' and gains Haste' : ''}.`,
    rules: [{ id: `${id}-phase-threshold`, event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 50 }, oncePerEncounter: true, effects: [
      { type: 'set-action-pattern', target: 'self', patternId: secondPattern },
      ...(phase.haste ? [applyStatus('haste', 'self')] : []),
    ] }],
  }
  const specials = specialNames.map((name, index) => {
    const skillId = `skill-${index + 1}`
    if (/ward|hide|shield|sanctuary|armor|shell|guard/i.test(name)) return { id: skillId, name, barrier: .1, description: `${name} raises a Barrier equal to 10% of Max Health.`, actionTimeMs: 1900 + index * 100 }
    if (/mend|heal|rite|benediction|recovery/i.test(name)) return { id: skillId, name, heal: .05, description: `${name} restores 5% of Max Health.`, actionTimeMs: 1900 + index * 100 }
    const statusId: StatusId = /silence|redaction/i.test(name) ? 'silenced' : /tide|brine|rain|drown|pressure/i.test(name) ? 'chilled' : /brand|pyre|ember|flame|cinder/i.test(name) ? 'burning' : /gale|storm|wind/i.test(name) ? 'shock' : 'vulnerable'
    const authoredDot = statusId === 'burning'
      ? { statusId, damageType: affinity, coefficient: 0.35, durationMs: 4000 }
      : undefined
    const generated: CombatMonsterSpecial = { id: skillId, name, damage: [{ type: affinity, coefficient: index === specialNames.length - 1 ? 2.2 : 1.25 }], ...(authoredDot ? { dot: authoredDot } : { status: { id: statusId, target: 'opponent' as const } }), description: `${name} deals ${index === specialNames.length - 1 ? '2.20' : '1.25'}× Basic ${affinity} damage and ${authoredDot ? `applies ${statusId} with authored damage over time` : `applies ${statusId}`}.`, actionTimeMs: /final|surge|eruption|collapse|rupture|toll|gale|index|bell/i.test(name) ? 2800 : 1800 + index * 100 }
    return id === 'steam-tyrant' ? { ...generated, ...STEAM_TYRANT_SPECIALS[name] } : generated
  })
  const pattern = (id: string, names: string[]) => ({ id, steps: names.flatMap((name, index) => [action(`${id}-a${index}`, `skill-${specialNames.indexOf(name) + 1}`), ...(index === names.length - 1 ? [] : [basic(`${id}-b${index}`)])]) })
  const phaseLabelMap: Record<string, string> = { 'moonwake-leviathan': 'submerged|awakened', 'furnace-maw': 'feeding|overheated', 'tempest-sovereign': 'high-sky|sovereign-storm', 'unmade-magister': 'formula|unbound', 'pyrehold-castellan': 'castellan|last-command', 'drowned-regent': 'regent|deep-throne', 'steam-tyrant': 'boiling-throne|critical-pressure', 'sepulcher-flamekeeper': 'keeper|eternal-flame', 'deep-bell-saint': 'first-toll|second-toll', 'abbot-ninth-gale': 'seven-winds|ninth-wind', 'closed-index': 'closed-index|open-index' }
  const [firstLabel, secondLabel] = phaseLabelMap[id].split('|')
  const phaseOnePattern = id === 'steam-tyrant'
    ? makeExplicitPattern('phase-one', specialNames, ['Boiling Crown', null, 'Scalding Edict', 'Vapor Armor', null, 'Steam Hammer'])
    : pattern('phase-one', first)
  const phaseTwoPattern = id === 'steam-tyrant'
    ? makeExplicitPattern('phase-two', specialNames, ['Pressure Rupture', 'Flash Boil', null, 'Boiling Crown', 'Scalding Edict', 'Steam Hammer'])
    : pattern('phase-two', second)
  const bossPowerByLocation: Partial<Record<CombatLocationId, number>> = { 'brineveil-marsh': 2400, 'cinderwild-expanse': 4200, 'skybreak-cliffs': 6000, 'runeblight-expanse': 7000, 'pyrehold-bastion': 10000, 'abyssal-reservoir': 10500, 'scalding-rift': 12500, 'cinder-sepulcher': 11500, 'temple-of-the-sunken-bell': 11500, 'stormspire-monastery': 12500, 'nullstone-archive': 15000 }
  const bossPower = bossPowerByLocation[locationId] ?? 0
  return { ...makeCombatMonster({ combatV2: true, locationId, id: id as MonsterId, name, subtitle: `A ${affinity} boss that changes its attack sequence at half health.`, hp: 12000 + bossPower, damage: 100 + Math.round(bossPower / 250), defense: 70 + Math.round(bossPower / 500), targetPower: bossPower, primaryAffinity: affinity, basicAttackElement: affinity, boss: true, resonanceYield: { [affinity]: 80 }, specials, combatV2Traits: [phaseTrait], actionPatterns: { 'phase-one': phaseOnePattern, [secondPattern]: phaseTwoPattern }, defaultActionPatternId: 'phase-one' }), ui: { portraitIcon: 'boss', bestiary: { phaseLabels: { 'phase-one': firstLabel, 'phase-two': secondLabel }, phaseOrder: ['phase-one', 'phase-two'] } } }
}

const makeNormal = (locationId: CombatLocationId, row: Row, index: number): MonsterDefinition => {
  const [id, name, affinity, firstName, secondName] = row
  const defensive = /submerge|bloom|hide|lock|veil|swelling|shell|brace|dissipate|slipstream|refraction|form|collapse|guard|ward|recovery|mend|step|updraft|plate|armor|return|rite|breath/i.test(secondName)
  const second: CombatMonsterSpecial = defensive
    ? (/bloom|breath|recovery|mend|rite/i.test(secondName)
      ? { id: 'second-special', name: secondName, heal: .06 }
      : /submerge|shell|hide|lock|ward|guard|armor|plate/i.test(secondName)
        ? { id: 'second-special', name: secondName, barrier: .08 }
        : { id: 'second-special', name: secondName, status: { id: (/veil|dissipate|drift|vanish/i.test(secondName) ? 'spectral-fade' : /haste|updraft|slipstream|step/i.test(secondName) ? 'haste' : 'fortified') as StatusId, target: 'self' as const } })
    : { id: 'second-special', name: secondName, damage: [{ type: affinity, coefficient: 1.4 }] }
  const first = { id: 'first-special', name: firstName, damage: [{ type: affinity, coefficient: 1.3 }] }
  const patternSteps = [action('first', 'first-special'), basic('basic-one'), action('second', 'second-special'), basic('basic-two')]
  const locationDepth = SETS.findIndex(([setLocation]) => setLocation === locationId)
  const provisionalPower = 220 + locationDepth * 360 + index * 28
  const monster = makeCombatMonster({ combatV2: true, locationId, id: id as MonsterId, name, subtitle: `Uses ${firstName} before ${secondName}, alternating strikes with basic attacks.`, hp: 1800 + locationDepth * 850 + index * 220, damage: 34 + locationDepth * 8 + index * 4, defense: 12 + locationDepth * 3 + index * 2, time: 2300, targetPower: provisionalPower, primaryAffinity: affinity, basicAttackElement: affinity, resonanceYield: { [affinity]: 8 }, specials: [first, second], patternSteps })
  return locationId === 'mistclaw-highlands' || locationId === 'cinderhex-barrens'
    ? { ...monster, hunter: { family: locationId === 'mistclaw-highlands' ? 'Highland Stalkers' : 'Cinderhex Scavengers', alignment: locationId === 'mistclaw-highlands' ? 'Wild' : 'Corrupted', contractTier: 'routine', minimumRank: 'warden', exclusive: true, contractRequired: true, huntingGroundId: locationId } }
    : monster
}

const generatedMonsters: MonsterDefinition[] = SETS.flatMap(([location, , rows]) => rows.map((row, index) => makeNormal(location, row, index)))

const BOSS_DEFINITIONS = [
  boss('moonwake-leviathan','Moonwake Leviathan','water','brineveil-marsh',['Tidal Crush','Brine Coil','Abyssal Hide','Drowning Arc'],['Moonwake Surge','Undertow Pull','Tidal Crush','Brine Coil','Drowning Arc'],['Tidal Crush','Brine Coil','Drowning Arc','Abyssal Hide','Undertow Pull','Moonwake Surge']),
  boss('furnace-maw','The Furnace Maw','fire','cinderwild-expanse',['Magma Bite','Furnace Breath','Cinder Carapace','Ashquake'],['Eruption','Magma Bite','Devour Cinders','Furnace Breath','Ashquake'],['Magma Bite','Furnace Breath','Ashquake','Cinder Carapace','Devour Cinders','Eruption']),
  boss('tempest-sovereign','Tempest Sovereign','air','skybreak-cliffs',['Talon Tempest','Thunder Crown','Eye of the Storm','Rainburst'],['Skyfall','Crosswind Rend','Thunder Crown','Talon Tempest','Rainburst'],['Talon Tempest','Thunder Crown','Crosswind Rend','Eye of the Storm','Rainburst','Skyfall']),
  boss('unmade-magister','The Unmade Magister','arcane','runeblight-expanse',['Arcane Lance','Prism Divide','Counterseal','Ley Rupture'],['Unmake','Mana Collapse','Prism Divide','Ley Rupture','Arcane Lance'],['Arcane Lance','Prism Divide','Ley Rupture','Counterseal','Mana Collapse','Unmake']),
  boss('pyrehold-castellan','Pyrehold Castellan','fire','pyrehold-bastion',['Castellan\'s Brand','Furnace Decree','Bastion Flame','Molten Counter'],['Execution Pyre','Ashen Command','Castellan\'s Brand','Bastion Flame','Furnace Decree'],['Castellan\'s Brand','Furnace Decree','Bastion Flame','Molten Counter','Execution Pyre','Ashen Command']),
  boss('drowned-regent','The Drowned Regent','water','abyssal-reservoir',['Regent\'s Tide','Deep Decree','Pressure Crown','Nullwater Sentence'],['Drown the Hall','Undertow Collapse','Regent\'s Tide','Nullwater Sentence'],['Regent\'s Tide','Pressure Crown','Deep Decree','Nullwater Sentence','Undertow Collapse','Drown the Hall']),
  boss('steam-tyrant','The Steam Tyrant','fire','scalding-rift',['Boiling Crown','Scalding Edict','Vapor Armor','Steam Hammer'],['Pressure Rupture','Flash Boil','Steam Hammer','Boiling Crown','Scalding Edict'],['Boiling Crown','Scalding Edict','Steam Hammer','Vapor Armor','Flash Boil','Pressure Rupture']),
  boss('sepulcher-flamekeeper','Sepulcher Flamekeeper','fire','cinder-sepulcher',['Funeral Pyre','Ashen Procession','Keeper\'s Ward','Cinder Rite'],['Cremation Bell','Funeral Pyre','Last Ember','Ashen Procession','Cinder Rite'],['Funeral Pyre','Ashen Procession','Keeper\'s Ward','Cinder Rite','Last Ember','Cremation Bell']),
  boss('deep-bell-saint','The Deep Bell Saint','water','temple-of-the-sunken-bell',['Bell Toll','Drowned Hymn','Deep Sanctuary','Resonant Tide'],['Final Toll','Resonant Tide','Bell Toll','Sunken Benediction','Drowned Hymn'],['Bell Toll','Drowned Hymn','Resonant Tide','Deep Sanctuary','Sunken Benediction','Final Toll']),
  boss('abbot-ninth-gale','Abbot of the Ninth Gale','air','stormspire-monastery',['First Gale','Third Gale','Fifth Gale','Seventh Gale'],['Ninth Gale','Skychain Silence','Third Gale','Fifth Gale','First Gale'],['First Gale','Third Gale','Fifth Gale','Seventh Gale','Skychain Silence','Ninth Gale']),
  boss('closed-index','The Closed Index','arcane','nullstone-archive',['Redaction','Stone Seal','Archive Lock','Null Entry'],['Final Index','Ember Clause','Redaction','Null Entry','Stone Seal'],['Redaction','Null Entry','Stone Seal','Ember Clause','Archive Lock','Final Index']),
] as const

generatedMonsters.push(...BOSS_DEFINITIONS)
Object.assign(TRAIT_DEFINITIONS, PHASE_TRAITS)

export const EXPANSION_MONSTERS = Object.fromEntries(generatedMonsters.map((monster) => [monster.id, monster])) as Record<MonsterId, MonsterDefinition>
export const EXPANSION_LOCATION_ROSTERS = Object.fromEntries(SETS.map(([location, , rows]) => [location, rows.map(([id]) => id as MonsterId)])) as Partial<Record<CombatLocationId, readonly MonsterId[]>>
export const EXPANSION_BOSSES_BY_LOCATION: Partial<Record<CombatLocationId, MonsterId>> = Object.fromEntries([
  'brineveil-marsh','cinderwild-expanse','skybreak-cliffs','runeblight-expanse','pyrehold-bastion','abyssal-reservoir','scalding-rift','cinder-sepulcher','temple-of-the-sunken-bell','stormspire-monastery','nullstone-archive',
].map((locationId, index) => [locationId, BOSS_DEFINITIONS[index].id as MonsterId]))
