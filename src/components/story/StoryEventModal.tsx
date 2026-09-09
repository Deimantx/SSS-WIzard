import { useEffect } from 'react'
import { ItemIcon } from '../ui/item'
import { ModalPortal } from '../ui'
import { dismissGameTooltips } from '../ui/tooltip/Tooltip'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { getActiveStoryEvent } from '../../game/systems/story/storyProgression'
import { ITEMS } from '../../game/content/items/items'
import { useGameStore } from '../../store/gameStore'

export function StoryEventModal() {
  const event = useGameStore((state) => getActiveStoryEvent(state))
  const completeStoryEvent = useGameStore((state) => state.completeStoryEvent)
  const { closeContextMenu } = useGameContextMenu()

  useEffect(() => {
    if (!event) return
    dismissGameTooltips()
    closeContextMenu()
  }, [closeContextMenu, event?.id])

  if (!event) return null
  const reward = event.rewards.find((entry) => entry.type === 'unique-item')
  const continueEvent = () => completeStoryEvent(event.id)
  return <ModalPortal open onClose={() => undefined} onEscape={() => undefined} onBackdropClick={() => undefined} backdropClassName="story-event-backdrop" surfaceClassName="story-event-modal" ariaLabelledBy="story-event-title" ariaDescribedBy="story-event-body">
    <div className="story-event-kicker">{event.presentation.kicker}</div>
    <h2 id="story-event-title">{event.presentation.title}</h2>
    <div id="story-event-body" className="story-event-body">{event.presentation.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
    {reward && <div className="story-event-block"><span>RELIC ACQUIRED</span><strong><ItemIcon itemId={reward.itemId} size="tiny" /> {ITEMS[reward.itemId].name} ×{reward.quantity}</strong></div>}
    {event.unlocks?.screens?.includes('tower-dark-portal') && <div className="story-event-block"><span>NEW TOWER CHAMBER</span><strong>Dark Portal</strong></div>}
    <div className="story-event-actions"><button type="button" className="button primary" data-autofocus="true" onClick={continueEvent}>CONTINUE</button></div>
  </ModalPortal>
}
