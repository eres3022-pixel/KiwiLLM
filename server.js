import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const port = process.env.PORT || 3000
const databaseUrl = process.env.DATABASE_URL || ''
const isSupabasePostgres = databaseUrl.includes('supabase.co') || databaseUrl.includes('pooler.supabase.com')
const dbPath = process.env.DB_PATH || join(__dirname, 'data', 'db.json')
const workerBaseUrl = (process.env.UNIFIED_AI_WORKER_URL || 'https://unified-ai-worker.rutv.workers.dev').replace(/\/$/, '')
const workerApiKey = process.env.UNIFIED_AI_WORKER_API_KEY || ''
const kiwiApiPrefix = process.env.KIWI_API_KEY_PREFIX || 'Kiwi'
const workspaceEmail = process.env.KIWI_WORKSPACE_EMAIL || 'workspace@kiwillm.dev'
const freeRpmLimit = Number(process.env.KIWI_FREE_RPM || 5)
const freeRpdLimit = Number(process.env.KIWI_FREE_RPD || 200)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://kiwillm.in,https://www.kiwillm.in,http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.disable('x-powered-by')
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (req.secure || req.get('x-forwarded-proto') === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new Error('CORS origin not allowed'))
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'x-api-key', 'anthropic-version'],
    maxAge: 86400,
  }),
)
app.use(express.json({ limit: '1mb' }))

const pgPool = databaseUrl
  ? new pg.Pool({
      connectionString: databaseUrl,
      ssl: isSupabasePostgres ? { rejectUnauthorized: false } : undefined,
    })
  : null

const fallbackModels = [
  { id: 'llama-3.2-1b', provider: 'Cloudflare', type: 'Text', context: 'Provider default', input: null, output: null, status: 'Live' },
  { id: 'llama-3.2-3b', provider: 'Cloudflare', type: 'Text', context: 'Provider default', input: null, output: null, status: 'Live' },
  { id: 'qwen-2.5-coder', provider: 'Cloudflare', type: 'Code', context: 'Provider default', input: null, output: null, status: 'Live' },
  { id: 'qwq-32b', provider: 'Cloudflare', type: 'Reasoning', context: 'Provider default', input: null, output: null, status: 'Live' },
  { id: 'gemini-2.5-flash-lite', provider: 'Gemini', type: 'Text', context: 'Provider default', input: null, output: null, status: 'Live' },
  { id: 'deepseek-chat', provider: 'DeepSeek', type: 'Text', context: 'Provider default', input: null, output: null, status: 'Live' },
  { id: 'flux', provider: 'Pollinations', type: 'Image', context: 'Prompt', input: null, output: null, status: 'Live' },
  { id: 'sora', provider: 'Sora', type: 'Video', context: 'Prompt', input: null, output: null, status: 'Live' },
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
let postgresReady = false
let auditReady = false
const legacyDemoKeyNames = new Set(['Production agents', 'Design playground'])
const legacyDemoRedemptions = new Set(['KIWI-DEMO-2026', 'KIWI-TEAM-LAUNCH'])

function keyHash(value) {
  return createHash('sha256').update(value).digest('hex')
}

function authName(user = {}) {
  const metadata = user.user_metadata || {}
  return metadata.full_name || metadata.name || metadata.user_name || user.email?.split('@')[0] || 'Kiwi User'
}

async function verifySupabaseUser(token = '') {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw Object.assign(new Error('Supabase auth is not configured on the API.'), { status: 503 })
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw Object.assign(new Error('Authentication required.'), { status: 401 })
  }

  return response.json()
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearer(req)
    if (!token) return res.status(401).json({ error: 'Authentication required.' })
    req.authUser = await verifySupabaseUser(token)
    return next()
  } catch (error) {
    const status = Number(error.status || 401)
    return res.status(status).json({ error: error instanceof Error ? error.message : 'Authentication required.' })
  }
}

function pgWorkspaceToPayload(workspace, totals = {}) {
  const credits = Number(workspace.credit_balance || 0)
  const creditUsd = Number(workspace.credit_usd_balance || 0)
  const usedCredits30d = Number(totals.credits_used || 0)
  return {
    email: workspace.email || workspaceEmail,
    credits,
    creditUsd,
    usedCredits30d,
    usedUsd30d: Number((usedCredits30d / 50).toFixed(2)),
    requests30d: Number(totals.requests || 0),
    tokens30d: Number(totals.total_tokens || 0),
  }
}

async function getDefaultWorkspace(client = pgPool, authUser = null) {
  if (!client) return null

  if (authUser?.email) {
    const userResult = await client.query(
      `
        insert into app_users (email, name, role)
        values ($1, $2, 'user')
        on conflict (email) do update set name = excluded.name
        returning *
      `,
      [authUser.email, authName(authUser)],
    )
    const appUser = userResult.rows[0]
    let workspaceResult = await client.query('select * from workspaces where owner_user_id = $1 order by created_at asc limit 1', [appUser.id])
    if (workspaceResult.rowCount) return workspaceResult.rows[0]

    workspaceResult = await client.query(
      `
        insert into workspaces (name, email, owner_user_id, plan, free_rpm_limit, free_rpd_limit)
        values ($1, $2, $3, 'free', $4, $5)
        returning *
      `,
      [`${authName(authUser)} Workspace`, authUser.email, appUser.id, freeRpmLimit, freeRpdLimit],
    )
    return workspaceResult.rows[0]
  }

  let result = await client.query('select * from workspaces order by created_at asc limit 1')
  if (result.rowCount) return result.rows[0]

  const userResult = await client.query(
    `
      insert into app_users (email, name, role)
      values ($1, $2, 'admin')
      on conflict (email) do update set email = excluded.email
      returning *
    `,
    [workspaceEmail, 'Kiwi Admin'],
  )
  result = await client.query(
    `
      insert into workspaces (name, email, owner_user_id, plan, free_rpm_limit, free_rpd_limit)
      values ('Kiwi Workspace', $1, $2, 'free', $3, $4)
      returning *
    `,
    [workspaceEmail, userResult.rows[0].id, freeRpmLimit, freeRpdLimit],
  )
  return result.rows[0]
}

function pgKeyToPayload(row, fullKey = null) {
  return {
    id: row.id,
    name: row.name,
    key: fullKey || row.key_preview,
    scope: row.scope,
    models: row.allowed_models || [],
    plan: row.plan || 'free',
    lastUsed: row.last_used_at ? new Date(row.last_used_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never',
    createdAt: row.created_at,
  }
}

async function findPgKey(value = '') {
  if (!pgPool || (!value.startsWith(`${kiwiApiPrefix}_`) && !value.startsWith('kiwi_sk_'))) return null
  if (process.env.KIWI_MASTER_KEY && value === process.env.KIWI_MASTER_KEY) {
    const workspace = await getDefaultWorkspace()
    return { id: 'master', workspace_id: workspace.id, name: 'Master key', key: value, plan: 'admin', allowed_models: [] }
  }

  const result = await pgPool.query(
    `
      select api_keys.*, workspaces.free_rpm_limit, workspaces.free_rpd_limit
      from api_keys
      join workspaces on workspaces.id = api_keys.workspace_id
      where api_keys.key_hash = $1 and api_keys.revoked_at is null
      limit 1
    `,
    [keyHash(value)],
  )
  return result.rows[0] || null
}

async function createPgKey({ name, selectedModels, authUser }) {
  const workspace = await getDefaultWorkspace(pgPool, authUser)
  const key = keyValue()
  const scope = selectedModels.length > 3 ? `${selectedModels.length} models` : selectedModels.length ? selectedModels.join(', ') : 'All live models'
  const result = await pgPool.query(
    `
      insert into api_keys (workspace_id, name, key_prefix, key_hash, key_preview, plan, scope, allowed_models)
      values ($1, $2, $3, $4, $5, 'free', $6, $7)
      returning *
    `,
    [workspace.id, name, kiwiApiPrefix, keyHash(key), publicKey(key), scope, selectedModels],
  )
  return pgKeyToPayload(result.rows[0], key)
}

async function checkPgFreeRateLimit(key) {
  if (!pgPool || (key.plan || 'free') !== 'free') return null

  const rpm = Number(key.free_rpm_limit || freeRpmLimit)
  const rpd = Number(key.free_rpd_limit || freeRpdLimit)
  const result = await pgPool.query(
    `
      select
        count(*) filter (where created_at >= now() - interval '60 seconds') as minute_count,
        count(*) filter (where created_at >= date_trunc('day', now())) as day_count
      from rate_limit_events
      where api_key_id = $1
    `,
    [key.id],
  )
  const minuteCount = Number(result.rows[0]?.minute_count || 0)
  const dayCount = Number(result.rows[0]?.day_count || 0)

  if (minuteCount >= rpm) return { status: 429, error: `Free plan limit reached: ${rpm} requests per minute.`, retryAfter: 60 }
  if (dayCount >= rpd) return { status: 429, error: `Free plan limit reached: ${rpd} requests per day.`, retryAfter: 86400 }

  await pgPool.query(
    'insert into rate_limit_events (api_key_id, workspace_id) values ($1, $2)',
    [key.id, key.workspace_id],
  )
  return null
}

async function recordPgUsage({ key, model, endpoint, usage, statusCode = 200 }) {
  if (!pgPool) return

  const totalTokens = Number(usage.totalTokens || 0)
  const inputTokens = Number(usage.inputTokens || 0)
  const outputTokens = Number(usage.outputTokens || 0)
  const credits = creditCost(totalTokens)
  const usd = modelSpendUsd(model, totalTokens)
  const today = todayKey()

  await pgPool.query('begin')
  try {
    await pgPool.query(
      `
        insert into usage_events (
          workspace_id, api_key_id, model, endpoint, input_tokens, output_tokens,
          total_tokens, credits_used, usd_estimate, status_code
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [key.workspace_id, key.id === 'master' ? null : key.id, model, endpoint, inputTokens, outputTokens, totalTokens, credits, usd, statusCode],
    )
    await pgPool.query(
      `
        insert into daily_usage (workspace_id, usage_date, requests, input_tokens, output_tokens, total_tokens, credits_used, usd_estimate)
        values ($1, $2, 1, $3, $4, $5, $6, $7)
        on conflict (workspace_id, usage_date)
        do update set
          requests = daily_usage.requests + 1,
          input_tokens = daily_usage.input_tokens + excluded.input_tokens,
          output_tokens = daily_usage.output_tokens + excluded.output_tokens,
          total_tokens = daily_usage.total_tokens + excluded.total_tokens,
          credits_used = daily_usage.credits_used + excluded.credits_used,
          usd_estimate = daily_usage.usd_estimate + excluded.usd_estimate
      `,
      [key.workspace_id, today, inputTokens, outputTokens, totalTokens, credits, usd],
    )
    await pgPool.query(
      `
        insert into model_usage (workspace_id, model, usage_date, requests, total_tokens, credits_used, usd_estimate)
        values ($1, $2, $3, 1, $4, $5, $6)
        on conflict (workspace_id, model, usage_date)
        do update set
          requests = model_usage.requests + 1,
          total_tokens = model_usage.total_tokens + excluded.total_tokens,
          credits_used = model_usage.credits_used + excluded.credits_used,
          usd_estimate = model_usage.usd_estimate + excluded.usd_estimate
      `,
      [key.workspace_id, model, today, totalTokens, credits, usd],
    )
    if (key.id !== 'master') {
      await pgPool.query('update api_keys set last_used_at = now() where id = $1', [key.id])
    }
    await pgPool.query('commit')
  } catch (error) {
    await pgPool.query('rollback')
    throw error
  }
}

async function getPgDashboard(authUser = null) {
  const workspace = await getDefaultWorkspace(pgPool, authUser)
  const totalsResult = await pgPool.query(
    `
      select
        coalesce(sum(requests), 0) as requests,
        coalesce(sum(total_tokens), 0) as total_tokens,
        coalesce(sum(credits_used), 0) as credits_used,
        coalesce(sum(usd_estimate), 0) as usd_estimate
      from daily_usage
      where workspace_id = $1 and usage_date >= current_date - interval '29 days'
    `,
    [workspace.id],
  )
  const totals = totalsResult.rows[0] || {}
  const workspacePayload = pgWorkspaceToPayload(workspace, totals)
  const days = lastDayKeys(12)
  const dailyResult = await pgPool.query(
    'select usage_date, requests, total_tokens from daily_usage where workspace_id = $1 and usage_date >= current_date - interval \'11 days\'',
    [workspace.id],
  )
  const dailyMap = new Map(dailyResult.rows.map((row) => [sqlDateKey(row.usage_date), row]))
  const tokenValues = days.map((day) => Number(dailyMap.get(day)?.total_tokens || 0))
  const requestValues = days.map((day) => Number(dailyMap.get(day)?.requests || 0))
  const modelResult = await pgPool.query(
    `
      select model, sum(requests) as requests, sum(usd_estimate) as spend
      from model_usage
      where workspace_id = $1 and usage_date >= current_date - interval '29 days'
      group by model
      order by spend desc, requests desc
      limit 8
    `,
    [workspace.id],
  )
  const maxSpend = Math.max(...modelResult.rows.map((row) => Number(row.spend)), 0.0001)
  const keysResult = await pgPool.query(
    'select * from api_keys where workspace_id = $1 and revoked_at is null order by created_at desc',
    [workspace.id],
  )

  return {
    workspace: workspacePayload,
    usage: {
      tokenBars: toBarValues(tokenValues),
      requestBars: toBarValues(requestValues),
      spendByModel: modelResult.rows.map((row) => ({
        model: row.model,
        requests: Number(row.requests),
        spend: Number(row.spend),
        width: Math.max(4, Math.round((Number(row.spend) / maxSpend) * 100)),
      })),
    },
    keys: keysResult.rows.map((row) => pgKeyToPayload(row)),
    limits: {
      plan: workspace.plan === 'free' ? 'Free' : workspace.plan,
      rpm: Number(workspace.free_rpm_limit || freeRpmLimit),
      rpd: Number(workspace.free_rpd_limit || freeRpdLimit),
    },
  }
}

async function getPgRuns(authUser = null) {
  const workspace = await getDefaultWorkspace(pgPool, authUser)
  const result = await pgPool.query(
    'select title, model, total_tokens as tokens, created_at from playground_runs where workspace_id = $1 order by created_at desc limit 20',
    [workspace.id],
  )
  return result.rows
}

async function ensureAuditTable() {
  if (!pgPool || auditReady) return
  await pgPool.query(`
    create table if not exists audit_events (
      id text primary key,
      workspace_id uuid,
      actor_email text,
      action text not null,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `)
  auditReady = true
}

async function recordAuditEvent({ workspace, authUser, action, metadata = {} }) {
  if (!pgPool) return
  try {
    await ensureAuditTable()
    await pgPool.query(
      'insert into audit_events (id, workspace_id, actor_email, action, metadata) values ($1, $2, $3, $4, $5::jsonb)',
      [crypto.randomUUID(), workspace?.id || null, authUser?.email || null, action, JSON.stringify(metadata)],
    )
  } catch (error) {
    console.warn(`Could not write audit event: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

async function ensurePostgres() {
  if (!pgPool || postgresReady) return

  await pgPool.query(`
    create table if not exists kiwi_app_state (
      id text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `)
  postgresReady = true
}

async function readPostgresDb() {
  if (!pgPool) return null

  await ensurePostgres()
  const result = await pgPool.query('select data from kiwi_app_state where id = $1', ['default'])
  if (!result.rowCount) {
    await pgPool.query(
      'insert into kiwi_app_state (id, data) values ($1, $2::jsonb) on conflict (id) do nothing',
      ['default', JSON.stringify(seedDb)],
    )
    return structuredClone(seedDb)
  }

  return normalizeDb(result.rows[0].data)
}

async function writePostgresDb(db) {
  if (!pgPool) return false

  await ensurePostgres()
  await pgPool.query(
    `
      insert into kiwi_app_state (id, data, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (id)
      do update set data = excluded.data, updated_at = now()
    `,
    ['default', JSON.stringify(db)],
  )
  return true
}

async function readDb() {
  if (pgPool) {
    try {
      memoryDb = await readPostgresDb()
      return memoryDb
    } catch (error) {
      if (!warnedAboutDb) {
        console.warn(`Kiwi LLM could not read Supabase Postgres; falling back locally: ${
          error instanceof Error ? error.message : 'unknown error'
        }`)
        warnedAboutDb = true
      }
    }
  }

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
    db.usage.spendByModel.some((item) => item?.model === 'claude-sonnet P1' && item?.requests === 482)

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

  if (pgPool) {
    try {
      await writePostgresDb(db)
      return
    } catch (error) {
      if (!warnedAboutDb) {
        console.warn(`Kiwi LLM could not write Supabase Postgres; falling back locally: ${
          error instanceof Error ? error.message : 'unknown error'
        }`)
        warnedAboutDb = true
      }
    }
  }

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
  if (pgPool) return findPgKey(value)

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
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function sqlDateKey(value) {
  return typeof value === 'string' ? value.slice(0, 10) : todayKey(new Date(value))
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
        const usage = usageFromPayload(payload, req.body || {})
        const model = payload.model || req.body?.model || workerPath.replace('/v1/', '')
        if (pgPool) {
          await recordPgUsage({
            key,
            model,
            endpoint: workerPath,
            usage: workerPath === '/v1/models' ? { inputTokens: 0, outputTokens: 0, totalTokens: 0 } : usage,
            statusCode: response.status,
          })
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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'Kiwi LLM API', version: 'worker-proxy-db-fallback' })
})

app.get('/api/ready', async (_req, res) => {
  try {
    if (pgPool) {
      await pgPool.query('select 1')
      return res.json({ ok: true, database: 'postgres' })
    }

    await readDb()
    return res.json({ ok: true, database: 'local-json' })
  } catch (error) {
    return res.status(503).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Readiness check failed',
    })
  }
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

app.post('/v1/messages', (req, res) => {
  proxyWorker(req, res, '/v1/messages')
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

app.get('/api/dashboard', requireAuth, async (req, res) => {
  if (pgPool) {
    const data = await getPgDashboard(req.authUser)
    return res.json({
      ...data,
      stats: [
        { label: 'Credit balance', value: data.workspace.credits.toLocaleString(), note: `$${data.workspace.creditUsd.toFixed(2)} available`, trend: 'Live' },
        { label: 'Requests', value: data.workspace.requests30d.toLocaleString(), note: 'Last 30 days', trend: 'Live' },
        { label: 'Tokens', value: formatTokens(data.workspace.tokens30d), note: 'Input + output', trend: 'Live' },
        { label: 'Credits used', value: data.workspace.usedCredits30d.toLocaleString(), note: 'Last 30 days', trend: 'Live' },
      ],
    })
  }

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

app.post('/api/redeem', requireAuth, async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase()
  if (pgPool) {
    const workspace = await getDefaultWorkspace(pgPool, req.authUser)
    const result = await pgPool.query(
      `
        select * from redemption_codes
        where code = $1
          and redeemed_count < max_redemptions
          and (expires_at is null or expires_at > now())
        limit 1
      `,
      [code],
    )
    const redemption = result.rows[0]
    if (!redemption) return res.status(404).json({ error: 'Invalid or already used Kiwi code.' })

    await pgPool.query('begin')
    try {
      await pgPool.query('update redemption_codes set redeemed_count = redeemed_count + 1 where id = $1', [redemption.id])
      await pgPool.query('insert into redemption_uses (redemption_code_id, workspace_id) values ($1, $2)', [redemption.id, workspace.id])
      await pgPool.query(
        'insert into credit_transactions (workspace_id, type, credits, description) values ($1, $2, $3, $4)',
        [workspace.id, 'redeem', Number(redemption.credits), `Redeemed ${code}`],
      )
      await pgPool.query(
        'update workspaces set credit_balance = credit_balance + $1, credit_usd_balance = credit_usd_balance + $2 where id = $3',
        [Number(redemption.credits), Number(redemption.credits) / 50, workspace.id],
      )
      await pgPool.query('commit')
      await recordAuditEvent({
        workspace,
        authUser: req.authUser,
        action: 'redeem_code',
        metadata: { code, credits: Number(redemption.credits) },
      })
      return res.json({ ok: true, creditsAdded: Number(redemption.credits) })
    } catch (error) {
      await pgPool.query('rollback')
      throw error
    }
  }

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

app.post('/api/keys', requireAuth, async (req, res) => {
  const name = String(req.body.name || 'Untitled key').trim().slice(0, 80)
  const selectedModels = Array.isArray(req.body.models) && req.body.models.length ? req.body.models : []

  if (pgPool) {
    const item = await createPgKey({ name, selectedModels, authUser: req.authUser })
    const workspace = await getDefaultWorkspace(pgPool, req.authUser)
    await recordAuditEvent({
      workspace,
      authUser: req.authUser,
      action: 'create_api_key',
      metadata: { name, selectedModels, keyPreview: publicKey(item.key) },
    })
    return res.status(201).json({ ...item, displayKey: publicKey(item.key) })
  }

  const db = await readDb()
  const key = keyValue()
  const item = {
    id: crypto.randomUUID(),
    name,
    key,
    scope: selectedModels.length > 3 ? `${selectedModels.length} models` : selectedModels.length ? selectedModels.join(', ') : 'All live models',
    models: selectedModels,
    plan: 'free',
    lastUsed: 'Never',
    createdAt: new Date().toISOString(),
  }

  db.keys.unshift(item)
  await writeDb(db)
  res.status(201).json({ ...item, key, displayKey: publicKey(key) })
})

app.post('/api/keys/:id/revoke', requireAuth, async (req, res) => {
  const keyId = String(req.params.id || '')
  if (pgPool) {
    const workspace = await getDefaultWorkspace(pgPool, req.authUser)
    const result = await pgPool.query(
      `
        update api_keys
        set revoked_at = now()
        where id = $1 and workspace_id = $2 and revoked_at is null
        returning id, name, key_preview
      `,
      [keyId, workspace.id],
    )
    if (!result.rowCount) return res.status(404).json({ error: 'API key not found.' })
    await recordAuditEvent({
      workspace,
      authUser: req.authUser,
      action: 'revoke_api_key',
      metadata: { id: result.rows[0].id, name: result.rows[0].name, keyPreview: result.rows[0].key_preview },
    })
    return res.json({ ok: true })
  }

  const db = await readDb()
  const before = db.keys.length
  db.keys = db.keys.filter((item) => item.id !== keyId)
  if (db.keys.length === before) return res.status(404).json({ error: 'API key not found.' })
  await writeDb(db)
  res.json({ ok: true })
})

app.post('/api/playground/run', requireAuth, async (req, res) => {
  const model = String(req.body.model || 'llama-3.2-1b')
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

    if (pgPool) {
      const workspace = await getDefaultWorkspace(pgPool, req.authUser)
      await pgPool.query(
        `
          insert into playground_runs (workspace_id, model, title, prompt, system_prompt, response, total_tokens, usd_estimate)
          values ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [workspace.id, model, run.title, prompt, system, responseText, usage.totalTokens, spend],
      )
      await recordPgUsage({
        key: { id: 'master', workspace_id: workspace.id, plan: 'admin' },
        model,
        endpoint: '/api/playground/run',
        usage,
        statusCode: 200,
      })
      await recordAuditEvent({
        workspace,
        authUser: req.authUser,
        action: 'playground_run',
        metadata: { model, tokens: usage.totalTokens, title: run.title },
      })
    } else {
      const db = await readDb()
      db.runs.unshift(run)
      db.runs = db.runs.slice(0, 20)
      recordMeteredUsage(db, { keyValue: '', model, tokens: usage.totalTokens, requests: 1 })
      await writeDb(db)
    }
    res.json(run)
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : 'Playground request failed.',
    })
  }
})

app.get('/api/playground/runs', requireAuth, async (req, res) => {
  if (pgPool) {
    return res.json({ runs: await getPgRuns(req.authUser) })
  }

  const db = await readDb()
  res.json({ runs: db.runs })
})

app.use((error, _req, res, next) => {
  if (error?.message === 'CORS origin not allowed') {
    return res.status(403).json({ error: 'CORS origin not allowed.' })
  }
  return next(error)
})

const distPath = resolve(__dirname, 'dist')
app.use(express.static(distPath))
app.use((_req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})

app.listen(port, () => {
  console.log(`Kiwi LLM server running on port ${port}`)
})
