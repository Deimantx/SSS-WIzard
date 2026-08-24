import type { CSSProperties } from 'react'
import { Pause, Swords } from 'lucide-react'
import { BALANCE } from '../../game/data/balance'
import { MONSTERS } from '../../game/data/monsters'
import { SCHOOLS } from '../../game/data/schools'
import { SPELLS } from '../../game/data/spells'
import { useGameStore } from '../../store/gameStore'
import type { SpellId } from '../../game/types'
import { formatNumber, formatTime } from '../../game/utils'
import { Button, Card, Progress, Status, Tooltip } from '../../components/ui'
import { selectAutoHuntUnlocked, selectPlayerBasicDamage } from '../../store/selectors'

export function CombatScreenV2() {
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const activities = useGameStore((state) => state.activities)
  const enterDungeon = useGameStore((state) => state.enterDungeon)
  const leaveDungeon = useGameStore((state) => state.leaveDungeon)
  const engageBoss = useGameStore((state) => state.engageBoss)
  const toggleAutoHunt = useGameStore((state) => state.toggleAutoHunt)
  const castSpell = useGameStore((state) => state.castSpell)
  const toggleAutoCast = useGameStore((state) => state.toggleAutoCast)
  const basicDamage = useGameStore(selectPlayerBasicDamage)
  const autoHuntUnlocked = useGameStore(selectAutoHuntUnlocked)
  const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  const interval = BALANCE.player.basicAttackIntervalMs * (combat.playerStatuses.some((status) => status.id === 'quickening') ? 0.75 : 1)
  const attackProgress = Math.max(0, Math.min(interval, interval - combat.playerAttackTimerMs))
  const action = enemy ? (combat.enemyTelegraphActionId ? enemy.specialAttacks[combat.enemyTelegraphActionId] : enemy.actionSequence[combat.enemyActionIndex % enemy.actionSequence.length]) : null

  return <div className="screen-content">
    <div className="screen-header"><div><div className="eyebrow">REGION 01 · WHISPERING WOODS</div><h1>The clearing watches back.</h1><p>Read the enemy sequence, react to telegraphs, then decide which spells deserve Focus.</p></div>{combat.active ? <Button variant="danger" onClick={leaveDungeon}><Pause size={15} /> Leave Dungeon</Button> : <Button onClick={enterDungeon}><Swords size={16} /> Enter Whispering Woods</Button>}</div>
    <div className="combat-layout">
      <Card title="Whispering Woods" action={<Status tone={combat.active ? 'active' : 'neutral'}>{combat.active ? 'Combat Active' : 'At the Tower'}</Status>}>
        <div className="forest-scene"><div className="moon" /><div className="tree tree-a" /><div className="tree tree-b" /><div className="tree tree-c" /><div className="forest-rune">✦</div></div>
        <div className="dungeon-stat-row"><div className="metric"><span>Threat Cleared</span><strong>{combat.threatCleared} / {BALANCE.dungeon.whisperingWoodsThreatRequired}</strong></div><div className="metric"><span>Lifetime kills</span><strong>{formatNumber(progress.lifetimeKills)}</strong></div><div className="metric"><span>Encounter</span><strong>{enemy ? 'Engaged' : combat.active ? formatTime(combat.encounterTimerMs) : '—'}</strong></div></div>
        <div className="auto-hunt-row"><div><strong>Auto Hunt Boss</strong><small>{autoHuntUnlocked ? `Finish the current normal encounter, then engage Grove Sentinel at ${BALANCE.dungeon.whisperingWoodsThreatRequired} Threat.` : 'Locked until the first Grove Sentinel kill.'}</small></div><Button disabled={!autoHuntUnlocked} variant={progress.autoHuntBossByDungeon['whispering-woods'] ? 'success' : 'secondary'} onClick={toggleAutoHunt}>{autoHuntUnlocked ? progress.autoHuntBossByDungeon['whispering-woods'] ? 'ON' : 'OFF' : 'LOCKED'}</Button></div>
        {combat.threatCleared >= BALANCE.dungeon.whisperingWoodsThreatRequired && combat.active && !combat.inBossFight && !progress.autoHuntBossByDungeon['whispering-woods'] && <div className="boss-ready"><div><Status tone="success">Boss Ready</Status><strong>Grove Sentinel can be challenged.</strong><span>Threat may continue above the requirement while Auto Hunt is OFF.</span></div><Button variant="success" onClick={() => engageBoss('grove-sentinel')}>Engage Sentinel</Button></div>}
        {progress.forestHeartUnlocked && combat.active && !combat.inBossFight && <div className="boss-ready heart"><div><Status tone="warning">Main Boss Unlocked</Status><strong>Forest Heart waits beneath the grove.</strong><span>First kill raises the cap and grants permanent Focus.</span></div><Button variant="danger" onClick={() => engageBoss('forest-heart')}>Engage Forest Heart</Button></div>}
      </Card>
      <Card title={enemy ? enemy.name : 'No current enemy'} action={<Status tone={enemy ? (enemy.boss ? 'warning' : 'active') : 'neutral'}>{enemy ? (enemy.boss ? 'Boss Fight' : 'Normal Monster') : combat.active ? 'Encounter Delay' : 'Idle'}</Status>}>
        <div className={`enemy-portrait ${enemy?.boss ? 'boss' : ''}`} style={{ '--enemy-color': enemy?.color ?? '#8c83b5' } as CSSProperties}><div className="enemy-aura" /><span>{enemy?.boss ? '♛' : enemy ? '◈' : '∅'}</span></div>
        {enemy ? <><h2 className="enemy-name">{enemy.name}</h2><p className="muted center">{enemy.subtitle}</p><Progress value={combat.enemyHp / combat.enemyMaxHp * 100} tone={enemy.boss ? 'red' : 'violet'} label="Enemy Health" right={`${formatNumber(combat.enemyHp)} / ${formatNumber(combat.enemyMaxHp)}`} /><div className="trait-row">{enemy.traits.map((trait) => <Tooltip key={trait.name} text={trait.description}><span className="trait">{trait.name}</span></Tooltip>)}</div>{combat.enemyBarrier > 0 && <div className="barrier-readout">Barrier {formatNumber(combat.enemyBarrier)}</div>}</> : <div className="empty-state">{combat.active ? `Next encounter in ${formatTime(combat.encounterTimerMs)}` : 'Enter the woods to begin.'}</div>}
        <div className="combat-statline"><span>Basic Attack <strong>{(attackProgress / 1000).toFixed(1)} / {(interval / 1000).toFixed(1)} sec</strong></span><span>Damage <strong>{basicDamage}</strong></span></div>
      </Card>
    </div>
    <Card title="Enemy Sequence · current action is visible before it resolves" className="timeline-card"><div className="timeline-row">{enemy ? enemy.actionSequence.map((step, index) => <div className={`timeline-step ${index < combat.enemyActionIndex ? 'complete' : index === combat.enemyActionIndex ? 'current' : ''}`} key={step.id}><span>{index < combat.enemyActionIndex ? '✓' : step.kind === 'special' ? '→' : '•'}</span><small>{step.name}</small></div>) : <div className="muted">No enemy sequence loaded.</div>}</div><div className={`telegraph ${combat.enemyTelegraphMs > 0 ? 'active' : ''}`}><div><strong>{combat.enemyTelegraphMs > 0 ? action?.name : 'Next action'}</strong><span>{combat.enemyTelegraphMs > 0 ? `${formatTime(combat.enemyTelegraphMs)} telegraph remaining` : 'The timeline advances on the enemy clock.'}</span></div>{combat.enemyTelegraphActionId && enemy?.specialAttacks[combat.enemyTelegraphActionId] && <span>{enemy.specialAttacks[combat.enemyTelegraphActionId].description}</span>}</div></Card>
    <div className="combat-bottom"><Card title="Spell Bar" className="spell-card"><div className="spell-list">{(Object.keys(SPELLS) as SpellId[]).map((id) => { const spell = SPELLS[id]; const unlocked = progress.unlockedSpells.includes(id); const auto = activities.autoCast[id]; const summary = spell.effect.type === 'damage' ? `${spell.effect.amount} damage` : spell.effect.type === 'heal' ? `${spell.effect.amount} heal` : spell.effect.type === 'barrier' ? `${spell.effect.amount} barrier` : spell.effect.type === 'dot' ? 'Burning · 5 sec' : 'Quickening · 6 sec'; return <div className={`spell-row ${unlocked ? '' : 'locked'}`} key={id}><div className="spell-mini" style={{ color: SCHOOLS[spell.school].color }}>{SCHOOLS[spell.school].glyph}</div><div className="spell-copy"><strong>{spell.name}</strong><small>{unlocked ? `${spell.manaCost} Mana · ${summary} · ${spell.autoCastFocus} Focus` : `Unlock ${SCHOOLS[spell.school].name} Level ${spell.unlockLevel}`}</small></div><Button variant={auto ? 'success' : 'ghost'} disabled={!unlocked || !combat.active} onClick={() => toggleAutoCast(id)}>{auto ? 'Auto ON' : 'Auto-Cast'}</Button><Button disabled={!unlocked || !combat.active || combat.spellCooldowns[id] > 0} onClick={() => castSpell(id)}>{combat.spellCooldowns[id] > 0 ? formatTime(combat.spellCooldowns[id]) : 'Cast'}</Button></div> })}</div></Card><Card title="Combat Log" className="log-card"><div className="combat-log">{combat.log.length ? combat.log.map((line, index) => <div key={`${line}-${index}`} className={index === 0 ? 'latest' : ''}><span>{String(combat.log.length - index).padStart(2, '0')}</span>{line}</div>) : <div className="empty-state">Combat events will appear here.</div>}</div></Card></div>
  </div>
}
