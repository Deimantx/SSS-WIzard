# Experimental Icon Asset Pack Mapping

This is a presentation-only experiment. Runtime gameplay content keeps its authored `icon` values and optional `image` fields; this document records only the selected raster mappings.

## Asset audit

- Source folder: `src/assets/Icons/Test/`
- Pack size: 2,192 PNG files (`fc1.png`–`fc2192.png`)
- Visual audit: all 22 authoring contact sheets were reviewed; the pack is predominantly 64×64 transparent pixel-art icons.
- Identified groups: elemental crystals, materials and loot, spell/effect art, weapons, armor/robes/hoods/capes, jewelry, creature-like silhouettes, and miscellaneous utility/arcane symbols.

## Used mappings

| Asset file | Game content | Category | Reason | Status |
| --- | --- | --- | --- | --- |
| `fc163.png`, `fc164.png`, `fc165.png`, `fc166.png`, `fc170.png` | Fire, Earth, Water, Prismatic, Air Fragment | Materials | Clear colored faceted crystal identity | USED |
| `fc383.png`, `fc384.png`, `fc659.png` | Life Essence, Wisp Essence, Heartseed | Materials | Clear orb, essence, and heart silhouettes | USED |
| `fc202.png`, `fc204.png`, `fc231.png`, `fc251.png`, `fc315.png` | Grove Bark, Burial Cloth, Ossuary Remnant, Thorn Fiber, Rootstone Shard | Materials | Direct bark, cloth, bone, thorn, and stone matches | USED |
| `fc115.png`, `fc168.png`, `fc234.png`, `fc492.png`, `fc496.png`, `fc749.png`, `fc751.png` | Corrupted Beast Essence, Graveglass Shard, Predator Fang, Predator Sinew, Predator Hide, Black Portal Shard, Soul Residue | Materials | Strong creature-material, shard, fang, hide, and residue silhouettes | USED |
| `fc1712.png`, `fc1601.png`, `fc1706.png`, `fc1704.png` | Ember Staff, Tideglass Wand, Stoneheart Scepter, Windthread Wand | Equipment / Artifacts | Distinct colored magical weapon silhouettes | USED |
| `fc1977.png`, `fc1954.png`, `fc2032.png`, `fc2031.png`, `fc1976.png` | Wispweave Robe, Wispveil Hood, Grovekeeper Mantle, Predator-Hide Mantle, Ossuary Mantle | Equipment / Artifacts | Readable robe, hood, cloak, and dark garment silhouettes | USED |
| `fc2062.png`, `fc2063.png`, `fc2064.png`, `fc2065.png`, `fc2066.png`, `fc2067.png`, `fc2068.png`, `fc2069.png`, `fc2070.png`, `fc2075.png`, `fc2076.png` | T1/T2 earrings, charms, necklaces, rings, and amulets | Equipment / Artifacts | Correct jewelry silhouettes with distinct variants | USED |
| `fc1001.png`, `fc998.png`, `fc1008.png`, `fc1013.png`, `fc1017.png`, `fc1014.png`, `fc1033.png`, `fc1043.png`, `fc1042.png`, `fc1071.png`, `fc1070.png`, `fc1047.png` | Fire Bolt, Ignite, Fireball, Water Ward, Flow Mend, Frostbite, Earth Spike, Stoneguard, Fortify, Air Lance, Quickening, Shock Spark | Spells | Clear projectile, flame, orb, shield, ice, earth, wind, and spark silhouettes | USED |
| `fc993.png`, `fc1020.png`, `fc1032.png`, `fc1065.png` | Fire, Water, Earth, Air | Magic Schools | Coherent elemental identity when no exact spell ID is supplied | USED |
| `fc693.png`, `fc711.png`, `fc747.png`, `fc709.png`, `fc853.png`, `fc683.png`, `fc742.png` | Burning, Chilled, Thorn Wound, Regeneration, Fortified, Shock, Bleeding | Combat Statuses | Remain legible at compact status-chip scale | USED |

## REJECTED OR AMBIGUOUS

- Most duplicate weapon and armor variants were not mapped because their silhouettes are interchangeable at game scale.
- Generic purple/arcane symbols were not assigned to materials without a clear semantic match.
- Creature-like silhouettes were not used as monster portraits; they are not reliable portraits of the authored monsters.
- No dungeon, campaign, portal-screen, Research, Guild, or Tower-system art was selected because the pack did not provide a high-confidence identity match.

## KEPT LEGACY

- Sidebar/navigation and generic utility controls (search, close, settings, chevrons, filters, sort, Edit UI, Developer Tools, and window controls).
- Monster and dungeon identity artwork.
- Tiny school filter glyphs and Developer Tools icons where the existing compact vectors are clearer.
- Unmapped statuses and any content without a strong asset match.

## Rollback

The source switch is `GAME_ICON_MODE` in `src/ui/icons/gameAssetIcons.ts`; changing its value from `'asset-pack'` to `'legacy'` makes the resolver return `null`, restoring each component's existing authored image or glyph fallback. Removing any single registry entry has the same local fallback behavior. No save data, gameplay logic, balance, or content definitions are changed by this experiment.
