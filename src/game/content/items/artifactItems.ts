import { mergeItemRegistries } from './itemAuthoring'
import { TIER1_ARTIFACT_ITEMS } from './tier1ArtifactItems'
import { TIER2_ARTIFACT_ITEMS } from './tier2ArtifactItems'

/** Finished Artifact Equipment chassis, authored by Artifact progression tier. */
export const ARTIFACT_ITEMS = mergeItemRegistries(TIER1_ARTIFACT_ITEMS, TIER2_ARTIFACT_ITEMS)
