import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronRight, LockKeyhole, ScrollText, Sparkles } from 'lucide-react'
import { Button, Card, GameTooltip, Progress, Status } from '../../components/ui'
import { GUILD_COMMISSION_CHAINS } from '../../game/content/guild/guildCommissionChains'
import { GUILD_STANDINGS } from '../../game/content/guild/guildStandings'
import { ITEMS } from '../../game/content/items/items'
import { getDefaultGuildStudyChapter, getGuildStudyChapters, type GuildStudyChapterId } from '../../game/presentation/guild/guildStudyPresentation'
import { getGuildProgressionBonuses } from '../../game/systems/guild/guildSelectors'
import { isGuildStandingAtLeast } from '../../game/content/guild/guildStandings'
import { useGameStore } from '../../store/gameStore'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'

const stageLabel = (entry: (typeof GUILD_COMMISSION_CHAINS)[number]['stages'][number]) => entry.category === 'delivery'
  ? `Deliver ${entry.target} ${ITEMS[entry.itemId].name}`
  : entry.category === 'production' ? `Produce ${entry.target} ${ITEMS[entry.itemId].name}` : `${entry.category === 'research' ? 'Complete Research' : 'Perform Transmutation'} · ${entry.target}`

export function GuildStudiesTab() {
  const state = useGameStore()
  const preferences = useUiPreferences().screenState.guild
  const guild = state.progress.arcaneGuild
  const chapters = useMemo(() => getGuildStudyChapters(state), [state.progress.guildReputation, guild.completedChainIds, guild.activeCommissionChain])
  const active = guild.activeCommissionChain
  const activeStudy = GUILD_COMMISSION_CHAINS.find(({ id }) => id === active?.id)
  const [expandedId, setExpandedId] = useState<GuildStudyChapterId>(() => activeStudy ? chapters.find(({ studies }) => studies.some(({ id }) => id === activeStudy.id))?.id ?? getDefaultGuildStudyChapter(state, chapters) : getDefaultGuildStudyChapter(state, chapters))
  const persistedStudy = GUILD_COMMISSION_CHAINS.find(({ id }) => id === preferences.selectedStudyId)
  const [selectedId, setSelectedId] = useState(() => activeStudy?.id ?? (persistedStudy && persistedStudy.minimumRank === expandedId ? persistedStudy.id : chapters.find(({ id }) => id === expandedId)?.studies[0]?.id ?? GUILD_COMMISSION_CHAINS[0].id))
  const selected = GUILD_COMMISSION_CHAINS.find(({ id }) => id === selectedId) ?? GUILD_COMMISSION_CHAINS[0]
  const selectedChapter = chapters.find(({ studies }) => studies.some(({ id }) => id === selected.id)) ?? chapters[0]
  const selectedStanding = GUILD_STANDINGS.find(({ id }) => id === selected.minimumStandingId)
  const currentStudy = active?.id === selected.id ? active : null
  const currentStage = currentStudy ? selected.stages[currentStudy.stageIndex] : null
  const unlocked = isGuildStandingAtLeast(state.progress.guildReputation, selected.minimumStandingId)
  const repeatReward = Math.round(selected.repeatReputationReward * getGuildProgressionBonuses(state).repeatStudyReputationMultiplier)
  const clearCount = GUILD_COMMISSION_CHAINS.filter(({ id }) => guild.completedChainIds.includes(id)).length
  const offers = guild.availableCommissions.length

  const selectStudy = (id: string) => {
    setSelectedId(id)
    setUiPreferences({ screenState: { guild: { selectedStudyId: id } } })
  }
  const chooseChapter = (id: GuildStudyChapterId) => {
    setExpandedId(id)
    setUiPreferences({ screenState: { guild: { studyChapterId: id } } })
    const chapter = chapters.find((entry) => entry.id === id)
    if (chapter?.studies.length) selectStudy(chapter.studies[0].id)
  }

  return <section className="guild-study-workspace" aria-label="Guild Study Archive">
    <Card className="guild-study-catalog">
      <div className="guild-v3-panel-heading"><div><span className="guild-v3-kicker">REPEATABLE FACULTY RESEARCH</span><h2>Study Archive</h2><p>{clearCount} / {GUILD_COMMISSION_CHAINS.length} first clears · one Study can run beside a Commission.</p></div><ScrollText size={17} /></div>
      <div className="guild-study-chapters">{chapters.map((chapter) => {
        const expanded = expandedId === chapter.id
        const activeInChapter = chapter.containsActiveStudy
        const controlId = `guild-study-chapter-${chapter.id}`
        const chapterStudyIds = new Set(chapter.studies.map(({ id }) => id))
        return <section className={`guild-study-chapter${expanded ? ' expanded' : ''}${!chapter.unlocked ? ' locked' : ''}`} key={chapter.id}>
          <Button variant="ghost" className="guild-study-chapter-toggle" aria-expanded={expanded} aria-controls={controlId} onClick={() => chooseChapter(chapter.id)}>
            <span className="guild-study-chapter-chevron">{expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>
            {!chapter.unlocked ? <LockKeyhole size={14} /> : <span className="guild-study-chapter-number">{chapter.number}</span>}
            <span className="guild-study-chapter-title"><strong>CHAPTER {chapter.number} · {chapter.title}</strong><small>{chapter.requiredStandingName} · {chapter.total} studies · {chapter.completed}/{chapter.total} cleared · {chapter.completionPercent}%</small></span>
            {activeInChapter && <Status tone="active">ACTIVE</Status>}
            {expanded && <span className="guild-study-chapter-open">OPEN</span>}
          </Button>
          <div id={controlId} className="guild-study-chapter-content" hidden={!expanded}>
          {expanded && <>
            {chapter.studies.map((study) => {
              const running = active?.id === study.id
              const complete = guild.completedChainIds.includes(study.id)
              const canStart = chapter.unlocked && !active
              const label = running ? 'ACTIVE' : complete ? 'COMPLETE' : !chapter.unlocked ? 'LOCKED' : 'AVAILABLE'
              const details = `${study.stages.length} stages · ${complete ? `Repeatable · +${study.repeatReputationReward} REP` : `+${study.advancementPointsReward} AP first clear · +${study.reputationReward} REP`}`
              return <GameTooltip key={study.id} block content={`${study.name} · Requires ${chapter.requiredStandingName} · ${details}`}><Button variant={selected.id === study.id ? 'primary' : 'ghost'} ariaPressed={selected.id === study.id} className={`guild-study-choice${running ? ' active' : ''}${complete ? ' complete' : ''}${!chapter.unlocked ? ' locked' : ''}`} onClick={() => selectStudy(study.id)}><span className="guild-study-choice-state">{running ? <Sparkles size={14} /> : complete ? <Check size={14} /> : !chapter.unlocked ? <LockKeyhole size={14} /> : <ScrollText size={14} />}</span><span className="guild-study-choice-copy"><strong>{study.name}</strong><small>{details}</small></span><b>{label}</b>{canStart && <span className="guild-study-row-ready" aria-hidden="true" />}</Button></GameTooltip>
            })}
            {!chapter.studies.length && <p className="guild-study-empty">No Studies are authored for this chapter.</p>}
            {activeStudy && selected.id !== activeStudy.id && chapterStudyIds.has(activeStudy.id) && <div className="guild-study-active-note"><Sparkles size={14} /><span>Current work remains available while you browse other records.</span><Button variant="ghost" onClick={() => selectStudy(activeStudy.id)}>Return to active Study</Button></div>}
          </>}
          </div>
        </section>
      })}</div>
    </Card>

    <Card className="guild-study-inspector">
      <div className="guild-v3-panel-heading"><div><span className="guild-v3-kicker">CHAPTER {selectedChapter.number} · {selectedStanding?.name ?? selected.minimumStandingId}</span><h2>{selected.name}</h2></div><Status tone={currentStudy ? 'active' : guild.completedChainIds.includes(selected.id) ? 'success' : unlocked ? 'neutral' : 'locked'}>{currentStudy ? 'In Progress' : guild.completedChainIds.includes(selected.id) ? 'Repeatable' : unlocked ? 'Available' : 'Locked'}</Status></div>
      <p className="guild-study-description">{selected.description}</p>
      <div className="guild-study-reward-rail"><div><span>FIRST CLEAR</span><strong>+{selected.reputationReward} REP · +{selected.advancementPointsReward} AP</strong></div><div><span>REPEAT</span><strong>+{repeatReward} REP</strong></div></div>
      {currentStudy && currentStage ? <div className="guild-study-active-stage"><div className="guild-study-current-copy"><span>CURRENT STAGE · {currentStudy.stageIndex + 1} / {selected.stages.length}</span><strong>{stageLabel(currentStage)}</strong><b>{currentStudy.stageProgress} / {currentStage.target}{'itemId' in currentStage ? ` · ${ITEMS[currentStage.itemId].name}` : ''}</b></div><Progress value={currentStudy.stageProgress / currentStage.target * 100} tone="gold" />{currentStage.category === 'delivery' && <GameTooltip content={`Contribute ${ITEMS[currentStage.itemId].name} to this Study stage. Protected items are excluded.`}><Button variant="primary" disabled={(state.inventory[currentStage.itemId] ?? 0) < 1} onClick={() => state.contributeGuildCommissionChainDelivery('max')}>Deliver max · {state.inventory[currentStage.itemId] ?? 0}</Button></GameTooltip>}</div> : <GameTooltip content={!unlocked ? `Reach ${selectedStanding?.name ?? 'the required'} Guild Standing to unlock this Study.` : active ? 'Complete the current Study before starting another.' : 'A Study can run alongside your active regular Commission.'}><Button className="guild-study-start" variant="primary" disabled={!unlocked || Boolean(active)} onClick={() => state.startGuildCommissionChain(selected.id)}>{!unlocked ? `Requires ${selectedStanding?.name ?? 'Standing'}` : active ? 'Another Study is active' : 'Start Study'}</Button></GameTooltip>}
      {activeStudy && activeStudy.id !== selected.id && <Button variant="ghost" className="guild-study-return" onClick={() => { const chapter = chapters.find(({ studies }) => studies.some(({ id }) => id === activeStudy.id)); if (chapter) setExpandedId(chapter.id); selectStudy(activeStudy.id) }}>Return to active Study · {activeStudy.name}</Button>}
      <div className="guild-study-stage-heading"><span className="guild-v3-kicker">STUDY STAGES</span><small>{selected.stages.length} steps</small></div>
      <ol className="guild-study-stage-list">{selected.stages.map((entry, index) => { const complete = Boolean(currentStudy && index < currentStudy.stageIndex) || (!currentStudy && guild.completedChainIds.includes(selected.id)); const current = currentStudy?.stageIndex === index; return <li key={`${selected.id}:${index}`} className={`${complete ? 'complete' : ''}${current ? ' current' : ''}`}><span className="guild-study-stage-index">{complete ? <Check size={13} /> : index + 1}</span><div><small>STEP {index + 1} · {entry.category.toUpperCase()}</small><strong>{stageLabel(entry)}</strong></div>{current && <Status tone="active">Current</Status>}</li>})}</ol>
    </Card>
  </section>
}
