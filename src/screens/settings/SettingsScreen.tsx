import { RotateCcw, Save, Wrench } from 'lucide-react'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, Status } from '../../components/ui'

export function SettingsScreenV2() {
  const save = useGameStore((state) => state.saveGame)
  const reset = useGameStore((state) => state.resetSave)
  const debug = useGameStore((state) => state.ui.showDebug)
  const edit = useGameStore((state) => state.ui.editMode)
  const setDebug = useGameStore((state) => state.setDebug)
  const toggleEdit = useGameStore((state) => state.toggleEditMode)
  const resetLayout = useGameStore((state) => state.resetLayout)
  const resetAllLayouts = useGameStore((state) => state.resetAllLayouts)
  const screen = useGameStore((state) => state.ui.screen)
  return <div className="screen-content"><div className="screen-header"><div><div className="eyebrow">TOWER SYSTEMS</div><h1>Settings / Info</h1><p>Local save controls, developer tools, and the desktop panel layout editor.</p></div></div><div className="settings-grid"><Card title="Save" className="settings-card"><div className="setting-row"><div><strong>Local save</strong><small>Autosaves every 15 seconds and when the tab is hidden.</small></div><Button variant="success" onClick={save}><Save size={15} /> Save now</Button></div><div className="setting-row"><div><strong>Reset gameplay state</strong><small>Returns to a fresh Apprentice Wand save.</small></div><Button variant="danger" onClick={() => { if (window.confirm('Reset the current save?')) reset() }}><RotateCcw size={15} /> Reset save</Button></div></Card><Card title="Developer tools" className="settings-card"><div className="setting-row"><div><strong>Testing panel</strong><small>Changes here modify the current save.</small></div><Button variant={debug ? 'success' : 'secondary'} onClick={() => setDebug(!debug)}><Wrench size={14} /> {debug ? 'Hide tools' : 'Show tools'}</Button></div><div className="setting-row"><div><strong>UI Edit mode</strong><small>Desktop only. Drag the main panel or use the resize handle.</small></div><Button variant={edit ? 'success' : 'secondary'} onClick={toggleEdit}>{edit ? 'Exit edit mode' : 'Edit layout'}</Button></div><div className="setting-row"><div><strong>Layout reset</strong><small>Reset the current screen or all saved layouts.</small></div><div className="button-row"><Button variant="ghost" onClick={() => resetLayout(screen)}>Current</Button><Button variant="ghost" onClick={resetAllLayouts}>All</Button></div></div></Card><Card title="MVP rules" className="settings-card full"><div className="rules-list"><Rule text="Combat, Research, and Transmutation continue when you navigate." /><Rule text="Focus is reserved, never spent, and spell Auto-Cast costs are data-driven." /><Rule text="Hidden time is banked once; the real-time simulation pauses while hidden." /><Rule text="Forest Heart’s first kill raises the Magic School cap and adds permanent Focus." /></div><div className="settings-status"><Status tone="active">Save schema v2</Status><span>Local browser storage · no cloud account</span></div></Card></div><div className="footer-note">SSS Wizard · Phase 2 development build</div></div>
}
function Rule({ text }: { text: string }) { return <div>✓ {text}</div> }
