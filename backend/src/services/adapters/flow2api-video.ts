/**
 * Flow2API video generation Adapter
 * OpenAI-compatible: POST /v1/chat/completions with stream:false → JSON.
 * Video URL is returned inside choices[0].message.content as `<video src="...">`
 * (or a top-level `url` field when the server enriches the payload).
 * Sync — no polling. Model name carries orientation, e.g. veo_3_1_t2v_fast_landscape.
 */
import type {
  VideoProviderAdapter,
  ProviderRequest,
  AIConfig,
  VideoGenerationRecord,
  VideoGenResponse,
  VideoPollResponse,
} from './types'
import { joinProviderUrl } from './url'

const VIDEO_SRC_RE = /<video[^>]+src=['"]([^'"]+)['"]/i
const MD_LINK_RE = /!?\[[^\]]*\]\(([^)]+)\)/

export class Flow2ApiVideoAdapter implements VideoProviderAdapter {
  provider = 'flow2api'

  buildGenerateRequest(config: AIConfig, record: VideoGenerationRecord): ProviderRequest {
    const content: any[] = [{ type: 'text', text: record.prompt || '' }]

    // Image order encodes upstream mode:
    //  T2V → no images; I2V → 1 image (first) or 2 (first+last); R2V → up to 3 refs.
    const push = (url?: string | null) => {
      if (url) content.push({ type: 'image_url', image_url: { url } })
    }
    if (record.referenceMode === 'single') {
      push(record.imageUrl)
    } else if (record.referenceMode === 'first_last') {
      push(record.firstFrameUrl)
      push(record.lastFrameUrl)
    } else if (record.referenceMode === 'multiple' && record.referenceImageUrls) {
      try {
        for (const u of JSON.parse(record.referenceImageUrls) as string[]) push(u)
      } catch {}
    }

    return {
      url: joinProviderUrl(config.baseUrl, '/v1', '/chat/completions'),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: {
        model: record.model || config.model,
        messages: [{ role: 'user', content }],
        stream: false,
      },
    }
  }

  parseGenerateResponse(result: any): VideoGenResponse {
    if (result?.error) {
      const e = result.error
      throw new Error(`Flow2API video generation failed: ${e.message || JSON.stringify(e)}`)
    }
    const url = this.extractVideoUrl(result)
    if (url) return { isAsync: false, videoUrl: url }
    throw new Error('Flow2API returned no video URL in response')
  }

  // Sync provider — polling never runs, but the interface requires these.
  buildPollRequest(): ProviderRequest {
    return { url: 'flow2api://no-polling', method: 'GET', headers: {}, body: undefined }
  }

  parsePollResponse(): VideoPollResponse {
    return { status: 'processing' }
  }

  extractVideoUrl(result: any): string | null {
    if (typeof result?.url === 'string' && result.url.trim()) return result.url.trim()
    const content: string = result?.choices?.[0]?.message?.content || ''
    return VIDEO_SRC_RE.exec(content)?.[1]?.trim()
      || MD_LINK_RE.exec(content)?.[1]?.trim()
      || null
  }
}
