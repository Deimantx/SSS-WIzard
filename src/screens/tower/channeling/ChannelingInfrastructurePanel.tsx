import { Card, Button, Status } from '../../../components/ui'
import { BALANCE } from '../../../game/data/balance'
import { CHANNELING_UPGRADES, getChannelingRankCost } from '../../../game/data/channeling'
import { ITEMS } from '../../../game/data/items'
import { getManaCapacityBreakdown, getManaRegenBreakdown } from '../../../game/engine/channelingEngine'
import type { ChannelingUpgradeId, ItemId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'

const rate = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1)

function UpgradeCard({ upgradeId }: { upgradeId: ChannelingUpgradeId }) {
  const player = useGameStore((state) => state.player)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const inventory = useGameStore((state) => state.inventory)
  const protectedItems = useGameStore((state) => state.protectedItems)
  const purchase = useGameStore((state) => state.purchaseChannelingUpgrade)
  const upgrade = CHANNELING_UPGRADES[upgradeId]
  const rank = upgradeId === 'mana-reservoir' ? progress.channeling.manaReservoirRank : progress.channeling.leylineConduitRank
  const nextRank = rank + 1
  const cost = getChannelingRankCost(nextRank)
  const isProtected = (itemId: ItemId) => Boolean(protectedItems[itemId] || Object.values(equipment).includes(itemId))
  const blocked = upgrade.resources.find(isProtected)
  const missing = cost ? upgrade.resources.find((itemId) => (inventory[itemId] ?? 0) < cost) : undefined
  const maxed = rank >= upgrade.maxRank
  const canUpgrade = Boolean(cost && !blocked && !missing && !maxed)
  const regen = getManaRegenBreakdown({ activities: useGameStore.getState().activities, progress, equipment })
  const capacity = getManaCapacityBreakdown({ player, progress, equipment })
  const currentValue = upgradeId === 'mana-reservoir' ? capacity.total : regen.baseNatural + regen.conduitBonus + regen.stableLeylineBonus
  const nextValue = currentValue + upgrade.valuePerRank
  const valueLabel = upgradeId === 'mana-reservoir' ? 'Max Mana' : 'Natural Regen'
  const reason = maxed ? 'MAX RANK' : blocked ? `${ITEMS[blocked].name} is protected.` : missing ? `Need ${cost} ${ITEMS[missing].name}.` : ''
  return <div className="channeling-upgrade-card"><div className="channeling-upgrade-head"><div><span className="eyebrow">{upgradeId === 'mana-reservoir' ? 'MANA RESERVOIR' : 'LEYLINE CONDUIT'}</span><h3>{upgrade.name}</h3></div><Status tone={maxed ? 'success' : 'active'}>Rank {rank} / {upgrade.maxRank}</Status></div><p className="muted">{upgrade.description}</p><div className="upgrade-preview"><span>Current<strong>{currentValue} {valueLabel}</strong></span><span>Next<strong>{maxed ? 'MAX' : `${nextValue} ${valueLabel}`}</strong></span></div>{!maxed && cost && <div className="channeling-costs"><span className="eyebrow">COST</span>{upgrade.resources.map((itemId) => <span className={isProtected(itemId) ? 'protected' : (inventory[itemId] ?? 0) < cost ? 'missing' : ''} key={itemId}>{ITEMS[itemId].name}<strong>{cost} / {inventory[itemId] ?? 0}</strong></span>)}</div>}<Button variant={canUpgrade ? 'secondary' : 'ghost'} disabled={!canUpgrade} onClick={() => purchase(upgradeId)}>{maxed ? 'MAX RANK' : `Upgrade ${upgrade.name}`}</Button>{reason && <small className={`channeling-upgrade-reason ${maxed ? 'complete' : ''}`}>{reason}</small>}</div>
}

export function ChannelingInfrastructurePanel() {
  return <Card title="Channeling Infrastructure" action={<span className="muted">Permanent upgrades</span>}><div className="channeling-upgrades"><UpgradeCard upgradeId="mana-reservoir" /><UpgradeCard upgradeId="leyline-conduit" /></div><p className="channeling-infrastructure-note">Fragment costs are required / owned. Protected or equipped Fragments cannot be spent.</p></Card>
}

