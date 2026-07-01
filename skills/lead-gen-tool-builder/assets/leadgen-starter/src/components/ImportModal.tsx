import { Building, Person, X } from './icons'

interface Props {
  onPick: (entity: 'company' | 'prospect') => void
  onClose: () => void
}

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Lets the user say whether the uploaded CSV is companies or contacts before
// picking the file — the match/enrich path differs per entity.
export default function ImportModal({ onPick, onClose }: Props) {
  const card = (
    entity: 'company' | 'prospect',
    Icon: () => JSX.Element,
    title: string,
    desc: string,
    cols: string
  ) => (
    <button
      onClick={() => onPick(entity)}
      className="group flex flex-1 flex-col items-start gap-3 rounded-xl border border-line p-5 text-left transition hover:border-navy-600 hover:bg-navy-50/40"
    >
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-navy-50 text-navy-700 group-hover:bg-navy-900 group-hover:text-white">
        <Icon />
      </span>
      <span className="text-[15px] font-bold text-navy-900">{title}</span>
      <span className="text-[13px] text-muted">{desc}</span>
      <span className="mt-1 text-[11px] font-medium text-muted">Expected columns: {cols}</span>
      <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-[13px] font-semibold text-white">
        <UploadIcon />
        Choose CSV
      </span>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-xl bg-white shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <div className="text-base font-bold text-navy-900">Import a list</div>
            <div className="text-xs text-muted">Match your CSV to Explorium and enrich it. What are you uploading?</div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={16} /></button>
        </div>
        <div className="flex gap-4 p-5">
          {card('company', Building, 'Company list', 'Match & enrich companies (firmographics, tech, more).', 'name, domain/website')}
          {card('prospect', Person, 'Contact list', 'Match & enrich people (title, seniority, email/phone).', 'full name, company, email')}
        </div>
      </div>
    </div>
  )
}
