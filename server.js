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

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const models = [
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

const seedDb = {
  workspace: {
    email: 'ronit@kiwillm.dev',
    credits: 2140,
    creditUsd: 42.8,
    usedUsd30d: 17.2,
    requests30d: 1284,
    tokens30d: 4800000,
  },
  keys: [
    {
      id: crypto.randomUUID(),
      name: 'Production agents',
      key: 'Kiwi_live_8c4f9d3a2b1c',
      scope: 'All text models',
      models: ['gpt-frontier', 'claude-sonnet-route', 'qwen-coder-fast'],
      lastUsed: '2 min ago',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Design playground',
      key: 'Kiwi_img_71aa00dd441f',
      scope: 'Image + video',
      models: ['image-frontier', 'video-frontier'],
      lastUsed: '1 hr ago',
      createdAt: new Date().toISOString(),
    },
  ],
  usage: {
    tokenBars: [38, 52, 44, 68, 56, 74, 63, 82, 70, 88, 76, 92],
    requestBars: [24, 30, 28, 44, 36, 52, 48, 64, 58, 71, 66, 80],
    spendByModel: [
      { model: 'claude-sonnet-route', requests: 482, spend: 7.84, width: 86 },
      { model: 'gpt-frontier', requests: 391, spend: 5.92, width: 68 },
      { model: 'qwen-coder-fast', requests: 268, spend: 2.31, width: 42 },
      { model: 'image-frontier', requests: 24, spend: 1.13, width: 28 },
    ],
  },
  redemptions: {
    'KIWI-DEMO-2026': 500,
    'KIWI-TEAM-LAUNCH': 1200,
  },
  runs: [],
}

let memoryDb = structuredClone(seedDb)
let warnedAboutDb = false

async function readDb() {
  try {
    if (!existsSync(dbPath)) {
      await mkdir(dirname(dbPath), { recursive: true })
      await writeFile(dbPath, JSON.stringify(seedDb, null, 2))
    }

    memoryDb = JSON.parse(await readFile(dbPath, 'utf8'))
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

function keyValue() {
  return `${kiwiApiPrefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 28)}`
}

async function isKiwiKey(value = '') {
  if (!value.startsWith(`${kiwiApiPrefix}_`) && !value.startsWith('kiwi_sk_')) {
    return false
  }

  if (process.env.KIWI_MASTER_KEY && value === process.env.KIWI_MASTER_KEY) {
    return true
  }

  const db = await readDb()
  return db.keys.some((item) => item.key === value)
}

function getBearer(req) {
  const header = req.get('authorization') || ''
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
}

async function proxyWorker(req, res, workerPath) {
  const userKey = getBearer(req) || req.get('x-api-key') || ''

  if (!(await isKiwiKey(userKey))) {
    return res.status(401).json({ error: `Missing or invalid ${kiwiApiPrefix} API key.` })
  }

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
      return res.json(await response.json())
    }

    return res.send(await response.text())
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

app.get('/api/models', (_req, res) => {
  res.json({ models })
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
  res.json({
    workspace: db.workspace,
    stats: [
      { label: 'Credit balance', value: `$${db.workspace.creditUsd.toFixed(2)}`, note: `${db.workspace.credits.toLocaleString()} credits ready`, trend: '+18%' },
      { label: 'Requests', value: db.workspace.requests30d.toLocaleString(), note: 'Last 30 days', trend: '+31%' },
      { label: 'Tokens', value: `${(db.workspace.tokens30d / 1000000).toFixed(1)}M`, note: 'Input + output', trend: '+12%' },
      { label: 'Credits used', value: `$${db.workspace.usedUsd30d.toFixed(2)}`, note: 'Last 30 days', trend: '-6%' },
    ],
    usage: db.usage,
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
  const tokens = Math.max(120, Math.round((prompt.length + system.length) * 1.7))
  const spend = Number((tokens / 1000000 * 6).toFixed(4))
  let responseText =
    'Kiwi routed this simulated request successfully. In production, this endpoint is where you would call your upstream model provider and stream the response back to the client.'

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
        stream: false,
      }),
    })

    if (workerResponse.ok) {
      const payload = await workerResponse.json()
      responseText =
        payload.choices?.[0]?.message?.content ||
        payload.choices?.[0]?.text ||
        payload.response ||
        responseText
    }
  } catch {
    // Keep the local playground useful even when the upstream worker is unavailable.
  }

  const run = {
    id: crypto.randomUUID(),
    title: prompt.slice(0, 42) || 'Playground run',
    model,
    tokens,
    spend,
    createdAt: new Date().toISOString(),
    response: responseText,
  }

  db.runs.unshift(run)
  db.runs = db.runs.slice(0, 20)
  db.workspace.requests30d += 1
  db.workspace.tokens30d += tokens
  db.workspace.usedUsd30d = Number((db.workspace.usedUsd30d + spend).toFixed(2))
  await writeDb(db)
  res.json(run)
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
