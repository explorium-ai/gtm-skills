import fetch from 'node-fetch'
import jwt from 'jsonwebtoken'
import { getSecrets } from './secrets.js'

let token = null // { access_token, instance_url, exp }

// JWT bearer-flow auth using a Salesforce Connected App. Reads these env vars:
// SALESFORCE_CONSUMER_KEY, SALESFORCE_PRIVATE_KEY_BASE64, SALESFORCE_USERNAME,
// SALESFORCE_LOGIN_URL (e.g. https://login.salesforce.com).
async function getToken() {
  if (token && token.exp > Date.now() + 60_000) return token
  const s = await getSecrets()
  const loginUrl = (s.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com').replace(/\/$/, '')
  const privateKey = Buffer.from(s.SALESFORCE_PRIVATE_KEY_BASE64, 'base64').toString('utf8')

  const assertion = jwt.sign(
    {
      iss: s.SALESFORCE_CONSUMER_KEY,
      sub: s.SALESFORCE_USERNAME,
      aud: loginUrl,
      exp: Math.floor(Date.now() / 1000) + 180,
    },
    privateKey,
    { algorithm: 'RS256' }
  )

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  })

  const res = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Salesforce auth ${res.status}: ${JSON.stringify(json)}`)
  token = {
    access_token: json.access_token,
    instance_url: json.instance_url,
    exp: Date.now() + 50 * 60 * 1000,
  }
  return token
}

const API_VERSION = 'v60.0'

async function createSObject(type, fields) {
  const t = await getToken()
  const res = await fetch(`${t.instance_url}/services/data/${API_VERSION}/sobjects/${type}/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fields),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = Array.isArray(json) ? json.map((e) => e.message).join('; ') : JSON.stringify(json)
    throw new Error(msg || `HTTP ${res.status}`)
  }
  return json.id
}

// Default field mappings (source record field -> Salesforce field). Used as a
// fallback when the client doesn't supply its own mapping. NB: Account.Industry
// is a restricted picklist, so the free-text industry goes to Description.
export const SF_DEFAULT_MAPPING = {
  Lead: [
    { source: 'firstName', target: 'FirstName', label: 'First name' },
    { source: 'lastName', target: 'LastName', label: 'Last name', required: true },
    { source: 'companyName', target: 'Company', label: 'Company', required: true },
    { source: 'jobTitle', target: 'Title', label: 'Title' },
    { source: 'email', target: 'Email', label: 'Email' },
    { source: 'phone', target: 'Phone', label: 'Phone' },
    { source: 'city', target: 'City', label: 'City' },
    { source: 'country', target: 'Country', label: 'Country' },
    { value: 'LeadGen', target: 'LeadSource', label: 'Lead source (constant)' },
  ],
  Account: [
    { source: 'name', target: 'Name', label: 'Account name', required: true },
    { source: 'website', target: 'Website', label: 'Website' },
    { source: 'employees', target: 'NumberOfEmployees', label: 'Employees', type: 'number' },
    { source: 'country', target: 'BillingCountry', label: 'Billing country' },
    { source: 'city', target: 'BillingCity', label: 'Billing city' },
    { source: 'industry', target: 'Description', label: 'Industry → Description' },
  ],
}

function applyMapping(rec, mapping) {
  const fields = {}
  for (const m of mapping) {
    if (m.enabled === false) continue
    let v = m.value !== undefined ? m.value : rec[m.source]
    if (v == null || v === '') continue
    if (m.type === 'number') {
      const n = parseInt(String(v).match(/\d+/)?.[0] ?? '', 10)
      if (isNaN(n)) continue
      v = n
    }
    fields[m.target] = v
  }
  return fields
}

// Create Salesforce records from a list, using a (possibly client-supplied)
// field mapping. object is 'Lead' or 'Account'. Returns per-record results.
export async function createRecords(object, records, mapping) {
  const map = mapping?.length ? mapping : SF_DEFAULT_MAPPING[object]
  const results = []
  for (const rec of records) {
    const fields = applyMapping(rec, map)
    if (object === 'Lead' && !fields.LastName) fields.LastName = rec.fullName || rec.name || 'Unknown'
    if (object === 'Lead' && !fields.Company) fields.Company = rec.companyName || 'Unknown'
    if (object === 'Account' && !fields.Name) fields.Name = rec.name || 'Unknown'
    try {
      const id = await createSObject(object, fields)
      results.push({ ref: rec.id, success: true, id })
    } catch (e) {
      results.push({ ref: rec.id, success: false, error: String(e.message || e) })
    }
  }
  return results
}

export async function ping() {
  const t = await getToken()
  return { connected: true, instance_url: t.instance_url }
}
