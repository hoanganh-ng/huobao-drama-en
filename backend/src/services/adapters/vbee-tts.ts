/**
 * Vbee TTS Adapter
 * API: POST https://api.vbee.vn/v1/tts (sync mode)
 * Auth: Authorization: Bearer <access_token> + app-id: <app_id>
 * Response: binary MP3/WAV/PCM stream on success, JSON { error: { code, message } } on failure.
 */
import type { TTSProviderAdapter } from './types'
import { joinProviderUrl } from './url'

export interface VbeeTTSParams {
  text: string
  voice: string
  speed?: number
}

interface VbeeSettings {
  app_id?: string
}

export class VbeeTTSAdapter implements TTSProviderAdapter {
  readonly provider = 'vbee'

  private readAppId(config: any): string {
    const settings: VbeeSettings = config?.settings ? JSON.parse(config.settings) : {}
    if (!settings.app_id) {
      throw new Error('Vbee adapter requires app_id in settings JSON')
    }
    return settings.app_id
  }

  buildGenerateRequest(config: any, params: VbeeTTSParams): {
    url: string
    method: string
    headers: Record<string, string>
    body: any
  } {
    const appId = this.readAppId(config)
    const url = joinProviderUrl(config.baseUrl, '/v1', '/tts')

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${config.apiKey}`,
      'app-id': appId,
      'Content-Type': 'application/json',
    }

    const body: any = {
      text: params.text,
      mode: 'sync',
      voiceCode: params.voice,
      outputFormat: 'mp3',
      speed: params.speed ?? 1.0,
      bitrate: 128,
    }

    return { url, method: 'POST', headers, body }
  }

  parseResponse(): never {
    throw new Error('VbeeTTSAdapter uses parseBinaryResponse; parseResponse is not implemented')
  }

  parseBinaryResponse(raw: ArrayBuffer): {
    audioHex: string
    audioLength: number
    sampleRate: number
    bitrate: number
    format: string
    channel: number
  } {
    const buf = Buffer.from(raw)
    if (buf.length > 0 && buf[0] === 0x7B /* '{' */) {
      // Vbee returns JSON on errors even when the body could be read as binary
      try {
        const parsed = JSON.parse(buf.toString('utf8'))
        const err = parsed?.error
        if (err?.code || err?.message) {
          throw new Error(`Vbee ${err.code || 'ERROR'}: ${err.message || 'unknown error'}`)
        }
      } catch (e) {
        if (e instanceof Error && e.message.startsWith('Vbee ')) throw e
        // fall through: treat malformed JSON as audio bytes
      }
    }
    return {
      audioHex: buf.toString('hex'),
      audioLength: 0, // Vbee does not return duration; ffmpeg handles it downstream
      sampleRate: 32000,
      bitrate: 128000,
      format: 'mp3',
      channel: 1,
    }
  }
}

export default VbeeTTSAdapter
