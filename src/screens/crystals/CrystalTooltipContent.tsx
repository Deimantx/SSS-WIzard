import type { CSSProperties } from "react";
import type { CrystalVariantId, GameState } from "../../game/types";
import {
  CRYSTAL_GROUP_CAP,
  CRYSTAL_GROUP_LABELS,
  getCrystalFamily,
  getCrystalTier,
  getCrystalVariantName,
  getCrystalVariantStats,
} from "../../game/content/crystals/crystals";
import {
  getCrystalEquippedCount,
  getCrystalGroupUsage,
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
  slotIndex,
}: {
  variantId: CrystalVariantId;
  crystals?: GameState["crystals"];
  slotIndex?: number;
}) {
  const family = getCrystalFamily(variantId);
  const stats = getCrystalVariantStats(variantId);
  const owned = crystals ? getCrystalOwnedCount({ crystals }, variantId) : null;
  const equipped = crystals
    ? getCrystalEquippedCount({ crystals }, variantId)
    : null;
  const groupUsage = crystals
    ? getCrystalGroupUsage({ crystals }, family.group)
    : null;

  return (
    <div
      className="game-tooltip-content game-tooltip-rich crystal-tooltip-content"
      style={{ "--crystal-color": family.color } as CSSProperties}
    >
      <div className="crystal-tooltip-header">
        <span className="crystal-tooltip-meta">
          T{getCrystalTier(variantId)} · {CRYSTAL_GROUP_LABELS[family.group]}
        </span>
        <strong className="crystal-tooltip-name">
          {getCrystalVariantName(variantId)}
        </strong>
        <p>{family.description}</p>
      </div>
      <div className="tooltip-section crystal-tooltip-section">
        <small>EFFECT</small>
        <div className="tooltip-row-list">
          {Object.entries(stats).map(([key, value]) => (
            <div className="tooltip-row" key={key}>
              <span>{CRYSTAL_STAT_LABELS[key] ?? key}</span>
              <b>+{formatCrystalStat(key, Number(value))}</b>
            </div>
          ))}
        </div>
      </div>
      {crystals && (
        <div className="tooltip-section crystal-tooltip-footer">
          <div className="tooltip-row">
            <span>GROUP LIMIT</span>
            <b>
              {groupUsage} / {CRYSTAL_GROUP_CAP}
            </b>
          </div>
          {slotIndex !== undefined ? (
            <div className="tooltip-row">
              <span>EQUIPPED</span>
              <b>SLOT {slotIndex + 1}</b>
            </div>
          ) : (
            <div className="crystal-tooltip-ownership">
              <span>OWNED {owned}</span>
              <span>EQUIPPED {equipped}</span>
              <span>
                AVAILABLE {Math.max(0, (owned ?? 0) - (equipped ?? 0))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
