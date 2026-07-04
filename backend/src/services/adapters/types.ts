/**
 * Image-generation Provider Adapter interface
 */
export interface ImageProviderAdapter {
  /** Vendor identifier */
  provider: string

  /**
   * Build an image generation request
   * @param config AI config { baseUrl, apiKey, model }
   * @param record Image generation record
   */
  buildGenerateRequest(config: AIConfig, record: ImageGenerationRecord): ProviderRequest

  /**
   * Parse generation response, determine sync or async
   */
  parseGenerateResponse(result: any): ImageGenResponse

  /**
   * Build polling request
   * @param config AI config
   * @param taskId Task ID
   */
  buildPollRequest(config: AIConfig, taskId: string): ProviderRequest

  /**
   * Parse polling response
   */
  parsePollResponse(result: any): ImagePollResponse

  /**
   * Extract the image URL from the response (for direct download)
   * Return null when image data is base64 and needs to be processed by extractImageBase64
   */
  extractImageUrl(result: any): string | null

  /**
   * Extract base64 image data from the response
   * Only used for vendors like Gemini that return base64 only
   */
  extractImageBase64(result: any): { data: string; mimeType: string } | null
}

/**
 * Video generation Provider Adapter interface
 */
export interface VideoProviderAdapter {
  provider: string

  buildGenerateRequest(config: AIConfig, record: VideoGenerationRecord): ProviderRequest

  parseGenerateResponse(result: any): VideoGenResponse

  buildPollRequest(config: AIConfig, taskId: string): ProviderRequest

  parsePollResponse(result: any): VideoPollResponse

  extractVideoUrl(result: any): string | null
}

// ============ Common types ============

export interface ProviderRequest {
  url: string
  method: string
  headers: Record<string, string>
  body: any
}

export interface AIConfig {
  provider: string
  baseUrl: string
  apiKey: string
  model: string
}

export interface ImageGenerationRecord {
  id: number
  model?: string | null
  prompt?: string | null
  size?: string | null
  frameType?: string | null
  referenceImages?: string | null
  // ... other fields
}

export interface VideoGenerationRecord {
  id: number
  model?: string | null
  prompt?: string | null
  referenceMode?: string | null
  imageUrl?: string | null
  firstFrameUrl?: string | null
  lastFrameUrl?: string | null
  referenceImageUrls?: string | null
  duration?: number | null
  aspectRatio?: string | null
  // ... other fields
}

export interface ImageGenResponse {
  isAsync: boolean
  taskId?: string
  /** Direct image URL in sync mode */
  imageUrl?: string
}

export interface ImagePollResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  imageUrl?: string
  error?: string
}

export interface VideoGenResponse {
  isAsync: boolean
  taskId?: string
  videoUrl?: string
}

export interface VideoPollResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  error?: string
}

/**
 * TTS Provider Adapter
 */
export interface TTSProviderAdapter {
  provider: string

  buildGenerateRequest(config: AIConfig, params: any): ProviderRequest

  parseResponse(result: any): {
    audioHex: string
    audioLength: number
    sampleRate: number
    bitrate: number
    format: string
    channel: number
  }
}
