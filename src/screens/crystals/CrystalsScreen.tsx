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
  type CrystalCacheOpenResult,
} from "../../game/systems/crystals/crystalRuntime";
import {
  CRYSTAL_CRUSH_DUST,
  CRYSTAL_FAMILY_ORDER,
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
  setNavigationIntent,
  useNavigationIntent,
} from "../../ui/navigation/navigationIntent";

type InventoryFilter = "all" | CrystalGroupId;

const STAT_LABELS: Record<string, string> = {
  spellPower: "Spell Power",
  maxHealth: "Max Health",
  healthRegen: "Health Regen",
  maxMana: "Max Mana",
  manaRegen: "Mana Regen",
  maxFocus: "Max Focus",
  defense: "Defense",
  critChance: "Crit Chance",
  critDamage: "Crit Damage",
  cooldownRecoveryPct: "Cooldown Recovery",
  barrierPowerPct: "Barrier Power",
  damageOverTimePct: "Damage over Time",
  statusDurationPct: "Status Duration",
  manaCostReductionPct: "Mana Cost Reduction",
  focusEfficiencyPct: "Focus Efficiency",
};
const PERCENT_STATS = new Set([
  "critChance",
  "critDamage",
  "cooldownRecoveryPct",
  "barrierPowerPct",
  "damageOverTimePct",
  "statusDurationPct",
  "manaCostReductionPct",
  "focusEfficiencyPct",
]);

const formatStat = (key: string, value: number) =>
  PERCENT_STATS.has(key)
    ? `${value * 100 >= 10 ? (value * 100).toFixed(0) : (value * 100).toFixed(1)}%`
    : key === "healthRegen" || key === "manaRegen"
      ? `${value.toFixed(1)}/s`
      : `${Math.round(value * 100) / 100}`;

const crystalTooltip = (
  variantId: CrystalVariantId,
  crystals: GameState["crystals"],
) => {
  const family = getCrystalFamily(variantId);
  const owned = getCrystalOwnedCount({ crystals }, variantId);
  const equipped = getCrystalEquippedCount({ crystals }, variantId);
  return (
    <>
      <strong>{getCrystalVariantName(variantId)}</strong>
      <p>
        {CRYSTAL_GROUP_LABELS[family.group]} · TIER {getCrystalTier(variantId)}
      </p>
      <p>
        {Object.entries(getCrystalVariantStats(variantId))
          .map(
            ([key, value]) =>
              `${STAT_LABELS[key] ?? key} +${formatStat(key, Number(value))}`,
          )
          .join(" · ")}
      </p>
      <p>
        Group Limit: {CRYSTAL_GROUP_CAP} · Owned: {owned} · Equipped: {equipped} ·
        Available: {Math.max(0, owned - equipped)}
      </p>
    </>
  );
};

export function CrystalsScreen() {
  const crystals = useGameStore((state) => state.crystals);
  const player = useGameStore((state) => state.player);
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
  const [selectedVariant, setSelectedVariant] =
    useState<CrystalVariantId | null>(null);
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
      setSelectedVariant(variantId);
      setDestination(null);
      setInventoryOpen(false);
    }
  };
  const selected = selectedVariant ? getCrystalFamily(selectedVariant) : null;
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
              onSelect: () => setSelectedVariant(variantId),
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
                setSelectedVariant(null);
              },
            },
            {
              id: "upgrade",
              label: "Upgrade",
              disabled: combatActive,
              disabledReason: combatActive
                ? "Equipped Crystal upgrades are disabled during active combat."
                : undefined,
              onSelect: () => upgradeCrystal(variantId, slot),
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
                variantId ? setSelectedVariant(variantId) : openInventory(index)
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
                <LockKeyhole size={19} />
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
                  ? crystalTooltip(variantId, crystals)
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
    <Card title="CRYSTAL SUMMARY" className="crystal-summary-card">
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
      <div className="crystal-resource-note">
        <span>MAX FOCUS</span>
        <strong>{Math.floor(player.maxFocus)}</strong>
        <small>Focus legality is checked before every loadout change.</small>
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
          <h1>Turn resonance into a build.</h1>
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
          selectedVariant={selectedVariant}
          combatActive={combatActive}
          onFilter={setFilter}
          onTierFilter={setTierFilter}
          onSelect={setSelectedVariant}
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
      {selectedVariant && !inventoryOpen && (
        <CrystalInspect
          variantId={selectedVariant}
          crystals={crystals}
          combatActive={combatActive}
          onClose={() => setSelectedVariant(null)}
          onUnequip={() => {
            const slot = crystals.equippedSlots.findIndex(
              (value) => value === selectedVariant,
            );
            if (slot >= 0 && unequipCrystal(slot)) setSelectedVariant(null);
          }}
          onUpgrade={upgradeCrystal}
          onCrush={crushCrystal}
        />
      )}
    </div>
  );
}

function CrystalInventoryModal({
  crystals,
  visibleVariants,
  filter,
  tierFilter,
  destination,
  selectedVariant,
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
  selectedVariant: CrystalVariantId | null;
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
    selectedVariant,
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
                                label: "Upgrade",
                                disabled:
                                  getCrystalAvailableCount(
                                    { crystals },
                                    variantId,
                                  ) < 1,
                                disabledReason:
                                  "No unequipped copy is available.",
                                onSelect: () => onUpgrade(variantId),
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
                    content={crystalTooltip(variantId, crystals)}
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
                  <Button
                    variant="secondary"
                    onClick={() => onUpgrade(inspect)}
                    disabled={
                      getCrystalAvailableCount({ crystals }, inspect) < 1
                    }
                  >
                    UPGRADE
                  </Button>
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
  crystals,
  combatActive,
  onClose,
  onUnequip,
  onUpgrade,
  onCrush,
}: {
  variantId: CrystalVariantId;
  crystals: GameState["crystals"];
  combatActive: boolean;
  onClose: () => void;
  onUnequip: () => void;
  onUpgrade: (variantId: CrystalVariantId, slot?: number) => boolean;
  onCrush: (variantId: CrystalVariantId, quantity: number) => boolean;
}) {
  const family = getCrystalFamily(variantId);
  const slot = crystals.equippedSlots.findIndex((value) => value === variantId);
  const next = getNextCrystalVariant(variantId);
  return (
    <div
      className="crystal-inspect-popover"
      role="dialog"
      aria-label="Crystal actions"
    >
      <div className="crystal-inspect-popover-head">
        <span style={{ color: family.color }}>{family.icon}</span>
        <div>
          <strong>{getCrystalVariantName(variantId)}</strong>
          <small>
            {slot >= 0 ? `Equipped · Slot ${slot + 1}` : "Inventory copy"}
          </small>
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
        <Button
          variant="secondary"
          disabled={combatActive && slot >= 0}
          onClick={() => {
            if (onUpgrade(variantId, slot >= 0 ? slot : undefined)) onClose();
          }}
        >
          UPGRADE
        </Button>
      )}
      {slot >= 0 ? (
        <Button variant="ghost" disabled={combatActive} onClick={onUnequip}>
          UNEQUIP
        </Button>
      ) : (
        <Button
          variant="danger"
          disabled={getCrystalAvailableCount({ crystals }, variantId) < 1}
          onClick={() => {
            if (
              window.confirm(
                `Crush 1 ${getCrystalVariantName(variantId)} for ${CRYSTAL_CRUSH_DUST[getCrystalTier(variantId)]} Dust?`,
              )
            ) {
              if (onCrush(variantId, 1)) onClose();
            }
          }}
        >
          CRUSH 1
        </Button>
      )}
    </div>
  );
}

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
                      <>
                        <strong>
                          {getCrystalVariantName(variantId as CrystalVariantId)}
                        </strong>
                        <p>Tier 1 Crystal reward from the cache.</p>
                      </>
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
