import { useSaveDiagnosticsStore } from '../../persistence/saveDiagnosticsStore'

export function SaveProtectionNotice() {
  const diagnostics = useSaveDiagnosticsStore()
  if (diagnostics.health !== 'error') return null
  const quota = diagnostics.lastFailureKind === 'quota'
  const validation = diagnostics.lastFailureKind === 'validation'
  return <div className="save-protection-notice is-error" role="alert"><strong>{validation ? 'SAVE VALIDATION FAILED' : quota ? 'SAVE STORAGE FULL' : 'SAVE FAILED'}</strong><span>{validation ? 'The profile was not changed. Open Developer Tools → Diagnostics to review the exact field paths.' : quota ? 'The current profile is too large for browser storage. The previous valid V2 save was preserved.' : 'The profile could not be written. The previous V2 copy remains available when storage allows recovery.'}</span>{diagnostics.lastFailureDetail && <small>{diagnostics.lastFailureDetail}</small>}</div>
}
