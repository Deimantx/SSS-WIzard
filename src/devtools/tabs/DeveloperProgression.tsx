import { useState } from 'react'
import { Button, Card, Status } from '../../components/ui'
import { DUNGEONS, DUNGEON_ORDER, isDungeonCompleted, isDungeonUnlocked, isTutorialCompleted } from '../../game/content/dungeons/dungeons'
import { ITEMS } from '../../game/content/items/items'
import { MONSTER_IDS, isBossMonster, MONSTERS } from '../../game/content/monsters'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { getSpellRank } from '../../game/systems/spells'
import { getSchoolProgressInfo } from '../../game/systems/schools'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'
import { CRYSTAL_VARIANT_IDS, getCrystalVariantName } from '../../game/content/crystals/crystals'
import type { CrystalVariantId } from '../../game/types'

const schoolIds = Object.keys(SCHOOLS) as Array<keyof typeof SCHOOLS>

export function DeveloperProgression() {
  const state = useGameStore()
  const { progress } = state
  const totalBosses = MONSTER_IDS.filter((id) => isBossMonster(MONSTERS[id])).length
  const discoveredBosses = progress.discoveredMonsters.filter((id) => isBossMonster(MONSTERS[id])).length
  const discoveredEquipment = progress.discoveredItems.filter((id) => ITEMS[id]?.kind === 'equipment').length
  const flags = [{ label: 'First Boss defeated', value: progress.firstBossKill }, { label: 'Final boss defeated', value: progress.firstMainBossKill }, { label: 'Guild unlocked', value: progress.guildUnlocked }, { label: 'Ember Staff recipe unlocked', value: progress.emberStaffUnlocked }, { label: 'Forest Heart unlocked', value: progress.forestHeartUnlocked }, { label: 'Auto Hunt unlocked', value: progress.autoHuntBossUnlocked }]
  const [selectedCrystal, setSelectedCrystal] = useState<CrystalVariantId>('force-t1')
  const [crystalQuantity, setCrystalQuantity] = useState(1)

  return <div className="developer-tab-grid">
    <Card title="DUNGEONS · Progression dashboard"><div className="developer-summary-grid">{DUNGEON_ORDER.map((id) => <Summary key={id} label={DUNGEONS[id].name} value={isDungeonUnlocked(DUNGEONS[id], progress) ? isDungeonCompleted(id, progress) ? 'Complete' : 'Unlocked' : 'Locked'} />)}<Summary label="Tutorial" value={isTutorialCompleted(progress) ? 'Complete' : 'Incomplete'} /><Summary label="Normal kills" value={progress.lifetimeKills} /><Summary label="Boss kills" value={Object.values(progress.bossKillsByBoss).reduce((sum, value) => sum + (value ?? 0), 0)} /><Summary label="Discovered monsters" value={`${progress.discoveredMonsters.length} / ${MONSTER_IDS.length}`} /><Summary label="Discovered bosses" value={`${discoveredBosses} / ${totalBosses}`} /><Summary label="Discovered equipment" value={`${discoveredEquipment} / ${Object.values(ITEMS).filter((item) => item.kind === 'equipment').length}`} /></div></Card>
    <Card title="MAGIC · School unlocks and levels"><div className="developer-research-school-list">{schoolIds.map((schoolId) => { const info = getSchoolProgressInfo(state, schoolId); const spellCount = Object.values(SPELLS).filter((spell) => spell.school === schoolId && getSpellRank(state, spell.id) !== null).length; return <div className="developer-research-school" key={schoolId}><div><strong>{SCHOOLS[schoolId].name}</strong><small>Level {info.level} / {info.cap} · {info.xp} XP · {spellCount} unlocked spells</small></div><Status tone={info.atCap ? 'warning' : info.level > 1 ? 'success' : 'neutral'}>{info.atCap ? 'AT CAP' : 'IN PROGRESS'}</Status></div> })}</div><p className="muted">Use Spells &amp; Schools for direct level, rank, and access controls.</p></Card>
    <Card title="GUILD · Status"><div className="developer-summary-grid"><Summary label="Guild" value={progress.guildUnlocked ? 'Unlocked' : 'Locked'} /><Summary label="Rank" value={progress.guildRank} /><Summary label="Reputation" value={progress.guildReputation} /><Summary label="Permanent Focus" value={Object.values(progress.permanentFocusBonuses).reduce((sum, value) => sum + value, 0)} /></div><div className="developer-button-grid"><Button variant="secondary" onClick={state.promoteGuild}>Promote if legal</Button><NumberField label="Guild reputation" value={progress.guildReputation} onChange={state.setGuildReputation} /></div><div className="developer-owned-list">{flags.map((flag) => <span key={flag.label}>{flag.label}<strong>{flag.value ? 'ON' : 'OFF'}</strong></span>)}</div></Card>
    <Card title="CRYSTALS · V1 fixtures"><div className="developer-summary-grid"><Summary label="System" value={progress.bossKillsByBoss['meridian-splitter'] ? 'Unlocked' : 'Locked'} /><Summary label="Dust" value={state.crystals.dust.toLocaleString()} /><Summary label="Active sockets" value={`${state.crystals.equippedSlots.filter(Boolean).length} / ${state.crystals.unlockedSlots}`} /></div><div className="developer-button-grid"><Button variant="secondary" tooltip="Grant Meridian evidence without emitting the legitimate first-clear notification." onClick={state.debugUnlockCrystals}>UNLOCK CRYSTALS</Button><Button variant="ghost" onClick={() => state.addItem('tier-1-crystal-cache', 10)}>+10 T1 CACHES</Button><Button variant="ghost" onClick={() => state.debugAddCrystalDust(1000)}>+1,000 DUST</Button><Button variant="danger" onClick={state.debugResetCrystals}>RESET CRYSTAL STATE</Button></div><div className="developer-form-grid"><label className="developer-select-field">CRYSTAL<select aria-label="Developer Crystal variant" value={selectedCrystal} onChange={(event) => setSelectedCrystal(event.target.value as CrystalVariantId)}>{CRYSTAL_VARIANT_IDS.map((variantId) => <option value={variantId} key={variantId}>{getCrystalVariantName(variantId)}</option>)}</select></label><NumberField label="Quantity" value={crystalQuantity} onChange={(value) => setCrystalQuantity(Math.max(1, Math.floor(value)))} /><Button variant="secondary" onClick={() => state.debugGrantCrystal(selectedCrystal, crystalQuantity)}>GRANT CRYSTAL</Button><NumberField label="Unlocked sockets" value={state.crystals.unlockedSlots} onChange={state.debugSetCrystalUnlockedSlots} /></div></Card>
  </div>
}
