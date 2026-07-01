import fetch from 'node-fetch'
import { getKey } from './secrets.js'

const BASE = 'https://api.hubapi.com'

async function auth() {
  return { Authorization: `Bearer ${await getKey('HUBSPOT_API_KEY')}`, 'Content-Type': 'application/json' }
}

async function batchCreate(object, inputs) {
  const res = await fetch(`${BASE}/crm/v3/objects/${object}/batch/create`, {
    method: 'POST',
    headers: await auth(),
    body: JSON.stringify({ inputs }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`HubSpot ${object} ${res.status}: ${JSON.stringify(json).slice(0, 400)}`)
  return json.results || []
}

// Default field mappings (source record field -> HubSpot property). Used as a
// fallback when the client doesn't supply its own mapping. NB: HubSpot's
// `industry` is a fixed enumeration, so free-text industry goes to `description`.
export const HS_DEFAULT_MAPPING = {
  contacts: [
    { source: 'firstName', target: 'firstname', label: 'First name' },
    { source: 'lastName', target: 'lastname', label: 'Last name' },
    { source: 'email', target: 'email', label: 'Email' },
    { source: 'phone', target: 'phone', label: 'Phone' },
    { source: 'jobTitle', target: 'jobtitle', label: 'Job title' },
    { source: 'companyName', target: 'company', label: 'Company' },
    { source: 'city', target: 'city', label: 'City' },
    { source: 'country', target: 'country', label: 'Country' },
  ],
  companies: [
    { source: 'name', target: 'name', label: 'Name', required: true },
    { source: 'domain', target: 'domain', label: 'Domain' },
    { source: 'website', target: 'website', label: 'Website' },
    { source: 'employees', target: 'numberofemployees', label: 'Employees', type: 'number' },
    { source: 'country', target: 'country', label: 'Country' },
    { source: 'city', target: 'city', label: 'City' },
    { source: 'industry', target: 'description', label: 'Industry → Description' },
  ],
}

function applyMapping(rec, mapping) {
  const props = {}
  for (const m of mapping) {
    if (m.enabled === false) continue
    let v = m.value !== undefined ? m.value : rec[m.source]
    if (v == null || v === '') continue
    if (m.type === 'number') {
      const n = parseInt(String(v).match(/\d+/)?.[0] ?? '', 10)
      if (isNaN(n)) continue
      v = String(n)
    }
    props[m.target] = String(v)
  }
  return props
}

// Create HubSpot records (object 'contacts' or 'companies') from a list using a
// (possibly client-supplied) mapping. Returns per-record results in input order.
export async function createRecords(object, records, mapping) {
  const map = mapping?.length ? mapping : HS_DEFAULT_MAPPING[object]
  const results = []
  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100)
    const inputs = batch.map((rec) => ({ properties: applyMapping(rec, map) }))
    try {
      const created = await batchCreate(object, inputs)
      batch.forEach((rec, j) => results.push({ ref: rec.id, success: true, id: created[j]?.id }))
    } catch (e) {
      batch.forEach((rec) => results.push({ ref: rec.id, success: false, error: String(e.message || e) }))
    }
  }
  return results
}

export async function ping() {
  const res = await fetch(`${BASE}/crm/v3/objects/contacts?limit=1`, { headers: await auth() })
  return { connected: res.ok, status: res.status }
}
