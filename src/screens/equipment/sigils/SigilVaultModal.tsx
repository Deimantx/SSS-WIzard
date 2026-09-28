import type { MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { LockKeyhole, Sparkles, Unlock, X } from 'lucide-react'
import { Button, GameTooltip, ModalPortal } from '../../../components/ui'
import { SigilComparison } from '../../../components/sigils/SigilComparison'
import { SigilInspector } from '../../../components/sigils/SigilInspector'
import { SigilBrowser } from '../../../components/sigils/browser/SigilBrowser'
import { SigilSetSummary, SigilSocket, ActiveSigilTraits } from '../../../components/sigils/SigilPresentation'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { SIGIL_QUALITIES } from '../../../game/content/sigils/sigilQualities'
import { SIGIL_STORAGE_SOFT_CAP } from '../../../game/content/sigils/sigilDropConfig'
import { SIGIL_SETS } from '../../../game/content/sigils/sigilSets'
import { getEquippedSigilSetCounts, getSigilEnhancementCap, getSigilEnhancementCost } from '../../../game/systems/sigils/sigilRuntime'
import { getSigilSlotRoman } from '../../../game/presentation/sigils/sigilEquipmentReadModel'
import type { SigilInstance, SigilSlot } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { useGameContextMenu } from '../../../ui/context-menu/GameContextMenuProvider'
import { setNavigationIntent } from '../../../ui/navigation/navigationIntent'
import { setUiPreferences } from '../../../ui/preferences/uiPreferencesStore'

export function SigilVaultModal({ open, onClose, initialSigilInstanceId = null, initialSlot = null, onSelectedInstanceChange, onOpenArtificing, onBulkSalvage }: {
  open: boolean
  onClose: () => void
  initialSigilInstanceId?: string | null
  initialSlot?: SigilSlot | null
  onSelectedInstanceChange?: (instanceId: string | null) => void
  onOpenArtificing: (instanceId: string | null) => void
  onBulkSalvage: () => void
}) {
  const sigils = useGameStore((state) => state.sigils)
  const progress = useGameStore((state) => state.progress)
  const setScreen = useGameStore((state) => state.setScreen)
  const equipSigil = useGameStore((state) => state.equipSigil)
  const unequipSigil = useGameStore((state) => state.unequipSigil)
  const toggleSigilLock = useGameStore((state) => state.toggleSigilLock)
  const notifySigil = useGameStore((state) => state.notifySigil)
  const { openContextMenu } = useGameContextMenu()
  const [targetSlot, setTargetSlot] = useState<SigilSlot | null>(initialSlot)
  const [revealId, setRevealId] = useState<string | null>(initialSigilInstanceId)
  const [selectedId, setSelectedId] = useState<string | null>(() => resolveInitialSigil(initialSigilInstanceId, initialSlot, sigils.storage, sigils.equipped))
  const equippedIds = useMemo(() => new Set(Object.values(sigils.equipped).filter((id): id is string => Boolean(id))), [sigils.equipped])
  const selected = selectedId ? sigils.storage[selectedId] : undefined
  const cap = getSigilEnhancementCap({ sigils, progress })
  const equippedCount = equippedIds.size
  const storedCount = Math.max(0, Object.keys(sigils.storage).length - equippedCount)

  useEffect(() => {
    if (!open) return
    const nextId = resolveInitialSigil(initialSigilInstanceId, initialSlot, sigils.storage, sigils.equipped)
    setTargetSlot(initialSlot)
    setSelectedId(nextId)
    setRevealId(nextId)
    onSelectedInstanceChange?.(nextId)
  }, [open])

  const chooseSlot = (slot: SigilSlot) => {
    const instanceId = sigils.equipped[slot] ?? null
    setTargetSlot(slot)
    setSelectedId(instanceId)
    setRevealId(instanceId)
    onSelectedInstanceChange?.(instanceId)
  }
  const chooseSigil = (sigil: SigilInstance) => {
    setSelectedId(sigil.instanceId)
    setRevealId(null)
    onSelectedInstanceChange?.(sigil.instanceId)
  }
  const clearTarget = () => { setTargetSlot(null); setRevealId(null) }
  const openArtificing = (instanceId = selected?.instanceId ?? null) => onOpenArtificing(instanceId)
  const equipSelected = () => {
    if (!selected) return
    const result = equipSigil(selected.instanceId)
    if (!result.ok) notifySigil(result.reason ?? 'Unable to equip Sigil.')
    else notifySigil('Equipped to Slot ' + getSigilSlotRoman(selected.slot) + '.', 'success')
  }
  const unequipSelected = () => {
    if (!selected) return
    const slot = Object.entries(sigils.equipped).find(([, id]) => id === selected.instanceId)?.[0]
    if (!slot) return
    const result = unequipSigil(Number(slot) as SigilSlot)
    if (!result.ok) notifySigil(result.reason ?? 'Unable to unequip Sigil.')
  }
  const toggleLock = () => {
    if (!selected) return
    const result = toggleSigilLock(selected.instanceId)
    if (!result.ok) notifySigil(result.reason ?? 'Unable to update protection.')
  }

  const onCardContextMenu = (event: MouseEvent<HTMLButtonElement>, sigil: SigilInstance, isEquipped: boolean) => {
    event.preventDefault()
    event.stopPropagation()
    const select = () => chooseSigil(sigil)
    openContextMenu({
      x: event.clientX,
      y: event.clientY,
      anchor: event.currentTarget,
      header: { title: SIGIL_SETS[sigil.setId].name + ' ' + getSigilSlotRoman(sigil.slot), meta: 'TIER ' + sigil.tier + ' · ' + sigil.quality.toUpperCase() + ' · +' + sigil.rank },
      sections: [
        { id: 'inspect', actions: [{ id: 'inspect', label: 'Inspect', onSelect: select }, { id: 'compare', label: 'Compare', onSelect: select }] },
        { id: 'equipment', actions: [
          { id: 'equip', label: isEquipped ? 'Equipped' : sigils.equipped[sigil.slot] ? 'Replace in Array' : 'Equip', disabled: isEquipped, disabledReason: isEquipped ? 'Already in the Array.' : undefined, onSelect: () => { select(); const result = equipSigil(sigil.instanceId); if (!result.ok) notifySigil(result.reason ?? 'Unable to equip Sigil.') } },
          ...(isEquipped ? [{ id: 'unequip', label: 'Unequip', onSelect: () => { select(); unequipSigil(sigil.slot) } }] : []),
          { id: 'lock', label: sigil.locked ? 'Unlock' : 'Lock', onSelect: () => toggleSigilLock(sigil.instanceId) },
        ] },
        { id: 'routes', actions: [
          { id: 'artificing', label: 'Refine in Artificing', onSelect: () => openArtificing(sigil.instanceId) },
          { id: 'collection', label: 'Open Sigil Set in Equipment', onSelect: () => { setNavigationIntent({ sigilSetId: sigil.setId }); setUiPreferences({ screenState: { collection: { primaryTab: 'sigils' } } }); setScreen('equipment') } },
        ] },
      ],
    })
  }

  return <ModalPortal open={open} onClose={onClose} backdropClassName="sigil-vault-backdrop" surfaceClassName="sigil-vault-modal" ariaLabel="Arcane Sigil Vault" ariaLabelledBy="sigil-vault-title">
    <header className="sigil-vault-header">
      <div><span className="eyebrow">EQUIPMENT · SIGIL MANAGEMENT</span><h2 id="sigil-vault-title">ARCANE SIGIL VAULT</h2><p>Shape and manage the six engraved channels of your build.</p><div className="sigil-vault-metrics"><span>{equippedCount}/6 <small>EQUIPPED</small></span><span>{storedCount} <small>STORED</small></span><span>{sigils.dust.toLocaleString()} <small>DUST</small></span><span>+{cap} <small>GLOBAL CAP</small></span></div></div>
      <div className="sigil-vault-header-actions"><Button variant="secondary" onClick={onBulkSalvage}>BULK SALVAGE</Button><Button variant="secondary" onClick={() => openArtificing(null)}>ARTIFICING</Button><GameTooltip content={<TooltipContent title="Close Sigil Vault" description="Return to your Equipment loadout." />}><Button type="button" variant="ghost" icon className="sigil-vault-close" ariaLabel="Close Sigil Vault" onClick={onClose}><X size={18} /></Button></GameTooltip></div>
    </header>
    <div className="sigil-vault-body">
      <aside className="sigil-vault-array">
        <div className="sigil-vault-section-heading"><div><span className="eyebrow">LOADOUT · {equippedCount}/6 ACTIVE</span><h3>ARCANE ARRAY</h3></div></div>
        <Button type="button" variant="secondary" ariaPressed={targetSlot === null} className="sigil-all-control" onClick={clearTarget}>ALL SIGILS</Button>
        <div className="sigil-vault-sockets">{([1, 2, 3, 4, 5, 6] as SigilSlot[]).map((slot) => {
          const id = sigils.equipped[slot]
          return <SigilSocket key={slot} slot={slot} sigil={id ? sigils.storage[id] : undefined} storage={sigils.storage} equipped={sigils.equipped} selected={targetSlot === slot} compact onClick={() => chooseSlot(slot)} />
        })}</div>
        <div className="sigil-vault-array-summary"><span className="eyebrow">ACTIVE SETS</span><SigilSetSummary state={{ sigils }} compact /><ActiveSigilTraits state={{ sigils }} /></div>
      </aside>
      <SigilBrowser storage={sigils.storage} equipped={sigils.equipped} selectedId={selectedId} revealInstanceId={revealId} onRevealConsumed={() => setRevealId(null)} onSelect={(id) => { if (id) chooseSigil(sigils.storage[id]!); else { setSelectedId(null); onSelectedInstanceChange?.(null) } }} targetSlot={targetSlot} onClearTarget={clearTarget} menuLayer="modal" onContextMenu={onCardContextMenu} label="SIGIL STORAGE" />
      <SigilInspectorPanel sigil={selected} sigils={sigils} equipped={sigils.equipped} storage={sigils.storage} targetSlot={targetSlot} cap={cap} onEquip={equipSelected} onUnequip={unequipSelected} onToggleLock={toggleLock} onOpenArtificing={() => openArtificing()} />
    </div>
  </ModalPortal>
}

function SigilInspectorPanel({ sigil, sigils, equipped, storage, targetSlot, cap, onEquip, onUnequip, onToggleLock, onOpenArtificing }: {
  sigil?: SigilInstance
  sigils: ReturnType<typeof useGameStore.getState>['sigils']
  equipped: Record<SigilSlot, string | null>
  storage: Record<string, SigilInstance>
  targetSlot: SigilSlot | null
  cap: number
  onEquip: () => void
  onUnequip: () => void
  onToggleLock: () => void
  onOpenArtificing: () => void
}) {
  const emptyTitle = targetSlot ? 'SLOT ' + getSigilSlotRoman(targetSlot) + ' IS EMPTY' : 'SELECT A SIGIL'
  const emptyDescription = targetSlot ? 'Choose a Slot ' + getSigilSlotRoman(targetSlot) + ' Sigil from Storage.' : 'Select an engraved channel or stored Sigil to inspect its build impact.'
  const isEquipped = Boolean(sigil && Object.values(equipped).includes(sigil.instanceId))
  const target = targetSlot ?? sigil?.slot ?? 1
  const currentId = equipped[target]
  const current = currentId && currentId !== sigil?.instanceId ? storage[currentId] : undefined
  const maxRank = sigil ? SIGIL_QUALITIES.find(({ id }) => id === sigil.quality)?.maxRank ?? 0 : 0
  const canEquip = Boolean(sigil && !isEquipped && sigil.slot === target)
  const comparison = sigil && current && targetSlot !== null ? <SigilComparison current={current} candidate={sigil} state={{ sigils }} /> : null

  const footer = sigil && <>
    {current && <div className="sigil-current-replacement"><span>CURRENT IN SLOT {getSigilSlotRoman(target)}</span><strong>{SIGIL_SETS[current.setId].name} · T{current.tier} {current.quality} +{current.rank}</strong></div>}
    {comparison}
    {sigil.rank < maxRank && sigil.rank < cap && <div className="sigil-next-enhancement"><Sparkles size={13} /> NEXT ENHANCEMENT · {getSigilEnhancementCost(sigil, sigil.rank + 1).toLocaleString()} DUST</div>}
    <footer className="sigil-inspector-actions">
      {isEquipped ? <Button variant="secondary" onClick={onUnequip}>UNEQUIP</Button> : <GameTooltip content={!canEquip ? <TooltipContent title="Wrong channel" description={'This Sigil fits Slot ' + getSigilSlotRoman(sigil.slot) + ' only.'} /> : undefined}><Button variant="primary" disabled={!canEquip} onClick={onEquip}>{current ? 'REPLACE SLOT ' + getSigilSlotRoman(target) : 'EQUIP TO SLOT ' + getSigilSlotRoman(target)}</Button></GameTooltip>}
      <GameTooltip content={<TooltipContent title={sigil.locked ? 'Unlock Sigil' : 'Protect from salvage'} description="Locked Sigils are protected from accidental salvage and remain eligible for equipment." />}><Button variant="ghost" icon onClick={onToggleLock} ariaLabel={sigil.locked ? 'Unlock Sigil' : 'Lock Sigil'}>{sigil.locked ? <Unlock size={16} /> : <LockKeyhole size={16} />}</Button></GameTooltip>
      <GameTooltip content={<TooltipContent title="Refine in Artificing" description="Enhance this Sigil or adjust crafting and refinement settings." />}><Button variant="ghost" onClick={onOpenArtificing}>REFINE IN ARTIFICING</Button></GameTooltip>
    </footer>
  </>

  const setCount = sigil ? getEquippedSigilSetCounts({ sigils })[sigil.setId] ?? 0 : 0
  return <div className="sigil-vault-inspector"><SigilInspector sigil={sigil} emptyTitle={emptyTitle} emptyDescription={emptyDescription} setCount={setCount} footer={footer} className="sigil-vault-shared-inspector" /></div>
}

function resolveInitialSigil(instanceId: string | null, slot: SigilSlot | null, storage: Record<string, SigilInstance>, equipped: Record<SigilSlot, string | null>) {
  if (instanceId && storage[instanceId]) return instanceId
  if (slot !== null && equipped[slot] && storage[equipped[slot]!]) return equipped[slot]
  return ([1, 2, 3, 4, 5, 6] as SigilSlot[]).map((position) => equipped[position]).find((id) => Boolean(id && storage[id])) ?? Object.keys(storage).sort((a, b) => sequence(b) - sequence(a))[0] ?? null
}

function sequence(id: string) { return Number(/sigil:(\d+)/.exec(id)?.[1] ?? 0) }
