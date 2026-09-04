import { describe, expect, it } from 'vitest'
import { getNewIds } from './ProgressionFeelObserver'

describe('progression feel comparison', () => {
  it('only returns newly unlocked IDs', () => {
    expect(getNewIds(['fire-bolt'], ['fire-bolt', 'ignite', 'flow-mend'])).toEqual(['ignite', 'flow-mend'])
    expect(getNewIds([], [])).toEqual([])
  })
})

