import { Gem, LockKeyhole, Save, Sparkles, Trash2, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { Button, Card, GameTooltip, Status } from "../../components/ui";
import { ScreenGrid } from "../../components/layout/ScreenGrid";
import { useGameStore } from "../../store/gameStore";
import { getEquippedCrystalStats } from "../../game/systems/crystals/crystalStats";
import {
  getCrystalAvailableCount,
  getCrystalEquippedCount,
  getCrystalGroupUsage,
  getCrystalOwnedCount,
  hasUnsavedCrystalChanges,
} from "../../game/systems/crystals/crystalRuntime";
import {
  CRYSTAL_GROUP_LABELS,
  CRYSTAL_GROUP_CAP,
  CRYSTAL_SLOT_COUNT,
  CRYSTAL_UPGRADE_COSTS,
  CRYSTAL_VARIANT_IDS,
  getCrystalFamily,
  getCrystalTier,
  getCrystalVariantName,
  getCrystalVariantStats,
  getNextCrystalVariant,
} from "../../game/content/crystals/crystals";
import { ITEMS } from "../../game/content/items/items";
import type {
  CrystalGroupId,
  CrystalVariantId,
  GameState,
} from "../../game/types";
import "../../styles/screens/crystals.css";
import { useGameContextMenu } from "../../ui/context-menu/GameContextMenuProvider";
import { CrystalBulkCrushDialog } from "./CrystalBulkCrushDialog";
import { CrystalCrushQuantityDialog } from "./CrystalCrushQuantityDialog";
import {
  CrystalTooltipContent,
  CRYSTAL_STAT_LABELS,
  formatCrystalStat,
} from "./CrystalTooltipContent";
import {
  setNavigationIntent,
  useNavigationIntent,
} from "../../ui/navigation/navigationIntent";

type InventoryFilter = "all" | CrystalGroupId;
type CrystalSelection =
  | { source: "equipped"; variantId: CrystalVariantId; slotIndex: number }
  | { source: "inventory"; variantId: CrystalVariantId };

const STAT_LABELS = CRYSTAL_STAT_LABELS;
const formatStat = formatCrystalStat;

export function CrystalsScreen() {
  const crystals = useGameStore((state) => state.crystals);
  const combatActive = useGameStore((state) => state.combat.active);
  const equipCrystal = useGameStore((state) => state.equipCrystal);
  const unequipCrystal = useGameStore((state) => state.unequipCrystal);
  const upgradeCrystal = useGameStore((state) => state.upgradeCrystal);
  const crushCrystal = useGameStore((state) => state.crushCrystal);
  const savePreset = useGameStore((state) => state.saveCrystalPreset);
  const loadPreset = useGameStore((state) => state.loadCrystalPreset);
  const renamePreset = useGameStore((state) => state.renameCrystalPreset);
  const navigate = useGameStore((state) => state.setScreen);
  const navigationIntent = useNavigationIntent();
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [bulkCrushOpen, setBulkCrushOpen] = useState(false);
  const [destination, setDestination] = useState<number | null>(null);
  const [selection, setSelection] = useState<CrystalSelection | null>(null);
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [tierFilter, setTierFilter] = useState<"all" | 1 | 2 | 3 | 4 | 5>(
    "all",
  );
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!navigationIntent.openCrystalInventory) return;
    setInventoryOpen(true);
    setNavigationIntent({ openCrystalInventory: false });
  }, [navigationIntent.openCrystalInventory]);

  const stats = useMemo(
    () => getEquippedCrystalStats({ crystals }),
    [crystals],
  );
  const visibleVariants = useMemo(
    () =>
      CRYSTAL_VARIANT_IDS.filter((variantId) => {
        const family = getCrystalFamily(variantId);
        return (
          getCrystalOwnedCount({ crystals }, variantId) > 0 &&
          (filter === "all" || family.group === filter) &&
          (tierFilter === "all" || getCrystalTier(variantId) === tierFilter)
        );
      }),
    [crystals, filter, tierFilter],
  );
  const openInventory = (slot: number | null = null) => {
    setDestination(slot);
    setInventoryOpen(true);
  };
  const handleEquip = (variantId: CrystalVariantId) => {
    const replacedVariant =
      destination === null ? null : crystals.equippedSlots[destination];
    if (
      replacedVariant &&
      replacedVariant !== variantId &&
      !window.confirm(
        `Replace ${getCrystalVariantName(replacedVariant)} in socket ${destination! + 1}?`,
      )
    )
      return;
    if (equipCrystal(variantId, destination ?? undefined)) {
      setSelection(null);
      setDestination(null);
      setInventoryOpen(false);
    }
  };
  const { openContextMenu } = useGameContextMenu();
  const openSocketMenu = (
    event: MouseEvent<HTMLButtonElement>,
    variantId: CrystalVariantId,
    slot: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    openContextMenu({
      x: event.clientX,
      y: event.clientY,
      anchor: event.currentTarget,
      header: {
        title: getCrystalVariantName(variantId),
        meta: `EQUIPPED · SOCKET ${slot + 1}`,
      },
      sections: [
        {
          id: "crystal",
          actions: [
            {
              id: "inspect",
              label: "Inspect Crystal",
              onSelect: () =>
                setSelection({
                  source: "equipped",
                  variantId,
                  slotIndex: slot,
                }),
            },
            {
              id: "unequip",
              label: "Unequip",
              disabled: combatActive,
              disabledReason: combatActive
                ? "Crystal loadout changes are disabled during active combat."
                : undefined,
              onSelect: () => {
                unequipCrystal(slot);
                setSelection(null);
              },
            },
            {
              id: "upgrade",
              label: getNextCrystalVariant(variantId)
                ? "Upgrade..."
                : "MAX TIER",
              disabled: combatActive || !getNextCrystalVariant(variantId),
              disabledReason: combatActive
                ? "Equipped Crystal upgrades are disabled during active combat."
                : "This Crystal is already at the maximum tier.",
              onSelect: () =>
                setSelection({
                  source: "equipped",
                  variantId,
                  slotIndex: slot,
                }),
            },
            {
              id: "inventory",
              label: "Open Crystal Inventory",
              onSelect: () => openInventory(slot),
            },
          ],
        },
      ],
    });
  };

  const board = (
    <Card
      title="CRYSTAL SLOT BOARD"
      className="crystal-board-card"
      action={
        <div className="crystal-board-meta">
          <span>
            {crystals.unlockedSlots} / {CRYSTAL_SLOT_COUNT} SOCKETS ACTIVE
          </span>
          <strong>{combatActive ? "COMBAT LOCKED" : "LOADOUT READY"}</strong>
        </div>
      }
    >
      <div className="crystal-board-intro">
        <div>
          <span className="eyebrow">RESONANCE ARRAY</span>
          <h2>Shape the pressure around your spellcraft.</h2>
          <p>
            Each active socket holds one Crystal. Group limits keep the board
            deliberate: two per path.
          </p>
        </div>
        <div className="crystal-dust-chip">
          <Sparkles size={15} /> <span>CRYSTAL DUST</span>
          <strong>{crystals.dust.toLocaleString()}</strong>
        </div>
      </div>
      <div className="crystal-socket-grid" aria-label="Crystal sockets">
        {Array.from({ length: CRYSTAL_SLOT_COUNT }, (_, index) => {
          const variantId = crystals.equippedSlots[index];
          const locked = index >= crystals.unlockedSlots;
          const family = variantId ? getCrystalFamily(variantId) : null;
          const socket = (
            <button
              type="button"
              className={`crystal-socket ${locked ? "is-locked" : variantId ? "is-filled" : "is-empty"}`}
              style={
                family
                  ? ({ "--crystal-color": family.color } as CSSProperties)
                  : undefined
              }
              disabled={locked}
              onClick={() =>
                variantId
                  ? setSelection({
                      source: "equipped",
                      variantId,
                      slotIndex: index,
                    })
                  : openInventory(index)
              }
              onContextMenu={(event) => {
                if (variantId) openSocketMenu(event, variantId, index);
              }}
              aria-label={
                locked
                  ? `Crystal slot ${index + 1} locked`
                  : variantId
                    ? `${getCrystalVariantName(variantId)} equipped in slot ${index + 1}`
                    : `Open empty Crystal slot ${index + 1}`
              }
            >
              {locked ? (
                <>
                  <span className="crystal-socket-icon crystal-socket-locked-icon">
                    <LockKeyhole size={21} />
                  </span>
                  <b className="crystal-socket-locked-label">LOCKED</b>
                  <small>FUTURE SOCKET</small>
                </>
              ) : variantId ? (
                <>
                  <span className="crystal-socket-icon">{family?.icon}</span>
                  <b>T{getCrystalTier(variantId)}</b>
                  <small>{family?.name}</small>
                </>
              ) : (
                <>
                  <Gem size={20} />
                  <small>EMPTY SOCKET</small>
                </>
              )}
            </button>
          );
          return locked ? (
            <GameTooltip
              key={index}
              block
              content="Crystal Slot Locked · Additional Crystal Slots are unlocked through future progression."
            >
              {socket}
            </GameTooltip>
          ) : (
            <GameTooltip
              key={index}
              block
              content={
                variantId
                  ? (
                      <CrystalTooltipContent
                        variantId={variantId}
                        crystals={crystals}
                      />
                    )
                  : "Empty unlocked socket · choose a Crystal from inventory."
              }
            >
              {socket}
            </GameTooltip>
          );
        })}
      </div>
      <div className="crystal-board-footer">
        <span>
          <i className="crystal-legend-dot active" /> Active socket
        </span>
        <span>
          <i className="crystal-legend-dot locked" /> Future progression
        </span>
        <Button variant="ghost" onClick={() => setBulkCrushOpen(true)}>
          BULK CRUSH
        </Button>
        <Button variant="secondary" onClick={() => openInventory(null)}>
          CRYSTAL INVENTORY
        </Button>
        {bulkCrushOpen && (
          <CrystalBulkCrushDialog
            crystals={crystals}
            onClose={() => setBulkCrushOpen(false)}
          />
        )}
      </div>
    </Card>
  );

  const summary = (
    <Card
      title="CRYSTAL SUMMARY"
      className={`crystal-summary-card crystal-right-rail${selection?.source === "equipped" ? " is-inspecting" : ""}`}
    >
      <div className="crystal-summary-hero">
        <div className="crystal-summary-mark">
          <Gem size={28} />
        </div>
        <div>
          <span>ACTIVE CONTRIBUTION</span>
          <strong>
            {crystals.equippedSlots.filter(Boolean).length} CRYSTALS
          </strong>
          <small>Stats are resolved into your live build.</small>
        </div>
      </div>
      <div className="crystal-stat-summary">
        {Object.entries(stats)
          .filter(
            ([key, value]) => key !== "resistances" && Number(value) !== 0,
          )
          .map(([key, value]) => (
            <div key={key}>
              <span>{STAT_LABELS[key] ?? key}</span>
              <strong>+{formatStat(key, Number(value))}</strong>
            </div>
          ))}
        {Object.keys(stats).length === 0 && (
          <p>No active Crystal contribution yet.</p>
        )}
      </div>
      {selection?.source === "equipped" && (
        <CrystalInspect
          variantId={selection.variantId}
          slotIndex={selection.slotIndex}
          combatActive={combatActive}
          onClose={() => setSelection(null)}
          onUnequip={() => {
            if (unequipCrystal(selection.slotIndex)) setSelection(null);
          }}
          onUpgrade={upgradeCrystal}
        />
      )}
      <div className="crystal-group-footer">
        <span className="eyebrow">GROUP LIMITS</span>
        <div className="crystal-group-summary">
          {(Object.keys(CRYSTAL_GROUP_LABELS) as CrystalGroupId[]).map(
            (group) => (
              <div
                key={group}
                className={`crystal-group-row ${getCrystalGroupUsage({ crystals }, group) > 0 ? "has-value" : ""}`}
              >
                <span>{CRYSTAL_GROUP_LABELS[group]}</span>
                <b>
                  {getCrystalGroupUsage({ crystals }, group)} /{" "}
                  {CRYSTAL_GROUP_CAP}
                </b>
              </div>
            ),
          )}
        </div>
      </div>
    </Card>
  );

  const presets = (
    <Card title="CRYSTAL PRESETS" className="crystal-presets-card">
      <div className="crystal-preset-intro">
        <span>
          Presets are explicit snapshots. Save changes when you are ready.
        </span>
        {hasUnsavedCrystalChanges({ crystals }) && (
          <Status tone="warning">UNSAVED CHANGES</Status>
        )}
      </div>
      <div className="crystal-preset-row">
        {crystals.presets.map((preset, index) => {
          const draft = renameDrafts[preset.id] ?? preset.name;
          return (
            <div
              className={`crystal-preset ${preset.id === crystals.selectedPresetId ? "active" : ""}`}
              key={preset.id}
            >
              <div className="crystal-preset-title">
                <span>PRESET {index + 1}</span>
                <strong>{preset.slots.filter(Boolean).length} SLOTS</strong>
              </div>
              <input
                aria-label={`Rename ${preset.name}`}
                value={draft}
                maxLength={32}
                onChange={(event) =>
                  setRenameDrafts((current) => ({
                    ...current,
                    [preset.id]: event.target.value,
                  }))
                }
              />
              <div className="crystal-preset-actions">
                <Button
                  variant="ghost"
                  onClick={() => {
                    renamePreset(preset.id, draft);
                    savePreset(preset.id);
                  }}
                >
                  <Save size={13} /> SAVE PRESET
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => loadPreset(preset.id)}
                  disabled={combatActive}
                >
                  LOAD
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );

  return (
    <div className="screen-content crystals-screen">
      <div className="screen-header">
        <div>
          <div className="eyebrow">HERO · CRYSTALS</div>
          <h1>Shape Crystal power into a build.</h1>
          <p>
            Equip, refine, and preserve Crystal loadouts without losing sight of
            the live stat contribution.
          </p>
        </div>
        <div className="crystal-header-status">
          <Status tone="success">SYSTEM ONLINE</Status>
          <span>5 starting sockets · 4 paths · 2 per path</span>
        </div>
      </div>
      <ScreenGrid
        screen="crystals"
        panels={[
          { id: "crystals-board", content: board },
          { id: "crystals-summary", content: summary },
          { id: "crystals-presets", content: presets },
        ]}
      />
      {inventoryOpen && (
        <CrystalInventoryModal
          crystals={crystals}
          visibleVariants={visibleVariants}
          filter={filter}
          tierFilter={tierFilter}
          destination={destination}
          selection={selection}
          combatActive={combatActive}
          onFilter={setFilter}
          onTierFilter={setTierFilter}
          onSelect={(variantId) =>
            setSelection({ source: "inventory", variantId })
          }
          onEquip={handleEquip}
          onClose={() => {
            setInventoryOpen(false);
            setDestination(null);
          }}
          onUpgrade={upgradeCrystal}
          onCrush={crushCrystal}
          onNavigateToInventory={() => navigate("inventory")}
        />
      )}{" "}
    </div>
  );
}

function CrystalInventoryModal({
  crystals,
  visibleVariants,
  filter,
  tierFilter,
  destination,
  selection,
  combatActive,
  onFilter,
  onTierFilter,
  onSelect,
  onEquip,
  onClose,
  onUpgrade,
  onCrush,
  onNavigateToInventory,
}: {
  crystals: GameState["crystals"];
  visibleVariants: CrystalVariantId[];
  filter: InventoryFilter;
  tierFilter: "all" | 1 | 2 | 3 | 4 | 5;
  destination: number | null;
  selection: CrystalSelection | null;
  combatActive: boolean;
  onFilter: (filter: InventoryFilter) => void;
  onTierFilter: (filter: "all" | 1 | 2 | 3 | 4 | 5) => void;
  onSelect: (variant: CrystalVariantId) => void;
  onEquip: (variant: CrystalVariantId) => void;
  onClose: () => void;
  onUpgrade: (variant: CrystalVariantId, slot?: number) => boolean;
  onCrush: (variant: CrystalVariantId, quantity: number) => boolean;
  onNavigateToInventory: () => void;
}) {
  const { openContextMenu } = useGameContextMenu();
  const [inspect, setInspect] = useState<CrystalVariantId | null>(
    selection?.source === "inventory" ? selection.variantId : null,
  );
  const selected = inspect ? getCrystalFamily(inspect) : null;
  const selectedTier = inspect ? getCrystalTier(inspect) : null;
  const [crushTarget, setCrushTarget] = useState<CrystalVariantId | null>(null);
  return (
    <div
      className="crystal-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="crystal-inventory-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Crystal Inventory"
      >
        <div className="crystal-modal-head">
          <div>
            <span className="eyebrow">RESONANCE CACHE</span>
            <h2>CRYSTAL INVENTORY</h2>
            <p>
              Owned{" "}
              {visibleVariants
                .reduce(
                  (sum, variantId) =>
                    sum + getCrystalOwnedCount({ crystals }, variantId),
                  0,
                )
                .toLocaleString()}{" "}
              copies · {crystals.dust.toLocaleString()} Dust
            </p>
          </div>
          <Button
            variant="ghost"
            icon
            ariaLabel="Close Crystal Inventory"
            onClick={onClose}
          >
            <X size={17} />
          </Button>
        </div>
        <div className="crystal-filter-row">
          <div className="crystal-filter-set">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => onFilter("all")}
            >
              ALL
            </button>
            {(Object.keys(CRYSTAL_GROUP_LABELS) as CrystalGroupId[]).map(
              (group) => (
                <button
                  key={group}
                  className={filter === group ? "active" : ""}
                  onClick={() => onFilter(group)}
                >
                  {CRYSTAL_GROUP_LABELS[group].toUpperCase()}
                </button>
              ),
            )}
          </div>
          <div className="crystal-filter-set tiers">
            <button
              className={tierFilter === "all" ? "active" : ""}
              onClick={() => onTierFilter("all")}
            >
              ALL TIERS
            </button>
            {([1, 2, 3, 4, 5] as const).map((tier) => (
              <button
                key={tier}
                className={tierFilter === tier ? "active" : ""}
                onClick={() => onTierFilter(tier)}
              >
                T{tier}
              </button>
            ))}
          </div>
        </div>
        <div className="crystal-inventory-layout">
          <div className="crystal-tile-grid">
            {visibleVariants.length ? (
              visibleVariants.map((variantId) => {
                const family = getCrystalFamily(variantId);
                const equipped = getCrystalEquippedCount(
                  { crystals },
                  variantId,
                );
                const tile = (
                  <button
                    type="button"
                    className={`crystal-tile ${inspect === variantId ? "selected" : ""}`}
                    style={{ "--crystal-color": family.color } as CSSProperties}
                    onClick={() => {
                      setInspect(variantId);
                      onSelect(variantId);
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setInspect(variantId);
                      onSelect(variantId);
                      openContextMenu({
                        x: event.clientX,
                        y: event.clientY,
                        anchor: event.currentTarget,
                        header: {
                          title: getCrystalVariantName(variantId),
                          meta: `${CRYSTAL_GROUP_LABELS[family.group]} · AVAILABLE ${getCrystalAvailableCount({ crystals }, variantId)}`,
                        },
                        sections: [
                          {
                            id: "crystal",
                            actions: [
                              {
                                id: "inspect",
                                label: "Inspect Crystal",
                                onSelect: () => onSelect(variantId),
                              },
                              {
                                id: "equip",
                                label: "Equip",
                                disabled:
                                  combatActive ||
                                  getCrystalAvailableCount(
                                    { crystals },
                                    variantId,
                                  ) < 1,
                                disabledReason: combatActive
                                  ? "Crystal loadout changes are disabled during active combat."
                                  : "No unequipped copy is available.",
                                onSelect: () => onEquip(variantId),
                              },
                              {
                                id: "upgrade",
                                label: getNextCrystalVariant(variantId)
                                  ? "Upgrade..."
                                  : "MAX TIER",
                                disabled:
                                  !getNextCrystalVariant(variantId) ||
                                  getCrystalAvailableCount(
                                    { crystals },
                                    variantId,
                                  ) < 1,
                                disabledReason: !getNextCrystalVariant(variantId)
                                  ? "This Crystal is already at the maximum tier."
                                  : "No unequipped copy is available.",
                                onSelect: () => onSelect(variantId),
                              },
                              {
                                id: "crush",
                                label: "Crush...",
                                disabled:
                                  getCrystalAvailableCount(
                                    { crystals },
                                    variantId,
                                  ) < 1,
                                onSelect: () => setCrushTarget(variantId),
                              },
                            ],
                          },
                        ],
                      });
                    }}
                  >
                    <span className="crystal-tile-icon">{family.icon}</span>
                    <strong>{family.name}</strong>
                    <small>
                      T{getCrystalTier(variantId)} ·{" "}
                      {CRYSTAL_GROUP_LABELS[family.group]}
                    </small>
                    <span className="crystal-tile-count">
                      OWNED {getCrystalOwnedCount({ crystals }, variantId)} ·
                      AVAILABLE{" "}
                      {Math.max(
                        0,
                        getCrystalAvailableCount({ crystals }, variantId),
                      )}
                      {equipped > 0 ? ` · EQUIPPED ${equipped}` : ""}
                    </span>
                  </button>
                );
                return (
                  <GameTooltip
                    key={variantId}
                    block
                    wide
                    content={
                      <CrystalTooltipContent
                        variantId={variantId}
                        crystals={crystals}
                      />
                    }
                  >
                    {tile}
                  </GameTooltip>
                );
              })
            ) : (
              <div className="crystal-empty">
                No Crystals match this filter.
              </div>
            )}
          </div>
          <aside className="crystal-inventory-inspector">
            {inspect && selected ? (
              <>
                <div
                  className="crystal-inspector-glyph"
                  style={{ "--crystal-color": selected.color } as CSSProperties}
                >
                  {selected.icon}
                </div>
                <span className="eyebrow">
                  T{selectedTier} · {CRYSTAL_GROUP_LABELS[selected.group]}
                </span>
                <h3>{getCrystalVariantName(inspect)}</h3>
                <p>{selected.description}</p>
                <div className="crystal-inspector-stat">
                  {Object.entries(getCrystalVariantStats(inspect)).map(
                    ([key, value]) => (
                      <div key={key}>
                        <span>{STAT_LABELS[key] ?? key}</span>
                        <strong>+{formatStat(key, Number(value))}</strong>
                      </div>
                    ),
                  )}
                </div>
                {getNextCrystalVariant(inspect) && (
                  <div className="crystal-upgrade-preview">
                    <span className="eyebrow">NEXT TIER</span>
                    <strong>
                      {getCrystalVariantName(getNextCrystalVariant(inspect)!)}
                    </strong>
                    <div className="crystal-upgrade-stat-preview">
                      {Object.entries(
                        getCrystalVariantStats(getNextCrystalVariant(inspect)!),
                      ).map(([key, value]) => (
                        <span key={key}>
                          {STAT_LABELS[key] ?? key}: +{formatStat(key, Number(value))}
                        </span>
                      ))}
                    </div>
                    <small>
                      COST ·{" "}
                      {CRYSTAL_UPGRADE_COSTS[
                        getCrystalTier(inspect)
                      ].dust.toLocaleString()}{" "}
                      Dust
                      {Object.entries(
                        CRYSTAL_UPGRADE_COSTS[getCrystalTier(inspect)]
                          .materials,
                      ).map(
                        ([itemId, quantity]) =>
                          ` · ${quantity} ${ITEMS[itemId as keyof typeof ITEMS]?.name ?? itemId}`,
                      )}
                    </small>
                  </div>
                )}
                <div className="crystal-inspector-actions">
                  <Button
                    onClick={() => onEquip(inspect)}
                    disabled={
                      combatActive ||
                      (destination === null &&
                        getCrystalAvailableCount({ crystals }, inspect) < 1)
                    }
                    tooltip={
                      combatActive
                        ? "Changing active Crystal stats is disabled during combat."
                        : destination === null
                          ? "Equip into the first empty unlocked socket."
                          : `Equip into socket ${destination + 1}.`
                    }
                  >
                    EQUIP
                  </Button>
                  {getNextCrystalVariant(inspect) ? (
                    <Button
                      variant="secondary"
                      onClick={() => onUpgrade(inspect)}
                      disabled={
                        getCrystalAvailableCount({ crystals }, inspect) < 1
                      }
                    >
                      UPGRADE
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled>
                      MAX TIER
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    onClick={() => setCrushTarget(inspect)}
                    disabled={
                      getCrystalAvailableCount({ crystals }, inspect) < 1
                    }
                  >
                    <Trash2 size={13} /> CRUSH AVAILABLE
                  </Button>
                </div>
                <Button variant="ghost" onClick={onNavigateToInventory}>
                  OPEN NORMAL INVENTORY
                </Button>
              </>
            ) : (
              <div className="crystal-inspector-empty">
                <Gem size={24} />
                <strong>SELECT A CRYSTAL</strong>
                <span>
                  Inspect a tile to see its stats and available actions.
                </span>
              </div>
            )}
          </aside>
        </div>
      </section>
      {crushTarget && (
        <CrystalCrushQuantityDialog
          variantId={crushTarget}
          available={getCrystalAvailableCount({ crystals }, crushTarget)}
          onCrush={(quantity) => onCrush(crushTarget, quantity)}
          onClose={() => setCrushTarget(null)}
        />
      )}
    </div>
  );
}

function CrystalInspect({
  variantId,
  slotIndex,
  combatActive,
  onClose,
  onUnequip,
  onUpgrade,
}: {
  variantId: CrystalVariantId;
  slotIndex: number;
  combatActive: boolean;
  onClose: () => void;
  onUnequip: () => void;
  onUpgrade: (variantId: CrystalVariantId, slot?: number) => boolean;
}) {
  const family = getCrystalFamily(variantId);
  const next = getNextCrystalVariant(variantId);
  return (
    <div
      className="crystal-selected-inspector"
      role="dialog"
      aria-label="Crystal actions"
    >
      <div className="crystal-selected-inspector-head">
        <span style={{ color: family.color }}>{family.icon}</span>
        <div>
          <strong>{getCrystalVariantName(variantId)}</strong>
          <small>Equipped · Slot {slotIndex + 1}</small>
        </div>
        <Button
          variant="ghost"
          icon
          ariaLabel="Close Crystal details"
          onClick={onClose}
        >
          <X size={15} />
        </Button>
      </div>
      <p>{family.description}</p>
      <div className="crystal-inspector-stat">
        {Object.entries(getCrystalVariantStats(variantId)).map(
          ([key, value]) => (
            <div key={key}>
              <span>{STAT_LABELS[key] ?? key}</span>
              <strong>+{formatStat(key, Number(value))}</strong>
            </div>
          ),
        )}
      </div>
      {next && (
        <div className="crystal-upgrade-preview">
          <span className="eyebrow">NEXT TIER</span>
          <strong>{getCrystalVariantName(next)}</strong>
          <div className="crystal-upgrade-stat-preview">
            {Object.entries(getCrystalVariantStats(next)).map(([key, value]) => (
              <span key={key}>
                {STAT_LABELS[key] ?? key}: +{formatStat(key, Number(value))}
              </span>
            ))}
          </div>
          <small>
            COST · {CRYSTAL_UPGRADE_COSTS[getCrystalTier(variantId)].dust.toLocaleString()} Dust
            {Object.entries(CRYSTAL_UPGRADE_COSTS[getCrystalTier(variantId)].materials).map(
              ([itemId, quantity]) => ` · ${quantity} ${ITEMS[itemId as keyof typeof ITEMS]?.name ?? itemId}`,
            )}
          </small>
        </div>
      )}
      {next && (
        <Button
          variant="secondary"
          disabled={combatActive}
          onClick={() => {
            if (onUpgrade(variantId, slotIndex)) onClose();
          }}
        >
          UPGRADE
        </Button>
      )}
      {!next && (
        <Button variant="secondary" disabled>
          MAX TIER
        </Button>
      )}
      <Button variant="ghost" disabled={combatActive} onClick={onUnequip}>
        UNEQUIP
      </Button>
    </div>
  );
}
