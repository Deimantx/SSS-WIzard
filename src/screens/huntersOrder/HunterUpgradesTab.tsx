import { Backpack, Crosshair, Route, ScrollText, ShieldCheck, Target, Trophy } from 'lucide-react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { HUNTER_UPGRADES } from '../../game/content/huntersOrder/hunterUpgrades'
import { getHunterUpgradePresentation } from '../../game/presentation/huntersOrder/hunterPresentation'
import { useGameStore } from '../../store/gameStore'
import type { GameState } from '../../game/types'

const categoryFor = (id: string) => id === 'trail-kit' || id === 'marked-quarry' ? 'Hunt Efficiency' : id === 'deep-pockets' || id === 'order-privilege' ? 'Rewards & Services' : 'Contract Control'
const icons: Record<string, typeof Target> = { 'trail-kit': Route, 'marked-quarry': Target, 'contract-portfolio': ScrollText, 'extended-trails': Crosshair, 'negotiated-rerolls': ShieldCheck, 'deep-pockets': Backpack, 'order-privilege': Trophy }

export function HunterUpgradesTab({ state }: { state: GameState }) {
  const methods = useGameStore.getState()
  const groups = ['Hunt Efficiency', 'Contract Control', 'Rewards & Services']
  return <div className="hunter-upgrade-groups">{groups.map((group) => {
    const upgrades = HUNTER_UPGRADES.filter((upgrade) => categoryFor(upgrade.id) === group)
    const maxedCount = upgrades.filter((upgrade) => getHunterUpgradePresentation(state, upgrade.id)?.maxed).length
    return <section className="hunter-upgrade-section" key={group}><header><div><span className="hunter-card-kicker">ORDER SERVICES</span><h2>{group}</h2></div><span>{maxedCount} / {upgrades.length} maxed</span></header>
      <div className="hunter-upgrade-grid">{upgrades.map((entry) => {
        const view = getHunterUpgradePresentation(state, entry.id)!
        const Icon = icons[entry.id] ?? Target
        const locked = view.reason === 'rank-required'
        const maxed = view.maxed
        const status = maxed ? 'MAXED' : view.canPurchase ? 'AVAILABLE' : 'LOCKED'
        return <Card key={entry.id} className={`hunter-upgrade-card ${locked ? 'is-locked' : ''} ${maxed ? 'is-maxed' : ''} ${view.canPurchase ? 'is-available' : ''}`}>
          <div className="hunter-upgrade-title"><span><Icon size={17} /></span><div><h3>{entry.name}</h3><small>{group.toUpperCase()}</small></div><strong>{maxed ? 'MAX RANK' : `RANK ${view.ownedRank} / ${entry.maxRank}`}</strong></div>
          <Status tone={maxed ? 'success' : view.canPurchase ? 'active' : locked ? 'warning' : 'neutral'}>{status}</Status>
          <div className="hunter-upgrade-pips" aria-label={`Rank ${view.ownedRank} of ${entry.maxRank}`}>{Array.from({ length: entry.maxRank }, (_, index) => <i key={index} className={index < view.ownedRank ? 'is-filled' : ''} />)}</div>
          <p>{entry.description}</p>
          {locked ? <div className="hunter-upgrade-lock"><Status tone="warning">REQUIRES {view.requiredRank?.name?.toUpperCase()}</Status><span>Current Order Rank: {view.currentRank.name}</span></div> : <dl className="hunter-upgrade-effects"><div><dt>{maxed ? 'FINAL EFFECT' : 'CURRENT EFFECT'}</dt><dd>{view.currentEffect}</dd></div>{!maxed && <div><dt>NEXT RANK</dt><dd>{view.nextEffect}</dd></div>}</dl>}
          {maxed && <div className="hunter-upgrade-final">Final effect · {view.maximumEffect}</div>}
          <div className="hunter-upgrade-purchase"><span>{maxed ? 'Complete' : `Cost · ${view.cost ?? 0} Hunter Marks`}</span><GameTooltip content={maxed ? view.maximumEffect : locked ? `Reach ${view.requiredRank?.name} to access this Order service.` : `Purchase next rank. ${view.nextEffect}.`}><Button variant={maxed ? 'success' : 'primary'} disabled={!view.canPurchase} onClick={() => methods.purchaseHunterUpgrade(entry.id)}>{maxed ? 'MAXED' : locked ? 'LOCKED' : view.reason === 'marks-required' ? `NEED ${view.cost} MARKS` : 'UPGRADE'}</Button></GameTooltip></div>
        </Card>
      })}</div>
    </section>
  })}</div>
}
