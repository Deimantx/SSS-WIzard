import type { SpellEquipmentBonusPreview } from '../../game/systems/spells/spellEquipmentPreview'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../components/ui/item'

export function SpellEquipmentBonuses({ preview }: { preview: SpellEquipmentBonusPreview }) {
  return <div className="spell-equipment-bonuses">
    {preview.current.length ? preview.current.map((modifier, index) => <div className="spell-equipment-row" key={`${modifier.itemId}-${index}`}><span className="spell-equipment-item"><ItemIcon itemId={modifier.itemId} size="tiny" /><span>{modifier.itemName}</span></span><strong>{modifier.label} +{Math.round(modifier.value * 100)}%</strong></div>) : <p className="muted">No current equipment contribution to this spell.</p>}
    {preview.current.length > 0 && <div className="spell-equipment-total"><span>Current contribution</span><strong>+{Math.round(preview.totalPercent * 100)}%</strong></div>}
    <GameTooltip block content={<TooltipContent title="Future modifier channels" description="These channels are reserved for later equipment mechanics and do not affect the current preview." />}><div className="spell-equipment-future"><small>FUTURE CHANNELS</small><p><span>Cooldown Reduction</span><b>Not supported yet</b></p><p><span>Mana Cost Reduction</span><b>Not supported yet</b></p><p><span>Status Potency</span><b>Not supported yet</b></p>{preview.future.map((item) => <p className="spell-equipment-future-note" key={item}>{item}</p>)}</div></GameTooltip>
  </div>
}
