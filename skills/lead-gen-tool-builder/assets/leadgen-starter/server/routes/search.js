import { Router } from 'express'
import {
  fetchBusinesses,
  fetchProspects,
  autocomplete,
  enrichProspectContacts,
  matchBusinesses,
  enrichBusinessFirmographics,
  matchProspects,
  enrichProspectProfiles,
} from '../explorium.js'
import { normalizeBusiness, normalizeProspect } from '../normalize.js'

const router = Router()

// Match an uploaded CSV list to Explorium and enrich it. Body: { entity, items }.
router.post('/match', async (req, res) => {
  try {
    const { entity, items = [] } = req.body || {}
    if (entity === 'company') {
      const matched = await matchBusinesses(items)
      const ids = matched.map((m) => m.business_id).filter(Boolean)
      const firmo = await enrichBusinessFirmographics(ids)
      const rows = matched
        .filter((m) => m.business_id && firmo[m.business_id])
        .map((m) => normalizeBusiness({ ...firmo[m.business_id], business_id: m.business_id }))
      return res.json({ rows, matched: rows.length, total: items.length })
    }
    // prospects
    const matched = await matchProspects(items)
    const ids = matched.map((m) => m.prospect_id).filter(Boolean)
    const profiles = await enrichProspectProfiles(ids)
    const rows = ids
      .filter((id) => profiles[id])
      .map((id) => normalizeProspect({ ...profiles[id], prospect_id: id }))
    res.json({ rows, matched: rows.length, total: items.length })
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) })
  }
})

// Explorium's fetch endpoints return a SAMPLE capped at the requested size
// (total_results just echoes how many sample rows came back, not the true
// universe). So `sampled` is true when we hit that cap — meaning more matches
// exist beyond what's shown and the user should narrow filters to see them all.
const DEFAULT_SIZE = 50

router.post('/companies', async (req, res) => {
  try {
    const { filters = {}, page = 1, pageSize = DEFAULT_SIZE } = req.body || {}
    const json = await fetchBusinesses({ filters, page, pageSize })
    const rows = (json.data || []).map(normalizeBusiness)
    res.json({
      rows,
      count: rows.length,
      sampled: rows.length >= pageSize,
      sampleSize: pageSize,
      page: json.page ?? page,
    })
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) })
  }
})

router.post('/prospects', async (req, res) => {
  try {
    const { filters = {}, page = 1, pageSize = DEFAULT_SIZE } = req.body || {}
    const json = await fetchProspects({ filters, page, pageSize })
    const rows = (json.data || []).map(normalizeProspect)
    res.json({
      rows,
      count: rows.length,
      sampled: rows.length >= pageSize,
      sampleSize: pageSize,
      page: json.page ?? page,
    })
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) })
  }
})

router.get('/autocomplete', async (req, res) => {
  try {
    const { field, query = '' } = req.query
    if (!field) return res.status(400).json({ error: 'field required' })
    const data = await autocomplete(field, query)
    res.json(Array.isArray(data) ? data : data?.data || [])
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) })
  }
})

// Enrich selected prospects with contact info (emails/phones). Returns a map
// keyed by prospect id. Consumes Explorium credits — only called on demand.
router.post('/enrich/prospects', async (req, res) => {
  try {
    const { ids = [] } = req.body || {}
    const contacts = await enrichProspectContacts(ids)
    res.json({ contacts })
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) })
  }
})

export default router
