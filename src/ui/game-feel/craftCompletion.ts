import type { ItemDefinition } from '../../game/types'
import type { UiSoundName } from './audio/uiAudioEngine'

export const didTransmutationCycleWrap = ({ previousProgress, currentProgress, durationMs, acolytes, running }: { previousProgress: number | null; currentProgress: number; durationMs: number; acolytes: number; running: boolean }) => {
  if (previousProgress === null || acolytes <= 0 || !running) return false
  if (currentProgress >= previousProgress) return false
  return previousProgress > durationMs * 0.76 && currentProgress <= durationMs * 0.45
}

export const getTransmutationCompletionSound = (itemKind: ItemDefinition['kind']): UiSoundName | false => itemKind === 'equipment' ? 'craft' : false
