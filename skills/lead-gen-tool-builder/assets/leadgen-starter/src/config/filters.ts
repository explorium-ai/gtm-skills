// Filter definitions mirroring Explorium's company / prospect generators.
// Each filter renders as its own collapsible dropdown (like admin.explorium.ai).

export type FilterType =
  | 'checkbox'
  | 'searchCheckbox'
  | 'autocomplete'
  | 'textMulti'
  | 'toggle'
  | 'toggleGroup'
  | 'events'

export interface FilterDef {
  key: string // Explorium filter field
  label: string
  type: FilterType
  acField?: string // Explorium autocomplete field
  options?: { label: string; value: string }[]
  toggles?: { key: string; label: string }[] // for 'toggleGroup' — each maps to its own field
  hint?: string
  note?: string // small helper line shown under the control
}

const SIZE_BUCKETS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+']
const REVENUE_BUCKETS = [
  '0-500K', '500K-1M', '1M-5M', '5M-10M', '10M-25M', '25M-75M',
  '75M-200M', '200M-500M', '500M-1B', '1B-10B', '10B-100B',
]
const AGE_BUCKETS = ['0-3', '3-6', '6-10', '10-20', '20+']
const LOCATION_BUCKETS = ['0-1', '2-5', '6-20', '21-50', '51-100', '101-1000', '1001+']
const COUNTRIES = [
  ['United States', 'us'], ['United Kingdom', 'gb'], ['Canada', 'ca'], ['Germany', 'de'],
  ['France', 'fr'], ['Australia', 'au'], ['India', 'in'], ['Israel', 'il'],
  ['Netherlands', 'nl'], ['Spain', 'es'], ['Italy', 'it'], ['Ireland', 'ie'],
  ['Sweden', 'se'], ['Switzerland', 'ch'], ['Singapore', 'sg'], ['Brazil', 'br'],
  ['Mexico', 'mx'], ['Japan', 'jp'], ['Poland', 'pl'], ['Belgium', 'be'],
].map(([label, value]) => ({ label, value }))

// Explorium business event enumeration (last_occurrence window: 30–120 days).
export const EVENT_OPTIONS: { label: string; value: string }[] = [
  ['Funding round', 'new_funding_round'],
  ['New investment', 'new_investment'],
  ['IPO announcement', 'ipo_announcement'],
  ['Merger / acquisition', 'merger_and_acquisitions'],
  ['New product', 'new_product'],
  ['New office', 'new_office'],
  ['Closing office', 'closing_office'],
  ['New partnership', 'new_partnership'],
  ['Company award', 'company_award'],
  ['Hiring — Engineering', 'hiring_in_engineering_department'],
  ['Hiring — Sales', 'hiring_in_sales_department'],
  ['Hiring — Marketing', 'hiring_in_marketing_department'],
  ['Growth — Engineering', 'increase_in_engineering_department'],
  ['Growth — Sales', 'increase_in_sales_department'],
  ['Growth — All departments', 'increase_in_all_departments'],
  ['Decline — All departments', 'decrease_in_all_departments'],
  ['Cost cutting', 'cost_cutting'],
  ['Security breach / outage', 'outages_and_security_breaches'],
  ['Lawsuits / legal issues', 'lawsuits_and_legal_issues'],
].map(([label, value]) => ({ label, value }))

const opts = (vals: string[]) => vals.map((v) => ({ label: v, value: v }))
const titleOpts = (vals: string[]) =>
  vals.map((v) => ({ label: v.replace(/\b\w/g, (c) => c.toUpperCase()), value: v }))

export const COMPANY_FILTERS: FilterDef[] = [
  { key: 'country_code', label: 'Country', type: 'searchCheckbox', options: COUNTRIES, hint: 'Type to search…', note: 'Filters by company HQ.' },
  { key: 'region_country_code', label: 'Region / State', type: 'autocomplete', acField: 'region_country_code', hint: 'e.g. California' },
  { key: 'city_region', label: 'City', type: 'autocomplete', acField: 'city_region', hint: 'e.g. New York' },
  { key: 'company_size', label: 'Number of employees', type: 'checkbox', options: opts(SIZE_BUCKETS) },
  { key: 'company_revenue', label: 'Revenue', type: 'checkbox', options: opts(REVENUE_BUCKETS) },
  { key: 'company_age', label: 'Company age (years)', type: 'checkbox', options: opts(AGE_BUCKETS) },
  { key: 'number_of_locations', label: 'Number of locations', type: 'checkbox', options: opts(LOCATION_BUCKETS) },
  { key: 'website_keywords', label: 'Online presence (website keywords)', type: 'textMulti', hint: 'Add a keyword and press Enter' },
  { key: 'company_name', label: 'Company name', type: 'textMulti', hint: 'Add a name and press Enter' },
  { key: 'business_id', label: 'Explorium Business Id', type: 'textMulti', hint: '32-character id' },
  { key: 'linkedin_category', label: 'Industry', type: 'autocomplete', acField: 'linkedin_category', hint: 'Search industries' },
  { key: 'company_tech_stack_category', label: 'Tech stack category', type: 'autocomplete', acField: 'company_tech_stack_categories', hint: 'e.g. CRM, Analytics' },
  { key: 'company_tech_stack_tech', label: 'Technology', type: 'autocomplete', acField: 'company_tech_stack_tech', hint: 'e.g. Salesforce, AWS' },
  { key: 'events', label: 'Events', type: 'events' },
]

// Mirrors Explorium's Prospects generator: company firmographics + people filters.
export const PROSPECT_FILTERS: FilterDef[] = [
  { key: 'country_code', label: 'Location', type: 'searchCheckbox', options: COUNTRIES, hint: 'Type to search…', note: 'Filters by company HQ.' },
  { key: 'region_country_code', label: 'Region / State', type: 'autocomplete', acField: 'region_country_code', hint: 'e.g. California' },
  { key: 'city_region', label: 'City', type: 'autocomplete', acField: 'city_region', hint: 'e.g. New York' },
  { key: 'linkedin_category', label: 'Industry', type: 'autocomplete', acField: 'linkedin_category', hint: 'Search industries' },
  { key: 'company_revenue', label: 'Revenue', type: 'checkbox', options: opts(REVENUE_BUCKETS) },
  { key: 'company_size', label: 'Number of employees', type: 'checkbox', options: opts(SIZE_BUCKETS) },
  { key: 'company_name', label: 'Company name', type: 'textMulti', hint: 'Add a name and press Enter' },
  { key: 'business_id', label: 'Explorium Business Id', type: 'textMulti', hint: '32-character id' },
  { key: 'job_level', label: 'Management level', type: 'checkbox', options: titleOpts(['c-suite', 'founder', 'owner', 'president', 'partner', 'vice president', 'director', 'manager', 'senior non-managerial', 'non-managerial', 'board member', 'advisor']) },
  { key: 'job_title', label: 'Job title', type: 'autocomplete', acField: 'job_title', hint: 'Search titles' },
  { key: 'job_department', label: 'Department', type: 'checkbox', options: titleOpts(['engineering', 'sales', 'marketing', 'product', 'operations', 'finance', 'human resources', 'it', 'customer success', 'security', 'strategy', 'r&d', 'design', 'data', 'legal', 'business development', 'general management']) },
  {
    key: 'contact_info',
    label: 'Contact availability',
    type: 'toggleGroup',
    toggles: [
      { key: 'has_email', label: 'Has email address' },
      { key: 'has_phone_number', label: 'Has phone number' },
    ],
  },
]

export function filtersFor(mode: 'companies' | 'prospects') {
  return mode === 'companies' ? COMPANY_FILTERS : PROSPECT_FILTERS
}

// Count of active selections for a filter value (for the dropdown badge).
export function valueCount(v: any): number {
  if (v == null) return 0
  if (Array.isArray(v)) return v.length
  if (v === true) return 1
  if (typeof v === 'object' && Array.isArray(v.values)) return v.values.length
  return 0
}
