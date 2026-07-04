/**
 * Aliyun Bailian (Wanxiang) image generation Adapter
 * API docs: https://help.aliyun.com/zh/model-studio/text-to-image-v2-api-reference
 */
import type { ImageProviderAdapter, ImageGenerationRecord } from './types'
import { joinProviderUrl } from './url'

export class AliImageAdapter implements ImageProviderAdapter {
  readonly provider = 'ali'

  buildGenerateRequest(config: any, record: ImageGenerationRecord): {
    url: string
    method: string
    headers: Record<string, string>
    body: any
  } {
    const baseUrl = config.baseUrl || 'https://dashscope.aliyuncs.com'

    // wan2.6 uses the new async interface
    const url = joinProviderUrl(baseUrl, '/api/v1', '/services/aigc/image-generation/generation')

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    }

    // Parse size param (e.g. "1920x1080" -> "1696*960")
    const size = this.normalizeSize(record.size || '1280*1280')

    const body: any = {
      model: record.model || 'wan2.6-t2i',
      input: {
        messages: [
          {
            role: 'user',
            content: [{ text: record.prompt }],
          },
        ],
      },
      parameters: {
        size,
        n: 1,
        negative_prompt: '',
        prompt_extend: true,
        watermark: false,
        seed: record.referenceImages ? undefined : Math.floor(Math.random() * 2147483647),
      },
    }

    return { url, method: 'POST', headers, body }
  }

  parseGenerateResponse(result: any): {
    isAsync: boolean
    taskId?: string
    imageUrl?: string
  } {
    // PENDING indicates an async task was created
    if (result.output?.task_status === 'PENDING' && result.output?.task_id) {
      return { isAsync: true, taskId: result.output.task_id }
    }

    // Sync mode: return image URL directly
    if (result.output?.choices?.[0]?.message?.content?.[0]?.image) {
      return {
        isAsync: false,
        imageUrl: result.output.choices[0].message.content[0].image,
      }
    }

    // Unknown response format
    throw new Error(`Unexpected Ali image response: ${JSON.stringify(result).slice(0, 200)}`)
  }

  buildPollRequest(config: any, taskId: string): {
    url: string
    method: string
    headers: Record<string, string>
    body: any
  } {
    const baseUrl = config.baseUrl || 'https://dashscope.aliyuncs.com'
    return {
      url: joinProviderUrl(baseUrl, '/api/v1', `/tasks/${taskId}`),
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: undefined,
    }
  }

  parsePollResponse(result: any): {
    status: 'pending' | 'processing' | 'completed' | 'failed'
    imageUrl?: string
    error?: string
  } {
    const status = result.output?.task_status

    if (status === 'SUCCEEDED') {
      const imageUrl = result.output?.choices?.[0]?.message?.content?.[0]?.image
      return { status: 'completed', imageUrl }
    }

    if (status === 'FAILED') {
      return { status: 'failed', error: result.message || 'Generation failed' }
    }

    if (status === 'PENDING' || status === 'RUNNING') {
      return { status: 'processing' }
    }

    return { status: 'pending' }
  }

  extractImageBase64(result: any): { data: string; mimeType: string } | null {
    // Ali does not currently support direct base64 return
    return null
  }

  extractImageUrl(result: any): string | null {
    return result.output?.choices?.[0]?.message?.content?.[0]?.image || null
  }

  /**
   * Convert "1920x1080" to the "1696*960" format Aliyun requires
   */
  private normalizeSize(size: string): string {
    // Default ratio 16:9
    const [w, h] = size.split('x').map(Number)
    if (w && h) {
      // Map to the aspect ratios Ali supports
      const aspect = w / h
      if (aspect > 1.7) return '1696*960' // 16:9
      if (aspect < 0.8) return '960*1696' // 9:16
      return '1280*1280' // 1:1
    }
    return '1280*1280'
  }
}
