import { useEffect, useRef, useState, type ReactNode } from 'react'

export type GameValueTone = 'neutral' | 'health' | 'focus' | 'mana' | 'success'

interface GameValueProps {
  value: number
  formatted: ReactNode
  tone?: GameValueTone
  className?: string
}

interface ValuePulse {
  direction: 'increased' | 'decreased'
  key: number
}

export function GameValue({ value, formatted, tone = 'neutral', className = '' }: GameValueProps) {
  const previous = useRef<number | undefined>(undefined)
  const pulseSerial = useRef(0)
  const [pulse, setPulse] = useState<ValuePulse | null>(null)

  useEffect(() => {
    const before = previous.current
    previous.current = value
    if (before === undefined || before === value) return
    const direction = value > before ? 'increased' : 'decreased'
    const key = ++pulseSerial.current
    setPulse({ direction, key })
    const timeout = window.setTimeout(() => setPulse(null), 300)
    return () => window.clearTimeout(timeout)
  }, [value])

  const pulseClass = pulse ? `value-changed value-${pulse.direction}` : ''
  return <span key={pulse?.key ?? 'stable'} className={`game-value game-value-${tone} ${pulseClass} ${className}`.trim()}>{formatted}</span>
}
