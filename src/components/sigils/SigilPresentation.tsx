import { GameTooltip } from '../ui/tooltip/Tooltip'
import { TooltipContent } from '../ui/tooltip/Tooltip'
import { SIGIL_QUALITIES } from '../../game/content/sigils/sigilQualities'
import { SIGIL_SETS, SIGIL_SET_IDS } from '../../game/content/sigils/sigilSets'
import { SIGIL_STAT_DEFINITIONS } from '../../game/content/sigils/sigilStats'
import { SIGIL_TRAITS } from '../../game/content/sigils/sigilTraits'
import { getActiveSigilTraitIds, getEquippedSigilSetCounts, getSigilSetActivation, resolveSigilStatsForInstance } from '../../game/systems/sigils/sigilRuntime'
import type { GameState, SigilInstance, SigilSlot } from '../../game/types'
import { formatSigilStatValue, getSigilSlotRoman } from '../../game/presentation/sigils/sigilEquipmentReadModel'

export function SigilQualityBadge({ quality }: { quality: SigilInstance['quality'] }) {
  const definition = SIGIL_QUALITIES.find((entry) => entry.id === quality)!
  return <span className={`sigil-quality-badge quality-${quality}`}>{definition.label.toUpperCase()}</span>
}

export function SigilTooltipContent({ sigil, equipped, setCount }: { sigil: SigilInstance; equipped: boolean; setCount: number }) {
  const stats = resolveSigilStatsForInstance(sigil)
  const set = SIGIL_SETS[sigil.setId]
  return <div className="sigil-rich-tooltip">
    <strong>T{sigil.tier} {sigil.quality.toUpperCase()} · {set.name} {getSigilSlotRoman(sigil.slot)} · +{sigil.rank}</strong>
    <div><span>Main</span><p>{SIGIL_STAT_DEFINITIONS[sigil.mainStatId].label} <b>{formatSigilStatValue(sigil.mainStatId, stats[sigil.mainStatId] ?? 0, true)}</b></p></div>
    {sigil.secondaries.length > 0 && <div><span>Secondaries</span>{sigil.secondaries.map(({ statId }) => <p key={statId}>{SIGIL_STAT_DEFINITIONS[statId].label} <b>{formatSigilStatValue(statId, stats[statId] ?? 0, true)}</b></p>)}</div>}
    {sigil.traitIds.length > 0 && <div><span>Traits</span>{sigil.traitIds.map((traitId) => <p key={traitId}><b>{SIGIL_TRAITS[traitId].name}</b> · {SIGIL_TRAITS[traitId].description}</p>)}</div>}
    <div><span>Set</span><p>{set.name} · {setCount}/{set.piecesRequired} · {set.description}</p></div>
    <small>{equipped ? 'Equipped in this channel' : 'Stored'}{sigil.locked ? ' · Protected from salvage' : ''}</small>
  </div>
}

export function SigilSetSummary({ state, compact = false }: { state: Pick<GameState, 'sigils'>; compact?: boolean }) {
  const counts = getEquippedSigilSetCounts(state)
  const active = SIGIL_SET_IDS.filter((setId) => (counts[setId] ?? 0) > 0)
  if (!active.length) return <p className="sigil-set-empty">Equip Sigils to activate Set bonuses.</p>
  return <div className={`sigil-set-summary${compact ? ' compact' : ''}`}>
    {active.map((setId) => {
      const set = SIGIL_SETS[setId]
      const count = counts[setId] ?? 0
      const activation = getSigilSetActivation(state, setId)
      return <GameTooltip key={setId} block content={<TooltipContent title={`${set.name} Set · ${count}/${set.piecesRequired}`} description={set.description} />}>
        <div className={`sigil-set-summary-item${activation.active ? ' active' : ''}`}>
          <strong>{set.name}</strong><span>{count}/{set.piecesRequired} · {activation.active ? 'ACTIVE' : `${Math.max(0, set.piecesRequired - count)} MORE NEEDED`}</span>
          {!compact && <small>{set.description}</small>}
        </div>
      </GameTooltip>
    })}
  </div>
}

export function SigilSocket({ slot, sigil, storage, equipped, onClick, selected = false, compact = false }: {
  slot: SigilSlot
  sigil?: SigilInstance
  storage: Record<string, SigilInstance>
  equipped: Record<SigilSlot, string | null>
  onClick: () => void
  selected?: boolean
  compact?: boolean
}) {
  const setCount = sigil ? Object.values(equipped).filter((id) => id && storage[id]?.setId === sigil.setId).length : 0
  const tooltip = sigil
    ? <SigilTooltipContent sigil={sigil} equipped setCount={setCount} />
    : <TooltipContent title={`SIGIL SLOT ${getSigilSlotRoman(slot)}`} description={<>Equip a Slot {getSigilSlotRoman(slot)} Sigil. Sigils provide Main Stats, Secondary rolls, Set bonuses, and Traits.<br /><br />Click to open the Sigil Vault.</>} />
  return <GameTooltip block content={tooltip}>
    <button type="button" className={`sigil-socket quality-${sigil?.quality ?? 'empty'}${sigil ? ' is-filled' : ''}${selected ? ' is-selected' : ''}${compact ? ' compact' : ''}`} aria-label={sigil ? `Sigil Slot ${getSigilSlotRoman(slot)}, ${SIGIL_SETS[sigil.setId].name}, Tier ${sigil.tier}, ${sigil.quality}, rank ${sigil.rank}` : `Empty Sigil Slot ${getSigilSlotRoman(slot)}, open Sigil Vault`} onClick={onClick}>
      <span className="sigil-socket-rune" aria-hidden="true">◈</span>
      <span className="sigil-socket-number">{getSigilSlotRoman(slot)}</span>
      {sigil ? <><strong className="sigil-socket-set">{SIGIL_SETS[sigil.setId].name}</strong><span className="sigil-socket-rank">T{sigil.tier} · +{sigil.rank}</span><SigilQualityBadge quality={sigil.quality} /></> : <><strong className="sigil-socket-empty">EMPTY SIGIL</strong><span className="sigil-socket-hint">Click to engrave</span></>}
      {sigil?.locked && <span className="sigil-socket-lock" aria-label="Protected from salvage">LOCKED</span>}
    </button>
  </GameTooltip>
}

export function ActiveSigilTraits({ state }: { state: Pick<GameState, 'sigils'> }) {
  const traits = getActiveSigilTraitIds(state)
  return <div className="sigil-active-traits"><span>ACTIVE TRAITS</span>{traits.length ? traits.map((id) => <GameTooltip key={id} block content={<TooltipContent title={SIGIL_TRAITS[id].name} description={SIGIL_TRAITS[id].description} />}><span>{SIGIL_TRAITS[id].name}</span></GameTooltip>) : <small>No active Traits.</small>}</div>
}
