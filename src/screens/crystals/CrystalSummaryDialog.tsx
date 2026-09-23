import { Gem, Sparkles, X } from "lucide-react";
import { useMemo } from "react";
import { Button, ModalPortal } from "../../components/ui";
import {
  CRYSTAL_GROUP_CAP,
  CRYSTAL_GROUP_LABELS,
  CRYSTAL_SLOT_COUNT,
} from "../../game/content/crystals/crystals";
import { getEquippedCrystalStats } from "../../game/systems/crystals/crystalStats";
import { getCrystalGroupUsage } from "../../game/systems/crystals/crystalRuntime";
import type { CrystalGroupId, GameState } from "../../game/types";
import {
  CRYSTAL_STAT_LABELS,
  formatCrystalStat,
} from "./CrystalTooltipContent";

export function CrystalSummaryDialog({
  crystals,
  onClose,
}: {
  crystals: GameState["crystals"];
  onClose: () => void;
}) {
  const stats = useMemo(() => getEquippedCrystalStats({ crystals }), [crystals]);
  const statRows = Object.entries(stats).filter(
    ([key, value]) => key !== "resistances" && Number(value) !== 0,
  );
  const activeCrystals = crystals.equippedSlots.filter(Boolean).length;

  return (
    <ModalPortal
      open
      onClose={onClose}
      onEscape={onClose}
      onBackdropClick={onClose}
      backdropClassName="crystal-summary-dialog-backdrop"
      surfaceClassName="crystal-summary-dialog"
      ariaLabelledBy="crystal-summary-dialog-title"
    >
      <div className="crystal-summary-dialog-head">
        <div>
          <span className="eyebrow">RESONANCE ARRAY</span>
          <h2 id="crystal-summary-dialog-title">CRYSTAL SUMMARY</h2>
          <p>Crystal contribution resolved from the active loadout.</p>
        </div>
        <Button
          variant="ghost"
          icon
          ariaLabel="Close Crystal Summary"
          onClick={onClose}
        >
          <X size={16} />
        </Button>
      </div>

      <div className="crystal-summary-dialog-body">
        <section className="crystal-summary-dialog-count">
          <div className="crystal-summary-dialog-count-icon">
            <Gem size={18} />
          </div>
          <div>
            <span className="eyebrow">ACTIVE CRYSTALS</span>
            <strong>
              {activeCrystals} / {crystals.unlockedSlots}
            </strong>
            <small>
              {crystals.unlockedSlots} / {CRYSTAL_SLOT_COUNT} SOCKETS ACTIVE
            </small>
          </div>
        </section>

        <section className="crystal-summary-dialog-section">
          <span className="eyebrow">TOTAL CRYSTAL CONTRIBUTION</span>
          <div className="crystal-summary-dialog-stat-list">
            {statRows.length ? (
              statRows.map(([key, value]) => (
                <div key={key}>
                  <span>{CRYSTAL_STAT_LABELS[key] ?? key}</span>
                  <strong>+{formatCrystalStat(key, Number(value))}</strong>
                </div>
              ))
            ) : (
              <p>No active Crystal bonuses.</p>
            )}
          </div>
        </section>

        <section className="crystal-summary-dialog-section">
          <span className="eyebrow">GROUP USAGE</span>
          <div className="crystal-summary-dialog-group-grid">
            {(Object.keys(CRYSTAL_GROUP_LABELS) as CrystalGroupId[]).map(
              (group) => {
                const usage = getCrystalGroupUsage({ crystals }, group);
                return (
                  <div
                    key={group}
                    className={`crystal-summary-dialog-group-row ${usage > 0 ? "has-value" : ""} ${usage >= CRYSTAL_GROUP_CAP ? "is-full" : ""}`}
                  >
                    <span>{CRYSTAL_GROUP_LABELS[group]}</span>
                    <strong>
                      {usage} / {CRYSTAL_GROUP_CAP}
                    </strong>
                  </div>
                );
              },
            )}
          </div>
        </section>

        <section className="crystal-summary-dialog-resource">
          <Sparkles size={15} />
          <span>CRYSTAL DUST</span>
          <strong>{crystals.dust.toLocaleString()}</strong>
        </section>
      </div>

      <div className="crystal-summary-dialog-actions">
        <Button variant="secondary" onClick={onClose}>
          CLOSE
        </Button>
      </div>
    </ModalPortal>
  );
}
