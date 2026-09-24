import { describe, expect, it } from "vitest";
import {
  ARCANE_CORE_BRANCHES,
  ARCANE_CORE_NODES,
} from "../../content/arcaneCore/arcaneCoreBranches";
import {
  ARCANE_CORE_NODE_ANGLE_STEP,
  ARCANE_CORE_RING_INDICES,
  ARCANE_CORE_RING_OFFSETS,
  normalizeAngle,
} from "../../content/arcaneCore/arcaneCoreRings";
import {
  ARCANE_CORE_CANVAS_SIZE,
  formatArcaneCoreModifierValue,
  formatArcaneCoreNodeEffect,
  getArcaneCoreNodeEffectTexts,
  getArcaneCoreNodePosition,
  getArcaneCoreRingRadius,
  getArcaneCoreBranchResonanceSummary,
} from "./arcaneCorePresentation";
import { createInitialState } from "../../../store/initialState";

describe("Arcane Core V6 presentation", () => {
  it("uses exact alternating 40-degree socket sets in every Core", () => {
    expect(ARCANE_CORE_NODE_ANGLE_STEP).toBe(40);
    expect(ARCANE_CORE_RING_OFFSETS).toEqual({
      1: 0,
      2: 20,
      3: 0,
      4: 20,
      5: 0,
      6: 20,
      7: 0,
      8: 20,
    });
    for (const branch of ARCANE_CORE_BRANCHES)
      for (const ring of ARCANE_CORE_RING_INDICES) {
        const nodes = branch.nodes.filter((node) => node.ring === ring);
        const angles = nodes
          .map((node) => normalizeAngle(node.angleDeg))
          .sort((a, b) => a - b);
        const expected = [0, 40, 80, 120, 160, 200, 240, 280, 320].map(
          (angle) => normalizeAngle(angle + (ring % 2 === 0 ? 20 : 0)),
        );
        expect(angles).toEqual(expected);
        expect(nodes.find((node) => node.nodeType === "major")?.angleDeg).toBe(
          ring % 2 === 0 ? 20 : 0,
        );
        expect(
          angles.map((angle, index) =>
            normalizeAngle(angles[(index + 1) % angles.length] - angle),
          ),
        ).toEqual(Array(9).fill(40));
      }
  });

  it("interleaves each even Ring exactly halfway between its odd neighbor", () => {
    for (const branch of ARCANE_CORE_BRANCHES)
      for (const oddRing of [1, 3, 5, 7] as const) {
        const odd = branch.nodes
          .filter((node) => node.ring === oddRing)
          .map((node) => normalizeAngle(node.angleDeg))
          .sort((a, b) => a - b);
        const even = branch.nodes
          .filter((node) => node.ring === oddRing + 1)
          .map((node) => normalizeAngle(node.angleDeg))
          .sort((a, b) => a - b);
        expect(even).toEqual(
          odd.map((angle) => normalizeAngle(angle + 20)).sort((a, b) => a - b),
        );
      }
  });

  it("positions every node on its authored Ring angle and canonical radius", () => {
    for (const node of ARCANE_CORE_NODES) {
      const position = getArcaneCoreNodePosition(node);
      expect(position.left).toBeGreaterThan(0);
      expect(position.top).toBeGreaterThan(0);
      expect(
        Math.hypot(
          position.left - ARCANE_CORE_CANVAS_SIZE / 2,
          position.top - ARCANE_CORE_CANVAS_SIZE / 2,
        ),
      ).toBeCloseTo(getArcaneCoreRingRadius(node.ring), 6);
    }
  });

  it("keeps all authored nodes on the canonical Ring radii with safe spacing", () => {
    for (const branchNodes of ["power", "vitality", "focus", "control"].map(
      (branchId) =>
        ARCANE_CORE_NODES.filter((node) => node.branchId === branchId),
    )) {
      for (const ring of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
        const nodes = branchNodes.filter((node) => node.ring === ring);
        expect(new Set(nodes.map((node) => node.angleDeg)).size).toBe(
          nodes.length,
        );
        const positions = nodes.map(getArcaneCoreNodePosition);
        const distances = positions.flatMap((position, index) =>
          positions
            .slice(index + 1)
            .map((other) =>
              Math.hypot(position.left - other.left, position.top - other.top),
            ),
        );
        expect(Math.min(...distances)).toBeGreaterThan(130);
      }
    }
  });

  it("formats V7 percentage stats and authored ranked effects in player-readable units", () => {
    expect(formatArcaneCoreModifierValue("spellPowerPct", 0.005)).toBe(
      "+0.50%",
    );
    expect(formatArcaneCoreModifierValue("spellPower", 1)).toBe("+1");
    const node = ARCANE_CORE_NODES.find(
      (candidate) => candidate.name === "Arcane Scaling",
    )!;
    expect(formatArcaneCoreNodeEffect(node, 1)).toContain("+0.50%");
    expect(formatArcaneCoreNodeEffect(node, 5)).toContain("+2.50%");
  });

  it("formats exact V7 descriptions and inactive Major state", () => {
    const cycle = ARCANE_CORE_NODES.find(
      (candidate) => candidate.name === "Arcane Momentum",
    )!;
    expect(getArcaneCoreNodeEffectTexts(cycle!, 5).join(" ")).toContain(
      "Every 4th damaging Spell",
    );
    const major = ARCANE_CORE_NODES.find(
      (candidate) =>
        candidate.branchId === "control" &&
        candidate.ring === 4 &&
        candidate.nodeType === "major",
    )!;
    expect(getArcaneCoreNodeEffectTexts(major, 0)).toEqual(["Inactive"]);
    expect(getArcaneCoreNodeEffectTexts(major, 1).join(" ")).toContain(
      "500 ms",
    );
  });

  it("scopes resonance sources to the opened Core while retaining all mechanics", () => {
    const state = createInitialState();
    const powerNode = ARCANE_CORE_BRANCHES.find(
      (branch) => branch.id === "power",
    )!.nodes.find((node) => node.name === "Arcane Scaling")!;
    const vitalityNode = ARCANE_CORE_BRANCHES.find(
      (branch) => branch.id === "vitality",
    )!.nodes.find((node) => node.name === "Vitality")!;
    state.arcaneCore.nodes[powerNode.id] = { rank: 1 };
    state.arcaneCore.nodes[vitalityNode.id] = { rank: 1 };

    const powerSummary = getArcaneCoreBranchResonanceSummary(
      state.arcaneCore,
      "power",
    );
    expect(powerSummary.alwaysOn).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Spell Power",
          sourceNodeIds: [powerNode.id],
        }),
      ]),
    );
    expect(powerSummary.alwaysOn).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceNodeIds: [vitalityNode.id] }),
      ]),
    );
  });
});
