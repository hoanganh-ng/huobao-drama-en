/**
 * Vidu video generation Adapter
 * Endpoint: /ent/v2/img2video
 * Auth: Authorization: Token {apiKey} (NOT Bearer!)
 * Vidu does not provide a polling endpoint; relies on webhook callbacks to notify results
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

export class ViduVideoAdapter implements VideoProviderAdapter {
  provider = 'vidu'

  buildGenerateRequest(config: AIConfig, record: VideoGenerationRecord): ProviderRequest {
    const model = record.model || config.model || 'viduq3-turbo'

    const body: any = {
      model,
      images: [], // Filled by caller
      prompt: record.prompt,
    }

    // Add reference images
    if (record.referenceMode === 'single' && record.imageUrl) {
      body.images.push(record.imageUrl)
    } else if (record.referenceMode === 'first_last') {
      if (record.firstFrameUrl) body.images.push(record.firstFrameUrl)
      if (record.lastFrameUrl) body.images.push(record.lastFrameUrl)
    } else if (record.referenceMode === 'multiple' && record.referenceImageUrls) {
      try {
        const refs = JSON.parse(record.referenceImageUrls)
        body.images.push(...refs)
      } catch {}
    }

    // Optional params
    if (record.duration) body.duration = record.duration
    if (record.aspectRatio) {
      // Vidu uses the resolution param, not aspect ratio
      const ratioMap: Record<string, string> = {
        '16:9': '720p',
        '9:16': '720p',
        '1:1': '720p',
      }
      body.resolution = ratioMap[record.aspectRatio] || '720p'
    }

    return {
      url: joinProviderUrl(config.baseUrl, '', '/ent/v2/img2video'),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${config.apiKey}`, // Note: NOT Bearer!
      },
      body,
    }
  }

  parseGenerateResponse(result: any): VideoGenResponse {
    if (result.task_id) {
      return { isAsync: true, taskId: result.task_id }
    }
    // Sync return (very unlikely)
    if (result.video_url) {
      return { isAsync: false, videoUrl: result.video_url }
    }
    throw new Error('No task_id in Vidu response')
  }

  /**
   * Vidu does not provide a polling endpoint!
   * This method is never called; polling is done via webhook callbacks
   * Return an invalid request so polling ends immediately and falls back to webhooks
   */
  buildPollRequest(config: AIConfig, taskId: string): ProviderRequest {
    // Vidu has no polling endpoint; return an unreachable URL
    // Polling will time out and finally rely on webhook callbacks to update status
    return {
      url: 'vidu://no-polling-endpoint',
      method: 'GET',
      headers: {},
      body: undefined,
    }
  }

  /**
   * Vidu polling always returns processing because there is no polling endpoint
   * Actual state is updated via webhook
   */
  parsePollResponse(result: any): VideoPollResponse {
    return { status: 'processing' }
  }

  extractVideoUrl(result: any): string | null {
    return result.video_url || null
  }

  /**
   * Vidu callback state mapping
   * Webhook route uses this method to parse callbacks
   */
  static parseCallbackState(body: any): { status: 'completed' | 'failed'; videoUrl?: string; error?: string } {
    const state = body.state
    if (state === 'success') {
      return { status: 'completed', videoUrl: body.video_url }
    }
    if (state === 'failed') {
      return { status: 'failed', error: body.error || 'Vidu generation failed' }
    }
    return { status: 'failed', error: `Unknown state: ${state}` }
  }
}
