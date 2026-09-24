import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button, GameTooltip } from "../../components/ui";
import { TooltipContent } from "../../components/ui/tooltip/Tooltip";
import { ARCANE_CORE_TOTAL_COST_PER_CORE } from "../../game/content/arcaneCore/arcaneCoreBalance";
import { getArcaneCoreBranchResonanceSummary } from "../../game/presentation/arcaneCore/arcaneCorePresentation";
import {
  getArcaneCoreHighestUnlockedRing,
  getArcaneCoreNodeRank,
  getArcaneCorePointsSpent,
} from "../../game/systems/arcaneCore";
import type {
  ArcaneCoreBranchDefinition,
  ArcaneCoreState,
} from "../../game/types";

interface ArcaneCoreSummaryModalProps {
  branch: ArcaneCoreBranchDefinition;
  core: ArcaneCoreState;
  onClose: () => void;
}

const branchState = (
  branch: ArcaneCoreBranchDefinition,
  core: ArcaneCoreState,
) => ({
  nodes: Object.fromEntries(
    branch.nodes
      .map((node) => [node.id, core.nodes[node.id]])
      .filter(([, value]) => value),
  ),
});

const sourceDescription = (
  sources: NonNullable<
    ReturnType<
      typeof getArcaneCoreBranchResonanceSummary
    >["alwaysOn"][number]["sources"]
  >,
) =>
  sources
    .map(
      (source) => `${source.nodeName} ${source.formattedValue ?? source.value}`,
    )
    .join(" · ");

function BonusRow({
  entry,
  conditional = false,
}: {
  entry:
    | ReturnType<typeof getArcaneCoreBranchResonanceSummary>["alwaysOn"][number]
    | ReturnType<
        typeof getArcaneCoreBranchResonanceSummary
      >["conditional"][number];
  conditional?: boolean;
}) {
  const sources = sourceDescription(entry.sources ?? []);
  return (
    <GameTooltip
      wide
      block
      content={
        <TooltipContent
          title={`${entry.label} sources`}
          description={sources || "This bonus is active in the opened Core."}
        />
      }
    >
      <div
        className={`arcane-core-summary-bonus${conditional ? " is-conditional" : ""}`}
        tabIndex={0}
      >
        <span>
          <strong>{entry.label}</strong>
          {conditional && <small>{entry.conditionText}</small>}
        </span>
        <b>{entry.formattedValue}</b>
      </div>
    </GameTooltip>
  );
}

export function ArcaneCoreSummaryModal({
  branch,
  core,
  onClose,
}: ArcaneCoreSummaryModalProps) {
  const surfaceRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const summary = getArcaneCoreBranchResonanceSummary(core, branch.id);
  const scopedState = branchState(branch, core);
  const spent = getArcaneCorePointsSpent(scopedState);
  const purchasedNodes = branch.nodes.filter(
    (node) => getArcaneCoreNodeRank(core, node.id) > 0,
  );
  const purchasedRankCount = purchasedNodes.reduce(
    (total, node) => total + getArcaneCoreNodeRank(core, node.id),
    0,
  );
  const highestRing = getArcaneCoreHighestUnlockedRing(core, branch.id);
  const hasActiveBonuses =
    summary.alwaysOn.length > 0 ||
    summary.conditional.length > 0 ||
    summary.mechanics.length > 0;
  const mechanicsByRing = new Map<number, typeof summary.mechanics>();
  summary.mechanics.forEach((entry) => {
    const node = branch.nodes.find((candidate) => candidate.id === entry.id);
    const ring = node?.ring ?? 0;
    const entries = mechanicsByRing.get(ring) ?? [];
    entries.push(entry);
    mechanicsByRing.set(ring, entries);
  });

  useEffect(() => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusSelector = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
    const focusTimer = window.setTimeout(() => {
      surfaceRef.current?.querySelector<HTMLElement>('[data-autofocus="true"]')?.focus();
    }, 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !surfaceRef.current) return;
      const focusable = [...surfaceRef.current.querySelectorAll<HTMLElement>(focusSelector)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        event.stopPropagation();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        event.stopPropagation();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      if (openerRef.current && document.body.contains(openerRef.current)) openerRef.current.focus();
    };
  }, [onClose]);

  return (
    <div
      className="arcane-core-summary-layer"
      onMouseDown={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={surfaceRef}
        className="arcane-core-summary-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${branch.name} Core Summary`}
      >
        <header className="arcane-core-summary-head">
          <div>
            <span className="eyebrow" style={{ color: branch.accent }}>
              {branch.name.toUpperCase()} CORE
            </span>
            <h2>{branch.name} Core Summary</h2>
            <p>All currently active bonuses purchased in this Core.</p>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            ariaLabel="Close Core Summary"
            data-autofocus="true"
          >
            <X size={17} />
          </Button>
        </header>
        <div
          className="arcane-core-summary-meta"
          aria-label={`${branch.name} Core progression`}
        >
          <span>
            <small>INVESTED</small>
            <strong>
              {spent.toLocaleString()} /{" "}
              {ARCANE_CORE_TOTAL_COST_PER_CORE.toLocaleString()}
            </strong>
            <em>Arcane Points</em>
          </span>
          <span>
            <small>PURCHASED NODES</small>
            <strong>{purchasedNodes.length}</strong>
            <em>active nodes</em>
          </span>
          <span>
            <small>PURCHASED RANKS</small>
            <strong>{purchasedRankCount}</strong>
            <em>standard and Major ranks</em>
          </span>
          <span>
            <small>HIGHEST RING</small>
            <strong>{highestRing} / 8</strong>
            <em>reached</em>
          </span>
        </div>
        <div className="arcane-core-summary-scroll">
          {!hasActiveBonuses && (
            <div className="arcane-core-summary-empty">
              <strong>NO ACTIVE BONUSES YET</strong>
              <span>
                Purchase Arcane Core ranks to build this Core's summary.
              </span>
            </div>
          )}
          {summary.alwaysOn.length > 0 && (
            <section className="arcane-core-summary-section">
              <div className="arcane-core-summary-section-head">
                <span>PERMANENT BONUSES</span>
                <small>{summary.alwaysOn.length} active totals</small>
              </div>
              <div className="arcane-core-summary-bonus-grid">
                {summary.alwaysOn.map((entry) => (
                  <BonusRow key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          )}
          {summary.conditional.length > 0 && (
            <section className="arcane-core-summary-section">
              <div className="arcane-core-summary-section-head">
                <span>CONDITIONAL BONUSES</span>
                <small>{summary.conditional.length} active conditions</small>
              </div>
              <div className="arcane-core-summary-list">
                {summary.conditional.map((entry) => (
                  <BonusRow key={entry.id} entry={entry} conditional />
                ))}
              </div>
            </section>
          )}
          {summary.mechanics.length > 0 && (
            <section className="arcane-core-summary-section">
              <div className="arcane-core-summary-section-head">
                <span>ACTIVE MECHANICS</span>
                <small>{summary.mechanics.length} purchased · grouped by ring</small>
              </div>
              <div className="arcane-core-summary-ring-groups">
                {[...mechanicsByRing.entries()].map(([ring, entries]) => (
                  <div className="arcane-core-summary-ring-group" key={ring}>
                    <span className="arcane-core-summary-ring-label">RING {ring}</span>
                    <div className="arcane-core-summary-list">
                      {entries.map((entry) => {
                        const node = branch.nodes.find(
                          (candidate) => candidate.id === entry.id,
                        );
                        const rank = node ? getArcaneCoreNodeRank(core, node.id) : 0;
                        return (
                          <div
                            className="arcane-core-summary-mechanic"
                            key={entry.id}
                          >
                            <div>
                              <strong>{entry.label}</strong>
                              <small>
                                {node
                                  ? `RANK ${rank} / ${node.maxRank}`
                                  : "PURCHASED"}
                              </small>
                            </div>
                            <p>{entry.formattedValue}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
