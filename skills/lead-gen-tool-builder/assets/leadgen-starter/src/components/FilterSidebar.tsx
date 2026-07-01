import { useEffect, useState } from 'react'
import { filtersFor, valueCount, FilterDef } from '../config/filters'
import type { Mode } from '../lib/api'
import AutocompleteMulti from './AutocompleteMulti'
import TextMulti from './TextMulti'
import EventsPicker from './EventsPicker'
import { Chevron, Pin, Search } from './icons'

interface Props {
  mode: Mode
  values: Record<string, any>
  setValue: (key: string, val: any) => void
  pinned: string[]
  togglePin: (key: string) => void
  onClear: () => void
  activeCount: number
  onSearch: () => void
  searching: boolean
}

// Searchable checkbox list (used for Country).
function SearchCheckbox({ def, value, setValue }: { def: FilterDef; value: string[]; setValue: (v: string[]) => void }) {
  const [q, setQ] = useState('')
  const arr = value || []
  const toggle = (v: string) => setValue(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const filtered = def.options!.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <input className="zi-input mb-2" placeholder={def.hint || 'Type to search…'} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
        {filtered.map((o) => {
          const checked = arr.includes(o.value)
          return (
            <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
              <input type="checkbox" checked={checked} onChange={() => toggle(o.value)} className="h-4 w-4 rounded border-line accent-navy" />
              <span className={checked ? 'font-medium text-navy-700' : ''}>{o.label}</span>
            </label>
          )
        })}
        {filtered.length === 0 && <div className="text-xs text-muted">No matches</div>}
      </div>
    </div>
  )
}

function CheckboxList({ def, value, setValue }: { def: FilterDef; value: string[]; setValue: (v: string[]) => void }) {
  const arr = value || []
  const toggle = (v: string) => setValue(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  return (
    <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
      {def.options!.map((o) => {
        const checked = arr.includes(o.value)
        return (
          <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" checked={checked} onChange={() => toggle(o.value)} className="h-4 w-4 rounded border-line accent-navy" />
            <span className={checked ? 'font-medium text-navy-700' : ''}>{o.label}</span>
          </label>
        )
      })}
    </div>
  )
}

function Toggle({ value, setValue, hint }: { value: any; setValue: (v: any) => void; hint?: string }) {
  const on = value === true
  return (
    <button onClick={() => setValue(!on)} className="flex items-center gap-2.5 text-sm text-ink">
      <span className={`relative h-5 w-9 rounded-full transition ${on ? 'bg-coral' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      {hint || 'Enabled'}
    </button>
  )
}

function Control({ def, value, setValue }: { def: FilterDef; value: any; setValue: (v: any) => void }) {
  switch (def.type) {
    case 'autocomplete':
      return <AutocompleteMulti field={def.acField!} placeholder={def.hint} values={value || []} onChange={setValue} />
    case 'textMulti':
      return <TextMulti values={value || []} onChange={setValue} placeholder={def.hint} />
    case 'searchCheckbox':
      return <SearchCheckbox def={def} value={value || []} setValue={setValue} />
    case 'checkbox':
      return <CheckboxList def={def} value={value || []} setValue={setValue} />
    case 'toggle':
      return <Toggle value={value} setValue={setValue} hint={def.hint} />
    case 'events':
      return <EventsPicker value={value} onChange={setValue} />
    default:
      return null
  }
}

export default function FilterSidebar({ mode, values, setValue, pinned, togglePin, onClear, activeCount, onSearch, searching }: Props) {
  const defs = filtersFor(mode)
  const [open, setOpen] = useState<Record<string, boolean>>({})

  // All filters start collapsed; each expands on click (dropdown behavior).
  useEffect(() => {
    setOpen({})
  }, [mode])

  const toggleOpen = (k: string) => setOpen((s) => ({ ...s, [k]: !s[k] }))
  const clearOne = (def: FilterDef) => {
    if (def.type === 'toggleGroup') (def.toggles || []).forEach((t) => setValue(t.key, undefined))
    else setValue(def.key, undefined)
  }

  // Pinned filters float to the top.
  const sorted = [...defs].sort((a, b) => Number(pinned.includes(b.key)) - Number(pinned.includes(a.key)))

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-r border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="text-sm font-bold text-navy-900">Filters</div>
        <button onClick={onClear} disabled={activeCount === 0}
          className="text-xs font-semibold text-coral hover:text-coral-600 disabled:text-muted/50">
          Clear all{activeCount ? ` (${activeCount})` : ''}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sorted.map((def) => {
          const count =
            def.type === 'toggleGroup'
              ? (def.toggles || []).filter((t) => values[t.key] === true).length
              : valueCount(values[def.key])
          const isOpen = !!open[def.key]
          const isPinned = pinned.includes(def.key)
          return (
            <div key={def.key + mode} className="border-b border-line">
              <button
                onClick={() => toggleOpen(def.key)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-panel/60"
              >
                <span className="flex-1 text-sm font-semibold text-ink">{def.label}</span>
                {count > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1.5 text-[11px] font-bold text-white">
                    {count}
                  </span>
                )}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); togglePin(def.key) }}
                  title={isPinned ? 'Unpin' : 'Pin filter'}
                  className={`transition ${isPinned ? 'text-coral' : 'text-line hover:text-navy-600'}`}
                >
                  <Pin filled={isPinned} />
                </span>
                <span className="text-muted"><Chevron open={isOpen} /></span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4">
                  {def.type === 'toggleGroup' ? (
                    <div className="space-y-3">
                      {(def.toggles || []).map((t) => (
                        <Toggle key={t.key} value={values[t.key]} setValue={(v) => setValue(t.key, v)} hint={t.label} />
                      ))}
                    </div>
                  ) : (
                    <Control def={def} value={values[def.key]} setValue={(v) => setValue(def.key, v)} />
                  )}
                  {def.note && <div className="mt-2 text-[11px] text-muted">{def.note}</div>}
                  {count > 0 && (
                    <button onClick={() => clearOne(def)} className="mt-2 text-xs font-semibold text-coral hover:text-coral-600">
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-line bg-white p-3">
        <button onClick={onSearch} disabled={searching} className="zi-btn-coral w-full disabled:opacity-70">
          <Search />
          {searching ? 'Searching…' : `Generate ${mode === 'companies' ? 'companies' : 'prospects'}`}
        </button>
      </div>
    </aside>
  )
}
