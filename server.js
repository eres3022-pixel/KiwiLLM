import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const port = process.env.PORT || 3000
const dbPath = process.env.DB_PATH || join(__dirname, 'data', 'db.json')
const workerBaseUrl = (process.env.UNIFIED_AI_WORKER_URL || 'https://unified-ai-worker.rutv.workers.dev').replace(/\/$/, '')
const workerApiKey = process.env.UNIFIED_AI_WORKER_API_KEY || ''
const kiwiApiPrefix = process.env.KIWI_API_KEY_PREFIX || 'Kiwi'
const workspaceEmail = process.env.KIWI_WORKSPACE_EMAIL || 'workspace@kiwillm.dev'
const freeRpmLimit = Number(process.env.KIWI_FREE_RPM || 5)
const freeRpdLimit = Number(process.env.KIWI_FREE_RPD || 200)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const fallbackModels = [
  { id: 'gpt-frontier', provider: 'OpenAI', type: 'Text', context: '1M', input: 3, output: 12, status: 'Live' },
  { id: 'claude-sonnet-route', provider: 'Anthropic', type: 'Text', context: '200K', input: 3, output: 15, status: 'Live' },
  { id: 'claude-opus-route', provider: 'Anthropic', type: 'Text', context: '200K', input: 15, output: 75, status: 'Paid' },
  { id: 'qwen-coder-fast', provider: 'Qwen', type: 'Code', context: '128K', input: 0.7, output: 2.8, status: 'Live' },
  { id: 'kimi-reasoner', provider: 'Moonshot', type: 'Reasoning', context: '256K', input: 1.2, output: 5, status: 'Live' },
  { id: 'glm-agentic', provider: 'Zhipu', type: 'Agent', context: '128K', input: 0.9, output: 3.6, status: 'Live' },
  { id: 'deepseek-v4-pro', provider: 'DeepSeek', type: 'Reasoning', context: '128K', input: 0.8, output: 3.2, status: 'Live' },
  { id: 'image-frontier', provider: 'Kiwi Media', type: 'Image', context: 'Prompt', input: 0.04, output: 0.08, status: 'Paid' },
  { id: 'video-frontier', provider: 'Kiwi Media', type: 'Video', context: 'Prompt', input: 0.2, output: 1.6, status: 'Paid' },
]
let modelCache = { expiresAt: 0, models: fallbackModels }

const seedDb = {
  workspace: {
    email: workspaceEmail,
    credits: 0,
    creditUsd: 0,
    usedCredits30d: 0,
    usedUsd30d: 0,
    requests30d: 0,
    tokens30d: 0,
  },
  keys: [],
  usage: {
    tokenBars: Array(12).fill(0),
    requestBars: Array(12).fill(0),
    spendByModel: [],
  },
  rateLimits: {},
  redemptions: {},
  runs: [],
}

let memoryDb = structuredClone(seedDb)
let warnedAboutDb = false
const legacyDemoKeyNames = new Set(['Production agents', 'Design playground'])
const legacyDemoRedemptions = new Set(['KIWI-DEMO-2026', 'KIWI-TEAM-LAUNCH'])

async function readDb() {
  try {
    if (!existsSync(dbPath)) {
      await mkdir(dirname(dbPath), { recursive: true })
      await writeFile(dbPath, JSON.stringify(seedDb, null, 2))
    }

    memoryDb = normalizeDb(JSON.parse(await readFile(dbPath, 'utf8')))
    return memoryDb
  } catch (error) {
    if (!warnedAboutDb) {
      console.warn(
        `Kiwi LLM is using in-memory data because ${dbPath} is not writable: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      )
      warnedAboutDb = true
    }

    return memoryDb
  }
}

function normalizeDb(db) {
  const keys = Array.isArray(db.keys)
    ? db.keys
        .filter((item) => item?.key && !legacyDemoKeyNames.has(item.name))
        .map((item) => ({ ...item, plan: item.plan || 'free' }))
    : []
  const redemptions = db.redemptions && typeof db.redemptions === 'object' ? { ...db.redemptions } : {}
  legacyDemoRedemptions.forEach((code) => delete redemptions[code])
  const runs = Array.isArray(db.runs)
    ? db.runs.filter((run) => !String(run?.response || '').toLowerCase().includes('simulated request successfully'))
    : []
  const hasLegacyUsage =
    db.workspace?.creditUsd === 42.8 &&
    db.workspace?.usedUsd30d >= 17.2 &&
    db.workspace?.tokens30d >= 4800000 &&
    Array.isArray(db.usage?.spendByModel) &&
    db.usage.spendByModel.some((item) => item?.model === 'claude-sonnet-route' && item?.requests === 482)

  return {
    workspace: {
      ...seedDb.workspace,
      ...(hasLegacyUsage ? {} : db.workspace || {}),
      email: db.workspace?.email || workspaceEmail,
    },
    keys,
    usage: {
      ...seedDb.usage,
      ...(hasLegacyUsage ? {} : db.usage || {}),
      tokenBars: !hasLegacyUsage && Array.isArray(db.usage?.tokenBars) ? db.usage.tokenBars : seedDb.usage.tokenBars,
      requestBars: !hasLegacyUsage && Array.isArray(db.usage?.requestBars) ? db.usage.requestBars : seedDb.usage.requestBars,
      spendByModel: !hasLegacyUsage && Array.isArray(db.usage?.spendByModel) ? db.usage.spendByModel : [],
      daily: !hasLegacyUsage && db.usage?.daily && typeof db.usage.daily === 'object' ? db.usage.daily : {},
    },
    rateLimits: db.rateLimits && typeof db.rateLimits === 'object' ? db.rateLimits : {},
    redemptions,
    runs,
  }
}

async function writeDb(db) {
  memoryDb = db

  try {
    await mkdir(dirname(dbPath), { recursive: true })
    await writeFile(dbPath, JSON.stringify(db, null, 2))
  } catch (error) {
    if (!warnedAboutDb) {
      console.warn(
        `Kiwi LLM could not persist ${dbPath}; continuing in memory: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      )
      warnedAboutDb = true
    }
  }
}

function publicKey(key) {
  return `${key.slice(0, 17)}••••`
}

function formatTokens(tokens) {
  return tokens >= 1000000 ? `${(tokens / 1000000).toFixed(1)}M` : tokens.toLocaleString()
}

function keyValue() {
  return `${kiwiApiPrefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 28)}`
}

async function findKiwiKey(value = '') {
  if (!value.startsWith(`${kiwiApiPrefix}_`) && !value.startsWith('kiwi_sk_')) {
    return null
  }

  if (process.env.KIWI_MASTER_KEY && value === process.env.KIWI_MASTER_KEY) {
    return { id: 'master', name: 'Master key', key: value, plan: 'paid', models: [], lastUsed: 'Now' }
  }

  const db = await readDb()
  return db.keys.find((item) => item.key === value) || null
}

async function isKiwiKey(value = '') {
  return Boolean(await findKiwiKey(value))
}

function getBearer(req) {
  const header = req.get('authorization') || ''
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function lastDayKeys(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - (count - index - 1))
    return todayKey(date)
  })
}

function toBarValues(values) {
  const max = Math.max(...values, 1)
  return values.map((value) => Math.round((value / max) * 100))
}

function syncDashboardUsage(db) {
  const days = lastDayKeys(12)
  const daily = db.usage.daily || {}
  const tokenValues = days.map((day) => Number(daily[day]?.tokens || 0))
  const requestValues = days.map((day) => Number(daily[day]?.requests || 0))

  db.usage.tokenBars = toBarValues(tokenValues)
  db.usage.requestBars = toBarValues(requestValues)
}

function refreshWorkspaceTotals(db) {
  const days = lastDayKeys(30)
  const daily = db.usage.daily || {}
  db.workspace.requests30d = days.reduce((total, day) => total + Number(daily[day]?.requests || 0), 0)
  db.workspace.tokens30d = days.reduce((total, day) => total + Number(daily[day]?.tokens || 0), 0)
  db.workspace.usedCredits30d = Number(days.reduce((total, day) => total + Number(daily[day]?.credits || 0), 0).toFixed(2))
  db.workspace.usedUsd30d = Number((db.workspace.usedCredits30d / 50).toFixed(2))
  syncDashboardUsage(db)
}

function estimateTokensFromRequest(body = {}) {
  const messages = Array.isArray(body.messages) ? body.messages : []
  const messageText = messages
    .map((message) => (typeof message.content === 'string' ? message.content : JSON.stringify(message.content || '')))
    .join(' ')
  const prompt = typeof body.prompt === 'string' ? body.prompt : ''
  return Math.max(1, Math.ceil((messageText.length + prompt.length) / 4))
}

function usageFromPayload(payload, requestBody = {}) {
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

function creditCost(tokens) {
  return Number((tokens / 1000).toFixed(2))
}

function modelSpendUsd(model, tokens) {
  const route = fallbackModels.find((item) => item.id === model)
  const perMillion = route ? (route.input + route.output) / 2 : 1
  return Number(((tokens / 1000000) * perMillion).toFixed(4))
}

function inferModelType(id = '') {
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

function normalizeProvider(value = '') {
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

function normalizeWorkerModel(model) {
  const id = String(model?.id || '').trim()
  if (!id) return null
  const fallback = fallbackModels.find((item) => item.id === id)
  return {
    id,
    provider: fallback?.provider || normalizeProvider(model.owned_by || id.split('/')[0] || 'Upstream'),
    type: fallback?.type || inferModelType(id),
    context: fallback?.context || 'Provider default',
    input: fallback?.input ?? null,
    output: fallback?.output ?? null,
    status: fallback?.status || 'Live',
  }
}

async function getAvailableModels() {
  if (Date.now() < modelCache.expiresAt) return modelCache.models

  try {
    const response = await fetch(`${workerBaseUrl}/v1/models`, {
      headers: workerApiKey ? { Authorization: `Bearer ${workerApiKey}` } : {},
    })
    if (!response.ok) throw new Error(`Worker returned ${response.status}`)
    const payload = await response.json()
    const workerModels = Array.isArray(payload.data)
      ? payload.data.map(normalizeWorkerModel).filter(Boolean)
      : []
    if (workerModels.length) {
      modelCache = {
        expiresAt: Date.now() + 5 * 60 * 1000,
        models: workerModels.sort((a, b) => a.id.localeCompare(b.id)),
      }
    }
  } catch (error) {
    console.warn(`Could not load worker models: ${error instanceof Error ? error.message : 'unknown error'}`)
    modelCache = { expiresAt: Date.now() + 60 * 1000, models: modelCache.models.length ? modelCache.models : fallbackModels }
  }

  return modelCache.models
}

function recordMeteredUsage(db, { keyValue, model, tokens, requests = 1 }) {
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

function checkFreeRateLimit(db, key) {
  if ((key.plan || 'free') !== 'free') return null

  const now = Date.now()
  const day = todayKey()
  db.rateLimits ||= {}
  const state = db.rateLimits[key.id] || { minute: [], day, count: 0 }
  state.minute = state.minute.filter((timestamp) => now - timestamp < 60000)

  if (state.day !== day) {
    state.day = day
    state.count = 0
  }

  if (state.minute.length >= freeRpmLimit) {
    return { status: 429, error: `Free plan limit reached: ${freeRpmLimit} requests per minute.`, retryAfter: 60 }
  }

  if (state.count >= freeRpdLimit) {
    return { status: 429, error: `Free plan limit reached: ${freeRpdLimit} requests per day.`, retryAfter: 86400 }
  }

  state.minute.push(now)
  state.count += 1
  db.rateLimits[key.id] = state
  return null
}

async function proxyWorker(req, res, workerPath) {
  const userKey = getBearer(req) || req.get('x-api-key') || ''
  const key = await findKiwiKey(userKey)

  if (!key) {
    return res.status(401).json({ error: `Missing or invalid ${kiwiApiPrefix} API key.` })
  }

  const db = await readDb()
  const rateLimit = checkFreeRateLimit(db, key)
  if (rateLimit) {
    res.set('Retry-After', String(rateLimit.retryAfter))
    await writeDb(db)
    return res.status(rateLimit.status).json({ error: rateLimit.error })
  }
  await writeDb(db)

  const headers = {
    'Content-Type': 'application/json',
  }

  if (workerApiKey) {
    headers.Authorization = `Bearer ${workerApiKey}`
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

    if (contentType.includes('application/json')) {
      const payload = await response.json()
      if (response.ok) {
        const latestDb = await readDb()
        const usage = usageFromPayload(payload, req.body || {})
        const model = payload.model || req.body?.model || workerPath.replace('/v1/', '')
        recordMeteredUsage(latestDb, {
          keyValue: userKey,
          model,
          tokens: workerPath === '/v1/models' ? 0 : usage.totalTokens,
        })
        await writeDb(latestDb)
      }
      return res.json(payload)
    }

    const text = await response.text()
    if (response.ok) {
      const latestDb = await readDb()
      recordMeteredUsage(latestDb, {
        keyValue: userKey,
        model: req.body?.model || workerPath.replace('/v1/', ''),
        tokens: workerPath === '/v1/models' ? 0 : estimateTokensFromRequest(req.body || {}),
      })
      await writeDb(latestDb)
    }
    return res.send(text)
  } catch (error) {
    return res.status(502).json({
      error: 'Worker request failed.',
      detail: error instanceof Error ? error.message : 'Unknown upstream error',
    })
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'Kiwi LLM API', version: 'worker-proxy-db-fallback' })
})

app.get('/api/models', async (_req, res) => {
  const availableModels = await getAvailableModels()
  res.json({
    models: availableModels,
    summary: {
      total: availableModels.length,
      text: availableModels.filter((model) => model.type === 'Text').length,
      code: availableModels.filter((model) => model.type === 'Code').length,
      reasoning: availableModels.filter((model) => model.type === 'Reasoning').length,
      image: availableModels.filter((model) => model.type === 'Image').length,
      video: availableModels.filter((model) => model.type === 'Video').length,
    },
  })
})

app.get('/api/config', (_req, res) => {
  res.json({
    publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
    workerBaseUrl,
    keyPrefix: kiwiApiPrefix,
  })
})

app.get('/v1/models', (req, res) => {
  proxyWorker(req, res, '/v1/models')
})

app.post('/v1/chat/completions', (req, res) => {
  proxyWorker(req, res, '/v1/chat/completions')
})

app.post('/v1/images/generations', (req, res) => {
  proxyWorker(req, res, '/v1/images/generations')
})

app.post('/v1/images/edits', (req, res) => {
  proxyWorker(req, res, '/v1/images/edits')
})

app.post('/v1/video/generations', (req, res) => {
  proxyWorker(req, res, '/v1/video/generations')
})

app.get('/api/dashboard', async (_req, res) => {
  const db = await readDb()
  refreshWorkspaceTotals(db)
  await writeDb(db)
  res.json({
    workspace: db.workspace,
    stats: [
      { label: 'Credit balance', value: db.workspace.credits.toLocaleString(), note: `$${db.workspace.creditUsd.toFixed(2)} available`, trend: 'Live' },
      { label: 'Requests', value: db.workspace.requests30d.toLocaleString(), note: 'Last 30 days', trend: 'Live' },
      { label: 'Tokens', value: formatTokens(db.workspace.tokens30d), note: 'Input + output', trend: 'Live' },
      { label: 'Credits used', value: db.workspace.usedCredits30d.toLocaleString(), note: 'Last 30 days', trend: 'Live' },
    ],
    usage: db.usage,
    limits: {
      plan: 'Free',
      rpm: freeRpmLimit,
      rpd: freeRpdLimit,
    },
    keys: db.keys.map((item) => ({ ...item, key: publicKey(item.key) })),
  })
})

app.post('/api/redeem', async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase()
  const db = await readDb()
  const credits = db.redemptions[code]

  if (!credits) {
    return res.status(404).json({ error: 'Invalid or already used Kiwi code.' })
  }

  delete db.redemptions[code]
  db.workspace.credits += credits
  db.workspace.creditUsd = Number((db.workspace.creditUsd + credits / 50).toFixed(2))
  await writeDb(db)
  res.json({ ok: true, creditsAdded: credits, workspace: db.workspace })
})

app.post('/api/keys', async (req, res) => {
  const db = await readDb()
  const name = String(req.body.name || 'Untitled key').trim().slice(0, 80)
  const selectedModels = Array.isArray(req.body.models) && req.body.models.length ? req.body.models : ['gpt-frontier']
  const key = keyValue()
  const item = {
    id: crypto.randomUUID(),
    name,
    key,
    scope: selectedModels.length > 3 ? `${selectedModels.length} models` : selectedModels.join(', '),
    models: selectedModels,
    plan: 'free',
    lastUsed: 'Never',
    createdAt: new Date().toISOString(),
  }

  db.keys.unshift(item)
  await writeDb(db)
  res.status(201).json({ ...item, key, displayKey: publicKey(key) })
})

app.post('/api/playground/run', async (req, res) => {
  const db = await readDb()
  const model = String(req.body.model || 'gpt-frontier')
  const prompt = String(req.body.prompt || '').slice(0, 2000)
  const system = String(req.body.system || '').slice(0, 2000)
  const temperature = Number.isFinite(Number(req.body.temperature)) ? Number(req.body.temperature) : 0.7
  const maxTokens = Number.isFinite(Number(req.body.maxTokens)) ? Number(req.body.maxTokens) : 2048

  try {
    const workerResponse = await fetch(`${workerBaseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(workerApiKey ? { Authorization: `Bearer ${workerApiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt || 'Say hello from Kiwi LLM.' },
        ],
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    })

    const payload = await workerResponse.json().catch(async () => ({ error: await workerResponse.text() }))
    if (!workerResponse.ok) {
      return res.status(workerResponse.status).json({
        error: payload.error || payload.message || 'Playground request failed upstream.',
      })
    }

    const responseText =
      payload.choices?.[0]?.message?.content ||
      payload.choices?.[0]?.text ||
      payload.response ||
      ''
    const usage = usageFromPayload(payload, { model, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] })
    const spend = modelSpendUsd(model, usage.totalTokens)
    const run = {
      id: crypto.randomUUID(),
      title: prompt.slice(0, 42) || 'Playground run',
      model,
      tokens: usage.totalTokens,
      spend,
      createdAt: new Date().toISOString(),
      response: responseText,
    }

    db.runs.unshift(run)
    db.runs = db.runs.slice(0, 20)
    recordMeteredUsage(db, { keyValue: '', model, tokens: usage.totalTokens, requests: 1 })
    await writeDb(db)
    res.json(run)
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : 'Playground request failed.',
    })
  }
})

app.get('/api/playground/runs', async (_req, res) => {
  const db = await readDb()
  res.json({ runs: db.runs })
})

const distPath = resolve(__dirname, 'dist')
app.use(express.static(distPath))
app.use((_req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})

app.listen(port, () => {
  console.log(`Kiwi LLM server running on port ${port}`)
})
