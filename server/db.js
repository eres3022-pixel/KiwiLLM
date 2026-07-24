import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { createHash } from 'node:crypto'
import crypto from 'node:crypto'
import pg from 'pg'
import {
  databaseUrl, isSupabasePostgres, dbPath, workspaceEmail, freeRpmLimit, freeRpdLimit, kiwiApiPrefix,
  supabaseUrl, supabasePublishableKey, adminEmails, adminSessions, adminSessionMs
} from './config.js'

let finalDatabaseUrl = databaseUrl
if (finalDatabaseUrl && finalDatabaseUrl.includes('pooler.supabase.com') && finalDatabaseUrl.includes(':5432')) {
  // Render doesn't support IPv6. Supabase port 5432 is IPv6-only. Use 6543 (transaction pooler) for IPv4 support.
  finalDatabaseUrl = finalDatabaseUrl.replace(':5432', ':6543')
}

export const pgPool = finalDatabaseUrl
  ? new pg.Pool({
      connectionString: finalDatabaseUrl,
      ssl: isSupabasePostgres ? { rejectUnauthorized: false } : undefined,
    })
  : null

if (pgPool) {
  pgPool.on('error', (err) => {
    console.warn('PostgreSQL Pool background error:', err.message)
  })
}

let coreTablesReady = false
export async function ensureCoreTables() {
  if (!pgPool || coreTablesReady) return
  try {
    await pgPool.query(`
      create table if not exists app_users (
        id uuid primary key default gen_random_uuid(),
        email text unique not null,
        name text,
        role text not null default 'user',
        created_at timestamptz not null default now()
      );
      
      create table if not exists workspaces (
        id uuid primary key default gen_random_uuid(),
        email text unique not null,
        name text,
        owner_user_id uuid references app_users(id),
        plan text not null default 'free',
        credit_balance numeric not null default 0,
        credit_usd_balance numeric not null default 0,
        free_rpm_limit integer not null default 5,
        free_rpd_limit integer not null default 200,
        draws_left integer not null default 0,
        created_at timestamptz not null default now()
      );
      
      alter table workspaces add column if not exists draws_left integer not null default 0;
      
      create table if not exists api_keys (
        id uuid primary key default gen_random_uuid(),
        workspace_id uuid references workspaces(id),
        name text not null,
        key_prefix text not null,
        key_hash text unique not null,
        key_preview text not null,
        plan text not null default 'free',
        scope text,
        allowed_models text[] default '{}',
        last_used_at timestamptz,
        revoked_at timestamptz,
        created_at timestamptz not null default now()
      );
      
      create table if not exists usage_events (
        id uuid primary key default gen_random_uuid(),
        workspace_id uuid references workspaces(id),
        api_key_id uuid references api_keys(id),
        model text not null,
        endpoint text not null,
        input_tokens integer not null default 0,
        output_tokens integer not null default 0,
        total_tokens integer not null default 0,
        credits_used numeric not null default 0,
        usd_estimate numeric not null default 0,
        status_code integer not null default 200,
        created_at timestamptz not null default now()
      );
      
      create table if not exists daily_usage (
        workspace_id uuid references workspaces(id),
        usage_date date not null,
        requests integer not null default 0,
        input_tokens integer not null default 0,
        output_tokens integer not null default 0,
        total_tokens integer not null default 0,
        credits_used numeric not null default 0,
        usd_estimate numeric not null default 0,
        primary key (workspace_id, usage_date)
      );
      
      create table if not exists model_usage (
        workspace_id uuid references workspaces(id),
        model text not null,
        usage_date date not null,
        requests integer not null default 0,
        total_tokens integer not null default 0,
        credits_used numeric not null default 0,
        usd_estimate numeric not null default 0,
        primary key (workspace_id, model, usage_date)
      );
      
      create table if not exists rate_limit_events (
        id uuid primary key default gen_random_uuid(),
        api_key_id uuid references api_keys(id),
        workspace_id uuid references workspaces(id),
        created_at timestamptz not null default now()
      );
      
      create table if not exists playground_runs (
        id uuid primary key default gen_random_uuid(),
        workspace_id uuid references workspaces(id),
        title text,
        model text not null,
        total_tokens integer not null default 0,
        created_at timestamptz not null default now()
      );
      
      create table if not exists prize_history (
        id uuid primary key default gen_random_uuid(),
        workspace_id uuid references workspaces(id),
        amount text not null,
        created_at timestamptz not null default now()
      );
      
      create table if not exists referrals (
        id uuid primary key default gen_random_uuid(),
        referred_workspace_id uuid references workspaces(id) unique,
        inviter_workspace_id uuid references workspaces(id),
        api_key_reward_claimed boolean default false,
        purchase_reward_claimed boolean default false,
        created_at timestamptz not null default now()
      );
      
      create table if not exists credit_transactions (
        id uuid primary key default gen_random_uuid(),
        workspace_id uuid references workspaces(id),
        type text not null,
        credits numeric not null,
        description text,
        created_at timestamptz not null default now()
      );
    `)
    coreTablesReady = true
    // Grant 1 free draw to specific users who signed up before the referral fix
    await pgPool.query(`
      UPDATE workspaces 
      SET draws_left = GREATEST(draws_left, 1) 
      WHERE email IN ('lazytocraz52@gmail.com', 'kalivta7@gmail.com', 'forexmobile10@gmail.com', 'nyeksusgarcia@gmail.com', 'muneeb64313@gmail.com')
    `).catch(() => {})
  } catch (error) {
    console.warn('Failed to ensure core tables:', error.message)
  }
}

if (pgPool) {
  ensureCoreTables().catch(console.error)
}

export const fallbackModels = [
  { id: 'auto', provider: 'Auto Router', type: 'Reasoning', context: '128k', input: 0.1, output: 0.1, status: 'Live' },
  { id: 'DeepSeek-V4-Flash', provider: 'DeepSeek', type: 'Text', context: '128k', input: 0.14, output: 0.28, status: 'Live' },
  { id: 'DeepSeek-V4-Pro', provider: 'DeepSeek', type: 'Reasoning', context: '128k', input: 0.435, output: 0.87, status: 'Live' },
  { id: 'glm-4.7', provider: 'Zhipu', type: 'Text', context: '128k', input: 0.60, output: 2.20, status: 'Live' },
  { id: 'glm-5.2', provider: 'Zhipu', type: 'Reasoning', context: '1M', input: 1.40, output: 4.40, status: 'Live' },
  { id: 'kat-coder-pro-v2', provider: 'Kat', type: 'Code', context: '128k', input: 0.30, output: 1.20, status: 'Live' },
  { id: 'kat-coder-pro-v2.5', provider: 'Kat', type: 'Code', context: '128k', input: 0.74, output: 2.96, status: 'Live' },
  { id: 'Kimi-K2.6', provider: 'Moonshot', type: 'Text', context: '128k', input: 0.95, output: 4.00, status: 'Live' },
  { id: 'MiniMax-M2.7', provider: 'MiniMax', type: 'Text', context: '128k', input: 0.3, output: 1.2, status: 'Live' },
  { id: 'MiniMax-M3', provider: 'MiniMax', type: 'Reasoning', context: '128k', input: 0.30, output: 1.20, status: 'Live' },
  { id: 'minimaxai/minimax-m2.7', provider: 'MiniMax', type: 'Text', context: '128k', input: 0.14, output: 0.14, status: 'Live' },
  { id: 'mistralai/mistral-small-4-119b-2603', provider: 'Mistral', type: 'Text', context: '32k', input: 2.00, output: 6.00, status: 'Live' },
  { id: 'mistralai/mistral-nemotron', provider: 'NVIDIA', type: 'Code', context: '128k', input: 0.15, output: 0.15, status: 'Live' },
  { id: 'meta/llama-4-maverick-17b-128e-instruct', provider: 'Meta', type: 'Text', context: '128k', input: 0.15, output: 0.15, status: 'Live' },
  { id: 'meta/llama-3.1-70b-instruct', provider: 'Meta', type: 'Text', context: '128k', input: 0.35, output: 0.40, status: 'Live' },
  { id: 'meta/llama-3.2-11b-vision-instruct', provider: 'Meta', type: 'Image', context: '128k', input: 0.15, output: 0.15, status: 'Live' },
  { id: 'qwen/qwen3-next-80b-a3b-instruct', provider: 'Alibaba', type: 'Text', context: '32k', input: 0.35, output: 0.40, status: 'Live' },
  { id: 'nvidia/nemotron-3-super-120b-a12b', provider: 'NVIDIA', type: 'Text', context: '4k', input: 0.80, output: 0.80, status: 'Live' },
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning', provider: 'NVIDIA', type: 'Reasoning', context: '4k', input: 0.20, output: 0.20, status: 'Live' },
  { id: 'nvidia/nvidia-nemotron-nano-9b-v2', provider: 'NVIDIA', type: 'Text', context: '4k', input: 0.10, output: 0.10, status: 'Live' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b', provider: 'NVIDIA', type: 'Text', context: '4k', input: 3.00, output: 3.00, status: 'Live' },
  { id: 'google/gemma-4-31b-it', provider: 'Google', type: 'Text', context: '32k', input: 0.13, output: 0.35, status: 'Live' },

  { id: 'llama-3.3-70b-versatile', provider: 'Meta', type: 'Text', context: '128k', input: 0.59, output: 0.79, status: 'Live' },
  { id: 'llama-3.1-8b-instant', provider: 'Meta', type: 'Text', context: '128k', input: 0.05, output: 0.08, status: 'Live' },
  { id: 'groq/compound', provider: 'Compound', type: 'Reasoning', context: '128k', input: 0.20, output: 0.50, status: 'Live' },
  { id: 'groq/compound-mini', provider: 'Compound', type: 'Reasoning', context: '128k', input: 0.10, output: 0.20, status: 'Live' },
  { id: 'openai/gpt-oss-120b', provider: 'OpenAI', type: 'Text', context: '128k', input: 0.90, output: 2.00, status: 'Live' },
  { id: 'openai/gpt-oss-20b', provider: 'OpenAI', type: 'Text', context: '128k', input: 0.20, output: 0.40, status: 'Live' },
  { id: 'openai/gpt-oss-safeguard-20b', provider: 'Safety', type: 'Text', context: '128k', input: 0.10, output: 0.20, status: 'Live' },
  { id: 'meta-llama/llama-prompt-guard-2-22m', provider: 'Safety', type: 'Text', context: '128k', input: 0.01, output: 0.01, status: 'Live' },
  { id: 'meta-llama/llama-prompt-guard-2-86m', provider: 'Safety', type: 'Text', context: '128k', input: 0.01, output: 0.01, status: 'Live' },

  { id: 'Qwen3-Coder-Next-FP8', provider: 'Alibaba', type: 'Code', context: '128k', input: 0.11, output: 0.80, status: 'Live' },
  { id: 'Qwen3.5-397B-A17B', provider: 'Alibaba', type: 'Reasoning', context: '128k', input: 0.39, output: 0.90, status: 'Live' },
  { id: 'Qwen3.6-35B-A3B', provider: 'Alibaba', type: 'Text', context: '128k', input: 0.14, output: 0.90, status: 'Live' },
  { id: 'sensenova-6.7-flash-lite', provider: 'SenseTime', type: 'Text', context: '128k', input: 0.01, output: 0.02, status: 'Live' },
  { id: 'Spark-X2-Flash', provider: 'iFlytek', type: 'Text', context: '128k', input: 0.28, output: 0.28, status: 'Live' },
  { id: 'step-3.5-flash', provider: 'StepFun', type: 'Text', context: '128k', input: 0.09, output: 0.30, status: 'Live' },
  { id: 'step-3.5-flash-2603', provider: 'StepFun', type: 'Text', context: '128k', input: 0.09, output: 0.30, status: 'Live' },
  { id: 'step-3.7-flash', provider: 'StepFun', type: 'Text', context: '128k', input: 0.20, output: 1.15, status: 'Live' },
  { id: 'step-router-v1', provider: 'StepFun', type: 'Text', context: '128k', input: 1.0, output: 1.0, status: 'Live' },
]

export let modelCache = { expiresAt: 0, models: fallbackModels }

export const seedDb = {
  workspace: {
    email: workspaceEmail,
    credits: 1000,
    creditUsd: 20,
    usedCredits30d: 0,
    usedUsd30d: 0,
    requests30d: 0,
    tokens30d: 0,
    drawsLeft: 0,
  },
  prizeHistory: [],
  referrals: [],
  creditTransactions: [],
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

export let memoryDb = structuredClone(seedDb)
export let warnedAboutDb = false
export let postgresReady = false
export let auditReady = false
export let redemptionReady = false
export const legacyDemoKeyNames = new Set(['Production agents', 'Design playground'])
export const legacyDemoRedemptions = new Set(['KIWI-DEMO-2026', 'KIWI-TEAM-LAUNCH'])

export function keyHash(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function authName(user = {}) {
  const metadata = user.user_metadata || {}
  return metadata.full_name || metadata.name || metadata.user_name || user.email?.split('@')[0] || 'Kiwi User'
}

export async function verifySupabaseUser(token = '') {
  if (supabaseUrl && supabasePublishableKey) {
    try {
      const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        return await response.json()
      }
    } catch (err) {
      console.warn('Supabase verification network warning, falling back to JWT payload decode:', err)
    }
  }

  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
      if (payload && (payload.sub || payload.email)) {
        return {
          id: payload.sub || 'user_id',
          email: payload.email || 'user@kiwillm.dev',
          user_metadata: payload.user_metadata || { name: payload.email?.split('@')[0] || 'Kiwi Builder' },
        }
      }
    }
  } catch (err) {}

  throw Object.assign(new Error('Authentication required.'), { status: 401 })
}

export function getBearer(req) {
  const header = req.get('authorization') || ''
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
}

export async function requireAuth(req, res, next) {
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

export async function requireAdmin(req, res, next) {
  const token = getBearer(req)
  const adminSession = token ? adminSessions.get(token) : null
  if (adminSession && adminSession.expiresAt > Date.now()) {
    req.authUser = { email: adminSession.email, user_metadata: { name: 'Kiwi Admin' } }
    return next()
  }
  if (adminSession) adminSessions.delete(token)

  await requireAuth(req, res, () => {
    const email = String(req.authUser?.email || '').toLowerCase()
    if (!email || !adminEmails.includes(email)) {
      return res.status(403).json({ error: 'Admin access required.' })
    }
    return next()
  })
}

export function createAdminSession(email) {
  const token = crypto.randomUUID() + crypto.randomUUID().replaceAll('-', '')
  adminSessions.set(token, {
    email,
    expiresAt: Date.now() + adminSessionMs,
  })
  return token
}

export function pgWorkspaceToPayload(workspace, totals = {}) {
  const credits = Number(workspace.credit_balance || 0)
  const creditUsd = Number(workspace.credit_usd_balance || 0)
  const usedCredits30d = Number(totals.credits_used || 0)
  const usedUsd30d = Number(totals.usd_estimate || 0)
  return {
    email: workspace.email || workspaceEmail,
    credits,
    creditUsd,
    usedCredits30d,
    usedUsd30d,
    requests30d: Number(totals.requests || 0),
    tokens30d: Number(totals.total_tokens || 0),
  }
}

export async function getDefaultWorkspace(client = pgPool, authUser = null) {
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

    // Fallback: find by email and relink the owner_user_id
    workspaceResult = await client.query('select * from workspaces where email = $1 order by created_at asc limit 1', [authUser.email])
    if (workspaceResult.rowCount) {
      await client.query('update workspaces set owner_user_id = $1 where id = $2', [appUser.id, workspaceResult.rows[0].id])
      return { ...workspaceResult.rows[0], owner_user_id: appUser.id }
    }

    workspaceResult = await client.query(
      `
        insert into workspaces (name, email, owner_user_id, plan, credit_balance, credit_usd_balance, free_rpm_limit, free_rpd_limit, draws_left)
        values ($1, $2, $3, 'free', 1000, 20.00, $4, $5, 0)
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
      insert into workspaces (name, email, owner_user_id, plan, credit_balance, credit_usd_balance, free_rpm_limit, free_rpd_limit)
      values ('Kiwi Workspace', $1, $2, 'free', 1000, 20.00, $3, $4)
      returning *
    `,
    [workspaceEmail, userResult.rows[0].id, freeRpmLimit, freeRpdLimit],
  )
  return result.rows[0]
}

export function pgKeyToPayload(row, fullKey = null) {
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

const pgKeyCache = new Map()

export async function findPgKey(value = '') {
  if (!pgPool || (!value.startsWith(`${kiwiApiPrefix}_`) && !value.startsWith('kiwi_sk_'))) return null
  
  const now = Date.now()
  const cached = pgKeyCache.get(value)
  if (cached && cached.expiresAt > now) {
    return cached.key
  }

  if (process.env.KIWI_MASTER_KEY && value === process.env.KIWI_MASTER_KEY) {
    const workspace = await getDefaultWorkspace()
    const masterKey = { id: 'master', workspace_id: workspace.id, name: 'Master key', key: value, plan: 'admin', allowed_models: [] }
    pgKeyCache.set(value, { key: masterKey, expiresAt: now + 60000 })
    return masterKey
  }

  const result = await pgPool.query(
    `
      select api_keys.*, workspaces.free_rpm_limit, workspaces.free_rpd_limit, workspaces.credit_balance, workspaces.credit_usd_balance
      from api_keys
      join workspaces on workspaces.id = api_keys.workspace_id
      where api_keys.key_hash = $1 and api_keys.revoked_at is null
      limit 1
    `,
    [keyHash(value)],
  )
  const keyObj = result.rows[0] || null
  pgKeyCache.set(value, { key: keyObj, expiresAt: now + (keyObj ? 60000 : 10000) })
  return keyObj
}

setInterval(() => {
  const now = Date.now()
  for (const [k, v] of pgKeyCache.entries()) {
    if (v.expiresAt < now) pgKeyCache.delete(k)
  }
  for (const [k, v] of rateLimitCache.entries()) {
    const valid = v.filter((t) => now - t < 60000)
    if (valid.length === 0) rateLimitCache.delete(k)
    else rateLimitCache.set(k, valid)
  }
}, 60000)

export function publicKey(key) {
  return `${key.slice(0, 17)}••••`
}

export function keyValue() {
  return `${kiwiApiPrefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 28)}`
}

export async function createPgKey({ name, selectedModels, authUser }) {
  const workspace = await getDefaultWorkspace(pgPool, authUser)
  
  const activeCountResult = await pgPool.query(
    'select count(*) from api_keys where workspace_id = $1 and revoked_at is null',
    [workspace.id],
  )
  const activeCount = Number(activeCountResult.rows[0]?.count || 0)
  if (activeCount >= 2) {
    const error = new Error('Free plan limit: Maximum 2 active API keys allowed. Please revoke an existing key first.')
    error.status = 400
    throw error
  }

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

const rateLimitCache = new Map()

export async function checkPgFreeRateLimit(key) {
  if (!pgPool) return null

  // Air-tight credit security: block if balance <= 0 (unless admin master key)
  if ((key.plan || 'free') !== 'admin') {
    const usdBalance = Number(key.credit_usd_balance || 0)
    const creditBalance = Number(key.credit_balance || 0)
    if (usdBalance <= 0 && creditBalance <= 0) {
      return { status: 402, error: 'Insufficient credit balance. Please spin to win free credits or top up on dashboard.', retryAfter: 0 }
    }
  }

  const rpm = 10 // Strictly 10 RPM free limit
  const now = Date.now()
  
  if (!rateLimitCache.has(key.id)) {
    rateLimitCache.set(key.id, [])
  }
  
  let timestamps = rateLimitCache.get(key.id)
  timestamps = timestamps.filter((timestamp) => now - timestamp < 60000)
  
  if (timestamps.length >= rpm) {
    return { status: 429, error: `Rate limit reached: ${rpm} requests per minute.`, retryAfter: 60 }
  }

  timestamps.push(now)
  rateLimitCache.set(key.id, timestamps)
  
  return null
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

export function creditCost(tokens) {
  return Number((tokens / 1000).toFixed(2))
}

export function modelSpendUsd(model, tokens) {
  const route = fallbackModels.find((item) => item.id === model)
  const perMillion = route ? (route.input + route.output) / 2 : 1
  return Number(((tokens / 1000000) * perMillion).toFixed(4))
}

export const pgUsageQueue = []

if (pgPool) {
  setInterval(flushPgUsage, 5000)
}

export async function flushPgUsage() {
  if (pgUsageQueue.length === 0 || !pgPool) return
  const batch = pgUsageQueue.splice(0, pgUsageQueue.length)
  
  const client = await pgPool.connect()
  try {
    await client.query('begin')
    
    const dailyMap = {}
    const modelMap = {}
    const keyMap = new Set()
    
    for (const { key, model, endpoint, usage, statusCode } of batch) {
      const totalTokens = Number(usage?.totalTokens || 0)
      const inputTokens = Number(usage?.inputTokens || 0)
      const outputTokens = Number(usage?.outputTokens || 0)
      const credits = creditCost(totalTokens)
      const usd = modelSpendUsd(model, totalTokens)
      const today = todayKey()

      await client.query(
        `insert into usage_events (workspace_id, api_key_id, model, endpoint, input_tokens, output_tokens, total_tokens, credits_used, usd_estimate, status_code) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [key.workspace_id, key.id === 'master' ? null : key.id, model, endpoint, inputTokens, outputTokens, totalTokens, credits, usd, statusCode || 200]
      )

      const dKey = `${key.workspace_id}:${today}`
      if (!dailyMap[dKey]) dailyMap[dKey] = { w: key.workspace_id, d: today, r: 0, i: 0, o: 0, t: 0, c: 0, u: 0 }
      dailyMap[dKey].r++
      dailyMap[dKey].i += inputTokens
      dailyMap[dKey].o += outputTokens
      dailyMap[dKey].t += totalTokens
      dailyMap[dKey].c += credits
      dailyMap[dKey].u += usd

      const mKey = `${key.workspace_id}:${model}:${today}`
      if (!modelMap[mKey]) modelMap[mKey] = { w: key.workspace_id, m: model, d: today, r: 0, t: 0, c: 0, u: 0 }
      modelMap[mKey].r++
      modelMap[mKey].t += totalTokens
      modelMap[mKey].c += credits
      modelMap[mKey].u += usd

      if (key.id !== 'master') keyMap.add(key.id)
    }

    for (const v of Object.values(dailyMap)) {
      await client.query(`
        insert into daily_usage (workspace_id, usage_date, requests, input_tokens, output_tokens, total_tokens, credits_used, usd_estimate)
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        on conflict (workspace_id, usage_date)
        do update set requests = daily_usage.requests + excluded.requests, input_tokens = daily_usage.input_tokens + excluded.input_tokens, output_tokens = daily_usage.output_tokens + excluded.output_tokens, total_tokens = daily_usage.total_tokens + excluded.total_tokens, credits_used = daily_usage.credits_used + excluded.credits_used, usd_estimate = daily_usage.usd_estimate + excluded.usd_estimate
      `, [v.w, v.d, v.r, v.i, v.o, v.t, v.c, v.u])
      
      await client.query(`
        update workspaces 
        set credit_usd_balance = credit_usd_balance - $1,
            credit_balance = credit_balance - $2
        where id = $3
      `, [v.u, v.c, v.w])
    }

    for (const v of Object.values(modelMap)) {
      await client.query(`
        insert into model_usage (workspace_id, model, usage_date, requests, total_tokens, credits_used, usd_estimate)
        values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (workspace_id, model, usage_date)
        do update set requests = model_usage.requests + excluded.requests, total_tokens = model_usage.total_tokens + excluded.total_tokens, credits_used = model_usage.credits_used + excluded.credits_used, usd_estimate = model_usage.usd_estimate + excluded.usd_estimate
      `, [v.w, v.m, v.d, v.r, v.t, v.c, v.u])
    }

    for (const kid of keyMap) {
      await client.query('update api_keys set last_used_at = now() where id = $1', [kid])
    }
    
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    console.error('Failed to flush PG usage batch:', error.message)
    pgUsageQueue.unshift(...batch)
  } finally {
    client.release()
  }
}

export async function recordPgUsage(event) {
  if (!pgPool) return
  pgUsageQueue.push(event)
}

export async function getPgDashboard(authUser = null) {
  const workspace = await getDefaultWorkspace(pgPool, authUser)
  const totalsResult = await pgPool.query(
    `
      select
        coalesce(sum(requests), 0) as requests,
        coalesce(sum(total_tokens), 0) as total_tokens,
        coalesce(sum(credits_used), 0) as credits_used,
        coalesce(sum(usd_estimate), 0) as usd_estimate
      from daily_usage
      where workspace_id = $1
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
      where workspace_id = $1
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

export async function getPgRuns(authUser = null) {
  const workspace = await getDefaultWorkspace(pgPool, authUser)
  const result = await pgPool.query(
    'select title, model, total_tokens as tokens, created_at from playground_runs where workspace_id = $1 order by created_at desc limit 20',
    [workspace.id],
  )
  return result.rows
}

export async function ensureAuditTable() {
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

export async function ensureRedemptionTables() {
  if (!pgPool || redemptionReady) return
  await pgPool.query(`
    create table if not exists redemption_codes (
      id uuid primary key default gen_random_uuid(),
      code text unique not null,
      credits numeric not null,
      max_redemptions integer not null default 1,
      redeemed_count integer not null default 0,
      expires_at timestamptz,
      created_at timestamptz not null default now()
    )
  `)
  await pgPool.query(`
    create table if not exists redemption_uses (
      id uuid primary key default gen_random_uuid(),
      redemption_code_id uuid references redemption_codes(id),
      workspace_id uuid,
      created_at timestamptz not null default now()
    )
  `)
  redemptionReady = true
}

export async function recordAuditEvent({ workspace, authUser, action, metadata = {} }) {
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

export async function getAdminOverview() {
  if (!pgPool) {
    const db = await readDb()
    return {
      summary: {
        workspaces: 1,
        users: 0,
        activeKeys: db.keys.length,
        revokedKeys: 0,
        requests30d: db.workspace.requests30d,
        tokens30d: db.workspace.tokens30d,
        creditsUsed30d: db.workspace.usedCredits30d,
        creditsBought: 0,
        revenue: 0,
        playgroundRuns: db.runs.length,
      },
      keys: db.keys.slice(0, 25).map((item) => ({
        id: item.id,
        name: item.name,
        workspace: db.workspace.email,
        preview: publicKey(item.key),
        scope: item.scope,
        lastUsed: item.lastUsed,
        createdAt: item.createdAt,
        revoked: false,
      })),
      usageByModel: db.usage.spendByModel || [],
      audit: [],
      runs: db.runs.slice(0, 20),
      redemptionCodes: Object.entries(db.redemptions || {}).map(([code, redemption]) => {
        const item =
          redemption && typeof redemption === 'object'
            ? redemption
            : { credits: Number(redemption || 0), maxRedemptions: 1, redeemedCount: 0, expiresAt: null, createdAt: null }
        return {
          code,
          credits: Number(item.credits || 0),
          maxRedemptions: Number(item.maxRedemptions || 1),
          redeemedCount: Number(item.redeemedCount || 0),
          expiresAt: item.expiresAt || null,
          createdAt: item.createdAt || null,
        }
      }),
    }
  }

  await ensureAuditTable()
  await ensureRedemptionTables()
  const [workspaceCount, userCount, drawsTotal, referralCount, keyCounts, usageTotals, modelUsage, auditEvents, runs, recentKeys, redemptionCodes, recentReferrals, recentPrizes] = await Promise.all([
    pgPool.query('select count(*)::int as count from workspaces'),
    pgPool.query('select count(*)::int as count from app_users'),
    pgPool.query('select coalesce(sum(draws_left), 0)::int as count from workspaces'),
    pgPool.query('select count(*)::int as count from referrals'),
    pgPool.query(`
      select
        count(*) filter (where revoked_at is null)::int as active,
        count(*) filter (where revoked_at is not null)::int as revoked
      from api_keys
    `),
    pgPool.query(`
      select
        coalesce(sum(requests), 0)::int as requests,
        coalesce(sum(total_tokens), 0)::bigint as tokens,
        coalesce(sum(credits_used), 0)::numeric as credits,
        coalesce(sum(usd_estimate), 0)::numeric as usd
      from daily_usage
    `),
    pgPool.query(`
      select model, sum(requests)::int as requests, sum(total_tokens)::bigint as tokens, sum(usd_estimate)::numeric as spend
      from model_usage
      group by model
      order by requests desc, tokens desc
      limit 10
    `),
    pgPool.query(`
      select actor_email, action, metadata, created_at
      from audit_events
      order by created_at desc
      limit 30
    `),
    pgPool.query(`
      select title, model, total_tokens as tokens, created_at
      from playground_runs
      order by created_at desc
      limit 20
    `),
    pgPool.query(`
      select api_keys.id, api_keys.name, api_keys.key_preview, api_keys.scope, api_keys.last_used_at,
        api_keys.created_at, api_keys.revoked_at, workspaces.email as workspace
      from api_keys
      join workspaces on workspaces.id = api_keys.workspace_id
      order by api_keys.created_at desc
      limit 25
    `),
    pgPool.query(`
      select code, credits, max_redemptions, redeemed_count, expires_at, created_at
      from redemption_codes
      order by created_at desc
      limit 25
    `),
    pgPool.query(`
      select r.created_at, i.email as inviter_email, ref.email as referred_email, r.api_key_reward_claimed, r.purchase_reward_claimed
      from referrals r
      join workspaces i on i.id = r.inviter_workspace_id
      join workspaces ref on ref.id = r.referred_workspace_id
      order by r.created_at desc
      limit 25
    `),
    pgPool.query(`
      select p.amount, p.created_at, w.email as workspace_email
      from prize_history p
      join workspaces w on w.id = p.workspace_id
      order by p.created_at desc
      limit 25
    `),
  ])

  return {
    summary: {
      workspaces: Number(workspaceCount.rows[0]?.count || 0),
      users: Number(userCount.rows[0]?.count || 0),
      totalDraws: Number(drawsTotal.rows[0]?.count || 0),
      totalReferrals: Number(referralCount.rows[0]?.count || 0),
      activeKeys: Number(keyCounts.rows[0]?.active || 0),
      revokedKeys: Number(keyCounts.rows[0]?.revoked || 0),
      requests30d: Number(usageTotals.rows[0]?.requests || 0),
      tokens30d: Number(usageTotals.rows[0]?.tokens || 0),
      creditsUsed30d: Number(modelUsage.rows.reduce((acc, r) => acc + Number(r.spend || 0), 0) || usageTotals.rows[0]?.usd || 0),
      creditsBought: 0,
      revenue: 0,
      playgroundRuns: Number(runs.rows.length || 0),
    },
    usageByModel: modelUsage.rows.map((row) => ({
      model: row.model,
      requests: Number(row.requests || 0),
      tokens: Number(row.tokens || 0),
      spend: Number(row.spend || 0),
    })),
    audit: auditEvents.rows.map((row) => ({
      actor: row.actor_email || 'system',
      action: row.action,
      metadata: row.metadata || {},
      createdAt: row.created_at,
    })),
    runs: runs.rows.map((row) => ({
      title: row.title,
      model: row.model,
      tokens: Number(row.tokens || 0),
      createdAt: row.created_at,
    })),
    keys: recentKeys.rows.map((row) => ({
      id: row.id,
      name: row.name,
      workspace: row.workspace,
      preview: row.key_preview,
      scope: row.scope,
      lastUsed: row.last_used_at,
      createdAt: row.created_at,
      revoked: Boolean(row.revoked_at),
    })),
    redemptionCodes: redemptionCodes.rows.map((row) => ({
      code: row.code,
      credits: Number(row.credits || 0),
      maxRedemptions: Number(row.max_redemptions || 0),
      redeemedCount: Number(row.redeemed_count || 0),
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    })),
    referrals: recentReferrals.rows.map((row) => ({
      inviterEmail: row.inviter_email,
      referredEmail: row.referred_email,
      apiKeyReward: row.api_key_reward_claimed,
      purchaseReward: row.purchase_reward_claimed,
      createdAt: row.created_at,
    })),
    prizes: recentPrizes.rows.map((row) => ({
      workspaceEmail: row.workspace_email,
      amount: row.amount,
      createdAt: row.created_at,
    })),
  }
}

export async function ensurePostgres() {
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

export async function readPostgresDb() {
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

export async function writePostgresDb(db) {
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

export async function readDb() {
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

export function normalizeDb(db) {
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
      drawsLeft: db.workspace?.drawsLeft !== undefined ? db.workspace.drawsLeft : seedDb.workspace.drawsLeft,
    },
    prizeHistory: Array.isArray(db.prizeHistory) ? db.prizeHistory : [],
    referrals: Array.isArray(db.referrals) ? db.referrals : [],
    creditTransactions: Array.isArray(db.creditTransactions) ? db.creditTransactions : [],
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

export async function writeDb(db) {
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
