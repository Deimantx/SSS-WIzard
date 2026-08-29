import { Pencil } from 'lucide-react'
import { useRef } from 'react'
import { Button, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'

export function EditablePresetName({ value, editing, error, autoFocus, maxLength = 40, onChange, onStartEdit, onCommit, onCancel }: { value: string; editing: boolean; error: string | null; autoFocus?: boolean; maxLength?: number; onChange: (value: string) => void; onStartEdit: () => void; onCommit: (value: string) => boolean; onCancel: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelledRef = useRef(false)
  if (!editing) return <div className="spell-preset-name-display"><strong>{value || 'New Preset'}</strong><GameTooltip content={<TooltipContent title="Edit preset name" description="Rename this draft without changing any spell mechanics." />}><Button icon variant="ghost" ariaLabel="Edit preset name" onClick={onStartEdit}><Pencil size={14} aria-hidden="true" /></Button></GameTooltip></div>
  const commit = () => { if (cancelledRef.current) return; if (!onCommit(value)) window.setTimeout(() => inputRef.current?.focus(), 0) }
  return <div className={`spell-preset-name-editor${error ? ' has-error' : ''}`}>
    <input ref={inputRef} data-autofocus={autoFocus ? 'true' : undefined} autoFocus={autoFocus} value={value} maxLength={maxLength} onFocus={() => { cancelledRef.current = false }} onChange={(event) => onChange(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commit() } if (event.key === 'Escape') { event.preventDefault(); cancelledRef.current = true; onCancel() } }} aria-label="Preset name" aria-invalid={Boolean(error)} />
    {error && <span role="alert">{error}</span>}
  </div>
}
