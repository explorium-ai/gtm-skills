import { filtersFor, EVENT_OPTIONS } from '../config/filters'
import type { Mode } from '../lib/api'
import { X } from './icons'

interface Props {
  mode: Mode
  values: Record<string, any>
  removeValue: (key: string, val?: string) => void
}

const eventLabel = (v: string) => EVENT_OPTIONS.find((o) => o.value === v)?.label || v

export default function ActiveFilterChips({ mode, values, removeValue }: Props) {
  const defs = filtersFor(mode)
  const chips: { key: string; label: string; value?: string }[] = []

  for (const def of defs) {
    if (def.type === 'toggleGroup') {
      ;(def.toggles || []).forEach((t) => {
        if (values[t.key] === true) chips.push({ key: t.key, label: t.label })
      })
      continue
    }
    const v = values[def.key]
    if (v == null) continue
    if (def.key === 'events' && Array.isArray(v.values)) {
      v.values.forEach((ev: string) =>
        chips.push({ key: def.key, label: `Event: ${eventLabel(ev)}`, value: ev })
      )
    } else if (Array.isArray(v)) {
      v.forEach((item: string) => chips.push({ key: def.key, label: `${def.label}: ${item}`, value: item }))
    } else if (v === true) {
      chips.push({ key: def.key, label: def.label })
    }
  }

  if (chips.length === 0)
    return <div className="text-sm text-muted">No filters applied — refine your search on the left.</div>

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c, i) => (
        <span key={c.key + i} className="zi-chip">
          {c.label}
          <button onClick={() => removeValue(c.key, c.value)} className="text-navy-600 hover:text-coral">
            <X size={11} />
          </button>
        </span>
      ))}
    </div>
  )
}
