/**
 * MiniMax video generation Adapter
 * Async-only: POST /v1/video_generation → poll /v1/query/video_generation →
 * GET /v1/files/retrieve?file_id=... → file.download_url
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
import { logTaskWarn } from '../../utils/task-logger.js'

export class MiniMaxVideoAdapter implements VideoProviderAdapter {
  provider = 'minimax'

  buildGenerateRequest(config: AIConfig, record: VideoGenerationRecord): ProviderRequest {
    const body: any = {
      model: record.model || config.model || 'MiniMax-Hailuo-02',
      prompt: record.prompt,
      duration: record.duration || 6,
      resolution: '1080P',
    }

    if (record.firstFrameUrl) {
      body.first_frame_image = record.firstFrameUrl
    }
    if (record.lastFrameUrl) {
      body.last_frame_image = record.lastFrameUrl
    }

    if (record.referenceImageUrls) {
      try {
        const refs: string[] = JSON.parse(record.referenceImageUrls)
        if (refs.length > 0) {
          body.subject_reference = refs.map((url) => ({
            type: 'image',
            image: [url],
          }))
        }
      } catch {}
    }

    // record.aspectRatio is stored as "16:9" etc but MiniMax controls this via
    // `resolution`. Keep it as an out-of-band log only — sending it would 2013.
    if (record.aspectRatio) {
      logTaskWarn('MiniMaxVideo', 'aspect-ratio-ignored', {
        id: record.id,
        aspectRatio: record.aspectRatio,
      })
    }

    return {
      url: joinProviderUrl(config.baseUrl, '/v1', '/video_generation'),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body,
    }
  }

  parseGenerateResponse(result: any): VideoGenResponse {
    const taskId = result.task_id || result.data?.task_id
    if (taskId) {
      return { isAsync: true, taskId }
    }
    throw new Error('MiniMax video generation is async-only — no task_id in response')
  }

  buildPollRequest(config: AIConfig, taskId: string): ProviderRequest {
    return {
      url: joinProviderUrl(config.baseUrl, '/v1', `/query/video_generation?task_id=${encodeURIComponent(taskId)}`),
      method: 'GET',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: undefined,
    }
  }

  parsePollResponse(result: any): VideoPollResponse {
    const status = result.status
    if (status === 'Success') {
      const fileId = result.file_id || result.data?.file_id
      return { status: 'completed', fileId }
    }
    if (status === 'Fail') {
      return {
        status: 'failed',
        error: result.error_message || result.data?.error_message || 'Video generation failed',
      }
    }
    return { status: 'processing' }
  }

  buildFileRetrieveRequest(config: AIConfig, fileId: string): ProviderRequest {
    return {
      url: joinProviderUrl(config.baseUrl, '/v1', `/files/retrieve?file_id=${encodeURIComponent(fileId)}`),
      method: 'GET',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: undefined,
    }
  }

  parseFileRetrieveResponse(result: any): string | null {
    return result.file?.download_url || result.data?.file?.download_url || null
  }

  extractVideoUrl(result: any): string | null {
    return (
      result.file?.download_url ||
      result.data?.file?.download_url ||
      result.video_url ||
      result.data?.video_url ||
      null
    )
  }
}