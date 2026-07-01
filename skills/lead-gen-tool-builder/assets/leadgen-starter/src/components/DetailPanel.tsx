import type { Company, Mode, Prospect } from '../lib/api'
import { Building, Person, X } from './icons'

interface Props {
  mode: Mode
  row: any | null
  onClose: () => void
}

const cap = (s?: string | null) => (s ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : '—')

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="border-b border-line py-2.5">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 break-words text-sm text-ink">{value || '—'}</div>
    </div>
  )
}

export default function DetailPanel({ mode, row, onClose }: Props) {
  if (!row) return null
  const isCompany = mode === 'companies'
  const c = row as Company
  const p = row as Prospect

  return (
    <div className="zi-slide-in flex h-full w-[360px] shrink-0 flex-col border-l border-line bg-white shadow-panel">
      <div className="flex items-start justify-between border-b border-line bg-panel/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-navy-50 text-navy-700">
            {isCompany ? <Building /> : <Person />}
          </span>
          <div>
            <div className="text-[15px] font-bold text-navy-900">
              {isCompany ? c.name : p.fullName}
            </div>
            <div className="text-xs text-muted">
              {isCompany ? c.domain : cap(p.jobTitle)}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-muted hover:text-ink"><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {isCompany ? (
          <>
            <Field label="Industry" value={cap(c.industry)} />
            <Field label="Employees" value={c.employees} />
            <Field label="Revenue" value={c.revenue} />
            <Field label="Headquarters" value={[cap(c.city), cap(c.region), cap(c.country)].filter((x) => x !== '—').join(', ')} />
            <Field label="Website" value={c.website} />
            <Field label="LinkedIn" value={c.linkedin} />
            <Field label="Description" value={c.description} />
          </>
        ) : (
          <>
            <Field label="Company" value={p.companyName} />
            <Field label="Management Level" value={cap(p.jobLevel)} />
            <Field label="Department" value={cap(p.jobDepartment)} />
            <Field label="Location" value={[cap(p.city), cap(p.region), cap(p.country)].filter((x) => x !== '—').join(', ')} />
            <Field label="Email" value={p.email || (p.hasEmail ? 'Available (enrich to reveal)' : 'Not available')} />
            <Field label="Phone" value={p.phone || '—'} />
            <Field label="LinkedIn" value={p.linkedin} />
            {p.skills?.length ? <Field label="Skills" value={p.skills.slice(0, 10).join(', ')} /> : null}
          </>
        )}
      </div>
    </div>
  )
}
