import type { ReactNode } from 'react'

export function InspectorTransition({ identity, children }: { identity: string | number | null | undefined; children: ReactNode }) {
  return <div className="inspector-transition" data-inspector-identity={identity ?? 'empty'} key={identity ?? 'empty'}>{children}</div>
}
