// Normalize Explorium raw rows into the flat shape the UI/CRM use.

export function normalizeBusiness(r = {}) {
  return {
    id: r.business_id,
    name: r.name,
    domain: r.domain,
    website: r.website,
    logo: r.logo,
    industry: r.naics_description || r.sic_code_description || null,
    naics: r.naics,
    employees: r.number_of_employees_range,
    revenue: r.yearly_revenue_range,
    country: r.country_name,
    city: r.city_name,
    region: r.region,
    description: r.business_description,
    linkedin: r.linkedin_profile,
    intentTopics: r.business_intent_topics,
  }
}

export function normalizeProspect(r = {}) {
  const exp = Array.isArray(r.experience) ? r.experience : []
  return {
    id: r.prospect_id,
    fullName: r.full_name,
    firstName: r.first_name,
    lastName: r.last_name,
    jobTitle: r.job_title || exp.find((e) => /director|president|chief|manager|officer|head/i.test(e)) || null,
    jobLevel: r.job_level_main || null,
    jobDepartment: r.job_department_main || null,
    companyName: r.company_name || null,
    companyDomain: r.company_website || null,
    businessId: r.business_id || null,
    country: r.country_name,
    region: r.region_name,
    city: r.city,
    linkedin: r.linkedin,
    skills: r.skills,
    hasEmail: Boolean(r.professional_email_hashed),
  }
}
