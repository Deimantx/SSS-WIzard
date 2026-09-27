import { useMemo, useState } from 'react'
import { GameTooltip } from '../../components/ui'
import { SIGIL_QUALITIES, type SigilQuality } from '../../game/content/sigils/sigilQualities'
import { SIGIL_SETS, SIGIL_SET_IDS, type SigilSetId } from '../../game/content/sigils/sigilSets'
import { SIGIL_MAIN_STAT_POOLS, SIGIL_STAT_DEFINITIONS, type SigilStatId } from '../../game/content/sigils/sigilStats'
import { useGameStore } from '../../store/gameStore'

export function DeveloperSigils() {
  const state = useGameStore()
  const [tier, setTier] = useState(1)
  const [quality, setQuality] = useState<SigilQuality>('legendary')
  const [setId, setSetId] = useState<SigilSetId>('arcane')
  const [slot, setSlot] = useState(1)
  const [mainStat, setMainStat] = useState<SigilStatId>(SIGIL_MAIN_STAT_POOLS[1][0])
  const options = useMemo(() => SIGIL_MAIN_STAT_POOLS[slot] ?? [], [slot])
  const create = () => { const selected = options.includes(mainStat) ? mainStat : options[0]; useGameStore.getState().debugCreateSigil(tier, quality, setId, slot, selected) }
  return <div className="developer-tab"><header className="developer-tab-header"><div><span className="eyebrow">SIGIL LAB</span><h2>Arcane Sigils</h2><p>Spawn controlled instances, bypass enhancement gates, and inspect the live loadout.</p></div><GameTooltip content="Tester-only resource; never part of normal gameplay progression."><button onClick={() => useGameStore.getState().debugAddSigilDust(10000)}>+10,000 DUST</button></GameTooltip></header><div className="developer-form-grid"><label>Tier<select value={tier} onChange={(event) => setTier(Number(event.target.value))}><option value={1}>T1</option><option value={2}>T2</option></select></label><label>Quality<select value={quality} onChange={(event) => setQuality(event.target.value as SigilQuality)}>{SIGIL_QUALITIES.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label><label>Set<select value={setId} onChange={(event) => setSetId(event.target.value as SigilSetId)}>{SIGIL_SET_IDS.map((id) => <option key={id} value={id}>{SIGIL_SETS[id].name}</option>)}</select></label><label>Slot<select value={slot} onChange={(event) => { const next = Number(event.target.value); setSlot(next); setMainStat(SIGIL_MAIN_STAT_POOLS[next][0]) }}>{[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>Main Stat<select value={mainStat} onChange={(event) => setMainStat(event.target.value as SigilStatId)}>{options.map((id) => <option key={id} value={id}>{SIGIL_STAT_DEFINITIONS[id].label}</option>)}</select></label></div><div className="developer-inline-actions"><button onClick={create}>SPAWN CONTROLLED SIGIL</button><button onClick={() => useGameStore.getState().debugCreateSigil(tier, quality, setId, slot, undefined)}>SPAWN RANDOM STATS</button></div><div className="developer-sigil-list">{Object.values(state.sigils.storage).slice(-12).reverse().map((sigil) => <div key={sigil.instanceId}><span>T{sigil.tier} {sigil.quality} · {SIGIL_SETS[sigil.setId].name} {sigil.slot}</span><b>+{sigil.rank}</b><button onClick={() => useGameStore.getState().debugEnhanceSigil(sigil.instanceId)}>FREE +1</button></div>)}</div></div>
}
