import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { GUILD_RANKS } from '../../game/content/guild/guildRanks'
import { GUILD_PROJECTS } from '../../game/content/guild/guildProjects'
import { GUILD_COMMISSION_CHAINS } from '../../game/content/guild/guildCommissionChains'
import { GUILD_COMMISSION_TEMPLATES } from '../../game/content/guild/guildRequests'
import { ARCANE_REGISTRY_SETS } from '../../game/content/guild/registry/registrySets'
import { HUNTER_RANKS } from '../../game/content/huntersOrder/hunterRanks'
import { HUNTER_UPGRADES } from '../../game/content/huntersOrder/hunterUpgrades'
import { getHunterContractTargetLabel } from '../../game/systems/huntersOrder/huntersOrderRuntime'
import { DUNGEONS, DUNGEON_ORDER, isDungeonCompleted, isDungeonUnlocked, isTutorialCompleted } from '../../game/content/dungeons/dungeons'
import { ITEMS } from '../../game/content/items/items'
import { MONSTER_IDS, isBossMonster, MONSTERS } from '../../game/content/monsters'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { getSpellRank } from '../../game/systems/spells'
import { getSchoolProgressInfo } from '../../game/systems/schools'
import { useDeveloperGameStore as useGameStore } from '../developerSandbox'
import { Summary } from './DeveloperTabPrimitives'
import { getGuildAdvancementPointEconomy, getGuildPointsAvailable, getGuildPointsSpent } from '../../game/systems/guild/guildSelectors'
import { formatReadableId } from '../../game/content/presentation/balanceFormatters'
import { formatGuildCommissionObjective } from '../../game/presentation/guild/guildPresentation'
import { DeveloperAdvancedSection } from '../components/DeveloperBrowser'

const schoolIds = Object.keys(SCHOOLS) as Array<keyof typeof SCHOOLS>

export function DeveloperProgression() {
  const state = useGameStore()
  const { progress } = state
  const totalBosses = MONSTER_IDS.filter((id) => isBossMonster(MONSTERS[id])).length
  const discoveredBosses = progress.discoveredMonsters.filter((id) => isBossMonster(MONSTERS[id])).length
  const discoveredEquipment = progress.discoveredItems.filter((id) => ITEMS[id]?.kind === 'equipment').length
  const advancementEconomy = getGuildAdvancementPointEconomy()
  const hunterSeeds = [1, 42, 12345]
  const guildSeeds = [1, 42, 12345]
  const flags = [
    { label: 'First Boss defeated', value: progress.firstBossKill },
    { label: 'Final boss defeated', value: progress.firstMainBossKill },
    { label: 'Guild unlocked', value: progress.guildUnlocked },
    { label: 'Ember Staff recipe unlocked', value: progress.emberStaffUnlocked },
    { label: 'Forest Heart unlocked', value: progress.forestHeartUnlocked },
    { label: 'Auto Hunt unlocked', value: progress.autoHuntBossUnlocked },
  ]

  return <div className="developer-tab-grid">
    <Card title="DUNGEONS · Progression dashboard">
      <div className="developer-summary-grid">
        {DUNGEON_ORDER.map((id) => <Summary key={id} label={DUNGEONS[id].name} value={isDungeonUnlocked(DUNGEONS[id], progress) ? isDungeonCompleted(id, progress) ? 'Complete' : 'Unlocked' : 'Locked'} />)}
        <Summary label="Tutorial" value={isTutorialCompleted(progress) ? 'Complete' : 'Incomplete'} />
        <Summary label="Normal kills" value={progress.lifetimeKills} />
        <Summary label="Boss kills" value={Object.values(progress.bossKillsByBoss).reduce((sum, value) => sum + (value ?? 0), 0)} />
        <Summary label="Discovered monsters" value={`${progress.discoveredMonsters.length} / ${MONSTER_IDS.length}`} />
        <Summary label="Discovered bosses" value={`${discoveredBosses} / ${totalBosses}`} />
        <Summary label="Discovered equipment" value={`${discoveredEquipment} / ${Object.values(ITEMS).filter((item) => item.kind === 'equipment').length}`} />
        <Summary label="Crystals" value={progress.bossKillsByBoss['meridian-splitter'] ? 'Unlocked' : 'Locked'} />
      </div>
    </Card>
    <Card title="MAGIC · School unlocks and levels">
      <div className="developer-research-school-list">{schoolIds.map((schoolId) => { const info = getSchoolProgressInfo(state, schoolId); const spellCount = Object.values(SPELLS).filter((spell) => spell.school === schoolId && getSpellRank(state, spell.id) !== null).length; return <div className="developer-research-school" key={schoolId}><div><strong>{SCHOOLS[schoolId].name}</strong><small>Level {info.level} / {info.cap} · {info.xp} XP · {spellCount} unlocked spells</small></div><Status tone={info.atCap ? 'warning' : info.level > 1 ? 'success' : 'neutral'}>{info.atCap ? 'AT CAP' : 'IN PROGRESS'}</Status></div> })}</div>
      <p className="muted">Use Spells &amp; Schools for direct level, rank, and access controls.</p>
    </Card>
    <Card title="GUILD · Status">
      <div className="developer-summary-grid"><Summary label="Guild" value={progress.guildUnlocked ? 'Unlocked' : 'Locked'} /><Summary label="Rank" value={progress.guildRank} /><Summary label="Reputation" value={progress.guildReputation} /><Summary label="Guild Points" value={`${getGuildPointsAvailable(state)} available / ${progress.guildPointsEarned} earned`} /></div>
      <p className="muted">Read-only progression overview. Guild mutation controls are intentionally not duplicated here.</p>
      <div className="developer-owned-list">{flags.map((flag) => <span key={flag.label}>{flag.label}<strong>{flag.value ? 'ON' : 'OFF'}</strong></span>)}</div>
      <div className="developer-button-grid"><Button variant={progress.guildUnlocked ? 'success' : 'secondary'} onClick={() => state.debugSetArcaneGuildUnlocked(!progress.guildUnlocked)}>{progress.guildUnlocked ? 'Lock Arcane Guild' : 'Unlock Arcane Guild'}</Button><GameTooltip content="Grant Reputation through the tester action, then use Rank Up in the Arcane Guild."><Button variant="secondary" onClick={() => state.debugGrantGuildReputation(1000)}>+1,000 Guild Reputation</Button></GameTooltip><Button variant="secondary" onClick={() => state.debugGrantGuildPoint(5)}>+5 Advancement Points</Button>{GUILD_RANKS.map((rank) => <Button key={rank.id} variant={progress.guildRank === rank.id ? 'success' : 'ghost'} onClick={() => state.debugSetGuildRank(rank.id)}>Set {rank.name}</Button>)}</div>
    </Card>
    <Card title="HUNTER’S ORDER · tester controls">
      <div className="developer-summary-grid"><Summary label="Hunter Rank" value={HUNTER_RANKS.find((rank) => rank.id === progress.huntersOrder.rankId)?.name ?? 'Tracker'} /><Summary label="Reputation" value={progress.huntersOrder.reputation} /><Summary label="Hunter Marks" value={progress.huntersOrder.hunterMarks} /><Summary label="Contracts complete" value={progress.huntersOrder.totalContractsCompleted} /></div>
      <div className="developer-button-grid">
        <Button variant="secondary" onClick={() => state.debugSetHuntersOrderUnlocked(true)}>Unlock Hunter’s Order</Button>
        <Button variant="secondary" onClick={() => state.issueFirstHunterContract()}>Issue Starter Contract</Button>
        <Button variant="ghost" onClick={() => state.debugGrantHunterReputation(500)}>+500 Hunter Reputation</Button>
        <Button variant="ghost" onClick={() => state.debugGrantHunterMarks(10)}>+10 Hunter Marks</Button>
        <Button variant="secondary" onClick={() => state.debugCompleteActiveHunterContract()}>Complete Active Hunt</Button>
        <Button variant="secondary" onClick={() => state.debugSetHunterApexThreatReady()}>Set Gloamridge Apex Threat</Button>
        <GameTooltip content="Remove every active Hunter target block and regenerate eligible contract choices."><Button variant="ghost" onClick={() => state.debugClearHunterTargetBlocks()}>Clear Target Blocks</Button></GameTooltip>
        {hunterSeeds.map((seed) => <GameTooltip key={seed} content={`Set Hunter RNG to ${seed}, then regenerate the board for repeatable contract selection.`}><Button variant="ghost" onClick={() => { state.debugSetHunterRngSeed(seed); state.debugRegenerateHunterContractBoard() }}>Seed ${seed} + Regenerate</Button></GameTooltip>)}
        {progress.huntersOrder.availableContracts.map((contract) => <Button key={contract.id} variant="ghost" onClick={() => state.acceptHunterContract(contract.id)}>Accept {getHunterContractTargetLabel(contract)}</Button>)}
      </div>
      <GameTooltip content="Creates the authored Nightglass Alpha Boss Contract and sets the standing to its explicit Apex requirement."><Button variant="primary" onClick={() => state.debugGrantNightglassBossContract()}>Grant Nightglass Boss Contract</Button></GameTooltip>
      <DeveloperAdvancedSection title="Rank and archetype fixtures"><div className="developer-button-grid">{HUNTER_RANKS.map((rank) => <Button key={rank.id} variant={progress.huntersOrder.rankId === rank.id ? 'success' : 'ghost'} onClick={() => state.debugSetHunterRank(rank.id)}>Set {rank.name}</Button>)}{(['monster', 'family', 'alignment', 'region', 'boss'] as const).map((archetype) => <GameTooltip key={archetype} content={`Generate a board filtered to ${archetype} contract objectives; the tester action raises only required rank standing.`}><Button variant="ghost" onClick={() => state.debugRegenerateHunterContractBoard({ archetype })}>Force {formatReadableId(archetype)}</Button></GameTooltip>)}</div></DeveloperAdvancedSection>
    </Card>
    <Card title="Hunter upgrade tester"><div className="developer-button-grid">{HUNTER_UPGRADES.map((upgrade) => { const rank = progress.huntersOrder.purchasedUpgrades[upgrade.id] ?? 0; return <GameTooltip key={upgrade.id} content={`${upgrade.description} Next rank costs ${upgrade.markCosts[rank] ?? 'no'} Hunter Marks; requires ${formatReadableId(upgrade.requiredRank)} standing.`}><Button variant="ghost" disabled={rank >= upgrade.maxRank} onClick={() => state.purchaseHunterUpgrade(upgrade.id)}>Buy {upgrade.name} ({rank}/{upgrade.maxRank})</Button></GameTooltip> })}</div><DeveloperAdvancedSection title="Grant an upgrade without rank or Mark requirements"><div className="developer-button-grid">{HUNTER_UPGRADES.map((upgrade) => { const rank = progress.huntersOrder.purchasedUpgrades[upgrade.id] ?? 0; return <GameTooltip key={upgrade.id} content={`${upgrade.description} Grants one authored rank and sets the required Hunter standing.`}><Button variant="secondary" disabled={rank >= upgrade.maxRank} onClick={() => state.debugGrantHunterUpgrade(upgrade.id)}>Grant {upgrade.name} ({rank}/{upgrade.maxRank})</Button></GameTooltip> })}</div></DeveloperAdvancedSection></Card>
    <Card title="Guild Commission tester">
      <div className="developer-summary-grid"><Summary label="Active commission" value={progress.arcaneGuild.activeCommission ? formatGuildCommissionObjective(progress.arcaneGuild.activeCommission) : 'None'} /><Summary label="Board offers" value={progress.arcaneGuild.availableCommissions.length} /><Summary label="Free refreshes" value={progress.arcaneGuild.freeRefreshes} /><Summary label="Max authored AP / Board cost" value={`${advancementEconomy.maxBoundedPoints} / ${advancementEconomy.totalBoardPointCost}`} /><Summary label="AP earned / spent / available" value={`${progress.guildPointsEarned} / ${getGuildPointsSpent(state)} / ${getGuildPointsAvailable(state)}`} /></div>
      <div className="developer-button-grid">
        <GameTooltip content="Set Guild RNG to a repeatable seed and regenerate the Commission board."><Button variant="secondary" onClick={() => { state.debugSetGuildCommissionRngSeed(42); state.debugRegenerateGuildCommissionBoard() }}>Seed 42 + Regenerate</Button></GameTooltip>
        <GameTooltip content="Generate an ordinary board using the current authored unlocks and progression."><Button variant="secondary" onClick={() => state.debugRegenerateGuildCommissionBoard()}>Regenerate Board</Button></GameTooltip>
        {(['routine', 'special', 'prestigious'] as const).map((quality) => <GameTooltip key={quality} content={`Generate an authored ${quality} Commission offer for deterministic regression testing.`}><Button variant="ghost" onClick={() => state.debugRegenerateGuildCommissionBoard({ quality })}>Force {formatReadableId(quality)}</Button></GameTooltip>)}
        <GameTooltip content="Spend one free refresh to generate a new Commission board."><Button variant="secondary" disabled={!progress.guildUnlocked || progress.arcaneGuild.freeRefreshes <= 0} onClick={() => state.refreshGuildCommissionChoices()}>Refresh Commission Board</Button></GameTooltip>
        <GameTooltip content={progress.arcaneGuild.activeCommission ? `Deliver available required items for: ${formatGuildCommissionObjective(progress.arcaneGuild.activeCommission)}.` : 'Accept a delivery Commission first.'}><Button variant="ghost" disabled={!progress.arcaneGuild.activeCommission} onClick={() => state.deliverGuildCommissionItems('max')}>Deliver Available Items</Button></GameTooltip>
        {progress.arcaneGuild.availableCommissions.map((commission) => <GameTooltip key={commission.id} content={`${formatReadableId(commission.quality)} Commission · ${formatGuildCommissionObjective(commission)}.`}><Button variant="ghost" onClick={() => state.acceptGuildCommission(commission.id)}>Accept {formatGuildCommissionObjective(commission)}</Button></GameTooltip>)}
      </div>
      <div className="developer-button-grid">{guildSeeds.map((seed) => <Button key={seed} variant="ghost" onClick={() => { state.debugSetGuildCommissionRngSeed(seed); state.debugRegenerateGuildCommissionBoard() }}>Seed {seed} + Regenerate</Button>)}</div>
      <DeveloperAdvancedSection title="Force an authored Commission template"><div className="developer-button-grid">{GUILD_COMMISSION_TEMPLATES.map((template) => <GameTooltip key={template.id} content={`Force the authored ${formatReadableId(template.category)} template at ${formatReadableId(template.complexity ?? 'routine')} quality.`}><Button variant="ghost" onClick={() => state.debugRegenerateGuildCommissionBoard({ templateId: template.id })}>Force {formatReadableId(template.id)}</Button></GameTooltip>)}</div></DeveloperAdvancedSection>
    </Card>
    <Card title="Guild Registry test actions"><div className="developer-button-grid">{ARCANE_REGISTRY_SETS.map((set) => <Button key={set.id} variant="secondary" disabled={!progress.guildUnlocked || progress.arcaneRegistry.completedSetIds.includes(set.id)} onClick={() => state.debugCompleteRegistrySet(set.id)}>Complete {set.name}</Button>)}</div></Card>
    <Card title="Guild long-term progression"><div className="developer-button-grid">{GUILD_PROJECTS.map((project) => <div key={project.id}><GameTooltip content="Complete every authored prerequisite project in order, granting only their real requirements and effects."><Button variant="ghost" disabled={progress.arcaneGuild.completedProjectIds.includes(project.id)} onClick={() => state.debugCompleteGuildProjectPrerequisites(project.id)}>Complete prerequisites · {project.name}</Button></GameTooltip><Button variant="secondary" disabled={progress.arcaneGuild.completedProjectIds.includes(project.id)} onClick={() => state.debugCompleteGuildProject(project.id)}>Complete {project.name}</Button></div>)}{GUILD_COMMISSION_CHAINS.map((chain) => { const repeat = progress.arcaneGuild.completedChainIds.includes(chain.id); return <GameTooltip key={chain.id} content={repeat ? `Complete a repeat clear for +${chain.repeatReputationReward} Reputation and no Advancement Points.` : `Complete the first clear for +${chain.reputationReward} Reputation and ${chain.advancementPointsReward} bounded Advancement Points.`}><Button variant="ghost" onClick={() => state.debugCompleteGuildCommissionChain(chain.id)}>{repeat ? 'Repeat clear' : 'First clear'} · {chain.name}</Button></GameTooltip> })}</div></Card>
  </div>
}
