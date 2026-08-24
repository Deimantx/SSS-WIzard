import { useGameStore } from '../../store/gameStore'
import { Card } from '../../components/ui'

export function CombatLogPanel() { const log = useGameStore((state) => state.combat.log); return <Card title="Combat Log" className="log-card"><div className="combat-log">{log.length ? log.map((line, index) => <div key={`${line}-${index}`} className={index === 0 ? 'latest' : ''}><span>{String(log.length - index).padStart(2, '0')}</span>{line}</div>) : <div className="empty-state">Combat events will appear here.</div>}</div></Card> }
