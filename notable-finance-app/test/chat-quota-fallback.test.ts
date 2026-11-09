import { afterEach, describe, expect, it, vi } from 'vitest'
import { freeModelChain, modelsForProvider } from '../src/main/chat/models'
import { createModelFallback } from '../src/main/chat/model-fallback'
import { QuotaExhaustedError, completeChat } from '../src/main/chat/provider'

// completeChat writes to the dev-log store, which needs an initialised sqlite
// handle this suite does not set up.
vi.mock('../src/main/dev-logs/store', () => ({ appendDevLog: vi.fn() }))

const spent = (model: string) =>
  new QuotaExhaustedError(model, `Free quota for "${model}" is exhausted`)

describe('freeModelChain', () => {
  it('starts at the requested model and keeps catalog priority order', () => {
    const chain = freeModelChain('alibaba', 'qwen3.6-flash')
    expect(chain[0]).toBe('qwen3.6-flash')
    expect(chain.slice(0, 4)).toEqual([
      'qwen3.6-flash',
      'qwen3.7-flash',
      'qwen3.8-flash',
      'qwen-flash-2025-07-28'
    ])
  })

  it('matches the account priority order for the default model', () => {
    expect(freeModelChain('alibaba', 'qwen-flash').slice(0, 8)).toEqual([
      'qwen-flash',
      'qwen3.5-flash',
      'qwen3.6-flash',
      'qwen3.7-flash',
      'qwen3.8-flash',
      'qwen-flash-2025-07-28',
      'deepseek-v4.1-flash',
      'qwen-plus'
    ])
  })

  it('never repeats a model', () => {
    const chain = freeModelChain('alibaba', 'qwen3.7-plus')
    expect(new Set(chain).size).toBe(chain.length)
  })

  it('leads with an unlisted or paid model, then offers free fallbacks', () => {
    const chain = freeModelChain('alibaba', 'qwen-turbo-not-in-catalog')
    expect(chain[0]).toBe('qwen-turbo-not-in-catalog')
    expect(chain).toContain('qwen-flash')
  })

  it('ends at the last free model so the chain is finite', () => {
    const free = modelsForProvider('alibaba').filter((m) => m.free)
    expect(freeModelChain('alibaba', 'qwen-flash')).toHaveLength(free.length)
  })
})

describe('createModelFallback', () => {
  it('returns the first result without switching', async () => {
    const fb = createModelFallback({ providerId: 'alibaba', model: 'qwen-flash' })
    await expect(fb.run(async (m) => m)).resolves.toBe('qwen-flash')
    expect(fb.switched).toBe(false)
    expect(fb.exhausted).toEqual([])
  })

  it('advances past a spent grant and reports the model that answered', async () => {
    const fb = createModelFallback({ providerId: 'alibaba', model: 'qwen-flash' })
    const seen: string[] = []
    const result = await fb.run(async (model) => {
      seen.push(model)
      if (model === 'qwen-flash') throw spent(model)
      return model
    })
    expect(result).toBe('qwen3.5-flash')
    expect(seen).toEqual(['qwen-flash', 'qwen3.5-flash'])
    expect(fb.model).toBe('qwen3.5-flash')
    expect(fb.switched).toBe(true)
    expect(fb.exhausted).toEqual(['qwen-flash'])
  })

  it('walks several spent grants in one call', async () => {
    const fb = createModelFallback({ providerId: 'alibaba', model: 'qwen-flash' })
    const result = await fb.run(async (model) => {
      if (model !== 'qwen3.7-flash') throw spent(model)
      return model
    })
    expect(result).toBe('qwen3.7-flash')
    expect(fb.exhausted).toEqual(['qwen-flash', 'qwen3.5-flash', 'qwen3.6-flash'])
  })

  it('is sticky: a later run does not retry an exhausted model', async () => {
    const fb = createModelFallback({ providerId: 'alibaba', model: 'qwen-flash' })
    await fb.run(async (model) => {
      if (model === 'qwen-flash') throw spent(model)
      return model
    })
    const seen: string[] = []
    await fb.run(async (model) => {
      seen.push(model)
      return model
    })
    expect(seen).toEqual(['qwen3.5-flash'])
  })

  it('propagates non-quota errors untouched', async () => {
    const fb = createModelFallback({ providerId: 'alibaba', model: 'qwen-flash' })
    let calls = 0
    await expect(
      fb.run(async () => {
        calls += 1
        throw new Error('Rate limit reached (429)')
      })
    ).rejects.toThrow('Rate limit reached (429)')
    expect(calls).toBe(1)
    expect(fb.switched).toBe(false)
  })

  it('rethrows once the whole chain is spent', async () => {
    const fb = createModelFallback({ providerId: 'alibaba', model: 'qwen-flash' })
    const chainLength = freeModelChain('alibaba', 'qwen-flash').length
    let calls = 0
    await expect(
      fb.run(async (model) => {
        calls += 1
        throw spent(model)
      })
    ).rejects.toBeInstanceOf(QuotaExhaustedError)
    expect(calls).toBe(chainLength)
  })

  it('reports each switch so callers can log and persist it', async () => {
    const onSwitch = vi.fn()
    const fb = createModelFallback({
      providerId: 'alibaba',
      model: 'qwen-flash',
      onSwitch
    })
    await fb.run(async (model) => {
      if (model === 'qwen-flash' || model === 'qwen3.5-flash') throw spent(model)
      return model
    })
    expect(onSwitch.mock.calls).toEqual([
      ['qwen-flash', 'qwen3.5-flash'],
      ['qwen3.5-flash', 'qwen3.6-flash']
    ])
  })

  it('does not fall back for a provider with a single free model', async () => {
    const fb = createModelFallback({ providerId: 'openai', model: 'gpt-4o-mini' })
    await expect(
      fb.run(async (model) => {
        throw spent(model)
      })
    ).rejects.toBeInstanceOf(QuotaExhaustedError)
    expect(fb.switched).toBe(false)
  })
})

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body)
  } as unknown as Response
}

describe('completeChat quota mapping', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const call = () =>
    completeChat({
      apiKey: 'sk-test',
      model: 'qwen-flash',
      messages: [{ role: 'user', content: 'hi' }],
      baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
    })

  it('maps 403 AllocationQuota.FreeTierOnly to QuotaExhaustedError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(403, {
          error: { code: 'AllocationQuota.FreeTierOnly', message: 'Free quota used up' }
        })
      )
    )
    const err = await call().catch((e) => e)
    expect(err).toBeInstanceOf(QuotaExhaustedError)
    expect(err.model).toBe('qwen-flash')
    expect(err.message).toContain('qwen-flash')
  })

  it('does not retry a spent grant', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(403, { error: { code: 'AllocationQuota.FreeTierOnly', message: 'spent' } })
    )
    vi.stubGlobal('fetch', fetchMock)
    await call().catch(() => undefined)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('leaves an unrelated 403 as a plain error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(403, { error: { code: 'Forbidden', message: 'no access to model' } })
      )
    )
    const err = await call().catch((e) => e)
    expect(err).toBeInstanceOf(Error)
    expect(err).not.toBeInstanceOf(QuotaExhaustedError)
  })
})
