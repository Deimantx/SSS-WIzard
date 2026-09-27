import { useSaveDiagnosticsStore } from '../../persistence/saveDiagnosticsStore'

export function SaveProtectionNotice() {
  const diagnostics = useSaveDiagnosticsStore()
  if (diagnostics.health !== 'protected' && diagnostics.health !== 'error') return null
  const protectedSave = diagnostics.health === 'protected'
  const quota = diagnostics.lastFailureKind === 'quota'
  return <div className={`save-protection-notice ${protectedSave ? '' : 'is-error'}`} role="alert"><strong>{protectedSave ? 'SAVE PROTECTION ACTIVE' : quota ? 'SAVE STORAGE FULL' : 'SAVE FAILED'}</strong><span>{protectedSave ? 'A possible progression rollback was blocked. Your previous save was not overwritten.' : quota ? 'The current profile is too large for browser storage. Your previous valid save was preserved.' : 'The profile could not be written. Your previous valid save was preserved.'}</span>{diagnostics.lastFailureDetail && <small>{diagnostics.lastFailureDetail}</small>}</div>
}
