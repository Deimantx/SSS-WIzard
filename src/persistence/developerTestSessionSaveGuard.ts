let developerTestSessionActive = false

/** Runtime-only interlock shared by DevTools and every gameplay save entry point. */
export const setDeveloperTestSessionSavePaused = (paused: boolean) => { developerTestSessionActive = paused }
export const isDeveloperTestSessionSavePaused = () => developerTestSessionActive
