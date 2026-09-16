import { useMemo, useState } from 'react'
import { Save, X } from 'lucide-react'
import { Button, Card } from '../ui'
import { getArcaneCorePresetSummary } from '../../game/systems/arcaneCore'
import { useGameStore } from '../../store/gameStore'

const formatUpdatedAt = (timestamp: number) => {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  if (elapsedMinutes === 0) return 'Updated just now'
  if (elapsedMinutes === 1) return 'Updated 1m ago'
  if (elapsedMinutes < 60) return `Updated ${elapsedMinutes}m ago`
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  return `Updated ${elapsedHours}h ago`
}

export function ArcaneCorePresetPanel({ version, onChange }: { version: number; onChange: () => void }) {
  const getPresets = useGameStore((state) => state.getArcaneCorePresets)
  const create = useGameStore((state) => state.createArcaneCorePreset)
  const update = useGameStore((state) => state.updateArcaneCorePreset)
  const load = useGameStore((state) => state.loadArcaneCorePreset)
  const rename = useGameStore((state) => state.renameArcaneCorePreset)
  const remove = useGameStore((state) => state.deleteArcaneCorePreset)
  const presets = useMemo(() => getPresets(), [getPresets, version])
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const beginCreate = () => {
    setIsCreating(true)
    setCreateError(false)
  }
  const cancelCreate = () => {
    setIsCreating(false)
    setNewName('')
    setCreateError(false)
  }
  const saveCurrent = () => {
    if (!create(newName)) {
      setCreateError(true)
      return
    }
    cancelCreate()
    onChange()
  }
  const beginRename = (id: string, name: string) => {
    setDeletingId(null)
    setEditingId(id)
    setEditingName(name)
  }
  const saveRename = (id: string) => {
    if (rename(id, editingName)) {
      setEditingId(null)
      onChange()
    }
  }
  const deletePreset = (id: string) => {
    if (remove(id)) {
      setDeletingId(null)
      onChange()
    }
  }

  return <Card title="Presets" action={<Button variant="secondary" onClick={beginCreate}><Save size={13} />Save current</Button>}>
    <p className="muted">Save and quickly switch between Arcane Core layouts.</p>
    {isCreating && <div className="arcane-core-preset-create"><label htmlFor="arcane-core-preset-name">Preset name</label><input id="arcane-core-preset-name" aria-label="Preset name" autoFocus value={newName} onChange={(event) => { setNewName(event.target.value); setCreateError(false) }} onKeyDown={(event) => { if (event.key === 'Enter') saveCurrent(); if (event.key === 'Escape') cancelCreate() }} placeholder="Boss Power" /><div className="button-row"><Button variant="primary" onClick={saveCurrent}>Save preset</Button><Button variant="ghost" onClick={cancelCreate}>Cancel</Button></div>{createError && <small className="arcane-core-preset-error">Enter a preset name to save the current layout.</small>}</div>}
    {!presets.length && !isCreating && <div className="arcane-core-preset-empty"><strong>No presets saved yet.</strong><span>Save the current Arcane Core layout to switch back to it later.</span><Button variant="secondary" onClick={beginCreate}><Save size={13} />Save current</Button></div>}
    {presets.length > 0 && <div className="arcane-core-preset-list">{presets.map((preset) => {
      const summary = getArcaneCorePresetSummary(preset.state)
      const isEditing = editingId === preset.id
      const isDeleting = deletingId === preset.id
      return <div className="arcane-core-preset-row" key={preset.id}>
        <div className="arcane-core-preset-main">{isEditing ? <div className="arcane-core-preset-rename"><input aria-label={`Rename ${preset.name}`} autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') saveRename(preset.id); if (event.key === 'Escape') setEditingId(null) }} /><Button variant="primary" onClick={() => saveRename(preset.id)}>Save</Button><Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button></div> : <><strong>{preset.name}</strong><span>{summary.unlockedNodes} nodes · {summary.totalRanks} ranks</span><small>{formatUpdatedAt(preset.updatedAt)}</small></>}</div>
        {!isEditing && <div className="arcane-core-preset-actions">{isDeleting ? <><span className="arcane-core-preset-delete-copy">Delete preset?</span><Button variant="danger" onClick={() => deletePreset(preset.id)}>Delete</Button><Button variant="ghost" onClick={() => setDeletingId(null)}>Cancel</Button></> : <><Button variant="secondary" onClick={() => { load(preset.id); onChange() }}>Load</Button><Button variant="ghost" onClick={() => { update(preset.id); onChange() }}>Update</Button><Button variant="ghost" onClick={() => beginRename(preset.id, preset.name)}>Rename</Button><Button variant="ghost" onClick={() => { setEditingId(null); setDeletingId(preset.id) }} ariaLabel={`Delete preset ${preset.name}`}><X size={13} /></Button></>}</div>}
      </div>
    })}</div>}
    <span className="arcane-core-preset-runtime-note">Presets are available for this session.</span>
  </Card>
}
