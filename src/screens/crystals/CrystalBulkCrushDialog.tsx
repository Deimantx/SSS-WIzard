import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../components/ui";
import { useGameStore } from "../../store/gameStore";
import { getCrystalAvailableCount } from "../../game/systems/crystals/crystalRuntime";
import {
  CRYSTAL_CRUSH_DUST,
  CRYSTAL_VARIANT_IDS,
  getCrystalFamily,
  getCrystalTier,
  getCrystalVariantName,
} from "../../game/content/crystals/crystals";
import type { CrystalVariantId, GameState } from "../../game/types";
import "../../styles/screens/crystalBulkCrushDialog.css";

export function CrystalBulkCrushDialog({
  crystals,
  onClose,
}: {
  crystals: GameState["crystals"];
  onClose: () => void;
}) {
  const bulkCrushCrystals = useGameStore((state) => state.bulkCrushCrystals);
  const available = CRYSTAL_VARIANT_IDS.map((variantId) => ({
    variantId,
    quantity: getCrystalAvailableCount({ crystals }, variantId),
  })).filter((entry) => entry.quantity > 0);
  const [selected, setSelected] = useState<Record<CrystalVariantId, number>>(
    () =>
      Object.fromEntries(
        available.map(({ variantId }) => [variantId, 0]),
      ) as Record<CrystalVariantId, number>,
  );
  const selectedEntries = available.filter(
    ({ variantId }) => (selected[variantId] ?? 0) > 0,
  );
  const totalQuantity = selectedEntries.reduce(
    (sum, { variantId }) => sum + (selected[variantId] ?? 0),
    0,
  );
  const dust = selectedEntries.reduce(
    (sum, { variantId }) =>
      sum +
      (selected[variantId] ?? 0) *
        CRYSTAL_CRUSH_DUST[getCrystalTier(variantId)],
    0,
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const submit = () => {
    if (!totalQuantity) return;
    if (
      bulkCrushCrystals(
        Object.fromEntries(
          selectedEntries.map(({ variantId }) => [
            variantId,
            selected[variantId],
          ]),
        ) as Partial<Record<CrystalVariantId, number>>,
      )
    ) {
      onClose();
    }
  };

  return (
    <div
      className="crystal-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="crystal-modal-surface crystal-bulk-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Bulk Crush Crystals"
      >
        <div className="crystal-modal-head">
          <div>
            <span className="eyebrow">CRYSTAL INVENTORY</span>
            <h2>BULK CRUSH</h2>
            <p>
              Select unequipped Crystals to convert into Dust. Equipped copies
              are protected.
            </p>
          </div>
          <Button
            variant="ghost"
            icon
            ariaLabel="Close Bulk Crush"
            onClick={onClose}
          >
            <X size={17} />
          </Button>
        </div>
        <div className="crystal-bulk-list">
          {available.length ? (
            available.map(({ variantId, quantity }) => (
              <label
                className={`crystal-bulk-row ${(selected[variantId] ?? 0) > 0 ? "selected" : ""}`}
                key={variantId}
              >
                <input
                  type="checkbox"
                  checked={(selected[variantId] ?? 0) > 0}
                  onChange={(event) =>
                    setSelected((current) => ({
                      ...current,
                      [variantId]: event.target.checked ? quantity : 0,
                    }))
                  }
                />
                <span>
                  <strong>{getCrystalVariantName(variantId)}</strong>
                  <small>
                    T{getCrystalTier(variantId)} -{" "}
                    {getCrystalFamily(variantId).group.toUpperCase()}
                  </small>
                </span>
                <input
                  aria-label={`Quantity for ${getCrystalVariantName(variantId)}`}
                  type="number"
                  min="0"
                  max={quantity}
                  value={selected[variantId] ?? 0}
                  onChange={(event) => {
                    const value = Math.max(
                      0,
                      Math.min(quantity, Number(event.target.value) || 0),
                    );
                    setSelected((current) => ({
                      ...current,
                      [variantId]: value,
                    }));
                  }}
                />
              </label>
            ))
          ) : (
            <div className="crystal-empty">
              No unequipped Crystals are available to crush.
            </div>
          )}
        </div>
        <div className="crystal-bulk-footer">
          <span>
            {totalQuantity} copies -&gt; {dust.toLocaleString()} Dust
          </span>
          <div>
            <Button
              variant="ghost"
              onClick={() =>
                setSelected(
                  Object.fromEntries(
                    available.map(({ variantId, quantity }) => [
                      variantId,
                      quantity,
                    ]),
                  ) as Record<CrystalVariantId, number>,
                )
              }
              disabled={!available.length}
            >
              SELECT ALL
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                setSelected(
                  Object.fromEntries(
                    available.map(({ variantId }) => [variantId, 0]),
                  ) as Record<CrystalVariantId, number>,
                )
              }
              disabled={!totalQuantity}
            >
              CLEAR
            </Button>
            <Button variant="secondary" onClick={onClose}>
              CANCEL
            </Button>
            <Button variant="danger" disabled={!totalQuantity} onClick={submit}>
              CONFIRM CRUSH
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
