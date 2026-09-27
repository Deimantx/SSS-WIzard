import type { DeveloperToolsTab } from './developerToolsStore'
import { Suspense } from 'react'
import { getDeveloperToolDefinition } from './developerToolRegistry'

export function DeveloperTab({ tab, copy }: { tab: DeveloperToolsTab; copy: (label: string, value: unknown) => Promise<void> }) {
  const definition = getDeveloperToolDefinition(tab)
  if (!definition) return <div className="developer-empty-state"><strong>Unknown developer tool</strong><span>The requested tool is not registered in the V4 registry.</span><code>{tab}</code></div>
  const Component = definition.component
  return <Suspense fallback={<div className="developer-empty-state"><strong>Loading {definition.label}</strong><span>Preparing the registered tester surface.</span></div>}><Component copy={copy} /></Suspense>
}
