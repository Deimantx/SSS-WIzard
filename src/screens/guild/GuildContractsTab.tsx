import { BookOpen, Flame, GitBranch, PackageCheck, RefreshCw, RotateCw, type LucideIcon } from 'lucide-react'
import { Button, Card, GameTooltip, Progress, Status } from '../../components/ui'
import { GUILD_COMMISSION_TEMPLATES } from '../../game/content/guild/guildRequests'
import { ITEMS } from '../../game/content/items/items'
import { formatGuildCommissionObjective } from '../../game/presentation/guild/guildPresentation'
import type { GameStore } from '../../store/gameStore'
import type { GuildCommissionCategory, GuildCommissionQuality } from '../../game/types'

const templateFor = (id: string) => GUILD_COMMISSION_TEMPLATES.find((template) => template.id === id)
const qualityLabel: Record<GuildCommissionQuality, string> = { routine: 'ROUTINE', special: 'SPECIAL', prestigious: 'PRESTIGIOUS' }
const categoryLabel: Record<GuildCommissionCategory, string> = { delivery: 'DELIVERY', production: 'PRODUCTION', research: 'RESEARCH', transmutation: 'TRANSMUTATION', mixed: 'MIXED' }
const categoryIcon: Record<GuildCommissionCategory, LucideIcon> = { delivery: PackageCheck, production: Flame, research: BookOpen, transmutation: RotateCw, mixed: GitBranch }
const categoryDescription: Record<GuildCommissionCategory, string> = {
  delivery: 'Deliver the requested unprotected materials to the Guild.',
  production: 'Successful Transmutation outputs count toward this order.',
  research: 'Successful Research completions count toward this order.',
  transmutation: 'Complete the requested Transmutation cycles.',
  mixed: 'Complete each listed professional objective.',
}
const objectiveLabel = formatGuildCommissionObjective

export function GuildContractsBoard({ state }: { state: GameStore }) {
  const guild = state.progress.arcaneGuild
  const active = guild.activeCommission
  return <section className="guild-v3-tab-content guild-v3-contracts-view arcane-commission-board">
    <header className="guild-commission-board-header">
      <div><span className="guild-v3-kicker">ARCANE GUILD / COMMISSIONS</span><h2>Choose a Commission</h2><p>One noncombat Commission can be active at a time.</p></div>
      <div className="guild-commission-board-counters"><div><span>COMPLETED</span><strong>{guild.completedCommissions.toLocaleString()}</strong></div><div><span>FREE REFRESH</span><strong>{guild.freeRefreshes.toLocaleString()}</strong></div></div>
    </header>

    {active && <Card className="guild-commission-active">
      <div className="guild-commission-active-heading"><span className="guild-v3-kicker">ACTIVE COMMISSION</span><span className={`guild-commission-quality ${active.quality}`}>{qualityLabel[active.quality]}</span></div>
      <div className="guild-commission-active-title">
        {(() => { const Icon = categoryIcon[active.category]; return <span className={`guild-commission-category-mark ${active.category}`}><Icon size={18} aria-hidden="true" /></span> })()}
        <div><span className="guild-commission-category-label">{categoryLabel[active.category]}</span><h3>{objectiveLabel(active)}</h3></div>
      </div>
      <p className="guild-commission-description">{categoryDescription[active.category]}</p>
      <div className="guild-commission-progress-block"><div><span>PROGRESS</span><strong>{active.progress.toLocaleString()} / {active.target.toLocaleString()}</strong></div><Progress value={Math.min(100, active.progress / active.target * 100)} tone="gold" /></div>
      <div className="guild-commission-active-reward"><span>REWARD</span><strong>+{active.reputationReward.toLocaleString()} Reputation</strong>{active.advancementPointReward > 0 && <b>+{active.advancementPointReward} Advancement Point</b>}</div>
      {active.components && <div className="guild-commission-components">{active.components.map((component) => <div className="guild-commission-component" key={`${component.category}:${component.itemId ?? 'any'}`}><span>{categoryLabel[component.category]}{component.itemId ? ` · ${ITEMS[component.itemId].name}` : ''}</span><strong>{component.progress.toLocaleString()} / {component.target.toLocaleString()}</strong><Progress value={Math.min(100, component.progress / component.target * 100)} tone="gold" /></div>)}</div>}
      {(() => {
        const delivery = active.category === 'delivery' && active.itemId ? { itemId: active.itemId } : active.category === 'mixed' ? active.components?.find((component) => component.category === 'delivery' && component.itemId && component.progress < component.target) : undefined
        if (!delivery?.itemId) return null
        const owned = state.inventory[delivery.itemId] ?? 0
        return <div className="guild-commission-delivery"><div><span>DELIVERY</span><strong>{ITEMS[delivery.itemId].name} · {owned.toLocaleString()} available</strong></div><div><GameTooltip content="Deliver one unprotected item toward this active Commission."><Button variant="ghost" disabled={owned < 1} onClick={() => state.deliverGuildCommissionItems(1)}>Deliver 1</Button></GameTooltip><GameTooltip content="Deliver up to five unprotected items toward this active Commission."><Button variant="secondary" disabled={owned < 1} onClick={() => state.deliverGuildCommissionItems(5)}>Deliver 5</Button></GameTooltip><GameTooltip content="Deliver as much as possible, up to the remaining requirement."><Button variant="primary" disabled={owned < 1} onClick={() => state.deliverGuildCommissionItems('max')}>Deliver max</Button></GameTooltip></div></div>
      })()}
    </Card>}

    <div className="guild-commission-offer-heading"><div><span className="guild-v3-kicker">WORK ORDERS</span><h3>{active ? 'Other available offers' : 'Available Commissions'}</h3></div><GameTooltip content={guild.freeRefreshes ? 'Use an earned free refresh to replace the available Commission board.' : 'Complete a Commission to earn one free board refresh.'}><Button variant="secondary" disabled={guild.freeRefreshes < 1} onClick={() => state.refreshGuildCommissionChoices()}><RefreshCw size={14} /> Refresh · {guild.freeRefreshes}</Button></GameTooltip></div>
    {guild.availableCommissions.length ? <div className="guild-commission-grid">{guild.availableCommissions.map((commission) => {
      const template = templateFor(commission.templateId)
      const Icon = categoryIcon[commission.category]
      const detail = commission.category === 'delivery' ? template?.itemId ? `Deliver ${ITEMS[template.itemId].name} to the Guild.` : categoryDescription.delivery : categoryDescription[commission.category]
      return <Card className={`guild-commission-offer ${commission.quality}`} key={commission.id}>
        <div className="guild-commission-offer-heading"><div className={`guild-commission-category-mark ${commission.category}`}><Icon size={16} aria-hidden="true" /><span>{categoryLabel[commission.category]}</span></div><span className={`guild-commission-quality ${commission.quality}`}>{qualityLabel[commission.quality]}</span></div>
        <h3>{objectiveLabel(commission)}</h3><p>{detail}</p>
        <div className="guild-commission-reward"><span>+{commission.reputationReward.toLocaleString()} Reputation</span>{commission.advancementPointReward > 0 && <strong>+{commission.advancementPointReward} Advancement Point</strong>}</div>
        <GameTooltip content="Accept this noncombat work order. Only one Guild Commission can be active at a time."><Button variant="primary" disabled={Boolean(active)} onClick={() => state.acceptGuildCommission(commission.id)}>{active ? 'Commission Active' : 'Accept Commission'}</Button></GameTooltip>
      </Card>
    })}</div> : <Card className="guild-v3-empty-filter-state"><Status tone="neutral">No offers available</Status><span>Unlock Research or Transmutation to broaden the Guild board.</span></Card>}
  </section>
}
