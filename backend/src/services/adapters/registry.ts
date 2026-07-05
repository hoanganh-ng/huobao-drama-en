/**
 * Provider Adapter registry
 * Returns the matching Adapter instance by provider name
 */
import { MiniMaxImageAdapter } from './minimax-image'
import { MiniMaxVideoAdapter } from './minimax-video'
import { MiniMaxTTSAdapter } from './minimax-tts'
import { VbeeTTSAdapter } from './vbee-tts'
import { OpenAIImageAdapter } from './openai-image'
import { GeminiImageAdapter } from './gemini-image'
import { VolcEngineImageAdapter } from './volcengine-image'
import { VolcEngineVideoAdapter } from './volcengine-video'
import { ViduVideoAdapter } from './vidu-video'
import { AliImageAdapter } from './ali-image'
import { AliVideoAdapter } from './ali-video'
import { Flow2ApiVideoAdapter } from './flow2api-video'
import type { ImageProviderAdapter, VideoProviderAdapter, TTSProviderAdapter } from './types'

// Image Adapter registry
export const imageAdapters: Record<string, ImageProviderAdapter> = {
  minimax: new MiniMaxImageAdapter(),
  openai: new OpenAIImageAdapter(),
  gemini: new GeminiImageAdapter(),
  volcengine: new VolcEngineImageAdapter(),
  ali: new AliImageAdapter(),
  // Chatfire - API format TBD, using OpenAI for now
  chatfire: new OpenAIImageAdapter(),
}

// Video Adapter registry
export const videoAdapters: Record<string, VideoProviderAdapter> = {
  minimax: new MiniMaxVideoAdapter(),
  volcengine: new VolcEngineVideoAdapter(),
  vidu: new ViduVideoAdapter(),
  ali: new AliVideoAdapter(),
  flow2api: new Flow2ApiVideoAdapter(),
  // Chatfire video - API format TBD
}

// TTS Adapter registry
export const ttsAdapters: Record<string, TTSProviderAdapter> = {
  minimax: new MiniMaxTTSAdapter(),
  vbee: new VbeeTTSAdapter(),
}

export function getTTSAdapter(provider: string): TTSProviderAdapter {
  return ttsAdapters[provider.toLowerCase()] || ttsAdapters['minimax']
}

/**
 * Get image Adapter
 * @param provider Vendor name
 * @returns Matching Adapter, falls back to MiniMax default for unknown vendors
 */
export function getImageAdapter(provider: string): ImageProviderAdapter {
  return imageAdapters[provider.toLowerCase()] || imageAdapters['minimax']
}

/**
 * Get video Adapter
 * @param provider Vendor name
 * @returns Matching Adapter, falls back to MiniMax default for unknown vendors
 */
export function getVideoAdapter(provider: string): VideoProviderAdapter {
  return videoAdapters[provider.toLowerCase()] || videoAdapters['minimax']
}
