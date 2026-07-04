/**
 * Voice Assigner Agent tools
 */
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { db, schema } from '../../db/index.js'
import { eq } from 'drizzle-orm'
import { now } from '../../utils/response.js'
import { logTaskProgress, logTaskSuccess } from '../../utils/task-logger.js'

type VbeeVoice = {
  id: string
  name: string
  gender: 'male' | 'female' | string
  language: string
  traits: string
  suitable_for: string
  provider: string
  demo?: string
}

type VoiceCacheEntry = { key: string; expires: number; voices: VbeeVoice[] }
let voiceCache: VoiceCacheEntry | null = null
const VOICE_TTL_MS = 10 * 60 * 1000

export function clearVoiceCache() {
  voiceCache = null
}

export async function getOrSetVoiceCache<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<{ value: T; cached: boolean }> {
  const now = Date.now()
  if (voiceCache && voiceCache.key === key && voiceCache.expires > now) {
    return { value: voiceCache.voices as unknown as T, cached: true }
  }
  const value = await fetcher()
  voiceCache = { key, expires: now + ttlMs, voices: value as any }
  return { value, cached: false }
}

const VOICE_INSTRUCTION =
  "Match the most suitable voice based on the character's gender, personality, and age, and only select from the voice list available to the current episode's audio configuration."

export async function fetchVbeeVoices(config: any): Promise<VbeeVoice[]> {
  let settings: any = {}
  if (config.settings) {
    try {
      settings = JSON.parse(config.settings)
    } catch (e: any) {
      throw new Error('Vbee settings is not valid JSON: ' + (e?.message || String(e)))
    }
  }
  if (!settings.app_id) throw new Error('vbee settings missing app_id')

  const url = new URL('https://vbee.vn/api/public/v1/voices')
  url.searchParams.set('languageCode', 'vi-VN')
  url.searchParams.set('limit', '100')

  const resp = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'app-id': settings.app_id,
    },
  })

  if (!resp.ok) {
    throw new Error(`Vbee voices API responded ${resp.status}`)
  }

  const json: any = await resp.json()
  if (json?.status !== 1 || !json?.result?.voices) {
    throw new Error('Vbee voices response missing result.voices')
  }

  return json.result.voices.map((v: any) => ({
    id: v.code,
    name: v.name,
    gender: v.gender || 'neutral',
    language: v.language_code || 'vi-VN',
    traits: `${v.gender || 'neutral'} ${v.language_code || 'vi-VN'} voice`,
    suitable_for: v.name?.split(' - ')[0] || 'General',
    provider: 'vbee',
    demo: v.demo,
  }))
}

function openAiFallbackVoices(provider: string) {
  return [
    { id: 'alloy', name: 'Alloy', gender: 'Neutral', traits: 'Balanced, natural', suitable_for: 'Narration, general', language: 'Multilingual', provider },
    { id: 'echo', name: 'Echo', gender: 'Male', traits: 'Deep, steady', suitable_for: 'Mature male, narration', language: 'Multilingual', provider },
    { id: 'fable', name: 'Fable', gender: 'Male', traits: 'Warm, expressive', suitable_for: 'Young male, storytelling', language: 'Multilingual', provider },
    { id: 'onyx', name: 'Onyx', gender: 'Male', traits: 'Deep, powerful', suitable_for: 'Authoritative characters, villains', language: 'Multilingual', provider },
    { id: 'nova', name: 'Nova', gender: 'Female', traits: 'Gentle, sweet', suitable_for: 'Young women, heroines', language: 'Multilingual', provider },
    { id: 'shimmer', name: 'Shimmer', gender: 'Female', traits: 'Bright, lively', suitable_for: 'Lively women, girls', language: 'Multilingual', provider },
  ]
}

export function createVoiceTools(episodeId: number, dramaId: number) {
  function getEpisodeAudioProvider() {
    const [episode] = db.select().from(schema.episodes).where(eq(schema.episodes.id, episodeId)).all()
    if (!episode?.audioConfigId) return null
    const [config] = db.select().from(schema.aiServiceConfigs).where(eq(schema.aiServiceConfigs.id, episode.audioConfigId)).all()
    return config?.provider || null
  }

  const getCharacters = createTool({
    id: 'get_characters',
    description: 'Get all characters for the current drama with their current voice assignments.',
    inputSchema: z.object({}),
    execute: async () => {
      const chars = db.select().from(schema.characters)
        .where(eq(schema.characters.dramaId, dramaId)).all()
      const payload = {
        characters: chars.map(c => ({
          id: c.id,
          name: c.name,
          role: c.role,
          personality: c.personality,
          description: c.description,
          current_voice: c.voiceStyle || 'unassigned',
        })),
      }
      logTaskSuccess('VoiceTool', 'get-characters', { episodeId, dramaId, count: payload.characters.length })
      return payload
    },
  })

  const listVoices = createTool({
    id: 'list_voices',
    description: 'List all available voice options for TTS.',
    inputSchema: z.object({}),
    execute: async () => {
      const provider = getEpisodeAudioProvider() || 'minimax'

      if (provider === 'vbee') {
        // Look up audio config to read api_key + settings
        const [episode] = db.select().from(schema.episodes).where(eq(schema.episodes.id, episodeId)).all()
        const cfg = episode?.audioConfigId
          ? db.select().from(schema.aiServiceConfigs).where(eq(schema.aiServiceConfigs.id, episode.audioConfigId)).all()[0]
          : undefined
        const cacheKey = cfg ? `${cfg.id}:${(cfg.apiKey || '').slice(0, 6)}` : 'no-config'

        try {
          if (!cfg) throw new Error('No audio config attached to episode')
          const { value: voices, cached } = await getOrSetVoiceCache(cacheKey, VOICE_TTL_MS, () => fetchVbeeVoices(cfg))
          const payload = {
            provider,
            voices,
            cached,
            instruction: VOICE_INSTRUCTION,
          }
          logTaskSuccess('VoiceTool', 'list-voices', { episodeId, provider, count: payload.voices.length, cached })
          return payload
        } catch (error: any) {
          logTaskProgress('VoiceTool', 'list-voices-degraded', {
            episodeId, provider, error: error?.message,
          })
          return { provider, voices: openAiFallbackVoices(provider), degraded: true }
        }
      }

      const rows = db.select().from(schema.aiVoices).where(eq(schema.aiVoices.provider, provider)).all()
      const voices = rows.length ? rows.map(v => {
        const desc = v.description ? JSON.parse(v.description) : []
        return {
          id: v.voiceId,
          name: v.voiceName,
          gender: inferGender(v.voiceName, desc),
          traits: Array.isArray(desc) && desc.length ? desc.slice(0, 2).join(', ') : `${v.language || 'Multilingual'} voice`,
          suitable_for: Array.isArray(desc) && desc.length > 2 ? desc.slice(2).join(', ') : `${v.language || 'General'} character`,
          language: v.language,
          provider,
        }
      }) : openAiFallbackVoices(provider)

      const payload = {
        provider,
        voices,
        instruction: VOICE_INSTRUCTION,
      }
      logTaskSuccess('VoiceTool', 'list-voices', { episodeId, provider, count: payload.voices.length })
      return payload
    },
  })

  const assignVoice = createTool({
    id: 'assign_voice',
    description: 'Assign a voice to a character.',
    inputSchema: z.object({
      character_id: z.number().describe('Character ID'),
      voice_id: z.string().describe('Voice ID from list_voices'),
      reason: z.string().optional().describe('Why this voice fits'),
    }),
    execute: async ({ character_id, voice_id, reason }) => {
      const provider = getEpisodeAudioProvider() || 'minimax'
      logTaskProgress('VoiceTool', 'assign-begin', { episodeId, dramaId, characterId: character_id, voiceId: voice_id, provider, reason })
      db.update(schema.characters)
        .set({ voiceStyle: voice_id, voiceProvider: provider, voiceSampleUrl: null, updatedAt: now() })
        .where(eq(schema.characters.id, character_id))
        .run()
      logTaskSuccess('VoiceTool', 'assign-complete', { episodeId, characterId: character_id, voiceId: voice_id, provider })
      return { message: `Assigned voice "${voice_id}" to character ${character_id}`, reason }
    },
  })

  return { getCharacters, listVoices, assignVoice }
}

function inferGender(name: string, desc: unknown) {
  const description = Array.isArray(desc) ? desc.join(' ') : ''
  const text = `${name} ${description}`
  if (/(boy|man|male)/i.test(text)) return 'Male'
  if (/(girl|woman|female)/i.test(text)) return 'Female'
  return 'Neutral'
}
