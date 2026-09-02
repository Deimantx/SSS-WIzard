import { describe, expect, it } from 'vitest'
import { validateGameContent } from './validateGameContent'

describe('game content validation bootstrap', () => {
  it('validates production combat content without errors', () => {
    expect(validateGameContent()).toEqual([])
  })
})
