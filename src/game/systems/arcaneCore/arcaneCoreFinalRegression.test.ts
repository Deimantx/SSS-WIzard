import { describe, expect, it } from "vitest";
import {
  ARCANE_CORE_BRANCHES,
  ARCANE_CORE_NODES,
} from "../../content/arcaneCore/arcaneCoreBranches";
import { ARCANE_CORE_TOTAL_TREE_COST } from "../../content/arcaneCore/arcaneCoreBalance";
import { createInitialState } from "../../../store/initialState";
import { getPlayerCombatStats } from "../combat/combatStats";
import { getArcaneCoreV6CastModifiers } from "./arcaneCoreV6Runtime";
import {
  getArcaneCoreBranchResetPreview,
  getArcaneCoreNodeRank,
  getArcaneCorePointsSpent,
  getArcaneCoreRingStandardRanksInvested,
  grantArcanePoints,
  isArcaneCoreMajorUnlocked,
  isArcaneCoreRingUnlocked,
  purchaseAllArcaneCoreNodes,
  refundArcaneCoreNode,
  setArcaneCoreNodeRank,
} from "./arcaneCoreProgression";

const power = ARCANE_CORE_BRANCHES.find((branch) => branch.id === "power")!;
const standards = (ring: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) =>
  power.nodes.filter((node) => node.ring === ring && node.nodeType !== "major");
const major = (ring: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) =>
  power.nodes.find((node) => node.ring === ring && node.nodeType === "major")!;
const setRank = (
  state: ReturnType<typeof createInitialState>,
  nodeId: string,
  rank: number,
) => {
  const result = setArcaneCoreNodeRank(state.arcaneCore, nodeId, rank);
  if (!result.ok) throw new Error(result.reason);
  return { ...state, arcaneCore: result.state };
};

describe("Arcane Core V6 final regressions", () => {
  it("uses standard-rank gates and cascades Major/dependent allocations on refund", () => {
    let state = createInitialState();
    state.arcaneCore = grantArcanePoints(
      state.arcaneCore,
      ARCANE_CORE_TOTAL_TREE_COST,
    ).state;
    for (const node of standards(1).slice(0, 4))
      state = setRank(state, node.id, 5);
    state = setRank(state, standards(2)[0]!.id, 1);
    expect(
      getArcaneCoreRingStandardRanksInvested(state.arcaneCore, "power", 1),
    ).toBe(20);
    expect(isArcaneCoreRingUnlocked(state.arcaneCore, "power", 2)).toBe(true);
    const dependentRefund = refundArcaneCoreNode(
      state.arcaneCore,
      standards(1)[0]!.id,
    );
    expect(dependentRefund.ok).toBe(true);
    if (dependentRefund.ok)
      expect(
        getArcaneCoreNodeRank(dependentRefund.state, standards(2)[0]!.id),
      ).toBe(0);

    let majorState = createInitialState();
    majorState.arcaneCore = grantArcanePoints(
      majorState.arcaneCore,
      ARCANE_CORE_TOTAL_TREE_COST,
    ).state;
    for (const node of standards(1).slice(0, 6))
      majorState = setRank(majorState, node.id, 5);
    majorState = setRank(majorState, major(1).id, 1);
    expect(isArcaneCoreMajorUnlocked(majorState.arcaneCore, major(1))).toBe(
      true,
    );
    const majorRefund = refundArcaneCoreNode(
      majorState.arcaneCore,
      standards(1)[0]!.id,
    );
    expect(majorRefund.ok).toBe(true);
    if (majorRefund.ok)
      expect(getArcaneCoreNodeRank(majorRefund.state, major(1).id)).toBe(0);
    expect(
      getArcaneCoreBranchResetPreview(majorState.arcaneCore, "power"),
    ).toMatchObject({ ok: true, majorsAffected: 1 });
  });

  it("composes the V6 cast primitives from authored node ranks", () => {
    const state = createInitialState();
    state.arcaneCore.nodes[
      power.nodes.find((node) => node.name === "Arcane Spark")!.id
    ] = { rank: 5 };
    state.arcaneCore.nodes[
      power.nodes.find((node) => node.name === "Overcharge")!.id
    ] = { rank: 5 };
    state.combat.arcaneCoreRuntime.damagingSpellCount = 3;
    const modifiers = getArcaneCoreV6CastModifiers(
      state,
      {
        origin: "auto",
        spellId: "fire-bolt",
        loadoutSlotIndex: 0,
        damaging: true,
        manaCost: 10,
        maxMana: 100,
        playerMana: 100,
        enemyHealthPercent: 100,
      },
      true,
    );
    expect(modifiers.damageMultiplier).toBeCloseTo(1.2);
  });

  it("removes player Basic Attack and Block progression while retaining normal sheet stats", () => {
    const state = createInitialState();
    const stats = getPlayerCombatStats(state);
    expect(stats).not.toHaveProperty("basicAttackDamage");
    expect(stats).not.toHaveProperty("basicAttackSpeedMultiplier");
    expect(stats).not.toHaveProperty("basicAttackIntervalMs");
    expect(stats).not.toHaveProperty("blockChance");
    expect(stats.spellPower).toBeGreaterThan(0);
    expect(stats.maxHealth).toBeGreaterThan(0);
  });

  it("keeps the authored 288-node order and full-tree accounting stable", () => {
    expect(power.nodes[0]?.id).toBe("power-r1-arcane-force");
    const state = createInitialState();
    state.arcaneCore = grantArcanePoints(
      state.arcaneCore,
      ARCANE_CORE_TOTAL_TREE_COST,
    ).state;
    const completed = purchaseAllArcaneCoreNodes(state.arcaneCore);
    expect(Object.keys(completed.nodes)).toHaveLength(288);
    expect(getArcaneCorePointsSpent(completed)).toBe(
      ARCANE_CORE_TOTAL_TREE_COST,
    );
    expect(
      ARCANE_CORE_NODES.every(
        (node) => node.maxRank === (node.nodeType === "major" ? 1 : 5),
      ),
    ).toBe(true);
  });
});
