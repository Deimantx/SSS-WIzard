import { useEffect, useRef, useState } from 'react'
import { Check, Play, Plus, Trash2, X } from 'lucide-react'
import { Button, Status } from '../components/ui'
import { createProfile, deleteProfile, enterProfile } from './profileController'
import { closeCreateProfileDialog, openCreateProfileDialog, useProfileSession } from './profileSessionStore'
import { DIFFICULTIES, GAME_MODES, type ProfileMetadata, type ProfileSlotId } from './profileTypes'
import { PROFILE_SLOT_IDS } from './profileKeys'

const formatDate = (value: number | null, emptyLabel: string) => {
  if (!value) return emptyLabel
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(value)
}

export function ProfileSelectScreen() {
  const session = useProfileSession()
  const [error, setError] = useState<string | null>(null)
  const [busySlot, setBusySlot] = useState<ProfileSlotId | null>(null)
  const select = (slotId: ProfileSlotId) => {
    setError(null)
    setBusySlot(slotId)
    const result = enterProfile(slotId)
    setBusySlot(null)
    if (!result.ok) setError(result.error)
  }
  const remove = (profile: ProfileMetadata) => {
    if (!window.confirm(`Delete ${profile.name}? This removes its local gameplay save.`)) return
    const result = deleteProfile(profile.slotId)
    if (!result.ok) setError(result.error)
  }
  return <div className="profile-launcher">
    <div className="profile-launcher-glow" />
    <main className="profile-launcher-main" aria-label="Profile selection">
      <header className="profile-launcher-header"><div className="profile-brand-mark">SSS</div><div><div className="eyebrow">ARCANE INCREMENTAL RPG</div><h1>Choose a Profile</h1><p>Each profile has an independent gameplay save. Your interface layout and appearance remain shared on this browser.</p></div></header>
      {error && <div className="profile-error" role="alert">{error}</div>}
      <div className="profile-grid">{PROFILE_SLOT_IDS.map((slotId) => {
        const profile = session.profiles.slots[slotId]
        return <article className={`profile-card ${profile ? 'occupied' : 'empty'}`} key={slotId}>
          {profile ? <><div className="profile-card-top"><div><span className="profile-slot">SLOT {profile.slotNumber}</span><h2>{profile.name}</h2></div><span className="profile-sigil">✦</span></div>{profile.unsupportedReason ? <div className="profile-unsupported"><Status tone="warning">Unsupported profile</Status><p>{profile.unsupportedReason}</p></div> : <div className="profile-badges"><Status tone="active">{GAME_MODES[profile.gameMode].name}</Status><Status tone="neutral">{DIFFICULTIES[profile.difficulty].name}</Status></div>}<dl className="profile-meta"><div><dt>Last played</dt><dd>{formatDate(profile.lastPlayedAt, 'Never played')}</dd></div><div><dt>Last saved</dt><dd>{formatDate(profile.lastSavedAt, 'Never saved')}</dd></div></dl><div className="profile-card-actions"><Button onClick={() => select(slotId)} disabled={busySlot !== null || Boolean(profile.unsupportedReason)}>{busySlot === slotId ? 'Opening…' : <><Play size={14} /> Play</>}</Button><button className="profile-delete" onClick={() => remove(profile)} aria-label={`Delete profile ${profile.name}`}><Trash2 size={15} /> Delete</button></div></> : <button className="profile-empty-action" aria-label={`Create Profile in Slot ${slotId.slice(-1)}`} onClick={() => { setError(null); openCreateProfileDialog(slotId) }}><span className="profile-plus"><Plus size={25} /></span><strong>Create New Profile</strong><small>Slot {slotId.slice(-1)} · Default / Normal</small></button>}
        </article>
      })}</div>
      <footer className="profile-launcher-footer"><span>3 local profile slots · Stored in this browser</span><span>No cloud save</span></footer>
    </main>
    {session.createDialogSlot && <CreateProfileDialog slotId={session.createDialogSlot} onError={setError} />}
  </div>
}

function CreateProfileDialog({ slotId, onError }: { slotId: ProfileSlotId; onError: (error: string | null) => void }) {
  const [name, setName] = useState(`Wizard ${slotId.slice(-1)}`)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])
  const submit = () => {
    const result = createProfile(slotId, name)
    if (!result.ok) onError(result.error)
  }
  return <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreateProfileDialog() }}><section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="create-profile-title" onKeyDown={(event) => { if (event.key === 'Escape') closeCreateProfileDialog() }}><header><div><span className="eyebrow">NEW WIZARD · SLOT {slotId.slice(-1)}</span><h2 id="create-profile-title">Create profile</h2></div><button className="icon-button" onClick={closeCreateProfileDialog} aria-label="Close create profile dialog"><X size={18} /></button></header><label className="profile-field">Profile name<input ref={inputRef} value={name} maxLength={24} onChange={(event) => { setName(event.target.value); onError(null) }} onKeyDown={(event) => { if (event.key === 'Enter' && name.trim()) submit() }} /></label><label className="profile-field">Game mode<select value="default" onChange={() => undefined}><option value="default">{GAME_MODES.default.name}</option></select><small>{GAME_MODES.default.description}</small></label><label className="profile-field">Difficulty<select value="normal" onChange={() => undefined}><option value="normal">{DIFFICULTIES.normal.name}</option></select><small>{DIFFICULTIES.normal.description}</small></label><div className="profile-modal-note"><Check size={14} /> This profile starts with a fresh gameplay state.</div><div className="profile-modal-actions"><Button variant="ghost" onClick={closeCreateProfileDialog}>Cancel</Button><Button onClick={submit} disabled={!name.trim()}>Create Profile</Button></div></section></div>
}
