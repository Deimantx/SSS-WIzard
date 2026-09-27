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
    <div><span className="guild-v3-kicker">GUILD SPECIALIZATION</span><h2>Skill tree</h2><p>Invest in one of three vertical paths. Each node is a permanent authored bonus until you respec.</p></div>
    <div className="guild-v3-points-readout"><span>AVAILABLE</span><strong>{pointsAvailable}</strong><small>{pointsSpent} spent</small></div>
    <GameTooltip content="Refund invested Guild Points outside active combat. Expanded Quarters requires enough free Acolyte capacity before it can be removed." block><Button variant="ghost" onClick={() => state.resetGuildSkillTree()}><RotateCcw size={14} /> Respec tree</Button></GameTooltip>
  </Card>
}

export function GuildSkillBranches({ state }: { state: GameStore }) {
  return <div className="guild-v3-branches">{GUILD_SKILL_BRANCHES.map((branch) => <GuildSkillBranch key={branch} state={state} branch={branch} />)}</div>
}

export function GuildSkillNote() {
  return <div className="guild-v3-skill-note"><Sparkles size={15} /><span>Guild Points come from unique contract claims and authored promotion rewards. Reputation remains non-spendable.</span></div>
}
