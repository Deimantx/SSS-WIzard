import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { debugCompleteChronicleChapter, debugCompleteChronicleObjective, debugCompleteChroniclePrerequisites, getChronicleActiveChapter, getChronicleChapterProgress, getChronicleMainObjective, isChronicleChapterComplete, debugResetAllChronicles, recordChronicleEvent, reconcileChronicleProgress } from './chronicleRuntime'

describe('Chronicle runtime', () => {
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
