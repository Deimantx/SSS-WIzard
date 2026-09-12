import type { ReactNode } from 'react'
import { SCHOOLS } from '../../game/content/schools/schools'
import type { SchoolId, SpellId } from '../../game/types'
import { resolveGameAssetIcon } from '../../ui/icons/gameAssetIcons'

export function SpellIcon({ school, spellId, locked = false, size = 'medium', art }: { school: SchoolId; spellId?: SpellId; locked?: boolean; size?: 'small' | 'medium' | 'large'; art?: ReactNode }) {
  const definition = SCHOOLS[school]
  const asset = !locked ? resolveGameAssetIcon(spellId ? { kind: 'spell', id: spellId } : { kind: 'school', id: school }) : null
  const content = locked ? '?' : art ?? (asset ? <img src={asset} alt="" draggable={false} /> : definition.glyph)
  return <span aria-hidden="true" className={`spell-icon-shell spell-icon-${size}${locked ? ' is-locked' : ''}`} style={{ '--spell-school-color': definition.color } as React.CSSProperties}>{content}</span>
}
