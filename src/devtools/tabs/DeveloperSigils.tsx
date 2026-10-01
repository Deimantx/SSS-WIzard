import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Button, Card, GameTooltip, SelectMenu, Status, Toggle } from '../../components/ui'
import { SIGIL_QUALITIES, type SigilQuality } from '../../game/content/sigils/sigilQualities'
import { SIGIL_SETS, SIGIL_SET_IDS, type SigilSetId } from '../../game/content/sigils/sigilSets'
import { SIGIL_MAIN_STAT_POOLS, SIGIL_SECONDARY_STAT_IDS, SIGIL_STAT_DEFINITIONS, type SigilStatId } from '../../game/content/sigils/sigilStats'
import { getEligibleSigilTraits, SIGIL_TRAITS, type SigilTraitId } from '../../game/content/sigils/sigilTraits'
import { SIGIL_TIERS } from '../../game/content/sigils/sigilTiers'
import { getSigilEnhancementCap, resolveSigilStatsForInstance } from '../../game/systems/sigils/sigilRuntime'
import { simulateSigilDrops, type SigilDropSimulationResult } from '../../game/systems/sigils/sigilDropSimulation'
import type { SigilInstance, SigilSlot } from '../../game/types'
import { formatSigilStatValue, getSigilSlotRoman } from '../../game/presentation/sigils/sigilEquipmentReadModel'
import { useDeveloperGameStore as useGameStore } from '../developerSandbox'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'
import { DeveloperAdvancedSection, DeveloperBrowser, DeveloperSection } from '../components/DeveloperBrowser'
import { Summary } from './DeveloperTabPrimitives'

const sigilSlots = Object.keys(SIGIL_MAIN_STAT_POOLS).map(Number) as SigilSlot[]
const slotOptions = sigilSlots.map((slot) => ({ value: String(slot), label: 'Slot ' + getSigilSlotRoman(slot) }))
const tierOptions = SIGIL_TIERS.map(({ tier, label }) => ({ value: String(tier), label }))
const qualityOptions = SIGIL_QUALITIES.map(({ id, label }) => ({ value: id, label }))
const setOptions = SIGIL_SET_IDS.map((id) => ({ value: id, label: SIGIL_SETS[id].name }))
const rollQualityOptions = [{ value: '0', label: 'Low roll' }, { value: '0.5', label: 'Typical roll' }, { value: '1', label: 'High roll' }]

export function DeveloperSigils() {
  const sigils = useGameStore((state) => state.sigils)
  const progress = useGameStore((state) => state.progress)
  const [tier, setTier] = useState(1)
  const [quality, setQuality] = useState<SigilQuality>('legendary')
  const [setId, setSetId] = useState<SigilSetId>('arcane')
  const [slot, setSlot] = useState<SigilSlot>(1)
  const [mainStat, setMainStat] = useState<SigilStatId>(SIGIL_MAIN_STAT_POOLS[1][0])
  const [dust, setDust] = useState(String(sigils.dust))
  const [ignoreGlobalCap, setIgnoreGlobalCap] = useState(true)
  const [rollQuality, setRollQuality] = useState(.5)
  const [manualTrait, setManualTrait] = useState<SigilTraitId>('arcane-surge')
  const [simulation, setSimulation] = useState<SigilDropSimulationResult | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(() => { const initial = Object.values(useGameStore.getState().sigils.storage); return initial[initial.length - 1]?.instanceId ?? null })
  const browserRef = useRef<HTMLDivElement | null>(null)
  const inspectorRef = useRef<HTMLDivElement | null>(null)
  const options = useMemo(() => SIGIL_MAIN_STAT_POOLS[slot] ?? [], [slot])
  const stored = useMemo(() => Object.values(sigils.storage), [sigils.storage])
  const selected = selectedId ? sigils.storage[selectedId] : undefined
  const equippedIds = new Set(Object.values(sigils.equipped).filter((id): id is string => Boolean(id)))
  const eligibleTraits = selected ? getEligibleSigilTraits(selected.setId) : getEligibleSigilTraits(setId)
  const activeTrait = eligibleTraits.includes(manualTrait) ? manualTrait : eligibleTraits[0]
  const secondaryOptions = SIGIL_SECONDARY_STAT_IDS.filter((id) => id !== selected?.mainStatId && id !== mainStat)
  const visibleSigils = stored.slice(-12).reverse()
  const enhancementCap = getSigilEnhancementCap({ sigils, progress })

  useSmartScrollState(browserRef, { dependencies: [visibleSigils.map((sigil) => sigil.instanceId).join('|')] })
  useSmartScrollState(inspectorRef, { resetKey: selected?.instanceId, dependencies: [selected] })

  const choose = (instanceId: string) => setSelectedId(instanceId)
  const spawn = (randomStats = false) => {
    const selectedMain = options.includes(mainStat) ? mainStat : options[0]
    const instanceId = useGameStore.getState().debugCreateSigil(tier, quality, setId, slot, randomStats ? undefined : selectedMain)
    choose(instanceId)
  }
  const craft = (mode: 'basic' | 'focused') => {
    const instanceId = useGameStore.getState().debugCraftSigil(mode, tier, setId, mode === 'focused' ? slot : undefined)
    choose(instanceId)
  }
  const enhanceTo = (instanceId: string, target: number) => {
    const store = useGameStore.getState()
    for (let rank = store.sigils.storage[instanceId]?.rank ?? 0; rank < target; rank += 1) {
      if (!store.debugEnhanceSigil(instanceId, { ignoreGlobalCap })) break
    }
  }
  const configureSelected = (changes: Parameters<ReturnType<typeof useGameStore.getState>['debugConfigureSigil']> extends [string, infer Config] ? Config : never) => {
    if (selected) useGameStore.getState().debugConfigureSigil(selected.instanceId, changes)
  }
  const toggleSecondary = (statId: SigilStatId) => {
    if (!selected) return
    const ids = selected.secondaries.map((secondary) => secondary.statId)
    configureSelected({ secondaryStatIds: ids.includes(statId) ? ids.filter((id) => id !== statId) : [...ids, statId], rollQuality01: rollQuality })
  }
  const addTrait = (traitId: SigilTraitId) => {
    if (selected) configureSelected({ traitIds: [...selected.traitIds, traitId] })
  }
  const clearEquipped = () => {
    const store = useGameStore.getState()
    ;sigilSlots.forEach((slotId) => store.unequipSigil(slotId))
  }
  const unequipSelected = () => { if (selected) useGameStore.getState().unequipSigil(selected.slot) }
  const equipPattern = (pattern: 'all' | '2+2+2' | '4+2') => {
    clearEquipped()
    const grouped = SIGIL_SET_IDS.map((id) => stored.filter((sigil) => sigil.setId === id)).filter((group) => group.length)
    const ids = pattern === 'all' ? stored.slice(0, 6) : pattern === '2+2+2' ? grouped.slice(0, 3).flatMap((group) => group.slice(0, 2)) : [...(grouped[0]?.slice(0, 4) ?? []), ...(grouped[1]?.slice(0, 2) ?? [])]
    ids.slice(0, 6).forEach((sigil) => useGameStore.getState().equipSigil(sigil.instanceId))
  }
  const simulateDrops = (count: number) => setSimulation(simulateSigilDrops({ locationId: 'whispering-woods', enemyId: 'forest-wisp', worldTier: tier === 1 ? 1 : 2, attunedSetId: setId, iterations: count }))
  const forceTrait = (index: 0 | 1) => {
    if (!selected) return
    const candidates = getEligibleSigilTraits(selected.setId, selected.traitIds)
    if (candidates[index]) addTrait(candidates[index])
  }

  const browserItems = visibleSigils.map((sigil) => ({
    id: sigil.instanceId,
    label: `${SIGIL_SETS[sigil.setId].name} · Slot ${getSigilSlotRoman(sigil.slot)}`,
    meta: `Tier ${sigil.tier} · ${SIGIL_QUALITIES.find((entry) => entry.id === sigil.quality)?.label ?? sigil.quality} · Rank +${sigil.rank}`,
    status: equippedIds.has(sigil.instanceId) ? <Status tone="success">EQUIPPED</Status> : sigil.locked ? <Status tone="warning">LOCKED</Status> : null,
    icon: '◈',
    accent: `var(--sigil-quality-${sigil.quality})`,
  }))

  return <div className="developer-tab-stack developer-sigils-tab">
    <header className="developer-tab-header developer-sigils-header">
      <div><span className="eyebrow">TESTER WORKSPACE · EQUIPMENT</span><h2>Sigil Lab</h2><p>Create controlled instances, exercise rank gates, and inspect real loadout effects.</p></div>
      <div className="developer-sigils-dust-control"><label className="developer-number-field"><span>TEST DUST BALANCE</span><input type="number" min="0" aria-label="Test Dust balance" value={dust} onChange={(event) => setDust(event.target.value)} onBlur={() => useGameStore.getState().debugSetSigilDust(Number(dust))} /></label><GameTooltip content="Add 10,000 Dust to the tester profile."><Button variant="secondary" onClick={() => useGameStore.getState().debugAddSigilDust(10000)}>+10,000 DUST</Button></GameTooltip></div>
    </header>

    <Card title="LIVE SIGIL STATE" className="developer-sigils-overview" action={<Status tone="active">TESTER CONTROLS</Status>}>
      <div className="developer-summary-grid developer-sigil-summary-grid">
        <Summary label="Stored Sigils" value={stored.length.toLocaleString()} />
        <Summary label="Equipped" value={`${equippedIds.size} / ${sigilSlots.length}`} />
        <Summary label="Sigil Dust" value={sigils.dust.toLocaleString()} />
        <Summary label="Enhancement cap" value={`+${enhancementCap}`} />
      </div>
    </Card>

    <div className="developer-sigil-fixture-grid">
      <Card title="CONTROLLED SPAWN" className="developer-debug-card">
        <p className="developer-sigil-card-copy">Choose authored attributes for a deterministic tester instance.</p>
        <div className="developer-sigil-select-grid">
          <Field label="Tier"><SelectMenu portalLayer="modal" ariaLabel="Force Sigil Tier" value={String(tier)} options={tierOptions} onChange={(value) => setTier(Number(value))} /></Field>
          <Field label="Quality"><SelectMenu portalLayer="modal" ariaLabel="Force Sigil Quality" value={quality} options={qualityOptions} onChange={(value) => setQuality(value as SigilQuality)} /></Field>
          <Field label="Set"><SelectMenu portalLayer="modal" ariaLabel="Force Sigil Set" value={setId} options={setOptions} onChange={(value) => setSetId(value as SigilSetId)} /></Field>
          <Field label="Channel"><SelectMenu portalLayer="modal" ariaLabel="Force Sigil Slot" value={String(slot)} options={slotOptions} onChange={(value) => { const next = Number(value) as SigilSlot; setSlot(next); setMainStat(SIGIL_MAIN_STAT_POOLS[next][0]) }} /></Field>
          <Field label="Main stat"><SelectMenu portalLayer="modal" ariaLabel="Force Sigil Main Stat" value={options.includes(mainStat) ? mainStat : options[0]} options={options.map((id) => ({ value: id, label: SIGIL_STAT_DEFINITIONS[id].label }))} onChange={(value) => setMainStat(value as SigilStatId)} /></Field>
        </div>
        <div className="developer-sigil-actions">
          <Button variant="primary" tooltip="Create a Sigil with the selected Tier, Quality, Set, Slot, and Main Stat." onClick={() => spawn()}>SPAWN CONTROLLED SIGIL</Button>
          <Button variant="secondary" tooltip="Create a Sigil with the selected Tier, Quality, Set, and Slot using generated stats." onClick={() => spawn(true)}>SPAWN RANDOM STATS</Button>
        </div>
      </Card>

      <Card title="FREE CRAFTING" className="developer-sigil-craft-card">
        <p className="developer-sigil-card-copy">Exercise both production crafting paths while skipping resource costs.</p>
        <div className="developer-sigil-actions">
          <Button variant="secondary" tooltip="Run the Basic Sigil crafting path for the selected Tier and Set." onClick={() => craft('basic')}>BASIC CRAFT</Button>
          <Button variant="primary" tooltip="Run the Focused Sigil crafting path for the selected Tier, Set, and Slot." onClick={() => craft('focused')}>FOCUSED CRAFT</Button>
        </div>
        <DeveloperSection title="Enhancement behavior"><Toggle label="Ignore global cap" description="Allow free enhancement actions to pass the current Global Cap." checked={ignoreGlobalCap} onChange={setIgnoreGlobalCap} className="developer-sigil-toggle" /><div className="developer-sigil-actions"><Button variant="secondary" disabled={!selected} tooltip="Enhance the selected Sigil by up to three ranks." onClick={() => selected && enhanceTo(selected.instanceId, selected.rank + 3)}>+3 RANKS</Button><Button variant="secondary" disabled={!selected} tooltip="Enhance the selected Sigil to the current Global Cap." onClick={() => selected && enhanceTo(selected.instanceId, enhancementCap)}>TO GLOBAL CAP</Button><Button variant="ghost" disabled={!selected} tooltip="Enhance the selected Sigil to its authored Quality Cap." onClick={() => selected && enhanceTo(selected.instanceId, SIGIL_QUALITIES.find((entry) => entry.id === selected.quality)?.maxRank ?? 0)}>TO QUALITY CAP</Button></div></DeveloperSection>
      </Card>
    </div>

    <Card title="ARRAY FIXTURES">
      <p className="developer-sigil-card-copy">Prepare repeatable equipment arrangements using existing Sigil equip actions.</p>
      <div className="developer-sigil-actions developer-sigil-array-actions">
        <Button variant="danger" tooltip="Unequip Sigils from every channel." onClick={clearEquipped}>CLEAR ARRAY</Button>
        <Button variant="secondary" disabled={!selected} tooltip="Equip the selected Sigil to its authored Slot." onClick={() => selected && useGameStore.getState().equipSigil(selected.instanceId)}>EQUIP SELECTED</Button>
        <Button variant="ghost" disabled={!selected || !equippedIds.has(selected.instanceId)} tooltip="Unequip the selected Sigil from its Slot." onClick={unequipSelected}>UNEQUIP SELECTED</Button>
        <Button variant="secondary" tooltip="Equip stored Sigils across the available channels, in storage order." onClick={() => equipPattern('all')}>FILL CHANNELS</Button>
        <Button variant="secondary" tooltip="Equip up to three authored Set pairs." onClick={() => equipPattern('2+2+2')}>FILL 2 + 2 + 2</Button>
        <Button variant="ghost" tooltip="Equip up to four Sigils from the first Set and two from the next." onClick={() => equipPattern('4+2')}>FILL 4 + 2</Button>
      </div>
    </Card>

    <div className="developer-sigil-inspection-grid">
      <Card title="OWNED SIGILS" className="developer-sigil-browser-card" action={<span className="developer-sigil-count">LATEST {visibleSigils.length} / {stored.length}</span>}>
        <div ref={browserRef} className="developer-browser-panel developer-sigil-browser-panel">
          <DeveloperBrowser items={browserItems} selectedId={selected?.instanceId ?? null} onSelect={choose} emptyMessage="No Sigils yet. Spawn or craft a tester instance to begin." />
        </div>
      </Card>
      <Card title="SELECTED SIGIL" className="developer-sigil-inspector-card" action={selected ? <Status tone={equippedIds.has(selected.instanceId) ? 'success' : 'neutral'}>{equippedIds.has(selected.instanceId) ? 'EQUIPPED' : 'STORED'}</Status> : <Status tone="neutral">NOTHING SELECTED</Status>}>
        <div ref={inspectorRef} className="developer-sigil-inspector-scroll">
          {selected ? <SigilInspectorContent sigil={selected} enhancementCap={enhancementCap} rollQuality={rollQuality} setRollQuality={setRollQuality} manualTrait={activeTrait} traitOptions={eligibleTraits} onSelectTrait={setManualTrait} secondaryOptions={secondaryOptions} onToggleSecondary={toggleSecondary} onAddTrait={addTrait} onForceTrait={forceTrait} onClearTraits={() => configureSelected({ traitIds: [] })} onConfigure={configureSelected} /> : <div className="developer-browser-empty"><strong>NO SIGIL SELECTED</strong><span>Create a Sigil or choose one from the list.</span></div>}
        </div>
      </Card>
    </div>

    <Card title="DROP SIMULATION" className="developer-sigil-simulation-card" action={<Status tone="neutral">READ ONLY</Status>}>
      <p className="developer-sigil-card-copy">Simulate authored drop outcomes without changing the active tester profile.</p>
      <div className="developer-sigil-actions">
        <Button variant="secondary" tooltip="Simulate 100 eligible drops." onClick={() => simulateDrops(100)}>SIMULATE 100</Button>
        <Button variant="secondary" tooltip="Simulate 1,000 eligible drops." onClick={() => simulateDrops(1000)}>SIMULATE 1,000</Button>
        <Button variant="ghost" tooltip="Simulate 10,000 eligible drops." onClick={() => simulateDrops(10000)}>SIMULATE 10,000</Button>
      </div>
      {simulation && <SimulationResults simulation={simulation} />}
    </Card>
  </div>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="developer-sigil-field"><span>{label}</span>{children}</label>
}

function SigilInspectorContent({ sigil, enhancementCap, rollQuality, setRollQuality, manualTrait, traitOptions, onSelectTrait, secondaryOptions, onToggleSecondary, onAddTrait, onForceTrait, onClearTraits, onConfigure }: {
  sigil: SigilInstance
  enhancementCap: number
  rollQuality: number
  setRollQuality: (value: number) => void
  manualTrait: SigilTraitId | undefined
  traitOptions: SigilTraitId[]
  onSelectTrait: (value: SigilTraitId) => void
  secondaryOptions: SigilStatId[]
  onToggleSecondary: (id: SigilStatId) => void
  onAddTrait: (id: SigilTraitId) => void
  onForceTrait: (index: 0 | 1) => void
  onClearTraits: () => void
  onConfigure: (changes: Parameters<ReturnType<typeof useGameStore.getState>['debugConfigureSigil']> extends [string, infer Config] ? Config : never) => void
}) {
  const quality = SIGIL_QUALITIES.find((entry) => entry.id === sigil.quality)
  const tierLabel = SIGIL_TIERS.find((entry) => entry.tier === sigil.tier)?.label ?? `Tier ${sigil.tier}`
  const stats = resolveSigilStatsForInstance(sigil)
  const rollOptions = rollQualityOptions
  return <div className="developer-sigil-inspector-content">
    <div className="developer-inspector-title developer-sigil-identity"><span className="developer-browser-icon" style={{ color: `var(--sigil-quality-${sigil.quality})` }}>◈</span><div><h3>{SIGIL_SETS[sigil.setId].name} Sigil · Slot {getSigilSlotRoman(sigil.slot)}</h3><span>{tierLabel} · {quality?.label ?? sigil.quality} · Rank +{sigil.rank}</span></div></div>
    <div className="developer-summary-grid developer-sigil-detail-summary"><Summary label="Main stat" value={`${SIGIL_STAT_DEFINITIONS[sigil.mainStatId].label} ${formatSigilStatValue(sigil.mainStatId, stats[sigil.mainStatId] ?? 0, true)}`} /><Summary label="Quality cap" value={`+${quality?.maxRank ?? 0}`} /><Summary label="Global cap" value={`+${enhancementCap}`} /><Summary label="Secondary rolls" value={sigil.secondaries.length} /><Summary label="Traits" value={sigil.traitIds.length} /></div>
    <DeveloperSection title="Manual roll editor">
      <Field label="Roll strength"><SelectMenu portalLayer="modal" ariaLabel="Manual roll strength" value={String(rollQuality)} options={rollOptions} onChange={(value) => { const next = Number(value); setRollQuality(next); onConfigure({ rollQuality01: next }) }} /></Field>
      <div className="developer-sigil-toggle-grid">{secondaryOptions.map((id) => <Toggle key={id} label={SIGIL_STAT_DEFINITIONS[id].label} description={`Add or remove the ${SIGIL_STAT_DEFINITIONS[id].label} secondary roll on this tester Sigil.`} checked={sigil.secondaries.some((secondary) => secondary.statId === id)} onChange={() => onToggleSecondary(id)} className="developer-sigil-toggle" />)}</div>
    </DeveloperSection>
    <DeveloperSection title="Trait controls">
      {traitOptions.length > 0 ? <div className="developer-sigil-trait-actions"><Field label="Available Trait"><SelectMenu portalLayer="modal" ariaLabel="Manual Sigil Trait" value={manualTrait ?? traitOptions[0]} options={traitOptions.map((id) => ({ value: id, label: SIGIL_TRAITS[id].name }))} onChange={(value) => onSelectTrait(value as SigilTraitId)} /></Field><Button variant="primary" disabled={!manualTrait} tooltip="Add the selected eligible Trait to this tester Sigil." onClick={() => manualTrait && onAddTrait(manualTrait)}>ADD TRAIT</Button><Button variant="secondary" tooltip="Add the first eligible Trait for this Sigil Set." onClick={() => onForceTrait(0)}>RANDOM TRAIT</Button><Button variant="ghost" disabled={!sigil.traitIds.length} tooltip="Remove every Trait from the selected tester Sigil." onClick={onClearTraits}>CLEAR TRAITS</Button></div> : <p className="muted">No additional Traits are eligible for this Set.</p>}
      {sigil.traitIds.length > 0 && <div className="developer-sigil-trait-list">{sigil.traitIds.map((id) => <GameTooltip key={id} content={SIGIL_TRAITS[id].description}><Status tone="active">{SIGIL_TRAITS[id].name}</Status></GameTooltip>)}</div>}
    </DeveloperSection>
    <DeveloperAdvancedSection title="Advanced Sigil diagnostics"><div className="developer-detail-grid"><span>Instance ID<strong>{sigil.instanceId}</strong></span><span>Set key<strong>{sigil.setId}</strong></span><span>Slot index<strong>{sigil.slot}</strong></span><span>Main Stat key<strong>{sigil.mainStatId}</strong></span></div><pre className="developer-json">{JSON.stringify(sigil, null, 2)}</pre></DeveloperAdvancedSection>
  </div>
}

function SimulationResults({ simulation }: { simulation: SigilDropSimulationResult }) {
  return <div className="developer-sigil-results">
    <div className="developer-summary-grid"><Summary label="Simulated encounters" value={simulation.iterations.toLocaleString()} /><Summary label="Sigils generated" value={simulation.sigilsFound.toLocaleString()} /><Summary label="Auto-salvage estimate" value={`${simulation.autoSalvageDustEstimate.toLocaleString()} Dust`} /></div>
    <div className="developer-sigil-result-grid">
      <ResultGroup title="By tier" entries={simulation.byTier} label={(key) => SIGIL_TIERS.find((entry) => String(entry.tier) === key)?.label ?? ("Tier " + key)} />
      <ResultGroup title="By quality" entries={simulation.byQuality} label={(key) => SIGIL_QUALITIES.find((entry) => entry.id === key)?.label ?? key} />
      <ResultGroup title="By Set" entries={simulation.bySet} label={(key) => SIGIL_SETS[key as SigilSetId]?.name ?? key} />
      <ResultGroup title="By Slot" entries={simulation.bySlot} label={(key) => `Slot ${getSigilSlotRoman(Number(key) as SigilSlot)}`} />
      <ResultGroup title="By Main Stat" entries={simulation.byMainStat} label={(key) => SIGIL_STAT_DEFINITIONS[key as SigilStatId]?.label ?? key} />
    </div>
    <DeveloperAdvancedSection title="Advanced simulation data"><pre className="developer-json">{JSON.stringify(simulation, null, 2)}</pre></DeveloperAdvancedSection>
  </div>
}

function ResultGroup({ title, entries, label }: { title: string; entries: Record<string, number>; label: (key: string) => string }) {
  return <section className="developer-sigil-result-group"><h4>{title}</h4>{Object.entries(entries).length ? Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)).map(([key, count]) => <div key={key}><span>{label(key)}</span><b>{count.toLocaleString()}</b></div>) : <small>No results.</small>}</section>
}
