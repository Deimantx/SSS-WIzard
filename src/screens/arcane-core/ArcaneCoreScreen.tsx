import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  Crosshair,
  LockKeyhole,
  RotateCcw,
  ScrollText,
  Sparkles,
  X,
} from "lucide-react";
import {
  Button,
  Card,
  GameTooltip,
  ModalPortal,
  Status,
} from "../../components/ui";
import { ArcaneCorePresetPanel } from "../../components/arcane-core/ArcaneCorePresetPanel";
import { ScreenGrid } from "../../components/layout/ScreenGrid";
import { ARCANE_CORE_BRANCHES } from "../../game/content/arcaneCore/arcaneCoreBranches";
import {
  ARCANE_CORE_TOTAL_COST_PER_CORE,
  ARCANE_CORE_TOTAL_TREE_COST,
  ARCANE_CORE_BRANCH_CURSOR_COLORS,
} from "../../game/content/arcaneCore/arcaneCoreBalance";
import {
  ARCANE_CORE_MAJOR_GATES,
  ARCANE_CORE_RING_GATES,
  ARCANE_CORE_RING_INDICES,
  getArcaneCoreRingName,
} from "../../game/content/arcaneCore/arcaneCoreRings";
import {
  ARCANE_CORE_CANVAS_SIZE,
  getArcaneCoreNodeEffectTexts,
  getArcaneCoreNodePosition,
  getArcaneCoreRingRadius,
} from "../../game/presentation/arcaneCore/arcaneCorePresentation";
import {
  getArcaneCoreBranchResetPreview,
  getArcaneCoreHighestUnlockedRing,
  getArcaneCoreNodeRank,
  getArcaneCorePointsSpent,
  getArcaneCoreRefundPreview,
  getArcaneCoreRingStandardRanksInvested,
  getArcaneCoreWalletInfo,
  isArcaneCoreMajorUnlocked,
  isArcaneCoreNodeReachable,
} from "../../game/systems/arcaneCore";
import type {
  ArcaneCoreBranchDefinition,
  ArcaneCoreBranchId,
  ArcaneCoreNodeDefinition,
  ArcaneCoreRingIndex,
} from "../../game/types";
import { useGameStore } from "../../store/gameStore";
import { createCursorValue } from "../../ui/game-feel/gameCursor";
import { ArcaneCoreSummaryModal } from "./ArcaneCoreSummaryModal";
import {
  ARCANE_CORE_DRAG_THRESHOLD,
  ARCANE_CORE_MAX_ZOOM,
  ARCANE_CORE_MIN_ZOOM,
  clampCameraOffset,
  useArcaneCoreCamera,
} from "./useArcaneCoreCamera";

function CoreProgress({
  core,
}: {
  core: ReturnType<typeof useGameStore.getState>["arcaneCore"];
}) {
  const wallet = getArcaneCoreWalletInfo(core);
  const completion = wallet.treeCost
    ? (wallet.pointsSpent / wallet.treeCost) * 100
    : 0;
  return (
    <div className="arcane-core-wallet" aria-label="Arcane Points wallet">
      <div>
        <span>ARCANE POINTS</span>
        <strong>{wallet.pointsAvailable.toLocaleString()} AVAILABLE</strong>
        <small>Spendable across all four permanent Cores</small>
        <i>
          <em
            style={{
              width: `${wallet.totalPointsEarned ? (wallet.pointsSpent / wallet.totalPointsEarned) * 100 : 0}%`,
            }}
          />
        </i>
      </div>
      <div>
        <span>EARNED</span>
        <strong>{wallet.totalPointsEarned.toLocaleString()}</strong>
        <small>Lifetime Arcane Points</small>
      </div>
      <div>
        <span>SPENT</span>
        <strong>{wallet.pointsSpent.toLocaleString()}</strong>
        <small>{completion.toFixed(1)}% of the tree cost invested</small>
      </div>
      <div>
        <span>TREE COMPLETION</span>
        <strong>
          {wallet.pointsSpent.toLocaleString()} /{" "}
          {wallet.treeCost.toLocaleString()}
        </strong>
        <small>Arcane Points invested</small>
      </div>
    </div>
  );
}

function BranchCard({
  branch,
  onOpen,
  state,
}: {
  branch: ArcaneCoreBranchDefinition;
  onOpen: () => void;
  state: ReturnType<typeof useGameStore.getState>["arcaneCore"];
}) {
  const spent = getArcaneCorePointsSpent({
    nodes: Object.fromEntries(
      branch.nodes
        .map((node) => [node.id, state.nodes[node.id]])
        .filter(([, value]) => value),
    ),
  });
  const highest = getArcaneCoreHighestUnlockedRing(state, branch.id);
  return (
    <button
      type="button"
      className="arcane-core-branch-card"
      style={{ "--branch-accent": branch.accent } as CSSProperties}
      onClick={onOpen}
    >
      <span className="arcane-core-branch-mark">
        <Sparkles size={17} />
      </span>
      <span className="arcane-core-branch-copy">
        <span className="eyebrow">{branch.name.toUpperCase()} CORE</span>
        <strong>{branch.name} Core</strong>
        <small>{branch.description}</small>
      </span>
      <span className="arcane-core-branch-progress">
        <b>
          {spent} / {ARCANE_CORE_TOTAL_COST_PER_CORE}
        </b>
        <small>Arcane Points invested</small>
        <i>
          <em
            style={{
              width: `${(spent / ARCANE_CORE_TOTAL_COST_PER_CORE) * 100}%`,
            }}
          />
        </i>
        <small className="arcane-core-branch-active">
          Ring {highest} / 8 unlocked
        </small>
      </span>
      <span className="arcane-core-branch-open">OPEN CORE &gt;</span>
    </button>
  );
}

type PendingConfirmation = {
  label: string;
  points: number;
  ranks: number;
  majors: number;
  rings: number;
  confirm: () => void;
};
type CoreDragState = {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
};

type ArcaneCoreNodeState =
  | "LOCKED_RING"
  | "LOCKED_MAJOR_REQUIREMENT"
  | "UNAFFORDABLE"
  | "PURCHASABLE"
  | "INVESTED"
  | "MAXED";

type ArcaneCoreFeedback =
  | "purchase"
  | "max"
  | "denied"
  | "unaffordable"
  | "ring-unlock"
  | "major-unlock";

const getArcaneCoreNodeState = (
  core: ReturnType<typeof useGameStore.getState>["arcaneCore"],
  node: ArcaneCoreNodeDefinition,
  highestRing: ArcaneCoreRingIndex,
  pointsAvailable: number,
): ArcaneCoreNodeState => {
  const rank = getArcaneCoreNodeRank(core, node.id);
  if (rank >= node.maxRank) return "MAXED";
  if (node.ring > highestRing) return "LOCKED_RING";
  if (!isArcaneCoreMajorUnlocked(core, node)) return "LOCKED_MAJOR_REQUIREMENT";
  if (!isArcaneCoreNodeReachable(core, node.id)) return "LOCKED_RING";
  if (pointsAvailable < node.rankCost) return "UNAFFORDABLE";
  return rank > 0 ? "INVESTED" : "PURCHASABLE";
};

const nodeEffect = (node: ArcaneCoreNodeDefinition, rank: number) =>
  getArcaneCoreNodeEffectTexts(node, rank).join(" · ");

interface ArcaneCoreOrbitNodeProps {
  node: ArcaneCoreNodeDefinition;
  position: { left: number; top: number };
  rank: number;
  nodeState: ArcaneCoreNodeState;
  ringLocked: boolean;
  highestRing: ArcaneCoreRingIndex;
  selected: boolean;
  selectedRing: boolean;
  feedback?: ArcaneCoreFeedback;
  onSelect: (nodeId: string) => void;
  onDoublePurchase: (nodeId: string) => void;
}

const ArcaneCoreOrbitNode = memo(function ArcaneCoreOrbitNode({
  node,
  position,
  rank,
  nodeState,
  ringLocked,
  highestRing,
  selected,
  selectedRing,
  feedback,
  onSelect,
  onDoublePurchase,
}: ArcaneCoreOrbitNodeProps) {
  return (
    <GameTooltip
      content={`${node.name} · Rank ${rank}/${node.maxRank} · ${nodeEffect(node, rank)}`}
    >
      <button
        type="button"
        data-no-pan
        data-ring={node.ring}
        data-angle={node.angleDeg}
        className={`arcane-core-ring-node node-${node.nodeType} is-${nodeState.toLowerCase().replace(/_/g, "-")} ${rank > 0 ? "is-active" : ""} ${nodeState === "MAXED" || nodeState === "INVESTED" ? "is-available" : "is-locked"} ${node.nodeType === "major" ? "is-major" : ""} ${ringLocked ? "is-ring-locked" : ""} ${ringLocked && node.ring === highestRing + 1 ? "is-next-locked" : ""} ${ringLocked && node.ring > highestRing + 1 ? "is-deep-locked" : ""} ${selectedRing ? "is-selected-ring-node" : ""} ${selected ? "is-selected" : ""} ${feedback ? `is-${feedback}-pulse` : ""}`}
        style={{ left: position.left, top: position.top }}
        onClick={() => onSelect(node.id)}
        onDoubleClick={(event) => {
          if (event.button === 0) onDoublePurchase(node.id);
        }}
        aria-label={`${node.name}, rank ${rank} of ${node.maxRank}`}
      >
        <span className="arcane-core-node-dot" aria-hidden="true">
          {node.nodeType === "major" ? "✦" : "◆"}
        </span>
        <strong>{node.name}</strong>
        <small>
          {node.nodeType === "major" ? "MAJOR" : `RANK ${rank}/${node.maxRank}`}
        </small>
        {node.nodeType !== "major" && (
          <i className="arcane-core-rank-pips" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((pip) => (
              <b key={pip} className={pip <= rank ? "is-paid" : undefined} />
            ))}
          </i>
        )}
      </button>
    </GameTooltip>
  );
});

interface ArcaneCoreNodeLayerProps {
  branch: ArcaneCoreBranchDefinition;
  core: ReturnType<typeof useGameStore.getState>["arcaneCore"];
  highestRing: ArcaneCoreRingIndex;
  selectedId: string;
  feedback: { nodeId: string; kind: ArcaneCoreFeedback } | null;
  onSelect: (nodeId: string) => void;
  onDoublePurchase: (nodeId: string) => void;
}

const ArcaneCoreNodeLayer = memo(function ArcaneCoreNodeLayer({
  branch,
  core,
  highestRing,
  selectedId,
  feedback,
  onSelect,
  onDoublePurchase,
}: ArcaneCoreNodeLayerProps) {
  const positions = useMemo(
    () =>
      new Map(
        branch.nodes.map((node) => [node.id, getArcaneCoreNodePosition(node)]),
      ),
    [branch.nodes],
  );
  const selectedNode = branch.nodes.find((item) => item.id === selectedId);
  const wallet = getArcaneCoreWalletInfo(core);
  return (
    <div className="arcane-core-node-layer">
      {branch.nodes.map((node) => {
        const rank = getArcaneCoreNodeRank(core, node.id);
        const nodeState = getArcaneCoreNodeState(
          core,
          node,
          highestRing,
          wallet.pointsAvailable,
        );
        return (
          <ArcaneCoreOrbitNode
            key={node.id}
            node={node}
            position={positions.get(node.id)!}
            rank={rank}
            nodeState={nodeState}
            ringLocked={node.ring > highestRing}
            highestRing={highestRing}
            selected={selectedId === node.id}
            selectedRing={node.ring === (selectedNode?.ring ?? 0)}
            feedback={feedback?.nodeId === node.id ? feedback.kind : undefined}
            onSelect={onSelect}
            onDoublePurchase={onDoublePurchase}
          />
        );
      })}
    </div>
  );
});

const ArcaneCoreOrbitLayer = memo(function ArcaneCoreOrbitLayer({
  highestRing,
  selectedRing,
  ringPulse,
}: {
  highestRing: ArcaneCoreRingIndex;
  selectedRing?: ArcaneCoreRingIndex;
  ringPulse: ArcaneCoreRingIndex | null;
}) {
  return (
    <svg
      className="arcane-core-orbit-layer"
      viewBox={`0 0 ${ARCANE_CORE_CANVAS_SIZE} ${ARCANE_CORE_CANVAS_SIZE}`}
      aria-hidden="true"
    >
      {ARCANE_CORE_RING_INDICES.map((ring) => (
        <g key={ring}>
          <circle
            data-ring={ring}
            className={`arcane-core-orbit ${ring <= highestRing ? "is-unlocked" : ring === highestRing + 1 ? "is-next-locked" : "is-deep-locked"} ${ringPulse === ring ? "is-unlock-pulse" : ""}`}
            cx={ARCANE_CORE_CANVAS_SIZE / 2}
            cy={ARCANE_CORE_CANVAS_SIZE / 2}
            r={getArcaneCoreRingRadius(ring)}
            vectorEffect="non-scaling-stroke"
          />
          {selectedRing === ring && (
            <circle
              data-ring={ring}
              className="arcane-core-orbit is-selected"
              cx={ARCANE_CORE_CANVAS_SIZE / 2}
              cy={ARCANE_CORE_CANVAS_SIZE / 2}
              r={getArcaneCoreRingRadius(ring)}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </g>
      ))}
    </svg>
  );
});

function CoreModal({
  branch,
  onClose,
}: {
  branch: ArcaneCoreBranchDefinition;
  onClose: () => void;
}) {
  const core = useGameStore((state) => state.arcaneCore);
  const purchase = useGameStore((state) => state.purchaseArcaneCoreNode);
  const refund = useGameStore((state) => state.refundArcaneCoreNode);
  const resetBranch = useGameStore((state) => state.resetArcaneCoreBranch);
  const [selectedId, setSelectedId] = useState(branch.nodes[0]?.id ?? "");
  const [feedback, setFeedback] = useState<{
    nodeId: string;
    kind: ArcaneCoreFeedback;
  } | null>(null);
  const [ringPulse, setRingPulse] = useState<ArcaneCoreRingIndex | null>(null);
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(
    null,
  );
  const [summaryOpen, setSummaryOpen] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const drag = useRef<CoreDragState | null>(null);
  const feedbackTimer = useRef<number | null>(null);
  const {
    cameraRef,
    viewportSizeRef,
    viewportSize,
    zoomForHud,
    cameraMode,
    setCameraMode,
    scheduleCameraApply,
    fitCamera,
    zoomAtPointer,
  } = useArcaneCoreCamera({ viewportRef, worldRef });
  const selected =
    branch.nodes.find((node) => node.id === selectedId) ?? branch.nodes[0];
  const selectedRank = selected ? getArcaneCoreNodeRank(core, selected.id) : 0;
  const highestRing = getArcaneCoreHighestUnlockedRing(core, branch.id);
  const wallet = getArcaneCoreWalletInfo(core);
  const selectedState = selected
    ? getArcaneCoreNodeState(core, selected, highestRing, wallet.pointsAvailable)
    : "LOCKED_RING";
  const spent = getArcaneCorePointsSpent({
    nodes: Object.fromEntries(
      branch.nodes
        .map((node) => [node.id, core.nodes[node.id]])
        .filter(([, value]) => value),
    ),
  });
  const fitProgressionRing = Math.min(
    8,
    highestRing + 1,
  ) as ArcaneCoreRingIndex;
  const zoomClass =
    zoomForHud < 0.3
      ? "is-zoom-far"
      : zoomForHud < 0.65
        ? "is-zoom-medium"
        : "is-zoom-close";

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      event.button !== 0 ||
      (event.target as Element | null)?.closest("button, [data-no-pan]")
    )
      return;
    event.preventDefault();
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: cameraRef.current.x,
      offsetY: cameraRef.current.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const nextX = event.clientX - drag.current.x;
    const nextY = event.clientY - drag.current.y;
    if (
      !drag.current.moved &&
      Math.hypot(nextX, nextY) < ARCANE_CORE_DRAG_THRESHOLD
    )
      return;
    if (!drag.current.moved) {
      drag.current.moved = true;
      setCameraMode("manual");
      event.currentTarget.classList.add("is-panning");
    }
    const nextOffset = clampCameraOffset(
      { x: drag.current.offsetX + nextX, y: drag.current.offsetY + nextY },
      cameraRef.current.zoom,
      viewportSizeRef.current,
    );
    cameraRef.current.x = nextOffset.x;
    cameraRef.current.y = nextOffset.y;
    scheduleCameraApply();
  };
  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    event.currentTarget.classList.remove("is-panning");
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture?.(event.pointerId);
  };
  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nextZoom = Math.max(
      ARCANE_CORE_MIN_ZOOM,
      Math.min(
        ARCANE_CORE_MAX_ZOOM,
        cameraRef.current.zoom * (event.deltaY > 0 ? 0.9 : 1.1),
      ),
    );
    zoomAtPointer(nextZoom, {
      x: event.clientX - rect.left - rect.width / 2,
      y: event.clientY - rect.top - rect.height / 2,
    });
  };
  const applyFit = (mode: "progression" | "all") =>
    fitCamera(
      mode,
      (mode === "all" ? 8 : fitProgressionRing) as ArcaneCoreRingIndex,
    );

  useEffect(() => {
    if (cameraMode === "manual" || !viewportSize.width || !viewportSize.height)
      return;
    fitCamera(
      cameraMode,
      (cameraMode === "all" ? 8 : fitProgressionRing) as ArcaneCoreRingIndex,
    );
  }, [
    cameraMode,
    fitCamera,
    fitProgressionRing,
    viewportSize.width,
    viewportSize.height,
  ]);
  useEffect(
    () => () => {
      if (feedbackTimer.current !== null)
        window.clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const flashFeedback = (
    nodeId: string,
    kind: ArcaneCoreFeedback,
    unlockedRing?: ArcaneCoreRingIndex,
  ) => {
    if (feedbackTimer.current !== null)
      window.clearTimeout(feedbackTimer.current);
    setFeedback({ nodeId, kind });
    setRingPulse(unlockedRing ?? null);
    feedbackTimer.current = window.setTimeout(() => {
      setFeedback(null);
      setRingPulse(null);
      feedbackTimer.current = null;
    }, 760);
  };
  const purchaseNode = (nodeId: string) => {
    const node = branch.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) return false;
    const beforeCore = useGameStore.getState().arcaneCore;
    const beforeHighestRing = getArcaneCoreHighestUnlockedRing(
      beforeCore,
      branch.id,
    );
    const beforeWallet = getArcaneCoreWalletInfo(beforeCore);
    const beforeState = getArcaneCoreNodeState(
      beforeCore,
      node,
      beforeHighestRing,
      beforeWallet.pointsAvailable,
    );
    if (beforeState === "MAXED") {
      flashFeedback(nodeId, "max");
      return false;
    }
    if (beforeState === "LOCKED_RING") {
      flashFeedback(nodeId, "ring-unlock");
      return false;
    }
    if (beforeState === "LOCKED_MAJOR_REQUIREMENT") {
      flashFeedback(nodeId, "major-unlock");
      return false;
    }
    if (beforeState === "UNAFFORDABLE") {
      flashFeedback(nodeId, "unaffordable");
      return false;
    }
    if (!purchase(nodeId)) {
      flashFeedback(nodeId, "denied");
      return false;
    }
    const afterCore = useGameStore.getState().arcaneCore;
    const afterRank = getArcaneCoreNodeRank(afterCore, nodeId);
    const afterHighestRing = getArcaneCoreHighestUnlockedRing(
      afterCore,
      branch.id,
    );
    flashFeedback(
      nodeId,
      afterRank >= node.maxRank ? "max" : "purchase",
      afterHighestRing > beforeHighestRing ? afterHighestRing : undefined,
    );
    return true;
  };
  const handlePurchase = () => {
    if (selected) purchaseNode(selected.id);
  };
  const handleDoublePurchase = (nodeId: string) => {
    setSelectedId(nodeId);
    purchaseNode(nodeId);
  };
  const requestRefund = () => {
    if (!selected || selectedRank <= 0) return;
    const preview = getArcaneCoreRefundPreview(core, selected.id);
    if (preview.ok)
      setConfirmation({
        label: `Refund ${selected.name} rank?`,
        points: preview.corePointsReturned,
        ranks: preview.ranksAffected,
        majors: preview.majorsAffected,
        rings: preview.ringsRelocked.length,
        confirm: () => {
          refund(selected.id);
          setConfirmation(null);
        },
      });
  };
  const requestReset = () => {
    const preview = getArcaneCoreBranchResetPreview(core, branch.id);
    if (preview.ok && preview.corePointsReturned > 0)
      setConfirmation({
        label: `Reset ${branch.name} Core?`,
        points: preview.corePointsReturned,
        ranks: preview.ranksAffected,
        majors: preview.majorsAffected,
        rings: preview.ringsRelocked.length,
        confirm: () => {
          resetBranch(branch.id);
          setConfirmation(null);
        },
      });
  };
  const selectedCurrent = selected ? nodeEffect(selected, selectedRank) : "";
  const selectedNext =
    selected && selectedRank < selected.maxRank
      ? nodeEffect(selected, selectedRank + 1)
      : "Maximum rank reached.";
  const selectedMax = selected ? nodeEffect(selected, selected.maxRank) : "";
  const previousRing = Math.max(
    1,
    (selected?.ring ?? 1) - 1,
  ) as ArcaneCoreRingIndex;
  const standardRanks = selected
    ? getArcaneCoreRingStandardRanksInvested(core, branch.id, selected.ring)
    : 0;
  const previousRingRanks = selected
    ? getArcaneCoreRingStandardRanksInvested(core, branch.id, previousRing)
    : 0;
  const pointsNeeded = selected
    ? Math.max(0, selected.rankCost - wallet.pointsAvailable)
    : 0;
  const statusText =
    selectedState === "MAXED"
      ? "MAX RANK"
      : selectedState === "UNAFFORDABLE"
        ? `NEED ${pointsNeeded} MORE AP`
        : selectedState === "LOCKED_MAJOR_REQUIREMENT"
          ? `MAJOR LOCKED · ${standardRanks} / ${ARCANE_CORE_MAJOR_GATES[selected?.ring ?? 1]} STANDARD RANKS`
          : selectedState === "LOCKED_RING"
            ? `RING LOCKED · ${previousRingRanks} / ${ARCANE_CORE_RING_GATES[selected?.ring ?? 1]} PREVIOUS-RING RANKS`
            : selectedState === "INVESTED"
              ? "INVESTED · NEXT RANK AVAILABLE"
              : "PURCHASABLE";
  const cursorAccent = ARCANE_CORE_BRANCH_CURSOR_COLORS[branch.id];
  const modalStyle = {
    "--branch-accent": branch.accent,
    "--arcane-core-cursor-default": createCursorValue(cursorAccent, "default"),
    "--arcane-core-cursor-action": createCursorValue(cursorAccent, "action"),
    "--arcane-core-cursor-disabled": createCursorValue(cursorAccent, "disabled"),
    "--arcane-core-cursor-drag": createCursorValue(cursorAccent, "drag"),
    "--arcane-core-cursor-dragging": createCursorValue(cursorAccent, "dragging"),
  } as CSSProperties;

  return (
    <ModalPortal
      open
      onClose={onClose}
      onEscape={() =>
        confirmation
          ? setConfirmation(null)
          : summaryOpen
            ? setSummaryOpen(false)
            : onClose()
      }
      surfaceStyle={modalStyle}
      backdropClassName="arcane-core-modal-backdrop"
      surfaceClassName="arcane-core-modal"
      ariaLabel={`${branch.name} Core`}
    >
      <div className="arcane-core-modal-head">
        <div>
          <span className="eyebrow" style={{ color: branch.accent }}>
            {branch.name.toUpperCase()} CORE · CONCENTRIC PATH
          </span>
          <h2>{branch.name} Core</h2>
          <p className="arcane-core-modal-subline">
            <strong>RING {highestRing} / 8</strong>
            <span>{spent.toLocaleString()} invested</span>
            <span>{wallet.pointsAvailable.toLocaleString()} AP available</span>
            <GameTooltip content="Invest from the center outward. Rings unlock through standard-rank investment; every rank is permanent until refunded.">
              <span className="arcane-core-modal-help" aria-label="Arcane Core help">?</span>
            </GameTooltip>
          </p>
        </div>
        <div className="arcane-core-modal-actions">
          <Status tone="active">
            {spent} / {ARCANE_CORE_TOTAL_COST_PER_CORE} invested
          </Status>
          <Button
            variant="ghost"
            onClick={onClose}
            ariaLabel="Close Arcane Core"
          >
            <X size={17} />
          </Button>
        </div>
      </div>
      <div className="arcane-core-modal-toolbar">
        <GameTooltip content="Spendable across all four Arcane Cores.">
          <span
            className="arcane-core-modal-available-points"
            tabIndex={0}
            aria-label={`${wallet.pointsAvailable.toLocaleString()} Arcane Points available across all four Arcane Cores`}
          >
            <small>AVAILABLE</small>
            <strong>{wallet.pointsAvailable.toLocaleString()}</strong>
            <small>ARCANE POINTS</small>
          </span>
        </GameTooltip>
        <span className="arcane-core-modal-hint">
          <Crosshair size={14} /> Drag to pan · wheel to zoom
        </span>
        <span>
          UNLOCKED {highestRing} / 8 · {spent} /{" "}
          {ARCANE_CORE_TOTAL_COST_PER_CORE} ARCANE POINTS ·{" "}
          {Math.round(zoomForHud * 100)}%
        </span>
        <Button variant="ghost" onClick={() => applyFit("progression")}>
          <Crosshair size={13} /> Fit Progression
        </Button>
        <Button variant="ghost" onClick={() => applyFit("all")}>
          <Crosshair size={13} /> Fit All
        </Button>
        <Button variant="ghost" onClick={() => applyFit("progression")}>
          <RotateCcw size={13} /> Reset View
        </Button>
        <Button variant="danger" onClick={requestReset} disabled={spent === 0}>
          Reset Core
        </Button>
      </div>
      <div className="arcane-core-modal-body">
        <div
          ref={viewportRef}
          className="arcane-core-ring-viewport"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={handleWheel}
          onDragStart={(event) => event.preventDefault()}
        >
          <div
            className={`arcane-core-depth-hud ${zoomClass}`}
            aria-label="Arcane Core Ring progression"
          >
            <span>CORE DEPTH</span>
            <strong>RING {highestRing} / 8 REACHED</strong>
            <div>
              {ARCANE_CORE_RING_INDICES.map((ring) => (
                <i
                  key={ring}
                  className={`${ring <= highestRing ? "is-unlocked" : ring === highestRing + 1 ? "is-next" : "is-locked"}`}
                >
                  <b>{ring}</b>
                  {ring > highestRing && (
                    <LockKeyhole size={9} aria-hidden="true" />
                  )}
                </i>
              ))}
            </div>
          </div>
          <div
            ref={worldRef}
            className="arcane-core-world"
            onDragStart={(event) => event.preventDefault()}
          >
            <div className="arcane-core-hub">
              <Sparkles size={28} />
              <span className="arcane-core-hub-kicker">
                {branch.name.toUpperCase()} CORE
              </span>
              <strong>
                {spent} / {ARCANE_CORE_TOTAL_COST_PER_CORE}
              </strong>
              <small>ARCANE POINTS INVESTED</small>
              <em>RING {highestRing} REACHED</em>
            </div>
            <ArcaneCoreOrbitLayer
              highestRing={highestRing}
              selectedRing={selected?.ring}
              ringPulse={ringPulse}
            />
            <ArcaneCoreNodeLayer
              branch={branch}
              core={core}
              highestRing={highestRing}
              selectedId={selectedId}
              feedback={feedback}
              onSelect={setSelectedId}
              onDoublePurchase={handleDoublePurchase}
            />
          </div>
        </div>
        <aside className="arcane-core-node-inspector">
          <div className="arcane-core-node-inspector-scroll">
            {selected && (
              <>
                <div className="arcane-core-inspector-identity">
                  <div className="arcane-core-inspector-title">
                    <span
                      className="arcane-core-inspector-glyph"
                      style={{ background: branch.accent }}
                    >
                      <Sparkles size={17} />
                    </span>
                    <div>
                      <span className="eyebrow">
                        RING {selected.ring} · {selected.nodeType.toUpperCase()}
                      </span>
                      <h3>{selected.name}</h3>
                    </div>
                  </div>
                  <p className="muted">{selected.description}</p>
                </div>
                <section className="arcane-core-inspector-section">
                  <span className="arcane-core-inspector-section-label">
                    EFFECT SUMMARY
                  </span>
                  <div className="arcane-core-inspector-effect">
                    <span>
                      CURRENT EFFECT · RANK {selectedRank}/{selected.maxRank}
                    </span>
                    <strong>{selectedCurrent}</strong>
                    <small>NEXT · {selectedNext}</small>
                    <small>MAX · {selectedMax}</small>
                  </div>
                </section>
                <section className="arcane-core-inspector-section">
                  <span className="arcane-core-inspector-section-label">
                    NODE STATUS
                  </span>
                  <div className="arcane-core-inspector-meta">
                    <span>
                      RING
                      <strong>
                        {getArcaneCoreRingName(branch.id, selected.ring)}
                      </strong>
                    </span>
                    <span>
                      STATUS
                      <strong className={`arcane-core-status-chip is-${selectedState.toLowerCase().replace(/_/g, "-")}`}>
                        {statusText}
                      </strong>
                    </span>
                    <span>
                      COST
                      <strong>
                        {selected.rankCost} ARCANE POINT
                        {selected.rankCost > 1 ? "S" : ""}
                      </strong>
                    </span>
                    <span>
                      RANK
                      <strong>
                        {selectedRank} / {selected.maxRank}
                      </strong>
                    </span>
                  </div>
                </section>
                <div className="arcane-core-inspector-cost-card">
                  <span>
                    <small>{selected.nodeType === "major" ? "MAJOR COST" : selectedRank >= selected.maxRank ? "MAX RANK" : `RANK ${selectedRank + 1} COST`}</small>
                    <strong>{selected.rankCost} AP</strong>
                  </span>
                  <span>
                    <small>AVAILABLE</small>
                    <strong>{wallet.pointsAvailable} AP</strong>
                  </span>
                  <span className={pointsNeeded > 0 ? "is-needed" : undefined}>
                    <small>{pointsNeeded > 0 ? "NEED" : "REMAINING"}</small>
                    <strong>{pointsNeeded > 0 ? `${pointsNeeded} MORE AP` : `${wallet.pointsAvailable - selected.rankCost} AP`}</strong>
                  </span>
                </div>
                <div className="arcane-core-inspector-actions">
                  <Button
                    variant="primary"
                    onClick={handlePurchase}
                    disabled={
                      selectedState === "MAXED" ||
                      selectedState === "LOCKED_RING" ||
                      selectedState === "LOCKED_MAJOR_REQUIREMENT" ||
                      selectedState === "UNAFFORDABLE"
                    }
                  >
                    PURCHASE {selected.nodeType === "major" ? "MAJOR" : "RANK"}{" "}
                    · {selected.rankCost} ARCANE POINT
                    {selected.rankCost > 1 ? "S" : ""}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={requestRefund}
                    disabled={selectedRank === 0}
                  >
                    Refund One Rank
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="arcane-core-node-inspector-footer">
            <Button variant="secondary" onClick={() => setSummaryOpen(true)}>
              <ScrollText size={15} /> CORE SUMMARY
            </Button>
          </div>
        </aside>
      </div>
      {confirmation && (
        <div
          className="arcane-core-confirm-layer"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <section
            className="arcane-core-confirmation"
            role="alertdialog"
            aria-modal="true"
          >
            <span className="eyebrow">CONFIRM REFUND CASCADE</span>
            <h3>{confirmation.label}</h3>
            <p className="muted">
              Outer allocations become invalid if this refund closes a Ring
              gate.
            </p>
            <div className="arcane-core-confirm-summary">
              <span>
                <small>RANKS RETURNED</small>
                <strong>{confirmation.ranks}</strong>
              </span>
              <span>
                <small>ARCANE POINTS RETURNED</small>
                <strong>{confirmation.points}</strong>
              </span>
              <span>
                <small>MAJORS AFFECTED</small>
                <strong>{confirmation.majors}</strong>
              </span>
              <span>
                <small>RINGS RELOCKED</small>
                <strong>{confirmation.rings}</strong>
              </span>
            </div>
            <div className="button-row">
              <Button variant="ghost" onClick={() => setConfirmation(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmation.confirm}>
                Confirm Refund
              </Button>
            </div>
          </section>
        </div>
      )}
      {summaryOpen && (
        <ArcaneCoreSummaryModal
          branch={branch}
          core={core}
          onClose={() => setSummaryOpen(false)}
        />
      )}
    </ModalPortal>
  );
}

export function ArcaneCoreScreen() {
  const core = useGameStore((state) => state.arcaneCore);
  const [branchId, setBranchId] = useState<ArcaneCoreBranchId | null>(null);
  const activeBranch = branchId
    ? ARCANE_CORE_BRANCHES.find((branch) => branch.id === branchId)
    : undefined;
  const pointsSpent = getArcaneCorePointsSpent(core);
  return (
    <div className="screen-content arcane-core-screen">
      <div className="screen-header">
        <div>
          <div className="eyebrow">HERO · PERMANENT PROGRESSION</div>
          <h1>Arcane Core</h1>
          <p>
            Defeat monsters and bosses to earn Arcane Points. Spend them across
            four permanent Cores; deeper Rings cost more.
          </p>
        </div>
        <Status tone="active">
          {pointsSpent} / {ARCANE_CORE_TOTAL_TREE_COST} Arcane Points invested
        </Status>
      </div>
      <ScreenGrid
        screen="arcane-core"
        panels={[
          {
            id: "arcane-core-overview",
            content: (
              <div className="arcane-core-overview-stack">
                <Card title="Arcane Points">
                  <CoreProgress core={core} />
                </Card>
                <div className="arcane-core-branch-grid">
                  {ARCANE_CORE_BRANCHES.map((branch) => (
                    <BranchCard
                      key={branch.id}
                      branch={branch}
                      state={core}
                      onOpen={() => setBranchId(branch.id)}
                    />
                  ))}
                </div>
                <ArcaneCorePresetPanel />
              </div>
            ),
          },
        ]}
      />
      {activeBranch && (
        <CoreModal branch={activeBranch} onClose={() => setBranchId(null)} />
      )}
    </div>
  );
}
