import { describe, expect, it } from "vitest";
import { createInitialState } from "../../../store/initialState";
import { MONSTERS } from "../../content/monsters";
import {
  clearCurrentEnemyAction,
  forceResolveEnemyAction,
  getEnemyBasicAttackRate,
  getEnemySkillActionRate,
} from "./actionRuntime";
import { executeCombatEffects, damageEnemy } from "./effectResolver";
import { spawnEnemy } from "./combatRuntime";
import { getActiveBarrier } from "./barrierRuntime";
import { resolveMagnitude } from "./magnitude";
import type { CombatEvent, CombatEventSink, CombatSource } from "./combatTypes";
import { createCombatValidationContext, validateCombatEffect } from "./combatEffectValidation";
import { STATUS_DEFINITIONS } from "../../content/statuses";

const stateWithEnemy = (enemyId: Parameters<typeof spawnEnemy>[1]) => {
  const state = createInitialState();
  state.combat.active = true;
  state.combat.dungeonId =
    enemyId === "corrupted-greatbear" ? "howling-den" : "whispering-woods";
  state.combat.activeSpellLoadout = {
    presetId: null,
    presetName: "Enemy Foundation Test",
    slots: [{ spellId: "fire-bolt", autoCast: false }],
    signature: "fire-bolt:0",
  };
  expect(spawnEnemy(state, enemyId)).toBe(true);
  return state;
};

describe("Act 0 enemy combat foundation", () => {
  it("delays only a currently casting player Spell", () => {
    const casting = stateWithEnemy("stone-root");
    clearCurrentEnemyAction(casting);
    casting.combat.pendingPlayerSpellCast = {
      spellId: "fire-bolt",
      targetInstanceKey: casting.combat.enemyInstanceKey,
      remainingWorkMs: 400,
      castWorkMs: 1400,
      manaCostSnapshot: 10,
      arcaneCoreFree: false,
      castWorkMultiplier: 1,
    };
    expect(
      forceResolveEnemyAction(casting, "root-slam", executeCombatEffects),
    ).toBe(true);
    expect(casting.combat.pendingPlayerSpellCast?.remainingWorkMs).toBe(1000);

    const idle = stateWithEnemy("stone-root");
    clearCurrentEnemyAction(idle);
    expect(
      forceResolveEnemyAction(idle, "root-slam", executeCombatEffects),
    ).toBe(true);
    expect(idle.combat.pendingPlayerSpellCast).toBeNull();
  });

  it("detonates Thorn Wound without consuming the source status", () => {
    const state = stateWithEnemy("thornling");
    clearCurrentEnemyAction(state);
    expect(
      forceResolveEnemyAction(state, "thorn-lash", executeCombatEffects),
    ).toBe(true);
    const wound = state.combat.playerStatuses.find(
      (status) => status.statusId === "thorn-wound",
    );
    expect(wound).toBeDefined();
    const healthAfterLash = state.player.health;

    clearCurrentEnemyAction(state);
    expect(
      forceResolveEnemyAction(state, "spore-burst", executeCombatEffects),
    ).toBe(true);
    expect(state.player.health).toBeLessThan(
      healthAfterLash - MONSTERS.thornling.basicAttackDamage * 0.65,
    );
    expect(
      state.combat.playerStatuses.some(
        (status) => status.statusId === "thorn-wound",
      ),
    ).toBe(true);
    const withoutWound = stateWithEnemy("thornling");
    clearCurrentEnemyAction(withoutWound);
    expect(
      forceResolveEnemyAction(
        withoutWound,
        "spore-burst",
        executeCombatEffects,
      ),
    ).toBe(true);
    expect(healthAfterLash - state.player.health).toBeGreaterThan(
      100 - withoutWound.player.health,
    );
  });

  it("switches the Greatbear to its deterministic phase pattern at 50% Health", () => {
    const state = stateWithEnemy("corrupted-greatbear");
    state.combat.enemyHp = 1210;
    damageEnemy(state, 100, "spell");
    expect(state.combat.enemyActionPatternId).toBe("corrupted");
    expect(
      state.combat.enemyStatuses.some((status) => status.statusId === "haste"),
    ).toBe(true);
    expect(state.combat.enemyNextActionIndex).toBe(0);
  });

  it("applies Haste to both enemy action lanes without a second speed multiplier", () => {
    const state = stateWithEnemy("forest-wisp");
    expect(getEnemyBasicAttackRate(state)).toBeCloseTo(1);
    expect(getEnemySkillActionRate(state)).toBeCloseTo(1);

    clearCurrentEnemyAction(state);
    expect(forceResolveEnemyAction(state, "flicker", executeCombatEffects)).toBe(true);
    expect(getEnemyBasicAttackRate(state)).toBeCloseTo(1.15);
    expect(getEnemySkillActionRate(state)).toBeCloseTo(1.15);
    expect(state.combat.enemyStatuses.find((status) => status.statusId === "haste")?.remainingMs).toBe(16000);
  });

  it("uses the Grove Sentinel Barrier in Shield Burst and consumes it without a break trigger", () => {
    const withoutBarrier = stateWithEnemy("grove-sentinel");
    clearCurrentEnemyAction(withoutBarrier);
    expect(forceResolveEnemyAction(withoutBarrier, "shield-burst", executeCombatEffects)).toBe(true);
    const damageWithoutBarrier = withoutBarrier.player.maxHealth - withoutBarrier.player.health;

    const withBarrier = stateWithEnemy("grove-sentinel");
    clearCurrentEnemyAction(withBarrier);
    expect(forceResolveEnemyAction(withBarrier, "verdant-guard", executeCombatEffects)).toBe(true);
    expect(getActiveBarrier(withBarrier, "enemy")).toBeGreaterThan(0);
    clearCurrentEnemyAction(withBarrier);
    const events: CombatEvent[] = [];
    const sink: CombatEventSink = { push: (event) => events.push(event) };
    expect(forceResolveEnemyAction(withBarrier, "shield-burst", executeCombatEffects, 0, sink)).toBe(true);

    expect(withBarrier.player.maxHealth - withBarrier.player.health).toBeGreaterThan(damageWithoutBarrier);
    expect(getActiveBarrier(withBarrier, "enemy")).toBe(0);
    expect(withBarrier.combat.enemyBarrierRemainingMs).toBeNull();
    expect(events.some((event) => event.category === "barrier" && event.barrierMode === "consume")).toBe(true);
  });

  it("scales Soul Drain from the opponent's Cursed stacks and preserves its combo pattern", () => {
    const action = MONSTERS["fallen-acolyte"].actions["soul-drain"];
    const damageMagnitude = (action.effects[0] as Extract<(typeof action.effects)[number], { type: "deal-damage" }>).components[0].magnitude;
    const healMagnitude = (action.effects[1] as Extract<(typeof action.effects)[number], { type: "heal" }>).magnitude;
    const source: CombatSource = { actor: "enemy", kind: "action", sourceId: "soul-drain" };

    const uncursed = stateWithEnemy("fallen-acolyte");
    const baseDamage = resolveMagnitude(uncursed, damageMagnitude, source, "player");
    const baseHeal = resolveMagnitude(uncursed, healMagnitude, source, "enemy");

    const cursed = stateWithEnemy("fallen-acolyte");
    clearCurrentEnemyAction(cursed);
    expect(forceResolveEnemyAction(cursed, "grave-curse", executeCombatEffects)).toBe(true);
    const cursedDamage = resolveMagnitude(cursed, damageMagnitude, source, "player");
    const cursedHeal = resolveMagnitude(cursed, healMagnitude, source, "enemy");

    expect(cursedDamage).toBeCloseTo(baseDamage * 1.4);
    expect(cursedHeal).toBeCloseTo(baseHeal * 1.4);
    expect(MONSTERS["fallen-acolyte"].actions["grave-curse"].effects[0]).toMatchObject({ durationMs: 12000 });
    expect(MONSTERS["fallen-acolyte"].actionPatterns.default.steps.map((step) => step.type === "action" ? step.actionId : "basic")).toEqual([
      "grave-bolt",
      "basic",
      "grave-curse",
      "basic",
      "basic",
      "soul-drain",
      "death-ward",
      "basic",
    ]);
  });

  it("boosts Frost Reap only while the target is Chilled and keeps Chilling Touch active", () => {
    const source: CombatSource = { actor: "enemy", kind: "action", sourceId: "frost-reap" };
    const reapMagnitude = (MONSTERS["grave-wraith"].actions["frost-reap"].effects[0] as Extract<(typeof MONSTERS)["grave-wraith"]["actions"]["frost-reap"]["effects"][number], { type: "deal-damage" }>).components[0].magnitude;

    const chilled = stateWithEnemy("grave-wraith");
    chilled.player.maxHealth = 1000;
    chilled.player.health = 1000;
    clearCurrentEnemyAction(chilled);
    expect(forceResolveEnemyAction(chilled, "chilling-touch", executeCombatEffects)).toBe(true);
    expect(chilled.combat.playerStatuses.some((status) => status.statusId === "chilled")).toBe(true);
    const chilledDamage = resolveMagnitude(chilled, reapMagnitude, source, "player");
    expect(chilledDamage).toBeCloseTo(MONSTERS["grave-wraith"].basicAttackDamage * 1.25 * 1.5);

    const plain = stateWithEnemy("grave-wraith");
    const plainDamage = resolveMagnitude(plain, reapMagnitude, source, "player");
    expect(chilledDamage).toBeGreaterThan(plainDamage);
    expect(MONSTERS["grave-wraith"].actions["chilling-touch"].effects[1]).toMatchObject({ durationMs: 10000 });
  });

  it("scales Arcane Rampage from capped player Corruption, then adds one stack", () => {
    const action = MONSTERS["corrupted-greatbear"].actions["arcane-rampage"];
    const magnitude = (action.effects[0] as Extract<(typeof action.effects)[number], { type: "deal-damage" }>).components[0].magnitude;
    const source: CombatSource = { actor: "enemy", kind: "action", sourceId: "arcane-rampage" };
    const expectedBase = MONSTERS["corrupted-greatbear"].basicAttackDamage * 2;

    for (const stacks of [0, 1, 3, 5, 7]) {
      const state = stateWithEnemy("corrupted-greatbear");
      if (stacks > 0) {
        state.combat.playerStatuses.push({
          statusId: "corruption",
          holder: "player",
          instanceKey: "single:corruption",
          source,
          remainingMs: 10000,
          initialDurationMs: 10000,
          stacks,
          nextTickMs: undefined,
          appliedAt: 0,
        });
      }
      expect(resolveMagnitude(state, magnitude, source, "player")).toBeCloseTo(expectedBase * (1 + Math.min(stacks, 5) * 0.12));
    }

    const applied = stateWithEnemy("corrupted-greatbear");
    applied.player.maxHealth = 1000;
    applied.player.health = 1000;
    clearCurrentEnemyAction(applied);
    expect(forceResolveEnemyAction(applied, "arcane-rampage", executeCombatEffects)).toBe(true);
    expect(applied.combat.playerStatuses.find((status) => status.statusId === "corruption")?.stacks).toBe(1);
  });

  it("recursively validates status-scaled magnitudes and the Barrier consume effect", () => {
    const context = createCombatValidationContext(STATUS_DEFINITIONS);
    expect(validateCombatEffect({
      type: "deal-damage",
      target: "opponent",
      components: [{
        damageType: "earth",
        magnitude: {
          type: "opponent-status-stack-scaled",
          statusId: "corruption",
          base: { type: "source-current-barrier-percent", value: 0.5 },
          perStack: 0.12,
          maxStacks: 5,
        },
      }],
    }, "effect", context)).toEqual([]);
    expect(validateCombatEffect({
      type: "deal-damage",
      target: "opponent",
      components: [{ damageType: "earth", magnitude: { type: "opponent-status-stack-scaled", statusId: "not-a-status", base: { type: "flat", value: Number.NaN }, perStack: Number.POSITIVE_INFINITY, maxStacks: 0 } }],
    }, "effect", context).length).toBeGreaterThan(0);
    expect(validateCombatEffect({ type: "consume-barrier", target: "self", mode: "all" }, "effect", context)).toEqual([]);
  });
});
