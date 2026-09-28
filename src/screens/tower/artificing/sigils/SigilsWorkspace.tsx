import { useEffect, useMemo, useState } from 'react'
import { LockKeyhole, Sparkles, Trash2, Unlock } from 'lucide-react'
import { Button, GameTooltip, SelectMenu, Toggle } from '../../../../components/ui'
import { SigilBrowser } from '../../../../components/sigils/browser/SigilBrowser'
import { SigilInspector } from '../../../../components/sigils/SigilInspector'
import { SigilSetSummary } from '../../../../components/sigils/SigilPresentation'
import { SIGIL_QUALITIES } from '../../../../game/content/sigils/sigilQualities'
import { SIGIL_CRAFT_QUALITY_WEIGHTS } from '../../../../game/content/sigils/sigilDropConfig'
import { getHighestCraftableSigilTier, SIGIL_TIERS } from '../../../../game/content/sigils/sigilTiers'
import { getSigilCraftCost } from '../../../../game/systems/sigils/sigilCrafting'
import { SIGIL_SETS } from '../../../../game/content/sigils/sigilSets'
import { getEquippedSigilSetCounts, getSigilEnhancementCap, getSigilEnhancementCapView, getSigilEnhancementCost } from '../../../../game/systems/sigils/sigilRuntime'
import type { SigilInstance, SigilSetId, SigilSlot } from '../../../../game/types'
import { useGameStore } from '../../../../store/gameStore'
import { InspectorTransition } from '../../../../ui/game-feel/InspectorTransition'
import { setNavigationIntent, useNavigationIntent } from '../../../../ui/navigation/navigationIntent'
import { setUiPreferences, useUiPreferences } from '../../../../ui/preferences/uiPreferencesStore'

const TABS = [{ value: 'refinement', label: 'REFINEMENT', note: 'Enhance and protect owned Sigils.' }, { value: 'forge', label: 'FORGE', note: 'Craft targeted Sigils with Sigil Dust.' }, { value: 'attunement', label: 'ATTUNEMENT', note: 'Tune Set resonance and salvage rules.' }] as const
type SigilTab = typeof TABS[number]['value']

export function SigilsWorkspace() {
  const state = useGameStore()
  const preferences = useUiPreferences().screenState.artificing
  const navigation = useNavigationIntent()
  const [revealId, setRevealId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(() => Object.values(state.sigils.equipped).find((id): id is string => Boolean(id)) ?? Object.keys(state.sigils.storage).slice(-1)[0] ?? null)
  const selected = selectedId ? state.sigils.storage[selectedId] : undefined
  const cap = getSigilEnhancementCap(state)
  const capView = getSigilEnhancementCapView(state)
  const tab = preferences.sigilTab

  useEffect(() => {
    const instanceId = navigation.artificingSigilInstanceId
    if (!instanceId) return
    setSelectedId(state.sigils.storage[instanceId] ? instanceId : null)
    setRevealId(state.sigils.storage[instanceId] ? instanceId : null)
    setUiPreferences({ screenState: { artificing: { mode: 'sigils', sigilTab: navigation.artificingSigilTab ?? 'refinement' } } })
    setNavigationIntent({ artificingSigilTab: null, artificingSigilInstanceId: null })
  }, [navigation.artificingSigilInstanceId, navigation.artificingSigilTab, state.sigils.storage])

  const setTab = (next: SigilTab) => setUiPreferences({ screenState: { artificing: { sigilTab: next } } })
  const title = TABS.find(({ value }) => value === tab)?.note ?? TABS[0].note
  return <section className="sigil-artificing-workspace">
    <header className="sigil-artificing-heading">
      <div><span className="eyebrow">ARTIFICING · SIGILS</span><h2>ARCANE SIGIL WORKSHOP</h2><p>Forge, refine, and attune combat-born Sigils.</p></div>
      <div className="sigil-workshop-resources"><span><small>SIGIL DUST</small><b>{state.sigils.dust.toLocaleString()}</b></span><span><small>STORED</small><b>{Object.keys(state.sigils.storage).length}</b></span><span><small>GLOBAL CAP</small><b>+{capView.current}</b></span></div>
    </header>
    <nav className="sigil-artificing-tabs" role="tablist" aria-label="Sigil workshop">
      {TABS.map(({ value, label }) => <Button key={value} type="button" variant="ghost" role="tab" aria-selected={tab === value} ariaPressed={tab === value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{label}</Button>)}
    </nav>
    <p className="sigil-workshop-tab-note">{title}</p>
    {tab === 'refinement' && <RefinementWorkspace selected={selected} selectedId={selectedId} revealId={revealId} onSelect={setSelectedId} onRevealConsumed={() => setRevealId(null)} cap={cap} onOpenEquipment={() => { setNavigationIntent({ openSigilVault: true, equipmentSigilInstanceId: null, equipmentSigilSlot: null }); useGameStore.getState().setScreen('equipment') }} />}
    {tab === 'forge' && <ForgeWorkspace />}
    {tab === 'attunement' && <AttunementWorkspace />}
  </section>
}

function RefinementWorkspace({ selected, selectedId, revealId, onSelect, onRevealConsumed, cap, onOpenEquipment }: { selected?: SigilInstance; selectedId: string | null; revealId: string | null; onSelect: (instanceId: string | null) => void; onRevealConsumed: () => void; cap: number; onOpenEquipment: () => void }) {
  const state = useGameStore()
  const equippedIds = useMemo(() => new Set(Object.values(state.sigils.equipped).filter((id): id is string => Boolean(id))), [state.sigils.equipped])
  const equipped = selected ? equippedIds.has(selected.instanceId) : false
  const setCount = selected ? getEquippedSigilSetCounts(state)[selected.setId] ?? 0 : 0
  const maxRank = selected ? SIGIL_QUALITIES.find(({ id }) => id === selected.quality)?.maxRank ?? 0 : 0
  const nextCost = selected ? getSigilEnhancementCost(selected, selected.rank + 1) : 0
  const atCap = !selected || selected.rank >= maxRank || selected.rank >= cap
  const insufficientDust = Boolean(selected && state.sigils.dust < nextCost)
  const notify = (message: string, tone: 'success' | 'warning' = 'warning') => useGameStore.getState().notifySigil(message, tone)
  const enhance = () => { if (!selected) return; const result = useGameStore.getState().enhanceSigil(selected.instanceId); if (!result.ok) notify(result.reason ?? 'Unable to enhance.'); else notify('Enhanced to +' + result.rank + '.', 'success') }
  const salvage = () => { if (!selected) return; const result = useGameStore.getState().salvageSigil(selected.instanceId); if (!result.ok) notify(result.reason ?? 'Unable to salvage.'); else onSelect(null) }
  const toggleLock = () => { if (!selected) return; const result = useGameStore.getState().toggleSigilLock(selected.instanceId); if (!result.ok) notify(result.reason ?? 'Unable to change salvage protection.') }

  const footer = selected && <div className="sigil-refinement-actions">
    <GameTooltip content={equipped ? 'Unequip this Sigil in the Equipment Vault before salvage.' : selected.locked ? 'Unlock this Sigil before salvage.' : 'Convert this Sigil into Sigil Dust.'}><Button type="button" variant="danger" disabled={equipped || selected.locked} onClick={salvage}><Trash2 size={14} /> SALVAGE</Button></GameTooltip>
    <GameTooltip content={atCap ? selected.rank >= maxRank ? 'This quality has reached its maximum rank.' : 'Global enhancement cap is +' + cap + '.' : insufficientDust ? 'Requires ' + nextCost + ' Sigil Dust.' : 'Spend ' + nextCost + ' Sigil Dust for the next roll.'}><Button type="button" variant="primary" disabled={atCap || insufficientDust} onClick={enhance}><Sparkles size={14} /> ENHANCE · {nextCost}</Button></GameTooltip>
    <GameTooltip content={selected.locked ? 'Unlock this Sigil before changing salvage protection.' : 'Protect this Sigil from accidental salvage.'}><Button type="button" variant="ghost" onClick={toggleLock}>{selected.locked ? <Unlock size={14} /> : <LockKeyhole size={14} />}{selected.locked ? 'UNLOCK' : 'LOCK'}</Button></GameTooltip>
    <Button type="button" variant="secondary" onClick={onOpenEquipment}>OPEN IN EQUIPMENT</Button>
  </div>

  return <div className="sigil-refinement-layout">
    <SigilBrowser storage={state.sigils.storage} equipped={state.sigils.equipped} selectedId={selectedId} onSelect={onSelect} revealInstanceId={revealId} onRevealConsumed={onRevealConsumed} label="SIGIL STORAGE" />
    <SigilInspector sigil={selected} cap={cap} setCount={setCount} footer={footer} className="sigil-refinement-inspector" />
  </div>
}

function ForgeWorkspace() {
  const state = useGameStore()
  const maxTier = getHighestCraftableSigilTier(state.sigils.highestSourcePowerDefeated)
  const [tier, setTier] = useState<number>(maxTier)
  const [setId, setSetId] = useState<SigilSetId>('arcane')
  const [slot, setSlot] = useState<SigilSlot>(1)
  useEffect(() => { if (tier > maxTier) setTier(maxTier) }, [tier, maxTier])
  const costs = { basic: getSigilCraftCost('basic', tier), focused: getSigilCraftCost('focused', tier) }
  const craft = (mode: 'basic' | 'focused') => {
    const result = useGameStore.getState().craftSigil(mode, tier, setId, mode === 'focused' ? slot : undefined)
    if (!result.ok) useGameStore.getState().notifySigil(result.reason ?? 'Unable to craft.')
    else useGameStore.getState().notifySigil('Sigil forged and added to storage.', 'success')
  }
  const weights = SIGIL_CRAFT_QUALITY_WEIGHTS[tier]
  return <div className="sigil-forge-workspace">
    <div className="sigil-forge-settings">
      <div><span className="eyebrow">CRAFTING PARAMETERS</span><h3>Choose your target</h3><p>Focused crafting fixes the Slot. Main Stat and Quality remain random.</p></div>
      <div className="sigil-forge-pickers">
        <SelectMenu options={SIGIL_TIERS.filter((definition) => definition.tier <= maxTier).map((definition) => ({ value: String(definition.tier), label: 'Tier ' + definition.tier }))} value={String(tier)} onChange={(value) => setTier(Number(value))} ariaLabel="Craft Tier" prefix="TIER · " />
        <SelectMenu options={Object.entries(SIGIL_SETS).map(([id, set]) => ({ value: id, label: set.name }))} value={setId} onChange={(value) => setSetId(value as SigilSetId)} ariaLabel="Target Set" prefix="SET · " />
        <SelectMenu options={[1, 2, 3, 4, 5, 6].map((value) => ({ value: String(value), label: 'Slot ' + ['I', 'II', 'III', 'IV', 'V', 'VI'][value - 1] }))} value={String(slot)} onChange={(value) => setSlot(Number(value) as SigilSlot)} ariaLabel="Focused Slot" prefix="SLOT · " />
      </div>
    </div>
    <div className="sigil-forge-recipes">
      <article className="sigil-forge-recipe"><div><span className="eyebrow">BASIC CRAFT</span><h3>Random Slot</h3><p>Craft a {SIGIL_SETS[setId].name} Sigil at Tier {tier}. Slot, Main Stat, and Quality are rolled.</p></div><div className="sigil-quality-odds">{Object.entries(weights).map(([quality, chance]) => <span key={quality} className={'quality-' + quality}>{quality}<b>{chance}%</b></span>)}</div><GameTooltip content={state.sigils.dust < costs.basic ? 'Requires ' + costs.basic + ' Sigil Dust.' : costs.basic + ' Sigil Dust · random Slot.'}><Button type="button" variant="secondary" disabled={state.sigils.dust < costs.basic} onClick={() => craft('basic')}>CRAFT · {costs.basic} DUST</Button></GameTooltip></article>
      <article className="sigil-forge-recipe focused"><div><span className="eyebrow">FOCUSED CRAFT</span><h3>Slot {['I', 'II', 'III', 'IV', 'V', 'VI'][slot - 1]}</h3><p>Fix the Slot and Set. Main Stat and Quality remain random.</p></div><div className="sigil-quality-odds">{Object.entries(weights).map(([quality, chance]) => <span key={quality} className={'quality-' + quality}>{quality}<b>{chance}%</b></span>)}</div><GameTooltip content={state.sigils.dust < costs.focused ? 'Requires ' + costs.focused + ' Sigil Dust.' : costs.focused + ' Sigil Dust · Slot ' + ['I', 'II', 'III', 'IV', 'V', 'VI'][slot - 1] + '.'}><Button type="button" variant="primary" disabled={state.sigils.dust < costs.focused} onClick={() => craft('focused')}>FOCUSED · {costs.focused} DUST</Button></GameTooltip></article>
    </div>
    <div className="sigil-forge-resource"><span>AVAILABLE DUST</span><b>{state.sigils.dust.toLocaleString()}</b><span>Crafted Sigils are added to Storage and can be enhanced in Refinement.</span></div>
  </div>
}

function AttunementWorkspace() {
  const state = useGameStore()
  const discoveredSets = Object.keys(state.sigils.discovery.discoveredSets).filter((id) => state.sigils.discovery.discoveredSets[id as SigilSetId]) as SigilSetId[]
  return <div className="sigil-attunement-workspace">
    <section className="sigil-attunement-settings"><span className="eyebrow">SET RESONANCE</span><h3>Attuned Set</h3><p>Attunement increases the chance of finding Sigils from a discovered Set.</p><SelectMenu options={[{ value: 'none', label: 'No attunement' }, ...discoveredSets.map((id) => ({ value: id, label: SIGIL_SETS[id].name }))]} value={state.sigils.attunedSetId ?? 'none'} onChange={(value) => { useGameStore.getState().setSigilAttunement(value === 'none' ? null : value as SigilSetId) }} ariaLabel="Attuned Sigil Set" prefix="SET · " /></section>
    <section className="sigil-attunement-settings"><span className="eyebrow">SALVAGE PROTECTION</span><h3>Auto-salvage</h3><p>First discoveries are added to your collection before automatic salvage runs.</p><Toggle label="Common Sigils" description="Convert new Common Sigils to Sigil Dust." checked={state.sigils.autoSalvage.common} onChange={(value) => useGameStore.getState().setSigilAutoSalvage('common', value)} /><Toggle label="Refined Sigils" description="Convert new Refined Sigils to Sigil Dust." checked={state.sigils.autoSalvage.refined} onChange={(value) => useGameStore.getState().setSigilAutoSalvage('refined', value)} /></section>
  </div>
}
