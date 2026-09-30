import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { resetAllUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { getArcaneRegistryEntries } from '../../game/systems/guild/arcaneRegistry'
import { ArcaneRegistryTab } from './ArcaneRegistryTab'
import { GuildAdvancementTab } from './GuildAdvancementTab'
import { GuildStudiesTab } from './GuildStudiesTab'

const freshGuild = () => {
  window.localStorage.clear()
  resetAllUiPreferences()
  const state = createInitialState()
  state.progress.guildUnlocked = true
  useGameStore.setState(state)
  return useGameStore.getState()
}

describe('Arcane Guild V6 presentation', () => {
  beforeEach(() => { freshGuild() })

  it('puts a ready Registry action and its owned/required quantities before Related Sets', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.inventory['fire-fragment'] = 5
    state.progress.discoveredItems = ['fire-fragment']
    useGameStore.setState(state)
    const { container } = render(<ArcaneRegistryTab />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Search Arcane Registry' }), { target: { value: 'Fire Fragment' } })
    fireEvent.click(screen.getByRole('button', { name: /Fire Fragment/ }))
    expect(screen.getByText('READY TO RECORD')).toBeTruthy()
    expect(screen.getByText('Required')).toBeTruthy()
    const register = screen.getByRole('button', { name: 'Register Item' })
    const relatedSets = container.querySelector('.registry-set-section')!
    expect(container.querySelector('.registry-item-hero h2')?.textContent).toBe('Fire Fragment')
    expect(container.querySelector('.registry-desk-counts')?.textContent).toContain('Owned 5')
    expect(container.querySelector('.registry-desk-requirement')?.textContent).toContain('Consumes 1 item')
    expect(register.compareDocumentPosition(relatedSets) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(container.querySelector('.registry-registration-desk')!).getByText(/Owned/)).toBeTruthy()
    fireEvent.click(register)
    expect(useGameStore.getState().progress.arcaneRegistry.registeredEntries['fire-fragment']).toBe(1)
    expect(screen.getByRole('button', { name: 'Registered' }).hasAttribute('disabled')).toBe(true)
  })

  it('opens the active Study chapter and keeps its current stage visible', () => {
    const state = freshGuild()
    state.progress.arcaneGuild.activeCommissionChain = { id: 'study-grand-confluence', stageIndex: 1, stageProgress: 3 }
    useGameStore.setState(state)
    const { container } = render(<GuildStudiesTab />)
    expect(screen.getByText('CURRENT STAGE · 2 / 3')).toBeTruthy()
    expect(screen.getAllByText(/Produce 10 Prismatic Fragment/).length).toBeGreaterThan(0)
    expect(container.querySelector('.guild-study-chapter.expanded')?.textContent).toContain('CHAPTER V')
    fireEvent.click(screen.getByRole('button', { name: /Grand Magister Capstone/ }))
    const returnButton = screen.getByRole('button', { name: /Return to active Study · Senior Synthesis Practicum/ })
    expect(returnButton).toBeTruthy()
    fireEvent.click(returnButton)
    expect(screen.getByText('CURRENT STAGE · 2 / 3')).toBeTruthy()
  })

  it('shows a missing quantity and retained status for non-consumptive records', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.discoveredItems = ['fire-fragment', 'black-portal-shard', 'ember-staff']
    useGameStore.setState(state)
    render(<ArcaneRegistryTab />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Search Arcane Registry' }), { target: { value: 'Fire Fragment' } })
    fireEvent.click(screen.getByRole('button', { name: /Fire Fragment/ }))
    expect(screen.getByRole('button', { name: 'Need 1 More' })).toBeTruthy()
    expect(screen.getByText('Missing')).toBeTruthy()
    fireEvent.change(screen.getByRole('textbox', { name: 'Search Arcane Registry' }), { target: { value: 'Black Portal Shard' } })
    fireEvent.click(screen.getByRole('button', { name: /Black Portal Shard/ }))
    expect(screen.getByText(/ITEM RETAINED/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Register Item' }))
    expect(useGameStore.getState().progress.arcaneRegistry.registeredEntries['black-portal-shard']).toBe(1)
    expect(useGameStore.getState().inventory['black-portal-shard'] ?? 0).toBe(0)
    fireEvent.change(screen.getByRole('textbox', { name: 'Search Arcane Registry' }), { target: { value: 'Ember Staff' } })
    fireEvent.click(screen.getByRole('button', { name: /Ember Staff/ }))
    expect(screen.getByRole('button', { name: 'Own Item First' })).toBeTruthy()
    expect(screen.getByText(/ITEM RETAINED/)).toBeTruthy()
  })

  it('keeps an undiscovered item visible in the dossier with its explicit discovery requirement', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    useGameStore.setState(state)
    render(<ArcaneRegistryTab />)
    fireEvent.click(screen.getByRole('tab', { name: 'UNDISCOVERED' }))
    const catalogIndex = getArcaneRegistryEntries().findIndex(({ item }) => item.id === 'black-portal-shard') + 1
    fireEvent.click(screen.getByRole('button', { name: `Undiscovered Registry Entry, catalog position ${catalogIndex}` }))
    expect(screen.getByRole('button', { name: 'Discover Item First' })).toBeTruthy()
  })

  it('limits Related Sets to the selected record and expands lock requirements on demand', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.inventory['ember-staff'] = 1
    state.progress.discoveredItems = ['ember-staff']
    useGameStore.setState(state)
    const { container } = render(<ArcaneRegistryTab />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Search Arcane Registry' }), { target: { value: 'Ember Staff' } })
    fireEvent.click(screen.getByRole('button', { name: /Ember Staff/ }))
    const setRows = container.querySelectorAll('.registry-set-row')
    expect(setRows.length).toBe(3)
    fireEvent.click(setRows[0].querySelector('.registry-set-toggle')!)
    expect(screen.getByText(/LOCKED · REQUIRES INITIATE II/)).toBeTruthy()
  })

  it('shows one department at a time and keeps all eight Majors in their separate rail', () => {
    const state = freshGuild()
    state.progress.guildReputation = 50000
    state.progress.guildPointsEarned = 10
    useGameStore.setState(state)
    const { container } = render(<GuildAdvancementTab />)
    expect(container.querySelectorAll('.guild-advancement-program')).toHaveLength(6)
    expect(container.querySelectorAll('.guild-major-node')).toHaveLength(8)
    expect([...container.querySelectorAll('.guild-advancement-program')].every((node) => !node.textContent?.includes('Major'))).toBe(true)
    fireEvent.click(screen.getByRole('tab', { name: /Transmutation/ }))
    expect(container.querySelectorAll('.guild-advancement-program')).toHaveLength(6)
    expect(container.textContent).toContain('Efficient Arrays')
  })

  it('routes regular purchases through the Guild action and requires confirmation before respec', () => {
    const state = freshGuild()
    state.progress.guildReputation = 1000
    state.progress.guildPointsEarned = 2
    useGameStore.setState(state)
    render(<GuildAdvancementTab />)
    fireEvent.click(screen.getByRole('button', { name: /INVEST · 1 AP · RANK 1/ }))
    expect(useGameStore.getState().progress.guildSkillNodeRanks['scholarship-measured-inquiry']).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'Respec' }))
    expect(screen.getByRole('dialog', { name: 'Confirm Advancement respec' })).toBeTruthy()
    expect(useGameStore.getState().progress.guildSkillNodeRanks['scholarship-measured-inquiry']).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: /Reset board/ }))
    expect(useGameStore.getState().progress.guildSkillNodeRanks['scholarship-measured-inquiry']).toBeUndefined()
  })

  it('routes an eligible Major through the existing purchase action', () => {
    const state = freshGuild()
    state.progress.guildReputation = 100000
    state.progress.guildPointsEarned = 11
    state.progress.guildSkillNodeRanks['scholarship-measured-inquiry'] = 4
    state.progress.guildSkillNodeRanks['scholarship-peer-review'] = 4
    state.progress.guildSkillNodeRanks['scholarship-structured-methodology'] = 2
    useGameStore.setState(state)
    render(<GuildAdvancementTab />)
    fireEvent.click(screen.getByRole('button', { name: /Favored Contractor/ }))
    fireEvent.click(screen.getByRole('button', { name: /UNLOCK MAJOR · 1 AP/ }))
    expect(useGameStore.getState().progress.guildSkillNodeRanks['major-favored-contractor']).toBe(1)
  })
})
