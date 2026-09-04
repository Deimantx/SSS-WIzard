import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearMilestones, enqueueMilestone, getMilestones, MAX_QUEUED_MILESTONES } from './milestoneStore'

describe('milestone presentation queue', () => {
  afterEach(() => { vi.useRealTimers(); clearMilestones() })

  it('keeps one visible milestone and a short bounded queue', () => {
    for (let index = 0; index < MAX_QUEUED_MILESTONES + 3; index += 1) enqueueMilestone({ kind: 'spell', eyebrow: 'SPELL UNLOCKED', title: `Spell ${index}`, now: index })
    expect(getMilestones()).toHaveLength(MAX_QUEUED_MILESTONES + 1)
    expect(getMilestones()[0]?.title).toBe('Spell 2')
  })
})
