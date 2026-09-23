import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../components/ui";
import {
  CRYSTAL_CRUSH_DUST,
  getCrystalTier,
  getCrystalVariantName,
} from "../../game/content/crystals/crystals";
import type { CrystalVariantId } from "../../game/types";
import "../../styles/screens/crystalBulkCrushDialog.css";

export function CrystalCrushQuantityDialog({
  variantId,
  available,
  onCrush,
  onClose,
}: {
  variantId: CrystalVariantId;
  available: number;
  onCrush: (quantity: number) => boolean;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState(Math.min(1, available));
  const updateQuantity = (value: number) =>
    setQuantity(Math.max(1, Math.min(available, Math.floor(value) || 1)));
  const dust = quantity * CRYSTAL_CRUSH_DUST[getCrystalTier(variantId)];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const submit = () => {
    if (onCrush(quantity)) onClose();
  };

  return (
    <div
      className="crystal-modal-backdrop crystal-crush-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="crystal-modal-surface crystal-bulk-modal crystal-crush-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Crush ${getCrystalVariantName(variantId)}`}
      >
        <div className="crystal-modal-head">
          <div>
            <span className="eyebrow">CRYSTAL INVENTORY</span>
            <h2>CRUSH CRYSTALS</h2>
            <p>
              {getCrystalVariantName(variantId)} · {available} available and
              unequipped.
            </p>
          </div>
          <Button
            variant="ghost"
            icon
            ariaLabel="Close Crush dialog"
            onClick={onClose}
          >
            <X size={17} />
          </Button>
        </div>
        <div className="crystal-crush-form">
          <label htmlFor="crystal-crush-quantity">QUANTITY</label>
          <input
            id="crystal-crush-quantity"
            type="number"
            min={1}
            max={available}
            value={quantity}
            onChange={(event) => updateQuantity(Number(event.target.value))}
          />
          <div>
            <Button variant="ghost" onClick={() => updateQuantity(1)}>
              1
            </Button>
            <Button variant="ghost" onClick={() => updateQuantity(10)}>
              10
            </Button>
            <Button variant="ghost" onClick={() => updateQuantity(available)}>
              MAX
            </Button>
          </div>
          <strong className="crystal-crush-result">
            {quantity} copies → {dust.toLocaleString()} Dust
          </strong>
        </div>
        <div className="crystal-bulk-footer">
          <span>Equipped copies are protected.</span>
          <div>
            <Button variant="secondary" onClick={onClose}>
              CANCEL
            </Button>
            <Button variant="danger" onClick={submit}>
              CONFIRM CRUSH
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
