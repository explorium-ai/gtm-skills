import { useEffect, useState } from 'react'
import { getMapping, type MappingField } from '../lib/api'
import { X } from './icons'

interface Props {
  crm: 'salesforce' | 'hubspot'
  entity: 'company' | 'prospect'
  recordCount: number
  sample: any | null // first selected record, for value preview
  onConfirm: (mapping: MappingField[]) => void
  onClose: () => void
  pushing: boolean
}

const CRM_META = {
  salesforce: { name: 'Salesforce', color: '#00a1e0' },
  hubspot: { name: 'HubSpot', color: '#ff7a59' },
}

export default function CrmMappingModal({ crm, entity, recordCount, sample, onConfirm, onClose, pushing }: Props) {
  const [fields, setFields] = useState<MappingField[]>([])
  const [loading, setLoading] = useState(true)
  const meta = CRM_META[crm]

  useEffect(() => {
    let alive = true
    setLoading(true)
    getMapping(crm, entity)
      .then((m) => { if (alive) { setFields(m.fields.map((f) => ({ ...f, enabled: true }))); setLoading(false) } })
      .catch(() => alive && setLoading(false))
    return () => { alive = false }
  }, [crm, entity])

  const object =
    crm === 'salesforce' ? (entity === 'prospect' ? 'Lead' : 'Account') : entity === 'prospect' ? 'Contact' : 'Company'

  const toggle = (i: number) =>
    setFields((fs) => fs.map((f, j) => (j === i ? { ...f, enabled: f.enabled === false } : f)))
  const setTarget = (i: number, target: string) =>
    setFields((fs) => fs.map((f, j) => (j === i ? { ...f, target } : f)))

  const previewVal = (f: MappingField) =>
    f.value !== undefined ? f.value : sample ? sample[f.source ?? ''] ?? '' : ''

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/40 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <div className="text-base font-bold text-navy-900">
              Sync to {meta.name} · <span style={{ color: meta.color }}>{object}</span>
            </div>
            <div className="text-xs text-muted">
              Map fields for {recordCount} {entity === 'prospect' ? 'contact' : 'company'}{recordCount === 1 ? '' : 's'}. Toggle fields and edit the target {meta.name} field.
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={16} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted">Loading field map…</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="w-8 py-2"></th>
                  <th className="py-2 text-left">Source field</th>
                  <th className="py-2 text-left">→ {meta.name} field</th>
                  <th className="py-2 text-left">Sample value</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f, i) => {
                  const on = f.enabled !== false
                  return (
                    <tr key={f.target + i} className="border-t border-line">
                      <td className="py-2">
                        <input type="checkbox" checked={on} disabled={f.required}
                          onChange={() => toggle(i)} className="h-4 w-4 rounded border-line accent-navy" />
                      </td>
                      <td className="py-2 pr-3">
                        <span className={on ? 'text-ink' : 'text-muted/60'}>{f.label}</span>
                        {f.required && <span className="ml-1 text-[10px] font-bold text-coral">REQ</span>}
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          value={f.target}
                          disabled={!on}
                          onChange={(e) => setTarget(i, e.target.value)}
                          className="w-full rounded border border-line px-2 py-1 text-xs font-mono text-navy-700 disabled:bg-panel disabled:text-muted/50"
                        />
                      </td>
                      <td className="py-2 max-w-[160px] truncate text-xs text-muted">{String(previewVal(f) || '—')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {entity === 'prospect' && (
            <div className="mt-3 rounded-md bg-navy-50 px-3 py-2 text-[12px] text-navy-700">
              Email & phone are enriched from Explorium at push time for contacts that don't have them yet.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-5 py-3">
          <button onClick={onClose} className="zi-btn-ghost">Cancel</button>
          <button
            onClick={() => onConfirm(fields.filter((f) => f.enabled !== false))}
            disabled={pushing || loading}
            className="zi-btn text-white disabled:opacity-60"
            style={{ backgroundColor: meta.color }}
          >
            {pushing ? 'Syncing…' : `Sync ${recordCount} to ${meta.name}`}
          </button>
        </div>
      </div>
    </div>
  )
}
