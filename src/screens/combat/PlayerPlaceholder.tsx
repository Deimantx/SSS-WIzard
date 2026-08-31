import { Shield, Sparkles, WandSparkles } from 'lucide-react'

/** Temporary composition asset; replace with final player portrait art. */
export function PlayerPlaceholder() {
  return <div className="player-placeholder" role="img" aria-label="Temporary player wizard visual placeholder"><span className="player-placeholder-aura" /><div className="player-placeholder-sigil"><Sparkles size={22} aria-hidden="true" /><WandSparkles size={51} strokeWidth={1.1} aria-hidden="true" /><Shield size={18} strokeWidth={1.1} aria-hidden="true" /></div></div>
}
