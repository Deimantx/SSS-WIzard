import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BookOpen, Compass, Crosshair, MapPin, PawPrint, RotateCcw, Shield, Sparkles } from 'lucide-react'
import { Button, Card, FilterBar, GameTooltip, SearchInput, SelectMenu, Status, type FilterOption, type SelectMenuOption } from '../../components/ui'
import { MonsterPortrait } from '../combat/MonsterPortrait'
import { BestiaryAbilities } from '../bestiary/BestiaryAbilities'
import { BestiaryBossMechanics } from '../bestiary/BestiaryBossMechanics'
import { BestiaryBossPhases } from '../bestiary/BestiaryBossPhases'
import { BestiaryLootTable } from '../bestiary/BestiaryLootTable'
import { BestiaryResonanceYield } from '../bestiary/BestiaryResonanceYield'
import { BestiarySequence } from '../bestiary/BestiarySequence'
import { BestiarySigilDrops } from '../bestiary/BestiarySigilDrops'
import { BestiaryStats } from '../bestiary/BestiaryStats'
import { BestiaryTraits } from '../bestiary/BestiaryTraits'
import { DUNGEONS } from '../../game/content/combat-locations/dungeons/dungeons'
import { HUNTER_GROUNDS } from '../../game/content/hunters-order/hunterGrounds'
import { HUNTER_STANDINGS } from '../../game/content/hunters-order/hunterRanks'
import { HUNTER_EXCLUSIVE_MONSTER_IDS } from '../../game/content/monsters/first-frontier/gloamridge'
import { MONSTERS, isBossMonster } from '../../game/content/monsters'
import { getBestiaryEntryPresentation } from '../../game/presentation/bestiary/bestiaryEntryPresentation'
import { getHunterContractCombatPresentation, getMonsterHunterContractRelation } from '../../game/presentation/huntersOrder/hunterContractCombatPresentation'
import { getEligibleHunterContractMembers, getHunterAuthorization, getHunterBlockSlotCount, getHunterBlockableTargets, doesMonsterMatchHunterContract, getHunterUpgradeRank, isHunterMonsterRankEligible } from '../../game/systems/hunters-order/huntersOrderRuntime'
import { getBestiaryCompletion, getBestiaryEntries, getBestiarySearchText, getMonsterLocationEntries } from '../../game/systems/bestiary/bestiarySelectors'
import { useGameStore } from '../../store/gameStore'
import { formatBasicAttackTime, getMonsterDossierCombatStats } from '../../game/presentation/combat/enemyCombatStatPresentation'
import { formatNumber } from '../../game/utils'
import { resolveEnemyPowerRating } from '../../game/systems/combat/enemyPower'
import { InspectorTransition } from '../../ui/game-feel/InspectorTransition'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'
import { clearAttention, useProfileAttention } from '../../ui/attention/attentionStore'
import { getActiveProfileId } from '../../profiles/profileSessionStore'
import { openHunterContractInCombat } from '../../ui/navigation/hunterContractNavigation'
import { openHuntersOrderTab } from '../../ui/navigation/hunterOrderNavigation'
import { setNavigationIntent, useNavigationIntent } from '../../ui/navigation/navigationIntent'
import type { CombatLocationId, GameState, MonsterId } from '../../game/types'

type PrimaryFilter = 'all' | 'hunter' | 'contract' | 'discovered' | 'bosses'
type DossierTab = 'overview' | 'combat' | 'rewards' | 'record'
type MetadataFilter = string | null

const primaryOptions: FilterOption<PrimaryFilter>[] = [
  { value: 'all', label: 'ALL' }, { value: 'hunter', label: 'HUNTER QUARRY' }, { value: 'contract', label: 'CONTRACT TARGETS' }, { value: 'discovered', label: 'DISCOVERED' }, { value: 'bosses', label: 'BOSSES' },
]
const dossierTabs: FilterOption<DossierTab>[] = [
  { value: 'overview', label: 'OVERVIEW' }, { value: 'combat', label: 'COMBAT' }, { value: 'rewards', label: 'REWARDS' }, { value: 'record', label: 'HUNTER RECORD' },
]
const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b))
const locationOptions: SelectMenuOption<string>[] = HUNTER_GROUNDS.map(({ id, name }) => ({ value: id, label: name }))
const familyOptions: SelectMenuOption<string>[] = unique(HUNTER_EXCLUSIVE_MONSTER_IDS.map((id) => MONSTERS[id].hunter!.family)).map((value) => ({ value, label: value }))
const alignmentOptions: SelectMenuOption<string>[] = unique(HUNTER_EXCLUSIVE_MONSTER_IDS.map((id) => MONSTERS[id].hunter!.alignment)).map((value) => ({ value, label: value }))
const tierOptions: SelectMenuOption<string>[] = ['routine', 'special', 'prestigious'].map((value) => ({ value, label: value.toUpperCase() }))
const optionsWithAll = (options: readonly SelectMenuOption<string>[], label: string) => [{ value: '', label: `ALL ${label}` }, ...options]

export function HunterBestiaryTab() {
  const state = useGameStore()
  const { progress } = state
  const [search, setSearch] = useState('')
  const [primary, setPrimary] = useState<PrimaryFilter>('all')
  const [family, setFamily] = useState<MetadataFilter>(null)
  const [alignment, setAlignment] = useState<MetadataFilter>(null)
  const [tier, setTier] = useState<MetadataFilter>(null)
  const [region, setRegion] = useState<MetadataFilter>(null)
  const [selected, setSelected] = useState<MonsterId | null>(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 760px)').matches ? null : progress.discoveredMonsters[0] ?? null)
  const [mobileDossier, setMobileDossier] = useState(false)
  const [dossierTab, setDossierTab] = useState<DossierTab>('overview')
  const listRef = useRef<HTMLDivElement>(null)
  const navigationIntent = useNavigationIntent()
  const attention = useProfileAttention(getActiveProfileId())
  const contract = getHunterContractCombatPresentation(state)
  const activeGroundName = contract.contract ? DUNGEONS[contract.contract.huntingGroundId ?? 'hunters-ground']?.name ?? 'Hunting Ground' : 'Hunting Ground'
  const completion = getBestiaryCompletion(state)
  const knownQuarry = HUNTER_EXCLUSIVE_MONSTER_IDS.filter((id) => progress.discoveredMonsters.includes(id)).length
  const clearFilters = () => { setPrimary('all'); setFamily(null); setAlignment(null); setTier(null); setRegion(null); setSearch('') }
  const filteredEntries = useMemo(() => getBestiaryEntries().filter((monster) => {
    const discovered = progress.discoveredMonsters.includes(monster.id)
    if (primary === 'hunter' && !monster.hunter?.exclusive) return false
    if (primary === 'contract' && !contract.matchingMonsterIds.includes(monster.id)) return false
    if (primary === 'discovered' && !discovered) return false
    if (primary === 'bosses' && !isBossMonster(monster)) return false
    if (family && monster.hunter?.family !== family) return false
    if (alignment && monster.hunter?.alignment !== alignment) return false
    if (tier && monster.hunter?.contractTier !== tier) return false
    if (region && monster.hunter?.huntingGroundId !== region) return false
    if (search.trim() && (!discovered || !getBestiarySearchText(monster).includes(search.trim().toLowerCase()))) return false
    return true
  }), [progress, primary, contract.matchingMonsterIds.join('|'), family, alignment, tier, region, search])
  useSmartScrollState(listRef, { dependencies: [filteredEntries.map((entry) => entry.id).join('|')] })
  const selectedMonster = selected ? MONSTERS[selected] : null
  const discoveredSelected = Boolean(selected && progress.discoveredMonsters.includes(selected))
  const clearAttentionFor = (monsterId: MonsterId) => clearAttention(getActiveProfileId(), 'monster', monsterId)
  const openDossier = (monsterId: MonsterId) => { clearAttentionFor(monsterId); setSelected(monsterId); setMobileDossier(true) }
  const anyFilter = primary !== 'all' || family !== null || alignment !== null || tier !== null || region !== null || search.trim().length > 0
  const quarryGroups = useMemo(() => {
    if (primary !== 'hunter' && primary !== 'contract') return [{ groundId: 'catalog', entries: filteredEntries }]
    const groups = new Map<string, typeof filteredEntries>()
    filteredEntries.filter((entry) => entry.hunter?.exclusive).forEach((entry) => { const groundId = entry.hunter?.huntingGroundId ?? 'hunters-ground'; groups.set(groundId, [...(groups.get(groundId) ?? []), entry]) })
    return [...groups.entries()].map(([groundId, entries]) => ({ groundId, entries }))
  }, [primary, filteredEntries])

  useEffect(() => {
    const requestedMonsterId = navigationIntent.combatMonsterId
    if (!requestedMonsterId || !MONSTERS[requestedMonsterId]) return
    setSelected(requestedMonsterId)
    clearAttentionFor(requestedMonsterId)
    setMobileDossier(true)
    setNavigationIntent({ combatMonsterId: null, combatLocationId: null })
  }, [navigationIntent.combatMonsterId])

  return <div className={`hunter-bestiary-workspace${mobileDossier ? ' is-mobile-dossier' : ''}`}>
    <section className="hunter-field-intelligence" aria-label="Field Intelligence">
      <div className="hunter-field-intelligence-title"><h2>FIELD INTELLIGENCE</h2><strong>{activeGroundName.toUpperCase()} DIVISION</strong></div>
      <Metric label="HUNTER QUARRY" value={`${knownQuarry} / ${HUNTER_EXCLUSIVE_MONSTER_IDS.length}`} />
      <Metric label="TOTAL BESTIARY" value={`${completion.discovered} / ${completion.total}`} />
      <Metric label="TOTAL DEFEATS" value={completion.totalDefeats.toLocaleString()} />
      <div className="hunter-field-contract"><span>ACTIVE CONTRACT · {activeGroundName.toUpperCase()}</span>{contract.active ? <><strong>{contract.label}</strong><small>{contract.progress.toLocaleString()} / {contract.target.toLocaleString()}</small><GameTooltip content={`Open ${activeGroundName} with an eligible quarry selected. Combat does not start automatically.`}><Button variant="ghost" onClick={() => openHunterContractInCombat(state, state.setScreen)}>OPEN {activeGroundName.toUpperCase()}</Button></GameTooltip></> : <><strong>NO ACTIVE CONTRACT</strong><GameTooltip content="Choose or request a Hunt Contract from the Order board."><Button variant="ghost" onClick={() => openHuntersOrderTab('contracts')}>OPEN CONTRACTS</Button></GameTooltip></>}</div>
    </section>
    <div className="hunter-bestiary-columns">
      <Card className="hunter-quarry-index" title="QUARRY INDEX">
        <div className="hunter-quarry-index-heading"><span>{filteredEntries.length} ENTRIES</span>{anyFilter && <Button variant="ghost" onClick={clearFilters}><RotateCcw size={13} /> CLEAR FILTERS</Button>}</div>
        <div className="hunter-quarry-index-controls">
          <div className="hunter-bestiary-search"><SearchInput ariaLabel="Search creatures" value={search} onChange={setSearch} placeholder="Search discovered creatures..." /></div>
          <FilterBar options={primaryOptions} value={primary} onChange={setPrimary} ariaLabel="Quarry index filters" />
          <div className="hunter-bestiary-metadata-filters">
            <SelectMenu options={optionsWithAll(familyOptions, 'FAMILY')} value={family ?? ''} onChange={(value) => setFamily(value || null)} ariaLabel="Filter by family" prefix="FAMILY · " />
            <SelectMenu options={optionsWithAll(alignmentOptions, 'ALIGNMENT')} value={alignment ?? ''} onChange={(value) => setAlignment(value || null)} ariaLabel="Filter by alignment" prefix="ALIGNMENT · " />
            <SelectMenu options={optionsWithAll(tierOptions, 'TIER')} value={tier ?? ''} onChange={(value) => setTier(value || null)} ariaLabel="Filter by Contract tier" prefix="TIER · " />
            <SelectMenu options={optionsWithAll(locationOptions, 'REGION')} value={region ?? ''} onChange={(value) => setRegion(value || null)} ariaLabel="Filter by region" prefix="REGION · " />
          </div>
        </div>
        <div ref={listRef} className="hunter-quarry-index-list smart-scroll-region">
          {quarryGroups.map((group) => <section className="hunter-quarry-ground-group" key={group.groundId}>{group.groundId !== 'catalog' && <header><strong>{HUNTER_GROUNDS.find((ground) => ground.id === group.groundId)?.name ?? group.groundId}</strong><span>{group.entries.length} QUARRY</span></header>}<div className="hunter-quarry-tile-grid">{group.entries.map((monster) => {
            const entry = getBestiaryEntryPresentation(state, monster.id, (monster.hunter?.huntingGroundId ?? 'hunters-ground') as CombatLocationId)!
            const relation = entry.hunter?.relation
            return <button key={monster.id} type="button" className={`hunter-quarry-tile${selected === monster.id ? ' is-selected' : ''}${entry.discovered ? '' : ' is-undiscovered'}`} aria-pressed={selected === monster.id} onClick={() => openDossier(monster.id)}>
              {(() => { const dossierReveal = !entry.discovered && getHunterUpgradeRank(state, 'master-dossier') > 0 && isHunterMonsterRankEligible(state, monster.id); return <><span className="hunter-quarry-tile-portrait">{entry.discovered ? <MonsterPortrait monster={monster} boss={entry.boss} /> : <span aria-hidden="true">{dossierReveal ? '◈' : '?'}</span>}</span>
              <span className="hunter-quarry-tile-copy"><strong>{dossierReveal ? monster.name : entry.name}</strong>{entry.discovered ? <><small className="hunter-quarry-role-tags">{entry.roleTags.slice(0, 3).join(' · ') || entry.category.toUpperCase()}</small><span className="hunter-quarry-classification"><b>{entry.hunter?.tier.toUpperCase() ?? entry.category.toUpperCase()}</b>{entry.family && <i>{entry.family}</i>}</span><small>{entry.alignment ?? entry.locations[0] ?? 'Unknown location'}{entry.defeats !== null ? ` · ${entry.defeats} defeats` : ''}</small></> : dossierReveal ? <><span className="hunter-quarry-classification"><b>{monster.hunter?.contractTier.toUpperCase()}</b><i>{monster.hunter?.family}</i></span><small>{monster.hunter?.alignment} · Dossier</small></> : <><small>{entry.locations[0] ?? 'Unknown region'} · Not yet encountered</small></>}</span></> })()}
              {entry.discovered && attention.unseenMonsters.includes(monster.id) && <span className="hunter-quarry-new">NEW</span>}
              {entry.discovered && relation === 'exact-target' && <Status tone="active">CONTRACT TARGET</Status>}
              {entry.discovered && relation === 'eligible' && <Status tone="active">COUNTS</Status>}
              {entry.discovered && relation === 'matching-but-locked' && <Status tone="warning">LOCKED QUARRY</Status>}
            </button>
          })}</div></section>)}
          {filteredEntries.length === 0 && <div className="hunter-quarry-empty"><BookOpen size={22} /><strong>No quarry matches this view.</strong><span>Clear a filter or change the search terms.</span></div>}
        </div>
      </Card>
      <InspectorTransition identity={selected} accent={selectedMonster?.color} fill>
        <HunterQuarryDossier state={state} monster={selectedMonster} selectedId={selected} discovered={discoveredSelected} tab={dossierTab} onTab={setDossierTab} onBack={() => setMobileDossier(false)} />
      </InspectorTransition>
    </div>
  </div>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="hunter-field-metric"><span>{label}</span><strong>{value}</strong></div> }

function HunterQuarryDossier({ state, monster, selectedId, discovered, tab, onTab, onBack }: { state: GameState; monster: (typeof MONSTERS)[keyof typeof MONSTERS] | null; selectedId: MonsterId | null; discovered: boolean; tab: DossierTab; onTab: (tab: DossierTab) => void; onBack: () => void }) {
  const methods = useGameStore.getState()
  const contentRef = useRef<HTMLDivElement>(null)
  useSmartScrollState(contentRef, { resetKey: selectedId })
  const progress = state.progress
  const worldTier = state.worldTier.current
  const isHunter = Boolean(monster?.hunter?.exclusive)
  const masterDossierAvailable = Boolean(!discovered && monster?.hunter?.exclusive && getHunterUpgradeRank(state, 'master-dossier') > 0 && isHunterMonsterRankEligible(state, monster.id))
  const groundId = (monster?.hunter?.huntingGroundId ?? 'hunters-ground') as CombatLocationId
  const groundName = DUNGEONS[groundId]?.name ?? 'Hunting Ground'
  const huntInGround = () => {
    if (!monster || !selectedId || !monster.hunter?.exclusive || !authorized) return
    methods.rememberHunterQuarry(selectedId, groundId)
    openHunterContractInCombat(state, methods.setScreen, selectedId)
  }
  const relation = selectedId && isHunter ? getMonsterHunterContractRelation(state, selectedId, groundId) : 'not-eligible'
  const authorization = selectedId && isHunter ? getHunterAuthorization(state, selectedId, groundId) : { authorized: false as const, reason: 'target-not-authorized' as const }
  const contract = progress.huntersOrder.activeContract
  const authorized = relation === 'exact-target' || relation === 'eligible'
  const blockSlots = getHunterBlockSlotCount(state)
  const blocked = selectedId ? progress.huntersOrder.blockedTargets.includes(selectedId) : false
  const activeTarget = Boolean(contract && selectedId && getEligibleHunterContractMembers(state, contract, contract.huntingGroundId ?? 'hunters-ground').includes(selectedId))
  const canBlock = Boolean(selectedId && isHunter && getHunterBlockableTargets(state).includes(selectedId) && blockSlots > 0 && (blocked || progress.huntersOrder.blockedTargets.length < blockSlots) && !activeTarget)
  const record = selectedId ? progress.huntersOrder.monsterHunterStats[selectedId] : undefined
  const stats = monster && discovered ? getMonsterDossierCombatStats(monster) : null
  const locationNames = monster && discovered ? getMonsterLocationEntries(monster.id).map((location) => location.name) : []
  const locationName = locationNames[0] ?? 'Unknown location'
  const authLabel = authorization.authorized ? relation === 'exact-target' ? 'AUTHORIZED QUARRY' : 'COUNTS FOR ACTIVE CONTRACT' : authorization.reason === 'contract-tier-locked' && monster?.hunter?.minimumRank ? 'MASTER HUNTER REQUIRED' : contract ? 'CONTRACT DOES NOT AUTHORIZE' : 'NO HUNT AUTHORIZATION'
  const authDescription = authorization.authorized ? relation === 'exact-target' ? `This creature is your active Contract target. ${contract?.progress ?? 0} / ${contract?.target ?? 0} kills recorded.` : 'This creature can advance the active broad Contract.' : authorization.reason === 'contract-tier-locked' && monster?.hunter?.minimumRank ? 'Earn Master Hunter standing and accept a prestigious assignment.' : contract ? 'The active Contract does not authorize this creature.' : 'Accept a matching Hunt Contract before engaging Order quarry.'

  return <Card className="hunter-quarry-dossier" title="QUARRY DOSSIER">
    <div className="hunter-dossier-mobile-back"><Button variant="ghost" onClick={onBack}>BACK TO QUARRY INDEX</Button></div>
    {!selectedId ? <div className="hunter-dossier-empty"><Compass size={30} /><strong>SELECT A QUARRY</strong><span>Choose a creature to review its field record.</span></div> : masterDossierAvailable && monster ? <section className="hunter-master-dossier"><div className="hunter-dossier-kicker">MASTER DOSSIER · LIMITED INTELLIGENCE</div><h2>{monster.name}</h2><p>This Order dossier reveals contract identity metadata. Combat capabilities and rewards remain sealed until encounter.</p><dl><div><dt>HUNTING GROUND</dt><dd>{DUNGEONS[groundId]?.name ?? 'Unknown ground'}</dd></div><div><dt>FAMILY</dt><dd>{monster.hunter?.family}</dd></div><div><dt>ALIGNMENT</dt><dd>{monster.hunter?.alignment}</dd></div><div><dt>CONTRACT TIER</dt><dd>{monster.hunter?.contractTier}</dd></div><div><dt>MINIMUM STANDING</dt><dd>{HUNTER_STANDINGS.find((standing) => standing.rankId === monster.hunter?.minimumRank)?.name ?? 'Tracker I'}</dd></div></dl><Status tone="neutral">ENCOUNTER TO UNSEAL FULL DOSSIER</Status></section> : !monster || !discovered ? <div className="hunter-dossier-empty"><span className="hunter-unknown-glyph">?</span><strong>UNKNOWN QUARRY</strong><span>{monster ? getMonsterLocationEntries(monster.id)[0]?.name ?? 'Uncharted region' : 'The dossier is unavailable.'} · Encounter this creature to reveal combat and reward details.</span></div> : <>
      <header className="hunter-dossier-hero">
        <MonsterPortrait monster={monster} boss={isBossMonster(monster)} />
        <div className="hunter-dossier-identity"><span className="hunter-dossier-kicker">{monster.hunter?.exclusive ? `${monster.hunter.contractTier.toUpperCase()} QUARRY` : monster.bestiaryCategory.toUpperCase()}</span><h2>{monster.name}</h2><p>{monster.subtitle}</p>
          <div className="hunter-dossier-tags">{(monster.ui?.bestiary?.roleTags ?? []).map((tag) => <Status key={tag} tone="neutral">{tag}</Status>)}</div>
          <div className="hunter-dossier-location"><MapPin size={13} />{locationNames.join(' · ') || 'Unknown location'} <span>·</span> {formatNumber(progress.lifetimeKillsByMonster[monster.id] ?? progress.bossKillsByBoss[monster.id] ?? 0)} defeats</div>
        </div>
      </header>
      {stats && <div className="hunter-dossier-metrics">{[
        ['POWER', formatNumber(resolveEnemyPowerRating(monster.id, worldTier))], ['HP', formatNumber(stats.maxHealth)], ['DEFENSE', formatNumber(stats.defense)], ['ATTACK', formatBasicAttackTime(stats.basicAttackIntervalMs)],
      ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}
      {isHunter && <section className={`hunter-authorization-panel${authorized ? ' is-authorized' : ' is-locked'}`}><div><span>{authLabel}</span><strong>{authDescription}</strong>{relation === 'exact-target' && contract && <small>{contract.progress.toLocaleString()} / {contract.target.toLocaleString()} · {Math.max(0, contract.target - contract.progress).toLocaleString()} remaining</small>}</div>{authorized ? <GameTooltip content={`Open ${groundName} with this quarry selected. Combat will not start automatically.`}><Button variant="primary" onClick={huntInGround}><Crosshair size={15} /> HUNT IN {groundName.toUpperCase()}</Button></GameTooltip> : <GameTooltip content={authDescription}><Button variant="secondary" disabled>{!authorization.authorized && authorization.reason === 'contract-tier-locked' && monster.hunter?.minimumRank ? 'MASTER HUNTER REQUIRED' : 'CONTRACT REQUIRED'}</Button></GameTooltip>}</section>}
      <div className="hunter-dossier-tabs-sticky"><FilterBar options={dossierTabs} value={tab} onChange={onTab} ariaLabel="Quarry dossier sections" /></div>
      <div ref={contentRef} className="hunter-dossier-content smart-scroll-region">
        {tab === 'overview' && <OverviewSection monster={monster} state={state} relation={relation} authorization={authorization} locationName={locationName} />}
        {tab === 'combat' && <CombatSection monster={monster} />}
        {tab === 'rewards' && <RewardsSection monster={monster} state={state} worldTier={worldTier} />}
        {tab === 'record' && <HunterRecordSection monster={monster} state={state} relation={relation} record={record} blocked={blocked} activeTarget={activeTarget} blockSlots={blockSlots} canBlock={canBlock} onToggleBlock={() => selectedId && methods.setHunterTargetBlocked(selectedId, !blocked)} />}
      </div>
      {authorized && <footer className="hunter-dossier-sticky-hunt"><div><Status tone="active">AUTHORIZED</Status><span>{Math.max(0, (contract?.target ?? 0) - (contract?.progress ?? 0)).toLocaleString()} kills remaining</span></div><GameTooltip content={`Open ${groundName} with this eligible quarry selected.`}><Button variant="primary" onClick={huntInGround}>HUNT IN {groundName.toUpperCase()}</Button></GameTooltip></footer>}
    </>}
  </Card>
}

function OverviewSection({ monster, state, relation, authorization, locationName }: { monster: (typeof MONSTERS)[keyof typeof MONSTERS]; state: GameState; relation: ReturnType<typeof getMonsterHunterContractRelation>; authorization: ReturnType<typeof getHunterAuthorization>; locationName: string }) {
  const metadata = monster.hunter
  const contract = state.progress.huntersOrder.activeContract
  return <div className="hunter-dossier-section-stack"><p className="hunter-dossier-description">{monster.subtitle}</p><section><SectionLabel>CLASSIFICATION</SectionLabel><div className="hunter-classification-grid"><Classification icon={<PawPrint />} label="FAMILY" value={metadata?.family ?? monster.bestiaryCategory} /><Classification icon={<Sparkles />} label="ALIGNMENT" value={metadata?.alignment ?? 'Unaligned'} /><Classification icon={<MapPin />} label="LOCATION" value={locationName} /><Classification icon={<Shield />} label="CONTRACT TIER" value={metadata?.contractTier ?? monster.bestiaryCategory} /></div></section>{metadata?.exclusive && <section className={`hunter-authorization-detail${authorization.authorized ? ' is-authorized' : ' is-locked'}`}><SectionLabel>HUNT AUTHORIZATION</SectionLabel><strong>{relation === 'exact-target' ? 'AUTHORIZED QUARRY' : relation === 'eligible' ? 'COUNTS FOR ACTIVE CONTRACT' : relation === 'matching-but-locked' ? 'LOCKED QUARRY' : contract ? 'NOT ELIGIBLE FOR ACTIVE CONTRACT' : 'NO ACTIVE CONTRACT'}</strong><span>{authorization.authorized ? relation === 'exact-target' ? `${contract?.progress ?? 0} / ${contract?.target ?? 0} Contract kills complete.` : 'This creature can advance your current broad Contract.' : authorization.reason === 'contract-tier-locked' ? `Required standing: ${metadata.minimumRank === 'master-hunter' ? 'Master Hunter' : metadata.minimumRank ?? metadata.contractTier}.` : 'A matching active Contract is required.'}</span></section>}</div>
}
function Classification({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="hunter-classification-tile"><span>{icon}{label}</span><strong>{value}</strong></div> }
function SectionLabel({ children }: { children: string }) { return <h3 className="hunter-dossier-section-label">{children}</h3> }

function CombatSection({ monster }: { monster: (typeof MONSTERS)[keyof typeof MONSTERS] }) {
  return <div className="hunter-dossier-section-stack"><SectionLabel>COMBAT PROFILE</SectionLabel><BestiaryStats monster={monster} />{isBossMonster(monster) ? <><BestiaryBossMechanics monster={monster} /><BestiaryBossPhases monster={monster} /></> : <BestiaryTraits monster={monster} />}<BestiaryAbilities monster={monster} />{!isBossMonster(monster) && <BestiarySequence monster={monster} />}</div>
}
function RewardsSection({ monster, state, worldTier }: { monster: (typeof MONSTERS)[keyof typeof MONSTERS]; state: GameState; worldTier: GameState['worldTier']['current'] }) {
  return <div className="hunter-dossier-section-stack"><SectionLabel>RESONANCE & ESSENCE</SectionLabel><BestiaryResonanceYield monster={monster} worldTier={worldTier} /><SectionLabel>ITEM LOOT</SectionLabel><BestiaryLootTable monster={monster} progress={state.progress} worldTier={worldTier} /><SectionLabel>SIGIL SOURCES</SectionLabel><BestiarySigilDrops monster={monster} worldTier={worldTier} /></div>
}
function HunterRecordSection({ monster, state, relation, record, blocked, activeTarget, blockSlots, canBlock, onToggleBlock }: { monster: (typeof MONSTERS)[keyof typeof MONSTERS]; state: GameState; relation: ReturnType<typeof getMonsterHunterContractRelation>; record: GameState['progress']['huntersOrder']['monsterHunterStats'][MonsterId] | undefined; blocked: boolean; activeTarget: boolean; blockSlots: number; canBlock: boolean; onToggleBlock: () => void }) {
  const metadata = monster.hunter
  const contract = state.progress.huntersOrder.activeContract
  const totalMarks = state.progress.huntersOrder.monsterHunterStats[monster.id]?.marksEarned ?? 0
  return <div className="hunter-dossier-section-stack"><SectionLabel>HUNTER RECORD</SectionLabel><div className="hunter-record-metrics"><Metric label="CONTRACT KILLS" value={(record?.contractKills ?? 0).toLocaleString()} /><Metric label="CONTRACTS COMPLETED" value={(record?.contractsCompleted ?? 0).toLocaleString()} /><Metric label="MARKS EARNED" value={totalMarks.toLocaleString()} /><Metric label="TOTAL DEFEATS" value={(state.progress.lifetimeKillsByMonster[monster.id] ?? state.progress.bossKillsByBoss[monster.id] ?? 0).toLocaleString()} /></div>{metadata?.exclusive && <><div className="hunter-record-facts"><Fact label="CONTRACT TIER" value={metadata.contractTier} /><Fact label="MINIMUM RANK" value={metadata.minimumRank === 'master-hunter' ? 'Master Hunter' : metadata.minimumRank ?? 'None'} /><Fact label="FAMILY" value={metadata.family} /><Fact label="ALIGNMENT" value={metadata.alignment} /><Fact label="HUNTER EXCLUSIVE" value={metadata.exclusive ? 'Yes' : 'No'} /><Fact label="CONTRACT REQUIRED" value={metadata.contractRequired ? 'Yes' : 'No'} /></div><div className="hunter-record-board-state"><span>BOARD STATUS</span><strong>{blocked ? 'Blocked from future offers' : 'Available for future offers'}</strong><small>{blocked ? 'Remove this Target Block to restore the quarry to board generation.' : 'Target Blocks only affect future Contract offers.'}</small></div><div className="hunter-record-relation"><span>CURRENT CONTRACT</span><strong>{relation === 'exact-target' ? 'Exact target' : relation === 'eligible' ? 'Eligible broad-contract quarry' : relation === 'matching-but-locked' ? 'Matching but locked' : contract ? 'Not eligible' : 'No active Contract'}</strong></div><GameTooltip content={activeTarget ? 'The active Contract target cannot be blocked.' : blockSlots <= 0 ? 'Unlock Target Blocks through Hunter Rank upgrades.' : blocked ? 'Return this quarry to future Contract offers.' : canBlock ? 'Exclude this quarry from future board choices.' : 'All available Target Block slots are in use.'}><Button variant={blocked ? 'secondary' : 'ghost'} disabled={activeTarget || (!blocked && !canBlock)} onClick={onToggleBlock}>{activeTarget ? 'ACTIVE CONTRACT TARGET' : blocked ? 'UNBLOCK QUARRY' : 'BLOCK FROM FUTURE CONTRACTS'}</Button></GameTooltip></>}</div>
}
function Fact({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div> }
