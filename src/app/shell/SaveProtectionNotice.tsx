import { useSaveDiagnosticsStore } from '../../persistence/saveDiagnosticsStore'

export function SaveProtectionNotice() {
  const diagnostics = useSaveDiagnosticsStore()
  if (diagnostics.health !== 'protected' && diagnostics.health !== 'error') return null
  const protectedSave = diagnostics.health === 'protected'
  return <div className={`save-protection-notice ${protectedSave ? '' : 'is-error'}`} role="alert"><strong>{protectedSave ? 'SAVE PROTECTION ACTIVE' : 'SAVE FAILED'}</strong><span>{protectedSave ? 'A possible progression rollback was blocked. Your previous save was not overwritten.' : 'The game could not write to browser storage. Your previous save was not overwritten.'}</span></div>
}
