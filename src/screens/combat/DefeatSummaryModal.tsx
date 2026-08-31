import { ShieldAlert } from 'lucide-react'
import { ModalPortal, Button } from '../../components/ui'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { MONSTERS, isBossMonster } from '../../game/content/monsters'
import { formatCompactDuration, formatNumber } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { clearCombatDefeat, useCombatDefeatStore } from '../../game/ui/combatDefeatStore'
import { CombatLogRow } from './CombatLogRow'

export function DefeatSummaryModal() {
  const snapshot = useCombatDefeatStore((state) => state.snapshot)
  const leaveDungeon = useGameStore((state) => state.leaveDungeon)
  if (!snapshot) return null
  const dungeon = snapshot.dungeonId ? DUNGEONS[snapshot.dungeonId] : undefined
  const enemy = snapshot.enemyId ? MONSTERS[snapshot.enemyId] : undefined
  const returnToTower = () => { leaveDungeon(); clearCombatDefeat() }
  const newestTimestampMs = snapshot.events.reduce((latest, entry) => Math.max(latest, entry.timestampMs), snapshot.defeatedAtMs)
  return <ModalPortal open onClose={returnToTower} onEscape={returnToTower} onBackdropClick={() => undefined} backdropClassName="combat-defeat-backdrop" surfaceClassName="combat-defeat-modal" ariaLabelledBy="combat-defeat-title">
    <header className="combat-defeat-head"><div><span className="combat-subsection-label">COMBAT FAILURE</span><h2 id="combat-defeat-title">DEFEAT SUMMARY</h2></div><ShieldAlert size={26} aria-hidden="true" /></header>
    <div className="combat-defeat-title-block"><strong>{enemy?.name?.toUpperCase() ?? 'YOUR WIZARD'} DEFEATED</strong><p>Your Wizard fell in {dungeon?.name ?? 'the Dungeon'}{enemy ? ` while fighting ${enemy.name}.` : '.'}</p>{enemy && isBossMonster(enemy) && <span className="combat-defeat-boss">BOSS ENCOUNTER</span>}</div>
    <div className="combat-defeat-metrics"><Metric label="ENCOUNTER" value={formatCompactDuration(snapshot.encounterDurationMs ?? 0)} /><Metric label="DAMAGE DONE" value={formatNumber(snapshot.damageDone ?? 0)} /><Metric label="DAMAGE TAKEN" value={formatNumber(snapshot.damageTaken ?? 0)} /><Metric label="HEALING" value={formatNumber(snapshot.healing ?? 0)} /></div>
    <section className="combat-defeat-events"><div className="combat-subsection-label">WHAT HAPPENED</div><div className="combat-defeat-event-list">{snapshot.events.map((entry, index) => <CombatLogRow key={`${entry.sequence}-${index}`} entry={entry} newestTimestampMs={newestTimestampMs} latest={index === snapshot.events.length - 1} />)}</div></section>
    <footer className="combat-defeat-foot"><span>Threat progress reset to 0.</span><Button variant="primary" onClick={returnToTower}>RETURN TO TOWER</Button></footer>
  </ModalPortal>
}

function Metric({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div> }
