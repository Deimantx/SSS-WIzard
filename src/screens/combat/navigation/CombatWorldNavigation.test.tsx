import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { CombatWorldNavigation } from './CombatWorldNavigation'

const renderNavigation = (onEnterLocation = vi.fn(), onHuntTarget = vi.fn(() => true)) => render(<TooltipProvider><CombatWorldNavigation onSelectLocation={vi.fn()} onEnterLocation={onEnterLocation} onHuntTarget={onHuntTarget} onBestiary={vi.fn()} onReturnToCombat={vi.fn()} /></TooltipProvider>)

describe('CombatWorldNavigation', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('shows the hierarchy inline with one unified First Frontier location grid', () => {
    renderNavigation()

    expect(screen.getByText('WORLD NAVIGATION')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Continent I' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'First Frontier' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Whispering Woods, COMBAT ZONE/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Howling Den, ELITE ZONE/ })).toBeTruthy()
    expect(screen.queryByText('COMBAT ZONES')).toBeNull()
    expect(screen.queryByText('DUNGEONS')).toBeNull()
    expect(screen.getByText('WORLD TIER')).toBeTruthy()
    expect(screen.getByText('Choose a Location.')).toBeTruthy()
    expect(screen.queryByText('CONTINENT I / FIRST FRONTIER / WHISPERING WOODS')).toBeNull()
    expect(screen.queryByText(/LOCATIONS IN REGION/)).toBeNull()
    const tierControl = screen.getByText('WORLD TIER').closest('.combat-world-tier-control')
    expect(tierControl?.classList.contains('is-embedded')).toBe(true)
    expect(tierControl?.querySelector('.card')).toBeNull()
    expect(tierControl?.querySelectorAll('.combat-world-tier-options > .game-tooltip-trigger')).toHaveLength(5)
    expect(screen.queryByText('CAMPAIGN')).toBeNull()
  })

  it('keeps locked Regions disabled and exposes the existing unlock milestone', () => {
    renderNavigation()

    const region = screen.getByRole('button', { name: 'Elemental Scar' })
    expect(region.hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: /Howling Den, ELITE ZONE, LOCKED/ })).toBeTruthy()
  })

  it('renders targeted Whispering Woods cards without legacy inspector metrics', () => {
    const onHuntTarget = vi.fn(() => true)
    renderNavigation(vi.fn(), onHuntTarget)

    expect(screen.getByText('SELECT TARGET')).toBeTruthy()
    expect(screen.getByText('CHOOSE A MONSTER TO HUNT')).toBeTruthy()
    expect(screen.getAllByText(/POWER/)).toHaveLength(8)
    expect(screen.queryByText('RESONANCE / KILL')).toBeNull()
    for (const name of ['Forest Wisp', 'Thornling', 'Dewbound Sprite', 'Cinder Moth', 'Stone Root', 'Grove Sentinel', 'Tempest Stag']) expect(screen.getByText(name)).toBeTruthy()
    expect(screen.getByText('ZONE BOSS')).toBeTruthy()
    expect(screen.getByText('Forest Heart')).toBeTruthy()
    expect(screen.queryByText('NORMAL KILLS')).toBeNull()
    expect(screen.queryByText('BOSS CLEARS')).toBeNull()
    expect(screen.queryByText('LOCATION STATUS')).toBeNull()
    expect(screen.queryByText('Repeatable combat content. Encounter tiles are preview-only in Phase 3A.')).toBeNull()
    expect(screen.getByRole('button', { name: /HUNT TARGET/ })).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: /Cinder MothSTANDARD/ }))
    expect(screen.getByRole('button', { name: /HUNT TARGET/ })).not.toHaveProperty('disabled', true)
    fireEvent.click(screen.getByRole('button', { name: /HUNT TARGET/ }))
    expect(onHuntTarget).toHaveBeenCalledWith('whispering-woods', 'cinder-moth')
    expect(screen.queryByRole('button', { name: /START FARMING|SWITCH TARGET|RETURN TO COMBAT/ })).toBeNull()
  })

  it('distinguishes the selected target from the target currently being hunted', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.targetEnemyId = 'cinder-moth'
    state.combat.enemyId = 'cinder-moth'
    useGameStore.setState(state)
    renderNavigation()

    expect(screen.getByText('HUNTING')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Stone RootSTANDARD/ }))
    expect(screen.getByText('HUNTING')).toBeTruthy()
    expect(screen.getByText('SELECTED')).toBeTruthy()
  })

  it('preserves the selected target when a hunt attempt is blocked', () => {
    const onHuntTarget = vi.fn(() => false)
    renderNavigation(vi.fn(), onHuntTarget)

    fireEvent.click(screen.getByRole('button', { name: /Forest WispEASY/ }))
    fireEvent.click(screen.getByRole('button', { name: 'HUNT TARGET' }))

    expect(onHuntTarget).toHaveBeenCalledWith('whispering-woods', 'forest-wisp')
    expect(screen.getByRole('button', { name: /Forest WispEASY/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'LOOT' })).not.toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'BESTIARY' })).not.toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'HUNT TARGET' })).not.toHaveProperty('disabled', true)
  })

  it('lets the player browse another location while the active run remains unchanged', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    useGameStore.setState(state)
    const onSelectLocation = vi.fn()
    render(<TooltipProvider><CombatWorldNavigation onSelectLocation={onSelectLocation} onEnterLocation={vi.fn()} onHuntTarget={vi.fn(() => true)} onBestiary={vi.fn()} onReturnToCombat={vi.fn()} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: /Howling Den, ELITE ZONE/ }))

    expect(onSelectLocation).toHaveBeenCalledWith('howling-den')
    expect(useGameStore.getState().combat.active).toBe(true)
    expect(useGameStore.getState().combat.dungeonId).toBe('whispering-woods')
    expect(screen.getByRole('heading', { name: 'Howling Den' })).toBeTruthy()
  })

  it('starts a selected Howling Den target through the Inspector action', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    useGameStore.setState(state)
    const onEnterLocation = vi.fn()
    const onHuntTarget = vi.fn(() => true)
    renderNavigation(onEnterLocation, onHuntTarget)
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, ELITE ZONE/ }))
    fireEvent.click(screen.getByRole('button', { name: /Bonehide BoarHARD/ }))
    fireEvent.click(screen.getByRole('button', { name: 'HUNT TARGET' }))

    expect(onHuntTarget).toHaveBeenCalledWith('howling-den', 'bonehide-boar')
    expect(onEnterLocation).not.toHaveBeenCalled()
    expect(useGameStore.getState().combat.active).toBe(false)
  })

  it('shows one location-level Zone Affix instead of per-target affix labels', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    useGameStore.setState(state)
    renderNavigation()
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, ELITE ZONE/ }))

    expect(screen.getByText('ZONE AFFIX')).toBeTruthy()
    expect(screen.getByText('Frenzied')).toBeTruthy()
    expect(screen.queryByText('VICIOUS')).toBeNull()
    expect(screen.queryByText('WARDED')).toBeNull()
    expect(screen.queryByText('ARMORED')).toBeNull()
    expect(screen.queryByText('RELENTLESS')).toBeNull()
    expect(screen.queryByText('REGENERATIVE')).toBeNull()
  })

  it('deep-links the selected Black Sigil target to its exact Bestiary dossier', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    useGameStore.setState(state)
    const onBestiary = vi.fn()
    render(<TooltipProvider><CombatWorldNavigation onSelectLocation={vi.fn()} onEnterLocation={vi.fn()} onHuntTarget={vi.fn(() => true)} onBestiary={onBestiary} onReturnToCombat={vi.fn()} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Black Sigil Reach' }))
    fireEvent.click(screen.getByRole('button', { name: /Hall of Unbound Names, ELITE ZONE/ }))
    fireEvent.click(screen.getByRole('button', { name: /Nameless CantorHARD/ }))
    fireEvent.click(screen.getByRole('button', { name: 'BESTIARY' }))

    expect(onBestiary).toHaveBeenCalledWith(expect.objectContaining({ id: 'hall-of-unbound-names' }), 'nameless-cantor')
  })

  it('renders the Black Gate as a five-step Dungeon run without target or Threat controls', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    state.progress.bossKillsByBoss['unspoken-prelate'] = 1
    state.progress.bossKillsByBoss['sigil-warden'] = 1
    useGameStore.setState(state)
    renderNavigation()

    fireEvent.click(screen.getByRole('button', { name: 'Black Sigil Reach' }))
    fireEvent.click(screen.getByRole('button', { name: /The Black Gate, DUNGEON/ }))

    expect(screen.getByText('DUNGEON RUN')).toBeTruthy()
    expect(screen.getByText('5 FIXED STEPS')).toBeTruthy()
    expect(screen.getByText('World Tier 5')).toBeTruthy()
    expect(screen.queryByText('SELECT TARGET')).toBeNull()
    expect(screen.queryByText('ZONE AFFIX')).toBeNull()
    expect(screen.queryByText('AUTO HUNT')).toBeNull()
    expect(screen.queryByText(/THREAT/)).toBeNull()
  })

  it('keeps Zone Boss threat and Auto Hunt controls in the location inspector', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.combat.active = true
    state.combat.dungeonId = 'howling-den'
    useGameStore.setState(state)
    renderNavigation()
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, ELITE ZONE/ }))

    expect(screen.getByText('ELITE BOSS')).toBeTruthy()
    expect(screen.getByText('Corrupted Greatbear')).toBeTruthy()
    expect(screen.getByText('THREAT 0 / 10.0K')).toBeTruthy()
    expect(screen.getByText('10.0K THREAT TO BOSS')).toBeTruthy()
    expect(screen.queryByText(/MORE KILLS TO BOSS/)).toBeNull()
    const autoHunt = screen.getByRole('button', { name: 'AUTO HUNT OFF' })
    expect(autoHunt).toBeTruthy()

    fireEvent.click(autoHunt)
    expect(useGameStore.getState().progress.autoHuntBossByDungeon['howling-den']).toBe(true)
  })

  it('shows Zone Affix context in Howling Den target loot', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    useGameStore.setState(state)
    renderNavigation()
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, ELITE ZONE/ }))
    fireEvent.click(screen.getByRole('button', { name: /Bonehide BoarHARD/ }))
    fireEvent.click(screen.getByRole('button', { name: 'LOOT' }))

    expect(screen.getAllByText(/ZONE AFFIX/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/FRENZIED/)).toBeTruthy()
    expect(screen.queryByText(/MINOR AFFIX/)).toBeNull()
  })

  it('disables targeted Loot without a target and opens the selected target reward view', () => {
    renderNavigation()

    const loot = screen.getByRole('button', { name: 'LOOT' })
    expect(loot).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: /Cinder MothSTANDARD/ }))
    const enabledLoot = screen.getByRole('button', { name: 'LOOT' })
    expect(enabledLoot).not.toHaveProperty('disabled', true)
    fireEvent.click(enabledLoot)

    expect(screen.getByText('CINDER MOTH — LOOT')).toBeTruthy()
    expect(screen.getByText('ITEM DROPS')).toBeTruthy()
    expect(screen.getByText('RESONANCE')).toBeTruthy()
    expect(screen.getByText('+20')).toBeTruthy()
    expect(screen.queryByText('Shared loot pool from normal encounters.')).toBeNull()
  })

  it('disables targeted Bestiary until a target is selected', () => {
    renderNavigation()

    const bestiary = screen.getByRole('button', { name: 'BESTIARY' })
    expect(bestiary).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: /Forest WispEASY/ }))
    expect(screen.getByRole('button', { name: 'BESTIARY' })).not.toHaveProperty('disabled', true)
  })

  it('deep-links Bestiary to the selected targeted monster', () => {
    const onBestiary = vi.fn()
    render(<TooltipProvider><CombatWorldNavigation onSelectLocation={vi.fn()} onEnterLocation={vi.fn()} onHuntTarget={vi.fn(() => true)} onBestiary={onBestiary} onReturnToCombat={vi.fn()} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: /ThornlingEASY/ }))
    fireEvent.click(screen.getByRole('button', { name: 'BESTIARY' }))

    expect(onBestiary).toHaveBeenCalledWith(expect.objectContaining({ id: 'whispering-woods' }), 'thornling')
  })

  it('keeps location-level Loot for non-targeted locations', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    useGameStore.setState(state)
    renderNavigation()
    fireEvent.click(screen.getByRole('button', { name: /Abandoned Catacombs, DUNGEON/ }))
    fireEvent.click(screen.getByRole('button', { name: 'LOOT' }))

    expect(screen.getByText('LOCATION LOOT')).toBeTruthy()
    expect(screen.getByText('MONSTER LOOT')).toBeTruthy()
  })

  it('exposes the canonical manual Boss Engage action in the active Zone Boss section', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.targetEnemyId = 'forest-wisp'
    state.combat.threatCleared = 5000
    state.combat.activeSpellLoadout = { presetId: null, presetName: 'Test Loadout', slots: [{ spellId: 'fire-bolt', autoCast: false }], signature: 'fire-bolt:0' }
    useGameStore.setState(state)
    renderNavigation()

    expect(screen.getByRole('button', { name: 'ENGAGE BOSS' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'ENGAGE BOSS' }))

    expect(useGameStore.getState().combat.enemyId).toBe('forest-heart')
    expect(useGameStore.getState().combat.inBossFight).toBe(true)
  })
})
