# Inventory Phase 3.2

Inventory is the Tower Vault: it shows only item types currently owned by the player. Collection remains the discovered/content catalogue and may show entries that are not currently owned.

## Vault categories

- **Materials** — classified by function, not source. Current subcategories are Elemental, Creature, Ore, Refined, and Arcane.
- **Loot** — unique trophies, relics, tokens, and other non-generic drops. Current Heartseed is a loot item.
- **Equipment** — weapons, robes, focus items, and charms.
- **Special** — reserved for future quest, key, event, and progression objects.
- **Protected** — a utility filter; it is not a primary category.

The authoritative content model keeps the legacy `category` key for compatibility and adds `inventoryCategory` plus `materialSubtype` for Vault presentation. Search uses normalized item metadata, including source, uses, school, equipment slot, and stat associations.

Recent acquisition entries are transient session UI state. They record the latest gain amount for up to eight distinct item types and are deliberately excluded from gameplay saves. Existing Inventory Editor panel IDs remain `inventory-catalog` and `inventory-detail`.
