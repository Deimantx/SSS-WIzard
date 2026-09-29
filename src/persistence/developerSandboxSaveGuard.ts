let developerSandboxActive = false

export const setDeveloperSandboxSavePaused = (paused: boolean) => { developerSandboxActive = paused }
export const isDeveloperSandboxSavePaused = () => developerSandboxActive
