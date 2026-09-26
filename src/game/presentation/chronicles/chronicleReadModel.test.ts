import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { CHRONICLE_OBJECTIVE_BY_ID } from '../../content/chronicles/chronicles'
import { buildChronicleReadModel, filterChronicleReadModel, getChronicleLockReasons, sortChronicleReadModel } from './chronicleReadModel'

describe('Chronicle read model', () => {
  it('hides completed cards without changing Chronicle progression', () => {
    const state = createInitialState()
    state.progress.startingSchoolId = 'fire'
    state.progress.chronicle.completedObjectiveIds = ['m1-choose-school']
    const models = buildChronicleReadModel(state, 'first-frontier')
    const visible = filterChronicleReadModel(models, { search: '', statusFilters: ['current', 'available', 'locked', 'completed'], trackFilters: ['main', 'combat', 'magic', 'tower', 'guild', 'region'], hideCompleted: true, showLocked: true, showOptional: true })
    expect(visible.some((objective) => objective.id === 'm1-choose-school')).toBe(false)
    expect(state.progress.chronicle.completedObjectiveIds).toContain('m1-choose-school')
  })

  it('combines search, status, and multi-track filters', () => {
    const state = createInitialState()
    const models = buildChronicleReadModel(state, 'first-frontier')
    const filtered = filterChronicleReadModel(models, { search: 'guild', statusFilters: ['locked', 'available'], trackFilters: ['tower', 'guild'], hideCompleted: false, showLocked: true, showOptional: true })
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every((objective) => ['tower', 'guild'].includes(objective.track) && objective.status !== 'completed')).toBe(true)
  })

  it('prioritizes tracked available work over ordinary available work', () => {
    const state = createInitialState()
    state.progress.chronicle.completedObjectiveIds = [
      'm1-choose-school',
      'm2-first-blood',
      'm3-heart-of-the-woods',
      'm4-break-the-den',
      'm5-fallen-archmage',
    ]
    const models = buildChronicleReadModel(state, 'first-frontier', ['mg1-strengthen-artifact'])
    const sorted = sortChronicleReadModel(models.filter((objective) => objective.status !== 'completed'), 'recommended')
    expect(sorted.findIndex((objective) => objective.id === 'mg1-strengthen-artifact')).toBeLessThan(
      sorted.findIndex((objective) => objective.id === 'c1-enter-whispering-woods'),
    )
  })

  it('returns distinct AND and OR lock reasons', () => {
    const state = createInitialState()
    const models = buildChronicleReadModel(state, 'first-frontier')
    const mainLock = getChronicleLockReasons(state, CHRONICLE_OBJECTIVE_BY_ID['m3-heart-of-the-woods'])
    const anyLock = getChronicleLockReasons(state, CHRONICLE_OBJECTIVE_BY_ID['mg2-expand-spellbook'])
    expect(mainLock.some((reason) => reason.type === 'required-objective')).toBe(true)
    expect(anyLock.some((reason) => reason.type === 'any-objective')).toBe(true)
  })
})
