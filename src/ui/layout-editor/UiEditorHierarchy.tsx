import { ChevronDown, ChevronRight, CircleAlert, Component, FileCode2, Image, LayoutPanelTop, Lock, Search, SlidersHorizontal, Type, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSyncExternalStore } from 'react'
import { getRegisteredUiElements, getUiRegistryDuplicates, getUiRegistryVersion, subscribeUiRegistry } from './uiEditorRegistry'
import { setUiEditorSelection, useUiEditorStore } from './uiEditorStore'
import type { RegisteredUiElement } from './uiEditorTypes'

const iconFor = (type: RegisteredUiElement['type']) => type === 'image' ? <Image size={13} /> : type === 'text' || type === 'heading' ? <Type size={13} /> : type === 'panel' ? <LayoutPanelTop size={13} /> : type === 'button' || type === 'icon-button' ? <Zap size={13} /> : <Component size={13} />

export function UiEditorHierarchy({ screen }: { screen: string }) {
  useSyncExternalStore(subscribeUiRegistry, getUiRegistryVersion, () => 0)
  const [query, setQuery] = useState(''); const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const selectedUiId = useUiEditorStore((state) => state.selectedUiId)
  const entries = useMemo(() => getRegisteredUiElements().filter((entry) => entry.screen === screen && (!query || `${entry.label} ${entry.id} ${entry.componentType ?? ''}`.toLowerCase().includes(query.toLowerCase()))), [screen, query])
  const byParent = useMemo(() => { const map = new Map<string, RegisteredUiElement[]>(); for (const entry of entries) map.set(entry.parentId ?? '', [...(map.get(entry.parentId ?? '') ?? []), entry]); return map }, [entries])
  const roots = entries.filter((entry) => !entry.parentId || !entries.some((candidate) => candidate.id === entry.parentId))
  const select = (entry: RegisteredUiElement) => { setUiEditorSelection(entry.id); entry.element.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }
  return <section className="ui-editor-hierarchy" data-ui-editor-ignore="true">
    <div className="ui-editor-pane-heading"><div><span className="ui-editor-kicker">HIERARCHY</span><strong>{screen === 'shell' ? 'Header regions' : 'Current screen'}</strong></div><span>{entries.length}</span></div>
    <label className="ui-editor-search"><Search size={13} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search IDs, names..." aria-label="Search UI elements" /></label>
    {getUiRegistryDuplicates().length > 0 && <div className="ui-editor-warning"><CircleAlert size={13} /> Duplicate IDs: {getUiRegistryDuplicates().join(', ')}</div>}
    <div className="ui-editor-tree">{roots.map((entry) => <TreeRow key={`${entry.id}-${entry.element.dataset.uiType}`} entry={entry} children={byParent.get(entry.id) ?? []} getChildren={(id) => byParent.get(id) ?? []} selectedUiId={selectedUiId} collapsed={collapsed} onToggle={(id) => setCollapsed((value) => ({ ...value, [id]: !value[id] }))} onSelect={select} depth={0} />)}{!roots.length && <div className="ui-editor-empty"><SlidersHorizontal size={18} /><strong>No registered elements</strong><span>Add `UiEditable` to the surface you want to edit.</span></div>}</div>
    <div className="ui-editor-hierarchy-foot"><FileCode2 size={12} /> Stable IDs are the preset contract.</div>
  </section>
}

function TreeRow({ entry, children, getChildren, selectedUiId, collapsed, onToggle, onSelect, depth }: { entry: RegisteredUiElement; children: RegisteredUiElement[]; getChildren: (id: string) => RegisteredUiElement[]; selectedUiId: string | null; collapsed: Record<string, boolean>; onToggle: (id: string) => void; onSelect: (entry: RegisteredUiElement) => void; depth: number }) {
  const hasChildren = children.length > 0; const isCollapsed = collapsed[entry.id]; const overridden = Boolean(entry.element.dataset.uiEditorOverride) // resolved by the inspector when a preset layer is present
  return <div className="ui-editor-tree-node"><button type="button" className={`ui-editor-tree-row ${selectedUiId === entry.id ? 'active' : ''}`} style={{ paddingLeft: `${8 + depth * 14}px` }} onClick={() => onSelect(entry)}><span className="ui-editor-tree-chevron" onClick={(event) => { if (hasChildren) { event.stopPropagation(); onToggle(entry.id) } }}>{hasChildren ? (isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />) : <span />}</span><span className="ui-editor-tree-icon">{iconFor(entry.type)}</span><span className="ui-editor-tree-copy"><strong>{entry.label}</strong><small>{entry.id}</small></span>{entry.componentType && <span className="ui-editor-tree-instance"><Component size={10} /></span>}{overridden && <span className="ui-editor-override-dot" />}{entry.capabilities.includes('position') && <Lock size={10} className="ui-editor-tree-lock" />}</button>{!isCollapsed && children.map((child) => <TreeRow key={`${child.id}-${child.element.dataset.uiType}`} entry={child} children={getChildren(child.id)} getChildren={getChildren} selectedUiId={selectedUiId} collapsed={collapsed} onToggle={onToggle} onSelect={onSelect} depth={depth + 1} />)}</div>
}
