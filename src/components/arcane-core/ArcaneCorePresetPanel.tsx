import { useState } from 'react'
import { Save, X } from 'lucide-react'
import { Button, Card, GameTooltip } from '../ui'
import { getArcaneCorePresetSummary } from '../../game/systems/arcaneCore'
import { useArcaneCorePresetStore } from '../../store/arcaneCorePresetStore'
import { useGameStore } from '../../store/gameStore'

const formatUpdatedAt = (timestamp: number) => {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  if (elapsedMinutes === 0) return 'Updated just now'
  if (elapsedMinutes === 1) return 'Updated 1m ago'
  if (elapsedMinutes < 60) return `Updated ${elapsedMinutes}m ago`
  return `Updated ${Math.floor(elapsedMinutes / 60)}h ago`
}

const createErrorMessage = (reason: 'invalid-name' | 'limit-reached') => reason === 'invalid-name'
  ? 'Enter a preset name.'
  : 'Preset limit reached. Delete an existing preset before creating another.'

export function ArcaneCorePresetPanel() {
  const core = useGameStore((state) => state.arcaneCore)
  const loadArcaneCorePreset = useGameStore((state) => state.loadArcaneCorePreset)
  const presets = useArcaneCorePresetStore((state) => state.presets)
  const create = useArcaneCorePresetStore((state) => state.create)
  const update = useArcaneCorePresetStore((state) => state.update)
  const rename = useArcaneCorePresetStore((state) => state.rename)
  const remove = useArcaneCorePresetStore((state) => state.deletePreset)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const beginCreate = () => {
    setIsCreating(true)
    setCreateError(null)
    setActionError(null)
  }
  const cancelCreate = () => {
    setIsCreating(false)
    setNewName('')
    setCreateError(null)
  }
  const saveCurrent = () => {
    const result = create(newName, core)
    if (!result.ok) {
      setCreateError(createErrorMessage(result.reason))
      return
    }
    cancelCreate()
  }
  const beginRename = (id: string, name: string) => {
    setDeletingId(null)
    setActionError(null)
    setRenameError(null)
    setEditingId(id)
    setEditingName(name)
  }
  const saveRename = (id: string) => {
    const result = rename(id, editingName)
    if (result.ok) {
      setEditingId(null)
      setRenameError(null)
    } else if (result.reason === 'invalid-name') {
      setRenameError('Enter a preset name.')
    } else {
      setEditingId(null)
      setRenameError(null)
      setActionError('That preset no longer exists.')
    }
  }
  const updatePreset = (id: string) => {
    const result = update(id, core)
    if (!result.ok) setActionError('That preset no longer exists.')
  }
  const loadPreset = (id: string) => {
    if (!loadArcaneCorePreset(id)) setActionError('That preset could not be loaded.')
  }
  const deletePreset = (id: string) => {
    const result = remove(id)
    if (result.ok) {
      setDeletingId(null)
    } else {
      setActionError('That preset no longer exists.')
    }
  }

  return <Card title="Presets" action={<Button variant="secondary" onClick={beginCreate}><Save size={13} />Save current</Button>}>
    <p className="muted">Save and quickly switch between Arcane Core layouts.</p>
    {actionError && <small className="arcane-core-preset-error arcane-core-preset-action-error">{actionError}</small>}
    {isCreating && <div className="arcane-core-preset-create"><label htmlFor="arcane-core-preset-name">Preset name</label><input id="arcane-core-preset-name" aria-label="Preset name" autoFocus maxLength={32} value={newName} onChange={(event) => { setNewName(event.target.value); setCreateError(null) }} onKeyDown={(event) => { if (event.key === 'Enter') saveCurrent(); if (event.key === 'Escape') cancelCreate() }} placeholder="Boss Power" /><div className="button-row"><Button variant="primary" onClick={saveCurrent}>Save preset</Button><Button variant="ghost" onClick={cancelCreate}>Cancel</Button></div>{createError && <small className="arcane-core-preset-error">{createError}</small>}</div>}
    {!presets.length && !isCreating && <div className="arcane-core-preset-empty"><strong>No presets saved yet.</strong><span>Save the current Arcane Core layout to switch back to it later.</span></div>}
    {presets.length > 0 && <div className="arcane-core-preset-list">{presets.map((preset) => {
      const summary = getArcaneCorePresetSummary(preset.state)
      const isEditing = editingId === preset.id
      const isDeleting = deletingId === preset.id
      return <div className="arcane-core-preset-row" key={preset.id}>
        <div className="arcane-core-preset-main">{isEditing ? <div className="arcane-core-preset-rename"><input aria-label={`Rename ${preset.name}`} autoFocus maxLength={32} value={editingName} onChange={(event) => { setEditingName(event.target.value); setRenameError(null) }} onKeyDown={(event) => { if (event.key === 'Enter') saveRename(preset.id); if (event.key === 'Escape') { setEditingId(null); setRenameError(null) } }} /><Button variant="primary" onClick={() => saveRename(preset.id)}>Save</Button><Button variant="ghost" onClick={() => { setEditingId(null); setRenameError(null) }}>Cancel</Button>{renameError && <small className="arcane-core-preset-error">{renameError}</small>}</div> : <><strong>{preset.name}</strong><span>{summary.unlockedNodes} nodes · {summary.totalRanks} ranks</span><small>{formatUpdatedAt(preset.updatedAt)}</small></>}</div>
        {!isEditing && <div className="arcane-core-preset-actions">{isDeleting ? <><span className="arcane-core-preset-delete-copy">Delete preset?</span><Button variant="danger" onClick={() => deletePreset(preset.id)}>Delete</Button><Button variant="ghost" onClick={() => setDeletingId(null)}>Cancel</Button></> : <><Button variant="secondary" onClick={() => loadPreset(preset.id)}>Load</Button><Button variant="ghost" onClick={() => updatePreset(preset.id)}>Update</Button><Button variant="ghost" onClick={() => beginRename(preset.id, preset.name)}>Rename</Button><GameTooltip content={`Delete preset ${preset.name}`}><Button variant="ghost" onClick={() => { setEditingId(null); setRenameError(null); setDeletingId(preset.id) }} ariaLabel={`Delete preset ${preset.name}`}><X size={13} /></Button></GameTooltip></>}</div>}
      </div>
    })}</div>}
  </Card>
}
