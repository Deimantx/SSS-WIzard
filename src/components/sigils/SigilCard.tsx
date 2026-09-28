import type { MouseEvent } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Button, GameTooltip } from '../ui'
import { SIGIL_QUALITIES } from '../../game/content/sigils/sigilQualities'
import { SIGIL_SETS } from '../../game/content/sigils/sigilSets'
import { SIGIL_STAT_DEFINITIONS } from '../../game/content/sigils/sigilStats'
import { resolveSigilStatsForInstance } from '../../game/systems/sigils/sigilRuntime'
import { formatSigilStatValue, getSigilSlotRoman } from '../../game/presentation/sigils/sigilEquipmentReadModel'
import type { SigilInstance } from '../../game/types'

export function SigilCard({ sigil, selected, equipped, onSelect, cardRef, onContextMenu, compact = false, disabled = false, disabledReason }: {
  sigil: SigilInstance
  selected: boolean
  equipped: boolean
  onSelect: () => void
  cardRef?: (element: HTMLButtonElement | null) => void
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>) => void
  compact?: boolean
  disabled?: boolean
  disabledReason?: string
}) {
  const stats = resolveSigilStatsForInstance(sigil)
  const quality = SIGIL_QUALITIES.find(({ id }) => id === sigil.quality)!
  const classes = ['sigil-card', 'quality-' + sigil.quality, selected ? 'selected' : '', equipped ? 'equipped' : '', compact ? 'compact' : ''].filter(Boolean).join(' ')
  return <GameTooltip block content={<><strong>{SIGIL_SETS[sigil.setId].name} · Slot {getSigilSlotRoman(sigil.slot)}</strong><br />T{sigil.tier} {quality.label} · +{sigil.rank} / +{quality.maxRank}<br />{SIGIL_STAT_DEFINITIONS[sigil.mainStatId].label} {formatSigilStatValue(sigil.mainStatId, stats[sigil.mainStatId] ?? 0, true)}{sigil.locked ? <><br />Protected from salvage</> : null}{disabledReason ? <><br />{disabledReason}</> : null}</>}>
    <Button ref={cardRef} type="button" variant="secondary" className={classes} disabled={disabled} ariaPressed={selected} onClick={onSelect} onContextMenu={onContextMenu}>
      <span className="sigil-card-head"><span>T{sigil.tier}</span><span className={'sigil-quality-badge quality-' + sigil.quality}>{quality.label.toUpperCase()}</span></span>
      <strong>{SIGIL_SETS[sigil.setId].name} · {getSigilSlotRoman(sigil.slot)}</strong>
      <span className="sigil-card-stat"><span>{SIGIL_STAT_DEFINITIONS[sigil.mainStatId].label}</span><b>{formatSigilStatValue(sigil.mainStatId, stats[sigil.mainStatId] ?? 0, true)}</b></span>
      <span className="sigil-card-foot"><span>+{sigil.rank} / +{quality.maxRank}</span>{equipped && <span>IN ARRAY</span>}{sigil.locked && <LockKeyhole size={13} aria-label="Protected from salvage" />}</span>
    </Button>
  </GameTooltip>
}
