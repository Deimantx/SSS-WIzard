import { SCHOOLS } from '../../game/content/schools/schools'
import type { SchoolId } from '../../game/types'
import type { ReactNode } from 'react'

export function SpellIcon({ school, locked = false, size = 'medium', art }: { school: SchoolId; locked?: boolean; size?: 'small' | 'medium' | 'large'; art?: ReactNode }) {
  const definition = SCHOOLS[school]
  return <span aria-hidden="true" className={`spell-icon-shell spell-icon-${size}${locked ? ' is-locked' : ''}`} style={{ '--spell-school-color': definition.color } as React.CSSProperties}>{locked ? '?' : art ?? definition.glyph}</span>
}
