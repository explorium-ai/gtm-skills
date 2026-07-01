import { Router } from 'express'
import { enrichProspectContacts } from '../explorium.js'
import * as sf from '../salesforce.js'
import * as hs from '../hubspot.js'

const router = Router()

// Pick the best email/phone out of an Explorium contacts enrichment blob.
function pickContact(blob = {}) {
  const email =
    blob.professions_email ||
    blob.professional_email ||
    (Array.isArray(blob.emails) && blob.emails[0]?.email) ||
    null
  const phone =
    blob.mobile_phone ||
    (Array.isArray(blob.phone_numbers) && blob.phone_numbers[0]?.phone_number) ||
    null
  return { email, phone }
}

// Enrich prospect rows that are missing email/phone before pushing.
async function withContacts(records) {
  const need = records.filter((r) => r.id && !r.email)
  if (need.length === 0) return records
  const map = await enrichProspectContacts(need.map((r) => r.id))
  return records.map((r) => {
    if (r.email || !map[r.id]) return r
    return { ...r, ...pickContact(map[r.id]) }
  })
}

router.post('/salesforce', async (req, res) => {
  const { entity, records = [], mapping } = req.body || {}
  try {
    const enriched = entity === 'prospect' ? await withContacts(records) : records
    const object = entity === 'prospect' ? 'Lead' : 'Account'
    const results = await sf.createRecords(object, enriched, mapping)
    res.json({ crm: 'salesforce', entity, object, results })
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) })
  }
})

router.post('/hubspot', async (req, res) => {
  const { entity, records = [], mapping } = req.body || {}
  try {
    const enriched = entity === 'prospect' ? await withContacts(records) : records
    const object = entity === 'prospect' ? 'contacts' : 'companies'
    const results = await hs.createRecords(object, enriched, mapping)
    res.json({ crm: 'hubspot', entity, object, results })
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) })
  }
})

// Expose default mappings so the UI can show/edit the sync field map.
router.get('/mapping/:crm/:entity', (req, res) => {
  const { crm, entity } = req.params
  const object =
    crm === 'salesforce'
      ? entity === 'prospect' ? 'Lead' : 'Account'
      : entity === 'prospect' ? 'contacts' : 'companies'
  const table = crm === 'salesforce' ? sf.SF_DEFAULT_MAPPING : hs.HS_DEFAULT_MAPPING
  res.json({ crm, entity, object, fields: (table[object] || []).map((f) => ({ ...f, enabled: true })) })
})

router.get('/status', async (_req, res) => {
  const out = {}
  try { out.salesforce = await sf.ping() } catch (e) { out.salesforce = { connected: false, error: String(e.message || e) } }
  try { out.hubspot = await hs.ping() } catch (e) { out.hubspot = { connected: false, error: String(e.message || e) } }
  res.json(out)
})

export default router
