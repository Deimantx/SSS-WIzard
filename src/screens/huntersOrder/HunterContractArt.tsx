import { Map, PawPrint, Sparkles, Users } from 'lucide-react'
import type { HunterContractState, GameState, MonsterId } from '../../game/types'
import { MONSTERS } from '../../game/content/monsters'
import { getEligibleHunterContractMembers } from '../../game/systems/huntersOrder/huntersOrderRuntime'
import { MonsterPortrait } from '../combat/MonsterPortrait'

export function HunterContractArt({ contract, state, className = '' }: { contract: HunterContractState; state: Pick<GameState, 'progress'>; className?: string }) {
  const spec = contract.targetSpec
  if (spec.type === 'monster' || spec.type === 'boss') return <span className={`hunter-contract-art is-exact ${className}`}><MonsterPortrait monster={MONSTERS[spec.monsterId]} boss={spec.type === 'boss'} /></span>
  const members = getEligibleHunterContractMembers(state, contract, 'hunters-ground').slice(0, 3) as MonsterId[]
  if (spec.type === 'family') return <span className={`hunter-contract-art is-family ${className}`}>{members.length ? members.map((id) => <MonsterPortrait key={id} monster={MONSTERS[id]} />) : <PawPrint size={26} />}</span>
  if (spec.type === 'alignment') return <span className={`hunter-contract-art is-alignment ${className}`}><Sparkles size={25} /></span>
  if (spec.type === 'region') return <span className={`hunter-contract-art is-region ${className}`}><Map size={25} /><small>{members.length} quarry</small></span>
  return <span className={`hunter-contract-art is-family ${className}`}><Users size={25} /></span>
}
