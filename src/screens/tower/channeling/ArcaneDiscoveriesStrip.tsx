import { Sparkles } from 'lucide-react'
import { Button } from '../../../components/ui'

export function ArcaneDiscoveriesStrip({ completed, total, onOpen }: { completed: number; total: number; onOpen: () => void }) {
  return <section className="channeling-discoveries-strip"><div className="channeling-discoveries-strip-icon"><Sparkles size={17} /></div><div><span className="eyebrow">ARCANE DISCOVERIES</span><strong>{completed} / {total} discovered</strong><p>Milestones reveal new ways for the Channeling Chamber to grow.</p></div><Button variant="secondary" onClick={onOpen}>Arcane Discoveries {completed}/{total}</Button></section>
}
