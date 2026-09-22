import { useState } from 'react'
import { Button, Card, Status } from '../../components/ui'
import { CRYSTAL_CACHE_ITEM_ID, CRYSTAL_VARIANT_IDS, getCrystalVariantName } from '../../game/content/crystals/crystals'
import { isCrystalSystemUnlocked } from '../../game/systems/crystals/crystalRuntime'
import type { CrystalVariantId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperCrystals() {
  const state = useGameStore()
  const unlocked = isCrystalSystemUnlocked(state)
  const [variantId, setVariantId] = useState<CrystalVariantId>('force-t1')
  const [quantity, setQuantity] = useState(1)
  const [dustAmount, setDustAmount] = useState(1000)
  const cacheCount = state.inventory[CRYSTAL_CACHE_ITEM_ID] ?? 0
  const ownedCopies = Object.values(state.crystals.owned).reduce((sum, value) => sum + value, 0)
  const equippedCopies = state.crystals.equippedSlots.filter(Boolean).length
  const meridianKills = state.progress.bossKillsByBoss['meridian-splitter'] ?? 0

  return <div className="developer-tab-grid">
    <Card title="CRYSTAL SYSTEM · STATUS">
      <div className="developer-summary-grid">
        <Summary label="System" value={<Status tone={unlocked ? 'success' : 'locked'}>{unlocked ? 'UNLOCKED' : 'LOCKED'}</Status>} />
        <Summary label="Meridian kills" value={meridianKills} />
        <Summary label="Crystal Dust" value={state.crystals.dust.toLocaleString()} />
        <Summary label="Owned copies" value={ownedCopies.toLocaleString()} />
        <Summary label="Equipped" value={`${equippedCopies} / ${state.crystals.unlockedSlots}`} />
        <Summary label="Slots" value={`${state.crystals.unlockedSlots} / 15`} />
        <Summary label="T1 caches" value={cacheCount.toLocaleString()} />
        <Summary label="Cache RNG" value={`0x${state.crystals.rngState.toString(16).padStart(8, '0').toUpperCase()}`} />
      </div>
      <div className="developer-button-grid">
        <Button
          variant="secondary"
          tooltip="Set Meridian evidence to at least one kill so the normal derived Crystal unlock rule becomes true. This emits no first-clear notification and grants no first-clear rewards."
          onClick={state.debugUnlockCrystals}
        >
          UNLOCK CRYSTALS
        </Button>
        <Button
          disabled={!unlocked}
          tooltip={unlocked ? 'Open the real Crystal screen using the normal screen navigation.' : 'Crystal Screen is unavailable until the normal Meridian evidence rule is satisfied.'}
          onClick={() => state.setScreen('crystals')}
        >
          OPEN CRYSTAL SCREEN
        </Button>
      </div>
    </Card>

    <Card title="CACHE FIXTURES">
      <p className="muted">These controls create normal Tier 1 cache inventory. Opening still uses the production cache resolver and 80/20 result rule.</p>
      <div className="developer-button-grid">
        <Button variant="ghost" onClick={() => state.addItem(CRYSTAL_CACHE_ITEM_ID, 1)}>+1 CACHE</Button>
        <Button variant="ghost" onClick={() => state.addItem(CRYSTAL_CACHE_ITEM_ID, 10)}>+10 CACHES</Button>
        <Button variant="ghost" onClick={() => state.addItem(CRYSTAL_CACHE_ITEM_ID, 100)}>+100 CACHES</Button>
      </div>
    </Card>

    <Card title="DUST FIXTURES">
      <div className="developer-form-grid">
        <NumberField label="Dust amount" value={dustAmount} min={0} onChange={(value) => setDustAmount(Math.max(0, Math.floor(value)))} />
        <Button variant="secondary" onClick={() => state.debugAddCrystalDust(dustAmount)}>ADD DUST</Button>
        <Button variant="ghost" onClick={() => state.debugSetCrystalDust(dustAmount)}>SET DUST</Button>
        <Button variant="ghost" onClick={() => state.debugAddCrystalDust(1000)}>+1,000 DUST</Button>
        <Button variant="danger" onClick={state.debugClearCrystalDust}>CLEAR DUST</Button>
      </div>
    </Card>

    <Card title="OWNERSHIP FIXTURES">
      <div className="developer-form-grid">
        <label className="developer-select-field">CRYSTAL VARIANT<select aria-label="Developer Crystal variant" value={variantId} onChange={(event) => setVariantId(event.target.value as CrystalVariantId)}>{CRYSTAL_VARIANT_IDS.map((id) => <option value={id} key={id}>{getCrystalVariantName(id)}</option>)}</select></label>
        <NumberField label="Quantity" value={quantity} min={1} onChange={(value) => setQuantity(Math.max(1, Math.floor(value)))} />
        <Button variant="secondary" onClick={() => state.debugGrantCrystal(variantId, quantity)}>GRANT</Button>
        <Button variant="ghost" onClick={() => state.debugRemoveCrystal(variantId, quantity)}>REMOVE AVAILABLE</Button>
      </div>
      <div className="developer-button-grid">
        <Button variant="ghost" onClick={() => state.debugGrantAllT1Crystals(quantity)}>GRANT ALL T1</Button>
      </div>
    </Card>

    <Card title="SLOT / RNG FIXTURES">
      <div className="developer-form-grid">
        <NumberField label="Unlocked slots" value={state.crystals.unlockedSlots} min={5} max={15} onChange={state.debugSetCrystalUnlockedSlots} />
        <Button variant="ghost" onClick={state.debugResetCrystalRng}>RESET CACHE RNG</Button>
        <Button variant="danger" tooltip="Reset Dust, ownership, equipped slots, presets, and Crystal RNG. Meridian evidence and the derived unlock remain unchanged." onClick={state.debugResetCrystals}>RESET CRYSTAL STATE</Button>
        <Button variant="danger" onClick={state.debugClearCrystalCaches}>CLEAR T1 CACHES</Button>
      </div>
      <p className="muted">Lowering slots removes equipped copies beyond the new limit and immediately recalculates derived player stats. The minimum is five and the maximum is fifteen.</p>
    </Card>
  </div>
}
