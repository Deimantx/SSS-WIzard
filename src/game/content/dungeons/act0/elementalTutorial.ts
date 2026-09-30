import type { DungeonDefinition } from '../dungeons'

const tutorialDungeon = (id: DungeonDefinition['id'], name: string, description: string, monsterPool: DungeonDefinition['monsterPool'], boss: Exclude<DungeonDefinition['boss'], null>): DungeonDefinition => ({ id, name, monsterPool, boss, threatRequired: 95, encounterDelayMs: 2500, unlock: { type: 'always' }, ui: { description } })

export const STONEWAKE_HOLLOW_DUNGEON = tutorialDungeon('stonewake-hollow', 'Stonewake Hollow', 'A quiet Earth frontier of patient stone, rising barriers, and slow heavy blows.', ['stonewake-gravel-wisp', 'stonewake-rootback-crawler', 'stonewake-shardhide-golem', 'stonewake-stonebound-warden'], 'heartstone-colossus')
export const GALECREST_HEIGHTS_DUNGEON = tutorialDungeon('galecrest-heights', 'Galecrest Heights', 'A high Air frontier where quicksteps and cutting currents cross the ridge.', ['galecrest-zephyr-wisp', 'galecrest-gale-imp', 'galecrest-razorwing', 'galecrest-stormcaller-adept'], 'tempest-roc')
export const TIDEGLASS_CAVERNS_DUNGEON = tutorialDungeon('tideglass-caverns', 'Tideglass Caverns', 'A Water frontier of sheltered pools, steady currents, and restorative tides.', ['tideglass-tide-wisp', 'tideglass-reef-crawler', 'tideglass-current-serpent', 'tideglass-drowned-channeler'], 'deepwater-oracle')
export const EMBERFALL_BASIN_DUNGEON = tutorialDungeon('emberfall-basin', 'Emberfall Basin', 'A Fire frontier where sparks gather into direct strikes and lingering burns.', ['emberfall-ember-wisp', 'emberfall-ashling', 'emberfall-flame-hound', 'emberfall-ashen-adept'], 'pyre-guardian')
