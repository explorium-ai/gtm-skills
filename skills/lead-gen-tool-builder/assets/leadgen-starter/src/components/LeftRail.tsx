import { ZMark } from './icons'

// Narrow dark icon navigation rail, mirroring ZoomInfo's product chrome.
const items = [
  { key: 'home', label: 'Home', path: 'M3 11l9-8 9 8M5 10v10h14V10' },
  { key: 'search', label: 'Search', path: 'M11 4a7 7 0 105 12l4 4M11 4a7 7 0 010 14', active: true },
  { key: 'lists', label: 'Lists', path: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01' },
  { key: 'engage', label: 'Engage', path: 'M4 4h16v12H7l-3 3V4z' },
  { key: 'intent', label: 'Intent', path: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z' },
  { key: 'integrations', label: 'Integrations', path: 'M6 9V7a3 3 0 016 0M6 9a3 3 0 00-3 3v0a3 3 0 003 3m0-6h12m0 0a3 3 0 013 3v0a3 3 0 01-3 3M6 15h12' },
]

export default function LeftRail() {
  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-1 bg-navy-900 py-3 text-white/70">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-coral text-white">
        <ZMark size={22} />
      </div>
      {items.map((it) => (
        <button
          key={it.key}
          title={it.label}
          className={`group relative grid h-11 w-11 place-items-center rounded-lg transition ${
            it.active ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'
          }`}
        >
          {it.active && <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-coral" />}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d={it.path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </nav>
  )
}
