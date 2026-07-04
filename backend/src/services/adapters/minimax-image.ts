/**
 * MiniMax image generation Adapter
 * Synchronous API: POST /v1/image_generation returns image_urls in one shot.
 * No reference-image input, no task_id, no polling.
 */
import type {
  ImageProviderAdapter,
  ProviderRequest,
  AIConfig,
  ImageGenerationRecord,
  ImageGenResponse,
  ImagePollResponse,
} from './types'
import { joinProviderUrl } from './url'
import { logTaskWarn } from '../../utils/task-logger.js'

export class MiniMaxImageAdapter implements ImageProviderAdapter {
  provider = 'minimax'

  buildGenerateRequest(config: AIConfig, record: ImageGenerationRecord): ProviderRequest {
    const body: any = {
      model: record.model || config.model || 'image-01',
      prompt: record.prompt,
      n: 1,
    }

    // MiniMax accepts aspect_ratio OR (width, height) pair — record.size may be
    // either "16:9" or "1920x1080".
    const size = record.size || '16:9'
    if (/^\d+:\d+$/.test(size)) {
      body.aspect_ratio = size
    } else {
      const [w, h] = size.split('x').map(Number)
      if (w && h) {
        body.width = w
        body.height = h
      }
    }

    // MiniMax T2I has no image input — warn and drop silently.
    if (record.referenceImages) {
      logTaskWarn('MiniMaxImage', 'reference-images-unsupported', { id: record.id })
    }

    return {
      url: joinProviderUrl(config.baseUrl, '/v1', '/image_generation'),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body,
    }
  }

  parseGenerateResponse(result: any): ImageGenResponse {
    const imageUrl =
      result.data?.image_urls?.[0] ||
      result.data?.[0]?.url ||
      result.image_url ||
      result.url
    if (imageUrl) {
      return { isAsync: false, imageUrl }
    }
    throw new Error('No image URL in MiniMax response')
  }

  // MiniMax T2I is fully synchronous — no task_id, no polling endpoint.
  // These methods exist only to satisfy the adapter interface.
  buildPollRequest(_config: AIConfig, _taskId: string): ProviderRequest {
    throw new Error('MiniMax image generation does not support async polling')
  }

  parsePollResponse(_result: any): ImagePollResponse {
    throw new Error('MiniMax image generation does not support async polling')
  }

  extractImageUrl(result: any): string | null {
    return (
      result.data?.image_urls?.[0] ||
      result.data?.[0]?.url ||
      result.image_url ||
      result.url ||
      null
    )
  }

  extractImageBase64(result: any): { data: string; mimeType: string } | null {
    const b64 = result.data?.image_base64?.[0]
    return b64 ? { data: b64, mimeType: 'image/png' } : null
  }
}
