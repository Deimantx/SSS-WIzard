import { Button, Card, Progress, SelectMenu, Status, Toggle as SharedToggle } from '../../../components/ui'
import { DUNGEONS } from '../../../game/content/dungeons/dungeons'
import { MONSTERS, isBossMonster } from '../../../game/content/monsters'
import { getCombatLocationByDungeonId } from '../../../game/content/world-navigation'
import { formatDuration, formatReadableId } from '../../../game/content/presentation/balanceFormatters'
import { getCurrentEnemyActionStep, getEnemyAction } from '../../../game/systems/combat/actionRuntime'
import { useDeveloperGameStore as useGameStore } from '../../developerSandbox'
import { CombatTimeControls } from './CombatTimeControls'
import { Summary } from '../DeveloperTabPrimitives'
import { formatResourceAmount } from '../../../game/presentation/resources/resourcePresentation'
import { resolveBossThreatRequirement } from '../../../game/systems/combat/combatThreat'
import { formatNumber } from '../../../game/utils'
import type { MonsterId } from '../../../game/types'

const Toggle = ({ label, checked, onChange, danger = false }: { label: string; checked: boolean; onChange: (value: boolean) => void; danger?: boolean }) => <SharedToggle label={label} description={`Toggle the ${label} combat test override.`} checked={checked} onChange={onChange} className={danger ? 'is-danger' : ''} />

export function DeveloperCombatLive() {
  const combat = useGameStore((state) => state.combat)
  const player = useGameStore((state) => state.player)
  const debug = useGameStore((state) => state.debug)
  const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  const dungeon = DUNGEONS[combat.dungeonId ?? 'whispering-woods']
  const worldTier = useGameStore((state) => state.worldTier.current)
  const threatRequired = resolveBossThreatRequirement(dungeon.id, worldTier)
  const location = getCombatLocationByDungeonId(combat.dungeonId)
  const setCombatTarget = useGameStore((state) => state.setCombatTarget)
  const targetIds = location?.targetMetadata
    ? Object.entries(location.targetMetadata).sort(([, left], [, right]) => (left?.order ?? 0) - (right?.order ?? 0)).map(([id]) => id as MonsterId)
    : []
  const currentStep = enemy ? getCurrentEnemyActionStep(useGameStore.getState()) : undefined
  const currentAction = enemy ? getEnemyAction(useGameStore.getState(), combat.enemyCurrentActionId) : undefined
  const setPlayer = useGameStore((state) => state.setPlayer)
  const resetCooldowns = useGameStore((state) => state.resetSpellCooldowns)
  const clearPlayer = useGameStore((state) => state.clearPlayerStatuses)
  const clearEnemy = useGameStore((state) => state.clearEnemyStatuses)
  const clearCombatOverrides = useGameStore((state) => state.clearCombatDebugOverrides)
  const setDebugPlayerImmortal = useGameStore((state) => state.setDebugPlayerImmortal)
  const setDebugEnemyImmortal = useGameStore((state) => state.setDebugEnemyImmortal)
  const setDebugInfiniteMana = useGameStore((state) => state.setDebugInfiniteMana)
  const setDebugCooldowns = useGameStore((state) => state.setDebugIgnoreSpellCooldowns)
  const setDebugAuto = useGameStore((state) => state.setDebugDisableAutoCast)
  const setDebugPlayerFreeze = useGameStore((state) => state.setDebugFreezePlayerActions)
  const setDebugEnemyFreeze = useGameStore((state) => state.setDebugFreezeEnemyActions)
  const startingSchoolId = useGameStore((state) => state.progress.startingSchoolId)
  const addSpellToSelectedPreset = useGameStore((state) => state.addSpellToSelectedPreset)
  const applyElementalWard = useGameStore((state) => state.debugApplyElementalWard)
  const expireElementalWards = useGameStore((state) => state.debugExpireElementalWards)
  const clearElementalWards = useGameStore((state) => state.debugClearElementalWards)
  const starterWard = startingSchoolId ? `${startingSchoolId}-ward` as import('../../../game/types').SpellId : null
  const targetOptions = [{ value: '' as const, label: 'Choose a target' }, ...targetIds.map((id) => ({ value: id, label: MONSTERS[id]?.name ?? id }))]

  return <div className="developer-tab-grid combat-live-grid">
    <Card title="Live dashboard"><div className="developer-summary-grid">
      <Summary label="Active Location" value={location?.name ?? 'None'} />
      <Summary label="Encounter mode" value={location?.encounterMode ?? 'random-pool'} />
      <Summary label="Current target" value={combat.targetEnemyId ? MONSTERS[combat.targetEnemyId]?.name ?? combat.targetEnemyId : 'None'} />
      <Summary label="Dungeon" value={dungeon.name} />
      <Summary label="Enemy" value={enemy ? `${enemy.name} · ${isBossMonster(enemy) ? 'Boss' : 'Normal'}` : 'None'} />
      <Summary label="Player HP" value={`${Math.floor(player.health)} / ${Math.floor(player.maxHealth)}`} />
      <Summary label="Enemy HP" value={enemy ? `${Math.floor(combat.enemyHp)} / ${Math.floor(combat.enemyMaxHp)}` : '-'} />
      <Summary label="Player Mana" value={`${formatResourceAmount(player.mana)} / ${formatResourceAmount(player.maxMana)}`} />
      <Summary label="Player Barrier" value={Math.floor(combat.playerBarrier)} />
      <Summary label="Enemy Barrier" value={Math.floor(combat.enemyBarrier)} />
      <Summary label="Threat" value={`${formatNumber(combat.threatCleared)} / ${formatNumber(threatRequired)}`} />
      <Summary label="Current Action" value={currentStep?.type === 'basic' ? 'Basic Attack' : currentAction?.name ?? '-'} />
      <Summary label="Pattern" value={formatReadableId(combat.enemyActionPatternId ?? '-')} />
      <Summary label="Pattern position" value={combat.enemyNextActionIndex} />
      <Summary label="Enemy Timer" value={formatDuration(combat.enemyActionTimerMs)} />
      <Summary label="Combat Clock" value={debug.combatPaused ? 'Paused' : `${debug.combatTimeScale}×`} />
    </div>{enemy && <Progress value={combat.enemyHp / Math.max(1, combat.enemyMaxHp) * 100} tone="red" label="Enemy HP" right={`${Math.floor(combat.enemyHp)} HP`} />}</Card>
    {location?.encounterMode === 'targeted' && <Card title="Targeted farming"><div className="developer-select-field"><span>SET TARGET</span><SelectMenu options={targetOptions} ariaLabel="Developer combat target" value={combat.targetEnemyId ?? ''} onChange={(value) => { if (value) setCombatTarget(value as MonsterId) }} /></div><Button tooltip="Set the next normal encounter through the canonical combat target action." disabled={!combat.active || !combat.targetEnemyId} onClick={() => combat.targetEnemyId && setCombatTarget(combat.targetEnemyId)}>Set Target</Button></Card>}
    <Card title="Combat overrides" className="developer-debug-card"><div className="developer-toggle-list"><Toggle label="Player Immortal" checked={debug.playerImmortal} onChange={setDebugPlayerImmortal} danger /><Toggle label="Enemy Immortal" checked={debug.enemyImmortal} onChange={setDebugEnemyImmortal} danger /><Toggle label="Infinite Mana" checked={debug.infiniteMana} onChange={setDebugInfiniteMana} /><Toggle label="Ignore Spell Cooldowns" checked={debug.ignoreSpellCooldowns} onChange={setDebugCooldowns} /><Toggle label="Disable Auto-Cast" checked={debug.disableAutoCast} onChange={setDebugAuto} /><Toggle label="Freeze Player Actions" checked={debug.freezePlayerActions} onChange={setDebugPlayerFreeze} /><Toggle label="Freeze Enemy Actions" checked={debug.freezeEnemyActions} onChange={setDebugEnemyFreeze} /></div><CombatTimeControls /></Card>
    <Card title="Quick actions"><div className="developer-button-grid"><Button onClick={() => setPlayer({ health: player.maxHealth })}>Heal Player</Button><Button onClick={() => setPlayer({ mana: player.maxMana })}>Fill Mana</Button><Button variant="secondary" onClick={resetCooldowns}>Reset Cooldowns</Button><Button variant="ghost" onClick={clearPlayer}>Clear Player Statuses</Button><Button variant="ghost" onClick={clearEnemy}>Clear Enemy Statuses</Button><Button variant="danger" onClick={clearCombatOverrides}>Clear Combat Overrides</Button></div><p className="developer-debug-note">Setup controls are runtime-only. Combat speed does not affect non-Combat activities.</p></Card>
    <Card title="Elemental Ward lab"><div className="developer-button-grid"><Button tooltip="Add the starting School’s Ward to the selected preset." disabled={!starterWard} onClick={() => starterWard && addSpellToSelectedPreset(starterWard)}>Equip Starter Ward</Button><Button variant="secondary" tooltip="Apply a 15% Ward matching the active enemy’s basic attack element." disabled={!combat.active} onClick={applyElementalWard}>Apply Matching Ward</Button><Button variant="ghost" tooltip="Set active Ward timers to expire at the current combat time." onClick={expireElementalWards}>Expire Wards</Button><Button variant="danger" tooltip="Remove every active Elemental Ward from the current run." onClick={clearElementalWards}>Clear Wards</Button></div><p className="developer-debug-note">Ward fixtures use the current enemy’s element. Preset changes use the normal spellbook action.</p></Card>
  </div>
}
