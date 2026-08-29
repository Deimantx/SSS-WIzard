import type { SpellEquipmentBonusPreview } from '../../game/systems/spells/spellEquipmentPreview'

export function SpellEquipmentBonuses({ preview }: { preview: SpellEquipmentBonusPreview }) {
  return <div className="spell-equipment-bonuses">
    {preview.current.length ? preview.current.map((modifier, index) => <div className="spell-equipment-row" key={`${modifier.itemId}-${index}`}><span>{modifier.itemName}</span><strong>{modifier.label} +{Math.round(modifier.value * 100)}%</strong></div>) : <p className="muted">No current equipment contribution to this spell.</p>}
    <div className="spell-equipment-total"><span>Current contribution</span><strong>+{Math.round(preview.totalPercent * 100)}%</strong></div>
    <div className="spell-equipment-future"><small>FUTURE SUPPORT</small>{preview.future.map((item) => <p key={item}>{item}</p>)}</div>
  </div>
}
