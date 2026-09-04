import { useEffect } from 'react'
import { isUiAudioAvailable, unlockUiAudio, playUiSound } from './audio/uiAudioEngine'

const INTERACTIVE_SELECTOR = [
  '.button', '.nav-item', '.nav-group-header', '.quick-card', '.transmutation-recipe-tile', '.inventory-item', '.equipment-armory-card', '.equipment-slot-card',
  '.research-item-tile', '.spell-browser-tile', '.spell-preset-card', '.spell-preset-available-tile', '.transmutation-assignment-row', '.transmutation-ring-choice',
  '.activity-card', '.activity-mini-summary', '.dungeon-atlas-list-item', '.inventory-recent-item', '.inventory-use-row', '.inventory-need-row', '.theme-choice', '.preference-choice',
].join(',')
const EXCLUDED_SELECTOR = '.modal-portal-backdrop, .modal-portal-surface, .game-tooltip, .layout-editor-drawer, .developer-tools-window, .toast-stack, .layout-editor-notice-toast'
const ACTION_FEEDBACK_SELECTOR = '.inventory-actions-card .inventory-action-header-button, .inventory-actions-card .inventory-action-sell, .inventory-actions-card [aria-label="Confirm destroy"], .equipment-inspector-actions .button, .spell-autocast-control, .spell-combat-auto, .echo-counter .button, .transmutation-echo-control .button, .transmutation-assignment-row .button, .transmutation-active-heading .button'

const getInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return null
  const element = target.closest<HTMLElement>(INTERACTIVE_SELECTOR)
  if (!element || element.closest(EXCLUDED_SELECTOR) || element.matches(':disabled,[aria-disabled="true"]')) return null
  return element
}

const clearPointerLight = (element: HTMLElement | null) => {
  if (!element) return
  element.removeAttribute('data-pointer-lit')
  element.style.removeProperty('--pointer-x')
  element.style.removeProperty('--pointer-y')
}

export function GameFeelInteractionLayer() {
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.game-shell')
    if (!shell) return
    let pointerTarget: HTMLElement | null = null
    let lastHoverTarget: HTMLElement | null = null
    let lastHoverAt = 0
    let lastClickAt = 0
    const finePointer = () => typeof window.matchMedia !== 'function' || window.matchMedia('(pointer: fine)').matches
    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer() || (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return
      const next = getInteractiveTarget(event.target)
      if (next !== pointerTarget) { clearPointerLight(pointerTarget); pointerTarget = next }
      if (!next) return
      const rect = next.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      next.setAttribute('data-pointer-lit', 'true')
      next.style.setProperty('--pointer-x', `${Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))}%`)
      next.style.setProperty('--pointer-y', `${Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))}%`)
    }
    const onPointerLeave = () => { clearPointerLight(pointerTarget); pointerTarget = null }
    const onPointerOver = (event: PointerEvent) => {
      if (!finePointer() || (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return
      const target = getInteractiveTarget(event.target)
      if (!target) return
      if (target.dataset.uiSound === 'none' || target.matches(ACTION_FEEDBACK_SELECTOR)) return
      const now = performance.now()
      if (target === lastHoverTarget && now - lastHoverAt < 80) return
      lastHoverTarget = target
      lastHoverAt = now
      if (isUiAudioAvailable()) { unlockUiAudio(); playUiSound('hover') }
    }
    const onPointerDown = () => { if (isUiAudioAvailable()) unlockUiAudio() }
    const onClick = (event: MouseEvent) => {
      const target = getInteractiveTarget(event.target)
      if (!target) return
      const now = performance.now()
      if (now - lastClickAt < 55) return
      lastClickAt = now
      if (isUiAudioAvailable()) {
        unlockUiAudio()
        const explicit = target.dataset.uiSound
        playUiSound(explicit === 'confirm' || target.matches('.button.primary,.button.success,.button.danger') ? 'confirm' : 'click')
      }
    }
    shell.addEventListener('pointermove', onPointerMove)
    shell.addEventListener('pointerleave', onPointerLeave)
    const audioAvailable = isUiAudioAvailable()
    if (audioAvailable) {
      shell.addEventListener('pointerover', onPointerOver)
      shell.addEventListener('pointerdown', onPointerDown)
      shell.addEventListener('click', onClick)
    }
    return () => { clearPointerLight(pointerTarget); shell.removeEventListener('pointermove', onPointerMove); shell.removeEventListener('pointerleave', onPointerLeave); if (audioAvailable) { shell.removeEventListener('pointerover', onPointerOver); shell.removeEventListener('pointerdown', onPointerDown); shell.removeEventListener('click', onClick) } }
  }, [])
  return null
}
