import type { CSSProperties, ReactNode } from 'react'

interface InspectorTransitionProps {
  identity: string | number | null | undefined
  children: ReactNode
  accent?: string
  fill?: boolean
  className?: string
}

export function InspectorTransition({ identity, children, accent, fill = false, className = '' }: InspectorTransitionProps) {
  const style = accent ? { '--inspector-accent': accent } as CSSProperties : undefined
  return <div className={`inspector-transition ${fill ? 'fill-bounded' : ''} ${className}`.trim()} data-inspector-identity={identity ?? 'empty'} data-inspector-fill={fill ? 'true' : 'false'} style={style} key={identity ?? 'empty'}>{children}</div>
}
