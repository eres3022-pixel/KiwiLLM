import express from 'express'
import crypto from 'node:crypto'
import {
  adminPassword, adminEmails, kiwiApiPrefix, workerBaseUrl, workerApiKey, getRotatedWorkerApiKey, freeRpmLimit, freeRpdLimit, adminSessionMs
} from './config.js'
import {
  requireAuth, requireAdmin, createAdminSession, getAdminOverview, recordAuditEvent,
  ensureRedemptionTables, pgPool, readDb, writeDb, getPgDashboard, getDefaultWorkspace,
  createPgKey, pgKeyToPayload, keyValue, getPgRuns, publicKey
} from './db.js'
import {
  proxyWorker, getAvailableModels, formatTokens, recordMeteredUsage
} from './proxy.js'

export const router = express.Router()

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' })
})
router.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'Kiwi LLM API', version: 'worker-proxy-db-fallback' })
})

import { recordPgUsage, flushPgUsage } from './db.js'

router.get('/api/test-flush', async (req, res) => {
  try {
    await recordPgUsage({
      key: { id: 'd25ec49e-eb38-492d-9816-ef8b9563ae3a', workspace_id: 'ae412039-aaa5-4d5b-ac29-bdad67953b73' },
      model: 'test-model',
      endpoint: '/test',
      usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
      statusCode: 200
    })
    
    const originalError = console.error;
    let err = null;
    console.error = (msg, e) => {
      err = `${msg} ${e}`;
      originalError(msg, e);
    };
    
    await flushPgUsage();
    
    console.error = originalError;
    
    if (err) return res.json({ ok: false, error: err })
    return res.json({ ok: true })
  } catch (e) {
    return res.json({ ok: false, exception: e.message })
  }
})

router.get('/api/ready', async (_req, res) => {
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

router.get('/api/models', async (_req, res) => {
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

router.get('/api/config', (_req, res) => {
  res.json({
    publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
    workerBaseUrl,
    keyPrefix: kiwiApiPrefix,
  })
})

router.post('/api/admin/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')

  if (!adminPassword) {
    return res.status(503).json({ error: 'Admin password is not configured.' })
  }

  if (!adminEmails.includes(email) || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid admin credentials.' })
  }

  res.json({
    ok: true,
    email,
    token: createAdminSession(email),
    expiresIn: Math.floor(adminSessionMs / 1000),
  })
})

router.get('/api/admin/overview', requireAdmin, async (_req, res) => {
  res.json(await getAdminOverview())
})

router.post('/api/admin/redemption-codes', requireAdmin, async (req, res) => {
  const rawCode = String(req.body.code || '').trim().toUpperCase()
  const code = rawCode || `KIWI-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`
  const credits = Number(req.body.credits || 0)
  const maxRedemptions = Math.max(1, Math.floor(Number(req.body.maxRedemptions || 1)))
  const expiresAt = req.body.expiresAt ? new Date(String(req.body.expiresAt)) : null

  if (!Number.isFinite(credits) || credits <= 0) {
    return res.status(400).json({ error: 'Credits must be greater than zero.' })
  }
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return res.status(400).json({ error: 'Expiry date is invalid.' })
  }

  if (pgPool) {
    await ensureRedemptionTables()
    let result
    try {
      result = await pgPool.query(
        `
          insert into redemption_codes (code, credits, max_redemptions, expires_at)
          values ($1, $2, $3, $4)
          returning code, credits, max_redemptions, redeemed_count, expires_at, created_at
        `,
        [code, credits, maxRedemptions, expiresAt ? expiresAt.toISOString() : null],
      )
    } catch (error) {
      if (error?.code === '23505') return res.status(409).json({ error: 'Code already exists.' })
      throw error
    }
    await recordAuditEvent({
      workspace: null,
      authUser: req.authUser,
      action: 'create_redemption_code',
      metadata: { code, credits, maxRedemptions, expiresAt: expiresAt ? expiresAt.toISOString() : null },
    })
    const row = result.rows[0]
    return res.status(201).json({
      code: row.code,
      credits: Number(row.credits),
      maxRedemptions: Number(row.max_redemptions),
      redeemedCount: Number(row.redeemed_count),
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    })
  }

  const db = await readDb()
  if (db.redemptions[code]) return res.status(409).json({ error: 'Code already exists.' })
  db.redemptions[code] = {
    credits,
    maxRedemptions,
    redeemedCount: 0,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    createdAt: new Date().toISOString(),
  }
  await writeDb(db)
  res.status(201).json({
    code,
    credits,
    maxRedemptions,
    redeemedCount: 0,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    createdAt: db.redemptions[code].createdAt,
  })
})

router.get('/v1/models', (req, res) => {
  proxyWorker(req, res, '/v1/models')
})

router.post('/v1/chat/completions', (req, res) => {
  proxyWorker(req, res, '/v1/chat/completions')
})

router.post('/v1/messages', (req, res) => {
  proxyWorker(req, res, '/v1/messages')
})

router.post('/v1/images/generations', (req, res) => {
  proxyWorker(req, res, '/v1/images/generations')
})

router.post('/v1/images/edits', (req, res) => {
  proxyWorker(req, res, '/v1/images/edits')
})

router.post('/v1/video/generations', (req, res) => {
  proxyWorker(req, res, '/v1/video/generations')
})

router.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    // Always load local DB keys
    const db = await readDb()
    const localKeys = (db.keys || []).filter((k) => !k.revoked && !k.revokedAt)

    if (pgPool) {
      try {
        const data = await getPgDashboard(req.authUser)
        const credits = Number(data.workspace?.credits || 0)
        const creditUsd = Number(data.workspace?.creditUsd || 0)
        const requests30d = Number(data.workspace?.requests30d || 0)
        const tokens30d = Number(data.workspace?.tokens30d || 0)
        const usedUsd30d = Number(data.workspace?.usedUsd30d || 0)

        // Use only Postgres keys to prevent leaking local JSON keys across users
        const mergedKeys = data.keys || []

        return res.json({
          ...data,
          keys: mergedKeys,
          stats: [
            { label: 'Credit balance', value: `$${creditUsd.toFixed(4)}`, note: 'Available balance', trend: 'Live' },
            { label: 'Requests', value: requests30d.toLocaleString(), note: 'Last 30 days', trend: 'Live' },
            { label: 'Tokens', value: formatTokens(tokens30d), note: 'Input + output', trend: 'Live' },
            { label: 'Credits used', value: `$${usedUsd30d.toFixed(4)}`, note: 'Last 30 days', trend: 'Live' },
          ],
        })
      } catch (pgErr) {
        console.warn('PostgreSQL database query failed, falling back to local DB:', pgErr.message)
      }
    }

    const workspace = db.workspace || {}
    const credits = Number(workspace.credits || 0)
    const creditUsd = Number(workspace.creditUsd || 0)
    const requests30d = Number(workspace.requests30d || 0)
    const tokens30d = Number(workspace.tokens30d || 0)
    const usedUsd30d = Number(workspace.usedUsd30d || 0)

    return res.json({
      workspace,
      stats: [
        { label: 'Credit balance', value: `$${creditUsd.toFixed(4)}`, note: 'Available balance', trend: 'Live' },
        { label: 'Requests', value: requests30d.toLocaleString(), note: 'Last 30 days', trend: 'Live' },
        { label: 'Tokens', value: formatTokens(tokens30d), note: 'Input + output', trend: 'Live' },
        { label: 'Credits used', value: `$${usedUsd30d.toFixed(4)}`, note: 'Last 30 days', trend: 'Live' },
      ],
      usage: db.usage || { tokenBars: [], requestBars: [], spendByModel: [] },
      limits: { plan: 'Free', rpm: freeRpmLimit, rpd: freeRpdLimit },
      keys: localKeys.map((item) => ({ ...item, key: publicKey(item.key) })),
    })
  } catch (error) {
    console.error('Error serving /api/dashboard:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error.' })
  }
})

router.post('/api/redeem', requireAuth, async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase()
  if (pgPool) {
    try {
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
    } catch (pgErr) {
      console.warn('PostgreSQL redeem failed, falling back to local DB:', pgErr.message)
    }
  }

  const db = await readDb()
  const redemption = db.redemptions[code]
  const redemptionItem =
    redemption && typeof redemption === 'object'
      ? redemption
      : { credits: Number(redemption || 0), maxRedemptions: 1, redeemedCount: 0, expiresAt: null }
  const credits = Number(redemptionItem.credits || 0)
  const redeemedCount = Number(redemptionItem.redeemedCount || 0)
  const maxRedemptions = Number(redemptionItem.maxRedemptions || 1)
  const isExpired = redemptionItem.expiresAt ? new Date(redemptionItem.expiresAt).getTime() <= Date.now() : false

  if (!credits || redeemedCount >= maxRedemptions || isExpired) {
    return res.status(404).json({ error: 'Invalid or already used Kiwi code.' })
  }

  if (redemption && typeof redemption === 'object') {
    db.redemptions[code] = { ...redemptionItem, redeemedCount: redeemedCount + 1 }
  } else {
    delete db.redemptions[code]
  }
  db.workspace.credits += credits
  db.workspace.creditUsd = Number((db.workspace.creditUsd + credits / 50).toFixed(2))
  await writeDb(db)
  res.json({ ok: true, creditsAdded: credits, workspace: db.workspace })
})

router.post('/api/keys', requireAuth, async (req, res) => {
  const name = String(req.body.name || 'Untitled key').trim().slice(0, 80)
  const selectedModels = Array.isArray(req.body.models) && req.body.models.length ? req.body.models : []

  const db = await readDb()

  let createdItem = null
  if (pgPool) {
    try {
      createdItem = await createPgKey({ name, selectedModels, authUser: req.authUser })
      const workspace = await getDefaultWorkspace(pgPool, req.authUser)
      await recordAuditEvent({
        workspace,
        authUser: req.authUser,
        action: 'create_api_key',
        metadata: { name, selectedModels, keyPreview: publicKey(createdItem.key) },
      })
    } catch (pgErr) {
      if (pgErr.status === 400 || pgErr.message?.includes('Maximum 2 active API keys')) {
        return res.status(400).json({ error: pgErr.message })
      }
      console.warn('PostgreSQL key creation failed, falling back to local DB:', pgErr.message)
    }
  }

  if (!pgPool) {
    const activeLocalKeys = (db.keys || []).filter((k) => !k.revoked && !k.revokedAt)
    if (activeLocalKeys.length >= 2) {
      return res.status(400).json({ error: 'Free plan limit: Maximum 2 active API keys allowed. Please revoke an existing key first.' })
    }
  }

  const key = createdItem ? createdItem.key : keyValue()
  const item = {
    id: createdItem ? createdItem.id : crypto.randomUUID(),
    name,
    key,
    scope: selectedModels.length > 3 ? `${selectedModels.length} models` : selectedModels.length ? selectedModels.join(', ') : 'All live models',
    models: selectedModels,
    plan: 'free',
    lastUsed: 'Never',
    createdAt: new Date().toISOString(),
  }

  db.keys = db.keys.filter((existing) => existing.id !== item.id)
  db.keys.unshift(item)
  await writeDb(db)

  res.status(201).json({ ...item, key, displayKey: publicKey(key) })
})

router.post('/api/keys/:id/revoke', requireAuth, async (req, res) => {
  const keyId = String(req.params.id || '')
  if (pgPool) {
    try {
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
    } catch (pgErr) {
      console.warn('PostgreSQL key revocation failed, falling back to local DB:', pgErr.message)
    }
  }

  const db = await readDb()
  const before = db.keys.length
  db.keys = db.keys.filter((item) => item.id !== keyId)
  if (db.keys.length === before) return res.status(404).json({ error: 'API key not found.' })
  await writeDb(db)
  res.json({ ok: true })
})

router.post('/api/playground/run', requireAuth, async (req, res) => {
  const model = String(req.body.model || 'glm-4.7')
  const prompt = String(req.body.prompt || '').slice(0, 2000)
  const system = String(req.body.system || '').slice(0, 2000)
  const temperature = Number.isFinite(Number(req.body.temperature)) ? Number(req.body.temperature) : 0.7
  const maxTokens = Number.isFinite(Number(req.body.maxTokens)) ? Number(req.body.maxTokens) : 2048

  try {
    const activeKey = getRotatedWorkerApiKey() || workerApiKey
    const workerResponse = await fetch(`${workerBaseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeKey ? { Authorization: `Bearer ${activeKey}` } : {}),
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
    // Usage tracking logic mocked out for brevity
    const run = {
      id: crypto.randomUUID(),
      title: prompt.slice(0, 42) || 'Playground run',
      model,
      tokens: 0,
      spend: 0,
      createdAt: new Date().toISOString(),
      response: responseText,
    }

    if (pgPool) {
      // postgres run logic
    } else {
      const db = await readDb()
      db.runs.unshift(run)
      db.runs = db.runs.slice(0, 20)
      await writeDb(db)
    }
    res.json(run)
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : 'Playground request failed.',
    })
  }
})

router.get('/api/playground/runs', requireAuth, async (req, res) => {
  if (pgPool) {
    return res.json({ runs: await getPgRuns(req.authUser) })
  }

  const db = await readDb()
  res.json({ runs: db.runs })
})

router.get('/api/usage-logs', requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10))
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)))
  const offset = (page - 1) * limit
  const days = req.query.days === 'all' ? null : Math.max(1, parseInt(String(req.query.days || '30'), 10))

  try {
    if (pgPool) {
      try {
        // Try request_logs table first
        const since = days ? new Date(Date.now() - days * 86400000).toISOString() : null
        const whereClause = since ? `WHERE w.user_email = $1 AND rl.created_at >= $2` : `WHERE w.user_email = $1`
        const params = since ? [req.authUser, since] : [req.authUser]

        let rows = []
        let total = 0

        try {
          const countRes = await pgPool.query(
            `SELECT COUNT(*) FROM request_logs rl
             JOIN api_keys ak ON rl.api_key_id = ak.id
             JOIN workspaces w ON ak.workspace_id = w.id
             ${whereClause}`,
            params,
          )
          total = parseInt(countRes.rows[0]?.count || '0', 10)

          const dataRes = await pgPool.query(
            `SELECT
               rl.id, rl.created_at, rl.model, rl.prompt_tokens, rl.completion_tokens,
               rl.total_tokens, rl.cost_usd, rl.status, rl.latency_ms,
               ak.name AS key_name,
               CONCAT(LEFT(ak.key_hash, 8), '...') AS key_preview
             FROM request_logs rl
             JOIN api_keys ak ON rl.api_key_id = ak.id
             JOIN workspaces w ON ak.workspace_id = w.id
             ${whereClause}
             ORDER BY rl.created_at DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, limit, offset],
          )
          rows = dataRes.rows
        } catch {
          // request_logs table may not exist — fall through to local DB
        }

        if (rows.length > 0 || total > 0) {
          return res.json({
            logs: rows.map((r) => ({
              id: r.id,
              createdAt: r.created_at,
              model: r.model || '—',
              keyName: r.key_name || '—',
              keyPreview: r.key_preview || '—',
              promptTokens: Number(r.prompt_tokens || 0),
              completionTokens: Number(r.completion_tokens || 0),
              totalTokens: Number(r.total_tokens || 0),
              costUsd: Number(r.cost_usd || 0),
              status: r.status || 'success',
              latencyMs: Number(r.latency_ms || 0),
            })),
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          })
        }
      } catch (pgErr) {
        console.warn('Usage logs PG query failed:', pgErr.message)
      }
    }

    // Local DB fallback — use runs array
    const db = await readDb()
    const allRuns = (db.runs || [])
    const filtered = days
      ? allRuns.filter((r) => new Date(r.createdAt).getTime() >= Date.now() - days * 86400000)
      : allRuns
    const total = filtered.length
    const page_runs = filtered.slice(offset, offset + limit)

    return res.json({
      logs: page_runs.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        model: r.model || '—',
        keyName: 'Playground',
        keyPreview: '—',
        promptTokens: r.promptTokens || 0,
        completionTokens: r.completionTokens || 0,
        totalTokens: r.tokens || 0,
        costUsd: r.spend || 0,
        status: 'success',
        latencyMs: r.latencyMs || 0,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error serving /api/usage-logs:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error.' })
  }
})

// --- Wallet Endpoints ---

router.get('/api/wallet/history', requireAuth, async (req, res) => {
  if (pgPool) {
    try {
      const workspace = await getDefaultWorkspace(pgPool, req.authUser)
      const result = await pgPool.query('select type, credits, description, created_at from credit_transactions where workspace_id = $1 order by created_at desc limit 50', [workspace.id])
      return res.json({ transactions: result.rows.map(r => ({ type: r.type, credits: Number(r.credits), description: r.description, createdAt: r.created_at })) })
    } catch (err) {
      console.warn('PG wallet history failed:', err.message)
    }
  }
  const db = await readDb()
  const tx = db.creditTransactions || []
  res.json({ transactions: tx.slice(0, 50) })
})

// --- Invite Draw Endpoints ---

router.get('/api/admin/reset-draws', async (req, res) => {
  if (pgPool) {
    try {
      await pgPool.query('update workspaces set draws_left = 0')
      return res.json({ ok: true, msg: 'Postgres draws reset' })
    } catch (e) {
      return res.json({ error: e.message })
    }
  }
  const db = await readDb()
  db.workspace.drawsLeft = 0
  await writeDb(db)
  res.json({ ok: true, msg: 'JSON draws reset' })
})

router.get('/api/invite/my-ref', requireAuth, async (req, res) => {
  if (pgPool) {
    try {
      const workspace = await getDefaultWorkspace(pgPool, req.authUser)
      return res.json({ refCode: workspace.id })
    } catch (err) {
      console.warn('PG my-ref failed:', err.message)
    }
  }
  const db = await readDb()
  res.json({ refCode: db.workspace?.email || 'local-demo-ref' })
})

router.post('/api/referrals/claim', requireAuth, async (req, res) => {
  const inviterCode = String(req.body.inviter || '').trim()
  if (!inviterCode) return res.status(400).json({ error: 'Missing inviter code' })
  
  if (pgPool) {
    try {
      const workspace = await getDefaultWorkspace(pgPool, req.authUser)
      if (workspace.id === inviterCode) {
        return res.status(400).json({ error: 'Cannot refer yourself' })
      }
      
      const existing = await pgPool.query('select * from referrals where referred_workspace_id = $1', [workspace.id])
      if (existing.rowCount === 0) {
        const inviter = await pgPool.query('select id from workspaces where id = $1', [inviterCode])
        if (inviter.rowCount) {
          await pgPool.query('begin')
          try {
            await pgPool.query('insert into referrals (referred_workspace_id, inviter_workspace_id, api_key_reward_claimed) values ($1, $2, true)', [workspace.id, inviter.rows[0].id])
            await pgPool.query('update workspaces set draws_left = draws_left + 1 where id = $1', [workspace.id])
            await pgPool.query('update workspaces set draws_left = draws_left + 1 where id = $1', [inviter.rows[0].id])
            await pgPool.query('commit')
            return res.json({ ok: true })
          } catch (e) {
            await pgPool.query('rollback')
            throw e
          }
        }
      }
      return res.json({ ok: false, reason: 'Already referred or invalid inviter' })
    } catch (err) {
      console.warn('PG referral claim failed:', err.message)
    }
  }
  
  const db = await readDb()
  const myId = db.workspace?.email || 'local-demo-ref'
  if (inviterCode === myId) return res.status(400).json({ error: 'Cannot refer yourself' })
  
  if (!db.referrals) db.referrals = []
  const existing = db.referrals.find(r => r.referred_workspace_id === myId)
  if (!existing) {
    db.referrals.push({
      referred_workspace_id: myId,
      inviter_workspace_id: inviterCode,
      api_key_reward_claimed: true,
      purchase_reward_claimed: false,
      created_at: new Date().toISOString()
    })
    db.workspace.drawsLeft = (db.workspace.drawsLeft || 0) + 1
    // Note: in local JSON db, we can't easily update the inviter's workspace, but PG handles it correctly.
    await writeDb(db)
    return res.json({ ok: true })
  }
  return res.json({ ok: false, reason: 'Already referred' })
})

function pickPrize() {
  const r = Math.random() * 100
  let p = 0
  if ((p += 0.2) >= r) return 1000
  if ((p += 0.3) >= r) return 500
  if ((p += 1.0) >= r) return 100
  if ((p += 2.5) >= r) return 50
  if ((p += 4.0) >= r) return 30
  if ((p += 7.0) >= r) return 20
  if ((p += 12.0) >= r) return 15
  if ((p += 18.0) >= r) return 10
  if ((p += 25.0) >= r) return 5
  return 3
}

router.get('/api/invite/status', requireAuth, async (req, res) => {
  if (pgPool) {
    try {
      const workspace = await getDefaultWorkspace(pgPool, req.authUser)
      const prizeResult = await pgPool.query('select amount, created_at from prize_history where workspace_id = $1 order by created_at desc', [workspace.id])
      const referredResult = await pgPool.query(`
        select u.email, u.name
        from referrals r
        join workspaces w on r.referred_workspace_id = w.id
        join app_users u on w.owner_user_id = u.id
        where r.inviter_workspace_id = $1
        order by r.created_at desc
      `, [workspace.id])
      
      return res.json({ 
        drawsLeft: Number(workspace.draws_left || 0), 
        history: prizeResult.rows.map(r => ({ amount: r.amount, createdAt: r.created_at })),
        referrals: referredResult.rows
      })
    } catch (err) {
      console.warn('PG get invite status failed:', err.message)
    }
  }
  const db = await readDb()
  const localRefs = (db.referrals || []).filter(r => r.inviter_workspace_id === (db.workspace?.email || 'local-demo-ref'))
  res.json({ 
    drawsLeft: db.workspace.drawsLeft || 0, 
    history: db.prizeHistory || [],
    referrals: localRefs.map(r => ({ email: r.referred_workspace_id, name: '' }))
  })
})

router.post('/api/invite/add-draw', requireAuth, async (req, res) => {
  if (pgPool) {
    try {
      const workspace = await getDefaultWorkspace(pgPool, req.authUser)
      await pgPool.query('update workspaces set draws_left = draws_left + 1 where id = $1', [workspace.id])
      return res.json({ ok: true })
    } catch (err) {
      console.warn('PG add draw failed:', err.message)
    }
  }
  const db = await readDb()
  db.workspace.drawsLeft = (db.workspace.drawsLeft || 0) + 1
  await writeDb(db)
  res.json({ ok: true })
})

router.post('/api/invite/draw', requireAuth, async (req, res) => {
  if (pgPool) {
    try {
      const workspace = await getDefaultWorkspace(pgPool, req.authUser)
      if ((workspace.draws_left || 0) <= 0) {
        return res.status(400).json({ error: 'No draws left.' })
      }
      const prizeAmount = pickPrize()
      const prizeUsd = prizeAmount
      const prizeCredits = prizeUsd * 50
      await pgPool.query('begin')
      try {
        await pgPool.query('update workspaces set draws_left = draws_left - 1, credit_balance = credit_balance + $1, credit_usd_balance = credit_usd_balance + $2 where id = $3', [prizeCredits, prizeUsd, workspace.id])
        // credit_transactions might not exist depending on their schema but redemption uses it, we will wrap in try/catch if it doesn't
        try {
          await pgPool.query('insert into credit_transactions (workspace_id, type, credits, description) values ($1, $2, $3, $4)', [workspace.id, 'prize', prizeCredits, 'Won on spinning wheel'])
        } catch(e) {}
        await pgPool.query('insert into prize_history (workspace_id, amount) values ($1, $2)', [workspace.id, String(prizeAmount)])
        await pgPool.query('commit')
        return res.json({ amount: prizeAmount })
      } catch (err) {
        await pgPool.query('rollback')
        throw err
      }
    } catch (err) {
      console.warn('PG draw failed:', err.message)
    }
  }
  const db = await readDb()
  if ((db.workspace.drawsLeft || 0) <= 0) {
    return res.status(400).json({ error: 'No draws left.' })
  }
  const prizeAmount = pickPrize()
  const prizeUsd = prizeAmount
  const prizeCredits = prizeUsd * 50
  db.workspace.drawsLeft -= 1
  db.workspace.credits += prizeCredits
  db.workspace.creditUsd = Number((db.workspace.creditUsd + prizeUsd).toFixed(2))
  if (!db.prizeHistory) db.prizeHistory = []
  db.prizeHistory.unshift({ amount: String(prizeAmount), createdAt: new Date().toISOString() })
  if (!db.creditTransactions) db.creditTransactions = []
  db.creditTransactions.unshift({ type: 'prize', credits: prizeCredits, description: 'Won on spinning wheel', createdAt: new Date().toISOString() })
  await writeDb(db)
  res.json({ amount: prizeAmount })
})

