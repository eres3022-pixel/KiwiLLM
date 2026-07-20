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

export const pgPool = databaseUrl
  ? new pg.Pool({
      connectionString: databaseUrl,
      ssl: isSupabasePostgres ? { rejectUnauthorized: false } : undefined,
    })
  : null

if (pgPool) {
  pgPool.on('error', (err) => {
    console.warn('PostgreSQL Pool background error:', err.message)
  })
}

export const fallbackModels = [
  { id: 'auto', provider: 'Auto Router', type: 'Reasoning', context: '128k', input: 0, output: 0, status: 'Live' },
  { id: 'DeepSeek-V4-Flash', provider: 'DeepSeek', type: 'Text', context: '128k', input: 0.1, output: 0.2, status: 'Live' },
  { id: 'DeepSeek-V4-Pro', provider: 'DeepSeek', type: 'Reasoning', context: '128k', input: 0.5, output: 1.5, status: 'Live' },
  { id: 'glm-4.7', provider: 'Zhipu', type: 'Text', context: '128k', input: 0.1, output: 0.2, status: 'Live' },
  { id: 'glm-5.2', provider: 'Zhipu', type: 'Reasoning', context: '128k', input: 0.6, output: 1.8, status: 'Live' },
  { id: 'kat-coder-pro-v2', provider: 'Kat', type: 'Code', context: '128k', input: 0.2, output: 0.4, status: 'Live' },
  { id: 'kat-coder-pro-v2.5', provider: 'Kat', type: 'Code', context: '128k', input: 0.2, output: 0.4, status: 'Live' },
  { id: 'Kimi-K2.6', provider: 'Moonshot', type: 'Text', context: '128k', input: 0.3, output: 0.6, status: 'Live' },
  { id: 'MiniMax-M2.7', provider: 'MiniMax', type: 'Text', context: '128k', input: 0.2, output: 0.4, status: 'Live' },
  { id: 'MiniMax-M3', provider: 'MiniMax', type: 'Reasoning', context: '128k', input: 0.5, output: 1.5, status: 'Live' },
  { id: 'Qwen3-Coder-Next-FP8', provider: 'Alibaba', type: 'Code', context: '128k', input: 0.2, output: 0.4, status: 'Live' },
  { id: 'Qwen3.5-397B-A17B', provider: 'Alibaba', type: 'Reasoning', context: '128k', input: 0.5, output: 1.5, status: 'Live' },
  { id: 'Qwen3.6-35B-A3B', provider: 'Alibaba', type: 'Text', context: '128k', input: 0.2, output: 0.4, status: 'Live' },
  { id: 'sensenova-6.7-flash-lite', provider: 'SenseTime', type: 'Text', context: '128k', input: 0.1, output: 0.2, status: 'Live' },
  { id: 'Spark-X2-Flash', provider: 'iFlytek', type: 'Text', context: '128k', input: 0.1, output: 0.2, status: 'Live' },
  { id: 'step-3.5-flash', provider: 'StepFun', type: 'Text', context: '128k', input: 0.1, output: 0.2, status: 'Live' },
  { id: 'step-3.5-flash-2603', provider: 'StepFun', type: 'Text', context: '128k', input: 0.1, output: 0.2, status: 'Live' },
  { id: 'step-3.7-flash', provider: 'StepFun', type: 'Text', context: '128k', input: 0.1, output: 0.2, status: 'Live' },
  { id: 'step-router-v1', provider: 'StepFun', type: 'Text', context: '128k', input: 0.1, output: 0.2, status: 'Live' },
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

    workspaceResult = await client.query(
      `
        insert into workspaces (name, email, owner_user_id, plan, credit_balance, credit_usd_balance, free_rpm_limit, free_rpd_limit)
        values ($1, $2, $3, 'free', 1000, 20.00, $4, $5)
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

export async function findPgKey(value = '') {
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

export async function checkPgFreeRateLimit(key) {
  if (!pgPool || (key.plan || 'free') !== 'free') return null

  const rpm = Number(key.free_rpm_limit || freeRpmLimit)
  const result = await pgPool.query(
    `
      select
        count(*) filter (where created_at >= now() - interval '60 seconds') as minute_count
      from rate_limit_events
      where api_key_id = $1
    `,
    [key.id],
  )
  const minuteCount = Number(result.rows[0]?.minute_count || 0)

  if (minuteCount >= rpm) return { status: 429, error: `Free plan limit reached: ${rpm} requests per minute.`, retryAfter: 60 }

  await pgPool.query(
    'insert into rate_limit_events (api_key_id, workspace_id) values ($1, $2)',
    [key.id, key.workspace_id],
  )
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

export async function recordPgUsage({ key, model, endpoint, usage, statusCode = 200 }) {
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
  const [workspaceCount, userCount, keyCounts, usageTotals, modelUsage, auditEvents, runs, recentKeys, redemptionCodes] = await Promise.all([
    pgPool.query('select count(*)::int as count from workspaces'),
    pgPool.query('select count(*)::int as count from app_users'),
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
        coalesce(sum(credits_used), 0)::numeric as credits
      from daily_usage
      where usage_date >= current_date - interval '29 days'
    `),
    pgPool.query(`
      select model, sum(requests)::int as requests, sum(total_tokens)::bigint as tokens, sum(usd_estimate)::numeric as spend
      from model_usage
      where usage_date >= current_date - interval '29 days'
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
  ])

  return {
    summary: {
      workspaces: Number(workspaceCount.rows[0]?.count || 0),
      users: Number(userCount.rows[0]?.count || 0),
      activeKeys: Number(keyCounts.rows[0]?.active || 0),
      revokedKeys: Number(keyCounts.rows[0]?.revoked || 0),
      requests30d: Number(usageTotals.rows[0]?.requests || 0),
      tokens30d: Number(usageTotals.rows[0]?.tokens || 0),
      creditsUsed30d: Number(usageTotals.rows[0]?.credits || 0),
      playgroundRuns: Number(runs.rowCount || 0),
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
