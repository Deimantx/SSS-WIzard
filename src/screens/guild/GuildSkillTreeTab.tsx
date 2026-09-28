import { RotateCcw, Sparkles } from 'lucide-react'
import { Button, Card, GameTooltip } from '../../components/ui'
import { GUILD_SKILL_BRANCHES } from '../../game/content/guild/guildSkills'
import { getGuildPointsAvailable, getGuildPointsSpent } from '../../game/systems/guild/guildSelectors'
import type { GameStore } from '../../store/gameStore'
import { GuildSkillBranch } from './GuildSkillBranch'

export function GuildSkillSummary({ state }: { state: GameStore }) {
  const pointsAvailable = getGuildPointsAvailable(state)
  const pointsSpent = getGuildPointsSpent(state)
  return <Card className="guild-v3-skill-summary">
    <div><span className="guild-v3-kicker">ARCANE GUILD ADVANCEMENT</span><h2>Advancement Board</h2><p>Invest points across repeatable service nodes and major standing thresholds. All nodes can eventually be unlocked.</p></div>
    <div className="guild-v3-points-readout"><span>AVAILABLE</span><strong>{pointsAvailable}</strong><small>{pointsSpent} spent</small></div>
    <GameTooltip content="Refund invested Advancement Points outside active combat. Expanded Quarters requires enough free Acolyte capacity before it can be removed." block><Button variant="ghost" onClick={() => state.resetGuildSkillTree()}><RotateCcw size={14} /> Respec tree</Button></GameTooltip>
  </Card>
}

export function GuildSkillBranches({ state }: { state: GameStore }) {
  return <div className="guild-v3-branches">{GUILD_SKILL_BRANCHES.map((branch) => <GuildSkillBranch key={branch} state={state} branch={branch} />)}</div>
}

export function GuildSkillNote() {
  return <div className="guild-v3-skill-note"><Sparkles size={15} /><span>Advancement Points come from Guild rank promotions and completed Registry Sets. Your order of investment never permanently locks another node.</span></div>
}
