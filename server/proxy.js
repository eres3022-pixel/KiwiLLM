import crypto from 'node:crypto'
import {
  workerBaseUrl, workerApiKey, getRotatedWorkerApiKey, kiwiApiPrefix, freeRpmLimit, freeRpdLimit
} from './config.js'
import {
  fallbackModels, modelCache, pgPool, memoryDb, readDb, writeDb, checkPgFreeRateLimit, recordPgUsage, findPgKey
} from './db.js'

export function publicKey(key) {
  return `${key.slice(0, 17)}••••`
}

export function formatTokens(tokens) {
  return tokens >= 1000000 ? `${(tokens / 1000000).toFixed(1)}M` : tokens.toLocaleString()
}

export function keyValue() {
  return `${kiwiApiPrefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 28)}`
}

export async function findKiwiKey(value = '') {
  if (!value.startsWith(`${kiwiApiPrefix}_`) && !value.startsWith('kiwi_sk_')) {
    return null
  }

  if (process.env.KIWI_MASTER_KEY && value === process.env.KIWI_MASTER_KEY) {
    return { id: 'master', name: 'Master key', key: value, plan: 'paid', models: [], lastUsed: 'Now' }
  }

  if (pgPool) {
    try {
      const pgKey = await findPgKey(value)
      if (pgKey) return pgKey
    } catch (error) {
      console.error('PostgreSQL findPgKey failed, falling back to local DB:', error.message)
    }
  }

  const db = await readDb()
  return db.keys.find((item) => item.key === value) || null
}

export async function isKiwiKey(value = '') {
  return Boolean(await findKiwiKey(value))
}

export function getBearer(req) {
  const header = req.get('authorization') || ''
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function sqlDateKey(value) {
  return typeof value === 'string' ? value.slice(0, 10) : todayKey(new Date(value))
}

export function lastDayKeys(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - (count - index - 1))
    return todayKey(date)
  })
}

export function toBarValues(values) {
  const max = Math.max(...values, 1)
  return values.map((value) => Math.round((value / max) * 100))
}

export function syncDashboardUsage(db) {
  const days = lastDayKeys(12)
  const daily = db.usage.daily || {}
  const tokenValues = days.map((day) => Number(daily[day]?.tokens || 0))
  const requestValues = days.map((day) => Number(daily[day]?.requests || 0))

  db.usage.tokenBars = toBarValues(tokenValues)
  db.usage.requestBars = toBarValues(requestValues)
}

export function refreshWorkspaceTotals(db) {
  const days = lastDayKeys(30)
  const daily = db.usage.daily || {}
  db.workspace.requests30d = days.reduce((total, day) => total + Number(daily[day]?.requests || 0), 0)
  db.workspace.tokens30d = days.reduce((total, day) => total + Number(daily[day]?.tokens || 0), 0)
  db.workspace.usedCredits30d = Number(days.reduce((total, day) => total + Number(daily[day]?.credits || 0), 0).toFixed(2))
  db.workspace.usedUsd30d = Number((db.workspace.usedCredits30d / 50).toFixed(2))
  syncDashboardUsage(db)
}

export function estimateTokensFromRequest(body = {}) {
  const messages = Array.isArray(body.messages) ? body.messages : []
  const messageText = messages
    .map((message) => (typeof message.content === 'string' ? message.content : JSON.stringify(message.content || '')))
    .join(' ')
  const prompt = typeof body.prompt === 'string' ? body.prompt : ''
  return Math.max(1, Math.ceil((messageText.length + prompt.length) / 4))
}

export function usageFromPayload(payload, requestBody = {}) {
  const usage = payload?.usage || {}
  const promptTokens = Number(usage.prompt_tokens || usage.input_tokens || 0)
  const completionTokens = Number(usage.completion_tokens || usage.output_tokens || 0)
  const totalTokens = Number(usage.total_tokens || promptTokens + completionTokens || estimateTokensFromRequest(requestBody))
  return {
    inputTokens: promptTokens,
    outputTokens: completionTokens,
    totalTokens,
  }
}

export function creditCost(tokens) {
  return Number((tokens / 1000).toFixed(2))
}

export function modelSpendUsd(model, tokens, requests = 1) {
  const route = fallbackModels.find((item) => item.id === model)
  if (route && route.perRequest) {
    return Number((requests * route.perRequest).toFixed(4))
  }
  const perMillion = route ? (route.input + route.output) / 2 : 1
  return Number(((tokens / 1000000) * perMillion).toFixed(4))
}

export function inferModelType(id = '') {
  const value = id.toLowerCase()
  if (value.includes('sora') || value.includes('video')) return 'Video'
  if (
    value.includes('image') ||
    value.includes('img') ||
    value.includes('flux') ||
    value.includes('sdxl') ||
    value.includes('photorealistic') ||
    value.includes('anime')
  ) {
    return 'Image'
  }
  if (value.includes('coder') || value.includes('code') || value.includes('codestral')) return 'Code'
  if (value.includes('reason') || value.includes('thinking') || value.includes('qwq') || value.includes('r1')) return 'Reasoning'
  return 'Text'
}

export function normalizeProvider(value = '') {
  const raw = String(value || 'upstream').toLowerCase()
  const providerNames = {
    aihubmix: 'AIHubMix',
    aimirror: 'AI Mirror',
    aiimages: 'AI Images',
    aitubo: 'Aitubo',
    anthropic: 'Anthropic',
    cfimg: 'Cloudflare Images',
    chatai: 'ChatAI',
    chatbotai: 'Chatbot AI',
    chatbotai2: 'Chatbot AI',
    chatdeep: 'DeepSeek',
    deepseek: 'DeepSeek',
    freecf: 'Cloudflare',
    geminiopenai: 'Gemini',
    genmyart: 'GenMyArt',
    glmchat: 'Zhipu',
    gptfree: 'OpenAI',
    gptossdirect: 'OpenAI',
    gptossworker: 'OpenAI',
    imageworldking: 'ImageWorldKing',
    kimik2v2: 'Moonshot',
    magicstudio: 'MagicStudio',
    nvidiaworker: 'NVIDIA',
    openrouterhub: 'OpenRouter',
    pimage: 'Pollinations',
    pollinations: 'Pollinations',
    raphaelai: 'Raphael AI',
    runware: 'Runware',
    svelteai: 'Svelte AI',
    swiftsora: 'Sora',
  }

  return providerNames[raw] || raw
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function normalizeWorkerModel(model) {
  const id = String(model?.id || '').trim()
  if (!id) return null
  const blocklist = [
    'glm-5.1', 
    'sensenova-u1-fast',
    'step-image-edit-2',
    'stepaudio-2.5-realtime',
    'stepaudio-2.5-tts',
    'stepaudio-2.5-asr'
  ]
  if (blocklist.includes(id)) return null
  const fallback = fallbackModels.find((item) => item.id === id)
  return {
    id,
    provider: fallback?.provider || normalizeProvider(model.owned_by || id.split('/')[0] || 'Upstream'),
    type: fallback?.type || inferModelType(id),
    context: fallback?.context || 'Provider default',
    input: fallback?.input ?? null,
    output: fallback?.output ?? null,
    perRequest: fallback?.perRequest ?? null,
    status: fallback?.status || 'Live',
  }
}

export async function getAvailableModels() {
  if (Date.now() < modelCache.expiresAt) return modelCache.models

  try {
    const activeKey = getRotatedWorkerApiKey() || workerApiKey
    const response = await fetch(`${workerBaseUrl}/v1/models`, {
      headers: activeKey ? { Authorization: `Bearer ${activeKey}` } : {},
    })
    if (!response.ok) throw new Error(`Worker returned ${response.status}`)
    const payload = await response.json()
    const workerModels = Array.isArray(payload.data)
      ? payload.data.map(normalizeWorkerModel).filter(Boolean)
      : []
    if (workerModels.length) {
      modelCache.expiresAt = Date.now() + 5 * 60 * 1000
      modelCache.models = workerModels.sort((a, b) => a.id.localeCompare(b.id))
    }
  } catch (error) {
    console.warn(`Could not load worker models: ${error instanceof Error ? error.message : 'unknown error'}`)
    modelCache.expiresAt = Date.now() + 60 * 1000
    modelCache.models = modelCache.models.length ? modelCache.models : fallbackModels
  }

  return modelCache.models
}

export function recordMeteredUsage(db, { keyValue, model, tokens, requests = 1 }) {
  const day = todayKey()
  db.usage.daily ||= {}
  db.usage.daily[day] ||= { requests: 0, tokens: 0, credits: 0 }

  const credits = creditCost(tokens)
  db.usage.daily[day].requests += requests
  db.usage.daily[day].tokens += tokens
  db.usage.daily[day].credits = Number((db.usage.daily[day].credits + credits).toFixed(2))

  const spend = modelSpendUsd(model, tokens)
  const spendByModel = db.usage.spendByModel || []
  const row = spendByModel.find((item) => item.model === model)
  if (row) {
    row.requests += requests
    row.spend = Number((row.spend + spend).toFixed(4))
  } else if (model) {
    spendByModel.push({ model, requests, spend, width: 0 })
  }

  const maxSpend = Math.max(...spendByModel.map((item) => item.spend), 0.0001)
  db.usage.spendByModel = spendByModel
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 8)
    .map((item) => ({ ...item, width: Math.max(4, Math.round((item.spend / maxSpend) * 100)) }))

  const key = db.keys.find((item) => item.key === keyValue)
  if (key) key.lastUsed = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

  refreshWorkspaceTotals(db)
}

export function checkFreeRateLimit(db, key) {
  const credits = Number(db.workspace?.credits || 0)
  if (credits <= 0) {
    return { status: 402, error: 'Insufficient credit balance. Please top up credits in your workspace dashboard.' }
  }

  const now = Date.now()
  db.rateLimits ||= {}
  const state = db.rateLimits[key.id] || { minute: [] }
  state.minute = state.minute.filter((timestamp) => now - timestamp < 60000)

  if (state.minute.length >= freeRpmLimit) {
    return { status: 429, error: `Rate limit reached: ${freeRpmLimit} requests per minute on Free plan.`, retryAfter: 60 }
  }

  state.minute.push(now)
  db.rateLimits[key.id] = state
  return null
}

export async function proxyWorker(req, res, workerPath) {
  const userKey = getBearer(req) || req.get('x-api-key') || ''
  const key = await findKiwiKey(userKey)

  if (!key) {
    return res.status(401).json({ error: `Missing or invalid ${kiwiApiPrefix} API key.` })
  }

  if (pgPool) {
    const rateLimit = await checkPgFreeRateLimit(key)
    if (rateLimit) {
      res.set('Retry-After', String(rateLimit.retryAfter))
      return res.status(rateLimit.status).json({ error: rateLimit.error })
    }
  } else {
    const db = await readDb()
    const rateLimit = checkFreeRateLimit(db, key)
    if (rateLimit) {
      res.set('Retry-After', String(rateLimit.retryAfter))
      await writeDb(db)
      return res.status(rateLimit.status).json({ error: rateLimit.error })
    }
    await writeDb(db)
  }

  const activeApiKey = getRotatedWorkerApiKey() || workerApiKey

  const headers = {
    'Content-Type': 'application/json',
  }

  if (activeApiKey) {
    headers.Authorization = `Bearer ${activeApiKey}`
  } else if (req.get('authorization')) {
    headers.Authorization = req.get('authorization')
  }

  try {
    const response = await fetch(`${workerBaseUrl}${workerPath}`, {
      method: req.method,
      headers,
      body: req.method === 'GET' ? undefined : JSON.stringify(req.body || {}),
    })

    const contentType = response.headers.get('content-type') || ''
    res.status(response.status)

    if (contentType.includes('text/event-stream') || req.body?.stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')

      const model = req.body?.model || workerPath.replace('/v1/', '')
      let usage = null
      let outputTokens = 0

      if (response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        async function pump() {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              res.end()
              break
            }
            const chunk = decoder.decode(value, { stream: true })
            res.write(value)

            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  if (data.usage) usage = data.usage
                  else if (data.choices?.[0]?.delta?.content) {
                    outputTokens++
                  }
                } catch (e) {}
              }
            }
          }

          const inputTokens = usage?.prompt_tokens || estimateTokensFromRequest(req.body || {})
          const outTokens = usage?.completion_tokens || outputTokens
          const totalTokens = usage?.total_tokens || (inputTokens + outTokens)

          if (pgPool) {
            recordPgUsage({
              key,
              model,
              endpoint: workerPath,
              usage: { inputTokens, outputTokens: outTokens, totalTokens },
              statusCode: response.status,
            }).catch(() => {})
          } else {
            readDb().then((latestDb) => {
              recordMeteredUsage(latestDb, { keyValue: userKey, model, tokens: totalTokens })
              return writeDb(latestDb)
            }).catch(() => {})
          }
        }
        pump().catch(() => res.end())
      } else {
        res.end()
      }
      return
    }

    if (contentType.includes('application/json')) {
      const payload = await response.json()
      if (response.ok) {
        const usage = usageFromPayload(payload, req.body || {})
        const model = payload.model || req.body?.model || workerPath.replace('/v1/', '')
        if (pgPool) {
          try {
            await recordPgUsage({
              key,
              model,
              endpoint: workerPath,
              usage: workerPath === '/v1/models' ? { inputTokens: 0, outputTokens: 0, totalTokens: 0 } : usage,
              statusCode: response.status,
            })
          } catch (e) {
            console.error('Failed to record PG usage:', e.message)
          }
        } else {
          const latestDb = await readDb()
          recordMeteredUsage(latestDb, {
            keyValue: userKey,
            model,
            tokens: workerPath === '/v1/models' ? 0 : usage.totalTokens,
          })
          await writeDb(latestDb)
        }
      }
      return res.json(payload)
    }

    const text = await response.text()
    if (response.ok) {
      const model = req.body?.model || workerPath.replace('/v1/', '')
      const tokens = workerPath === '/v1/models' ? 0 : estimateTokensFromRequest(req.body || {})
      if (pgPool) {
        await recordPgUsage({
          key,
          model,
          endpoint: workerPath,
          usage: { inputTokens: tokens, outputTokens: 0, totalTokens: tokens },
          statusCode: response.status,
        })
      } else {
        const latestDb = await readDb()
        recordMeteredUsage(latestDb, { keyValue: userKey, model, tokens })
        await writeDb(latestDb)
      }
    }
    return res.send(text)
  } catch (error) {
    return res.status(502).json({
      error: 'Worker request failed.',
      detail: error instanceof Error ? error.message : 'Unknown upstream error',
    })
  }
}
