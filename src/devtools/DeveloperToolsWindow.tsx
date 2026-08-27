import { useEffect, useState } from 'react'
import { Bug, Check, X } from 'lucide-react'
import { Status } from '../components/ui'
import { useGameStore } from '../store/gameStore'
import { closeDeveloperTools, setDeveloperToolsSearch, setDeveloperToolsTab, useDeveloperToolsStore, type DeveloperToolsTab } from './developerToolsStore'
import { DeveloperTab } from './DeveloperToolTabs'

const tabs: { id: DeveloperToolsTab; label: string }[] = [{ id: 'character', label: 'Character' }, { id: 'channeling', label: 'Channeling' }, { id: 'focus', label: 'Focus' }, { id: 'research', label: 'Research' }, { id: 'transmutation', label: 'Transmutation' }, { id: 'inventory', label: 'Inventory' }, { id: 'combat', label: 'Combat' }, { id: 'schools', label: 'Magic Schools' }, { id: 'progression', label: 'Guild / Progression' }, { id: 'save', label: 'Save / Profile' }, { id: 'diagnostics', label: 'Diagnostics' }]

export function DeveloperToolsWindow() {
  const session = useDeveloperToolsStore()
  const debug = useGameStore((state) => state.debug)
  const [copied, setCopied] = useState('')
  useEffect(() => { if (!session.open) return; const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !(event.target as HTMLElement | null)?.matches('input,select,textarea')) { event.preventDefault(); closeDeveloperTools() } }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown) }, [session.open])
  if (!session.open) return null
  const copy = async (label: string, value: unknown) => { try { await navigator.clipboard?.writeText(JSON.stringify(value, null, 2)); setCopied(label); window.setTimeout(() => setCopied(''), 1800) } catch { setCopied('Clipboard unavailable') } }
  const debugActive = debug.bonusManaRegenFlat > 0 || debug.bonusMaxManaFlat > 0 || debug.bonusMaxFocusFlat > 0 || debug.allowManaOverCap || debug.allowFocusOverCap || debug.ignoreEchoLimit || debug.transmutationEchoCapacityOverride !== null
  return <div className="developer-tools-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeDeveloperTools() }}><section className="developer-tools-window" role="dialog" aria-modal="true" aria-label="Developer Tools"><header className="developer-tools-header"><div><div className="eyebrow"><Bug size={13} /> DEVELOPER CONSOLE</div><h2>Developer Tools</h2><p>Changes may modify the current save. Debug overrides are isolated from permanent progression.</p></div><div className="developer-tools-header-actions">{debugActive && <Status tone="warning">DEBUG OVERRIDES ACTIVE</Status>}{copied && <Status tone={copied === 'Clipboard unavailable' ? 'warning' : 'success'}>{copied === 'Clipboard unavailable' ? copied : <><Check size={13} /> {copied} copied</>}</Status>}<button className="icon-button" onClick={closeDeveloperTools} aria-label="Close Developer Tools"><X size={18} /></button></div></header><div className="developer-tools-body"><nav className="developer-tools-tabs" aria-label="Developer tool sections">{tabs.map((tab) => <button key={tab.id} className={session.activeTab === tab.id ? 'active' : ''} onClick={() => setDeveloperToolsTab(tab.id)}>{tab.label}</button>)}<button className="developer-tools-legacy-tab" aria-label="Player" onClick={() => setDeveloperToolsTab('character')}>Player</button></nav><main className="developer-tools-content"><div className="developer-tools-toolbar"><label>Search tools<input value={session.search} onChange={(event) => setDeveloperToolsSearch(event.target.value)} placeholder="Filter item or school names" /></label></div><DeveloperTab tab={session.activeTab} copy={copy} /></main></div></section></div>
}
