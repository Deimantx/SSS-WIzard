import { useEffect, useState } from 'react'
import { AlertTriangle, Bug, Check, Clipboard, RotateCcw, X } from 'lucide-react'
import { Button, Card, Progress, Status } from '../components/ui'
import { ITEMS } from '../game/data/items'
import { MONSTERS } from '../game/data/monsters'
import { SCHOOLS } from '../game/data/schools'
import { SPELLS } from '../game/data/spells'
import type { ItemId, MonsterId, SchoolId } from '../game/types'
import { formatOfflineBank, formatNumber } from '../game/utils'
import { deriveFocusReservations } from '../game/engine'
import { useGameStore } from '../store/gameStore'
import { selectFreeFocus, selectUsedFocus } from '../store/selectors'
import { getUiPreferences, resetAppearance } from '../ui/preferences/uiPreferencesStore'
import { getLayoutEditorState, resetAllScreenLayouts } from '../ui/layout-editor/layoutEditorStore'
import { closeDeveloperTools, setDeveloperToolsSearch, setDeveloperToolsTab, useDeveloperToolsStore, type DeveloperToolsTab } from './developerToolsStore'

const tabs: { id: DeveloperToolsTab; label: string }[] = [{ id: 'overview', label: 'Overview' }, { id: 'player', label: 'Player' }, { id: 'schools', label: 'Schools' }, { id: 'inventory', label: 'Inventory' }, { id: 'combat', label: 'Combat' }, { id: 'activities', label: 'Activities' }, { id: 'progression', label: 'Progression' }, { id: 'save', label: 'Save / State' }]

export function DeveloperToolsWindow() {
  const session = useDeveloperToolsStore()
  const [copied, setCopied] = useState('')
  useEffect(() => { if (!session.open) return; const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !(event.target as HTMLElement | null)?.matches('input,select,textarea')) { event.preventDefault(); closeDeveloperTools() } }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown) }, [session.open])
  if (!session.open) return null
  const copy = async (label: string, value: unknown) => { try { await navigator.clipboard?.writeText(JSON.stringify(value, null, 2)); setCopied(label); window.setTimeout(() => setCopied(''), 1800) } catch { setCopied('Clipboard unavailable') } }
  return <div className="developer-tools-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeDeveloperTools() }}><section className="developer-tools-window" role="dialog" aria-modal="true" aria-label="Developer Tools"><header className="developer-tools-header"><div><div className="eyebrow"><Bug size={13} /> DEVELOPER CONSOLE</div><h2>Developer Tools</h2><p>Changes may modify the current save.</p></div><div className="developer-tools-header-actions">{copied && <Status tone={copied === 'Clipboard unavailable' ? 'warning' : 'success'}>{copied === 'Clipboard unavailable' ? copied : <><Check size={13} /> {copied} copied</>}</Status>}<button className="icon-button" onClick={closeDeveloperTools} aria-label="Close Developer Tools"><X size={18} /></button></div></header><div className="developer-tools-body"><nav className="developer-tools-tabs" aria-label="Developer tool sections">{tabs.map((tab) => <button key={tab.id} className={session.activeTab === tab.id ? 'active' : ''} onClick={() => setDeveloperToolsTab(tab.id)}>{tab.label}</button>)}</nav><main className="developer-tools-content"><div className="developer-tools-toolbar"><label>Search tools<input value={session.search} onChange={(event) => setDeveloperToolsSearch(event.target.value)} placeholder="Filter item or school names" /></label></div><DeveloperTab tab={session.activeTab} copy={copy} /></main></div></section></div>
}

function DeveloperTab({ tab, copy }: { tab: DeveloperToolsTab; copy: (label: string, value: unknown) => Promise<void> }) {
  if (tab === 'overview') return <DeveloperOverview />
  if (tab === 'player') return <DeveloperPlayer />
  if (tab === 'schools') return <DeveloperSchools />
  if (tab === 'inventory') return <DeveloperInventory />
  if (tab === 'combat') return <DeveloperCombat />
  if (tab === 'activities') return <DeveloperActivities />
  if (tab === 'progression') return <DeveloperProgression />
  return <DeveloperSaveState copy={copy} />
}

function DeveloperOverview() {
  const state = useGameStore()
  const used = useGameStore(selectUsedFocus)
  const free = useGameStore(selectFreeFocus)
  const preset = useGameStore((game) => game.preset)
  const reservations = deriveFocusReservations({ activities: state.activities, progress: state.progress })
  const presets: { id: Parameters<typeof preset>[0]; label: string }[] = [{ id: 'fresh', label: 'Fresh' }, { id: 'research', label: 'Research Ready' }, { id: 'combat', label: 'Combat Ready' }, { id: 'boss', label: 'Sentinel Ready' }, { id: 'guild', label: 'Guild Ready' }, { id: 'main-boss', label: 'Forest Heart Ready' }, { id: 'chapter-complete', label: 'Chapter Complete' }]
  return <div className="developer-tab-grid"><Card title="Runtime summary"><div className="developer-summary-grid"><Summary label="Screen" value={state.ui.screen} /><Summary label="Save version" value={`v${state.saveVersion}`} /><Summary label="HP" value={`${Math.floor(state.player.health)} / ${state.player.maxHealth}`} /><Summary label="Mana" value={`${Math.floor(state.player.mana)} / ${state.player.maxMana}`} /><Summary label="Focus" value={`${free} free · ${used} reserved`} /><Summary label="Magic cap" value={state.progress.magicLevelCap} /><Summary label="Combat" value={state.combat.active ? state.combat.enemyId ? `Fighting ${state.combat.enemyId}` : 'Recovery' : 'Inactive'} /><Summary label="Threat" value={state.combat.threatCleared} /><Summary label="Guild" value={`${state.progress.guildRank} · ${state.progress.guildReputation} rep`} /><Summary label="Offline" value={formatOfflineBank(state.offlineBankMs)} /><Summary label="Activities" value={reservations.length} /><Summary label="Viewport" value={typeof window === 'undefined' ? '—' : `${window.innerWidth} × ${window.innerHeight}`} /></div></Card><Card title="Quick presets"><p className="muted">Presets reset gameplay state and prepare a focused test scenario.</p><div className="developer-button-grid">{presets.map((item) => <Button key={item.id} variant="secondary" onClick={() => preset(item.id)}>{item.label}</Button>)}</div></Card></div>
}

function DeveloperPlayer() {
  const player = useGameStore((state) => state.player)
  const setPlayer = useGameStore((state) => state.setPlayer)
  const update = (key: keyof typeof player, value: number) => setPlayer({ [key]: value } as Partial<typeof player>)
  return <div className="developer-tab-grid"><Card title="Player values"><div className="developer-form-grid"><NumberField label="Current HP" value={player.health} onChange={(value) => update('health', value)} /><NumberField label="Base Max HP" value={player.baseMaxHealth} onChange={(value) => update('baseMaxHealth', value)} /><NumberField label="Current Mana" value={player.mana} onChange={(value) => update('mana', value)} /><NumberField label="Base Max Mana" value={player.baseMaxMana} onChange={(value) => update('baseMaxMana', value)} /><NumberField label="Base Max Focus" value={player.baseMaxFocus} onChange={(value) => update('baseMaxFocus', value)} /></div><div className="button-row"><Button variant={player.godMode ? 'success' : 'secondary'} onClick={() => setPlayer({ godMode: !player.godMode })}>{player.godMode ? 'God Mode ON' : 'God Mode OFF'}</Button></div></Card><Card title="Quick recovery"><div className="developer-button-grid"><Button onClick={() => setPlayer({ health: player.maxHealth })}>Heal to Full</Button><Button onClick={() => setPlayer({ mana: player.maxMana })}>Fill Mana</Button><Button variant="secondary" onClick={() => setPlayer({ health: player.maxHealth, mana: player.maxMana })}>Refill HP + Mana</Button><Button variant="secondary" onClick={() => setPlayer({ baseMaxFocus: 100 })}>Set Focus 100</Button><Button variant="secondary" onClick={() => setPlayer({ baseMaxFocus: 140 })}>Set Focus 140</Button></div></Card></div>
}

function DeveloperSchools() {
  const schools = useGameStore((state) => state.schools)
  const cap = useGameStore((state) => state.progress.magicLevelCap)
  const setSchoolDebug = useGameStore((state) => state.setSchoolDebug)
  const setLevelCap = useGameStore((state) => state.setLevelCap)
  const unlockAll = useGameStore((state) => state.unlockAllSpells)
  return <div className="developer-tab-grid"><Card title="Magic schools"><div className="developer-school-list">{(Object.keys(SCHOOLS) as SchoolId[]).map((id) => <div className="developer-school-row" key={id}><span className="school-glyph" style={{ color: SCHOOLS[id].color }}>{SCHOOLS[id].glyph}</span><div><strong>{SCHOOLS[id].name}</strong><small>Level {schools[id].level} · {schools[id].xp} XP · {Object.values(SPELLS).filter((spell) => spell.school === id && schools[id].level >= spell.unlockLevel).length} spells available</small></div><NumberField label="XP" value={schools[id].xp} onChange={(value) => setSchoolDebug(id, value, schools[id].level)} /><NumberField label="Level" value={schools[id].level} onChange={(value) => setSchoolDebug(id, schools[id].xp, value)} /></div>)}</div></Card><Card title="School controls"><div className="developer-button-grid"><Button variant="secondary" onClick={() => (Object.keys(SCHOOLS) as SchoolId[]).forEach((id) => setSchoolDebug(id, 20, 2))}>Set all Lv2</Button><Button variant="secondary" onClick={() => (Object.keys(SCHOOLS) as SchoolId[]).forEach((id) => setSchoolDebug(id, 80, 4))}>Set all Lv4</Button><Button variant="secondary" onClick={() => (Object.keys(SCHOOLS) as SchoolId[]).forEach((id) => setSchoolDebug(id, 180, 10))}>Set all Lv10</Button><Button variant="success" onClick={unlockAll}>Unlock all spells</Button></div><NumberField label="Magic School cap" value={cap} onChange={setLevelCap} /></Card></div>
}

function DeveloperInventory() {
  const state = useGameStore()
  const addItem = useGameStore((game) => game.addItem)
  const removeItem = useGameStore((game) => game.removeItem)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ItemId>('fire-fragment')
  const [quantity, setQuantity] = useState(1)
  const itemOptions = (Object.keys(ITEMS) as ItemId[]).filter((id) => `${ITEMS[id].name} ${id}`.toLowerCase().includes(query.toLowerCase()))
  const selectedItem = ITEMS[selected]
  const addGroup = (ids: ItemId[]) => ids.forEach((id) => addItem(id, 10))
  return <div className="developer-tab-grid"><Card title="Item controls"><label>Search items<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Fragments, equipment..." /></label><label>Item<select value={selected} onChange={(event) => setSelected(event.target.value as ItemId)}>{itemOptions.map((id) => <option key={id} value={id}>{ITEMS[id].name}</option>)}</select></label><div className="developer-item-selected"><span style={{ color: selectedItem.color }}>{selectedItem.icon}</span><div><strong>{selectedItem.name}</strong><small>{selectedItem.description}</small></div><Status tone={state.protectedItems[selected] || Object.values(state.equipment).includes(selected) ? 'warning' : 'neutral'}>{Object.values(state.equipment).includes(selected) ? 'Equipped' : state.protectedItems[selected] ? 'Protected' : `${state.inventory[selected] ?? 0} owned`}</Status></div><NumberField label="Quantity" value={quantity} onChange={(value) => setQuantity(Math.max(1, value))} /><div className="button-row"><Button onClick={() => addItem(selected, quantity)}>Add</Button><Button variant="secondary" onClick={() => removeItem(selected, quantity)}>Remove</Button><Button variant="ghost" onClick={() => { const current = state.inventory[selected] ?? 0; if (quantity > current) addItem(selected, quantity - current); else if (quantity < current) removeItem(selected, current - quantity) }}>Set exact</Button></div></Card><Card title="Quick groups"><p className="muted">Remove respects equipped and protected item rules.</p><div className="developer-button-grid"><Button variant="secondary" onClick={() => addGroup((Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].category === 'elemental'))}>Add elemental fragments</Button><Button variant="secondary" onClick={() => addGroup((Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].category === 'monster-loot' || ITEMS[id].category === 'boss-loot'))}>Add monster materials</Button><Button variant="secondary" onClick={() => addGroup((Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === 'equipment'))}>Add equipment bundle</Button></div><div className="developer-owned-list">{(Object.keys(ITEMS) as ItemId[]).filter((id) => (state.inventory[id] ?? 0) > 0).map((id) => <span key={id}>{ITEMS[id].name}<strong>{state.inventory[id]}</strong></span>)}</div></Card></div>
}

function DeveloperCombat() {
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const enter = useGameStore((state) => state.enterDungeon)
  const leave = useGameStore((state) => state.leaveDungeon)
  const setThreat = useGameStore((state) => state.setThreat)
  const spawn = useGameStore((state) => state.spawnDebugEnemy)
  const kill = useGameStore((state) => state.killCurrentEnemy)
  const setHp = useGameStore((state) => state.setEnemyHealthPercent)
  const clearPlayer = useGameStore((state) => state.clearPlayerStatuses)
  const clearEnemy = useGameStore((state) => state.clearEnemyStatuses)
  return <div className="developer-tab-grid"><Card title="Combat state"><div className="developer-summary-grid"><Summary label="Active" value={combat.active ? 'Yes' : 'No'} /><Summary label="Dungeon" value={combat.dungeonId ?? '—'} /><Summary label="Enemy" value={combat.enemyId ? MONSTERS[combat.enemyId].name : 'None'} /><Summary label="Enemy HP" value={combat.enemyId ? `${Math.floor(combat.enemyHp)} / ${combat.enemyMaxHp}` : '—'} /><Summary label="Barrier" value={combat.enemyBarrier} /><Summary label="Threat" value={combat.threatCleared} /><Summary label="Telegraph" value={combat.enemyTelegraphActionId ?? 'None'} /><Summary label="Auto Hunt" value={progress.autoHuntBossByDungeon['whispering-woods'] ? 'On' : 'Off'} /></div>{combat.enemyId && <Progress value={combat.enemyHp / combat.enemyMaxHp * 100} tone="red" label="Enemy HP" right={`${Math.floor(combat.enemyHp)} HP`} />}</Card><Card title="Encounter controls"><div className="button-row"><Button onClick={enter}>Enter Whispering Woods</Button><Button variant="secondary" onClick={leave}>Leave Dungeon</Button><Button variant="danger" onClick={kill} disabled={!combat.enemyId}>Kill current enemy</Button></div><NumberField label="Threat cleared" value={combat.threatCleared} onChange={setThreat} /><div className="developer-button-grid">{(['forest-wisp', 'thornling', 'stone-root', 'grove-sentinel', 'forest-heart'] as MonsterId[]).map((id) => <Button key={id} variant={MONSTERS[id].boss ? 'danger' : 'ghost'} onClick={() => spawn(id)}>Spawn {MONSTERS[id].name}</Button>)}</div><div className="button-row"><Button variant="secondary" onClick={() => setHp(25)} disabled={!combat.enemyId}>Set enemy HP 25%</Button><Button variant="secondary" onClick={() => setHp(100)} disabled={!combat.enemyId}>Restore enemy HP</Button><Button variant="ghost" onClick={clearPlayer}>Clear player statuses</Button><Button variant="ghost" onClick={clearEnemy}>Clear enemy statuses</Button></div></Card></div>
}

function DeveloperActivities() {
  const activities = useGameStore((state) => state.activities)
  const player = useGameStore((state) => state.player)
  const progress = useGameStore((state) => state.progress)
  const used = useGameStore(selectUsedFocus)
  const free = useGameStore(selectFreeFocus)
  const reservations = deriveFocusReservations({ activities, progress })
  const toggleAutoChannel = useGameStore((state) => state.toggleAutoChannel)
  const toggleCondense = useGameStore((state) => state.toggleCondense)
  const toggleResearch = useGameStore((state) => state.toggleResearch)
  const toggleTransmutation = useGameStore((state) => state.toggleTransmutation)
  const release = () => { if (activities.autoChannel) toggleAutoChannel(); if (activities.condense.running) toggleCondense(); if (activities.research.running) toggleResearch(); if (activities.transmutation.running) toggleTransmutation() }
  return <div className="developer-tab-grid"><Card title="Live activities"><div className="developer-summary-grid"><Summary label="Auto Channel" value={activities.autoChannel ? 'Running' : 'Stopped'} /><Summary label="Condensation" value={activities.condense.running ? 'Running' : 'Stopped'} /><Summary label="Research" value={activities.research.running ? `${activities.research.remainingQuantity} left` : activities.research.status} /><Summary label="Transmutation" value={activities.transmutation.running ? 'Running' : 'Stopped'} /><Summary label="Focus" value={`${used} used · ${free} free`} /><Summary label="Mana" value={`${Math.floor(player.mana)} / ${player.maxMana}`} /></div><div className="reservation-list">{reservations.map((item) => <div className="reservation" key={item.id}><span className="reservation-dot" /><span>{item.label}</span><strong>{item.amount}</strong></div>)}</div></Card><Card title="Automation controls"><p className="muted">Stop actions here; normal completion and reward logic remains in the simulation.</p><div className="button-row"><Button variant="danger" onClick={release}>Release all automation</Button><Button variant="secondary" onClick={() => useGameStore.getState().setPlayer({ mana: player.maxMana })}>Give required Mana</Button></div><div className="developer-owned-list">{Object.entries(activities.autoCast).filter(([, enabled]) => enabled).map(([id]) => <span key={id}>Auto-Cast {SPELLS[id as keyof typeof SPELLS].name}<strong>ON</strong></span>)}</div></Card></div>
}

function DeveloperProgression() {
  const progress = useGameStore((state) => state.progress)
  const preset = useGameStore((state) => state.preset)
  const promote = useGameStore((state) => state.promoteGuild)
  const setRep = useGameStore((state) => state.setGuildReputation)
  return <div className="developer-tab-grid"><Card title="Progression flags"><div className="developer-summary-grid"><Summary label="Grove Sentinel" value={progress.firstBossKill ? 'Defeated' : 'Locked'} /><Summary label="Forest Heart" value={progress.firstMainBossKill ? 'Defeated' : progress.forestHeartUnlocked ? 'Unlocked' : 'Locked'} /><Summary label="Guild" value={progress.guildUnlocked ? 'Unlocked' : 'Locked'} /><Summary label="Rank" value={progress.guildRank} /><Summary label="Reputation" value={progress.guildReputation} /><Summary label="Normal kills" value={progress.lifetimeKills} /><Summary label="Boss kills" value={Object.values(progress.bossKillsByBoss).reduce((sum, value) => sum + (value ?? 0), 0)} /><Summary label="Permanent Focus" value={Object.values(progress.permanentFocusBonuses).reduce((sum, value) => sum + value, 0)} /></div></Card><Card title="Progression controls"><div className="button-row"><Button variant="secondary" onClick={() => preset('guild')}>Unlock Guild</Button><Button variant="secondary" onClick={promote}>Promote if legal</Button><Button variant="danger" onClick={() => preset('chapter-complete')}>FORCE Chapter Complete</Button></div><NumberField label="Guild reputation" value={progress.guildReputation} onChange={setRep} /></Card></div>
}

function DeveloperSaveState({ copy }: { copy: (label: string, value: unknown) => Promise<void> }) {
  const state = useGameStore()
  const save = useGameStore((game) => game.saveGame)
  const reload = useGameStore((game) => game.reloadFromStorage)
  const reset = useGameStore((game) => game.resetSave)
  const preferences = getUiPreferences()
  const layouts = getLayoutEditorState().document
  return <div className="developer-tab-grid"><Card title="Save and export"><div className="button-row"><Button variant="success" onClick={save}>Save now</Button><Button variant="secondary" onClick={reload}>Reload local save</Button><Button variant="ghost" onClick={() => copy('Gameplay state', state)}> <Clipboard size={14} /> Copy gameplay JSON</Button></div><div className="button-row"><Button variant="ghost" onClick={() => copy('UI preferences', preferences)}>Copy UI preferences JSON</Button><Button variant="ghost" onClick={() => copy('UI layout', layouts)}>Copy UI layout JSON</Button></div><div className="developer-diagnostics"><strong>Diagnostics</strong><span>App version <b>0.1.0</b></span><span>Save schema <b>v{state.saveVersion}</b></span><span>Layout schema <b>v{layouts.version}</b></span><span>Theme <b>{preferences.theme} · {preferences.textSize}</b></span><span>Screen ID <b>{state.ui.screen}</b></span><span>Viewport <b>{typeof window === 'undefined' ? '—' : `${window.innerWidth} × ${window.innerHeight}`}</b></span><span>Device pixel ratio <b>{typeof window === 'undefined' ? '—' : window.devicePixelRatio}</b></span></div></Card><Card title="Danger zone"><p className="muted">These controls affect persisted UI or gameplay state and require confirmation.</p><div className="button-row"><Button variant="danger" onClick={() => { if (window.confirm('Reset gameplay save?')) reset() }}><RotateCcw size={14} /> Reset gameplay save</Button><Button variant="secondary" onClick={() => { if (window.confirm('Reset UI appearance?')) resetAppearance() }}>Reset UI appearance</Button><Button variant="secondary" onClick={() => { if (window.confirm('Reset UI layouts?')) resetAllScreenLayouts() }}>Reset UI layouts</Button></div><div className="developer-warning"><AlertTriangle size={15} /> UI layout and preferences are stored outside gameplay save.</div></Card></div>
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="developer-number-field">{label}<input type="number" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value) || 0)} /></label> }
function Summary({ label, value }: { label: string; value: React.ReactNode }) { return <div className="developer-summary"><span>{label}</span><strong>{value}</strong></div> }
