import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { CHRONICLE_OBJECTIVES } from '../../content/chronicles/chronicles'
import { debugCompleteChronicleChapter, debugCompleteChronicleObjective, debugCompleteChroniclePrerequisites, evaluateChronicleCondition, getChronicleActiveChapter, getChronicleChapterProgress, getChronicleMainObjective, getChronicleConditionValue, isChronicleChapterComplete, debugResetAllChronicles, recordChronicleEvent, reconcileChronicleProgress } from './chronicleRuntime'

describe('Chronicle runtime', () => {
  it('keeps first Arcane Guild Commission as one objective and gives the Tower milestone a distinct condition', () => {
    const commissionObjectives = CHRONICLE_OBJECTIVES.filter((objective) => objective.condition.type === 'guild-commissions-completed' && objective.condition.count === 1)
    expect(commissionObjectives.map((objective) => objective.id)).toEqual(['g2-first-guild-contract'])
    expect(CHRONICLE_OBJECTIVES.find((objective) => objective.id === 't4-answer-verdant-circle')).toMatchObject({ title: 'Focus an Arcane Core Node', condition: { type: 'arcane-core-invested-nodes', count: 1 }, navigateTo: 'arcane-core' })
  })
  it('keeps accepting a Hunt Contract distinct from completing one and tracks Guild investments', () => {
    const state = createInitialState()
    const accepted = CHRONICLE_OBJECTIVES.find((objective) => objective.id === 'g13-accept-a-hunt')!
    const completed = CHRONICLE_OBJECTIVES.find((objective) => objective.id === 'g5-first-hunt-contract')!
    state.progress.huntersOrder.totalContractsAccepted = 1
    expect(evaluateChronicleCondition(state, accepted.condition)).toBe(true)
    expect(evaluateChronicleCondition(state, completed.condition)).toBe(false)
    state.progress.huntersOrder.totalContractsCompleted = 1
    state.progress.arcaneRegistry.completedSetIds = ['ember-fundamentals']
    state.progress.guildSkillNodeRanks['hunter-arcane-quarry'] = 1
    expect(evaluateChronicleCondition(state, completed.condition)).toBe(true)
    expect(getChronicleConditionValue(state, { type: 'guild-registry-sets-completed', count: 2 })).toEqual({ current: 1, target: 2 })
    expect(evaluateChronicleCondition(state, { type: 'guild-points-spent', count: 1 })).toBe(true)
  })
  it('latches objectives and does not duplicate one-time rewards', () => {
    const state = createInitialState()
    state.progress.startingSchoolId = 'fire'
    state.progress.lifetimeKills = 1
    state.progress.bossKillsByBoss['meridian-splitter'] = 1

    reconcileChronicleProgress(state, { notify: false })
    expect(state.progress.chronicle.completedObjectiveIds).toContain('m1-choose-school')
    expect(state.progress.chronicle.completedObjectiveIds).toContain('m2-first-blood')
    expect(state.progress.chronicle.grantedUnlockRewardIds).toContain('sf-socket-first-crystal')
    expect(state.crystals.owned['force-t1']).toBe(1)

    reconcileChronicleProgress(state, { notify: false })
    expect(state.crystals.owned['force-t1']).toBe(1)
  })

  it('keeps event completion latched after the source state changes', () => {
    const state = createInitialState()
    state.progress.startingSchoolId = 'fire'
    state.progress.lifetimeKills = 1
    state.activities.channeling.acolytesAssigned = 1
    reconcileChronicleProgress(state, { notify: false })
    recordChronicleEvent(state, 'first-fragment-transmuted')
    recordChronicleEvent(state, 'first-research-batch-completed')

    expect(state.progress.chronicle.eventFlags['first-fragment-transmuted']).toBe(true)
    expect(state.progress.chronicle.completedObjectiveIds).toContain('t2-shape-resonance')
    expect(state.progress.chronicle.completedObjectiveIds).toContain('t3-study-the-fragment')
  })

  it('unlocks Shattered Frontier branches from their authored evidence', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper'] = 1
    reconcileChronicleProgress(state, { notify: false })
    expect(state.progress.chronicle.completedObjectiveIds).not.toContain('sf-bind-guardian')
    state.guardians.selectedGuardianId = 'fire-guardian'
    reconcileChronicleProgress(state, { notify: false })
    expect(state.progress.chronicle.completedObjectiveIds).toContain('sf-bind-guardian')
  })

  it('supports Chronicle-only tester completion and safe reset semantics', () => {
    const state = createInitialState()
    debugCompleteChroniclePrerequisites(state, 'm3-heart-of-the-woods')
    expect(state.progress.chronicle.completedObjectiveIds).toEqual(['m1-choose-school', 'm2-first-blood'])
    debugCompleteChronicleObjective(state, 'm3-heart-of-the-woods')
    expect(state.progress.chronicle.completedObjectiveIds).toContain('m3-heart-of-the-woods')

    state.progress.chronicle.grantedUnlockRewardIds.push('sf-socket-first-crystal')
    debugResetAllChronicles(state)
    expect(state.progress.chronicle.completedObjectiveIds).toEqual([])
    expect(state.progress.chronicle.eventFlags).toEqual({})
    expect(state.progress.chronicle.grantedUnlockRewardIds).toContain('sf-socket-first-crystal')
  })

  it('uses only required Main objectives for chapter completion and advances into Shattered Frontier', () => {
    const state = createInitialState()
    expect(getChronicleActiveChapter(state)).toBe('first-frontier')
    expect(isChronicleChapterComplete(state, 'shattered-frontier')).toBe(false)

    debugCompleteChronicleChapter(state, 'first-frontier')
    expect(isChronicleChapterComplete(state, 'first-frontier')).toBe(true)
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    reconcileChronicleProgress(state, { notify: false })

    expect(getChronicleActiveChapter(state)).toBe('shattered-frontier')
    expect(getChronicleMainObjective(state)?.id).toBe('sf-m1-cross-fractured-approach')
    const progress = getChronicleChapterProgress(state, 'shattered-frontier')
    expect(progress.requiredTotal).toBe(6)
    expect(progress.optionalTotal).toBeGreaterThan(0)
    expect(isChronicleChapterComplete(state, 'shattered-frontier')).toBe(false)
  })
})
