import { useState } from 'react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { SelectMenu } from '../../components/ui'
import { GUILD_RANKS } from '../../game/content/guild/guildRanks'
import { GUILD_STANDINGS } from '../../game/content/guild/guildStandings'
import { GUILD_PROJECTS } from '../../game/content/guild/guildProjects'
import { GUILD_COMMISSION_CHAINS } from '../../game/content/guild/guildCommissionChains'
import { GUILD_COMMISSION_TEMPLATES } from '../../game/content/guild/guildRequests'
import { GUILD_SKILL_NODES, GUILD_SKILL_NODE_IDS } from '../../game/content/guild/guildSkills'
import { ARCANE_REGISTRY_SETS } from '../../game/content/guild/registry/registrySets'
import { HUNTER_RANKS, HUNTER_STANDINGS } from '../../game/content/hunters-order/hunterRanks'
import { HUNTER_UPGRADES } from '../../game/content/hunters-order/hunterUpgrades'
import { HUNTER_GROUNDS } from '../../game/content/hunters-order/hunterGrounds'
import { getHunterContractTargetLabel } from '../../game/systems/hunters-order/huntersOrderRuntime'
import { DUNGEONS, DUNGEON_ORDER, isDungeonCompleted, isDungeonUnlocked, isTutorialCompleted } from '../../game/content/combat-locations/dungeons/dungeons'
import { ITEMS } from '../../game/content/items/items'
import { MONSTER_IDS, isBossMonster, MONSTERS } from '../../game/content/monsters'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { getSpellRank } from '../../game/systems/spells'
import { getSchoolProgressInfo } from '../../game/systems/schools'
import { useDeveloperGameStore as useGameStore } from '../developerSandbox'
import { Summary } from './DeveloperTabPrimitives'
import { getGuildAdvancementPointEconomy, getGuildPointsAvailable, getGuildPointsSpent } from '../../game/systems/guild/guildSelectors'
import { formatReadableId } from '../../game/presentation/content/balanceFormatters'
import { formatGuildCommissionObjective } from '../../game/presentation/guild/guildPresentation'
import { DeveloperAdvancedSection } from '../components/DeveloperBrowser'

const schoolIds = Object.keys(SCHOOLS) as Array<keyof typeof SCHOOLS>

export function DeveloperProgression() {
  const [hunterStanding, setHunterStanding] = useState<string>('tracker-1')
  const [hunterUpgradeId, setHunterUpgradeId] = useState<string>(HUNTER_UPGRADES[0].id)
  const [hunterUpgradeRank, setHunterUpgradeRank] = useState('0')
  const [guildStandingId, setGuildStandingId] = useState('initiate-1')
  const [guildCategory, setGuildCategory] = useState<import('../../game/types').GuildCommissionCategory>('supply')
  const [guildQuality, setGuildQuality] = useState<'routine' | 'special' | 'prestigious'>('routine')
  const [guildTemplateId, setGuildTemplateId] = useState(GUILD_COMMISSION_TEMPLATES[0].id)
  const [guildStudyId, setGuildStudyId] = useState(GUILD_COMMISSION_CHAINS[0].id)
  const [guildProjectId, setGuildProjectId] = useState(GUILD_PROJECTS[0].id)
  const [guildSetId, setGuildSetId] = useState(ARCANE_REGISTRY_SETS[0].id)
  const [guildProgramId, setGuildProgramId] = useState(GUILD_SKILL_NODE_IDS.find((id) => !GUILD_SKILL_NODES[id].legacy) ?? GUILD_SKILL_NODE_IDS[0])
  const [guildProgramRank, setGuildProgramRank] = useState('0')
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
    <Card title="GUILD · Standing and progression fixtures">
      <div className="developer-summary-grid"><Summary label="Guild" value={progress.guildUnlocked ? 'Unlocked' : 'Locked'} /><Summary label="Macro rank" value={GUILD_RANKS.find((rank) => rank.id === progress.guildRank)?.name ?? progress.guildRank} /><Summary label="Standing" value={[...GUILD_STANDINGS].reverse().find((standing) => standing.reputation <= progress.guildReputation)?.name ?? 'Initiate I'} /><Summary label="Reputation" value={`${progress.guildReputation.toLocaleString()} / 208,000`} /><Summary label="Advancement" value={`${getGuildPointsAvailable(state)} available / ${getGuildPointsSpent(state)} spent`} /></div>
      <div className="developer-owned-list">{flags.map((flag) => <span key={flag.label}>{flag.label}<strong>{flag.value ? 'ON' : 'OFF'}</strong></span>)}</div>
      <div className="developer-form-row"><SelectMenu ariaLabel="Select one of 25 Guild Standings" value={guildStandingId} options={GUILD_STANDINGS.map((standing) => ({ value: standing.id, label: `${standing.name} · ${standing.reputation.toLocaleString()} REP · ${standing.unlock}` }))} onChange={setGuildStandingId} /><Button variant="secondary" onClick={() => state.debugSetGuildReputation(GUILD_STANDINGS.find((standing) => standing.id === guildStandingId)?.reputation ?? 0)}>SET STANDING</Button></div>
      <div className="developer-button-grid"><Button variant={progress.guildUnlocked ? 'success' : 'secondary'} onClick={() => state.debugSetArcaneGuildUnlocked(!progress.guildUnlocked)}>{progress.guildUnlocked ? 'Lock Arcane Guild' : 'Unlock Arcane Guild'}</Button><Button variant="secondary" onClick={() => state.debugGrantGuildReputation(1000)}>+1,000 REP</Button><Button variant="secondary" onClick={() => state.debugGrantGuildPoint(10)}>+10 AP</Button><Button variant="secondary" onClick={() => state.debugGrantGuildPoint(100)}>+100 AP</Button></div>
      <DeveloperAdvancedSection title="Macro rank shortcuts"><div className="developer-button-grid">{[['Initiate I', 'initiate', 0], ['Apprentice I', 'apprentice', 6000], ['Adept I', 'adept', 20800], ['Arcanist I', 'magister', 48000], ['Grand Magister I', 'circle-master', 100000], ['Grand Magister V', 'circle-master', 208000]].map(([label, rank, reputation]) => <Button key={label} variant="ghost" onClick={() => { state.debugSetGuildRank(rank as import('../../game/types').GuildRankId); state.debugSetGuildReputation(Number(reputation)) }}>{label}</Button>)}</div></DeveloperAdvancedSection>
    </Card>
    <Card title="HUNTER’S ORDER · tester controls">
      <div className="developer-summary-grid"><Summary label="Hunter Standing" value={HUNTER_STANDINGS.find((standing) => standing.id === `${HUNTER_RANKS.find((rank) => rank.id === progress.huntersOrder.rankId)?.id}-${HUNTER_STANDINGS.filter((standing) => standing.rankId === progress.huntersOrder.rankId && standing.reputation <= progress.huntersOrder.reputation).length || 1}`)?.name ?? 'Tracker I'} /><Summary label="Reputation" value={progress.huntersOrder.reputation} /><Summary label="Hunter Marks" value={progress.huntersOrder.hunterMarks} /><Summary label="Contracts complete" value={progress.huntersOrder.totalContractsCompleted} /></div>
      <div className="developer-button-grid">
        <Button variant="secondary" onClick={() => state.debugSetHuntersOrderUnlocked(true)}>Unlock Hunter’s Order</Button>
        <Button variant="secondary" onClick={() => state.issueFirstHunterContract()}>Issue Starter Contract</Button>
        <Button variant="ghost" onClick={() => state.debugGrantHunterReputation(500)}>+500 Hunter Reputation</Button>
        <Button variant="ghost" onClick={() => state.debugGrantHunterMarks(10)}>+10 Hunter Marks</Button>
        <Button variant="secondary" onClick={() => state.debugCompleteActiveHunterContract()}>Complete Active Hunt</Button>
        <GameTooltip content="Remove every active Hunter target block and regenerate eligible contract choices."><Button variant="ghost" onClick={() => state.debugClearHunterTargetBlocks()}>Clear Target Blocks</Button></GameTooltip>
        {hunterSeeds.map((seed) => <GameTooltip key={seed} content={`Set Hunter RNG to ${seed}, then regenerate the board for repeatable contract selection.`}><Button variant="ghost" onClick={() => { state.debugSetHunterRngSeed(seed); state.debugRegenerateHunterContractBoard() }}>Seed ${seed} + Regenerate</Button></GameTooltip>)}
        {progress.huntersOrder.availableContracts.map((contract) => <Button key={contract.id} variant="ghost" onClick={() => state.acceptHunterContract(contract.id)}>Accept {getHunterContractTargetLabel(contract)}</Button>)}
      </div>
      <GameTooltip content="Sets Master Hunter standing and creates a prestigious Nightglass Alpha quarry Contract."><Button variant="primary" onClick={() => state.debugGrantNightglassContract()}>Grant Nightglass Contract</Button></GameTooltip>
      <DeveloperAdvancedSection title="Standing and board fixtures"><div className="developer-form-row"><SelectMenu ariaLabel="Set Hunter Standing fixture" value={hunterStanding} options={HUNTER_STANDINGS.map((standing) => ({ value: standing.id, label: `${standing.name} · ${standing.reputation.toLocaleString()} REP` }))} onChange={setHunterStanding}/><Button variant="secondary" onClick={() => state.debugSetHunterStanding(hunterStanding)}>SET STANDING</Button></div><div className="developer-button-grid">{HUNTER_RANKS.map((rank) => <Button key={rank.id} variant="ghost" onClick={() => state.debugSetHunterStanding(`${rank.id}-1`)}>Set {rank.name} I</Button>)}{([1, 2, 3] as const).map((slots) => <GameTooltip key={slots} content={`Generate a deterministic fixture with ${slots} Contract Board ${slots === 1 ? 'slot' : 'slots'}.`}><Button variant="secondary" onClick={() => state.debugRegenerateHunterContractBoard({ fixtureChoiceCount: slots })}>Generate {slots}-slot Board</Button></GameTooltip>)}{(['monster', 'family', 'alignment', 'region'] as const).map((archetype) => <GameTooltip key={archetype} content={`Generate eligible offers for the selected Hunter archetype.`}><Button variant="ghost" onClick={() => state.debugRegenerateHunterContractBoard({ archetype })}>Force {formatReadableId(archetype)}</Button></GameTooltip>)}{HUNTER_GROUNDS.map((ground) => <GameTooltip key={ground.id} content={`Generate a region Contract fixture scoped to ${ground.name}.`}><Button variant="ghost" onClick={() => state.debugRegenerateHunterContractBoard({ archetype: 'region', huntingGroundId: ground.id })}>Ground · {ground.name}</Button></GameTooltip>)}</div></DeveloperAdvancedSection>
    </Card>
    <Card title="Hunter upgrade tester"><div className="developer-summary-grid"><Summary label="Programs" value={`${Object.values(progress.huntersOrder.purchasedUpgrades).filter((rank) => rank > 0).length} / ${HUNTER_UPGRADES.length} owned`} /><Summary label="Hunter Marks" value={progress.huntersOrder.hunterMarks} /></div><div className="developer-form-row"><SelectMenu ariaLabel="Selected Hunter upgrade" value={hunterUpgradeId} options={HUNTER_UPGRADES.map((upgrade) => ({ value: upgrade.id, label: `${upgrade.name} · ${progress.huntersOrder.purchasedUpgrades[upgrade.id] ?? 0}/${upgrade.maxRank}` }))} onChange={(id) => { setHunterUpgradeId(id); setHunterUpgradeRank(String(progress.huntersOrder.purchasedUpgrades[id] ?? 0)) }}/><SelectMenu ariaLabel="Selected Hunter upgrade rank" value={hunterUpgradeRank} options={Array.from({ length: (HUNTER_UPGRADES.find((upgrade) => upgrade.id === hunterUpgradeId)?.maxRank ?? 0) + 1 }, (_, rank) => ({ value: String(rank), label: `Rank ${rank}` }))} onChange={setHunterUpgradeRank}/><Button variant="secondary" onClick={() => state.debugSetHunterUpgradeRank(hunterUpgradeId, Number(hunterUpgradeRank))}>SET RANK</Button></div><div className="developer-button-grid"><Button variant="secondary" onClick={() => state.debugGrantHunterMarks(999)}>GRANT 999 MARKS</Button><Button variant="primary" onClick={() => state.debugSetHunterUpgradeRank(hunterUpgradeId, HUNTER_UPGRADES.find((upgrade) => upgrade.id === hunterUpgradeId)?.maxRank ?? 0)}>MAX SELECTED</Button><Button variant="ghost" onClick={() => state.debugSetAllHunterUpgrades('max')}>MAX ALL UPGRADES</Button><Button variant="ghost" onClick={() => state.debugSetAllHunterUpgrades('reset')}>RESET ALL UPGRADES</Button></div></Card>
    <Card title="Guild Commission tester">
      <div className="developer-summary-grid"><Summary label="Active commission" value={progress.arcaneGuild.activeCommission ? formatGuildCommissionObjective(progress.arcaneGuild.activeCommission) : 'None'} /><Summary label="Board offers" value={progress.arcaneGuild.availableCommissions.length} /><Summary label="Free refreshes" value={progress.arcaneGuild.freeRefreshes} /><Summary label="Max authored AP / Board cost" value={`${advancementEconomy.maxBoundedPoints} / ${advancementEconomy.totalBoardPointCost}`} /><Summary label="AP earned / spent / available" value={`${progress.guildPointsEarned} / ${getGuildPointsSpent(state)} / ${getGuildPointsAvailable(state)}`} /></div>
      <div className="developer-button-grid">
        <SelectMenu ariaLabel="Guild Commission category fixture" value={guildCategory} options={(['supply', 'channeling', 'production', 'research', 'transmutation', 'mixed'] as const).map((category) => ({ value: category, label: formatReadableId(category) }))} onChange={(value) => setGuildCategory(value as typeof guildCategory)} />
        <SelectMenu ariaLabel="Guild Commission quality fixture" value={guildQuality} options={(['routine', 'special', 'prestigious'] as const).map((quality) => ({ value: quality, label: formatReadableId(quality) }))} onChange={(value) => setGuildQuality(value as typeof guildQuality)} />
        <Button variant="secondary" onClick={() => state.debugRegenerateGuildCommissionBoard({ category: guildCategory, quality: guildQuality })}>Generate selected fixture</Button>
        <GameTooltip content="Generate an ordinary board using the current authored unlocks and progression."><Button variant="ghost" onClick={() => state.debugRegenerateGuildCommissionBoard()}>Regenerate Board</Button></GameTooltip>
        <GameTooltip content="Spend one free refresh to generate a new Commission board."><Button variant="secondary" disabled={!progress.guildUnlocked || progress.arcaneGuild.freeRefreshes <= 0} onClick={() => state.refreshGuildCommissionChoices()}>Refresh Commission Board</Button></GameTooltip>
        <GameTooltip content={progress.arcaneGuild.activeCommission ? `Deliver available required items for: ${formatGuildCommissionObjective(progress.arcaneGuild.activeCommission)}.` : 'Accept a delivery Commission first.'}><Button variant="ghost" disabled={!progress.arcaneGuild.activeCommission} onClick={() => state.deliverGuildCommissionItems('max')}>Deliver Available Items</Button></GameTooltip>
        <Button variant="primary" disabled={!progress.arcaneGuild.activeCommission} onClick={() => state.debugCompleteActiveGuildCommission()}>Complete Active Commission</Button>
        <SelectMenu ariaLabel="Guild Commission template fixture" value={guildTemplateId} options={GUILD_COMMISSION_TEMPLATES.map((template) => ({ value: template.id, label: `${formatReadableId(template.category)} · ${formatReadableId(template.id)}` }))} onChange={setGuildTemplateId} />
        <Button variant="ghost" onClick={() => state.debugRegenerateGuildCommissionBoard({ templateId: guildTemplateId })}>Force selected template</Button>
        {progress.arcaneGuild.availableCommissions.slice(0, 6).map((commission) => <GameTooltip key={commission.id} content={`${formatReadableId(commission.quality)} Commission · ${formatGuildCommissionObjective(commission)}.`}><Button variant="ghost" onClick={() => state.acceptGuildCommission(commission.id)}>Accept {formatGuildCommissionObjective(commission)}</Button></GameTooltip>)}
      </div>
      <DeveloperAdvancedSection title="Repeatable board seeds"><div className="developer-button-grid">{guildSeeds.map((seed) => <Button key={seed} variant="ghost" onClick={() => { state.debugSetGuildCommissionRngSeed(seed); state.debugRegenerateGuildCommissionBoard() }}>Seed {seed} + Regenerate</Button>)}</div></DeveloperAdvancedSection>
    </Card>
    <Card title="Guild Registry test actions"><div className="developer-form-row"><SelectMenu ariaLabel="Guild Registry set fixture" value={guildSetId} options={ARCANE_REGISTRY_SETS.map((set) => ({ value: set.id, label: `${set.name} · ${progress.arcaneRegistry.completedSetIds.includes(set.id) ? 'Complete' : 'In progress'}` }))} onChange={setGuildSetId} /><Button variant="secondary" onClick={() => state.debugCompleteRegistrySet(guildSetId)}>Complete selected Set</Button><Button variant="ghost" onClick={() => state.debugResetRegistrySet(guildSetId)}>Reset selected Set</Button></div></Card>
    <Card title="Guild Studies, Projects & Advancement"><div className="developer-form-row"><SelectMenu ariaLabel="Guild Study fixture" value={guildStudyId} options={GUILD_COMMISSION_CHAINS.map((study) => ({ value: study.id, label: `${study.name} · ${progress.arcaneGuild.completedChainIds.includes(study.id) ? 'Complete' : 'Available'}` }))} onChange={setGuildStudyId} /><Button variant="secondary" onClick={() => state.debugCompleteGuildCommissionChain(guildStudyId)}>Complete Study</Button><Button variant="ghost" onClick={() => state.debugResetGuildStudy(guildStudyId)}>Reset Study</Button></div><div className="developer-form-row"><SelectMenu ariaLabel="Guild Facility Project fixture" value={guildProjectId} options={GUILD_PROJECTS.map((project) => ({ value: project.id, label: `${project.name} · ${progress.arcaneGuild.completedProjectIds.includes(project.id) ? 'Complete' : 'Available'}` }))} onChange={setGuildProjectId} /><Button variant="secondary" onClick={() => { state.debugCompleteGuildProjectPrerequisites(guildProjectId); state.debugCompleteGuildProject(guildProjectId) }}>Complete selected Project</Button><Button variant="ghost" onClick={() => state.debugGrantGuildProjectRequirements(guildProjectId)}>Grant materials</Button></div><div className="developer-form-row"><SelectMenu ariaLabel="Guild Advancement program fixture" value={guildProgramId} options={GUILD_SKILL_NODE_IDS.filter((id) => !GUILD_SKILL_NODES[id].legacy).map((id) => ({ value: id, label: GUILD_SKILL_NODES[id].name }))} onChange={setGuildProgramId} /><SelectMenu ariaLabel="Guild Advancement rank fixture" value={guildProgramRank} options={Array.from({ length: (GUILD_SKILL_NODES[guildProgramId]?.maxRank ?? 1) + 1 }, (_, rank) => ({ value: String(rank), label: `Rank ${rank}` }))} onChange={setGuildProgramRank} /><Button variant="secondary" onClick={() => state.debugSetGuildSkillNodeRank(guildProgramId, Number(guildProgramRank))}>Set rank</Button><Button variant="ghost" onClick={() => state.debugSetAllGuildSkillRanks('max')}>Max all</Button><Button variant="ghost" onClick={() => state.debugSetAllGuildSkillRanks('reset')}>Reset all</Button></div></Card>
  </div>
}
