import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const port = process.env.PORT || 3000
export const databaseUrl = process.env.DATABASE_URL || ''
export const isSupabasePostgres = databaseUrl.includes('supabase.co') || databaseUrl.includes('pooler.supabase.com')
export const dbPath = process.env.DB_PATH || join(__dirname, '..', 'data', 'db.json')
export const gateways = [
  {
    id: 'primary',
    url: (process.env.UNIFIED_AI_WORKER_URL || 'https://api.hcnsec.cn').replace(/\/$/, ''),
    keys: (
      process.env.UNIFIED_AI_WORKER_API_KEYS ||
      process.env.UNIFIED_AI_WORKER_API_KEY ||
      'sk-S9mxJdC3jKgZsZDRei2ONvRM5uIbLM3vbjv5VH80hGHTe0cl,sk-G0hceMk988Vpa1np0UNzETP6tQHeGll4fAiYxJVwjtzNlSrb,sk-qe2aRHBgUT6E2JTQBPYCZ24qdO7vnpTrtPfj4tLlBupa4Xru,sk-jCvRq7DEZRE7EvLXWRycSDCiyfkOaNR8MC1eb2BpnNMqJpDe,sk-ktulslsiFE2SC8scjxRAeDJzmdr6IZriMPQwF0JW82IUWxv7'
    ).split(',').map(k => k.trim()).filter(Boolean),
    keyIndex: 0
  },
  {
    id: 'provider2',
    url: (process.env.PROVIDER2_WORKER_URL || 'https://nvidia-worker.revai.workers.dev').replace(/\/$/, ''),
    keys: (
      process.env.PROVIDER2_WORKER_API_KEYS ||
      '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,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,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,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'
    ).split(',').map(k => k.trim()).filter(Boolean),
    keyIndex: 0
  },
  {
    id: 'provider3',
    url: (process.env.PROVIDER3_WORKER_URL || 'https://groq-worker.revai.workers.dev').replace(/\/$/, ''),
    keys: (process.env.PROVIDER3_WORKER_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean),
    keyIndex: 0
  }
].filter(g => g.url)

export function getRotatedKeyForGateway(gateway) {
  if (!gateway || !gateway.keys || !gateway.keys.length) return ''
  const key = gateway.keys[gateway.keyIndex % gateway.keys.length]
  gateway.keyIndex = (gateway.keyIndex + 1) % gateway.keys.length
  return key
}

// Aliases for backward compatibility in config response and routes
export const workerBaseUrl = gateways[0]?.url || 'https://api.hcnsec.cn'
export const workerApiKey = gateways[0]?.keys?.[0] || ''
export function getRotatedWorkerApiKey() {
  return getRotatedKeyForGateway(gateways[0])
}
export const kiwiApiPrefix = process.env.KIWI_API_KEY_PREFIX || 'Kiwi'
export const workspaceEmail = process.env.KIWI_WORKSPACE_EMAIL || 'workspace@kiwillm.dev'
export const freeRpmLimit = Number(process.env.KIWI_FREE_RPM || 10)
export const freeRpdLimit = Number(process.env.KIWI_FREE_RPD || 999999)
export const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''
export const allowedOrigins = (process.env.CORS_ORIGINS || 'https://kiwillm.in,https://www.kiwillm.in,http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
export const adminEmails = (process.env.ADMIN_EMAILS || 'kiwi@admin.in')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)
export const adminPassword = process.env.ADMIN_PASSWORD || ''
export const adminSessions = new Map()
export const adminSessionMs = 8 * 60 * 60 * 1000
