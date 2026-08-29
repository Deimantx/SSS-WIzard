import { SCHOOLS } from '../../game/content/schools/schools'
import type { SchoolId } from '../../game/types'

export function SpellIcon({ school, locked = false, size = 'medium' }: { school: SchoolId; locked?: boolean; size?: 'small' | 'medium' | 'large' }) {
  const definition = SCHOOLS[school]
  return <span aria-hidden="true" className={`spell-icon-shell spell-icon-${size}${locked ? ' is-locked' : ''}`} style={{ '--spell-school-color': definition.color } as React.CSSProperties}>{locked ? '?' : definition.glyph}</span>
}
