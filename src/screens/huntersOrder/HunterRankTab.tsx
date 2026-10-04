import { useState } from 'react'
import { BookOpen, Compass, Crown, Eye, Footprints, Map, Medal, PawPrint, ScrollText, Shield, ShieldCheck, Sparkles, Target, Trophy, Wrench } from 'lucide-react'
import { Button, Card, GameTooltip } from '../../components/ui'
import { HUNTER_STANDINGS } from '../../game/content/hunters-order/hunterRanks'
import { getHunterRankPresentation } from '../../game/presentation/huntersOrder/hunterPresentation'
import type { GameState, HunterRankId } from '../../game/types'

const categories: { id: HunterRankId; Icon: typeof Target }[] = [
  { id: 'tracker', Icon: Footprints }, { id: 'scout', Icon: Compass }, { id: 'stalker', Icon: Eye }, { id: 'warden', Icon: Shield }, { id: 'veteran', Icon: Medal }, { id: 'master-hunter', Icon: Crown },
]
const benefitIcon = (label: string) => /family|quarry/i.test(label) ? PawPrint : /alignment|special/i.test(label) ? Sparkles : /ground/i.test(label) ? Map : /block|trail|route/i.test(label) ? ShieldCheck : /upgrade|service|privilege|reroll|marks|pockets|kit/i.test(label) ? Wrench : /board|contract|assignment/i.test(label) ? ScrollText : BookOpen

export function HunterRankTab({ state }: { state: GameState }) {
  const presentation = getHunterRankPresentation(state)
  const [categoryId, setCategoryId] = useState<HunterRankId>(presentation.currentRank.id)
  const [selectedStandingId, setSelectedStandingId] = useState<string>(presentation.currentStanding.id)
  const category = presentation.categories.find((entry) => entry.id === categoryId) ?? presentation.categories[0]
  const grades = HUNTER_STANDINGS.filter((standing) => standing.rankId === categoryId).map((standing) => ({ ...standing, reached: presentation.reputation >= standing.reputation, current: standing.id === presentation.currentStanding.id, selected: standing.id === selectedStandingId }))
  const selected = grades.find((standing) => standing.id === selectedStandingId) ?? grades.find((standing) => standing.current) ?? grades[0]
  const reached = selected.reached
  return <div className="hunter-rank-v3">
    <Card className="hunter-rank-dossier">
      <div className="hunter-overview-kicker"><Shield size={15} /> HUNTER STANDING REGISTER</div>
      <div className="hunter-rank-hero"><span><Trophy size={23} /></span><div><small>CURRENT STANDING</small><h2>{presentation.currentStanding.name}</h2></div><strong>{presentation.progressPercent}%</strong></div>
      <div className="hunter-rank-path"><span>{presentation.currentStanding.name}</span><i aria-hidden="true">›</i><strong>{presentation.nextStanding?.name ?? 'Order cap reached'}</strong></div>
      <div className="hunter-overview-progress-label"><b>{presentation.reputation.toLocaleString()} / {presentation.nextStanding?.reputation.toLocaleString() ?? presentation.reputation.toLocaleString()} Reputation</b><span>{presentation.remaining.toLocaleString()} remaining</span></div>
      <div className="hunter-progress-track"><span style={{ width: `${presentation.progressPercent}%` }} /></div>
      <div className="hunter-rank-category-grid" aria-label="Hunter rank categories">{categories.map(({ id, Icon }) => { const entry = presentation.categories.find((rank) => rank.id === id)!; return <Button key={id} variant="ghost" className={`hunter-rank-category ${entry.current ? 'is-current' : ''} ${categoryId === id ? 'is-selected' : ''}`} aria-pressed={categoryId === id} onClick={() => { setCategoryId(id); setSelectedStandingId(HUNTER_STANDINGS.find((standing) => standing.rankId === id)?.id ?? `${id}-1`) }}><Icon size={17} /><span>{entry.name}</span><small>{entry.reputation.toLocaleString()}+</small></Button> })}</div>
      <section className="hunter-standing-register"><header><div><span className="hunter-card-kicker">CATEGORY STANDINGS</span><h3>{category.name}</h3></div><span>{category.current ? 'CURRENT CATEGORY' : category.reached ? 'REACHED' : 'LOCKED'}</span></header>
        <div className="hunter-standing-grade-list">{grades.map((standing) => { const stateLabel = standing.current ? 'CURRENT' : standing.reached ? 'REACHED' : 'LOCKED'; return <GameTooltip key={standing.id} content={`${standing.name} · ${standing.reputation.toLocaleString()} Hunter Reputation · ${stateLabel}`}><Button variant="ghost" className={`hunter-standing-grade ${standing.current ? 'is-current' : ''} ${standing.selected ? 'is-selected' : ''} ${standing.reached ? 'is-reached' : 'is-locked'}`} aria-pressed={standing.selected} onClick={() => setSelectedStandingId(standing.id)}><strong>{standing.name}</strong><span>{standing.reputation.toLocaleString()} REP</span><i>{stateLabel}</i></Button></GameTooltip> })}</div>
      </section>
      <div className="hunter-rank-detail"><div><span>{selected.current ? 'CURRENT STANDING' : reached ? 'STANDING RECORD' : 'LOCKED STANDING'}</span><h3>{selected.name}</h3><strong>{selected.reputation.toLocaleString()} Reputation</strong></div><div className="hunter-rank-unlock-tiles" aria-label={`${selected.name} unlocks`}>{selected.unlocks.map((item) => { const Icon = benefitIcon(item); return <div className="hunter-rank-unlock-tile" key={item}><span><Icon size={15} /></span><strong>{item}</strong></div> })}</div></div>
    </Card>
    <aside className="hunter-rank-side"><Card><div className="hunter-overview-kicker"><Medal size={15} /> NEXT STANDING</div><h3>{presentation.nextStanding?.name ?? 'Master Hunter V'}</h3><div className="hunter-benefit-tiles">{(presentation.nextStanding ?? selected).unlocks.map((item) => { const Icon = benefitIcon(item); return <div key={item}><span><Icon size={14} /></span><strong>{item}</strong></div> })}</div></Card><Card className="hunter-rank-stats"><div><span>CONTRACTS COMPLETED</span><strong>{state.progress.huntersOrder.totalContractsCompleted}</strong></div><div><span>HUNTER MARKS</span><strong>{state.progress.huntersOrder.hunterMarks}</strong></div><div><span>BOARD CHOICES</span><strong>{state.progress.huntersOrder.availableContracts.length}</strong></div></Card></aside>
  </div>
}
