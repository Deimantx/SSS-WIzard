import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ToastStack } from './ToastStack'
import { useGameStore } from '../../store/gameStore'

describe('ToastStack', () => {
  afterEach(() => { useGameStore.getState().resetSave() })

  it('renders ordinary notifications without a close button', () => {
    useGameStore.setState({ notifications: [{ id: 'toast-test', text: 'A meaningful warning', tone: 'warning' }] })

    render(<ToastStack />)

    expect(screen.getByText('A meaningful warning')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
