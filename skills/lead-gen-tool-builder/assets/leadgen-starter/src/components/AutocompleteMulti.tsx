import { useEffect, useRef, useState } from 'react'
import { autocomplete } from '../lib/api'
import { Search, X } from './icons'

interface Props {
  field: string
  placeholder?: string
  values: string[]
  onChange: (vals: string[]) => void
}

export default function AutocompleteMulti({ field, placeholder, values, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [opts, setOpts] = useState<{ label: string; value: string }[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) { setOpts([]); return }
    setLoading(true)
    const t = setTimeout(async () => {
      const res = await autocomplete(field, query.trim())
      setOpts(res.slice(0, 12))
      setLoading(false)
      setOpen(true)
    }, 220)
    return () => clearTimeout(t)
  }, [query, field])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const add = (v: string) => {
    if (!values.includes(v)) onChange([...values, v])
    setQuery('')
    setOpts([])
    setOpen(false)
  }
  const remove = (v: string) => onChange(values.filter((x) => x !== v))

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
          <Search />
        </span>
        <input
          className="zi-input pl-8"
          placeholder={placeholder || 'Search…'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => opts.length && setOpen(true)}
        />
      </div>

      {open && (opts.length > 0 || loading) && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-line bg-white shadow-pop">
          {loading && <div className="px-3 py-2 text-xs text-muted">Searching…</div>}
          {opts.map((o) => (
            <button
              key={o.value}
              onMouseDown={(e) => { e.preventDefault(); add(o.value) }}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-ink hover:bg-navy-50"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v} className="zi-chip">
              {v}
              <button onClick={() => remove(v)} className="text-navy-600 hover:text-coral">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
