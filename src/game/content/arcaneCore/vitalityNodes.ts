import { createRing, linearStat, major, minor, modifier, rankedModifier, perk, v7Mechanic, v7MechanicWith } from './arcaneCoreNodeFactory'
import { aboveHp, belowHp } from './arcaneCoreContentHelpers'

const mechanic = (ring: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, slot: `S${5 | 6 | 7 | 8}` | 'M', name: string) => v7Mechanic('vitality', ring, slot, name)
const damageTaken = (perRank: number) => rankedModifier('damage-taken-percent', perRank)
const healingReceived = (perRank: number) => rankedModifier('healing-received-percent', perRank)

const ring1 = createRing('vitality', 1, [
  minor('vitality-r1-vitality', 'Vitality', '+0.6% Max Health per rank. Rank 5: +3%.', linearStat('maxHealthPct', 0.006)),
  minor('vitality-r1-natural-recovery', 'Steady Guard', '+1 Defense per rank. Rank 5: +5.', linearStat('defense', 1)),
  minor('vitality-r1-arcane-defense', 'Natural Recovery', '+0.1 Health Regen per rank. Rank 5: +0.5/sec.', linearStat('healthRegen', 0.1)),
  minor('vitality-r1-guard', 'Reinforced Ward', '+0.6% Barrier Power per rank. Rank 5: +3%.', linearStat('barrierPowerPct', 0.006)),
  perk('vitality-r1-barrier-power', 'Second Skin', 'While above 80% Health, gain +2/4/6/8/10 Defense.', v7MechanicWith('vitality', 1, 'S5', 'Second Skin', (rank) => ({ modifiers: [modifier('defense-flat', rank * 2, aboveHp(80))] }))),
  perk('vitality-r1-healing-mastery', 'Emergency Pulse', 'When Barrier breaks below 50% Health, heal 1/1.5/2/2.5/3% Max Health. Internal cooldown: 8 seconds.', mechanic(1, 'S6', 'Emergency Pulse')),
  perk('vitality-r1-fortified-body', 'Recovery Window', 'Healing received shortly after taking damage is slightly improved.', mechanic(1, 'S7', 'Recovery Window')),
  perk('vitality-r1-victory-recovery', 'Victory Recovery', 'A defeated enemy restores a small amount of Health.', mechanic(1, 'S8', 'Victory Recovery')),
  major('vitality-r1-deep-recovery', 'Second Wind', 'The first time each encounter the player falls below 30% Health, heal 5% Max Health. Once per encounter.', mechanic(1, 'M', 'Second Wind')),
])

const ring2 = createRing('vitality', 2, [
  minor('vitality-r2-second-wind', 'Vitality II', '+0.6% Max Health per rank. Rank 5: +3%.', linearStat('maxHealthPct', 0.006)),
  minor('vitality-r2-steady-guard', 'Fortified Guard', '+1.2 Defense per rank. Rank 5: +6.', linearStat('defense', 1.2)),
  minor('vitality-r2-stonewall', 'Fortified Body', '-0.1% Damage Taken per rank. Rank 5: -0.5%.', damageTaken(-0.001)),
  minor('vitality-r2-ward-reinforcement', 'Restoration', '+0.4% Healing Received per rank. Rank 5: +2%.', healingReceived(0.004)),
  perk('vitality-r2-reinforced-ward', 'Stonewall', 'While Barrier is active, gain +2/4/6/8/10 Defense.', v7MechanicWith('vitality', 2, 'S5', 'Stonewall', (rank) => ({ modifiers: [modifier('defense-flat', rank * 2, { type: 'self-has-barrier' })] }))),
  perk('vitality-r2-ward-recovery', 'Barrier Recovery', 'When Barrier breaks, heal 1/1.5/2/2.5/3% Max Health.', mechanic(2, 'S6', 'Barrier Recovery')),
  perk('vitality-r2-resilient-flow', 'Guarded Recovery', 'Taking Health damage restores 1/2/3/4/5% Max Mana. Internal cooldown: 3 seconds.', mechanic(2, 'S7', 'Guarded Recovery')),
  perk('vitality-r2-emergency-recovery', 'Low Health Guard', 'Below 25% Health, Healing effectiveness is increased by 1/2/3/4/5%.', mechanic(2, 'S8', 'Low Health Guard')),
  major('vitality-r2-unyielding', 'Unyielding', 'While below 50% Health, take 5% less Health damage. It does not reduce damage already absorbed by Barrier.', v7MechanicWith('vitality', 2, 'M', 'Unyielding', () => ({ modifiers: [modifier('damage-taken-percent', -0.05, belowHp(50))] }))),
])

const ring3 = createRing('vitality', 3, [
  minor('vitality-r3-reactive-ward', 'Barrier Power', '+0.8% Barrier Power per rank. Rank 5: +4%.', linearStat('barrierPowerPct', 0.008)),
  minor('vitality-r3-guarded-soul', 'Healing Mastery', '+0.4% Healing Done per rank. Rank 5: +2%.', linearStat('healingDonePct', 0.004)),
  minor('vitality-r3-aegis-strength', 'Deep Recovery', '+0.2 Health Regen per rank. Rank 5: +1/sec.', linearStat('healthRegen', 0.2)),
  minor('vitality-r3-recovery-under-fire', 'Aegis Defense', '+1.4 Defense per rank. Rank 5: +7.', linearStat('defense', 1.4)),
  perk('vitality-r3-defensive-flow', 'Reactive Ward', 'Taking Health damage without Barrier grants a small Barrier.', mechanic(3, 'S5', 'Reactive Ward')),
  perk('vitality-r3-ward-renewal', 'Ward Renewal', 'Gaining Barrier restores a small amount of Health with a bounded cooldown.', mechanic(3, 'S6', 'Ward Renewal')),
  perk('vitality-r3-lasting-guard', 'Barrier Memory', 'After Barrier breaks, the next Barrier gained within 8 seconds is increased by 5/10/15/20/25%.', mechanic(3, 'S7', 'Barrier Memory')),
  perk('vitality-r3-battle-recovery', 'Stable Protection', 'Barrier protection gains a small stability bonus without creating a conversion loop.', mechanic(3, 'S8', 'Stable Protection')),
  major('vitality-r3-arcane-aegis', 'Arcane Aegis', 'When Barrier breaks, gain a replacement Barrier equal to 20% of the broken Barrier original value. Cooldown: 10 seconds.', mechanic(3, 'M', 'Arcane Aegis')),
])

const ring4 = createRing('vitality', 4, [
  minor('vitality-r4-apex-vitality', 'Immortal Vitality', '+0.8% Max Health per rank. Rank 5: +4%.', linearStat('maxHealthPct', 0.008)),
  minor('vitality-r4-immortal-recovery', 'Immortal Defense', '+1.8 Defense per rank. Rank 5: +9.', linearStat('defense', 1.8)),
  minor('vitality-r4-iron-will', 'Iron Will', '-0.15% Damage Taken per rank. Rank 5: -0.75%.', damageTaken(-0.0015)),
  minor('vitality-r4-last-bastion', 'Recovery Mastery', '+0.6% Healing Received per rank. Rank 5: +3%.', healingReceived(0.006)),
  perk('vitality-r4-absolute-guard', 'Last Breath', 'A low-health threshold grants a brief defensive reaction.', mechanic(4, 'S5', 'Last Breath')),
  perk('vitality-r4-deep-fortification', 'Emergency Aegis', 'Below 20% Health without Barrier, gain 3/4/5/6/7% Max Health Barrier. Internal cooldown: 10 seconds.', mechanic(4, 'S6', 'Emergency Aegis')),
  perk('vitality-r4-emergency-aegis', 'Recovery Surge', 'Healing after taking damage is temporarily improved.', mechanic(4, 'S7', 'Recovery Surge')),
  perk('vitality-r4-recovery-mastery', 'Survival Instinct', 'A near-lethal event grants a bounded defensive response.', mechanic(4, 'S8', 'Survival Instinct')),
  major('vitality-r4-survival-instinct', 'Living Bastion', 'While Barrier exists, 10% of effective Healing received is also added to Barrier, capped at 3% Max Health per event. Conversion-generated Barrier cannot trigger another conversion.', mechanic(4, 'M', 'Living Bastion')),
])

const ring5 = createRing('vitality', 5, [
  minor('vitality-r5-bastion-heart', 'Bastion Ward', '+1% Barrier Power per rank. Rank 5: +5%.', linearStat('barrierPowerPct', 0.01)),
  minor('vitality-r5-iron-recovery', 'Bastion Restoration', '+0.6% Healing Done per rank. Rank 5: +3%.', linearStat('healingDonePct', 0.006)),
  minor('vitality-r5-fortress-defense', 'Bastion Recovery', '+0.3 Health Regen per rank. Rank 5: +1.5/sec.', linearStat('healthRegen', 0.3)),
  minor('vitality-r5-bastion-guard', 'Fortress', '-0.15% Damage Taken per rank. Rank 5: -0.75%.', damageTaken(-0.0015)),
  perk('vitality-r5-greater-barrier', 'Layered Ward', 'Gaining Barrier also grants 0.5/1/1.5/2/2.5% Max Health Barrier. Internal cooldown: 3 seconds.', mechanic(5, 'S5', 'Layered Ward')),
  perk('vitality-r5-resilient-healing', 'Ward Battery', 'When Barrier breaks, the next Healing action gains +1/2/3/4/5% action speed.', mechanic(5, 'S6', 'Ward Battery')),
  perk('vitality-r5-fortified-ward', 'Bastion Cast', 'While Barrier exists, defensive Spells receive a small Mana benefit.', mechanic(5, 'S7', 'Bastion Cast')),
  perk('vitality-r5-bastion-recovery', 'Reinforced Recovery', 'Healing after Barrier damage is improved with a bounded response.', mechanic(5, 'S8', 'Reinforced Recovery')),
  major('vitality-r5-living-fortress', 'Renewal', 'Every 12 seconds in combat, below 50% Health heals 4% Max Health; otherwise gain a Barrier equal to 4% Max Health.', mechanic(5, 'M', 'Renewal')),
])

const ring6 = createRing('vitality', 6, [
  minor('vitality-r6-greater-vitality', 'Renewal Vitality', '+0.8% Max Health per rank. Rank 5: +4%.', linearStat('maxHealthPct', 0.008)),
  minor('vitality-r6-greater-recovery', 'Renewal Ward', '+1.4% Barrier Power per rank. Rank 5: +7%.', linearStat('barrierPowerPct', 0.014)),
  minor('vitality-r6-restoration-mastery', 'Renewal Defense', '+2.8 Defense per rank. Rank 5: +14.', linearStat('defense', 2.8)),
  minor('vitality-r6-rejuvenation', 'Renewal Restoration', '+1% Healing Received per rank. Rank 5: +5%.', healingReceived(0.01)),
  perk('vitality-r6-ward-life', 'Regenerative Casting', 'A successful Spell heals 0.5/1/1.5/2/2.5% Max Health. Internal cooldown: 2 seconds.', mechanic(6, 'S5', 'Regenerative Casting')),
  perk('vitality-r6-barrier-renewal', 'Healing Momentum', 'Healing events build a bounded defensive tempo benefit.', mechanic(6, 'S6', 'Healing Momentum')),
  perk('vitality-r6-desperate-regeneration', 'Barrier Break Recovery', 'Barrier breaking starts a bounded recovery response.', mechanic(6, 'S7', 'Barrier Break Recovery')),
  perk('vitality-r6-renewed-guard', 'Renewal Cycle', 'Healing or gaining Barrier grants the next self action +1/2/3/4/5% action speed.', mechanic(6, 'S8', 'Renewal Cycle')),
  major('vitality-r6-phoenix-ward', 'Refuse Death', 'The first time each encounter Health falls below 15%, gain a Barrier equal to 10% Max Health. It does not negate lethal damage after the fact.', mechanic(6, 'M', 'Refuse Death')),
])

const ring7 = createRing('vitality', 7, [
  minor('vitality-r7-undying-vitality', 'Undying Vitality', '+1% Max Health per rank. Rank 5: +5%.', linearStat('maxHealthPct', 0.01)),
  minor('vitality-r7-undying-defense', 'Undying Defense', '+3.8 Defense per rank. Rank 5: +19.', linearStat('defense', 3.8)),
  minor('vitality-r7-undying-guard', 'Undying Recovery', '+0.6 Health Regen per rank. Rank 5: +3/sec.', linearStat('healthRegen', 0.6)),
  minor('vitality-r7-undying-ward', 'Undying Will', '-0.2% Damage Taken per rank. Rank 5: -1%.', damageTaken(-0.002)),
  perk('vitality-r7-refuse-death', 'Last Refuge', 'When Barrier breaks below 15% Health, gain 5/7.5/10/12.5/15% Max Health Barrier.', mechanic(7, 'S5', 'Last Refuge')),
  perk('vitality-r7-barrier-armor', 'Defiant Casting', 'Low Health improves the next defensive Spell.', mechanic(7, 'S6', 'Defiant Casting')),
  perk('vitality-r7-pain-to-mana', 'Pain Conversion', 'Taking Health damage restores 1/2/3/4/5% of that Health damage as Mana. Internal cooldown: 1 second.', mechanic(7, 'S7', 'Pain Conversion')),
  perk('vitality-r7-undying-recovery', 'Comeback', 'Recovering from low Health grants a bounded short-term benefit.', mechanic(7, 'S8', 'Comeback')),
  major('vitality-r7-undying-will', 'Undying', 'Once per dungeon run, lethal damage leaves the player at 1 Health, grants a Barrier equal to 15% Max Health, and grants 40% Damage Reduction for 1.5 seconds.', mechanic(7, 'M', 'Undying')),
])

const ring8 = createRing('vitality', 8, [
  minor('vitality-r8-eternal-vitality', 'Eternal Vitality', '+1.2% Max Health per rank. Rank 5: +6%.', linearStat('maxHealthPct', 0.012)),
  minor('vitality-r8-eternal-recovery', 'Eternal Ward', '+2.2% Barrier Power per rank. Rank 5: +11%.', linearStat('barrierPowerPct', 0.022)),
  minor('vitality-r8-eternal-defense', 'Eternal Restoration', '+1% Healing Done per rank. Rank 5: +5%.', linearStat('healingDonePct', 0.01)),
  minor('vitality-r8-eternal-guard', 'Eternal Fortress', '-0.4% Damage Taken per rank. Rank 5: -2%.', damageTaken(-0.004)),
  perk('vitality-r8-eternal-barrier', 'Phoenix Pulse', 'Below 20% Health, heal 3/4/5/6/8% Max Health once per encounter.', mechanic(8, 'S5', 'Phoenix Pulse')),
  perk('vitality-r8-eternal-restoration', 'Life Battery', 'Gaining Barrier stores 2/4/6/8/10% of that Barrier for the next defensive conversion.', mechanic(8, 'S6', 'Life Battery')),
  perk('vitality-r8-eternal-ward', 'Unbroken Cycle', 'Gaining Barrier grants the next self action +1/2/3/4/5% action speed.', mechanic(8, 'S7', 'Unbroken Cycle')),
  perk('vitality-r8-final-recovery', 'Eternal Recovery', 'Healing while below 50% Health also heals 0.5/1/1.5/2/2.5% Max Health. Internal cooldown: 5 seconds.', mechanic(8, 'S8', 'Eternal Recovery')),
  major('vitality-r8-eternal-aegis', 'Eternal Aegis', '15% of effective Healing grants Barrier and 15% of effective Barrier gained heals the player. Each conversion is capped at 3% Max Health per event and conversion-generated effects cannot recursively retrigger the opposite conversion.', mechanic(8, 'M', 'Eternal Aegis')),
])

export const vitalityNodes = [ring1, ring2, ring3, ring4, ring5, ring6, ring7, ring8]
