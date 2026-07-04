/**
 * AI voice management
 * GET  /api/v1/ai-voices       - fetch voice list
 * POST /api/v1/ai-voices/sync  - sync voices from MiniMax
 */
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db, schema } from '../db/index.js'
import { success, badRequest, now } from '../utils/response.js'
import { joinProviderUrl } from '../services/adapters/url.js'

const app = new Hono()

// GET /ai-voices?provider=minimax
app.get('/', async (c) => {
  const provider = c.req.query('provider') || 'minimax'
  const rows = db.select().from(schema.aiVoices)
    .where(eq(schema.aiVoices.provider, provider))
    .all()

  const parsed = rows.map(r => ({
    voice_id: r.voiceId,
    voice_name: r.voiceName,
    description: r.description ? JSON.parse(r.description) : [],
    language: r.language,
    provider: r.provider,
  }))

  return success(c, parsed)
})

// POST /ai-voices/sync
app.post('/sync', async (c) => {
  // Fetch minimax audio config from DB
  const rows = db.select().from(schema.aiServiceConfigs)
    .where(eq(schema.aiServiceConfigs.serviceType, 'audio'))
    .all()
    .filter(r => r.isActive && r.provider === 'minimax')

  if (rows.length === 0) {
    return badRequest(c, 'No active minimax audio config found')
  }

  const config = rows[0]
  if (!config.apiKey) {
    return badRequest(c, 'MiniMax API key not configured')
  }

  // Call MiniMax get_voice API
  const resp = await fetch(joinProviderUrl(config.baseUrl, '/v1', '/get_voice'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ voice_type: 'all' }),
  })

  if (!resp.ok) {
    return badRequest(c, `MiniMax API error: ${resp.status}`)
  }

  const result = await resp.json() as any
  if (result.base_resp?.status_code !== 0) {
    return badRequest(c, result.base_resp?.status_msg || 'Failed to fetch voices')
  }

  const voices = (result.system_voice || []).filter((v: any) => shouldKeepVoice(v))
  const ts = now()

  // Clear old data first
  db.delete(schema.aiVoices).where(eq(schema.aiVoices.provider, 'minimax')).run()

  // Bulk-insert new data
  const insertRows = voices.map((v: any) => ({
    voiceId: v.voice_id,
    voiceName: v.voice_name,
    description: JSON.stringify(v.description || []),
    language: extractLanguage(v.voice_id, v.voice_name),
    provider: 'minimax',
    createdAt: ts,
  }))

  if (insertRows.length > 0) {
    db.insert(schema.aiVoices).values(insertRows).run()
  }

  return success(c, { count: insertRows.length, message: `Synced ${insertRows.length} voices` })
})

/**
 * Infer language from voice_id or voice_name.
 * MiniMax voice_ids embed the language (e.g. Cantonese_ProfessionalHost,
 * Chinese (Mandarin)_News_Anchor) so we match the provider's own naming convention.
 */
function extractLanguage(voiceId: string, voiceName: string): string {
  const text = `${voiceId} ${voiceName}`.toLowerCase()
  if (text.includes('cantonese')) return 'Cantonese'
  if (text.includes('english') || text.includes('aussie')) return 'English'
  if (text.includes('japanese')) return 'Japanese'
  if (text.includes('korean')) return 'Korean'
  if (text.includes('spanish')) return 'Spanish'
  if (text.includes('portuguese')) return 'Portuguese'
  if (text.includes('french')) return 'French'
  if (text.includes('indonesian')) return 'Indonesian'
  if (text.includes('german')) return 'German'
  if (text.includes('russian')) return 'Russian'
  if (text.includes('italian')) return 'Italian'
  if (text.includes('arabic')) return 'Arabic'
  if (text.includes('turkish')) return 'Turkish'
  if (text.includes('ukrainian')) return 'Ukrainian'
  if (text.includes('dutch')) return 'Dutch'
  if (text.includes('vietnamese')) return 'Vietnamese'
  if (text.includes('chinese') || text.includes('mandarin')) return 'Chinese'
  return 'Other'
}

function shouldKeepVoice(voice: { voice_id: string, voice_name: string }) {
  // Keep Chinese, Cantonese, and English voices. Other languages are filtered out.
  const language = extractLanguage(voice.voice_id, voice.voice_name)
  if (!['Chinese', 'Cantonese', 'English'].includes(language)) return false

  const text = `${voice.voice_id} ${voice.voice_name}`.toLowerCase()

  const excludedPatterns = [
    'jingpin',
    '-beta',
    'cartoon_pig',
    'cute_boy',
    'lovely_girl',
    'clever_boy',
    'robot_armor',
    'news_anchor',
    'male_announcer',
    'radio_host',
    'hk_flight_attendant',
  ]

  return !excludedPatterns.some(pattern => text.includes(pattern))
}

export default app
