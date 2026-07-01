import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import searchRoutes from './routes/search.js'
import crmRoutes from './routes/crm.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json({ limit: '4mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api', searchRoutes)
app.use('/api/crm', crmRoutes)

// Serve the built frontend in production (dev uses the Vite server + proxy).
const dist = path.join(__dirname, '..', 'dist')
app.use(express.static(dist))
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))

app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`))
