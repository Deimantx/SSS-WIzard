import type {
  CombatEffect,
  CombatModifier,
  Magnitude,
  TraitDefinition,
  TraitId,
} from "../../systems/combat/combatTypes";
import { STATUS_DEFINITIONS } from "../statuses/statuses";
import {
  createCombatValidationContext,
  validateCombatModifier,
  validateCombatTriggerRule,
} from "../../systems/combat/combatEffectValidation";
import { ACT1_TRAIT_DEFINITIONS } from "./act1Traits";

const gainBarrier = (magnitude: Magnitude): CombatEffect => ({
  type: "gain-barrier",
  target: "self",
  magnitude,
  mode: "add",
  durationMs: null,
  tags: ["barrier"],
});

const applyStatus = (
  statusId: Extract<CombatEffect, { type: "apply-status" }>["statusId"],
  durationMs?: number | null,
): CombatEffect => ({
  type: "apply-status",
  target: "self",
  statusId,
  durationMs,
});

const ACT0_TRAIT_DEFINITIONS: Record<string, TraitDefinition> = {
  "forest-wisp-flicker": {
    id: "forest-wisp-flicker",
    name: "Flickering Current",
    description: "While Haste is active, deals 15% more Arcane damage.",
    modifiers: [
      {
        key: "damage-dealt-percent",
        value: 0.15,
        damageTypes: ["arcane"],
        condition: { type: "self-has-status", statusId: "haste" },
      },
    ],
  },
  "thornling-barkskin": {
    id: "thornling-barkskin",
    name: "Barkskin",
    description: "Starts combat Fortified for 8 seconds.",
    rules: [
      {
        id: "thornling-barkskin-start",
        event: "on-combat-start",
        effects: [applyStatus("fortified", 8000)],
        oncePerEncounter: true,
      },
    ],
  },
  "stone-rooted-shell": {
    id: "stone-rooted-shell",
    name: "Rooted Shell",
    description: "Starts combat with Barrier equal to 15% max HP.",
    rules: [
      {
        id: "stone-rooted-shell-start",
        event: "on-combat-start",
        effects: [
          gainBarrier({ type: "source-max-health-percent", value: 0.15 }),
        ],
        oncePerEncounter: true,
      },
    ],
  },
  "grove-sentinel-ancient-growth": {
    id: "grove-sentinel-ancient-growth",
    name: "Ancient Growth",
    description: "At 40% HP, gains a large Barrier once.",
    rules: [
      {
        id: "grove-sentinel-ancient-growth-threshold",
        event: "on-hp-threshold",
        condition: { type: "self-hp-below-percent", percent: 40 },
        effects: [
          gainBarrier({ type: "source-max-health-percent", value: 2 / 9 }),
        ],
        oncePerEncounter: true,
      },
    ],
  },
  "forest-heart-living-core": {
    id: "forest-heart-living-core",
    name: "Living Core",
    description:
      "At 50% Health, gains Haste, activates Rapid Regrow once, and changes to the Overgrown Pattern.",
    rules: [
      {
        id: "forest-heart-living-core-threshold",
        event: "on-hp-threshold",
        condition: { type: "self-hp-below-percent", percent: 50 },
        effects: [
          applyStatus("haste"),
          applyStatus("rapid-regrow"),
          {
            type: "set-action-pattern",
            target: "self",
            patternId: "overgrown",
          },
        ],
        oncePerEncounter: true,
      },
    ],
  },
  "cavefang-wolf-predator-instinct": {
    id: "cavefang-wolf-predator-instinct",
    name: "Predator Instinct",
    description:
      "Deals 25% more damage while the target is at or below 35% HP.",
    modifiers: [
      {
        key: "damage-dealt-percent",
        value: 0.25,
        condition: { type: "target-hp-below-percent", percent: 35 },
      },
    ],
  },
  "razorclaw-lynx-relentless-hunter": {
    id: "razorclaw-lynx-relentless-hunter",
    name: "Relentless Hunter",
    description: "Deals 20% more damage to Bleeding targets.",
    modifiers: [
      {
        key: "damage-dealt-percent",
        value: 0.2,
        condition: { type: "target-has-status", statusId: "bleeding" },
      },
    ],
  },
  "corrupted-dire-wolf-arcane-corruption": {
    id: "corrupted-dire-wolf-arcane-corruption",
    name: "Arcane Corruption",
    description:
      "Corruption grants 10% resistance to Fire, Water, Earth, and Air.",
  },
  "corrupted-greatbear-thick-hide": {
    id: "corrupted-greatbear-thick-hide",
    name: "Thick Hide",
    description: "Takes 12% less damage while above 50% Health.",
    modifiers: [
      {
        key: "damage-taken-percent",
        value: -0.12,
        condition: { type: "self-hp-above-percent", percent: 50 },
      },
    ],
  },
  "corrupted-greatbear-unstable-corruption": {
    id: "corrupted-greatbear-unstable-corruption",
    name: "Unstable Corruption",
    description:
      "At 50% Health, gains Haste, gains permanent Corrupted Fury, and switches to the Corrupted Pattern.",
    rules: [
      {
        id: "corrupted-greatbear-unstable-corruption-threshold",
        event: "on-hp-threshold",
        condition: { type: "self-hp-below-percent", percent: 50 },
        effects: [
          { type: "apply-status", target: "self", statusId: "haste" },
          { type: "apply-status", target: "self", statusId: "corrupted-fury" },
          {
            type: "set-action-pattern",
            target: "self",
            patternId: "corrupted",
          },
        ],
        oncePerEncounter: true,
      },
    ],
  },
  "restless-skeleton-brittle-bones": {
    id: "restless-skeleton-brittle-bones",
    name: "Brittle Bones",
    description: "Physical damage is reduced by 25%.",
  },
  "grave-wraith-ethereal-form": {
    id: "grave-wraith-ethereal-form",
    name: "Ethereal Form",
    description:
      "Physical damage is reduced by 50%; Fire, Water, Earth, and Air damage are increased by 25%.",
  },
  "fallen-acolyte-grave-channeling": {
    id: "fallen-acolyte-grave-channeling",
    name: "Grave Channeling",
    description: "Below 50% HP, healing done is increased by 50%.",
    modifiers: [
      {
        key: "healing-done-percent",
        value: 0.5,
        condition: { type: "self-hp-below-percent", percent: 50 },
      },
    ],
  },
  "archmage-edrin-arcane-remnant": {
    id: "archmage-edrin-arcane-remnant",
    name: "Arcane Remnant",
    description: "Resists Fire, Water, Earth, and Air damage by 15%.",
  },
  "archmage-edrin-unbound-spirit": {
    id: "archmage-edrin-unbound-spirit",
    name: "Unbound Spirit",
    description:
      "At 50% Health, gains a 50% Max Health Barrier, permanent Unbound Power, and shifts to the Unbound opening.",
    rules: [
      {
        id: "archmage-edrin-unbound-spirit-threshold",
        event: "on-hp-threshold",
        condition: { type: "self-hp-below-percent", percent: 50 },
        effects: [
          {
            type: "gain-barrier",
            target: "self",
            magnitude: { type: "source-max-health-percent", value: 0.5 },
            mode: "add",
            durationMs: null,
            tags: ["barrier"],
          },
          { type: "apply-status", target: "self", statusId: "unbound-power" },
          { type: "set-action-pattern", target: "self", patternId: "unbound-opening" },
        ],
        oncePerEncounter: true,
      },
    ],
  },
};

export const TRAIT_DEFINITIONS: Record<TraitId, TraitDefinition> = {
  ...ACT0_TRAIT_DEFINITIONS,
  ...ACT1_TRAIT_DEFINITIONS,
} as Record<TraitId, TraitDefinition>;

const isTraitId = (traitId: string): traitId is TraitId =>
  Object.prototype.hasOwnProperty.call(TRAIT_DEFINITIONS, traitId);
export const getTraitDefinition = (traitId: string) =>
  isTraitId(traitId) ? TRAIT_DEFINITIONS[traitId] : undefined;
export const getTraitDefinitions = (traitIds: readonly string[]) =>
  traitIds.flatMap((traitId) => {
    const definition = getTraitDefinition(traitId);
    return definition ? [definition] : [];
  });

export const validateTraitDefinitions = () => {
  const errors: string[] = [];
  const validationContext = createCombatValidationContext(STATUS_DEFINITIONS);
  const definitions = Object.entries(TRAIT_DEFINITIONS);
  const ids = definitions.map(([, definition]) => definition.id);
  if (new Set(ids).size !== ids.length) errors.push("duplicate trait id");
  definitions.forEach(([key, definition]) => {
    const owner = `[combat-traits] ${key}`;
    if (key !== definition.id) errors.push(`${owner}: key/id mismatch`);
    if (!definition.name.trim()) errors.push(`${owner}: name is required`);
    if (!definition.description.trim())
      errors.push(`${owner}: description is required`);
    definition.modifiers?.forEach((modifier: CombatModifier) => {
      errors.push(
        ...validateCombatModifier(
          modifier,
          `${owner}/modifier`,
          validationContext,
        ),
      );
      if (modifier.perStack)
        errors.push(`${owner}: Trait modifiers may not use perStack`);
    });
    const ruleIds = (definition.rules ?? []).map((rule) => rule.id);
    if (new Set(ruleIds).size !== ruleIds.length)
      errors.push(`${owner}: duplicate rule id`);
    definition.rules?.forEach((rule) => {
      const ruleOwner = `${owner}/${rule.id}`;
      errors.push(
        ...validateCombatTriggerRule(rule, ruleOwner, validationContext),
      );
      if (
        rule.priority !== undefined &&
        (!Number.isInteger(rule.priority) || !Number.isFinite(rule.priority))
      )
        errors.push(`${ruleOwner}: invalid priority`);
      if (
        rule.cooldownMs !== undefined &&
        (!Number.isInteger(rule.cooldownMs) ||
          !Number.isFinite(rule.cooldownMs) ||
          rule.cooldownMs < 0)
      )
        errors.push(`${ruleOwner}: invalid cooldown`);
      if (Array.isArray(rule.effects))
        rule.effects.forEach((effect) => {
          if (effect.type === "set-action-pattern" && !effect.patternId.trim())
            errors.push(`${ruleOwner}: action pattern id is required`);
          if (
            "durationMs" in effect &&
            effect.durationMs !== null &&
            effect.durationMs !== undefined &&
            (!Number.isFinite(effect.durationMs) || effect.durationMs < 0)
          )
            errors.push(`${ruleOwner}: invalid duration`);
        });
    });
  });
  if (errors.length && import.meta.env.DEV) console.error(errors.join("; "));
  return errors;
};

export type { TraitId } from "../../systems/combat/combatTypes";
