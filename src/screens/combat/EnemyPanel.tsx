import type { CSSProperties } from 'react'
import { MONSTERS } from '../../game/data/monsters'
import { ITEMS } from '../../game/data/items'
import { useGameStore } from '../../store/gameStore'
import { selectPlayerBasicDamage } from '../../store/selectors'
import { Card, Progress, Status, Tooltip } from '../../components/ui'
import { formatNumber } from '../../game/utils'

export function EnemyPanel() {
  const combat = useGameStore((state) => state.combat)
  const basicDamage = useGameStore(selectPlayerBasicDamage)
  const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  const interval = 1200 * (combat.playerStatuses.some((status) => status.id === 'quickening') ? .75 : 1)
  const attackProgress = Math.max(0, Math.min(interval, interval - combat.playerAttackTimerMs))
  return <Card title={enemy ? enemy.name : 'No current enemy'} action={<Status tone={enemy ? enemy.boss ? 'warning' : 'active' : 'neutral'}>{enemy ? enemy.boss ? 'Boss Fight' : 'Normal Monster' : combat.active ? 'Encounter Delay' : 'Idle'}</Status>}>
    <div className={`enemy-portrait ${enemy?.boss ? 'boss' : ''}`} style={{ '--enemy-color': enemy?.color ?? '#8c83b5' } as CSSProperties}><div className="enemy-aura" /><span>{enemy?.boss ? '♛' : enemy ? '◈' : '∅'}</span></div>
    {enemy ? <><h2 className="enemy-name">{enemy.name}</h2><p className="muted center">{enemy.subtitle}</p><Progress value={combat.enemyHp / combat.enemyMaxHp * 100} tone={enemy.boss ? 'red' : 'violet'} label="Enemy Health" right={`${formatNumber(combat.enemyHp)} / ${formatNumber(combat.enemyMaxHp)}`} /><div className="trait-row">{enemy.traits.map((trait) => <Tooltip key={trait.name} text={trait.description}><span className="trait">{trait.name}</span></Tooltip>)}</div>{combat.enemyBarrier > 0 && <div className="barrier-readout">Barrier {formatNumber(combat.enemyBarrier)}</div>}<div className="enemy-loot-preview"><span>LOOT PREVIEW</span>{enemy.loot.map((drop) => <small key={drop.itemId}>{ITEMS[drop.itemId].name}<strong>{drop.chance === 1 ? 'Guaranteed' : `${Math.round(drop.chance * 100)}%`} · {drop.min}–{drop.max}</strong></small>)}</div></> : <div className="empty-state">{combat.active ? 'Next encounter loading.' : 'Enter the woods to begin.'}</div>}
    <div className="combat-statline"><span>Basic Attack <strong>{(attackProgress / 1000).toFixed(1)} / {(interval / 1000).toFixed(1)} sec</strong></span><span>Damage <strong>{basicDamage}</strong></span></div>
  </Card>
}
