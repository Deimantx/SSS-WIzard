const nativeInteractionSelector = 'input, textarea, select, [contenteditable="true"], [data-native-interaction="true"]'

export const isNativeInteractionTarget = (target: EventTarget | null) => {
  const element = target instanceof Element ? target : null
  return Boolean(element?.closest(nativeInteractionSelector))
}

export const isAllowedNativeDragTarget = (target: EventTarget | null) => {
  const element = target instanceof Element ? target : null
  return Boolean(element?.closest(`${nativeInteractionSelector}, [data-game-drag="true"]`))
}
