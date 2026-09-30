import { BookOpen, Flame, GitBranch, PackageCheck, RefreshCw, RotateCw, Waves, Zap, type LucideIcon } from 'lucide-react'
import { Button, Card, GameTooltip, Progress, Status } from '../../components/ui'
import { ITEMS } from '../../game/content/items/items'
import { RESONANCE_METADATA } from '../../game/content/resonance/resonance'
import { getConsumableQuantity } from '../../game/core/inventory/inventoryConsumption'
import { formatGuildCommissionObjective, getGuildCommissionProgress } from '../../game/presentation/guild/guildPresentation'
import type { GameStore } from '../../store/gameStore'
import type { GuildCommissionCategory, GuildCommissionObjective, GuildCommissionQuality } from '../../game/types'
import { getGuildCommissionChoiceCount } from '../../game/systems/guild/guildSelectors'

const qualityLabel: Record<GuildCommissionQuality, string> = { routine: 'ROUTINE', special: 'SPECIAL', prestigious: 'PRESTIGIOUS' }
const categoryLabel: Record<GuildCommissionCategory, string> = { supply: 'SUPPLY', channeling: 'CHANNELING', production: 'PRODUCTION', research: 'RESEARCH', transmutation: 'TRANSMUTATION', mixed: 'MIXED' }
const categoryIcon: Record<GuildCommissionCategory, LucideIcon> = { supply: PackageCheck, channeling: Zap, production: Flame, research: BookOpen, transmutation: RotateCw, mixed: GitBranch }
const categoryDescription: Record<GuildCommissionCategory, string> = {
  supply: 'Contribute requested materials or Resonance to the Guild.',
  channeling: 'Generate Arcane Flux through active Channeling.',
  production: 'Successful Transmutation outputs count toward this order.',
  research: 'Successful Research completions count toward this order.',
  transmutation: 'Complete the requested Transmutation cycles.',
  mixed: 'Complete each listed professional objective.',
}

export function GuildContractsBoard({ state }: { state: GameStore }) {
  const guild = state.progress.arcaneGuild
  const active = guild.activeCommission
  const activeProgress = active ? getGuildCommissionProgress(active) : null
  return <section className="guild-v3-tab-content guild-v3-contracts-view arcane-commission-board">
    <header className="guild-commission-board-header">
      <div><span className="guild-v3-kicker">ARCANE GUILD / COMMISSIONS</span><h2>Choose a Commission</h2><p>One professional magical assignment can be active at a time.</p></div>
      <div className="guild-commission-board-counters"><div><span>COMPLETED</span><strong>{guild.completedCommissions.toLocaleString()}</strong></div><div><span>BOARD</span><strong>{guild.availableCommissions.length} / {getGuildCommissionChoiceCount(state)}</strong></div><div><span>FREE REFRESH</span><strong>{guild.freeRefreshes.toLocaleString()}</strong></div></div>
    </header>

    {active && <Card className="guild-commission-active">
      <div className="guild-commission-active-heading"><span className="guild-v3-kicker">ACTIVE COMMISSION</span><span className={`guild-commission-quality ${active.quality}`}>{qualityLabel[active.quality]}</span></div>
      <div className="guild-commission-active-title">
        {(() => { const Icon = categoryIcon[active.category]; return <span className={`guild-commission-category-mark ${active.category}`}><Icon size={18} aria-hidden="true" /></span> })()}
        <div><span className="guild-commission-category-label">{categoryLabel[active.category]}</span><h3>{formatGuildCommissionObjective(active)}</h3></div>
      </div>
      <div className="guild-commission-progress-block"><div><span>COMMISSION PROGRESS</span><strong>{activeProgress?.current.toLocaleString()} / {activeProgress?.target.toLocaleString()}</strong></div><Progress value={Math.min(100, (activeProgress?.current ?? 0) / Math.max(1, activeProgress?.target ?? 1) * 100)} tone="gold" /></div>
      <div className="guild-commission-active-reward"><span>REWARD</span><strong>+{active.reputationReward.toLocaleString()} Reputation</strong>{active.advancementPointReward > 0 && <b>+{active.advancementPointReward} Advancement Point</b>}</div>
      <div className="guild-commission-components">{active.objectives.map((objective, index) => <ObjectiveProgress key={`${objective.kind}:${index}`} objective={objective} index={index} state={state} />)}</div>
    </Card>}

    <div className="guild-commission-offer-heading"><div><span className="guild-v3-kicker">WORK ORDERS</span><h3>{active ? 'Other available offers' : 'Available Commissions'}</h3></div><GameTooltip content={guild.freeRefreshes ? 'Use an earned free refresh to replace the available Commission board.' : 'Complete a Commission to earn one free board refresh.'}><Button variant="secondary" disabled={guild.freeRefreshes < 1} onClick={() => state.refreshGuildCommissionChoices()}><RefreshCw size={14} /> Refresh · {guild.freeRefreshes}</Button></GameTooltip></div>
    {guild.availableCommissions.length ? <div className="guild-commission-grid">{guild.availableCommissions.map((commission) => {
      const Icon = categoryIcon[commission.category]
      return <Card className={`guild-commission-offer ${commission.quality}`} key={commission.id}>
        <div className="guild-commission-offer-heading"><GameTooltip content={categoryDescription[commission.category]}><div className={`guild-commission-category-mark ${commission.category}`}><Icon size={16} aria-hidden="true" /><span>{categoryLabel[commission.category]}</span></div></GameTooltip><span className={`guild-commission-quality ${commission.quality}`}>{qualityLabel[commission.quality]}</span></div>
        <h3>{formatGuildCommissionObjective(commission)}</h3>
        <div className="guild-commission-reward"><span>+{commission.reputationReward.toLocaleString()} Reputation</span>{commission.advancementPointReward > 0 && <strong>+{commission.advancementPointReward} Advancement Point</strong>}</div>
        <GameTooltip content="Accept this professional Commission. Only one Guild assignment can be active at a time."><Button variant="primary" disabled={Boolean(active)} onClick={() => state.acceptGuildCommission(commission.id)}>{active ? 'Commission Active' : 'Accept Commission'}</Button></GameTooltip>
      </Card>
    })}</div> : <Card className="guild-v3-empty-filter-state"><Status tone="neutral">No offers available</Status><span>Unlock another magical discipline to broaden the Guild board.</span></Card>}
  </section>
}

function ObjectiveProgress({ objective, index, state }: { objective: GuildCommissionObjective; index: number; state: GameStore }) {
  const progressLabel = objective.kind === 'item-supply' ? ITEMS[objective.itemId].name
    : objective.kind === 'resonance-supply' ? RESONANCE_METADATA[objective.resonanceType].label
    : objective.kind === 'channeling' ? 'Arcane Flux'
    : objective.kind === 'production' ? ITEMS[objective.itemId].name
    : objective.kind === 'research' ? 'Research cycles'
    : objective.recipeId ? 'Transmutation cycles' : 'Transmutation cycles'
  const supply = objective.kind === 'item-supply' || objective.kind === 'resonance-supply'
  const owned = objective.kind === 'item-supply' ? getConsumableQuantity(state, objective.itemId) : objective.kind === 'resonance-supply' ? state.resonance[objective.resonanceType] : 0
  const remaining = Math.max(0, Math.ceil(objective.target - objective.progress))
  const contribute = (amount: number | 'max') => state.contributeGuildCommissionSupply(index, amount)
  return <div className={`guild-commission-component objective-${objective.kind}`}>
    <div className="guild-commission-component-label"><span>{progressLabel}</span><strong>{objective.progress.toLocaleString()} / {objective.target.toLocaleString()}</strong></div>
    {supply && <div className="guild-commission-delivery"><div><span>OWNED</span><strong>{owned.toLocaleString()} · {remaining.toLocaleString()} needed</strong></div><div>
      {objective.kind === 'item-supply' ? <><GameTooltip content="Contribute one unprotected item to this Commission."><Button variant="ghost" disabled={owned < 1 || remaining < 1} onClick={() => contribute(1)}>Deliver 1</Button></GameTooltip><GameTooltip content="Contribute up to five unprotected items to this Commission."><Button variant="secondary" disabled={owned < 1 || remaining < 1} onClick={() => contribute(5)}>Deliver 5</Button></GameTooltip></> : <><GameTooltip content="Contribute 25 Resonance to this Commission."><Button variant="ghost" disabled={owned < 25 || remaining < 1} onClick={() => contribute(25)}><Waves size={13} /> 25</Button></GameTooltip><GameTooltip content="Contribute 100 Resonance to this Commission."><Button variant="secondary" disabled={owned < 100 || remaining < 1} onClick={() => contribute(100)}><Waves size={13} /> 100</Button></GameTooltip></>}
      <GameTooltip content="Contribute as much as possible, up to the remaining requirement."><Button variant="primary" disabled={owned < 1 || remaining < 1} onClick={() => contribute('max')}>Max</Button></GameTooltip>
    </div></div>}
    <Progress value={Math.min(100, objective.progress / objective.target * 100)} tone="gold" />
  </div>
}
