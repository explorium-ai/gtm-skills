import { useState } from 'react'
import { X } from './icons'

interface Props {
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}

// Free-text chip input: type a value, press Enter (or comma) to add.
export default function TextMulti({ values, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setDraft('')
  }
  return (
    <div>
      <input
        className="zi-input"
        placeholder={placeholder || 'Type and press Enter…'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
        }}
        onBlur={add}
      />
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v} className="zi-chip">
              {v}
              <button onClick={() => onChange(values.filter((x) => x !== v))} className="text-navy-600 hover:text-coral">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
