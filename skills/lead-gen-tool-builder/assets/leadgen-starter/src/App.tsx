import { useMemo, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import LeftRail from './components/LeftRail'
import FilterSidebar from './components/FilterSidebar'
import ActiveFilterChips from './components/ActiveFilterChips'
import ResultsTable from './components/ResultsTable'
import DetailPanel from './components/DetailPanel'
import CrmPushBar from './components/CrmPushBar'
import PushResultModal from './components/PushResultModal'
import CrmMappingModal from './components/CrmMappingModal'
import ImportModal from './components/ImportModal'
import {
  searchCompanies,
  searchProspects,
  pushToCrm,
  matchList,
  type Mode,
  type PushResult,
  type MappingField,
} from './lib/api'
import { valueCount } from './config/filters'
import { exportCsv, parseCsvToItems } from './lib/csv'

export default function App() {
  const [mode, setMode] = useState<Mode>('companies')
  const [filtersByMode, setFiltersByMode] = useState<Record<Mode, Record<string, any>>>({
    companies: {},
    prospects: {},
  })
  const [pinned, setPinned] = useState<string[]>([])

  const [rows, setRows] = useState<any[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [sampled, setSampled] = useState(false)
  const [sampleSize, setSampleSize] = useState(50)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeRow, setActiveRow] = useState<any | null>(null)
  const [pushing, setPushing] = useState<'salesforce' | 'hubspot' | null>(null)
  const [pushResult, setPushResult] = useState<PushResult | null>(null)
  const [mappingCrm, setMappingCrm] = useState<'salesforce' | 'hubspot' | null>(null)
  const [importing, setImporting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [matchNote, setMatchNote] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importEntityRef = useRef<'company' | 'prospect'>('company')

  const values = filtersByMode[mode]
  const activeCount = useMemo(
    () => Object.values(values).reduce((n, v) => n + valueCount(v), 0),
    [values]
  )

  const setValue = (key: string, val: any) =>
    setFiltersByMode((s) => ({ ...s, [mode]: { ...s[mode], [key]: val } }))

  const removeValue = (key: string, val?: string) =>
    setFiltersByMode((s) => {
      const cur = s[mode][key]
      const copy = { ...s[mode] }
      if (key === 'events' && cur && val != null) {
        const remaining = cur.values.filter((x: string) => x !== val)
        if (remaining.length) copy[key] = { ...cur, values: remaining }
        else delete copy[key]
        return { ...s, [mode]: copy }
      }
      let next: any
      if (Array.isArray(cur) && val != null) next = cur.filter((x) => x !== val)
      else next = undefined
      if (next == null || (Array.isArray(next) && next.length === 0)) delete copy[key]
      else copy[key] = next
      return { ...s, [mode]: copy }
    })

  const clearAll = () => setFiltersByMode((s) => ({ ...s, [mode]: {} }))

  const togglePin = (key: string) =>
    setPinned((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]))

  const switchMode = (m: Mode) => {
    setMode(m)
    setRows([])
    setCount(null)
    setSelected(new Set())
    setActiveRow(null)
    setError(null)
  }

  const runSearch = async () => {
    setLoading(true)
    setError(null)
    setActiveRow(null)
    try {
      const res =
        mode === 'companies'
          ? await searchCompanies(values, 1, sampleSize)
          : await searchProspects(values, 1, sampleSize)
      setRows(res.rows)
      setCount(res.count)
      setSampled(res.sampled)
      setSampleSize(res.sampleSize)
      setSelected(new Set())
    } catch (e: any) {
      setError(String(e.message || e))
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const toggleAll = () =>
    setSelected((s) => (s.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))))

  const selectedRows = rows.filter((r) => selected.has(r.id))
  const entity: 'company' | 'prospect' = mode === 'companies' ? 'company' : 'prospect'
  // CRM push / CSV act on the selection, or all rows when nothing is selected.
  const targetRows = selectedRows.length ? selectedRows : rows

  // Push to CRM with the field mapping the user reviewed/edited in the modal.
  const doPush = async (mapping: MappingField[]) => {
    const crm = mappingCrm
    if (!crm) return
    setPushing(crm)
    try {
      const res = await pushToCrm(crm, entity, targetRows, mapping)
      setMappingCrm(null)
      setPushResult(res)
    } catch (e: any) {
      setPushResult({ crm, entity: mode, results: [], error: String(e.message || e) })
      setMappingCrm(null)
    } finally {
      setPushing(null)
    }
  }

  const exportSelected = () => exportCsv(targetRows, mode)

  // --- Import a CSV list -> match + enrich via Explorium ---
  // The user first picks the entity (companies vs contacts) in ImportModal.
  const onImport = () => setImportOpen(true)
  const pickImport = (entity: 'company' | 'prospect') => {
    importEntityRef.current = entity
    setImportOpen(false)
    fileInputRef.current?.click()
  }
  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const ent = importEntityRef.current
    setImporting(true)
    setError(null)
    setMatchNote(null)
    setActiveRow(null)
    try {
      const items = parseCsvToItems(await file.text(), ent)
      if (!items.length) {
        setError(
          ent === 'company'
            ? 'No rows found. Include a company name and/or domain/website column.'
            : 'No rows found. Include a full name, company, and/or email column.'
        )
        return
      }
      const res = await matchList(ent, items)
      setMode(ent === 'company' ? 'companies' : 'prospects') // show the matching view
      setRows(res.rows)
      setCount(res.rows.length)
      setSampled(false)
      setSelected(new Set())
      setMatchNote(`Matched ${res.matched} of ${res.total} uploaded ${ent === 'company' ? 'companies' : 'contacts'} — review, enrich, or push below.`)
    } catch (err: any) {
      setError(String(err.message || err))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex h-screen bg-panel">
      <LeftRail />
      <div className="flex min-w-0 flex-1 flex-col">
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChosen} />
      <TopBar mode={mode} setMode={switchMode} onImport={onImport} importing={importing} />

      <div className="flex min-h-0 flex-1">
        <FilterSidebar
          mode={mode}
          values={values}
          setValue={setValue}
          pinned={pinned}
          togglePin={togglePin}
          onClear={clearAll}
          activeCount={activeCount}
          onSearch={runSearch}
          searching={loading}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line bg-white px-5 py-3">
            <div className="min-w-0 flex-1">
              <ActiveFilterChips mode={mode} values={values} removeValue={removeValue} />
            </div>
            <div className="flex shrink-0 items-center gap-2 text-sm text-muted">
              {count != null && (
                <>
                  {sampled && (
                    <span
                      title={`Explorium returns a representative sample for list generation. This view shows ${sampleSize} of a larger set — narrow your filters to surface the full match list.`}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700"
                    >
                      ● Sample
                    </span>
                  )}
                  <span>
                    <span className="font-bold text-navy-900">{count.toLocaleString()}</span>{' '}
                    {sampled ? `${mode === 'companies' ? 'companies' : 'contacts'} shown` : (mode === 'companies' ? 'companies' : 'contacts')}
                    {!sampled && count > 0 && <span className="ml-1 text-muted">(all matches)</span>}
                  </span>
                  {count > 0 && (
                    <button
                      onClick={() => exportCsv(rows, mode)}
                      className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-navy-700 hover:bg-panel"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      CSV
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-5 py-2.5 text-sm text-red-700">{error}</div>
          )}

          {!loading && sampled && count != null && (
            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2 text-[13px] text-amber-800">
              <span aria-hidden>⚠️</span>
              <span>
                Showing a <strong>sample of {count}</strong> {mode === 'companies' ? 'companies' : 'contacts'}. More matches exist —
                add filters (industry, location, size…) to narrow the list and reveal the full set.
              </span>
            </div>
          )}

          {matchNote && (
            <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-5 py-2 text-[13px] text-emerald-800">
              <span aria-hidden>📄</span>
              <span>{matchNote}</span>
              <button onClick={() => setMatchNote(null)} className="ml-auto text-emerald-700/70 hover:text-emerald-900">✕</button>
            </div>
          )}

          <div className="min-h-0 flex-1 bg-white">
            <ResultsTable
              mode={mode}
              rows={rows}
              selected={selected}
              toggle={toggle}
              toggleAll={toggleAll}
              onRow={setActiveRow}
              loading={loading}
            />
          </div>

          <CrmPushBar
            count={selected.size}
            total={rows.length}
            pushing={pushing}
            onPush={(crm) => setMappingCrm(crm)}
            onExportCsv={exportSelected}
            onClear={() => setSelected(new Set())}
          />
        </main>

        <DetailPanel mode={mode} row={activeRow} onClose={() => setActiveRow(null)} />
      </div>
      </div>

      {mappingCrm && (
        <CrmMappingModal
          crm={mappingCrm}
          entity={entity}
          recordCount={targetRows.length}
          sample={targetRows[0] || null}
          pushing={pushing === mappingCrm}
          onConfirm={doPush}
          onClose={() => setMappingCrm(null)}
        />
      )}

      {importOpen && <ImportModal onPick={pickImport} onClose={() => setImportOpen(false)} />}

      {pushResult && <PushResultModal result={pushResult} onClose={() => setPushResult(null)} />}
    </div>
  )
}
