import { EVENT_OPTIONS } from '../config/filters'

interface EventsValue {
  values: string[]
  lastOccurrence: number
}

interface Props {
  value: EventsValue | undefined
  onChange: (v: EventsValue) => void
}

// Explorium events filter: pick event types + a recency window (30–120 days).
export default function EventsPicker({ value, onChange }: Props) {
  const v: EventsValue = value || { values: [], lastOccurrence: 90 }
  const toggle = (ev: string) =>
    onChange({
      ...v,
      values: v.values.includes(ev) ? v.values.filter((x) => x !== ev) : [...v.values, ev],
    })

  return (
    <div>
      <div className="mb-3">
        <div className="mb-1 text-xs font-semibold text-muted">Occurred within the last</div>
        <div className="flex items-center gap-2">
          <input
            type="range" min={30} max={120} step={10}
            value={v.lastOccurrence}
            onChange={(e) => onChange({ ...v, lastOccurrence: Number(e.target.value) })}
            className="flex-1 accent-coral"
          />
          <span className="w-16 text-right text-sm font-semibold text-navy-900">{v.lastOccurrence} days</span>
        </div>
      </div>
      <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
        {EVENT_OPTIONS.map((o) => {
          const checked = v.values.includes(o.value)
          return (
            <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
              <input type="checkbox" checked={checked} onChange={() => toggle(o.value)}
                className="h-4 w-4 rounded border-line accent-navy" />
              <span className={checked ? 'font-medium text-navy-700' : ''}>{o.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
