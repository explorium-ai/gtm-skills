import fetch from 'node-fetch'
import { getKey } from './secrets.js'

const BASE = 'https://api.explorium.ai/v1'

async function headers() {
  return {
    api_key: await getKey('EXPLORIUM_API_KEY'),
    'Content-Type': 'application/json',
    accept: 'application/json',
  }
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  if (!res.ok) {
    const detail = json?.detail ? JSON.stringify(json.detail) : text
    throw new Error(`Explorium ${path} ${res.status}: ${detail}`)
  }
  return json
}

// Fields whose Explorium filter type is not the default "includes".
const PHRASE_FIELDS = new Set(['job_title', 'website_keywords']) // any_match_phrase
const EXISTS_FIELDS = new Set(['has_email', 'has_phone_number']) // exists

// Some fields take a different filter type depending on the endpoint.
// company_name: "includes" on /businesses, "any_match" on /prospects.
function typeFor(field, entity) {
  if (field === 'company_name') return entity === 'prospects' ? 'any_match' : 'includes'
  if (PHRASE_FIELDS.has(field)) return 'any_match_phrase'
  return 'includes'
}

// Builds the Explorium filter envelope from a flat { field: value } map,
// applying the correct filter "type" per field/entity and dropping empties.
export function buildFilters(raw = {}, entity = 'businesses') {
  const out = {}
  for (const [k, v] of Object.entries(raw)) {
    if (v == null) continue
    if (EXISTS_FIELDS.has(k)) {
      if (v === true || v === 'true') out[k] = { type: 'exists', value: true }
      continue
    }
    // events: { values:[...], lastOccurrence:N } -> Explorium events filter.
    if (k === 'events') {
      if (!v || !Array.isArray(v.values) || v.values.length === 0) continue
      out.events = {
        type: 'includes',
        values: v.values,
        last_occurrence: Math.min(120, Math.max(30, Number(v.lastOccurrence) || 90)),
      }
      continue
    }
    if (Array.isArray(v)) {
      if (v.length === 0) continue
      out[k] = { type: typeFor(k, entity), values: v }
    } else if (typeof v === 'object') {
      out[k] = v // pass through pre-shaped filters (e.g. ranges)
    } else {
      out[k] = { type: typeFor(k, entity), values: [v] }
    }
  }
  return out
}

export async function fetchBusinesses({ filters = {}, page = 1, pageSize = 25 }) {
  return post('/businesses', {
    mode: 'full',
    size: pageSize,
    page_size: pageSize,
    page,
    filters: buildFilters(filters, 'businesses'),
  })
}

export async function fetchProspects({ filters = {}, page = 1, pageSize = 25 }) {
  return post('/prospects', {
    mode: 'full',
    size: pageSize,
    page_size: pageSize,
    page,
    filters: buildFilters(filters, 'prospects'),
  })
}

export async function autocomplete(field, query) {
  const url = `${BASE}/businesses/autocomplete?field=${encodeURIComponent(field)}&query=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: await headers() })
  if (!res.ok) throw new Error(`Explorium autocomplete ${res.status}`)
  return res.json()
}

// Enrich prospect contact info (emails / phones) in batches of <=50.
export async function enrichProspectContacts(ids = []) {
  const out = {}
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    const json = await post('/prospects/contacts_information/bulk_enrich', { prospect_ids: batch })
    for (const row of json.data || []) out[row.prospect_id] = row.data
  }
  return out
}

// Enrich prospect profiles (name/title/company) in batches of <=50.
export async function enrichProspectProfiles(ids = []) {
  const out = {}
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    const json = await post('/prospects/profiles/bulk_enrich', { prospect_ids: batch })
    for (const row of json.data || []) out[row.prospect_id] = row.data
  }
  return out
}

// Match an uploaded list of companies ({name, domain}) to Explorium business ids.
export async function matchBusinesses(items = []) {
  const out = []
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50).map((b) => ({ name: b.name || undefined, domain: b.domain || undefined }))
    const json = await post('/businesses/match', { businesses_to_match: batch })
    out.push(...(json.matched_businesses || []))
  }
  return out // [{ input, business_id }]
}

// Enrich matched business ids with firmographics (<=50 per call).
export async function enrichBusinessFirmographics(ids = []) {
  const out = {}
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    const json = await post('/businesses/firmographics/bulk_enrich', { business_ids: batch })
    for (const row of json.data || []) out[row.business_id] = row.data
  }
  return out
}

// Match an uploaded list of people ({full_name, company_name, email}) to prospect ids.
export async function matchProspects(items = []) {
  const out = []
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50).map((p) => ({
      full_name: p.full_name || p.name || undefined,
      company_name: p.company_name || p.company || undefined,
      email: p.email || undefined,
    }))
    const json = await post('/prospects/match', { prospects_to_match: batch })
    out.push(...(json.matched_prospects || []))
  }
  return out // [{ input, prospect_id }]
}
