import { Flame, HeartPulse, Shield, Snowflake, TrendingDown, TrendingUp, WandSparkles } from 'lucide-react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { SpellCatalogTag } from './spellBrowserSelectors'

type SemanticIconDefinition = {
  label: string
  description: string
  className: string
  icon: typeof Flame
}

/** One data-driven visual vocabulary for compact Spell Library metadata. */
export const SPELL_SEMANTIC_ICON_MAP: Record<SpellCatalogTag, SemanticIconDefinition> = {
  Damage: { label: 'Direct Damage', description: 'Deals immediate damage when the Spell resolves.', className: 'is-damage', icon: Flame },
  DoT: { label: 'Damage over Time', description: 'Applies damage that resolves over time.', className: 'is-dot', icon: Flame },
  Healing: { label: 'Healing', description: 'Restores the wizard’s health when the Spell resolves.', className: 'is-healing', icon: HeartPulse },
  Barrier: { label: 'Barrier', description: 'Creates or restores a defensive barrier.', className: 'is-defense', icon: Shield },
  Buff: { label: 'Buff', description: 'Applies a beneficial status effect.', className: 'is-buff', icon: TrendingUp },
  Debuff: { label: 'Debuff', description: 'Applies a harmful status effect to a target.', className: 'is-debuff', icon: TrendingDown },
  Control: { label: 'Control', description: 'Restricts or changes combat behavior through control effects.', className: 'is-control', icon: Snowflake },
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
            content={<TooltipContent title={definition.label} description={definition.description} />}
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
