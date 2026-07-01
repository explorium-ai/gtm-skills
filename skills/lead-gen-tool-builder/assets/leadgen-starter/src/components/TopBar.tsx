import type { Mode } from '../lib/api'
import { Building, Person, ZMark } from './icons'

interface Props {
  mode: Mode
  setMode: (m: Mode) => void
  onImport: () => void
  importing: boolean
}

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function TopBar({ mode, setMode, onImport, importing }: Props) {
  const tab = (m: Mode, label: string, Icon: () => JSX.Element) => {
    const active = mode === m
    return (
      <button
        onClick={() => setMode(m)}
        className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-semibold transition ${
          active ? 'bg-white text-navy-900 shadow-sm ring-1 ring-line' : 'text-muted hover:text-navy-900'
        }`}
      >
        <Icon />
        {label}
      </button>
    )
  }

  return (
    <header className="flex items-center justify-between border-b border-line bg-white px-5 py-2.5">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-coral text-white"><ZMark /></span>
          <span className="text-[18px] font-extrabold tracking-tight text-navy-900">Lead<span className="text-coral">Gen</span></span>
        </div>
        <span className="hidden text-[13px] font-medium text-muted lg:inline">Advanced Search</span>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-panel p-1">
        {tab('companies', 'Companies', Building)}
        {tab('prospects', 'Contacts', Person)}
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-xs font-medium text-muted xl:inline">powered by Explorium</span>
        <button onClick={onImport} disabled={importing} className="zi-btn-ghost disabled:opacity-70">
          <UploadIcon />
          {importing ? 'Matching…' : 'Import list'}
        </button>
      </div>
    </header>
  )
}
