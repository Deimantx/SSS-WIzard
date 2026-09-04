export interface LiveVisibilityTransition {
  hidden: boolean
  lastFrame: number
  shouldSaveSafetyAnchor: boolean
}

/** Same-document visibility only pauses live timing; it never creates bank time. */
export const getLiveVisibilityTransition = (hidden: boolean, now: number, lastFrame: number): LiveVisibilityTransition => hidden
  ? { hidden: true, lastFrame, shouldSaveSafetyAnchor: true }
  : { hidden: false, lastFrame: now, shouldSaveSafetyAnchor: false }
