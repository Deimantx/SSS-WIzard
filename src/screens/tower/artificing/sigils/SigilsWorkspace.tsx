import { useMemo, useState } from 'react'
import { LockKeyhole, PackageOpen, Sparkles, ShieldCheck, Trash2, Unlock, WandSparkles } from 'lucide-react'
import { GameTooltip } from '../../../../components/ui/tooltip/Tooltip'
import { SIGIL_QUALITIES } from '../../../../game/content/sigils/sigilQualities'
import { SIGIL_SETS, SIGIL_SET_IDS } from '../../../../game/content/sigils/sigilSets'
import { getSigilMainStatLabel, getSigilStatLabel, getSigilEnhancementCap, getSigilEnhancementCost, getSigilLabel, resolveSigilStatsForInstance, getEquippedSigilSetCounts } from '../../../../game/systems/sigils'
import type { SigilInstance, SigilQuality, SigilSetId, SigilSlot } from '../../../../game/types'
import { useGameStore } from '../../../../store/gameStore'

const roman = ['I', 'II', 'III', 'IV', 'V', 'VI']
const formatStat = (statId: Parameters<typeof getSigilStatLabel>[0], value: number) => statId.endsWith('Pct') || statId === 'critChance' || statId === 'critDamage' ? `${(value * 100).toFixed(1)}%` : Math.round(value).toLocaleString()

export function SigilsWorkspace() {
  const state = useGameStore()
  const [selectedId, setSelectedId] = useState<string | null>(Object.keys(state.sigils.storage)[0] ?? null)
  const selected = selectedId ? state.sigils.storage[selectedId] : undefined
  const stored = useMemo(() => Object.values(state.sigils.storage).sort((a, b) => b.tier - a.tier || SIGIL_QUALITIES.findIndex((quality) => quality.id === b.quality) - SIGIL_QUALITIES.findIndex((quality) => quality.id === a.quality) || b.rank - a.rank), [state.sigils.storage])
  const setCounts = getEquippedSigilSetCounts(state)
  const equipped = state.sigils.equipped
  const craftTier = state.sigils.highestSourcePowerDefeated >= 5000 ? 2 : 1
  const cap = getSigilEnhancementCap(state)
  const show = (message: string) => { if (typeof window !== 'undefined') window.alert(message) }

  return <div className="sigils-workspace">
    <div className="sigils-mode-rail">
      <div><span className="eyebrow">ARTIFICING · SIGILS</span><strong>Arcane Sigil Array</strong><small>Combat-born equipment for six build-defining slots.</small></div>
      <div className="sigils-resource-readout"><span>DUST</span><b>{state.sigils.dust.toLocaleString()}</b><small>{Object.keys(state.sigils.storage).length} stored · cap +{cap}</small></div>
    </div>
    <section className="sigils-loadout card">
      <div className="card-head"><div><span className="eyebrow">EQUIPPED ARRAY</span><h2>Six active channels</h2></div><span className="sigils-loadout-count">{Object.values(equipped).filter(Boolean).length} / 6</span></div>
      <div className="sigils-slot-row">{([1, 2, 3, 4, 5, 6] as SigilSlot[]).map((slot) => { const sigil = equipped[slot] ? state.sigils.storage[equipped[slot]!] : undefined; return <GameTooltip key={slot} block content={sigil ? getSigilLabel(sigil) : `Slot ${roman[slot - 1]} is empty`}><button className={`sigil-slot ${sigil ? 'filled' : ''}`} onClick={() => sigil ? setSelectedId(sigil.instanceId) : undefined}><span>{roman[slot - 1]}</span><strong>{sigil ? SIGIL_SETS[sigil.setId].name : 'EMPTY'}</strong>{sigil && <small>T{sigil.tier} · +{sigil.rank}</small>}</button></GameTooltip> })}</div>
      <div className="sigils-set-summary">{SIGIL_SET_IDS.filter((setId) => (setCounts[setId] ?? 0) > 0).map((setId) => <span key={setId} className={(setCounts[setId] ?? 0) >= SIGIL_SETS[setId].piecesRequired ? 'active' : ''}><b>{SIGIL_SETS[setId].name}</b> {setCounts[setId]} / {SIGIL_SETS[setId].piecesRequired}</span>)}{Object.keys(setCounts).length === 0 && <small>Equip Sigils to activate Set bonuses.</small>}</div>
    </section>
    <div className="sigils-main-grid">
      <section className="sigils-storage card"><div className="card-head"><div><span className="eyebrow">STORAGE · {stored.length} / 500</span><h2>Find the roll</h2></div><PackageOpen size={18} aria-hidden="true" /></div><div className="sigils-storage-list">{stored.length === 0 ? <div className="sigils-empty"><Sparkles size={24} /><strong>NO SIGILS YET</strong><p>Keep fighting. Any eligible Combat kill can begin the chase.</p></div> : stored.map((sigil) => <GameTooltip key={sigil.instanceId} block content={<>{getSigilLabel(sigil)}<br />Select to inspect Main, Secondaries, Traits, and roll history.</>}><button className={`sigil-card ${selectedId === sigil.instanceId ? 'selected' : ''} quality-${sigil.quality}`} onClick={() => setSelectedId(sigil.instanceId)}><span className="sigil-card-top"><b>T{sigil.tier}</b><i>{sigil.quality.toUpperCase()}</i></span><strong>{SIGIL_SETS[sigil.setId].name} · {roman[sigil.slot - 1]}</strong><small>+{sigil.rank} / +{SIGIL_QUALITIES.find((quality) => quality.id === sigil.quality)?.maxRank}</small><span>{getSigilMainStatLabel(sigil)}</span>{sigil.locked && <LockKeyhole size={13} aria-label="Locked" />}</button></GameTooltip>)}</div></section>
      <SigilInspector sigil={selected} onMessage={show} onSelect={setSelectedId} />
    </div>
    <section className="sigils-controls card"><div><span className="eyebrow">ARRAY CONTROLS</span><h2>Shape the chase</h2></div><div className="sigils-control-actions"><GameTooltip content="Common drops are discovered first, then converted into Sigil Dust."><label><input type="checkbox" checked={state.sigils.autoSalvage.common} onChange={(event) => useGameStore.getState().setSigilAutoSalvage('common', event.target.checked)} /> Auto-salvage Common</label></GameTooltip><GameTooltip content="Refined drops are discovered first, then converted into Sigil Dust."><label><input type="checkbox" checked={state.sigils.autoSalvage.refined} onChange={(event) => useGameStore.getState().setSigilAutoSalvage('refined', event.target.checked)} /> Auto-salvage Refined</label></GameTooltip><label>Attunement <select aria-label="Set Attunement" value={state.sigils.attunedSetId ?? ''} onChange={(event) => useGameStore.getState().setSigilAttunement((event.target.value || null) as SigilSetId | null)}><option value="">None</option>{SIGIL_SET_IDS.filter((setId) => state.sigils.discovery.discoveredSets[setId]).map((setId) => <option key={setId} value={setId}>{SIGIL_SETS[setId].name}</option>)}</select></label><span className="sigils-craft-note"><WandSparkles size={14} /> Crafting unlocks through Dust after Power {craftTier === 2 ? '5000' : '0'} evidence.</span></div></section>
    <SigilForgePanel tier={craftTier as 1 | 2} onMessage={show} />
  </div>
}

function SigilForgePanel({ tier, onMessage }: { tier: 1 | 2; onMessage: (message: string) => void }) {
  const [setId, setSetId] = useState<SigilSetId>('arcane')
  const [slot, setSlot] = useState<SigilSlot>(1)
  const store = useGameStore()
  const craft = (mode: 'basic' | 'focused') => { const result = store.craftSigil(mode, tier, setId, mode === 'focused' ? slot : undefined); if (!result.ok) onMessage(result.reason ?? 'Unable to craft.'); }
  return <section className="sigils-forge card"><div><span className="eyebrow">SIGIL FORGE</span><h2>Target the chase</h2><p>Crafting is bad-luck protection. Main Stat and Quality remain random.</p></div><div className="sigils-forge-controls"><label>SET<select value={setId} onChange={(event) => setSetId(event.target.value as SigilSetId)}>{SIGIL_SET_IDS.map((id) => <option key={id} value={id}>{SIGIL_SETS[id].name}</option>)}</select></label><label>SLOT<select value={slot} onChange={(event) => setSlot(Number(event.target.value) as SigilSlot)}>{[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{roman[value - 1]}</option>)}</select></label><GameTooltip content={`Random Slot · 100 Dust at T1, 180 Dust at T2.`}><button onClick={() => craft('basic')}>BASIC CRAFT</button></GameTooltip><GameTooltip content={`Focused Slot ${roman[slot - 1]} · 180 Dust at T1, 325 Dust at T2.`}><button onClick={() => craft('focused')}>FOCUSED CRAFT</button></GameTooltip></div></section>
}

function SigilInspector({ sigil, onMessage, onSelect }: { sigil?: SigilInstance; onMessage: (message: string) => void; onSelect: (id: string | null) => void }) {
  const store = useGameStore()
  if (!sigil) return <section className="sigils-inspector card"><div className="sigils-empty"><ShieldCheck size={28} /><strong>SELECT A SIGIL</strong><p>Your inspector will show real stat values and upgrade history here.</p></div></section>
  const stats = resolveSigilStatsForInstance(sigil)
  const isEquipped = Object.values(store.sigils.equipped).includes(sigil.instanceId)
  const nextCost = getSigilEnhancementCost(sigil, sigil.rank + 1)
  const enhance = () => { const result = store.enhanceSigil(sigil.instanceId); if (!result.ok) onMessage(result.reason ?? 'Unable to enhance.') }
  const salvage = () => { const result = store.salvageSigil(sigil.instanceId); if (!result.ok) onMessage(result.reason ?? 'Unable to salvage.'); else onSelect(null) }
  return <section className={`sigils-inspector card quality-${sigil.quality}`}><div className="sigil-inspector-hero"><div><span className="eyebrow">T{sigil.tier} · {sigil.quality.toUpperCase()}</span><h2>{SIGIL_SETS[sigil.setId].name} Sigil {roman[sigil.slot - 1]}</h2><p>{SIGIL_SETS[sigil.setId].description}</p></div><span className="sigil-rank">+{sigil.rank}</span></div><div className="sigil-detail-section"><span className="eyebrow">MAIN STAT</span><strong>{getSigilMainStatLabel(sigil)} · {formatStat(sigil.mainStatId, stats[sigil.mainStatId] ?? 0)}</strong></div><div className="sigil-detail-section"><span className="eyebrow">SECONDARIES</span>{sigil.secondaries.length === 0 ? <small>Milestones at +3 / +6 / +9 will begin the roll table.</small> : sigil.secondaries.map((secondary) => <div className="sigil-stat-row" key={secondary.statId}><span>{getSigilStatLabel(secondary.statId)}</span><b>{formatStat(secondary.statId, stats[secondary.statId] ?? 0)}</b></div>)}</div><div className="sigil-detail-section"><span className="eyebrow">TRAITS</span>{sigil.traitIds.length ? sigil.traitIds.map((traitId) => <span key={traitId} className="sigil-trait">{traitId.replaceAll('-', ' ')}</span>) : <small>Quality unlocks Traits at their authored milestones.</small>}</div><div className="sigil-detail-actions"><GameTooltip content={isEquipped ? 'Unequip this Sigil first.' : 'Put this Sigil into its matching array slot.'}><button disabled={isEquipped} onClick={() => { const result = store.equipSigil(sigil.instanceId); if (!result.ok) onMessage(result.reason ?? 'Unable to equip.') }}><ShieldCheck size={14} /> {isEquipped ? 'EQUIPPED' : 'EQUIP'}</button></GameTooltip><GameTooltip content={sigil.rank >= (SIGIL_QUALITIES.find((quality) => quality.id === sigil.quality)?.maxRank ?? 0) ? 'This quality has reached its maximum rank.' : `Spend ${nextCost} Sigil Dust.`}><button onClick={enhance} disabled={sigil.rank >= (SIGIL_QUALITIES.find((quality) => quality.id === sigil.quality)?.maxRank ?? 0)}><Sparkles size={14} /> ENHANCE · {nextCost}</button></GameTooltip><button onClick={() => store.toggleSigilLock(sigil.instanceId)}>{sigil.locked ? <Unlock size={14} /> : <LockKeyhole size={14} />} {sigil.locked ? 'UNLOCK' : 'LOCK'}</button><GameTooltip content={isEquipped ? 'Unequip before salvage.' : sigil.locked ? 'Unlock before salvage.' : 'Convert this Sigil into Dust.'}><button className="danger" disabled={isEquipped || sigil.locked} onClick={salvage}><Trash2 size={14} /> SALVAGE</button></GameTooltip></div><div className="sigil-history"><span className="eyebrow">ROLL HISTORY</span>{sigil.rollHistory.length === 0 ? <small>No enhancement milestones reached.</small> : sigil.rollHistory.map((entry, index) => <span key={`${entry.rank}-${index}`}>+{entry.rank} · {entry.kind === 'trait' ? `Trait ${entry.traitId?.replaceAll('-', ' ')}` : entry.kind === 'new-secondary' ? `New ${entry.statId}` : `Improved ${entry.statId}`}</span>)}</div></section>
}
