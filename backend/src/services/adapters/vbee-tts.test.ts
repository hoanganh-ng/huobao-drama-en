import { test } from 'node:test'
import assert from 'node:assert/strict'
import { VbeeTTSAdapter } from './vbee-tts'

const adapter = new VbeeTTSAdapter()

const baseConfig = {
  provider: 'vbee',
  baseUrl: 'https://api.vbee.vn',
  apiKey: 'test-token',
  model: 'hn_female_ngochuyen_full_48k-fhg',
  settings: JSON.stringify({ app_id: 'test-app-id' }),
}

test('provider identifier is "vbee"', () => {
  assert.equal(adapter.provider, 'vbee')
})

test('buildGenerateRequest produces correct URL, headers, and body', () => {
  const req = adapter.buildGenerateRequest(baseConfig, { text: 'Xin chào', voice: 'hn_female_ngochuyen_full_48k-fhg' })
  assert.equal(req.url, 'https://api.vbee.vn/v1/tts')
  assert.equal(req.method, 'POST')
  assert.equal(req.headers['Authorization'], 'Bearer test-token')
  assert.equal(req.headers['app-id'], 'test-app-id')
  assert.equal(req.headers['Content-Type'], 'application/json')
  assert.equal(req.body.text, 'Xin chào')
  assert.equal(req.body.mode, 'sync')
  assert.equal(req.body.voiceCode, 'hn_female_ngochuyen_full_48k-fhg')
  assert.equal(req.body.outputFormat, 'mp3')
  assert.equal(req.body.speed, 1.0)
  assert.equal(req.body.bitrate, 128)
})

test('buildGenerateRequest throws when app_id missing in settings', () => {
  const cfg = { ...baseConfig, settings: JSON.stringify({}) }
  assert.throws(
    () => adapter.buildGenerateRequest(cfg, { text: 'hi', voice: 'v1' }),
    /app_id in settings JSON/,
  )
})

test('buildGenerateRequest throws when settings is empty string', () => {
  const cfg = { ...baseConfig, settings: '' }
  assert.throws(
    () => adapter.buildGenerateRequest(cfg, { text: 'hi', voice: 'v1' }),
    /app_id in settings JSON/,
  )
})

test('buildGenerateRequest honors explicit speed', () => {
  const req = adapter.buildGenerateRequest(baseConfig, { text: 'hi', voice: 'v1', speed: 1.5 })
  assert.equal(req.body.speed, 1.5)
})

test('parseBinaryResponse with MP3-like buffer returns hex + mp3 format', () => {
  // ID3v2 header magic: "ID3"
  const buf = Buffer.concat([Buffer.from('ID3', 'utf8'), Buffer.from([0x03, 0x00, 0x00])])
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const result = adapter.parseBinaryResponse(ab)
  assert.equal(result.format, 'mp3')
  assert.equal(result.audioHex, buf.toString('hex'))
  assert.equal(result.sampleRate, 32000)
  assert.equal(result.bitrate, 128000)
  assert.equal(result.channel, 1)
})

test('parseBinaryResponse with JSON error buffer throws Vbee <code>: <message>', () => {
  const json = JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'text must be <= 300 chars' } })
  const buf = Buffer.from(json, 'utf8')
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  assert.throws(
    () => adapter.parseBinaryResponse(ab),
    /Vbee BAD_REQUEST: text must be <= 300 chars/,
  )
})

test('parseBinaryResponse with malformed JSON does not throw', () => {
  // starts with '{' but isn't valid JSON; should be treated as audio bytes
  const buf = Buffer.from('{not valid json', 'utf8')
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const result = adapter.parseBinaryResponse(ab)
  assert.equal(result.format, 'mp3')
  assert.equal(result.audioHex, buf.toString('hex'))
})