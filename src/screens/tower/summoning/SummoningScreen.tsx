import type { CSSProperties } from 'react'
import { ScreenGrid } from '../../../components/layout/ScreenGrid'
import { Card, GameTooltip, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { GUARDIAN_IDS, GUARDIANS, type GuardianDefinition } from '../../../game/content/guardians/guardians'
import { getActiveGuardian, getSelectedGuardianId, isSummoningUnlocked } from '../../../game/systems/summoning/summoningSelectors'
import { useGameStore } from '../../../store/gameStore'
import { TowerFrame } from '../TowerFrame'
import { formatResourceAmount } from '../../../game/presentation/resources/resourcePresentation'

function formatInterval(intervalMs: number) {
  const seconds = intervalMs / 1000
  return `${seconds.toFixed(seconds % 1 === 0 ? 0 : 1)}s`
}

function GuardianGlyph({ guardian }: { guardian: GuardianDefinition }) {
  return <span className="summoning-guardian-glyph" aria-hidden="true">{guardian.ui.icon}</span>
}

function Stat({ label, value, description, accent = 'neutral' }: { label: string; value: string; description: string; accent?: 'neutral' | 'success' | 'warning' | 'elemental' }) {
  return <GameTooltip block accent={accent} content={<TooltipContent title={label} description={description} />}><span className="summoning-stat" tabIndex={0}><small>{label}</small><strong>{value}</strong></span></GameTooltip>
}

function BindingSummary({ selected, active }: { selected?: GuardianDefinition; active?: GuardianDefinition }) {
  const binding = active ?? selected
  const selectionChangedDuringCombat = Boolean(active && selected && active.id !== selected.id)
  return <Card className="summoning-binding-card" title="ACTIVE BINDING" action={<Status tone={active ? 'active' : selected ? 'success' : 'neutral'}>{active ? 'IN COMBAT' : selected ? 'READY' : 'UNBOUND'}</Status>}>
    <div className="summoning-binding-main">
      <span className="summoning-binding-icon" style={{ '--guardian-color': binding?.ui.color ?? 'var(--ui-accent)' } as CSSProperties}>{binding ? <GuardianGlyph guardian={binding} /> : '◇'}</span>
      <div>
        <span className="eyebrow">{active ? 'CURRENTLY SUMMONED' : selected ? 'SELECTED PREFERENCE' : 'NO GUARDIAN SELECTED'}</span>
        <h3>{binding?.name ?? 'Choose an Elemental Guardian'}</h3>
        <p>{selectionChangedDuringCombat ? `${selected!.name} is selected for the next encounter. ${active!.name} remains active until this encounter ends.` : active ? 'This snapshot remains for the current encounter.' : selected ? 'The selected Guardian will join the next valid enemy encounter.' : 'Bind one Guardian to add its attack and passive effect to combat.'}</p>
      </div>
    </div>
    {binding && <div className="summoning-binding-stats">
      <Stat label="LEVEL" value="1" description="Guardian level. The MVP begins every Guardian at Level 1." />
      <Stat label="RANK" value="I" description="Guardian rank. No Guardian upgrade economy is active in this MVP." />
      <Stat label="UPKEEP" value={`${formatResourceAmount(binding.manaPerSecond)} Mana / s`} description="Mana is consumed only while this Guardian is active in an encounter." accent="warning" />
      <Stat label="ATTACK" value={formatInterval(binding.attack.intervalMs)} description={`The Guardian attacks once every ${formatInterval(binding.attack.intervalMs)} through the combat effect resolver.`} accent="elemental" />
      <Stat label="PASSIVE" value={binding.passive.label} description={binding.passive.description} accent="success" />
    </div>}
  </Card>
}

function GuardianCard({ guardian, selected, onSelect }: { guardian: GuardianDefinition; selected: boolean; onSelect: () => void }) {
  return <article className={`summoning-guardian-card${selected ? ' is-selected' : ''}`} style={{ '--guardian-color': guardian.ui.color } as CSSProperties}>
    <button type="button" className="summoning-guardian-select" aria-pressed={selected} aria-label={`${selected ? 'Selected' : 'Select'} ${guardian.name}`} onClick={onSelect}>
      <span className="summoning-guardian-heading"><span className="summoning-guardian-icon"><GuardianGlyph guardian={guardian} /></span><span><span className="eyebrow">{guardian.element.toUpperCase()} · RANK I</span><strong>{guardian.name}</strong></span>{selected && <Status tone="active">SELECTED</Status>}</span>
      <span className="summoning-guardian-copy">A bound elemental presence that fights beside the Wizard without occupying a Spell slot.</span>
      <span className="summoning-stat-grid">
        <Stat label="LEVEL" value="1 / 1" description="Guardian level. Higher Guardian levels are not available in this MVP." />
        <Stat label="ATTACK" value={`${formatInterval(guardian.attack.intervalMs)} · ${Math.round(guardian.attack.spellPowerCoefficient * 100)}% SP`} description={`Deals ${Math.round(guardian.attack.spellPowerCoefficient * 100)}% of Wizard Spell Power as ${guardian.element} damage every ${formatInterval(guardian.attack.intervalMs)}.`} accent="elemental" />
        <Stat label="UPKEEP" value={`${formatResourceAmount(guardian.manaPerSecond)} Mana / s`} description="The active Guardian drains this amount of Mana per second. It fades when Mana reaches zero." accent="warning" />
        <Stat label="PASSIVE" value={guardian.passive.label} description={guardian.passive.description} accent="success" />
      </span>
      <span className="summoning-guardian-footer"><span>SNAPSHOT AT ENCOUNTER START</span><span>{selected ? 'BOUND' : 'SELECT GUARDIAN'}</span></span>
    </button>
  </article>
}

export function SummoningScreen() {
  const unlocked = useGameStore((state) => isSummoningUnlocked(state))
  const guardianState = useGameStore((state) => state.guardians)
  const combat = useGameStore((state) => state.combat)
  const selectGuardian = useGameStore((state) => state.selectGuardian)
  const selectedId = getSelectedGuardianId({ guardians: guardianState })
  const selected = selectedId ? GUARDIANS[selectedId] : undefined
  const active = getActiveGuardian({ combat })

  if (!unlocked) return null

  return <TowerFrame className="summoning-screen" eyebrow="WIZARD TOWER · SUMMONING" title="Summoning" description="Bind a single elemental companion to fight beside your Wizard and strengthen the tower’s combat rhythm.">
    <div className="summoning-unlock-strip"><span className="summoning-strip-icon" aria-hidden="true">✦</span><div><span className="eyebrow">GATEKEEPER’S LEGACY</span><strong>Summoning chamber restored</strong><p>The corrupted elemental Gatekeeper revealed the binding rite. Choose your Guardian before your next encounter.</p></div><Status tone="success">UNLOCKED</Status></div>
    <ScreenGrid screen="tower-summoning" panels={[
      { id: 'summoning-binding', content: <BindingSummary selected={selected} active={active} /> },
      { id: 'summoning-roster', content: <Card title="ELEMENTAL GUARDIANS" action={<span className="summoning-count">{GUARDIAN_IDS.length} AVAILABLE · 1 SELECTED</span>}><p className="muted">Each Guardian has a distinct attack rhythm and one always-on passive while summoned.</p><div className="summoning-guardian-grid">{GUARDIAN_IDS.map((id) => <GuardianCard key={id} guardian={GUARDIANS[id]} selected={selectedId === id} onSelect={() => selectGuardian(id)} />)}</div></Card> },
    ]} />
  </TowerFrame>
}
