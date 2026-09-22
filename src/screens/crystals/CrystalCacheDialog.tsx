import { Sparkles, X } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Button, GameTooltip } from "../../components/ui";
import { getCrystalFamily, getCrystalVariantName } from "../../game/content/crystals/crystals";
import type { CrystalVariantId } from "../../game/types";
import type { CrystalCacheOpenResult } from "../../game/systems/crystals/crystalRuntime";
import "../../styles/screens/crystals.css";
import { CrystalTooltipContent } from "./CrystalTooltipContent";

export function CrystalCacheDialog({
  owned,
  onOpen,
  onClose,
  onOpenInventory,
}: {
  owned: number;
  onOpen: (quantity: number) => CrystalCacheOpenResult;
  onClose: () => void;
  onOpenInventory: () => void;
}) {
  const [quantity, setQuantity] = useState(Math.min(1, owned));
  const [result, setResult] = useState<CrystalCacheOpenResult | null>(null);
  const updateQuantity = (value: number) =>
    setQuantity(
      Math.max(1, Math.min(Math.max(1, owned), Math.floor(value) || 1)),
    );
  return (
    <div className="crystal-modal-backdrop" role="presentation">
      <section
        className="crystal-inventory-modal crystal-cache-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Tier 1 Crystal Cache"
      >
        <div className="crystal-modal-head">
          <div>
            <span className="eyebrow">SPECIAL ITEM · OPEN ACTION</span>
            <h2>
              {result ? "TIER 1 CRYSTAL CACHE RESULTS" : "TIER 1 CRYSTAL CACHE"}
            </h2>
            <p>
              {result
                ? `${result.opened} cache${result.opened === 1 ? "" : "s"} opened.`
                : `${owned.toLocaleString()} available · 80% Dust / 20% Crystal`}
            </p>
          </div>
          <Button
            variant="ghost"
            icon
            ariaLabel="Close cache dialog"
            onClick={onClose}
          >
            <X size={17} />
          </Button>
        </div>
        {result ? (
          <div className="crystal-cache-results">
            <div className="crystal-cache-result-total">
              <span>OPENED</span>
              <strong>{result.opened}</strong>
              <small>One aggregated result</small>
            </div>
            <div className="crystal-cache-reward-grid">
              <GameTooltip block content="25 Crystal Dust per Dust result.">
                <div className="crystal-cache-reward">
                  <Sparkles size={20} />
                  <strong>+{result.dust.toLocaleString()}</strong>
                  <span>CRYSTAL DUST</span>
                </div>
              </GameTooltip>
              {Object.entries(result.crystals).map(([variantId, amount]) => {
                const crystal = getCrystalFamily(variantId as CrystalVariantId);
                return (
                  <GameTooltip
                    key={variantId}
                    block
                    wide
                    content={
                      <CrystalTooltipContent
                        variantId={variantId as CrystalVariantId}
                      />
                    }
                  >
                    <div
                      className="crystal-cache-reward"
                      style={
                        { "--crystal-color": crystal.color } as CSSProperties
                      }
                    >
                      <span>{crystal.icon}</span>
                      <strong>+{amount}</strong>
                      <span>
                        {getCrystalVariantName(variantId as CrystalVariantId)}
                      </span>
                    </div>
                  </GameTooltip>
                );
              })}
            </div>
            <div className="crystal-cache-dialog-actions">
              <Button variant="secondary" onClick={onClose}>
                CONTINUE
              </Button>
              <Button onClick={onOpenInventory}>CRYSTAL INVENTORY</Button>
            </div>
          </div>
        ) : (
          <div className="crystal-cache-open-form">
            <div className="crystal-cache-open-icon">◇</div>
            <p>
              Open caches in one atomic roll transaction. Dust and Crystal
              rewards are resolved by the dedicated cache RNG.
            </p>
            <div className="crystal-cache-quantity">
              <label htmlFor="crystal-cache-quantity">OPEN QUANTITY</label>
              <input
                id="crystal-cache-quantity"
                type="number"
                min={1}
                max={Math.max(1, owned)}
                value={quantity}
                onChange={(event) =>
                  updateQuantity(Number(event.currentTarget.value))
                }
              />
              <div>
                <Button
                  variant="ghost"
                  onClick={() => updateQuantity(1)}
                  disabled={owned < 1}
                >
                  1
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => updateQuantity(10)}
                  disabled={owned < 1}
                >
                  10
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => updateQuantity(owned)}
                  disabled={owned < 1}
                >
                  MAX
                </Button>
              </div>
            </div>
            <Button
              onClick={() => {
                const next = onOpen(quantity);
                if (next.ok) setResult(next);
              }}
              disabled={owned < 1}
            >
              OPEN {quantity.toLocaleString()} CACHE{quantity === 1 ? "" : "S"}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
