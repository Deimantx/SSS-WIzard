import { useState } from 'react'
import { Button, Card, Status } from '../../components/ui'
import { RECIPES, RECIPE_ORDER } from '../../game/content/recipes/recipes'
import { getRecipeStatus, getTransmutationEchoCapacity, getTransmutationEchoesAssigned } from '../../game/systems/transmutation/transmutationSelectors'
import type { RecipeId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperTransmutation() {
  const state = useGameStore()
  const [selected, setSelected] = useState<RecipeId>('fire-fragment')
  const recipe = RECIPES[selected]
  const job = state.activities.transmutation.jobs[selected]
  const echoes = job?.echoesAssigned ?? 0
  const assigned = getTransmutationEchoesAssigned(state)
  const capacity = getTransmutationEchoCapacity(state)
  const fixtureTarget = Math.min(capacity, assigned + 5)
  const setEchoes = useGameStore((game) => game.setTransmutationEchoes)
  const clear = useGameStore((game) => game.clearTransmutationAssignments)
  const grantIngredients = useGameStore((game) => game.grantTransmutationIngredients)
  const addMana = useGameStore((game) => game.addMana)
  const setCapacity = useGameStore((game) => game.setDebugTransmutationEchoCapacity)

  return <div className="developer-tab-grid">
    <Card title="Transmutation runtime">
      <div className="developer-summary-grid"><Summary label="Assigned Echoes" value={`${assigned} / ${capacity}`} /><Summary label="Active jobs" value={Object.values(state.activities.transmutation.jobs).filter((entry) => (entry?.echoesAssigned ?? 0) > 0).length} /><Summary label="Selected status" value={getRecipeStatus(state, recipe)} /><Summary label="Selected progress" value={`${Math.floor(job?.progressMs ?? 0)} / ${recipe.baseDurationMs} ms`} /></div>
      <div className="button-row"><Button variant="secondary" onClick={() => setEchoes(selected, 1)}>Assign one Echo</Button><Button variant="secondary" onClick={() => setEchoes(selected, fixtureTarget)}>Add fixture Echoes</Button><Button variant="ghost" onClick={clear}>Clear all assignments</Button></div>
    </Card>
    <Card title="Recipe fixture controls" className="developer-debug-card">
      <label>Recipe<select value={selected} onChange={(event) => setSelected(event.target.value as RecipeId)}>{RECIPE_ORDER.map((id) => <option key={id} value={id}>{RECIPES[id].name}</option>)}</select></label>
      <div className="button-row"><Button onClick={() => grantIngredients(selected)}>Grant ingredients</Button><Button onClick={() => addMana(100)}>Grant Mana</Button><Button variant="success" onClick={() => useGameStore.getState().completeTransmutationCycle(selected)}>DEBUG ONLY · Complete one cycle</Button></div>
      <p className="muted">Fixture actions are intentionally explicit so production, waiting-Mana, protected-stack, and multi-job states can be tested quickly.</p>
    </Card>
    <Card title="Echo capacity override">
      <NumberField label="Transmutation capacity" value={state.debug.transmutationEchoCapacityOverride ?? getTransmutationEchoCapacity({ activities: state.activities })} onChange={(value) => setCapacity(Math.max(0, Math.floor(value)))} />
      <div className="button-row"><Button variant="ghost" onClick={() => setCapacity(null)}>Reset authored cap</Button><Status tone={state.debug.transmutationEchoCapacityOverride === null ? 'neutral' : 'warning'}>{state.debug.transmutationEchoCapacityOverride === null ? 'AUTHORED CAP ACTIVE' : `OVERRIDE: ${state.debug.transmutationEchoCapacityOverride}`}</Status></div>
    </Card>
  </div>
}
