import type { MonsterId } from "../../../types";
import {
  action,
  applyStatus,
  basic,
  delayCurrentAction,
  scaledDirectDamage,
  scaledDot,
  scaledMultiDamage,
  withDungeonLoot,
  type MonsterDefinition,
} from "../monsterTypes";

export const HOWLING_DEN_MONSTERS = {
  "cavefang-wolf": {
    id: "cavefang-wolf",
    bestiaryCategory: "monster",
    name: "Cavefang Wolf",
    subtitle: "A patient predator that waits for weakness",
    maxHealth: 350,
    basicAttackDamage: 20,
    basicAttackTimeMs: 2200,
    defense: 16,
    color: "#b8a0a0",
    ui: { portraitIcon: "wolf" },
    traitIds: ["cavefang-wolf-predator-instinct"],
    actions: {
      pounce: {
        id: "pounce",
        name: "Pounce",
        actionTimeMs: 1400,
        description:
          "The Wolf lunges through the Wizard's concentration and disrupts the current Spell cast.",
        effects: [scaledDirectDamage("physical", 1.5), delayCurrentAction(400)],
        tags: ["special", "physical", "melee", "control"],
      },
      "predator-howl": {
        id: "predator-howl",
        name: "Predator's Howl",
        actionTimeMs: 1600,
        description: "A hunting howl accelerates the Wolf's assault.",
        effects: [applyStatus("haste", "self", 6000)],
        tags: ["special", "buff"],
      },
    },
    actionPatterns: {
      default: {
        id: "default",
        steps: [
          basic("basic-1"),
          basic("basic-2"),
          action("pounce-step", "pounce"),
          basic("basic-3"),
          action("predator-howl-step", "predator-howl"),
          basic("basic-4"),
        ],
      },
    },
    defaultActionPatternId: "default",
    loot: withDungeonLoot("howling-den", "normal", { min: 3, max: 5 }),
  },
  "razorclaw-lynx": {
    id: "razorclaw-lynx",
    bestiaryCategory: "monster",
    name: "Razorclaw Lynx",
    subtitle: "A blur of claws and hungry momentum",
    maxHealth: 360,
    basicAttackDamage: 21,
    basicAttackTimeMs: 1900,
    defense: 16,
    color: "#c18b73",
    ui: { portraitIcon: "claw" },
    traitIds: ["razorclaw-lynx-relentless-hunter"],
    actions: {
      "rending-claws": {
        id: "rending-claws",
        name: "Rending Claws",
        actionTimeMs: 1300,
        description:
          "Raking claws cut the target and leave a lingering Bleeding wound.",
        effects: [
          scaledDirectDamage("physical", 1.25),
          scaledDot("bleeding", "physical", 1.45, 8000),
        ],
        tags: ["special", "physical", "melee", "debuff"],
      },
      "blood-scent": {
        id: "blood-scent",
        name: "Blood Scent",
        actionTimeMs: 1200,
        description:
          "The Lynx catches the scent of blood and quickens its assault.",
        effects: [applyStatus("haste", "self", 5000)],
        tags: ["special", "buff"],
      },
    },
    actionPatterns: {
      default: {
        id: "default",
        steps: [
          basic("basic-1"),
          action("rending-claws-step-1", "rending-claws"),
          basic("basic-2"),
          basic("basic-3"),
          action("blood-scent-step", "blood-scent"),
          basic("basic-4"),
          action("rending-claws-step-2", "rending-claws"),
        ],
      },
    },
    defaultActionPatternId: "default",
    loot: withDungeonLoot("howling-den", "normal", { min: 3, max: 5 }),
  },
  "corrupted-dire-wolf": {
    id: "corrupted-dire-wolf",
    bestiaryCategory: "monster",
    name: "Corrupted Dire Wolf",
    subtitle: "A beast split between fang and sorcery",
    maxHealth: 420,
    basicAttackDamage: 26,
    basicAttackTimeMs: 2300,
    defense: 13,
    color: "#7e6c9f",
    ui: { portraitIcon: "wolf" },
    traitIds: ["corrupted-dire-wolf-arcane-corruption"],
    resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 },
    actions: {
      "arcane-bite": {
        id: "arcane-bite",
        name: "Arcane Bite",
        actionTimeMs: 1600,
        description: "A corrupted bite tears through both body and warding.",
        effects: [
          {
            type: "deal-damage",
            target: "opponent",
            components: [
              {
                damageType: "physical",
                magnitude: { type: "source-basic-damage-percent", value: 0.65 },
              },
              {
                damageType: "arcane",
                magnitude: { type: "source-basic-damage-percent", value: 0.65 },
              },
            ],
            tags: ["direct"],
          },
        ],
        tags: ["special", "physical", "arcane", "melee", "direct"],
      },
      "corrupted-howl": {
        id: "corrupted-howl",
        name: "Corrupted Howl",
        actionTimeMs: 1800,
        description: "The howl fills the Corrupted Dire Wolf with Haste.",
        effects: [applyStatus("haste", "self", 6000)],
        tags: ["special", "buff"],
      },
      "corrupting-fang": {
        id: "corrupting-fang",
        name: "Corrupting Fang",
        actionTimeMs: 1900,
        description:
          "A corrupted bite leaves unstable Arcane residue in the wound.",
        effects: [
          scaledMultiDamage(
            [
              { damageType: "physical", coefficient: 0.9 },
              { damageType: "arcane", coefficient: 0.6 },
            ],
            ["direct"],
          ),
          applyStatus("corruption", "opponent", undefined, 1),
        ],
        tags: ["special", "physical", "arcane", "melee", "debuff", "direct"],
      },
    },
    actionPatterns: {
      default: {
        id: "default",
        steps: [
          basic("basic-1"),
          action("arcane-bite-step-1", "arcane-bite"),
          basic("basic-2"),
          action("corrupted-howl-step", "corrupted-howl"),
          basic("basic-3"),
          action("corrupting-fang-step", "corrupting-fang"),
          basic("basic-4"),
          action("arcane-bite-step-2", "arcane-bite"),
        ],
      },
    },
    defaultActionPatternId: "default",
    loot: withDungeonLoot("howling-den", "normal", { min: 3, max: 5 }),
  },
  "corrupted-greatbear": {
    id: "corrupted-greatbear",
    bestiaryCategory: "boss",
    name: "Corrupted Greatbear",
    subtitle: "A mountain of fur warped by hungry magic",
    maxHealth: 2400,
    basicAttackDamage: 50,
    basicAttackTimeMs: 2800,
    defense: 30,
    color: "#554240",
    ui: { portraitIcon: "bear" },
    traitIds: [
      "corrupted-greatbear-thick-hide",
      "corrupted-greatbear-unstable-corruption",
    ],
    actions: {
      "crushing-maul": {
        id: "crushing-maul",
        name: "Crushing Maul",
        actionTimeMs: 1800,
        description: "A brutal maul strike crashes into the target.",
        effects: [scaledDirectDamage("physical", 1.55)],
        tags: ["special", "physical", "melee", "direct"],
      },
      groundbreaker: {
        id: "groundbreaker",
        name: "Groundbreaker",
        actionTimeMs: 2500,
        description:
          "The Greatbear shatters the ground, disrupting the Wizard's current Spell cast.",
        effects: [scaledDirectDamage("physical", 1.2), delayCurrentAction(700)],
        tags: ["special", "physical", "control"],
      },
      "corrupted-roar": {
        id: "corrupted-roar",
        name: "Corrupted Roar",
        actionTimeMs: 2200,
        description: "Makes the target Vulnerable.",
        effects: [applyStatus("vulnerable", "opponent", 6000)],
        tags: ["special", "debuff"],
      },
      "arcane-rampage": {
        id: "arcane-rampage",
        name: "Arcane Rampage",
        actionTimeMs: 3500,
        description: "A heavy Arcane strike empowered by unstable corruption.",
        effects: [
          scaledDirectDamage("arcane", 2),
          applyStatus("corruption", "opponent", undefined, 1),
        ],
        tags: ["special", "magic", "arcane", "debuff", "direct"],
      },
    },
    actionPatterns: {
      default: {
        id: "default",
        steps: [
          basic("basic-1"),
          basic("basic-2"),
          action("crushing-maul-step", "crushing-maul"),
          basic("basic-3"),
          action("groundbreaker-step", "groundbreaker"),
          basic("basic-4"),
        ],
      },
      corrupted: {
        id: "corrupted",
        steps: [
          action("corrupted-roar-step", "corrupted-roar"),
          action("crushing-maul-step-1", "crushing-maul"),
          basic("basic-1"),
          action("arcane-rampage-step-1", "arcane-rampage"),
          basic("basic-2"),
          action("crushing-maul-step-2", "crushing-maul"),
          action("arcane-rampage-step-2", "arcane-rampage"),
        ],
      },
    },
    defaultActionPatternId: "default",
    loot: withDungeonLoot("howling-den", "boss", { min: 12, max: 30 }),
  },
} satisfies Partial<Record<MonsterId, MonsterDefinition>>;
