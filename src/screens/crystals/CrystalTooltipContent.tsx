import type { CrystalVariantId, GameState } from "../../game/types";
import {
  CRYSTAL_GROUP_LABELS,
  CRYSTAL_GROUP_CAP,
  getCrystalFamily,
  getCrystalTier,
  getCrystalVariantName,
  getCrystalVariantStats,
} from "../../game/content/crystals/crystals";
import {
  getCrystalEquippedCount,
  getCrystalOwnedCount,
} from "../../game/systems/crystals/crystalRuntime";

export const CRYSTAL_STAT_LABELS: Record<string, string> = {
  spellPower: "Spell Power",
  maxHealth: "Max Health",
  healthRegen: "Health Regen",
  maxMana: "Max Mana",
  manaRegen: "Mana Regen",
  maxFocus: "Max Focus",
  defense: "Defense",
  critChance: "Crit Chance",
  critDamage: "Crit Damage",
  cooldownRecoveryPct: "Cooldown Recovery",
  barrierPowerPct: "Barrier Power",
  damageOverTimePct: "Damage over Time",
  statusDurationPct: "Status Duration",
  manaCostReductionPct: "Mana Cost Reduction",
  focusEfficiencyPct: "Focus Efficiency",
};

const PERCENT_STATS = new Set([
  "critChance",
  "critDamage",
  "cooldownRecoveryPct",
  "barrierPowerPct",
  "damageOverTimePct",
  "statusDurationPct",
  "manaCostReductionPct",
  "focusEfficiencyPct",
]);

export const formatCrystalStat = (key: string, value: number) =>
  PERCENT_STATS.has(key)
    ? `${value * 100 >= 10 ? (value * 100).toFixed(0) : (value * 100).toFixed(1)}%`
    : key === "healthRegen" || key === "manaRegen"
      ? `${value.toFixed(1)}/s`
      : `${Math.round(value * 100) / 100}`;

export function CrystalTooltipContent({
  variantId,
  crystals,
}: {
  variantId: CrystalVariantId;
  crystals?: GameState["crystals"];
}) {
  const family = getCrystalFamily(variantId);
  const stats = getCrystalVariantStats(variantId);
  const owned = crystals ? getCrystalOwnedCount({ crystals }, variantId) : null;
  const equipped = crystals
    ? getCrystalEquippedCount({ crystals }, variantId)
    : null;
  return (
    <>
      <strong>{getCrystalVariantName(variantId)}</strong>
      <p>
        {CRYSTAL_GROUP_LABELS[family.group]} · TIER {getCrystalTier(variantId)}
      </p>
      <p>{family.description}</p>
      <p>
        {Object.entries(stats)
          .map(
            ([key, value]) =>
              `${CRYSTAL_STAT_LABELS[key] ?? key} +${formatCrystalStat(key, Number(value))}`,
          )
          .join(" · ")}
      </p>
      {crystals && (
        <p>
          Group Limit: {CRYSTAL_GROUP_CAP} · Owned: {owned} · Equipped: {equipped} ·
          Available: {Math.max(0, (owned ?? 0) - (equipped ?? 0))}
        </p>
      )}
    </>
  );
}
