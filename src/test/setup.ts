import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { discardDeveloperSandboxSnapshot, restoreAndExitDeveloperSandbox } from '../devtools/developerSandbox'
import { clearDeveloperSandbox, getDeveloperToolsState } from '../devtools/developerToolsStore'

afterEach(() => {
  cleanup()
  if (getDeveloperToolsState().sandbox.active) {
    if (!restoreAndExitDeveloperSandbox()) clearDeveloperSandbox()
  } else discardDeveloperSandboxSnapshot()
})
