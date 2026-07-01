import type { Mode } from './api'

// Columns exported per mode (label -> record field).
const COMPANY_COLUMNS: [string, string][] = [
  ['Company', 'name'], ['Domain', 'domain'], ['Website', 'website'],
  ['Industry', 'industry'], ['Employees', 'employees'], ['Revenue', 'revenue'],
  ['City', 'city'], ['Region', 'region'], ['Country', 'country'],
  ['LinkedIn', 'linkedin'], ['Explorium Business Id', 'id'],
]
const PROSPECT_COLUMNS: [string, string][] = [
  ['Full name', 'fullName'], ['First name', 'firstName'], ['Last name', 'lastName'],
  ['Job title', 'jobTitle'], ['Management level', 'jobLevel'], ['Department', 'jobDepartment'],
  ['Company', 'companyName'], ['City', 'city'], ['Region', 'region'], ['Country', 'country'],
  ['Email', 'email'], ['Phone', 'phone'], ['LinkedIn', 'linkedin'],
]

// --- CSV import (parse an uploaded file into match items) --------------------

// Minimal CSV parse (handles quoted fields + commas/newlines).
function parseRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((x) => x.trim() !== '')) rows.push(row)
      row = []
    } else cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); if (row.some((x) => x.trim() !== '')) rows.push(row) }
  return rows
}

const pick = (obj: Record<string, string>, keys: string[]) => {
  for (const k of Object.keys(obj)) if (keys.some((t) => k.includes(t)) && obj[k]) return obj[k].trim()
  return ''
}

// Parse an uploaded CSV into match items for the given entity.
export function parseCsvToItems(text: string, entity: 'company' | 'prospect') {
  const rows = parseRows(text)
  if (rows.length < 1) return []
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const hasHeader = header.some((h) => /name|domain|company|email|website|url/.test(h))
  const body = hasHeader ? rows.slice(1) : rows
  const cols = hasHeader ? header : rows[0].map((_, i) => String(i))

  return body
    .map((r) => {
      const o: Record<string, string> = {}
      cols.forEach((c, i) => (o[c] = r[i] ?? ''))
      if (entity === 'company') {
        const name = pick(o, ['company name', 'name', 'company'])
        const domain = pick(o, ['domain', 'website', 'url'])
        return name || domain ? { name, domain } : null
      }
      const full_name = pick(o, ['full name', 'full_name', 'name', 'contact'])
      const company = pick(o, ['company', 'organization', 'employer'])
      const email = pick(o, ['email'])
      return full_name || email ? { full_name, company, email } : null
    })
    .filter(Boolean)
}

function escape(v: any) {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportCsv(rows: any[], mode: Mode) {
  const cols = mode === 'companies' ? COMPANY_COLUMNS : PROSPECT_COLUMNS
  const header = cols.map(([label]) => label).join(',')
  const body = rows.map((r) => cols.map(([, field]) => escape(r[field])).join(',')).join('\n')
  const csv = `${header}\n${body}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leadgen-${mode}-${rows.length}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
