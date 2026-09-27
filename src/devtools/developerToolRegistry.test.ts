import { describe, expect, it } from 'vitest'
import { DEVELOPER_TOOL_REGISTRY, DEVELOPER_WORKSPACE_REGISTRY, getDeveloperToolDefinition, getDeveloperWorkspaceTools } from './developerToolRegistry'

describe('Developer Tools V4 registry', () => {
  it('contains unique IDs and routes every tool to one workspace', () => {
    const ids = DEVELOPER_TOOL_REGISTRY.map((tool) => tool.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(DEVELOPER_TOOL_REGISTRY).toHaveLength(31)
    for (const workspace of DEVELOPER_WORKSPACE_REGISTRY) expect(getDeveloperWorkspaceTools(workspace.id).length).toBeGreaterThan(0)
  })

  it('returns an explicit miss for an unknown tool', () => {
    expect(getDeveloperToolDefinition('not-a-tool')).toBeUndefined()
  })
})
