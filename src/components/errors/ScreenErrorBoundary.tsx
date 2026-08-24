import { Component, type ErrorInfo, type ReactNode } from 'react'
import type { ScreenId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { resetScreenLayout } from '../../ui/layout-editor/layoutEditorStore'
import { Button, Card, Status } from '../ui'

interface Props { children: ReactNode; screen: ScreenId }
interface State { error: Error | null; componentStack: string }
const SCREEN_LABELS: Record<ScreenId, string> = { home: 'Overview', tower: 'Wizard Tower', schools: 'Magic Schools', combat: 'Combat', inventory: 'Inventory', equipment: 'Equipment', guild: 'Guild', collection: 'Collection', settings: 'Settings / Info' }

export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: '' }

  static getDerivedStateFromError(error: Error): State { return { error, componentStack: '' } }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, componentStack: info.componentStack ?? '' })
  }

  render() {
    if (!this.state.error) return this.props.children
    return <ScreenErrorFallback screen={this.props.screen} error={this.state.error} componentStack={this.state.componentStack} />
  }
}

function ScreenErrorFallback({ screen, error, componentStack }: { screen: ScreenId; error: Error; componentStack: string }) {
  const setScreen = useGameStore((state) => state.setScreen)
  const showDebug = useGameStore((state) => state.ui.showDebug)
  return <div className="screen-error-fallback"><Card title="This screen failed to render."><Status tone="warning">Screen: {SCREEN_LABELS[screen]}</Status><p className="error-summary">The rest of the game is still running. Your save and active systems are intact.</p>{showDebug && <details open className="error-details"><summary>Error details</summary><pre>{error.message}{componentStack}</pre></details>}<div className="button-row"><Button onClick={() => setScreen('home')}>Return Home</Button><Button variant="secondary" onClick={() => resetScreenLayout(screen)}>Reset This Screen Layout</Button><Button variant="ghost" onClick={() => window.location.reload()}>Reload</Button></div></Card></div>
}
