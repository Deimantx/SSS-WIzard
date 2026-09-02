import { useState } from 'react'
import { Button, Card } from '../../../components/ui'
import { STATUS_DEFINITIONS, STATUS_ORDER } from '../../../game/content/statuses'
import { resolveCombatSourceLabel } from '../../../game/presentation/combat/combatSourcePresentation'
import type { ActiveStatus, EquipmentPosition, ItemId, StatusId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { NumberField } from '../DeveloperTabPrimitives'

export function DeveloperCombatStatus() {
  const [statusId, setStatusId] = useState<StatusId>('burning')
  const combat = useGameStore((state) => state.combat)
  const applyPlayer = useGameStore((state) => state.applyPlayerStatus)
  const applyEnemy = useGameStore((state) => state.applyEnemyStatus)
  const clearPlayer = useGameStore((state) => state.clearPlayerStatuses)
  const clearEnemy = useGameStore((state) => state.clearEnemyStatuses)
  const setPlayerBarrier = useGameStore((state) => state.setPlayerBarrier)
  const setEnemyBarrier = useGameStore((state) => state.setEnemyBarrier)
  const clearPlayerBarrier = useGameStore((state) => state.clearPlayerBarrier)
  const clearEnemyBarrier = useGameStore((state) => state.clearEnemyBarrier)
  const addItem = useGameStore((state) => state.addItem)
  const equipItem = useGameStore((state) => state.equipItem)
  const spawnEnemy = useGameStore((state) => state.spawnDebugEnemy)
  const setPlayer = useGameStore((state) => state.setPlayer)
  const damagePlayer = useGameStore((state) => state.damagePlayerForDebug)
  const killEnemy = useGameStore((state) => state.killCurrentEnemy)
  const advanceCombat = useGameStore((state) => state.advanceCombatDebug)

  const prepareEquipmentFixture = (itemId: ItemId, position: EquipmentPosition) => {
    const current = useGameStore.getState()
    if ((current.inventory[itemId] ?? 0) < 1) addItem(itemId, 1)
    equipItem(itemId, position)
    spawnEnemy('forest-wisp', 'whispering-woods')
  }
  const prepareThresholdFixture = (itemId: ItemId, position: EquipmentPosition, healthPercent: number) => {
    prepareEquipmentFixture(itemId, position)
    clearPlayerBarrier()
    const current = useGameStore.getState()
    const maxHealth = current.player.maxHealth
    setPlayer({ health: maxHealth })
    const targetHealth = Math.max(1, Math.floor(maxHealth * healthPercent))
    let health = useGameStore.getState().player.health
    let attempts = 0
    // Small real hits keep an incoming critical hit from making the fixture lethal
    // before the on-hp-threshold trigger can resolve.
    let barrierTriggered = false
    while (health > targetHealth && !barrierTriggered && attempts < Math.ceil(maxHealth * 4)) {
      damagePlayer(1)
      const next = useGameStore.getState()
      health = next.player.health
      barrierTriggered = next.combat.playerBarrier > 0
      attempts += 1
    }
  }
  return <div className="developer-tab-grid">
    <Card title="Universal status tester"><label className="developer-number-field">Status<select aria-label="Status to apply" value={statusId} onChange={(event) => setStatusId(event.target.value as StatusId)}>{STATUS_ORDER.map((id) => <option key={id} value={id}>{STATUS_DEFINITIONS[id].name}</option>)}</select></label><p className="muted">{STATUS_DEFINITIONS[statusId].description}</p><div className="button-row"><Button onClick={() => applyPlayer(statusId)}>Apply to Player</Button><Button onClick={() => applyEnemy(statusId)}>Apply to Enemy</Button><Button variant="ghost" onClick={clearPlayer}>Clear Player Statuses</Button><Button variant="ghost" onClick={clearEnemy}>Clear Enemy Statuses</Button></div></Card>
    <Card title="Barrier tester"><div className="button-row"><NumberField label="Player Barrier" value={combat.playerBarrier} onChange={setPlayerBarrier} /><Button variant="ghost" onClick={clearPlayerBarrier}>Clear Player Barrier</Button></div><div className="button-row"><NumberField label="Enemy Barrier" value={combat.enemyBarrier} onChange={setEnemyBarrier} /><Button variant="ghost" onClick={clearEnemyBarrier}>Clear Enemy Barrier</Button></div></Card>
    <Card title="Equipment effect fixtures" className="developer-debug-card">
      <p className="developer-debug-note">These setups grant and equip authored gear, then use the real status, Barrier, damage, and encounter runtime.</p>
      <div className="developer-button-grid">
        <Button variant="secondary" onClick={() => prepareThresholdFixture('heartseed-necklace', 'amulet', 0.25)}>Living Seed threshold</Button>
        <Button variant="secondary" onClick={() => prepareThresholdFixture('greatbear-heartstone', 'amulet', 0.3)}>Unyielding threshold</Button>
        <Button variant="secondary" onClick={() => prepareEquipmentFixture('howling-signet', 'ring1')}>Predator's Feast setup</Button>
        <Button variant="secondary" onClick={() => { prepareEquipmentFixture('howling-signet', 'ring1'); killEnemy() }}>Predator's Feast kill</Button>
        <Button variant="secondary" onClick={() => { prepareEquipmentFixture('soulward-focus', 'offhand'); setPlayerBarrier(20) }}>Soulward Focus barrier break setup</Button>
        <Button variant="secondary" onClick={() => { prepareEquipmentFixture('soulward-focus', 'offhand'); setPlayerBarrier(20); damagePlayer(100) }}>Soulward Focus barrier break</Button>
        <Button variant="secondary" onClick={() => { prepareEquipmentFixture('soulward-shield', 'offhand'); setPlayerBarrier(20) }}>Soulward Shield barrier break setup</Button>
        <Button variant="secondary" onClick={() => { prepareEquipmentFixture('soulward-shield', 'offhand'); setPlayerBarrier(20); damagePlayer(100) }}>Soulward Shield barrier break</Button>
        <Button variant="secondary" onClick={() => { prepareEquipmentFixture('gravebinder-ring', 'ring1'); applyEnemy('chilled'); advanceCombat(2200) }}>Gravebinder debuffed hit</Button>
        <Button variant="secondary" onClick={() => { prepareEquipmentFixture('edrins-signet', 'ring1'); applyPlayer('chilled') }}>Edrin Signet hostile debuff</Button>
      </div>
    </Card>
    <Card title="Raw status instances"><RawStatusInstances statuses={[...combat.playerStatuses.map((status) => ({ actor: 'player' as const, status })), ...combat.enemyStatuses.map((status) => ({ actor: 'enemy' as const, status }))]} /></Card>
  </div>
}

function RawStatusInstances({ statuses }: { statuses: Array<{ actor: 'player' | 'enemy'; status: ActiveStatus }> }) {
  if (!statuses.length) return <p className="muted">No active status instances.</p>
  return <div className="developer-status-instance-list">{statuses.map(({ actor, status }) => {
    const definition = STATUS_DEFINITIONS[status.statusId]
    const periodic = status.periodicEffects ?? definition?.periodic?.effects
    const periodicLabel = periodic?.length ? periodic.map((effect) => effect.type === 'deal-damage' ? effect.components.map((component) => component.magnitude.type === 'flat' ? `${component.damageType} ${component.magnitude.value}/tick` : component.damageType).join(' + ') : effect.type).join(', ') : '-'
    return <div className="developer-status-instance" key={`${actor}:${status.statusId}:${status.instanceKey}`}><strong>{definition?.name ?? status.statusId}</strong><span>Actor: {actor} · Status ID: {status.statusId}</span><span>Instance Key: {status.instanceKey}</span><span>Source: {resolveCombatSourceLabel(status.source)} · Origin: {status.source.originSourceKind ?? '-'} / {status.source.originSourceId ?? status.source.sourceId ?? '-'}</span><span>Provider: {status.source.providerInstanceKey ?? '-'} · Origin tags: {status.source.originTags?.join(', ') ?? status.source.tags?.join(', ') ?? '-'} · School: {status.source.originSchool ?? status.source.school ?? '-'}</span><span>Remaining: {status.remainingMs === null ? '∞' : `${Math.max(0, Math.floor(status.remainingMs))}ms`} · Initial: {status.initialDurationMs === null ? '∞' : `${Math.max(0, Math.floor(status.initialDurationMs ?? 0))}ms`} · Next tick: {status.nextTickMs === undefined ? '-' : `${Math.max(0, Math.floor(status.nextTickMs))}ms`}</span><span>Stacks: {status.stacks} · Potency: {status.modifierOverrides ? JSON.stringify(status.modifierOverrides) : '-'} · Periodic: {periodicLabel}</span></div>
  })}</div>
}
