export function GridOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null
  return <div className="ui-editor-grid-overlay" aria-hidden="true" />
}
