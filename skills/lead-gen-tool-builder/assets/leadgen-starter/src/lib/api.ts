export type Mode = 'companies' | 'prospects'

export interface Company {
  id: string
  name: string
  domain?: string
  website?: string
  logo?: string
  industry?: string | null
  employees?: string
  revenue?: string
  country?: string
  city?: string
  region?: string
  description?: string
  linkedin?: string
  intentTopics?: any
}

export interface Prospect {
  id: string
  fullName?: string
  firstName?: string
  lastName?: string
  jobTitle?: string | null
  jobLevel?: string | null
  jobDepartment?: string | null
  companyName?: string | null
  companyDomain?: string | null
  businessId?: string | null
  country?: string
  region?: string
  city?: string
  linkedin?: string
  skills?: string[]
  hasEmail?: boolean
  email?: string
  phone?: string
}

export interface SearchResponse<T> {
  rows: T[]
  count: number
  // Explorium returns a sample capped at sampleSize. `sampled` = the cap was
  // hit, so more matches exist than are shown.
  sampled: boolean
  sampleSize: number
  page: number
  error?: string
}

async function postJSON(url: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

export function searchCompanies(filters: Record<string, any>, page = 1, pageSize = 25) {
  return postJSON('/api/companies', { filters, page, pageSize }) as Promise<SearchResponse<Company>>
}

export function searchProspects(filters: Record<string, any>, page = 1, pageSize = 25) {
  return postJSON('/api/prospects', { filters, page, pageSize }) as Promise<SearchResponse<Prospect>>
}

export interface MatchResponse<T> {
  rows: T[]
  matched: number
  total: number
  error?: string
}

// Match an uploaded list (companies or people) to Explorium and enrich it.
export function matchList(entity: 'company' | 'prospect', items: any[]) {
  return postJSON('/api/match', { entity, items }) as Promise<MatchResponse<Company | Prospect>>
}

export async function autocomplete(field: string, query: string): Promise<{ label: string; value: string }[]> {
  if (!query) return []
  const res = await fetch(`/api/autocomplete?field=${encodeURIComponent(field)}&query=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export interface PushResult {
  crm: 'salesforce' | 'hubspot'
  entity: Mode | string
  results: { ref: string; success: boolean; id?: string; error?: string }[]
  error?: string
}

export interface MappingField {
  source?: string
  value?: string
  target: string
  label: string
  type?: string
  required?: boolean
  enabled?: boolean
}

export interface MappingResponse {
  crm: string
  entity: string
  object: string
  fields: MappingField[]
}

export async function getMapping(
  crm: 'salesforce' | 'hubspot',
  entity: 'company' | 'prospect'
): Promise<MappingResponse> {
  const res = await fetch(`/api/crm/mapping/${crm}/${entity}`)
  if (!res.ok) throw new Error(`mapping ${res.status}`)
  return res.json()
}

export function pushToCrm(
  crm: 'salesforce' | 'hubspot',
  entity: 'company' | 'prospect',
  records: any[],
  mapping?: MappingField[]
): Promise<PushResult> {
  return postJSON(`/api/crm/${crm}`, { entity, records, mapping })
}
