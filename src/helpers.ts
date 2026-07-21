import { currentSession, authReady } from './state'

export const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

export const formatBigNumber = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M'
  return num.toLocaleString()
}

export type AuthProfile = {
  name: string
  email: string
  avatarUrl: string
}

const protectedApiPaths = new Set([
  '/api/dashboard',
  '/api/redeem',
  '/api/keys',
  '/api/playground/run',
  '/api/playground/runs',
  '/api/usage-logs',
  '/api/admin/overview',
  '/api/admin/redemption-codes',
  '/api/invite/status',
  '/api/invite/draw',
  '/api/invite/add-draw',
  '/api/invite/my-ref',
  '/api/referrals/claim',
])

export const isProtectedApiPath = (path: string) => {
  const base = path.split('?')[0]
  return protectedApiPaths.has(base) || /^\/api\/keys\/[^\/]+\/revoke$/.test(base)
}
export const isAdminApiPath = (path: string) => path.startsWith('/api/admin/')
export const adminToken = () => window.sessionStorage.getItem('kiwi_admin_token') || ''
export const productionApiOrigin =
  window.location.hostname.endsWith('kiwillm.in') || window.location.hostname.endsWith('vercel.app') ? 'https://api.kiwillm.in' : ''
export const apiOrigin = import.meta.env.VITE_KIWI_API_URL || import.meta.env.NEXT_PUBLIC_KIWI_API_URL || productionApiOrigin
export const apiUrl = (path: string) => ((path.startsWith('/api/') || path.startsWith('/v1/')) && apiOrigin ? `${apiOrigin}${path}` : path)

export const getAuthProfile = (user?: any): AuthProfile => {
  const metadata = user?.user_metadata || {}
  const email = user?.email || ''
  const name = metadata.full_name || metadata.name || metadata.user_name || email.split('@')[0] || 'Builder'
  const avatarUrl = metadata.avatar_url || metadata.picture || ''
  return { name, email, avatarUrl }
}

export const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'K'

export const codePanel = (title: string, code: string) => `
  <div class="docs-code-card">
    <div class="docs-code-title">
      <span>${title}</span>
      <button class="copy-button" type="button" data-copy="${escapeHtml(code)}">Copy</button>
    </div>
    <pre><code>${escapeHtml(code)}</code></pre>
  </div>
`

export const api = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const needsAuth = isProtectedApiPath(path)
  if (needsAuth) await authReady
  const headers = new Headers(options?.headers)
  headers.set('Content-Type', 'application/json')
  if (isAdminApiPath(path) && adminToken()) {
    headers.set('Authorization', `Bearer ${adminToken()}`)
  } else if (needsAuth && currentSession?.access_token) {
    headers.set('Authorization', `Bearer ${currentSession.access_token}`)
  }
  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json() as Promise<T>
}

export const barChart = (values: number[], label: string) => `
  <div class="dash-bars" aria-label="${label}">
    ${values.map((value) => `<span style="--bar:${value}%"></span>`).join('')}
  </div>
`

export const dashboardGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
}

export const pageHeader = (brandMark: string, pageLinks: {label: string, href: string}[], authAccountMarkup: any) => `
  <header class="dash-nav">
    <a class="footer-brand" href="/" aria-label="Kiwi LLM home">
      ${brandMark}
      <span>Kiwi LLM</span>
    </a>
    <nav>
      ${pageLinks.map((link) => `<a href="${link.href}">${link.label}</a>`).join('')}
    </nav>
    ${authAccountMarkup(true)}
  </header>
`
