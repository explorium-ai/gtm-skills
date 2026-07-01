import type { PushResult } from '../lib/api'
import { X } from './icons'

export default function PushResultModal({ result, onClose }: { result: PushResult; onClose: () => void }) {
  const ok = result.results?.filter((r) => r.success).length || 0
  const fail = (result.results?.length || 0) - ok
  const crmName = result.crm === 'salesforce' ? 'Salesforce' : 'HubSpot'
  const recordType =
    result.crm === 'salesforce'
      ? result.entity === 'prospect' ? 'Leads' : 'Accounts'
      : result.entity === 'prospect' ? 'Contacts' : 'Companies'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="text-base font-bold text-navy-900">Pushed to {crmName}</div>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={16} /></button>
        </div>
        <div className="px-5 py-4">
          {result.error ? (
            <div className="rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">{result.error}</div>
          ) : (
            <>
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg bg-emerald-50 px-4 py-3">
                  <div className="text-2xl font-extrabold text-emerald-700">{ok}</div>
                  <div className="text-xs font-medium text-emerald-700/80">{recordType} created</div>
                </div>
                {fail > 0 && (
                  <div className="flex-1 rounded-lg bg-red-50 px-4 py-3">
                    <div className="text-2xl font-extrabold text-red-700">{fail}</div>
                    <div className="text-xs font-medium text-red-700/80">failed</div>
                  </div>
                )}
              </div>
              <div className="mt-4 max-h-52 space-y-1.5 overflow-y-auto">
                {result.results?.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-line px-3 py-1.5 text-xs">
                    <span className={r.success ? 'text-emerald-700' : 'text-red-700'}>
                      {r.success ? `✓ ${r.id}` : `✕ ${r.error?.slice(0, 60)}`}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end border-t border-line px-5 py-3">
          <button onClick={onClose} className="zi-btn-primary">Done</button>
        </div>
      </div>
    </div>
  )
}
