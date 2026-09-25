import type {
  ActionPattern,
  ActionStep,
  BestiaryCategory,
  CombatActionDefinition,
  CombatEffect,
  CombatTag,
  DamageType,
  ItemId,
  Magnitude,
  MonsterId,
  StatusId,
  TraitId,
} from "../../types";
import { periodicDamageStatus } from "../statuses/periodicDamageStatus";
import { getDungeonArtifactEssenceRange } from "../dungeons/dungeonLoot";
import type { DungeonId } from "../../types";
import type { ResonanceYield } from "../resonance/resonance";

export type MonsterPortraitIcon =
  | "wisp"
  | "plant"
  | "stone"
  | "guardian"
  | "wolf"
  | "claw"
  | "bear"
  | "skeleton"
  | "ghost"
  | "mage"
  | "boss";

export interface MonsterDefinition {
  id: MonsterId;
  bestiaryCategory: BestiaryCategory;
  name: string;
  subtitle: string;
  maxHealth: number;
  basicAttackDamage: number;
  /** Base amount of time required for one Basic Attack Pattern step. */
  basicAttackTimeMs: number;
  /** Optional RPG stat overrides. Runtime defaults live in combatStats. */
  defense?: number;
  critChance?: number;
  critDamage?: number;
  blockChance?: number;
  color: string;
  image?: string;
  ui?: {
    portraitIcon?: MonsterPortraitIcon;
    bestiary?: {
      /** Scan-level encounter labels only; combat values remain authored in combat definitions. */
      roleTags?: string[];
      phaseLabels?: Record<string, string>;
      phaseOrder?: string[];
    };
  };
  traitIds: TraitId[];
  resistances?: Partial<Record<DamageType, number>>;
  damageImmunities?: DamageType[];
  statusImmunities?: StatusId[];
  statusTagImmunities?: CombatTag[];
  loot: { itemId: ItemId; min: number; max: number; chance: number }[];
  /** Optional during Phase 1 while the rest of the authored roster is converted. */
  resonanceYield?: ResonanceYield;
  actions: Record<string, CombatActionDefinition>;
  actionPatterns: Record<string, ActionPattern>;
  defaultActionPatternId: string;
}

export const basic = (id: string): ActionStep => ({ id, type: "basic" });
export const action = (id: string, actionId: string): ActionStep => ({
  id,
  type: "action",
  actionId,
});
export const lifeEssenceDrop = {
  itemId: "life-essence" as const,
  min: 1,
  max: 3,
  chance: 1,
};
export const withLifeEssence = (
  drops: MonsterDefinition["loot"],
  overrides: Partial<
    Pick<typeof lifeEssenceDrop, "min" | "max" | "chance">
  > = {},
): MonsterDefinition["loot"] => [
  ...drops,
  { ...lifeEssenceDrop, ...overrides },
];
export const withDungeonLoot = (
  dungeonId: DungeonId,
  role: "normal" | "boss",
  lifeEssence: Partial<
    Pick<typeof lifeEssenceDrop, "min" | "max" | "chance">
  > = {},
): MonsterDefinition["loot"] => {
  const essenceRange = getDungeonArtifactEssenceRange(dungeonId, role);
  const drops: MonsterDefinition["loot"] = [
    {
      itemId: "artifact-essence",
      min: essenceRange[0],
      max: essenceRange[1],
      chance: 1,
    },
  ];
  drops.push({ ...lifeEssenceDrop, ...lifeEssence });
  return drops;
};

/** Default Monster authoring: damage scales from Basic Attack Damage. */
export const scaledDirectDamage = (
  damageType: DamageType,
  coefficient: number,
  tags: CombatTag[] = ["direct"],
  lifeStealPercent?: number,
): Extract<CombatEffect, { type: "deal-damage" }> => ({
  type: "deal-damage",
  target: "opponent",
  components: [
    {
      damageType,
      magnitude: { type: "source-basic-damage-percent", value: coefficient },
    },
  ],
  tags,
  ...(lifeStealPercent === undefined ? {} : { lifeStealPercent }),
});
export const scaledMultiDamage = (
  components: Array<{ damageType: DamageType; coefficient: number }>,
  tags: CombatTag[] = ["direct"],
): CombatEffect => ({
  type: "deal-damage",
  target: "opponent",
  components: components.map(({ damageType, coefficient }) => ({
    damageType,
    magnitude: {
      type: "source-basic-damage-percent" as const,
      value: coefficient,
    },
  })),
  tags,
});
/** Explicit escape hatch for intentionally fixed Monster damage. */
export const flatDirectDamage = (
  damageType: DamageType,
  value: number,
  tags: CombatTag[] = ["direct"],
): CombatEffect => ({
  type: "deal-damage",
  target: "opponent",
  components: [{ damageType, magnitude: { type: "flat", value } }],
  tags,
});
export const gainBarrier = (magnitude: Magnitude): CombatEffect => ({
  type: "gain-barrier",
  target: "self",
  magnitude,
  mode: "add",
  durationMs: null,
  tags: ["barrier"],
});
/** Default Monster authoring: healing scales from the source Monster's Max Health. */
export const scaledHeal = (maxHealthCoefficient: number): CombatEffect => ({
  type: "heal",
  target: "self",
  magnitude: { type: "source-max-health-percent", value: maxHealthCoefficient },
  tags: ["heal", "direct"],
});
/** Default Monster authoring: Barrier scales from the source Monster's Max Health. */
export const scaledBarrier = (maxHealthCoefficient: number): CombatEffect =>
  gainBarrier({
    type: "source-max-health-percent",
    value: maxHealthCoefficient,
  });
export const opponentStatusStackScaled = (
  statusId: StatusId,
  base: Magnitude,
  perStack: number,
  maxStacks?: number,
): Magnitude => ({
  type: "opponent-status-stack-scaled",
  statusId,
  base,
  perStack,
  ...(maxStacks === undefined ? {} : { maxStacks }),
});
export const sourceStatusStackScaled = (
  statusId: StatusId,
  base: Magnitude,
  perStack: number,
  maxStacks?: number,
): Magnitude => ({
  type: "source-status-stack-scaled",
  statusId,
  base,
  perStack,
  ...(maxStacks === undefined ? {} : { maxStacks }),
});
export const sourceCurrentBarrierPercent = (value: number): Magnitude => ({
  type: "source-current-barrier-percent",
  value,
});
export const consumeBarrier = (): CombatEffect => ({
  type: "consume-barrier",
  target: "self",
  mode: "all",
});
export const applyStatus = (
  statusId: StatusId,
  target: "self" | "opponent",
  durationMs?: number | null,
  stacks?: number,
): CombatEffect => ({
  type: "apply-status",
  target,
  statusId,
  durationMs,
  ...(stacks === undefined ? {} : { stacks }),
  tags: [target === "self" ? "buff" : "debuff"],
});
export const drainMana = (value: number): CombatEffect => ({
  type: "drain-resource",
  target: "opponent",
  resource: "mana",
  magnitude: { type: "flat", value },
  tags: ["special"],
});
/** Delays the target's currently committed action, if one exists. */
export const delayCurrentAction = (amountMs: number): CombatEffect => ({
  type: "modify-action-timer",
  target: "opponent",
  action: "current",
  amountMs,
});
export const detonateStatus = (
  statusId: StatusId,
  multiplier: number,
  consume = false,
): CombatEffect => ({
  type: "detonate-status",
  target: "opponent",
  statusId,
  multiplier,
  consume,
});
/** Explicit escape hatch for intentionally fixed Monster healing. */
export const flatHeal = (value: number): CombatEffect => ({
  type: "heal",
  target: "self",
  magnitude: { type: "flat", value },
  tags: ["heal", "direct"],
});
/** Default Monster authoring: DoT coefficient is the total output over its duration. */
export const scaledDot = (
  statusId: StatusId,
  damageType: DamageType,
  totalBasicDamageCoefficient: number,
  durationMs: number,
): CombatEffect =>
  periodicDamageStatus({
    statusId,
    durationMs,
    damageType,
    totalMagnitude: {
      type: "source-basic-damage-percent",
      value: totalBasicDamageCoefficient,
    },
  });
