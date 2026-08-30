import { Clock3, X, Sparkles } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { ITEMS } from '../../game/content/items/items'
import { isBossMonster, MONSTERS } from '../../game/content/monsters'
import { getTraitDefinitions } from '../../game/content/traits'
import { buildCombatActionPresentation } from '../../game/presentation/combat'
import type { DungeonId, MonsterId } from '../../game/types'
import { formatNumber, formatTime } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { Button, GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon, ItemTooltip } from '../../components/ui/item'
import { MonsterPortrait } from './MonsterPortrait'

export type EnemyContextMode = 'intel' | 'loot'

interface EnemyContextWindowProps {
  mode: EnemyContextMode
  anchorRef: RefObject<HTMLElement | null>
  triggerRef: RefObject<HTMLElement | null>
  selectedDungeonId: DungeonId
  onModeChange: (mode: EnemyContextMode) => void
  onClose: () => void
}

export function EnemyContextWindow({ mode, anchorRef, triggerRef, selectedDungeonId, onModeChange, onClose }: EnemyContextWindowProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 16, left: 16 })
  const active = useGameStore((state) => state.combat.active)
  const enemyId = useGameStore((state) => state.combat.enemyId)

  useLayoutEffect(() => {
    const updatePosition = () => {
      const anchor = anchorRef.current
      const surface = surfaceRef.current
      if (!anchor || !surface) return
      const margin = 16
      const gap = 12
      const anchorRect = anchor.getBoundingClientRect()
      const surfaceRect = surface.getBoundingClientRect()
      const width = Math.min(440, Math.max(280, window.innerWidth - margin * 2))
      const right = anchorRect.right + gap
      const left = right + width <= window.innerWidth - margin
        ? right
        : anchorRect.left - width - gap >= margin
          ? anchorRect.left - width - gap
          : Math.max(margin, (window.innerWidth - width) / 2)
      const top = Math.max(margin, Math.min(window.innerHeight - surfaceRect.height - margin, anchorRect.top))
      setPosition({ top, left })
    }
    const frame = requestAnimationFrame(updatePosition)
    addEventListener('resize', updatePosition)
    addEventListener('scroll', updatePosition, true)
    return () => { cancelAnimationFrame(frame); removeEventListener('resize', updatePosition); removeEventListener('scroll', updatePosition, true) }
  }, [anchorRef, mode, selectedDungeonId])

  useEffect(() => {
    if (!active || !enemyId || !MONSTERS[enemyId]) { onClose(); return }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (surfaceRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      if (target instanceof Element && target.closest('.game-tooltip')) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose() } }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('pointerdown', onPointerDown); document.removeEventListener('keydown', onKeyDown) }
  }, [active, anchorRef, enemyId, onClose])

  useEffect(() => {
    const trigger = triggerRef.current
    trigger?.focus()
    return () => trigger?.focus()
  }, [triggerRef])

  if (typeof document === 'undefined' || !active || !enemyId || !MONSTERS[enemyId]) return null
  return createPortal(<div ref={surfaceRef} className="enemy-context-window" role="dialog" aria-modal="false" aria-label={mode === 'intel' ? 'Enemy Intel' : 'Enemy Loot'} style={{ top: position.top, left: position.left }}>
    <header className="enemy-context-header">
      <div><span className="combat-subsection-label">CURRENT ENCOUNTER</span><strong>{mode === 'intel' ? 'ENEMY INTEL' : 'LOOT'}</strong></div>
      <div className="enemy-context-header-actions"><div className="enemy-context-tabs" role="tablist" aria-label="Enemy context"><button type="button" role="tab" aria-selected={mode === 'intel'} className={mode === 'intel' ? 'is-active' : ''} onClick={() => onModeChange('intel')}>INTEL</button><button type="button" role="tab" aria-selected={mode === 'loot'} className={mode === 'loot' ? 'is-active' : ''} onClick={() => onModeChange('loot')}>LOOT</button></div><Button icon variant="ghost" ariaLabel="Close enemy context" onClick={onClose}><X size={15} /></Button></div>
    </header>
    <div className="enemy-context-body">{mode === 'intel' ? <EnemyIntelContent selectedDungeonId={selectedDungeonId} /> : <EnemyLootContent selectedDungeonId={selectedDungeonId} />}</div>
  </div>, document.body)
}

export function EnemyIntelContent({ selectedDungeonId }: { selectedDungeonId: DungeonId }) {
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const dungeon = DUNGEONS[combat.dungeonId ?? selectedDungeonId]
  const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  return enemy ? <div className="enemy-intel-content"><div className="enemy-context-identity"><MonsterPortrait monster={enemy} boss={isBossMonster(enemy)} /><div><span className="combat-subsection-label">{isBossMonster(enemy) ? 'BOSS DOSSIER' : 'CURRENT ENEMY'}</span><h3>{enemy.name}</h3><p>{enemy.subtitle}</p><small>Defeated {formatNumber(isBossMonster(enemy) ? progress.bossKillsByBoss[enemy.id] ?? 0 : progress.lifetimeKillsByMonster[enemy.id] ?? 0)} times</small></div></div><IntelTraits monsterId={enemy.id} /><ResistanceIntel monsterId={enemy.id} /><ActionIntel monsterId={enemy.id} /></div> : <div className="enemy-context-empty"><span className="combat-subsection-label">NO ACTIVE ENEMY</span><strong>No active enemy.</strong><p>{combat.active ? 'The next encounter is being selected from this hunting ground.' : `Enter ${dungeon.name} to inspect its threats.`}</p></div>
}

function IntelTraits({ monsterId }: { monsterId: MonsterId }) {
  const traits = getTraitDefinitions(MONSTERS[monsterId].traitIds)
  return <section className="enemy-context-section"><div className="combat-subsection-label">TRAITS</div>{traits.length ? <div className="enemy-intel-traits">{traits.map((trait) => <GameTooltip key={trait.id} block content={<TooltipContent title={trait.name} description={trait.description} />} accent="warning"><div tabIndex={0} className="enemy-intel-trait"><Sparkles size={13} aria-hidden="true" /><div><strong>{trait.name}</strong><p>{trait.ui?.shortDescription ?? trait.description}</p></div></div></GameTooltip>)}</div> : <p className="muted">No authored traits.</p>}</section>
}

function ResistanceIntel({ monsterId }: { monsterId: MonsterId }) {
  const monster = MONSTERS[monsterId]
  const resistances = Object.entries(monster.resistances ?? {}).filter(([, value]) => value !== undefined && value !== 0)
  const immunities = monster.damageImmunities ?? []
  const statusImmunities = monster.statusImmunities ?? []
  const statusTagImmunities = monster.statusTagImmunities ?? []
  const hasAny = resistances.length || immunities.length || statusImmunities.length || statusTagImmunities.length
  return <section className="enemy-context-section"><div className="combat-subsection-label">DEFENCES</div>{hasAny ? <div className="enemy-intel-defences">{resistances.map(([type, value]) => <div key={type} className={`enemy-intel-defence ${value as number < 0 ? 'is-weakness' : 'is-resistance'}`}><span className={`damage-type damage-${type}`}>{pretty(type)}</span><strong>{Math.round(Math.abs(value as number) * 100)}% {value as number > 0 ? 'Resistance' : 'Weakness'}</strong></div>)}{immunities.map((type) => <div key={`immune-${type}`} className="enemy-intel-defence is-immunity"><span className={`damage-type damage-${type}`}>{pretty(type)}</span><strong>IMMUNE</strong></div>)}{statusImmunities.length > 0 && <div className="enemy-intel-defence is-immunity"><span>Status effects</span><strong>{statusImmunities.map(pretty).join(', ')}</strong></div>}{statusTagImmunities.length > 0 && <div className="enemy-intel-defence is-immunity"><span>Status categories</span><strong>{statusTagImmunities.map(pretty).join(', ')}</strong></div>}</div> : <p className="muted">No explicit defences.</p>}</section>
}

function ActionIntel({ monsterId }: { monsterId: MonsterId }) {
  const activePattern = useGameStore((state) => state.combat.enemyActionPatternId)
  const monster = MONSTERS[monsterId]
  return <section className="enemy-context-section"><div className="combat-subsection-label">ACTIONS</div><div className="enemy-intel-actions">{Object.values(monster.actions).map((action) => { const presentation = buildCombatActionPresentation(action); return <GameTooltip key={action.id} block wide content={<TooltipContent title={presentation.name} description={presentation.description}><div className="tooltip-section"><small>TELEGRAPH</small><p>{formatTime(presentation.telegraphMs)}</p></div>{presentation.recoveryMs !== undefined && <div className="tooltip-section"><small>RECOVERY</small><p>{formatTime(presentation.recoveryMs)}</p></div>}{presentation.effects.map((effect, index) => <p key={`${effect.label}-${index}`}>{effect.label}{effect.value ? `: ${effect.value}` : ''}{effect.detail ? ` · ${effect.detail}` : ''}</p>)}</TooltipContent>}><div tabIndex={0} className="enemy-intel-action"><div><strong>{presentation.name}</strong><span><Clock3 size={11} aria-hidden="true" />{formatTime(presentation.telegraphMs)}</span></div><p>{presentation.description}</p><div>{presentation.effects.slice(0, 2).map((effect, index) => <small key={`${effect.label}-${index}`}>{effect.label}{effect.value ? ` · ${effect.value}` : ''}</small>)}</div></div></GameTooltip>})}</div><div className="enemy-intel-pattern"><div className="combat-subsection-label">ACTION SEQUENCE</div><div className="enemy-intel-pattern-rail">{Object.values(monster.actionPatterns).map((pattern, index) => <div className={`enemy-intel-pattern-line${pattern.id === activePattern ? ' is-active' : ''}`} key={pattern.id}><span>{pattern.id === activePattern ? 'CURRENT' : index === 0 ? 'STANDARD' : 'ALTERNATE'}</span><strong>{pattern.steps.map((step) => step.type === 'basic' ? 'Basic Attack' : monster.actions[step.actionId]?.name ?? 'Action').join(' → ')}</strong></div>)}</div></div></section>
}

export function EnemyLootContent({ selectedDungeonId }: { selectedDungeonId: DungeonId }) {
  const combat = useGameStore((state) => state.combat)
  const inventory = useGameStore((state) => state.inventory)
  const dungeon = DUNGEONS[combat.dungeonId ?? selectedDungeonId]
  const current = combat.enemyId ? MONSTERS[combat.enemyId] : null
  return <div className="enemy-loot-content"><div className="enemy-context-loot-group"><div className="combat-subsection-label">{current ? 'CURRENT ENEMY DROPS' : 'DUNGEON DROPS'}</div>{current ? <LootRows monster={current} inventory={inventory} /> : <p className="muted">No active enemy. Boss and normal enemy drops are shown when an encounter is active.</p>}</div><div className="enemy-context-loot-group"><div className="combat-subsection-label">BOSS DROPS · {MONSTERS[dungeon.boss].name.toUpperCase()}</div><LootRows monster={MONSTERS[dungeon.boss]} inventory={inventory} /></div></div>
}

function LootRows({ monster, inventory }: { monster: typeof MONSTERS[MonsterId]; inventory: Partial<Record<keyof typeof ITEMS, number>> }) {
  return <div className="enemy-loot-grid">{monster.loot.map((drop) => { const item = ITEMS[drop.itemId]; return <ItemTooltip key={drop.itemId} itemId={drop.itemId} owned={inventory[drop.itemId] ?? 0}><div tabIndex={0} className="enemy-loot-row"><ItemIcon itemId={drop.itemId} size="tiny" /><div><strong>{item.name}</strong><small>{drop.chance === 1 ? 'Guaranteed' : `${Math.round(drop.chance * 100)}%`} · {drop.min}–{drop.max}</small></div><Status tone={drop.chance === 1 ? 'success' : 'neutral'}>{drop.chance === 1 ? 'GUARANTEED' : `${Math.round(drop.chance * 100)}%`}</Status></div></ItemTooltip>})}</div>
}

function pretty(value: string) { return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
