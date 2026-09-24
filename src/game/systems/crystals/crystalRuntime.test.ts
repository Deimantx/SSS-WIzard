import { describe, expect, it } from "vitest";
import {
  CRYSTAL_FAMILY_ORDER,
  CRYSTAL_STARTING_UNLOCKED_SLOTS,
  CRYSTAL_VARIANT_IDS,
  getCrystalVariantStats,
} from "../../content/crystals/crystals";
import { MONSTER_IDS } from "../../content/monsters";
import { resolveEnemyPowerRating } from "../../presentation/combat/enemyPowerRating";
import { createInitialState } from "../../../store/initialState";
import {
  bulkCrushCrystals,
  crushCrystals,
  equipCrystal,
  getCrystalAvailableCount,
  normalizeCrystalState,
  openCrystalCaches,
  isCrystalCacheEligiblePower,
  resolveCrystalCacheDrop,
  renameCrystalPreset,
  saveCrystalPreset,
  loadCrystalPreset,
  unequipCrystal,
  upgradeCrystal,
} from "./crystalRuntime";
import { getEquippedCrystalStats } from "./crystalStats";
import { getEquipmentStats } from "../../core/equipment/equipmentStats";
import { migrateSave } from "../../../persistence/migrations";

describe("Crystal System V1", () => {
  it("normalizes malformed state without inventing copies or locked-slot equipment", () => {
    const normalized = normalizeCrystalState({
      dust: -4,
      owned: { "force-t1": 1, "unknown-t1": 99 },
      unlockedSlots: 1,
      equippedSlots: ["force-t1", "force-t1", "ruin-t1"],
      presets: [],
      rngState: Number.NaN,
    });
    expect(normalized.dust).toBe(0);
    expect(normalized.owned).toEqual({ "force-t1": 1 });
    expect(normalized.equippedSlots.filter(Boolean)).toEqual(["force-t1"]);
    expect(normalized.equippedSlots).toHaveLength(15);
    expect(normalized.unlockedSlots).toBe(CRYSTAL_STARTING_UNLOCKED_SLOTS);
    expect(normalized.presets).toHaveLength(3);
  });

  it.each([2995, 2999])("keeps a power rating of %s below the cache threshold", (power) => {
    expect(isCrystalCacheEligiblePower(power)).toBe(false);
  });

  it("accepts exactly 3000 power for cache eligibility", () => {
    expect(isCrystalCacheEligiblePower(3000)).toBe(true);
    expect(isCrystalCacheEligiblePower(Number.NaN)).toBe(false);
  });

  it("opens caches atomically through the dedicated deterministic RNG", () => {
    const state = createInitialState();
    state.progress.bossKillsByBoss["meridian-splitter"] = 1;
    state.inventory["tier-1-crystal-cache"] = 10;
    const result = openCrystalCaches(state, 10);
    const crystalCount = Object.values(result.crystals).reduce(
      (sum, quantity) => sum + (quantity ?? 0),
      0,
    );
    expect(result).toMatchObject({ ok: true, opened: 10 });
    expect(result.dust / 25 + crystalCount).toBe(10);
    expect(state.inventory["tier-1-crystal-cache"]).toBe(0);
    expect(
      Object.keys(result.crystals).every((id) =>
        CRYSTAL_VARIANT_IDS.includes(id as never),
      ),
    ).toBe(true);
  });

  it("uses the exact deterministic 80/20 boundary and only grants T1 family variants", () => {
    const state = createInitialState();
    state.progress.bossKillsByBoss["meridian-splitter"] = 1;
    state.inventory["tier-1-crystal-cache"] = 2;
    const rolls = [0.7999, 0.8, 0];
    const result = openCrystalCaches(state, 2, () => rolls.shift() ?? 0);

    expect(result).toMatchObject({ ok: true, opened: 2, dust: 25 });
    expect(result.crystals).toEqual({ "force-t1": 1 });
    expect(Object.keys(result.crystals).every((id) => id.endsWith("-t1"))).toBe(true);
  });

  it("enforces two equipped crystals per group and resolves live stats", () => {
    const state = createInitialState();
    state.crystals.owned = { "force-t1": 1, "ruin-t1": 1, "torment-t1": 1 };
    expect(equipCrystal(state, "force-t1").ok).toBe(true);
    expect(equipCrystal(state, "ruin-t1").ok).toBe(true);
    expect(equipCrystal(state, "torment-t1").ok).toBe(false);
    expect(getEquippedCrystalStats(state)).toMatchObject({
      spellPower: 12,
      critDamage: 0.08,
    });
    expect(getEquipmentStats(state)).toMatchObject({
      spellPower: 12,
      critDamage: 0.08,
    });
    expect(getCrystalAvailableCount(state, "force-t1")).toBe(0);
  });

  it("feeds every V1 family stat through the canonical equipment resolver", () => {
    for (const familyId of CRYSTAL_FAMILY_ORDER) {
      const state = createInitialState();
      const variantId = `${familyId}-t1` as (typeof CRYSTAL_VARIANT_IDS)[number];
      state.crystals.owned[variantId] = 1;
      state.crystals.equippedSlots[0] = variantId;

      expect(getEquipmentStats(state)).toMatchObject(
        getCrystalVariantStats(variantId),
      );
    }
  });

  it("rejects removing a Focus-efficiency Crystal when reservations would become illegal", () => {
    const state = createInitialState();
    state.player.baseMaxFocus = 69;
    state.progress.spellRanks = { fireball: 7 };
    state.activities.autoCast.fireball = true;
    state.crystals.owned["discipline-t1"] = 1;

    expect(equipCrystal(state, "discipline-t1").ok).toBe(true);
    expect(unequipCrystal(state, 0)).toMatchObject({
      ok: false,
      reason: "Not enough Focus capacity for the current reservations.",
    });
    expect(state.crystals.equippedSlots[0]).toBe("discipline-t1");
  });

  it("protects equipped copies from crushing and upgrades deterministically", () => {
    const state = createInitialState();
    state.crystals.owned["force-t1"] = 12;
    expect(equipCrystal(state, "force-t1").ok).toBe(true);
    expect(equipCrystal(state, "force-t1").ok).toBe(true);
    const crushed = crushCrystals(state, "force-t1", 99);
    expect(crushed).toMatchObject({ ok: true, quantity: 10, dust: 200 });
    expect(state.crystals.owned["force-t1"]).toBe(2);
    state.crystals.equippedSlots = [
      null,
      null,
      ...state.crystals.equippedSlots.slice(2),
    ];
    state.crystals.dust = 100;
    state.inventory["life-essence"] = 5;
    const upgraded = upgradeCrystal(state, "force-t1");
    expect(upgraded).toMatchObject({ ok: true, nextVariant: "force-t2" });
    expect(state.crystals.owned["force-t2"]).toBe(1);
    expect(state.crystals.dust).toBe(0);
    expect(getCrystalVariantStats("force-t2")).toMatchObject({
      spellPower: 18,
    });
  });

  it("rejects an upgrade when its material is protected and leaves state unchanged", () => {
    const state = createInitialState();
    state.crystals.owned["force-t1"] = 1;
    state.crystals.dust = 100;
    state.inventory["life-essence"] = 5;
    state.protectedItems["life-essence"] = true;
    const before = structuredClone({ crystals: state.crystals, inventory: state.inventory });

    expect(upgradeCrystal(state, "force-t1")).toMatchObject({ ok: false });
    expect({ crystals: state.crystals, inventory: state.inventory }).toEqual(before);
  });

  it("upgrades the exact equipped duplicate slot instead of the first matching copy", () => {
    const state = createInitialState();
    state.crystals.owned["force-t1"] = 2;
    expect(equipCrystal(state, "force-t1", 0).ok).toBe(true);
    expect(equipCrystal(state, "force-t1", 1).ok).toBe(true);
    state.crystals.dust = 100;
    state.inventory["life-essence"] = 5;

    expect(upgradeCrystal(state, "force-t1", 1)).toMatchObject({ ok: true, nextVariant: "force-t2" });
    expect(state.crystals.equippedSlots[0]).toBe("force-t1");
    expect(state.crystals.equippedSlots[1]).toBe("force-t2");
  });

  it("only drops caches after unlock and the current power threshold", () => {
    const state = createInitialState();
    expect(
      resolveCrystalCacheDrop(state, "meridian-splitter", 5, () => 0),
    ).toBe(false);
    state.progress.bossKillsByBoss["meridian-splitter"] = 1;
    const dropped = resolveCrystalCacheDrop(
      state,
      "meridian-splitter",
      5,
      () => 0,
    );
    expect(dropped).toBe(true);
    expect(state.inventory["tier-1-crystal-cache"]).toBe(1);
  });

  it("can find one monster below the threshold at WT1 and above it at a higher tier", () => {
    const candidate = MONSTER_IDS.find((monsterId) => {
      const wt1 = resolveEnemyPowerRating(monsterId, 1);
      const higherTier = resolveEnemyPowerRating(monsterId, 5);
      return wt1 < 3000 && higherTier >= 3000;
    });
    expect(candidate).toBeDefined();
    if (!candidate) return;

    const state = createInitialState();
    state.progress.bossKillsByBoss["meridian-splitter"] = 1;
    expect(resolveCrystalCacheDrop(state, candidate, 1, () => 0)).toBe(false);
    expect(resolveCrystalCacheDrop(state, candidate, 5, () => 0)).toBe(true);
    expect(state.inventory["tier-1-crystal-cache"]).toBe(1);
  });

  it("migrates a v46 save to an empty, valid current Crystal state without retroactive cache grants", () => {
    const migrated = migrateSave({
      saveVersion: 46,
      progress: { bossKillsByBoss: { "meridian-splitter": 1 } },
      inventory: { "tier-1-crystal-cache": 0 },
    });
    expect(migrated.saveVersion).toBe(48);
    expect(migrated.crystals.equippedSlots).toHaveLength(15);
    expect(migrated.crystals.unlockedSlots).toBe(5);
    expect(migrated.inventory["tier-1-crystal-cache"]).toBe(0);
  });

  it("bulk-crushes selected unequipped variants atomically and keeps preset snapshots explicit", () => {
    const state = createInitialState();
    state.crystals.owned = { "force-t1": 4, "vitality-t2": 3 };
    expect(equipCrystal(state, "force-t1").ok).toBe(true);
    expect(
      renameCrystalPreset(state, "crystal-preset-1", "  Boss Tank  "),
    ).toBe(true);
    expect(saveCrystalPreset(state, "crystal-preset-1")).toBe(true);
    expect(state.crystals.presets[0].name).toBe("Boss Tank");
    expect(
      bulkCrushCrystals(state, { "force-t1": 10, "vitality-t2": 2 }),
    ).toMatchObject({ ok: true, quantity: 5, dust: 180 });
    expect(state.crystals.owned).toEqual({ "force-t1": 1, "vitality-t2": 1 });
    expect(loadCrystalPreset(state, "crystal-preset-1")).toMatchObject({
      ok: true,
    });
    state.combat.active = true;
    expect(loadCrystalPreset(state, "crystal-preset-1")).toMatchObject({
      ok: false,
    });
  });
});
