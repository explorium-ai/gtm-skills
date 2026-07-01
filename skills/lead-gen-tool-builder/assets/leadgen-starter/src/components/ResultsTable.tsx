import { useMemo, useState } from 'react'
import type { Company, Mode, Prospect } from '../lib/api'
import { Building, Person } from './icons'

interface Props {
  mode: Mode
  rows: (Company | Prospect)[]
  selected: Set<string>
  toggle: (id: string) => void
  toggleAll: () => void
  onRow: (row: any) => void
  loading: boolean
}

const Badge = ({ children, tone = 'navy' }: { children: any; tone?: 'navy' | 'green' | 'gray' }) => {
  const tones = {
    navy: 'bg-navy-50 text-navy-700',
    green: 'bg-emerald-50 text-emerald-700',
    gray: 'bg-panel text-muted',
  }
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>
}

const cap = (s?: string | null) => (s ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : '—')

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, r) => (
        <tr key={r} className="border-b border-line">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-3 py-3">
              <div className="zi-skeleton h-3.5 w-full rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

const COMPANY_COLS = [
  { label: 'Company', field: 'name', w: '22%' }, { label: 'Industry', field: 'industry', w: '15%' },
  { label: 'Employees', field: 'employees', w: '9%' }, { label: 'Revenue', field: 'revenue', w: '9%' },
  { label: 'Location', field: 'country', w: '14%' }, { label: 'Region', field: 'region', w: '10%' },
  { label: 'Website', field: 'website', w: '12%' }, { label: 'LinkedIn', field: 'linkedin', w: '9%' },
]
const PROSPECT_COLS = [
  { label: 'Name', field: 'fullName', w: '16%' }, { label: 'Title', field: 'jobTitle', w: '18%' },
  { label: 'Level', field: 'jobLevel', w: '11%' }, { label: 'Department', field: 'jobDepartment', w: '12%' },
  { label: 'Company', field: 'companyName', w: '15%' }, { label: 'Location', field: 'country', w: '12%' },
  { label: 'Contact', field: 'hasEmail', w: '9%' }, { label: 'LinkedIn', field: 'linkedin', w: '7%' },
]

// Contact-availability badge: shows what's known (Email / Phone / both), else Enrich.
function ContactBadge({ p }: { p: Prospect }) {
  const hasE = Boolean(p.email || p.hasEmail)
  const hasP = Boolean(p.phone || (p as any).hasPhone)
  if (hasE && hasP) return <span title={p.email || 'Email & phone available'} className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700">Email · Phone</span>
  if (hasE) return <span title={p.email || 'Email available'} className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700">Email</span>
  if (hasP) return <span title={p.phone || 'Phone available'} className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700">Phone</span>
  return <span title="No contact info yet — push or enrich to reveal email/phone" className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-panel text-muted">Enrich</span>
}

// Compact external-link cell (LinkedIn, etc.).
function LinkCell({ href, label }: { href?: string; label: string }) {
  if (!href) return <span className="text-muted">—</span>
  const url = href.startsWith('http') ? href : `https://${href}`
  return (
    <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-navy-600 hover:text-coral hover:underline">
      {label}
    </a>
  )
}

// Numeric when both values start with a number (e.g. "51-200"), else string.
function compare(a: any, b: any) {
  const na = parseFloat(String(a)), nb = parseFloat(String(b))
  if (!isNaN(na) && !isNaN(nb)) return na - nb
  return String(a ?? '').localeCompare(String(b ?? ''))
}

export default function ResultsTable({ mode, rows, selected, toggle, toggleAll, onRow, loading }: Props) {
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const cols = mode === 'companies' ? COMPANY_COLS : PROSPECT_COLS

  const [sort, setSort] = useState<{ field: string; dir: 1 | -1 } | null>(null)
  const sortedRows = useMemo(() => {
    if (!sort) return rows
    return [...rows].sort((a, b) => compare(a[sort.field], b[sort.field]) * sort.dir)
  }, [rows, sort])

  const onSort = (field: string) =>
    setSort((s) => (s?.field === field ? { field, dir: (s.dir * -1) as 1 | -1 } : { field, dir: 1 }))

  const th = (c: { label: string; field: string; w?: string }) => {
    const active = sort?.field === c.field
    return (
      <th key={c.label} style={{ width: c.w }} className="whitespace-nowrap px-3 py-2 text-left">
        <button onClick={() => onSort(c.field)}
          className={`group inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide transition ${active ? 'text-navy-900' : 'text-muted hover:text-navy-700'}`}>
          {c.label}
          <span className={`text-[9px] leading-none ${active ? 'text-coral' : 'text-line group-hover:text-muted'}`}>
            {active ? (sort!.dir === 1 ? '▲' : '▼') : '▾'}
          </span>
        </button>
      </th>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full min-w-[1180px] table-fixed border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-panel">
          <tr className="border-b border-line">
            <th className="w-10 px-3 py-2">
              <input type="checkbox" checked={allChecked} onChange={toggleAll}
                className="h-4 w-4 rounded border-line accent-navy" />
            </th>
            {cols.map(th)}
          </tr>
        </thead>
        <tbody>
          {loading && <SkeletonRows cols={cols.length + 1} />}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={cols.length + 1} className="px-3 py-20 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-panel text-muted">
                  {mode === 'companies' ? <Building /> : <Person />}
                </div>
                <div className="text-sm font-semibold text-ink">No results yet</div>
                <div className="mt-1 text-sm text-muted">Apply filters and hit Search to generate {mode === 'companies' ? 'companies' : 'contacts'}.</div>
              </td>
            </tr>
          )}

          {!loading && sortedRows.map((row, i) => {
            const checked = selected.has(row.id)
            return (
              <tr
                key={row.id}
                onClick={() => onRow(row)}
                className={`cursor-pointer border-b border-line transition hover:bg-navy-50/50 ${
                  i % 2 ? 'bg-panel/40' : 'bg-white'
                } ${checked ? 'bg-coral-50/60' : ''}`}
              >
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(row.id)}
                    className="h-4 w-4 rounded border-line accent-navy" />
                </td>

                {mode === 'companies'
                  ? renderCompany(row as Company)
                  : renderProspect(row as Prospect)}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  function renderCompany(c: Company) {
    return (
      <>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            {c.logo
              ? <img src={c.logo} alt="" className="h-7 w-7 rounded border border-line object-contain bg-white"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              : <span className="grid h-7 w-7 place-items-center rounded bg-navy-50 text-navy-700"><Building /></span>}
            <div className="min-w-0">
              <div className="truncate font-semibold text-navy-900">{c.name}</div>
              <div className="truncate text-xs text-muted">{c.domain}</div>
            </div>
          </div>
        </td>
        <td className="truncate px-3 py-2.5 text-ink">{cap(c.industry)}</td>
        <td className="px-3 py-2.5"><Badge tone="gray">{c.employees || '—'}</Badge></td>
        <td className="px-3 py-2.5 text-ink">{c.revenue || '—'}</td>
        <td className="truncate px-3 py-2.5 text-ink">{[cap(c.city), cap(c.country)].filter((x) => x !== '—').join(', ') || '—'}</td>
        <td className="truncate px-3 py-2.5 text-ink">{cap(c.region)}</td>
        <td className="truncate px-3 py-2.5">
          {c.website
            ? <a href={`https://${c.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer"
                onClick={(e) => e.stopPropagation()} className="text-navy-600 hover:text-coral hover:underline">{c.website}</a>
            : '—'}
        </td>
        <td className="truncate px-3 py-2.5"><LinkCell href={c.linkedin} label="Profile" /></td>
      </>
    )
  }

  function renderProspect(p: Prospect) {
    return (
      <>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-navy-50 text-navy-700 text-xs font-bold">
              {(p.firstName?.[0] || p.fullName?.[0] || '?').toUpperCase()}
            </span>
            <span className="font-semibold text-navy-900">{p.fullName || '—'}</span>
          </div>
        </td>
        <td className="truncate px-3 py-2.5 text-ink">{cap(p.jobTitle)}</td>
        <td className="px-3 py-2.5"><Badge>{cap(p.jobLevel)}</Badge></td>
        <td className="truncate px-3 py-2.5 text-ink">{cap(p.jobDepartment)}</td>
        <td className="truncate px-3 py-2.5 text-ink">{p.companyName || '—'}</td>
        <td className="truncate px-3 py-2.5 text-ink">{[cap(p.city), cap(p.region)].filter((x) => x !== '—').join(', ') || '—'}</td>
        <td className="px-3 py-2.5"><ContactBadge p={p} /></td>
        <td className="truncate px-3 py-2.5"><LinkCell href={p.linkedin} label="Profile" /></td>
      </>
    )
  }
}
