import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { fetchVbeeVoices } from './voice-tools'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
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