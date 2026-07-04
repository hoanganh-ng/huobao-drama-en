import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { fetchVbeeVoices, getOrSetVoiceCache, clearVoiceCache } from './voice-tools'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  clearVoiceCache()
})

const baseCfg = {
  apiKey: 'tok',
  baseUrl: 'https://api.vbee.vn',
  settings: JSON.stringify({ app_id: 'app1' }),
}

function jsonResponse(body: any, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Server Error',
    json: async () => body,
  } as any
}

test('fetchVbeeVoices shapes Vbee response into voice entries', async () => {
  let captured: any
  globalThis.fetch = async (url: any, init: any) => {
    captured = { url, init }
    return jsonResponse({
      status: 1,
      result: {
        voices: [
          { code: 'hn_female_v1', name: 'HN - Mai', gender: 'female', language_code: 'vi-VN', demo: 'https://x/a.mp3' },
        ],
      },
    })
  }

  const voices = await fetchVbeeVoices(baseCfg)

  assert.equal(voices.length, 1)
  assert.equal(voices[0].id, 'hn_female_v1')
  assert.equal(voices[0].name, 'HN - Mai')
  assert.equal(voices[0].gender, 'female')
  assert.equal(voices[0].language, 'vi-VN')
  assert.equal(voices[0].provider, 'vbee')
  assert.equal(voices[0].demo, 'https://x/a.mp3')

  assert.ok(captured.url.includes('languageCode=vi-VN'))
  assert.ok(captured.url.includes('limit=100'))
  assert.equal(captured.init.headers.Authorization, 'Bearer tok')
  assert.equal(captured.init.headers['app-id'], 'app1')
})

test('fetchVbeeVoices app_id missing', async () => {
  await assert.rejects(
    fetchVbeeVoices({ ...baseCfg, settings: JSON.stringify({}) }),
    /app_id/,
  )
})

test('fetchVbeeVoices on non-ok response', async () => {
  globalThis.fetch = async () => jsonResponse({}, false) as any
  await assert.rejects(fetchVbeeVoices(baseCfg), /responded 500/)
})

test('fetchVbeeVoices response missing voices', async () => {
  globalThis.fetch = async () => jsonResponse({ status: 0, result: {} }) as any
  await assert.rejects(fetchVbeeVoices(baseCfg), /missing result\.voices/)
})

test('getOrSetVoiceCache: cache hit on second call skips fetcher', async () => {
  const fake = [{ voiceCode: 'v1', displayName: 'V1' }]
  let calls = 0
  const fetcher = async () => { calls++; return fake }
  const first = await getOrSetVoiceCache('key-a', 60_000, fetcher)
  const second = await getOrSetVoiceCache('key-a', 60_000, fetcher)
  assert.equal(calls, 1)
  assert.equal(first.cached, false)
  assert.equal(second.cached, true)
  assert.equal(second.value, fake)
})

test('getOrSetVoiceCache: fetcher exception propagates (caller handles degraded)', async () => {
  let calls = 0
  const fetcher = async () => { calls++; throw new Error('upstream 500') }
  await assert.rejects(getOrSetVoiceCache('key-b', 60_000, fetcher), /upstream 500/)
  assert.equal(calls, 1)
  // second call with same key + failed fetcher still hits the catch path
  await assert.rejects(getOrSetVoiceCache('key-b', 60_000, fetcher), /upstream 500/)
  assert.equal(calls, 2)
})