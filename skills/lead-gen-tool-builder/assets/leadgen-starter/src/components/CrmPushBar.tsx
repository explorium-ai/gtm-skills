interface Props {
  count: number // selected
  total: number // rows available
  pushing: 'salesforce' | 'hubspot' | null
  onPush: (crm: 'salesforce' | 'hubspot') => void
  onExportCsv: () => void
  onClear: () => void
}

const DownloadIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const SalesforceMark = () => (
  <svg width="22" height="15" viewBox="0 0 24 16" fill="currentColor" aria-hidden>
    <path d="M10 3.2A4 4 0 0117 4.6a3.4 3.4 0 014.6 3.2 3.4 3.4 0 01-3.4 3.4H6.6A3.6 3.6 0 016 4.1a3.4 3.4 0 014-0.9z" />
  </svg>
)
const HubspotMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="7" cy="8" r="2.4" stroke="currentColor" strokeWidth="2" />
    <circle cx="17" cy="6" r="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="16" cy="17" r="3.2" stroke="currentColor" strokeWidth="2" />
    <path d="M9 9l5 6M9.4 8l4.6-1.4" stroke="currentColor" strokeWidth="2" />
  </svg>
)

// Always shown when there are results, so the CRM push is always discoverable.
// With nothing selected, actions apply to all loaded rows.
export default function CrmPushBar({ count, total, pushing, onPush, onExportCsv, onClear }: Props) {
  if (total === 0) return null
  const n = count || total
  const appliesToAll = count === 0

  return (
    <div className="flex items-center justify-between gap-4 border-t border-line bg-white px-6 py-4 shadow-[0_-6px_20px_rgba(1,13,57,0.08)]">
      <div className="flex items-center gap-3 text-sm">
        {count > 0 ? (
          <>
            <span className="grid h-8 min-w-8 place-items-center rounded-full bg-coral px-2 text-sm font-bold text-white">{count}</span>
            <span className="font-semibold text-navy-900">selected</span>
            <button onClick={onClear} className="text-xs font-medium text-muted hover:text-coral">Clear selection</button>
          </>
        ) : (
          <span className="text-navy-900">
            <span className="font-bold">{total}</span> results ·{' '}
            <span className="text-muted">select rows, or act on all</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onExportCsv} className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-[15px] font-semibold text-navy-700 transition hover:bg-panel">
          <DownloadIcon />
          Download CSV{appliesToAll ? ` (${total})` : ''}
        </button>
        <span className="mx-1 h-7 w-px bg-line" />
        <span className="text-[13px] font-semibold text-muted">Push {appliesToAll ? `all ${total}` : n} to CRM</span>
        <button
          onClick={() => onPush('hubspot')}
          disabled={!!pushing}
          className="inline-flex items-center gap-2.5 rounded-full px-7 py-3 text-[16px] font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
          style={{ background: '#ff7a59' }}
        >
          <HubspotMark />
          {pushing === 'hubspot' ? 'Pushing…' : 'HubSpot'}
        </button>
        <button
          onClick={() => onPush('salesforce')}
          disabled={!!pushing}
          className="inline-flex items-center gap-2.5 rounded-full px-7 py-3 text-[16px] font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
          style={{ background: '#00a1e0' }}
        >
          <SalesforceMark />
          {pushing === 'salesforce' ? 'Pushing…' : 'Salesforce'}
        </button>
      </div>
    </div>
  )
}
