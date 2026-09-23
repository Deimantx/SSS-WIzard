import { Flame, HeartPulse, Shield, Snowflake, TrendingDown, TrendingUp, WandSparkles } from 'lucide-react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { SpellCatalogTag } from './spellBrowserSelectors'

type SemanticIconDefinition = {
  label: string
  className: string
  icon: typeof Flame
}

/** One data-driven visual vocabulary for compact Spell Library metadata. */
export const SPELL_SEMANTIC_ICON_MAP: Record<SpellCatalogTag, SemanticIconDefinition> = {
  Damage: { label: 'Direct Damage', className: 'is-damage', icon: Flame },
  DoT: { label: 'Damage over Time', className: 'is-dot', icon: Flame },
  Healing: { label: 'Healing', className: 'is-healing', icon: HeartPulse },
  Barrier: { label: 'Defensive Spell', className: 'is-defense', icon: Shield },
  Buff: { label: 'Buff', className: 'is-buff', icon: TrendingUp },
  Debuff: { label: 'Debuff', className: 'is-debuff', icon: TrendingDown },
  Control: { label: 'Control', className: 'is-control', icon: Snowflake },
}

export function SpellSemanticIcons({ tags }: { tags: readonly SpellCatalogTag[] }) {
  const label = tags.map((tag) => SPELL_SEMANTIC_ICON_MAP[tag].label).join(', ')
  return (
    <span className="spell-row-semantic-icons" aria-label={label}>
      {tags.map((tag) => {
        const definition = SPELL_SEMANTIC_ICON_MAP[tag]
        const Icon = definition.icon
        return (
          <GameTooltip
            key={tag}
            delay={200}
            content={<TooltipContent title={definition.label} description={`${definition.label} effect.`} />}
          >
            <span className={`spell-semantic-icon ${definition.className}`} role="img" aria-label={definition.label}>
              <Icon size={15} aria-hidden="true" />
            </span>
          </GameTooltip>
        )
      })}
      {!tags.length && (
        <GameTooltip
          delay={200}
          content={<TooltipContent title="Utility" description="A non-damage combat utility effect." />}
        >
          <span className="spell-semantic-icon is-utility" role="img" aria-label="Utility">
            <WandSparkles size={15} aria-hidden="true" />
          </span>
        </GameTooltip>
      )}
    </span>
  )
}
