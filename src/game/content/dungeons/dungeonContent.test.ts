import { describe, expect, it } from "vitest";
import { createInitialState } from "../../../store/initialState";
import { DUNGEONS, DUNGEON_ORDER, isDungeonUnlocked } from "./dungeons";
import { ACT1_DUNGEONS } from "./act1";
import { MONSTERS, validateMonsterDefinitions } from "../monsters";
import { ACT1_MONSTERS } from "../monsters/act1";
import { STATUS_DEFINITIONS } from "../statuses";
import { TRAIT_DEFINITIONS } from "../traits";
import type { CombatSource } from "../../types";
import {
  damageEnemy,
  finishEnemy,
  spawnEnemy,
  spawnNextEnemy,
} from "../../systems/combat/combatRuntime";
import { calculateCombatDamage } from "../../systems/combat/effectResolver";
import { resolveMonsterBaseMagnitudePreview } from "../../presentation/combat";

const labels = (monsterId: keyof typeof MONSTERS, patternId = "default") =>
  MONSTERS[monsterId].actionPatterns[patternId].steps.map((step) =>
    step.type === "basic"
      ? "Basic"
      : MONSTERS[monsterId].actions[step.actionId].name,
  );
const contentTestState = () => {
  const state = createInitialState();
  state.combat.activeSpellLoadout = {
    presetId: null,
    presetName: "Content Test",
    slots: [{ spellId: "fire-bolt", autoCast: false }],
    signature: "fire-bolt:0",
  };
  return state;
};
const playerSpell: CombatSource = {
  actor: "player",
  kind: "spell",
  sourceId: "content-test",
  tags: ["spell", "magic"],
};

describe("Act 0 and Act 1 dungeon content", () => {
  it("authors the stable dungeon order, pools, bosses, unlocks, and delay", () => {
    expect(DUNGEON_ORDER).toEqual([
      "whispering-woods",
      "howling-den",
      "abandoned-catacombs",
      "fractured-approach",
      "flooded-reliquary",
      "ashen-watch",
      "rootscar-hollow",
      "crossroads-of-ruin",
      "graveglass-hollow",
      "stormvault-gallery",
      "starfallen-observatory",
      "broken-meridian",
      "hall-of-unbound-names",
      "vault-of-the-black-sigil",
      "black-gate",
    ]);
    expect(DUNGEONS["whispering-woods"].monsterPool).toEqual([
      "forest-wisp",
      "thornling",
      "dewbound-sprite",
      "cinder-moth",
      "stone-root",
      "grove-sentinel",
      "tempest-stag",
    ]);
    expect(DUNGEONS["whispering-woods"].boss).toBe("forest-heart");
    expect(DUNGEONS["howling-den"].boss).toBe("corrupted-greatbear");
    expect(DUNGEONS["abandoned-catacombs"].boss).toBe("archmage-edrin-shade");
    expect(
      Object.values(DUNGEONS).every(
        (dungeon) => dungeon.encounterDelayMs === 5000,
      ),
    ).toBe(true);
    const state = contentTestState();
    expect(
      isDungeonUnlocked(DUNGEONS["whispering-woods"], state.progress),
    ).toBe(true);
    expect(isDungeonUnlocked(DUNGEONS["howling-den"], state.progress)).toBe(
      false,
    );
    state.progress.bossKillsByBoss["forest-heart"] = 1;
    expect(isDungeonUnlocked(DUNGEONS["howling-den"], state.progress)).toBe(
      true,
    );
    expect(
      isDungeonUnlocked(DUNGEONS["abandoned-catacombs"], state.progress),
    ).toBe(false);
    state.progress.bossKillsByBoss["corrupted-greatbear"] = 1;
    expect(
      isDungeonUnlocked(DUNGEONS["abandoned-catacombs"], state.progress),
    ).toBe(true);
    expect(
      isDungeonUnlocked(DUNGEONS["fractured-approach"], state.progress),
    ).toBe(false);
    state.progress.bossKillsByBoss["archmage-edrin-shade"] = 1;
    expect(
      isDungeonUnlocked(DUNGEONS["fractured-approach"], state.progress),
    ).toBe(true);
    expect(DUNGEONS["fractured-approach"]).toMatchObject({
      threatRequired: 35,
      boss: "corrupted-elemental-gatekeeper",
      encounterDelayMs: 5000,
    });
    expect(DUNGEONS["fractured-approach"].monsterPool).toEqual([
      "warded-husk",
      "rift-wolf",
      "arcane-scavenger",
      "withered-watcher",
    ]);
  });

  it("keeps Act 1 monster ownership aligned with every authored dungeon", () => {
    expect(ACT1_DUNGEONS).toHaveLength(12);
    expect(Object.keys(ACT1_MONSTERS)).toHaveLength(60);
    for (const dungeon of ACT1_DUNGEONS) {
      expect(dungeon.monsterPool).toHaveLength(4);
      expect(dungeon.boss).toBeTruthy();
      dungeon.monsterPool.forEach((monsterId) =>
        expect(ACT1_MONSTERS[monsterId]).toBeDefined(),
      );
      expect(ACT1_MONSTERS[dungeon.boss]).toBeDefined();
      expect(dungeon.monsterPool).not.toContain(dungeon.boss);
    }
  });

  it("requires every upstream boss for Act 1 convergence dungeons", () => {
    const state = contentTestState();
    const clear = (
      ...bossIds: Array<keyof typeof state.progress.bossKillsByBoss>
    ) =>
      bossIds.forEach((bossId) => {
        state.progress.bossKillsByBoss[bossId] = 1;
      });

    clear("corrupted-elemental-gatekeeper");
    expect(
      isDungeonUnlocked(DUNGEONS["flooded-reliquary"], state.progress),
    ).toBe(true);
    expect(isDungeonUnlocked(DUNGEONS["ashen-watch"], state.progress)).toBe(
      true,
    );
    expect(isDungeonUnlocked(DUNGEONS["rootscar-hollow"], state.progress)).toBe(
      true,
    );
    expect(
      isDungeonUnlocked(DUNGEONS["crossroads-of-ruin"], state.progress),
    ).toBe(false);
    clear("drowned-keeper", "flamebound-revenant");
    expect(
      isDungeonUnlocked(DUNGEONS["crossroads-of-ruin"], state.progress),
    ).toBe(false);
    clear("rootscar-ancient");
    expect(
      isDungeonUnlocked(DUNGEONS["crossroads-of-ruin"], state.progress),
    ).toBe(true);

    expect(isDungeonUnlocked(DUNGEONS["broken-meridian"], state.progress)).toBe(
      false,
    );
    clear("graveglass-behemoth", "storm-archivist");
    expect(isDungeonUnlocked(DUNGEONS["broken-meridian"], state.progress)).toBe(
      false,
    );
    clear("fallen-astromancer");
    expect(isDungeonUnlocked(DUNGEONS["broken-meridian"], state.progress)).toBe(
      true,
    );
    expect(
      isDungeonUnlocked(DUNGEONS["hall-of-unbound-names"], state.progress),
    ).toBe(false);
    expect(
      isDungeonUnlocked(DUNGEONS["vault-of-the-black-sigil"], state.progress),
    ).toBe(false);
    clear("meridian-splitter");
    expect(
      isDungeonUnlocked(DUNGEONS["hall-of-unbound-names"], state.progress),
    ).toBe(true);
    expect(
      isDungeonUnlocked(DUNGEONS["vault-of-the-black-sigil"], state.progress),
    ).toBe(true);
    expect(isDungeonUnlocked(DUNGEONS["black-gate"], state.progress)).toBe(
      false,
    );
    clear("unspoken-prelate");
    expect(isDungeonUnlocked(DUNGEONS["black-gate"], state.progress)).toBe(
      false,
    );
    clear("sigil-warden");
    expect(isDungeonUnlocked(DUNGEONS["black-gate"], state.progress)).toBe(
      true,
    );
  });

  it("keeps Act 0 and boss health unchanged while applying the authored Tier 2 normal HP values", () => {
    const expectedNormalHealth: Record<string, number> = {
      "warded-husk": 1250,
      "rift-wolf": 975,
      "arcane-scavenger": 1050,
      "withered-watcher": 1150,
      "drowned-acolyte": 1875,
      "reliquary-slime": 1813,
      "mist-wraith": 1375,
      "rune-leech": 1563,
      "graveglass-shade": 3125,
      "static-armor": 3750,
      "arc-surge-horror": 5000,
      "portalbound-acolyte": 5625,
    };
    Object.entries(expectedNormalHealth).forEach(([monsterId, maxHealth]) =>
      expect(MONSTERS[monsterId as keyof typeof MONSTERS].maxHealth).toBe(
        maxHealth,
      ),
    );
    expect(MONSTERS["forest-wisp"].maxHealth).toBe(200);
    expect(MONSTERS["forest-heart"].maxHealth).toBe(900);
    // The locally authored Gatekeeper value is preserved; it is a boss and is
    // intentionally excluded from the Tier 2 normal-monster HP pass.
    expect(MONSTERS["corrupted-elemental-gatekeeper"].maxHealth).toBe(10500);
    expect(MONSTERS["black-gatekeeper"].maxHealth).toBe(65000);
  });

  it("keeps the two pre-final dungeon labels at T2.11", () => {
    expect(DUNGEONS["hall-of-unbound-names"].name).toBe(
      "Hall of Unbound Names",
    );
    expect(DUNGEONS["vault-of-the-black-sigil"].name).toBe(
      "Vault of the Black Sigil",
    );
  });

  it("keeps all authored monster records and exact action sequences", () => {
    expect(Object.keys(MONSTERS)).toHaveLength(76);
    expect(validateMonsterDefinitions()).toEqual([]);
    expect(labels("forest-wisp")).toEqual([
      "Basic",
      "Basic",
      "Arc Spark",
      "Basic",
      "Flicker",
      "Basic",
    ]);
    expect(labels("thornling")).toEqual([
      "Basic",
      "Thorn Lash",
      "Basic",
      "Basic",
      "Spore Burst",
      "Basic",
      "Thorn Lash",
    ]);
    expect(labels("dewbound-sprite")).toEqual([
      "Basic",
      "Mist Lance",
      "Basic",
      "Basic",
      "Healing Dew",
      "Basic",
      "Mist Lance",
    ]);
    expect(labels("cinder-moth")).toEqual([
      "Basic",
      "Ember Dust",
      "Basic",
      "Flame Flutter",
      "Cinder Dive",
      "Basic",
    ]);
    expect(labels("stone-root")).toEqual([
      "Basic",
      "Basic",
      "Root Slam",
      "Basic",
      "Stone Shell",
      "Basic",
    ]);
    expect(labels("grove-sentinel")).toEqual([
      "Basic",
      "Verdant Guard",
      "Basic",
      "Root Crush",
      "Basic",
      "Shield Burst",
      "Basic",
      "Rejuvenate",
    ]);
    expect(labels("tempest-stag")).toEqual([
      "Static Antlers",
      "Basic",
      "Gale Charge",
      "Basic",
      "Static Antlers",
      "Storm Rush",
      "Basic",
    ]);
    expect(labels("forest-heart")).toEqual([
      "Basic",
      "Basic",
      "Heart Pulse",
      "Basic",
      "Root Prison",
      "Basic",
      "Rejuvenating Sap",
      "Basic",
    ]);
    expect(labels("forest-heart", "overgrown")).toEqual([
      "Heart Pulse",
      "Root Prison",
      "Basic",
      "Overgrowth",
      "Heart Pulse",
      "Root Prison",
      "Basic",
      "Rejuvenating Sap",
    ]);
    expect(labels("cavefang-wolf")).toEqual([
      "Basic",
      "Basic",
      "Pounce",
      "Basic",
      "Predator's Howl",
      "Basic",
    ]);
    expect(labels("razorclaw-lynx")).toEqual([
      "Basic",
      "Rending Claws",
      "Basic",
      "Basic",
      "Blood Scent",
      "Basic",
      "Rending Claws",
    ]);
    expect(labels("corrupted-dire-wolf")).toEqual([
      "Basic",
      "Arcane Bite",
      "Basic",
      "Corrupted Howl",
      "Basic",
      "Corrupting Fang",
      "Basic",
      "Arcane Bite",
    ]);
    expect(labels("corrupted-greatbear")).toEqual([
      "Basic",
      "Basic",
      "Crushing Maul",
      "Basic",
      "Groundbreaker",
      "Basic",
    ]);
    expect(labels("corrupted-greatbear", "corrupted")).toEqual([
      "Corrupted Roar",
      "Crushing Maul",
      "Basic",
      "Arcane Rampage",
      "Basic",
      "Crushing Maul",
      "Arcane Rampage",
    ]);
    expect(labels("restless-skeleton")).toEqual([
      "Basic",
      "Basic",
      "Bone Cleaver",
      "Basic",
      "Bone Rattle",
      "Basic",
    ]);
    expect(labels("grave-wraith")).toEqual([
      "Basic",
      "Chilling Touch",
      "Basic",
      "Fade",
      "Basic",
      "Frost Reap",
      "Basic",
    ]);
    expect(labels("fallen-acolyte")).toEqual([
      "Grave Bolt",
      "Basic",
      "Grave Curse",
      "Basic",
      "Basic",
      "Soul Drain",
      "Death Ward",
      "Basic",
    ]);
    expect(labels("archmage-edrin-shade")).toEqual([
      "Gravefire",
      "Basic",
      "Frostbind",
      "Basic",
      "Arcane Ward",
      "Soul Drain",
      "Basic",
    ]);
    expect(labels("archmage-edrin-shade", "unbound")).toEqual([
      "Arcane Disruption",
      "Gravefire",
      "Frostbind",
      "Basic",
      "Soul Drain",
      "Final Incantation",
      "Basic",
    ]);
    const act0NormalIds = [
      "forest-wisp",
      "thornling",
      "stone-root",
      "grove-sentinel",
      "cavefang-wolf",
      "razorclaw-lynx",
      "corrupted-dire-wolf",
      "restless-skeleton",
      "grave-wraith",
      "fallen-acolyte",
    ];
    act0NormalIds.forEach((monsterId) => {
      const monster = MONSTERS[monsterId as keyof typeof MONSTERS];
      expect(Object.values(monster.actions).length).toBeGreaterThanOrEqual(2);
      expect(
        monster.actionPatterns.default.steps.some(
          (step) => step.type === "basic",
        ),
      ).toBe(true);
      Object.values(monster.actions).forEach((action) =>
        expect(action.description).not.toMatch(
          /Player'?s? Basic Attack|next Basic Attack|delay[s]? the Player/i,
        ),
      );
    });
    expect(labels("warded-husk")).toEqual([
      "Basic",
      "Fractured Ward",
      "Basic",
      "Ward Slam",
      "Basic",
    ]);
    expect(labels("rift-wolf")).toEqual([
      "Basic",
      "Rift Lunge",
      "Basic",
      "Arc Flash",
      "Basic",
    ]);
    expect(labels("arcane-scavenger")).toEqual([
      "Salvaged Bolt",
      "Basic",
      "Basic",
      "Unstable Charge",
      "Basic",
    ]);
    expect(labels("withered-watcher")).toEqual([
      "Basic",
      "Elemental Pulse",
      "Broken Aegis",
      "Basic",
      "Watcher's Lance",
    ]);
    expect(labels("corrupted-elemental-gatekeeper")).toEqual([
      "Flame Surge",
      "Basic",
      "Tidal Break",
      "Fractured Aegis",
      "Basic",
      "Stone Crush",
      "Gale Lance",
      "Basic",
      "Elemental Rupture",
    ]);
    expect(
      MONSTERS["corrupted-dire-wolf"].actions["arcane-bite"].effects.map(
        (effect) =>
          effect.type === "deal-damage" ? effect.components : effect.type,
      ),
    ).toEqual([
      [
        {
          damageType: "physical",
          magnitude: { type: "source-basic-damage-percent", value: 0.65 },
        },
        {
          damageType: "arcane",
          magnitude: { type: "source-basic-damage-percent", value: 0.65 },
        },
      ],
    ]);
    expect(
      Object.values(MONSTERS).every((monster) =>
        monster.loot.some((drop) => drop.itemId === "life-essence"),
      ),
    ).toBe(true);
  });

  it("uses source scaling for all current Monster numerical Action output", () => {
    Object.values(MONSTERS).forEach((monster) =>
      Object.values(monster.actions).forEach((action) =>
        action.effects.forEach((effect) => {
          if (effect.type === "deal-damage" && !effect.tags?.includes("dot"))
            effect.components.forEach((component) =>
              expect(["source-basic-damage-percent", "opponent-status-stack-scaled", "source-current-barrier-percent"]).toContain(component.magnitude.type),
            );
          if (effect.type === "heal")
            expect(["source-max-health-percent", "opponent-status-stack-scaled"]).toContain(effect.magnitude.type);
          if (effect.type === "gain-barrier")
            expect(effect.magnitude.type).toBe("source-max-health-percent");
          if (effect.type === "apply-status" && effect.periodicEffects)
            effect.periodicEffects.forEach((periodicEffect) => {
              if (periodicEffect.type === "deal-damage")
                periodicEffect.components.forEach((component) =>
                  expect(component.magnitude.type).toBe(
                    "source-basic-damage-percent",
                  ),
                );
            });
        }),
      ),
    );
    const ancientGrowth =
      TRAIT_DEFINITIONS["grove-sentinel-ancient-growth"].rules?.[0].effects[0];
    expect(ancientGrowth).toMatchObject({
      type: "gain-barrier",
      magnitude: { type: "source-max-health-percent", value: 2 / 9 },
    });
  });

  it("keeps converted current raw outputs close to their previous authored values", () => {
    const expected: Array<[keyof typeof MONSTERS, string, number, number]> = [
      ["forest-wisp", "arc-spark", 0, 22],
      ["thornling", "thorn-lash", 0, 14.4],
      ["stone-root", "root-slam", 0, 18],
      ["grove-sentinel", "root-crush", 0, 18.9],
      ["grove-sentinel", "verdant-guard", 0, 53.333333333333336],
      ["grove-sentinel", "rejuvenate", 0, 25.6],
      ["forest-heart", "heart-pulse", 0, 36],
      ["forest-heart", "root-prison", 0, 24],
      ["forest-heart", "rejuvenating-sap", 0, 90],
      ["cavefang-wolf", "pounce", 0, 30],
      ["razorclaw-lynx", "rending-claws", 0, 26.25],
      ["corrupted-dire-wolf", "arcane-bite", 0, 16.9],
      ["corrupted-greatbear", "crushing-maul", 0, 77.5],
      ["corrupted-greatbear", "groundbreaker", 0, 60],
      ["corrupted-greatbear", "arcane-rampage", 0, 100],
      ["restless-skeleton", "bone-cleaver", 0, 83.25],
      ["grave-wraith", "chilling-touch", 0, 72.8],
      ["fallen-acolyte", "grave-bolt", 0, 72.5],
      ["fallen-acolyte", "soul-drain", 0, 55],
      ["fallen-acolyte", "soul-drain", 1, 38.5],
      ["fallen-acolyte", "death-ward", 0, 99],
      ["archmage-edrin-shade", "gravefire", 0, 66],
      ["archmage-edrin-shade", "frostbind", 0, 63],
      ["archmage-edrin-shade", "arcane-ward", 0, 480],
      ["archmage-edrin-shade", "soul-drain", 0, 72],
      ["archmage-edrin-shade", "soul-drain", 1, 300],
      ["archmage-edrin-shade", "final-incantation", 0, 120],
      ["warded-husk", "ward-slam", 0, 89.9],
      ["rift-wolf", "rift-lunge", 0, 91.35],
      ["rift-wolf", "arc-flash", 0, 72.45],
      ["arcane-scavenger", "salvaged-bolt", 0, 85.4],
      ["arcane-scavenger", "unstable-charge", 0, 109.8],
      ["withered-watcher", "elemental-pulse", 0, 78],
      ["withered-watcher", "watchers-lance", 0, 99],
      ["corrupted-elemental-gatekeeper", "flame-surge", 0, 106.25],
      ["corrupted-elemental-gatekeeper", "tidal-break", 0, 102],
      ["corrupted-elemental-gatekeeper", "stone-crush", 0, 123.25],
      ["corrupted-elemental-gatekeeper", "gale-lance", 0, 97.75],
      ["corrupted-elemental-gatekeeper", "elemental-rupture", 0, 170],
    ];
    expected.forEach(([monsterId, actionId, effectIndex, amount]) => {
      const effect = MONSTERS[monsterId].actions[actionId].effects[effectIndex];
      const magnitude =
        "magnitude" in effect
          ? effect.magnitude
          : effect.type === "deal-damage"
            ? effect.components[0]?.magnitude
            : undefined;
      if (!magnitude)
        throw new Error(`Expected a magnitude for ${monsterId}/${actionId}`);
      expect(
        resolveMonsterBaseMagnitudePreview(MONSTERS[monsterId], magnitude),
      ).toBeCloseTo(amount, 4);
    });
  });

  it("authors Bleeding and Spectral Fade with their required lifecycle rules", () => {
    expect(STATUS_DEFINITIONS.bleeding).toMatchObject({
      classification: "debuff",
      tags: ["debuff", "dot", "physical"],
      defaultDurationMs: 8000,
      stacking: { mode: "refresh" },
      cleanseable: true,
      dispellable: false,
      periodic: { intervalMs: 2000 },
    });
    expect(STATUS_DEFINITIONS.bleeding.periodic?.effects[0]).toMatchObject({
      type: "deal-damage",
      components: [
        { damageType: "physical", magnitude: { type: "flat", value: 4 } },
      ],
    });
    expect(STATUS_DEFINITIONS["spectral-fade"]).toMatchObject({
      classification: "buff",
      defaultDurationMs: 5000,
      stacking: { mode: "strongest" },
      cleanseable: false,
      dispellable: true,
    });
    expect(STATUS_DEFINITIONS["spectral-fade"].modifiers).toContainEqual({
      key: "damage-taken-percent",
      value: -0.25,
    });
    expect(
      TRAIT_DEFINITIONS["corrupted-greatbear-unstable-corruption"].rules?.[0]
        .effects,
    ).toHaveLength(2);
    expect(
      TRAIT_DEFINITIONS["archmage-edrin-unbound-spirit"].rules?.[0].effects,
    ).toHaveLength(2);
  });

  it("uses canonical resistances and crosses each boss phase once", () => {
    const state = contentTestState();
    state.combat.active = true;
    state.combat.dungeonId = "howling-den";
    spawnEnemy(state, "corrupted-greatbear");
    state.combat.enemyHp = 1210;
    damageEnemy(state, 100, "spell");
    expect(state.combat.enemyActionPatternId).toBe("corrupted");
    expect(
      state.combat.enemyStatuses.some((status) => status.statusId === "haste"),
    ).toBe(true);
    const firstPattern = state.combat.enemyActionPatternId;
    damageEnemy(state, 1, "spell");
    expect(state.combat.enemyActionPatternId).toBe(firstPattern);

    const edrin = contentTestState();
    edrin.combat.active = true;
    edrin.combat.dungeonId = "abandoned-catacombs";
    spawnEnemy(edrin, "archmage-edrin-shade");
    damageEnemy(edrin, 3000, "spell");
    expect(edrin.combat.enemyActionPatternId).toBe("unbound");
    expect(
      edrin.combat.enemyStatuses.some((status) => status.statusId === "haste"),
    ).toBe(true);

    const wraith = contentTestState();
    wraith.combat.active = true;
    wraith.combat.dungeonId = "abandoned-catacombs";
    spawnEnemy(wraith, "grave-wraith");
    expect(
      calculateCombatDamage(wraith, 100, "physical", playerSpell, "enemy")
        .resolvedBeforeBarrier,
    ).toBe(50);
    expect(
      calculateCombatDamage(wraith, 100, "fire", playerSpell, "enemy")
        .resolvedBeforeBarrier,
    ).toBe(125);
  });

  it("queues the selected dungeon boss through the generic Auto Hunt path", () => {
    const state = contentTestState();
    state.combat.active = true;
    state.combat.dungeonId = "howling-den";
    state.combat.threatCleared = 24;
    state.progress.autoHuntBossUnlocked = true;
    state.progress.autoHuntBossByDungeon["howling-den"] = true;
    spawnEnemy(state, "cavefang-wolf");
    finishEnemy(state);
    expect(state.combat.pendingBossId).toBe("corrupted-greatbear");
    spawnNextEnemy(state);
    expect(state.combat.enemyId).toBe("corrupted-greatbear");
    expect(state.combat.inBossFight).toBe(true);
  });
});
