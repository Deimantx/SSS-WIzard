import { useSaveDiagnosticsStore } from '../../persistence/saveDiagnosticsStore'

export function SaveProtectionNotice() {
  const diagnostics = useSaveDiagnosticsStore()
  if (diagnostics.health !== 'protected' && diagnostics.health !== 'error') return null
  const protectedSave = diagnostics.health === 'protected'
  return <div className={`save-protection-notice ${protectedSave ? '' : 'is-error'}`} role="alert"><strong>{protectedSave ? 'SAVE PROTECTION ACTIVE' : 'SAVE ERROR'}</strong><span>{protectedSave ? 'The current game state contains impossible progression regression. Your previous save was NOT overwritten.' : 'Your previous save was NOT overwritten.'}</span></div>
}
