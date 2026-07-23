import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const port = process.env.PORT || 3000
export const databaseUrl = process.env.DATABASE_URL || ''
export const isSupabasePostgres = databaseUrl.includes('supabase.co') || databaseUrl.includes('pooler.supabase.com')
export const dbPath = process.env.DB_PATH || join(__dirname, '..', 'data', 'db.json')
export const workerBaseUrl = (process.env.UNIFIED_AI_WORKER_URL || 'https://api.hcnsec.cn').replace(/\/$/, '')
export const workerApiKeys = (
  process.env.UNIFIED_AI_WORKER_API_KEYS ||
  process.env.UNIFIED_AI_WORKER_API_KEY ||
  'sk-S9mxJdC3jKgZsZDRei2ONvRM5uIbLM3vbjv5VH80hGHTe0cl,sk-G0hceMk988Vpa1np0UNzETP6tQHeGll4fAiYxJVwjtzNlSrb,sk-qe2aRHBgUT6E2JTQBPYCZ24qdO7vnpTrtPfj4tLlBupa4Xru,sk-jCvRq7DEZRE7EvLXWRycSDCiyfkOaNR8MC1eb2BpnNMqJpDe,sk-ktulslsiFE2SC8scjxRAeDJzmdr6IZriMPQwF0JW82IUWxv7'
)
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean)

let currentKeyIndex = 0

export function getRotatedWorkerApiKey() {
  if (!workerApiKeys.length) return ''
  const key = workerApiKeys[currentKeyIndex % workerApiKeys.length]
  currentKeyIndex = (currentKeyIndex + 1) % workerApiKeys.length
  return key
}

export const workerApiKey = workerApiKeys[0] || ''
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
