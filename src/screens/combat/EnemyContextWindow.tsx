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
import { getEnemyCombatStats } from '../../game/systems/combat/combatStats'
import { BLOCK_DAMAGE_REDUCTION, MAX_RESISTANCE } from '../../game/core/balance/combatStats'
import { CombatEffectChip } from './CombatEffectChip'

export type EnemyContextMode = 'intel' | 'stats' | 'loot'

export interface EnemyContextAnchorRect {
  left: number
  top: number
  width: number
}

export interface EnemyContextViewport {
  width: number
  height: number
}

export interface EnemyContextPosition {
  top: number
  left: number
  width: number
  maxHeight: number
}

/** Anchors the non-modal context layer to the Enemy card instead of a side position. */
export const getEnemyContextPosition = (anchorRect: EnemyContextAnchorRect, viewport: EnemyContextViewport): EnemyContextPosition => {
  const margin = 16
  const availableWidth = Math.max(1, viewport.width - margin * 2)
  const width = Math.min(Math.max(1, anchorRect.width), availableWidth)
  const maxLeft = Math.max(margin, viewport.width - width - margin)
  const left = Math.min(maxLeft, Math.max(margin, anchorRect.left))
  const top = Math.min(Math.max(margin, anchorRect.top), Math.max(margin, viewport.height - margin))
  return { top, left, width, maxHeight: Math.max(1, viewport.height - top - margin) }
}

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
  const [position, setPosition] = useState<EnemyContextPosition>({ top: 16, left: 16, width: 320, maxHeight: 600 })
  const active = useGameStore((state) => state.combat.active)
  const enemyId = useGameStore((state) => state.combat.enemyId)

  useLayoutEffect(() => {
    const updatePosition = () => {
      const anchor = anchorRef.current
      if (!anchor) return
      const anchorRect = anchor.getBoundingClientRect()
      setPosition(getEnemyContextPosition(anchorRect, { width: window.innerWidth, height: window.innerHeight }))
    }
    const frame = requestAnimationFrame(updatePosition)
    addEventListener('resize', updatePosition)
    addEventListener('scroll', updatePosition, true)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updatePosition)
    if (observer && anchorRef.current) observer.observe(anchorRef.current)
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); removeEventListener('resize', updatePosition); removeEventListener('scroll', updatePosition, true) }
  }, [anchorRef])

  useEffect(() => {
    if (!active || !enemyId || !MONSTERS[enemyId]) { onClose(); return }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (surfaceRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      if (target instanceof Element && target.closest('.game-tooltip')) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose() } }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('pointerdown', onPointerDown); document.removeEventListener('keydown', onKeyDown) }
  }, [active, anchorRef, enemyId, onClose])

  useEffect(() => () => { triggerRef.current?.focus() }, [triggerRef])

  if (typeof document === 'undefined' || !active || !enemyId || !MONSTERS[enemyId]) return null
  return createPortal(<div ref={surfaceRef} className="enemy-context-window" role="dialog" aria-modal="false" aria-label={mode === 'intel' ? 'Enemy Intel' : mode === 'stats' ? 'Enemy Stats' : 'Enemy Loot'} style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}>
    <header className="enemy-context-header">
      <div><span className="combat-subsection-label">CURRENT ENCOUNTER</span><strong>{mode === 'intel' ? 'ENEMY INTEL' : mode === 'stats' ? 'ENEMY STATS' : 'LOOT'}</strong></div>
      <div className="enemy-context-header-actions"><div className="enemy-context-tabs" role="tablist" aria-label="Enemy context"><button type="button" role="tab" aria-selected={mode === 'intel'} className={mode === 'intel' ? 'is-active' : ''} onClick={() => onModeChange('intel')}>OVERVIEW</button><button type="button" role="tab" aria-selected={mode === 'stats'} className={mode === 'stats' ? 'is-active' : ''} onClick={() => onModeChange('stats')}>STATS</button><button type="button" role="tab" aria-selected={mode === 'loot'} className={mode === 'loot' ? 'is-active' : ''} onClick={() => onModeChange('loot')}>LOOT</button></div><Button icon variant="ghost" ariaLabel="Close enemy context" onClick={onClose}><X size={15} /></Button></div>
    </header>
    <div className="enemy-context-body">{mode === 'intel' ? <EnemyIntelContent selectedDungeonId={selectedDungeonId} /> : mode === 'stats' ? <EnemyStatsContent /> : <EnemyLootContent selectedDungeonId={selectedDungeonId} />}</div>
  </div>, document.body)
}

export function EnemyStatsContent() {
  const state = useGameStore((current) => current)
  const stats = getEnemyCombatStats(state)
  const rows: Array<[string, string, string]> = [
    ['Max Health', formatNumber(stats.maxHealth), 'Maximum Health for the current encounter.'],
    ['Basic Attack Damage', formatNumber(stats.basicAttackDamage), 'Raw damage of the enemy Basic Attack before mitigation.'],
    ['Basic Attack Speed', `${stats.basicAttackSpeedMultiplier.toFixed(2)}x`, 'Multiplier applied to the enemy Basic Attack interval.'],
    ['Defense', formatNumber(stats.defense), 'A rating that reduces Direct Hit damage with diminishing returns. Damage over Time ignores Defense.'],
    ['Damage Reduction', `${(stats.defenseReduction * 100).toFixed(1)}%`, 'Current Direct Hit reduction produced by Defense. Capped at 80%. Damage over Time ignores Defense.'],
    ['Crit Chance', `${Math.round(stats.critChance * 100)}%`, 'Chance for a direct enemy hit to critically strike.'],
    ['Crit Damage', `${Math.round(stats.critDamageMultiplier * 100)}%`, 'Multiplier applied to a critical direct hit.'],
  ]
  if (stats.blockChance > 0) rows.push(['Block Chance', `${Math.round(stats.blockChance * 100)}%`, `Chance for a Direct Hit to be Blocked. A successful Block currently reduces that hit by ${Math.round(BLOCK_DAMAGE_REDUCTION * 100)}%. Damage over Time cannot be Blocked.`])
  if (stats.healingDoneBonus !== 0) rows.push(['Healing Done', `${Math.round(stats.healingDoneBonus * 100)}%`, 'Bonus applied to the enemy healing effects.'])
  if (stats.barrierPowerBonus !== 0) rows.push(['Barrier Power', `${Math.round(stats.barrierPowerBonus * 100)}%`, 'Bonus applied to the enemy Barrier effects.'])
  if (stats.damageOverTimeBonus !== 0) rows.push(['Damage over Time', `${Math.round(stats.damageOverTimeBonus * 100)}%`, 'Bonus applied only to the enemy periodic damage effects.'])
  if (stats.statusDurationBonus !== 0) rows.push(['Status Duration', `${Math.round(stats.statusDurationBonus * 100)}%`, 'Bonus to outgoing status duration.'])
  Object.entries(stats.resistances).filter(([, value]) => Math.abs(value ?? 0) > 0.0001).forEach(([type, value]) => rows.push([`${pretty(type)} Resistance`, `${Math.round((value ?? 0) * 100)}%`, `Reduces damage of this type. Ordinary Resistance is capped at ${Math.round(MAX_RESISTANCE * 100)}%. Negative Resistance increases damage taken.`]))
  return <section className="enemy-stats-content"><div className="enemy-stats-grid">{rows.map(([label, value, description]) => <GameTooltip key={label} block content={<TooltipContent title={label} description={description} />}><div tabIndex={0} className="enemy-stat-row"><span>{label}</span><strong>{value}</strong></div></GameTooltip>)}</div></section>
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
  const state = useGameStore((current) => current)
  const resistances = Object.entries(getEnemyCombatStats(state).resistances).filter(([, value]) => Math.abs(value ?? 0) > 0.0001)
  const immunities = monster.damageImmunities ?? []
  const statusImmunities = monster.statusImmunities ?? []
  const statusTagImmunities = monster.statusTagImmunities ?? []
  const hasAny = resistances.length || immunities.length || statusImmunities.length || statusTagImmunities.length
  return <section className="enemy-context-section"><div className="combat-subsection-label">DEFENCES</div>{hasAny ? <div className="enemy-intel-defences">{resistances.map(([type, value]) => <div key={type} className={`enemy-intel-defence ${value as number < 0 ? 'is-weakness' : 'is-resistance'}`}><span className={`damage-type damage-${type}`}>{pretty(type)}</span><strong>{Math.round(Math.abs(value as number) * 100)}% {value as number > 0 ? 'Resistance' : 'Weakness'}</strong></div>)}{immunities.map((type) => <div key={`immune-${type}`} className="enemy-intel-defence is-immunity"><span className={`damage-type damage-${type}`}>{pretty(type)}</span><strong>IMMUNE</strong></div>)}{statusImmunities.length > 0 && <div className="enemy-intel-defence is-immunity"><span>Status effects</span><strong>{statusImmunities.map(pretty).join(', ')}</strong></div>}{statusTagImmunities.length > 0 && <div className="enemy-intel-defence is-immunity"><span>Status categories</span><strong>{statusTagImmunities.map(pretty).join(', ')}</strong></div>}</div> : <p className="muted">No explicit defences.</p>}</section>
}

function ActionIntel({ monsterId }: { monsterId: MonsterId }) {
  const activePattern = useGameStore((state) => state.combat.enemyActionPatternId)
  const monster = MONSTERS[monsterId]
  return <section className="enemy-context-section"><div className="combat-subsection-label">ACTIONS</div><div className="enemy-intel-actions">{Object.values(monster.actions).map((action) => { const presentation = buildCombatActionPresentation(action); return <GameTooltip key={action.id} block wide content={<TooltipContent title={presentation.name} description={presentation.description}><div className="tooltip-section"><small>ACTION TIME</small><p>{formatTime(presentation.actionTimeMs)}</p></div><div className="enemy-intel-tooltip-effects">{presentation.effects.map((effect, index) => <CombatEffectChip detailed key={`${effect.label}-${index}`} effect={effect} />)}</div></TooltipContent>}><div tabIndex={0} className={`enemy-intel-action${presentation.effects[0] ? ` effect-tone-${presentation.effects[0].tone}` : ''}`}><div><strong>{presentation.name}</strong><span><Clock3 size={11} aria-hidden="true" />{formatTime(presentation.actionTimeMs)}</span></div><p>{presentation.description}</p><div className="enemy-intel-action-effects">{presentation.effects.map((effect, index) => <CombatEffectChip key={`${effect.label}-${index}`} effect={effect} />)}</div></div></GameTooltip>})}</div><div className="enemy-intel-pattern"><div className="combat-subsection-label">ACTION SEQUENCE</div><div className="enemy-intel-pattern-rail">{Object.values(monster.actionPatterns).map((pattern, index) => <div className={`enemy-intel-pattern-line${pattern.id === activePattern ? ' is-active' : ''}`} key={pattern.id}><span>{pattern.id === activePattern ? 'CURRENT' : index === 0 ? 'STANDARD' : 'ALTERNATE'}</span><strong>{pattern.steps.map((step) => step.type === 'basic' ? 'Basic Attack' : monster.actions[step.actionId]?.name ?? 'Action').join(' → ')}</strong></div>)}</div></div></section>
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
