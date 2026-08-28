import type { ReactNode } from 'react'

export interface FilterOption<T extends string> { value: T; label: ReactNode }

export function FilterBar<T extends string>({ options, value, onChange, ariaLabel }: { options: readonly FilterOption<T>[]; value: T; onChange: (value: T) => void; ariaLabel: string }) {
  return <div className="archive-filter-bar" role="tablist" aria-label={ariaLabel}>{options.map((option) => <button type="button" role="tab" aria-selected={value === option.value} className={`archive-filter-button${value === option.value ? ' active' : ''}`} key={option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>
}
