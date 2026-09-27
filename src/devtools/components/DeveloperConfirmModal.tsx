import { Button, ModalPortal } from '../../components/ui'

export function DeveloperConfirmModal({ open, title, mutation, changes, remains, confirmLabel = 'CONFIRM', onConfirm, onCancel }: { open: boolean; title: string; mutation: string; changes: string[]; remains: string[]; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  return <ModalPortal open={open} onClose={onCancel} backdropClassName="developer-confirm-backdrop" surfaceClassName="developer-confirm-surface" ariaLabel={title}>
    <div className="developer-confirm-head"><span className="eyebrow">DEVELOPER CONFIRMATION</span><h2>{title}</h2></div>
    <div className="developer-confirm-body"><span className="developer-confirm-mutation">{mutation}</span><section><h3>What changes</h3><ul>{changes.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h3>What remains</h3><ul>{remains.map((item) => <li key={item}>{item}</li>)}</ul></section></div>
    <div className="button-row developer-confirm-actions"><Button variant="ghost" onClick={onCancel}>CANCEL</Button><Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button></div>
  </ModalPortal>
}
