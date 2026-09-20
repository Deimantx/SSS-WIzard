import { describe, expect, it } from "vitest";
import { createInitialState } from "../../../store/initialState";
import { MONSTERS } from "../../content/monsters";
import {
  clearCurrentEnemyAction,
  forceResolveEnemyAction,
} from "./actionRuntime";
import { executeCombatEffects, damageEnemy } from "./effectResolver";
import { spawnEnemy } from "./combatRuntime";

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
});
