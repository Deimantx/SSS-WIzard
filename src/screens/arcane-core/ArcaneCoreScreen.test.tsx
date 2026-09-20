import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TooltipProvider } from "../../components/ui/tooltip/Tooltip";
import { ARCANE_CORE_BRANCHES } from "../../game/content/arcaneCore/arcaneCoreBranches";
import { getArcaneCoreResonanceSummary } from "../../game/presentation/arcaneCore/arcaneCorePresentation";
import { useArcaneCorePresetStore } from "../../store/arcaneCorePresetStore";
import { useGameStore } from "../../store/gameStore";
import { ArcaneCoreScreen } from "./ArcaneCoreScreen";

describe("Arcane Core screen", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useGameStore.getState().resetSave();
    useArcaneCorePresetStore.getState().reset();
  });

  it("mounts the V6 wallet and four independent Cores", () => {
    render(
      <TooltipProvider>
        <ArcaneCoreScreen />
      </TooltipProvider>,
    );
    expect(screen.getByRole("heading", { name: "Arcane Core" })).toBeTruthy();
    expect(screen.getByText("0 / 102992 Arcane Points invested")).toBeTruthy();
    for (const name of [
      "Power Core",
      "Vitality Core",
      "Focus Core",
      "Control Core",
    ])
      expect(screen.getByText(name)).toBeTruthy();
    expect(screen.queryByText("Active resonance")).toBeNull();
    expect(screen.queryByText("ALWAYS-ON TOTALS")).toBeNull();
    expect(screen.queryByText("CONDITIONAL RESONANCE")).toBeNull();
    expect(screen.queryByText("MECHANICS ONLINE")).toBeNull();
  });

  it("keeps purchased resonance out of the main overview", () => {
    const findNode = (name: string) =>
      ARCANE_CORE_BRANCHES.flatMap((branch) => branch.nodes).find(
        (node) => node.name === name,
      )!;
    for (const name of ["Arcane Scaling", "Spell Impact", "Casting Rhythm"])
      useGameStore.getState().setArcaneCoreNodeRank(findNode(name).id, 1);
    render(
      <TooltipProvider>
        <ArcaneCoreScreen />
      </TooltipProvider>,
    );
    expect(screen.queryByText("Active resonance")).toBeNull();
    expect(screen.queryByText("Spell Power")).toBeNull();
    expect(screen.queryByText("Spell Damage")).toBeNull();
    expect(screen.queryByText("Action Speed")).toBeNull();
  });

  it("keeps conditional enemy modifiers out of always-on totals", () => {
    const suppression = ARCANE_CORE_BRANCHES.flatMap(
      (branch) => branch.nodes,
    ).find((node) => node.name === "Suppression")!;
    useGameStore.getState().setArcaneCoreNodeRank(suppression.id, 1);
    const state = useGameStore.getState();
    const summary = getArcaneCoreResonanceSummary(state.arcaneCore);
    expect(
      summary.alwaysOn.some((entry) => entry.label === "Enemy Damage Dealt"),
    ).toBe(false);
    expect(summary.conditional).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Enemy Damage Dealt",
          formattedValue: "-0.50%",
          conditionText: "While the enemy has at least 1 negative Statuses",
        }),
      ]),
    );
    render(
      <TooltipProvider>
        <ArcaneCoreScreen />
      </TooltipProvider>,
    );
    expect(screen.queryByText("CONDITIONAL RESONANCE")).toBeNull();
    expect(screen.queryByText("Enemy Damage Dealt")).toBeNull();
  });

  it("keeps a single node click selection-only", async () => {
    const user = userEvent.setup();
    useGameStore.getState().setArcanePoints(10);
    render(
      <TooltipProvider>
        <ArcaneCoreScreen />
      </TooltipProvider>,
    );
    await user.click(screen.getByRole("button", { name: /Power Core/i }));
    const dialog = screen.getByRole("dialog", { name: "Power Core" });
    const node = dialog.querySelector(
      '[aria-label^="Arcane Scaling"]',
    ) as HTMLElement;
    await user.click(node);

    expect(
      useGameStore.getState().arcaneCore.nodes["power-r1-arcane-force"],
    ).toBeUndefined();
    expect(
      within(dialog).getByRole("heading", { name: "Arcane Scaling" }),
    ).toBeTruthy();
    expect(
      dialog.querySelector(".arcane-core-modal-available-points strong")
        ?.textContent,
    ).toBe("10");
  });

  it("double-clicks the exact target for exactly one rank and updates the global wallet", async () => {
    const user = userEvent.setup();
    useGameStore.getState().setArcanePoints(10);
    const power = ARCANE_CORE_BRANCHES.find((branch) => branch.id === "power")!;
    const arcaneScaling = power.nodes.find(
      (node) => node.name === "Arcane Scaling",
    )!;
    const spellImpact = power.nodes.find(
      (node) => node.name === "Spell Impact",
    )!;
    render(
      <TooltipProvider>
        <ArcaneCoreScreen />
      </TooltipProvider>,
    );
    await user.click(screen.getByRole("button", { name: /Power Core/i }));
    const dialog = screen.getByRole("dialog", { name: "Power Core" });
    await user.click(
      dialog.querySelector(
        `[aria-label^="${arcaneScaling.name}"]`,
      ) as HTMLElement,
    );
    await user.dblClick(
      dialog.querySelector(
        `[aria-label^="${spellImpact.name}"]`,
      ) as HTMLElement,
    );

    const state = useGameStore.getState().arcaneCore;
    expect(state.nodes[arcaneScaling.id]).toBeUndefined();
    expect(state.nodes[spellImpact.id]).toEqual({ rank: 1 });
    expect(
      within(dialog).getByRole("heading", { name: spellImpact.name }),
    ).toBeTruthy();
    expect(
      dialog.querySelector(".arcane-core-modal-available-points strong")
        ?.textContent,
    ).toBe("5");
  });

  it("selects but rejects a double-click on a locked Ring node", async () => {
    const user = userEvent.setup();
    useGameStore.getState().setArcanePoints(100);
    const lockedNode = ARCANE_CORE_BRANCHES.find(
      (branch) => branch.id === "power",
    )!.nodes.find((node) => node.name === "Critical Insight")!;
    render(
      <TooltipProvider>
        <ArcaneCoreScreen />
      </TooltipProvider>,
    );
    await user.click(screen.getByRole("button", { name: /Power Core/i }));
    const dialog = screen.getByRole("dialog", { name: "Power Core" });
    const node = dialog.querySelector(
      '[aria-label^="Critical Insight"]',
    ) as HTMLElement;
    await user.dblClick(node);

    expect(
      useGameStore.getState().arcaneCore.nodes[lockedNode.id],
    ).toBeUndefined();
    expect(
      within(dialog).getByText(/RING LOCKED .*0 \/ 20 PREVIOUS-RING RANKS/),
    ).toBeTruthy();
    expect(
      dialog.querySelector(".arcane-core-modal-available-points strong")
        ?.textContent,
    ).toBe("100");
  });

  it("opens a branch-scoped summary without unmounting the Core modal", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <ArcaneCoreScreen />
      </TooltipProvider>,
    );
    await user.click(screen.getByRole("button", { name: /Power Core/i }));
    const coreDialog = screen.getByRole("dialog", { name: "Power Core" });
    await user.click(
      within(coreDialog).getByRole("button", { name: "CORE SUMMARY" }),
    );
    const summary = screen.getByRole("dialog", {
      name: "Power Core Summary",
    });
    expect(within(summary).getByText("INVESTED")).toBeTruthy();
    expect(within(summary).getByText("NO ACTIVE BONUSES YET")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Power Core" })).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Power Core Summary" }),
    ).toBeNull();
    expect(screen.getByRole("dialog", { name: "Power Core" })).toBeTruthy();
  });

  it("keeps the summary branch-specific and renders every purchased mechanic", async () => {
    const user = userEvent.setup();
    const powerNode = ARCANE_CORE_BRANCHES.find(
      (branch) => branch.id === "power",
    )!.nodes.find((node) => node.name === "Arcane Scaling")!;
    const vitalityNode = ARCANE_CORE_BRANCHES.find(
      (branch) => branch.id === "vitality",
    )!.nodes.find((node) => node.name === "Vitality")!;
    useGameStore.getState().setArcaneCoreNodeRank(powerNode.id, 1);
    useGameStore.getState().setArcaneCoreNodeRank(vitalityNode.id, 1);
    render(
      <TooltipProvider>
        <ArcaneCoreScreen />
      </TooltipProvider>,
    );
    await user.click(screen.getByRole("button", { name: /Power Core/i }));
    const coreDialog = screen.getByRole("dialog", { name: "Power Core" });
    await user.click(
      within(coreDialog).getByRole("button", { name: "CORE SUMMARY" }),
    );
    const summary = screen.getByRole("dialog", {
      name: "Power Core Summary",
    });
    expect(within(summary).getByText("Spell Power")).toBeTruthy();
    expect(within(summary).queryByText("Maximum Health")).toBeNull();

    useGameStore.getState().resetSave();
    useGameStore.getState().maxArcanePointsAndPurchaseAll();
    await user.click(
      within(summary).getByRole("button", { name: "Close Core Summary" }),
    );
    await user.click(
      within(coreDialog).getByRole("button", { name: "CORE SUMMARY" }),
    );
    const fullSummary = screen.getByRole("dialog", {
      name: "Power Core Summary",
    });
    expect(
      fullSummary.querySelectorAll(".arcane-core-summary-mechanic").length,
    ).toBeGreaterThan(8);
    expect(
      within(fullSummary).queryByText(/more mechanics online/i),
    ).toBeNull();
  });

  it("opens a Core modal with eight circular board layers and purchases a rank", async () => {
    const user = userEvent.setup();
    useGameStore.getState().setArcanePoints(10);
    render(
      <TooltipProvider>
        <ArcaneCoreScreen />
      </TooltipProvider>,
    );
    await user.click(screen.getByRole("button", { name: /Power Core/i }));
    const dialog = screen.getByRole("dialog", { name: "Power Core" });
    expect(dialog.querySelector(".arcane-core-node-layer")).toBeTruthy();
    expect(
      dialog.querySelector(".arcane-core-ring-node.node-major"),
    ).toBeTruthy();
    expect(dialog.querySelectorAll(".arcane-core-ring-node")).toHaveLength(72);
    await user.click(
      dialog.querySelector('[aria-label^="Arcane Scaling"]') as HTMLElement,
    );
    await user.click(
      within(dialog).getByRole("button", { name: /PURCHASE RANK/ }),
    );
    expect(
      useGameStore.getState().arcaneCore.nodes["power-r1-arcane-force"],
    ).toEqual({ rank: 1 });
  });

  it("keeps locked nodes selectable and reports the exact rank gate", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <ArcaneCoreScreen />
      </TooltipProvider>,
    );
    await user.click(screen.getByRole("button", { name: /Power Core/i }));
    const dialog = screen.getByRole("dialog", { name: "Power Core" });
    expect(
      dialog.querySelector(".arcane-core-orbit.is-next-locked[data-ring]"),
    ).toBeTruthy();
    await user.click(
      dialog.querySelector('[aria-label^="Critical Insight"]') as HTMLElement,
    );
    expect(
      within(dialog).getByText(/RING LOCKED .*0 \/ 20 PREVIOUS-RING RANKS/),
    ).toBeTruthy();
    expect(
      (
        within(dialog).getByRole("button", {
          name: /PURCHASE RANK/,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("resets pan and zoom with Fit Progression", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <ArcaneCoreScreen />
      </TooltipProvider>,
    );
    await user.click(screen.getByRole("button", { name: /Power Core/i }));
    const dialog = screen.getByRole("dialog", { name: "Power Core" });
    const viewport = dialog.querySelector(
      ".arcane-core-ring-viewport",
    ) as HTMLElement;
    const canvas = dialog.querySelector(".arcane-core-world") as HTMLElement;
    fireEvent.pointerDown(viewport, {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(viewport, {
      clientX: 180,
      clientY: 140,
      pointerId: 1,
    });
    fireEvent.pointerUp(viewport, { clientX: 180, clientY: 140, pointerId: 1 });
    await waitFor(() =>
      expect(canvas.style.transform).toContain("translate3d("),
    );
    await user.click(
      within(dialog).getByRole("button", { name: /Fit Progression/ }),
    );
    await waitFor(() =>
      expect(canvas.style.transform).toContain("translate3d(0px, 0px"),
    );
    expect(canvas.style.transform).toContain("scale(");
  });
});
