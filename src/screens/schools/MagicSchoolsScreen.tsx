import { Lock, Check } from 'lucide-react'
import { FRAGMENT_ORDER, SCHOOLS } from '../../game/data/schools'
import { isTutorialCompleted } from '../../game/content/dungeons/dungeons'
import { getSchoolProgressInfo } from '../../game/systems/schools'
import { formatSpellRank, getSpellAutoCastFocusCost, getSpellRank, getSpellsForSchool } from '../../game/systems/spells'
import { useGameStore } from '../../store/gameStore'
import { formatNumber, formatTime } from '../../game/utils'
import { Button, Card, GameTooltip, Progress, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'

export function MagicSchoolsScreenV2() {
  const game = useGameStore()
  const { schools, progress } = game
  const cap = progress.magicLevelCap
  const tutorialComplete = isTutorialCompleted(progress)
  const schoolCards = FRAGMENT_ORDER.map((id) => {
    const school = SCHOOLS[id]
    const state = schools[id]
    const info = getSchoolProgressInfo(game, id)
    const spells = getSpellsForSchool(id)
    const nextSpell = spells.find((spell) => getSpellRank({ progress }, spell.id) === null)
    return {
      id: `school-${id}`,
      content: <Card className="school-card" style={{ borderTopColor: school.color } as React.CSSProperties}>
        <div className="school-card-head"><div className="school-glyph" style={{ color: school.color }}>{school.glyph}</div><div><h2>{school.name}</h2><p>{school.tagline}</p></div><span className="school-level">{info.level}<small>LV</small></span></div>
        <Progress value={info.progress * 100} tone={id} label="School XP" right={<>{formatNumber(info.xp)} XP</>} />
        <div className="school-cap"><span>Level cap</span><strong>{info.atCap ? 'Level Cap Reached' : cap}</strong></div>
        <div className="school-spells">
          {spells.map((spell) => {
            const rank = getSpellRank({ progress }, spell.id)
            const focusCost = getSpellAutoCastFocusCost({ progress }, spell.id)
            const learned = rank !== null
            const tooltip = <TooltipContent title={`${spell.name} · ${learned ? formatSpellRank(rank) : 'Locked'}`} description={spell.description}><div className="tooltip-section"><small>REQUIREMENTS</small><p>{school.name} School Level {spell.unlockLevel}</p></div>{learned && <div className="tooltip-section"><small>CASTING</small><p>{spell.manaCost} Mana · {formatTime(spell.cooldownMs)} Cooldown · Auto-Cast {focusCost} Focus</p></div>}</TooltipContent>
            return <GameTooltip key={spell.id} block accent={learned ? 'elemental' : 'warning'} content={tooltip}>
              <div className={`spell-unlock ${learned ? 'unlocked' : ''}`}>
                <span className="spell-icon">✦</span>
                <div><strong>{spell.name} <small>Lv {spell.unlockLevel}</small></strong><span className="spell-rank-label">{learned ? formatSpellRank(rank) : 'LOCKED'}</span><small>{learned ? `${spell.manaCost} Mana · ${formatTime(spell.cooldownMs)} Cooldown · Auto-Cast ${focusCost} Focus` : `Unlock at ${school.name} School Level ${spell.unlockLevel}`}</small><p>{spell.description}</p></div>
                {learned ? <Check size={17} aria-label="Learned" /> : <Lock size={15} aria-label="Locked" />}
              </div>
            </GameTooltip>
          })}
        </div>
        <div className="next-unlock">Next unlock <strong>{nextSpell ? `${nextSpell.name} · Level ${nextSpell.unlockLevel}` : 'Current chapter spell roster complete'}</strong></div>
      </Card>
    }
  })
  return <div className="screen-content"><div className="screen-header"><div><div className="eyebrow">MAGIC SCHOOL ARCHIVE</div><h1>Four paths, one Focus pool.</h1><p>Research any elemental fragment into any school. Matching affinity is stronger, but the target school is always your choice.</p></div><Button variant="secondary" tooltip={<TooltipContent title="Open Research" description="Direct elemental fragments into a Magic School to gain School XP." />} onClick={() => game.setScreen('tower-research')}>Open Crucible</Button></div><EditableGrid screen="schools" panels={[...schoolCards,
    { id: 'school-ceiling', content: <Card title="Level ceiling" className="ceiling-card"><div className="ceiling-line"><span className="ceiling-number">{cap}</span><div><strong>Magic School level cap</strong><p className="muted">{tutorialComplete ? 'The tutorial ceiling has been broken. Future progression milestones will unlock higher brackets.' : "Defeat Archmage Edrin's Shade in the Abandoned Catacombs to unlock Levels 21–40."}</p></div><div className="ceiling-arrow"><Status tone={tutorialComplete ? 'success' : 'active'}>{tutorialComplete ? 'TUTORIAL COMPLETE' : 'EDRIN → 40'}</Status></div></div></Card> },
    { id: 'school-ranks', content: <Card title="Spell Ranks" className="ceiling-card"><p className="muted">Current tutorial spells are Rank I. Higher Rank advancement will become a Tower progression system later.</p></Card> },
  ]} /></div>
}
