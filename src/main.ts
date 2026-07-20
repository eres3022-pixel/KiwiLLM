import './style.css'
import Lenis from 'lenis'
import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js'
import { pageNotFound, renderSupportPage, supportPages } from './pages/supportPages'
import { renderRefundPolicyPage } from './pages/refundPolicy'
import { renderTopUpPage } from './pages/topUp'
import { applySeo } from './seo'

import { renderHome } from './components/Home'
import { renderDocs } from './components/Docs'
import { renderDashboard } from './components/Dashboard'
import { renderModels } from './components/Models'
import { renderPlayground } from './components/Playground'
import { renderAdmin } from './components/Admin'
import { renderUsageLogs } from './components/UsageLogs'

import { topUpPlans, pageLinks } from './data'
import { currentSession, setCurrentSession, resolveAuthReady, authReady } from './state'
import { brandMark, authAccountMarkup } from './icons'
import { getAuthProfile, initialsFor, escapeHtml, api, pageHeader, adminToken } from './helpers'
import { dashboardGreeting } from './helpers'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const app = document.querySelector<HTMLDivElement>('#app')!
const isDocsPage = window.location.pathname === '/docs'
const isDashboardPage = window.location.pathname === '/dashboard'
const isModelsPage = window.location.pathname === '/models'
const isPlaygroundPage = window.location.pathname === '/playground'
const isAdminPage = window.location.pathname === '/admin'
const isUsagePage = window.location.pathname === '/usage'
const isTopUpPage = window.location.pathname === '/top-up'
const isRefundPage = window.location.pathname === '/refund-policy'
const supportPage = supportPages[window.location.pathname]
applySeo(window.location.pathname)
app.innerHTML = isDocsPage
  ? renderDocs()
  : isDashboardPage
    ? renderDashboard()
    : isModelsPage
      ? renderModels()
      : isPlaygroundPage
        ? renderPlayground()
        : isAdminPage
          ? renderAdmin()
          : isUsagePage
            ? renderUsageLogs()
            : isTopUpPage
              ? renderTopUpPage(pageHeader(brandMark, pageLinks, authAccountMarkup), topUpPlans)
              : isRefundPage
                ? renderRefundPolicyPage()
                : supportPage || window.location.pathname !== '/'
                ? renderSupportPage(supportPage || pageNotFound, pageHeader(brandMark, pageLinks, authAccountMarkup))
                : renderHome()

document.body.insertAdjacentHTML(
  'beforeend',
  `
    <div class="auth-modal" data-auth-modal hidden>
      <button class="auth-backdrop" type="button" aria-label="Close sign in" data-auth-close></button>
      <section class="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button class="auth-close" type="button" aria-label="Close sign in" data-auth-close>×</button>
        <div class="auth-dialog-mark" aria-hidden="true">${brandMark}</div>
        <p class="auth-kicker">Kiwi account</p>
        <h2 id="auth-title">Continue with your workspace</h2>
        <p>Use Google or GitHub to sync your profile, avatar, and dashboard identity across Kiwi LLM.</p>
        <div class="auth-provider-list">
          <button type="button" data-auth-provider="google">
            <span class="provider-icon google-icon" aria-hidden="true">G</span>
            Continue with Google
          </button>
          <button type="button" data-auth-provider="github">
            <span class="provider-icon github-icon" aria-hidden="true">GH</span>
            Continue with GitHub
          </button>
        </div>
        <small data-auth-message>${supabase ? 'Secure OAuth powered by Supabase.' : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable login.'}</small>
      </section>
    </div>
  `,
)

const authModal = document.querySelector<HTMLElement>('[data-auth-modal]')
const authMessage = document.querySelector<HTMLElement>('[data-auth-message]')

const closeAuthMenus = (except?: HTMLElement) => {
  document.querySelectorAll<HTMLElement>('[data-auth-account]').forEach((account) => {
    if (account === except) return
    account.classList.remove('is-menu-open')
    account.querySelector<HTMLElement>('[data-auth-menu]')?.setAttribute('hidden', '')
    account.querySelector<HTMLButtonElement>('[data-auth-open]')?.setAttribute('aria-expanded', 'false')
  })
}

const openAuthModal = () => {
  if (!authModal) return
  authModal.hidden = false
  requestAnimationFrame(() => authModal.classList.add('is-open'))
}

const closeAuthModal = () => {
  if (!authModal) return
  authModal.classList.remove('is-open')
  window.setTimeout(() => {
    authModal.hidden = true
  }, 180)
}

const syncAuthUi = (session: Session | null) => {
  setCurrentSession(session)
  const profile = getAuthProfile(session?.user)
  document.querySelectorAll<HTMLElement>('[data-auth-account]').forEach((account) => {
    account.classList.toggle('is-signed-in', Boolean(session))
    account.classList.remove('is-menu-open')
  })
  document.querySelectorAll<HTMLElement>('[data-auth-name]').forEach((node) => {
    node.textContent = session ? profile.name : node.closest('.auth-account') ? 'Sign in' : 'Workspace'
  })
  document.querySelectorAll<HTMLElement>('[data-auth-avatar]').forEach((avatar) => {
    avatar.classList.toggle('auth-avatar-fallback', !profile.avatarUrl || !session)
    avatar.textContent = session && !profile.avatarUrl ? initialsFor(profile.name) : ''
    avatar.style.backgroundImage = profile.avatarUrl && session ? `url("${profile.avatarUrl}")` : ''
  })
  document.querySelectorAll<HTMLElement>('[data-auth-menu]').forEach((menu) => {
    menu.hidden = true
  })
  const dashboardName = document.querySelector<HTMLElement>('#dashboard-name')
  if (dashboardName) dashboardName.textContent = session ? profile.name : 'builder'
  const dashboardGreetingNode = document.querySelector<HTMLElement>('#dashboard-greeting')
  if (dashboardGreetingNode) dashboardGreetingNode.textContent = dashboardGreeting()
  if (isDashboardPage || isAdminPage) {
    window.dispatchEvent(new CustomEvent('kiwi-auth-synced'))
  }
}

document.querySelectorAll<HTMLElement>('[data-auth-open]').forEach((button) => {
  button.addEventListener('click', () => {
    const account = button.closest<HTMLElement>('[data-auth-account]')
    if (currentSession) {
      const menu = account?.querySelector<HTMLElement>('[data-auth-menu]')
      if (!account || !menu) return
      const isOpen = account.classList.toggle('is-menu-open')
      button.setAttribute('aria-expanded', String(isOpen))
      menu.hidden = !isOpen
      if (isOpen) closeAuthMenus(account)
      return
    }
    openAuthModal()
  })
})

document.querySelectorAll<HTMLElement>('[data-auth-close]').forEach((button) => {
  button.addEventListener('click', closeAuthModal)
})

document.querySelectorAll<HTMLButtonElement>('[data-auth-provider]').forEach((button) => {
  button.addEventListener('click', async () => {
    const provider = button.dataset.authProvider as 'google' | 'github'
    if (!supabase) {
      if (authMessage) authMessage.textContent = 'Supabase env vars are missing. Add them, restart Vite, then try again.'
      return
    }
    button.disabled = true
    if (authMessage) authMessage.textContent = `Opening ${provider} sign in...`
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + window.location.pathname },
    })
    if (error) {
      button.disabled = false
      if (authMessage) authMessage.textContent = error.message
    }
  })
})

document.querySelectorAll<HTMLButtonElement>('[data-auth-signout]').forEach((button) => {
  button.addEventListener('click', async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    syncAuthUi(null)
  })
})

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return
  if (!event.target.closest('[data-auth-account]')) closeAuthMenus()

  const copyBtn = event.target.closest<HTMLButtonElement>('[data-copy-key]')
  if (copyBtn) {
    const textToCopy = copyBtn.dataset.copyKey || ''
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
      const prevText = copyBtn.innerHTML
      copyBtn.innerHTML = '✓ Copied!'
      setTimeout(() => {
        copyBtn.innerHTML = prevText
      }, 1800)
    }
    return
  }

  const toggleBtn = event.target.closest<HTMLButtonElement>('[data-toggle-target]')
  if (toggleBtn) {
    const targetId = toggleBtn.dataset.toggleTarget
    const codeNode = targetId ? document.getElementById(targetId) : null
    if (codeNode) {
      const full = toggleBtn.dataset.fullKey || ''
      const masked = toggleBtn.dataset.maskedKey || ''
      if (codeNode.textContent === full) {
        codeNode.textContent = masked
        toggleBtn.innerHTML = '👁️ Show'
      } else {
        codeNode.textContent = full
        toggleBtn.innerHTML = '👁️ Hide'
      }
    }
  }
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeAuthMenus()
    closeAuthModal()
  }
})

if (supabase) {
  supabase.auth
    .getSession()
    .then(({ data }) => syncAuthUi(data.session))
    .catch(console.error)
    .finally(resolveAuthReady)
  supabase.auth.onAuthStateChange((_event, session) => {
    syncAuthUi(session)
    if (session) closeAuthModal()
  })
} else {
  syncAuthUi(null)
  resolveAuthReady()
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (!prefersReducedMotion) {
  const lenis = new Lenis({
    duration: 1.25,
    smoothWheel: true,
    wheelMultiplier: 0.84,
    touchMultiplier: 1.08,
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
  })

  const raf = (time: number) => {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)
}

if (!isDocsPage && !isDashboardPage && !isModelsPage && !isPlaygroundPage && !isAdminPage && !isTopUpPage && !isRefundPage && !supportPage && window.location.pathname === '/') {
  const revealItems = [...document.querySelectorAll<HTMLElement>('.reveal-item')]

  revealItems.forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${Math.min(index % 8, 6) * 70}ms`)
  })

  if (prefersReducedMotion) {
    revealItems.forEach((item) => item.classList.add('is-visible'))
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          } else {
            entry.target.classList.remove('is-visible')
          }
        })
      },
      {
        threshold: 0.12,
        rootMargin: '-6% 0px -10% 0px',
      },
    )

    revealItems.forEach((item) => observer.observe(item))
  }
}

document.querySelectorAll<HTMLButtonElement>('.copy-button').forEach((button) => {
  button.addEventListener('click', async () => {
    const text = button.dataset.copy ?? ''
    await navigator.clipboard.writeText(text)
    button.textContent = 'Copied'
    setTimeout(() => {
      button.textContent = 'Copy'
    }, 1200)
  })
})

if (isDashboardPage) {
  type DashboardPayload = {
    workspace: {
      email: string
      creditUsd: number
      credits: number
      usedUsd30d: number
      usedCredits30d: number
      requests30d: number
      tokens30d: number
    }
    stats: Array<{ label: string; value: string; note: string; trend: string }>
    limits?: { plan: string; rpm: number }
    keys: Array<{ id: string; name: string; key: string; scope: string; lastUsed: string; createdAt?: string }>
    usage: {
      tokenBars: number[]
      requestBars: number[]
      spendByModel: Array<{ model: string; requests: number; spend: number; width: number }>
    }
  }

  const updateBars = (selector: string, values: number[]) => {
    const bars = document.querySelector<HTMLElement>(selector)
    if (!bars) return
    bars.innerHTML = values.map((value) => `<span style="--bar:${value}%"></span>`).join('')
  }

  const hydrateDashboard = async () => {
    if (!currentSession) {
      const workspaceHealth = document.querySelector<HTMLElement>('#workspace-health')
      const workspaceHealthNote = document.querySelector<HTMLElement>('#workspace-health-note')
      if (workspaceHealth) workspaceHealth.textContent = 'Sign in'
      if (workspaceHealthNote) workspaceHealthNote.textContent = 'Use Google or GitHub to open your Kiwi workspace.'
      const tableBody = document.querySelector<HTMLElement>('#key-table-body')
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="12" class="empty-state">Sign in from the account button to manage API keys.</td></tr>'
      }
      return
    }

    try {
      const data = await api<DashboardPayload>('/api/dashboard')
      const workspaceHealth = document.querySelector<HTMLElement>('#workspace-health')
      const workspaceHealthNote = document.querySelector<HTMLElement>('#workspace-health-note')
      const tokenTotal = document.querySelector<HTMLElement>('#token-total')
      const requestTotal = document.querySelector<HTMLElement>('#request-total')
      const spendTotal = document.querySelector<HTMLElement>('#spend-total')

      if (workspaceHealth) workspaceHealth.textContent = 'Live'
      const limits = data.limits || { plan: 'Free', rpm: 10 }
      if (workspaceHealthNote) workspaceHealthNote.textContent = `${limits.plan} plan: ${limits.rpm} RPM (Credit-based)`
      if (tokenTotal) tokenTotal.textContent = `${data.workspace.tokens30d.toLocaleString()} tokens`
      if (requestTotal) requestTotal.textContent = `${data.workspace.requests30d.toLocaleString()} requests`
      if (spendTotal) spendTotal.textContent = `${data.workspace.usedCredits30d.toLocaleString()} credits`

      document.querySelectorAll<HTMLElement>('.dash-stats article').forEach((card, index) => {
        const stat = data.stats[index]
        if (!stat) return
        card.querySelector('span')!.textContent = stat.label
        card.querySelector('b')!.textContent = stat.trend
        card.querySelector('strong')!.textContent = stat.value
        card.querySelector('p')!.textContent = stat.note
      })

      const tableBody = document.querySelector<HTMLElement>('#key-table-body')
      if (tableBody) {
        let createdKeysMap: Record<string, string> = {}
        try {
          createdKeysMap = JSON.parse(sessionStorage.getItem('kiwi_created_keys') || '{}')
        } catch {
          createdKeysMap = {}
        }

        const buildRows = (keys: typeof data.keys) => keys.length
          ? keys.map((item) => {
              const fullKey = createdKeysMap[item.id] || item.key
              const maskedKey = fullKey.includes('••••') ? fullKey : item.key.includes('...') ? item.key : `${fullKey.slice(0, 7)}...${fullKey.slice(-4)}`
              const keyDisplayId = `table-key-${escapeHtml(item.id)}`
              const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'
              return `
            <tr data-key-id="${escapeHtml(item.id)}" data-key-name="${escapeHtml(item.name.toLowerCase())}" data-key-preview="${escapeHtml(maskedKey.toLowerCase())}">
              <td><span class="key-dot"></span></td>
              <td class="key-col-name">${escapeHtml(item.name)}</td>
              <td><span class="key-status-badge">Enabled</span></td>
              <td>
                <div class="key-col-code">
                  <code id="${keyDisplayId}">${escapeHtml(maskedKey)}</code>
                  <button class="icon-btn" type="button" title="Copy key" data-copy-key="${escapeHtml(fullKey)}">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                </div>
              </td>
              <td>Unlimited</td>
              <td><span class="key-group-badge">User Group</span></td>
              <td>Unlimited</td>
              <td><span style="color:rgba(255,255,255,0.45);">No restriction</span></td>
              <td>${escapeHtml(createdDate)}</td>
              <td>${escapeHtml(item.lastUsed)}</td>
              <td><span style="color:rgba(255,255,255,0.45);">Never</span></td>
              <td>
                <div class="key-action-group">
                  <button class="icon-btn icon-btn-danger" type="button" title="Revoke" data-revoke-key="${escapeHtml(item.id)}">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                  <button class="icon-btn" type="button" title="Show/Hide key" data-toggle-target="${keyDisplayId}" data-full-key="${escapeHtml(fullKey)}" data-masked-key="${escapeHtml(maskedKey)}">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button class="icon-btn" type="button" title="More options">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          `
            }).join('')
          : `<tr><td colspan="12" class="empty-state">No keys created yet. Create an API key above to get started.</td></tr>`

        tableBody.innerHTML = buildRows(data.keys)

        // Filter logic
        const filterName = document.querySelector<HTMLInputElement>('#key-filter-name')
        const filterKey = document.querySelector<HTMLInputElement>('#key-filter-key')
        const applyFilter = () => {
          const nameQ = filterName?.value.toLowerCase() || ''
          const keyQ = filterKey?.value.toLowerCase() || ''
          const filtered = data.keys.filter(item => {
            const fullKey = createdKeysMap[item.id] || item.key
            const maskedKey = `${fullKey.slice(0, 7)}...${fullKey.slice(-4)}`
            return item.name.toLowerCase().includes(nameQ) && (maskedKey.toLowerCase().includes(keyQ) || fullKey.toLowerCase().includes(keyQ))
          })
          tableBody.innerHTML = buildRows(filtered)
          wireRevoke()
        }
        filterName?.addEventListener('input', applyFilter)
        filterKey?.addEventListener('input', applyFilter)
      }

      const wireRevoke = () => {
        document.querySelectorAll<HTMLButtonElement>('[data-revoke-key]').forEach((button) => {
          button.addEventListener('click', async () => {
            button.disabled = true
            try {
              await api<{ ok: boolean }>(`/api/keys/${button.dataset.revokeKey}/revoke`, { method: 'POST' })
              await hydrateDashboard()
            } catch (error) {
              button.disabled = false
              button.textContent = error instanceof Error ? error.message : 'Could not revoke'
            }
          })
        })
      }
      wireRevoke()

      updateBars('.dash-wide .dash-bars', data.usage.tokenBars)
      updateBars('.dash-panel:not(.dash-wide) .dash-bars', data.usage.requestBars)

      const spendList = document.querySelector<HTMLElement>('.model-spend-list')
      if (spendList) {
        spendList.innerHTML = data.usage.spendByModel.length
          ? data.usage.spendByModel
              .map(
                (item) => `
                <div>
                  <header><span>${escapeHtml(item.model)}</span><b>$${item.spend.toFixed(4)}</b></header>
                  <p>${item.requests.toLocaleString()} requests</p>
                  <i style="--fill:${item.width}%"></i>
                </div>
              `,
              )
              .join('')
          : '<p class="empty-state">No requests yet. Run the playground or use a key to see model spend.</p>'
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      const workspaceHealth = document.querySelector<HTMLElement>('#workspace-health')
      const workspaceHealthNote = document.querySelector<HTMLElement>('#workspace-health-note')
      if (workspaceHealth) workspaceHealth.textContent = 'Offline'
      if (workspaceHealthNote) workspaceHealthNote.textContent = error instanceof Error ? error.message : 'Could not fetch dashboard'
    }
  }

  hydrateDashboard().catch((error) => {
    const workspaceHealth = document.querySelector<HTMLElement>('#workspace-health')
    const workspaceHealthNote = document.querySelector<HTMLElement>('#workspace-health-note')
    if (workspaceHealth) workspaceHealth.textContent = 'Offline'
    if (workspaceHealthNote) workspaceHealthNote.textContent = error instanceof Error ? error.message : 'Dashboard API unavailable'
  })

  const dashboardRefresh = window.setInterval(() => {
    hydrateDashboard().catch(console.error)
  }, 5000)
  window.addEventListener('kiwi-auth-synced', () => {
    hydrateDashboard().catch(console.error)
  })
  window.addEventListener('beforeunload', () => window.clearInterval(dashboardRefresh))

  document.querySelector<HTMLButtonElement>('#redeem-button')?.addEventListener('click', async () => {
    const input = document.querySelector<HTMLInputElement>('#redeem-code')
    const message = document.querySelector<HTMLElement>('#redeem-message')
    try {
      const result = await api<{ creditsAdded: number }>('/api/redeem', {
        method: 'POST',
        body: JSON.stringify({ code: input?.value }),
      })
      if (message) message.textContent = `Success. Added ${result.creditsAdded} credits to your workspace.`
      if (input) input.value = ''
      await hydrateDashboard()
    } catch (error) {
      if (message) message.textContent = error instanceof Error ? error.message : 'Could not redeem code.'
    }
  })


  document.querySelector<HTMLButtonElement>('#create-key-button')?.addEventListener('click', async () => {
    const nameInput = document.querySelector<HTMLInputElement>('#key-name')
    const name = nameInput?.value.trim() || 'Dashboard key'
    const message = document.querySelector<HTMLElement>('#create-key-message')
    const button = document.querySelector<HTMLButtonElement>('#create-key-button')
    if (button) button.disabled = true
    try {
      const created = await api<{ id: string; name: string; key: string; displayKey: string }>('/api/keys', {
        method: 'POST',
        body: JSON.stringify({ name, models: [] }),
      })
      if (nameInput) nameInput.value = ''
      if (created.id && created.key) {
        try {
          const map = JSON.parse(sessionStorage.getItem('kiwi_created_keys') || '{}')
          map[created.id] = created.key
          sessionStorage.setItem('kiwi_created_keys', JSON.stringify(map))
        } catch {
          // ignore session storage errors
        }
      }
      await hydrateDashboard()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not create key.')
    } finally {
      if (button) button.disabled = false
    }
  })
}

if (isModelsPage) {
  type ModelPayload = {
    models: Array<{ id: string; provider: string; type: string; context: string; input: number | null; output: number | null; status: string }>
    summary?: { total: number; text: number; code: number; reasoning: number; image: number; video: number }
  }

  const priceText = (value: number | null, model: any = null) => {
    if (model && model.perRequest) return `$${model.perRequest < 0.01 ? model.perRequest.toFixed(4) : model.perRequest.toFixed(2)} / req`
    if (typeof value !== 'number') return 'Provider'
    if (value === 0) return 'Free'
    return `$${value < 0.01 ? value.toFixed(4) : value.toFixed(2)}`
  }
  const summarizeModels = (models: ModelPayload['models']) => ({
    total: models.length,
    text: models.filter((model) => model.type === 'Text').length,
    code: models.filter((model) => model.type === 'Code').length,
    reasoning: models.filter((model) => model.type === 'Reasoning').length,
    image: models.filter((model) => model.type === 'Image').length,
    video: models.filter((model) => model.type === 'Video').length,
  })
  const renderModelRows = (models: ModelPayload['models']) => {
    const table = document.querySelector('.model-table')
    const rowCount = document.querySelector<HTMLElement>('#model-row-count')
    if (!table) return
    if (rowCount) rowCount.textContent = `Showing ${models.length.toLocaleString()} live models`
    table.querySelectorAll('.model-row:not(.model-row-head)').forEach((row) => row.remove())
    table.insertAdjacentHTML(
      'beforeend',
      models.length
        ? models
            .map(
              (model) => `
              <div class="model-row" data-type="${escapeHtml(model.type)}">
                <strong>${escapeHtml(model.id)}</strong>
                <span>${escapeHtml(model.provider)}</span>
                <span>${escapeHtml(model.type)}</span>
                <span>${escapeHtml(model.context)}</span>
                <span>${priceText(model.input, model)}</span>
                <span>${priceText(model.output, model)}</span>
                <b class="${model.status === 'Paid' ? 'paid' : ''}">${escapeHtml(model.status)}</b>
              </div>
            `,
            )
            .join('')
        : '<div class="model-row"><strong>No models found</strong><span>Gateway</span><span>...</span><span>...</span><span>...</span><span>...</span><b>Empty</b></div>',
    )
  }

  api<ModelPayload>('/api/models')
    .then(({ models, summary }) => {
      const modelSummary = summary || summarizeModels(models)
      const total = document.querySelector<HTMLElement>('#model-total')
      const textCode = document.querySelector<HTMLElement>('#model-text-code')
      const media = document.querySelector<HTMLElement>('#model-media')
      if (total) total.textContent = modelSummary.total.toLocaleString()
      if (textCode) textCode.textContent = (modelSummary.text + modelSummary.code + modelSummary.reasoning).toLocaleString()
      if (media) media.textContent = (modelSummary.image + modelSummary.video).toLocaleString()

      renderModelRows(models)
      const search = document.querySelector<HTMLInputElement>('#model-search')
      const currentFilter = () => document.querySelector<HTMLButtonElement>('.model-filter-row button.active')?.textContent?.trim() || 'All'
      const filteredModels = () => {
        const filter = currentFilter()
        const query = (search?.value || '').trim().toLowerCase()
        return models.filter((model) => {
          const matchesFilter = filter === 'All' || model.type === filter
          const matchesQuery = !query || `${model.id} ${model.provider} ${model.type}`.toLowerCase().includes(query)
          return matchesFilter && matchesQuery
        })
      }

      document.querySelectorAll<HTMLButtonElement>('.model-filter-row button').forEach((button) => {
        button.addEventListener('click', () => {
          document.querySelectorAll<HTMLButtonElement>('.model-filter-row button').forEach((item) => item.classList.remove('active'))
          button.classList.add('active')
          renderModelRows(filteredModels())
        })
      })
      search?.addEventListener('input', () => renderModelRows(filteredModels()))
    })
    .catch(console.error)
}

if (isAdminPage) {
  type AdminPayload = {
    summary: {
      workspaces: number
      users: number
      activeKeys: number
      revokedKeys: number
      requests30d: number
      tokens30d: number
      creditsUsed30d: number
      playgroundRuns: number
    }
    usageByModel: Array<{ model: string; requests: number; tokens: number; spend: number }>
    keys: Array<{ name: string; workspace: string; preview: string; scope: string; lastUsed: string | null; createdAt: string; revoked: boolean }>
    audit: Array<{ actor: string; action: string; metadata: Record<string, unknown>; createdAt: string }>
    runs: Array<{ title: string; model: string; tokens: number; createdAt: string }>
    redemptionCodes: Array<{ code: string; credits: number; maxRedemptions: number; redeemedCount: number; expiresAt: string | null; createdAt: string | null }>
  }

  const adminDate = (value: string | null) => (value ? new Date(value).toLocaleString() : 'Never')
  const setAdminStatus = (state: string, note: string) => {
    const accessState = document.querySelector<HTMLElement>('#admin-access-state')
    const accessNote = document.querySelector<HTMLElement>('#admin-access-note')
    if (accessState) accessState.textContent = state
    if (accessNote) accessNote.textContent = note
  }

  const adminListEmpty = (id: string, message: string) => {
    const node = document.querySelector<HTMLElement>(id)
    if (node) node.innerHTML = `<p class="empty-state">${message}</p>`
  }

  const hydrateAdmin = async () => {
    if (!currentSession && !adminToken()) {
      setAdminStatus('Sign in required', 'Sign in with kiwi@admin.in to load admin data.')
      adminListEmpty('#admin-model-usage', 'Admin data is locked.')
      adminListEmpty('#admin-keys', 'Admin data is locked.')
      adminListEmpty('#admin-codes', 'Admin data is locked.')
      adminListEmpty('#admin-audit', 'Admin data is locked.')
      adminListEmpty('#admin-runs', 'Admin data is locked.')
      return
    }

    try {
      const data = await api<AdminPayload>('/api/admin/overview')
      const adminEmail = currentSession?.user.email || document.querySelector<HTMLInputElement>('#admin-email')?.value || 'admin'
      setAdminStatus('Verified admin', `${adminEmail} has backend admin access.`)
      const statMap: Record<string, string> = {
        Workspaces: data.summary.workspaces.toLocaleString(),
        Users: data.summary.users.toLocaleString(),
        'Active keys': data.summary.activeKeys.toLocaleString(),
        'Requests 30d': data.summary.requests30d.toLocaleString(),
        'Tokens 30d': data.summary.tokens30d.toLocaleString(),
        'Credits used': data.summary.creditsUsed30d.toLocaleString(),
      }
      document.querySelectorAll<HTMLElement>('[data-admin-stat]').forEach((node) => {
        const key = node.dataset.adminStat || ''
        node.textContent = statMap[key] || '0'
        const cardNote = node.closest('article')?.querySelector('p')
        if (cardNote) cardNote.textContent = key === 'Active keys' ? `${data.summary.revokedKeys.toLocaleString()} revoked` : 'Across Kiwi production'
      })

      const modelUsage = document.querySelector<HTMLElement>('#admin-model-usage')
      if (modelUsage) {
        modelUsage.innerHTML = data.usageByModel.length
          ? data.usageByModel
              .map(
                (item) => `
                  <div class="admin-list-row">
                    <strong>${escapeHtml(item.model)}</strong>
                    <span>${item.requests.toLocaleString()} requests</span>
                    <small>${item.tokens.toLocaleString()} tokens · $${item.spend.toFixed(4)}</small>
                  </div>
                `,
              )
              .join('')
          : '<p class="empty-state">No model usage yet.</p>'
      }

      const keys = document.querySelector<HTMLElement>('#admin-keys')
      if (keys) {
        keys.innerHTML = data.keys.length
          ? data.keys
              .map(
                (item) => `
                  <div class="admin-list-row ${item.revoked ? 'is-muted' : ''}">
                    <strong>${escapeHtml(item.name)}</strong>
                    <span>${escapeHtml(item.workspace)} · ${escapeHtml(item.preview)}</span>
                    <small>${escapeHtml(item.scope || 'All models')} · last used ${adminDate(item.lastUsed)}</small>
                  </div>
                `,
              )
              .join('')
          : '<p class="empty-state">No API keys yet.</p>'
      }

      const audit = document.querySelector<HTMLElement>('#admin-audit')
      if (audit) {
        audit.innerHTML = data.audit.length
          ? data.audit
              .map(
                (item) => `
                  <div class="admin-list-row">
                    <strong>${escapeHtml(item.action)}</strong>
                    <span>${escapeHtml(item.actor)}</span>
                    <small>${adminDate(item.createdAt)}</small>
                  </div>
                `,
              )
              .join('')
          : '<p class="empty-state">No audit events yet.</p>'
      }

      const codes = document.querySelector<HTMLElement>('#admin-codes')
      if (codes) {
        codes.innerHTML = data.redemptionCodes.length
          ? data.redemptionCodes
              .map((item) => {
                const expired = item.expiresAt ? new Date(item.expiresAt).getTime() < Date.now() : false
                return `
                  <div class="admin-list-row ${expired ? 'is-muted' : ''}">
                    <strong>${escapeHtml(item.code)}</strong>
                    <span>${item.credits.toLocaleString()} credits · ${item.redeemedCount.toLocaleString()}/${item.maxRedemptions.toLocaleString()} redeemed</span>
                    <small>Expires ${item.expiresAt ? adminDate(item.expiresAt) : 'never'} · created ${adminDate(item.createdAt)}</small>
                  </div>
                `
              })
              .join('')
          : '<p class="empty-state">No Kiwi codes created yet.</p>'
      }

      const runs = document.querySelector<HTMLElement>('#admin-runs')
      if (runs) {
        runs.innerHTML = data.runs.length
          ? data.runs
              .map(
                (item) => `
                  <div class="admin-list-row">
                    <strong>${escapeHtml(item.title)}</strong>
                    <span>${escapeHtml(item.model)}</span>
                    <small>${item.tokens.toLocaleString()} tokens · ${adminDate(item.createdAt)}</small>
                  </div>
                `,
              )
              .join('')
          : '<p class="empty-state">No playground runs yet.</p>'
      }

      const modelCount = document.querySelector<HTMLElement>('#admin-model-count')
      const keyCount = document.querySelector<HTMLElement>('#admin-key-count')
      const auditCount = document.querySelector<HTMLElement>('#admin-audit-count')
      const runCount = document.querySelector<HTMLElement>('#admin-run-count')
      const codeCount = document.querySelector<HTMLElement>('#admin-code-count')
      if (modelCount) modelCount.textContent = `${data.usageByModel.length} models`
      if (keyCount) keyCount.textContent = `${data.keys.length} keys`
      if (auditCount) auditCount.textContent = `${data.audit.length} events`
      if (runCount) runCount.textContent = `${data.runs.length} runs`
      if (codeCount) codeCount.textContent = `${data.redemptionCodes.length} codes`
    } catch (error) {
      setAdminStatus('Access blocked', error instanceof Error ? error.message : 'Could not load admin data.')
    }
  }

  document.querySelector<HTMLFormElement>('#admin-login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const message = document.querySelector<HTMLElement>('#admin-login-message')
    const email = document.querySelector<HTMLInputElement>('#admin-email')?.value.trim() || 'kiwi@admin.in'
    const password = document.querySelector<HTMLInputElement>('#admin-password')?.value || ''
    if (message) message.textContent = 'Signing in...'
    try {
      const result = await api<{ ok: boolean; token: string; email: string; expiresIn: number }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      window.sessionStorage.setItem('kiwi_admin_token', result.token)
      if (message) message.textContent = `Signed in as ${result.email}. Loading admin data...`
      await hydrateAdmin()
    } catch (error) {
      if (message) message.textContent = error instanceof Error ? error.message : 'Admin sign in failed.'
      return
    }
  })

  document.querySelector<HTMLFormElement>('#admin-code-form')?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const message = document.querySelector<HTMLElement>('#admin-code-message')
    const codeInput = document.querySelector<HTMLInputElement>('#admin-code')
    const credits = Number(document.querySelector<HTMLInputElement>('#admin-code-credits')?.value || 0)
    const maxRedemptions = Number(document.querySelector<HTMLInputElement>('#admin-code-max')?.value || 1)
    const expiryMode = document.querySelector<HTMLSelectElement>('#admin-code-expiry-mode')?.value || 'never'
    const expiryDate = document.querySelector<HTMLInputElement>('#admin-code-expiry-date')?.value || ''
    const expiryTime = document.querySelector<HTMLInputElement>('#admin-code-expiry-time')?.value || '23:59'
    try {
      const expiresAt = (() => {
        if (expiryMode === 'never') return null
        const date = new Date()
        if (expiryMode === '24h') date.setHours(date.getHours() + 24)
        if (expiryMode === '7d') date.setDate(date.getDate() + 7)
        if (expiryMode === '30d') date.setDate(date.getDate() + 30)
        if (expiryMode === 'custom') {
          if (!expiryDate) throw new Error('Choose an expiry date or set expiry to Never.')
          const custom = new Date(`${expiryDate}T${expiryTime || '23:59'}`)
          if (Number.isNaN(custom.getTime())) throw new Error('Choose a valid expiry date and time.')
          if (custom.getTime() <= Date.now()) throw new Error('Expiry must be in the future.')
          return custom.toISOString()
        }
        return date.toISOString()
      })()
      const created = await api<{ code: string; credits: number; maxRedemptions: number }>('/api/admin/redemption-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: codeInput?.value,
          credits,
          maxRedemptions,
          expiresAt,
        }),
      })
      if (message) message.textContent = `Created ${created.code} for ${created.credits.toLocaleString()} credits.`
      if (codeInput) codeInput.value = ''
      await hydrateAdmin()
    } catch (error) {
      if (message) message.textContent = error instanceof Error ? error.message : 'Could not create code.'
    }
  })

  const toggleCodeExpiryFields = () => {
    const isCustom = document.querySelector<HTMLSelectElement>('#admin-code-expiry-mode')?.value === 'custom'
    document.querySelectorAll<HTMLElement>('.admin-code-custom-expiry').forEach((field) => {
      field.hidden = !isCustom
    })
  }
  document.querySelector<HTMLSelectElement>('#admin-code-expiry-mode')?.addEventListener('change', toggleCodeExpiryFields)
  toggleCodeExpiryFields()

  window.addEventListener('kiwi-auth-synced', () => {
    hydrateAdmin().catch(console.error)
  })
  hydrateAdmin().catch(console.error)
}

if (isPlaygroundPage) {
  type ModelPayload = {
    models: Array<{ id: string; provider: string; type: string; context: string; input: number | null; output: number | null; status: string }>
  }

  const requestJson = () => {
    const textareas = document.querySelectorAll<HTMLTextAreaElement>('.prompt-panel textarea')
    const model = document.querySelector<HTMLSelectElement>('#playground-model')?.value || ''
    const temperature = Number(document.querySelector<HTMLInputElement>('.settings-panel input[type="range"]')?.value || 0.7)
    const maxTokens = Number(document.querySelector<HTMLInputElement>('.settings-panel input[type="number"]')?.value || 2048)
    return {
      model,
      stream: false,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: textareas[0]?.value || '' },
        { role: 'user', content: textareas[1]?.value || '' },
      ],
    }
  }

  const updateRequestJson = () => {
    const code = document.querySelector<HTMLElement>('#request-json')
    if (code) code.textContent = JSON.stringify(requestJson(), null, 2)
  }

  const hydratePlaygroundModels = async () => {
    const data = await api<ModelPayload>('/api/models')
    const select = document.querySelector<HTMLSelectElement>('#playground-model')
    if (!select) return
    select.innerHTML = data.models
      .map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.id)} · ${escapeHtml(model.provider)}</option>`)
      .join('')
    updateRequestJson()
  }

  const hydrateRuns = async () => {
    const data = await api<{ runs: Array<{ title: string; model: string; tokens: number; createdAt: string }> }>('/api/playground/runs')
    const panel = document.querySelector<HTMLElement>('.history-panel')
    if (!panel) return
    panel.querySelectorAll('div, .empty-state').forEach((item) => item.remove())
    panel.insertAdjacentHTML(
      'beforeend',
      data.runs.length
        ? data.runs
            .map(
              (item) => `
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${escapeHtml(item.model)}</span>
                  <small>${item.tokens.toLocaleString()} tokens · ${new Date(item.createdAt).toLocaleString()}</small>
                </div>
              `,
            )
            .join('')
        : '<p class="empty-state">No runs yet. Run a prompt to create the first backend record.</p>',
    )
  }

  hydratePlaygroundModels().catch((error) => {
    const output = document.querySelector<HTMLElement>('#assistant-output')
    if (output) output.innerHTML = `<p><b>Could not load models</b></p><p>${escapeHtml(error instanceof Error ? error.message : 'Model list unavailable.')}</p>`
  })
  hydrateRuns().catch(console.error)
  updateRequestJson()

  document.querySelectorAll<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>('.prompt-panel textarea, .settings-panel input, #playground-model').forEach((input) => {
    input.addEventListener('input', updateRequestJson)
    input.addEventListener('change', updateRequestJson)
  })

  document.querySelector<HTMLButtonElement>('#run-playground')?.addEventListener('click', async () => {
    const button = document.querySelector<HTMLButtonElement>('#run-playground')
    const status = document.querySelector<HTMLElement>('#run-status')
    const output = document.querySelector<HTMLElement>('#assistant-output')
    if (!button || !output || !status) return

    button.disabled = true
    status.textContent = 'Running...'
    output.innerHTML = '<p class="is-muted">Waiting for backend...</p>'

    try {
      const response = await api<{ message: string; tokens: number }>('/api/playground/run', {
        method: 'POST',
        body: JSON.stringify(requestJson()),
      })
      output.innerHTML = `<p>${escapeHtml(response.message).replace(/\\n/g, '<br>')}</p>`
      status.textContent = `Success · ${response.tokens.toLocaleString()} tokens`
      await hydrateRuns()
    } catch (error) {
      output.innerHTML = `<p class="is-error">${escapeHtml(error instanceof Error ? error.message : 'Run failed.')}</p>`
      status.textContent = 'Error'
    } finally {
      button.disabled = false
    }
  })
}

if (isUsagePage) {
  await authReady

  type LogEntry = {
    id: string; createdAt: string; model: string; keyName: string; keyPreview: string
    promptTokens: number; completionTokens: number; totalTokens: number; costUsd: number; status: string; latencyMs: number
  }
  type LogsPayload = { logs: LogEntry[]; total: number; page: number; pages: number; limit: number }

  let currentPage = 1

  const statusBadge = (s: string) =>
    s === 'error'
      ? `<span class="usage-status-badge usage-status-error">Error</span>`
      : `<span class="usage-status-badge usage-status-ok">Success</span>`

  const formatCost = (usd: number) => usd === 0 ? '—' : `$${usd.toFixed(6)}`
  const formatMs = (ms: number) => ms === 0 ? '—' : `${ms}ms`
  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return iso }
  }

  const renderPagination = (data: LogsPayload) => {
    const pag = document.querySelector<HTMLElement>('#usage-pagination')
    if (!pag) return
    if (data.pages <= 1) { pag.innerHTML = ''; return }
    pag.innerHTML = `
      <button class="usage-page-btn" ${data.page <= 1 ? 'disabled' : ''} data-page="${data.page - 1}">← Prev</button>
      <span>Page ${data.page} of ${data.pages} · ${data.total.toLocaleString()} total</span>
      <button class="usage-page-btn" ${data.page >= data.pages ? 'disabled' : ''} data-page="${data.page + 1}">Next →</button>
    `
    pag.querySelectorAll<HTMLButtonElement>('.usage-page-btn').forEach((btn) => {
      btn.addEventListener('click', () => { currentPage = Number(btn.dataset.page); hydrateUsage() })
    })
  }

  const hydrateUsage = async () => {
    const tbody = document.querySelector<HTMLElement>('#usage-logs-body')
    if (!tbody) return
    const modelQ = (document.querySelector<HTMLInputElement>('#usage-filter-model')?.value || '').toLowerCase()
    const statusQ = document.querySelector<HTMLSelectElement>('#usage-filter-status')?.value || ''
    const days = document.querySelector<HTMLSelectElement>('#usage-filter-period')?.value || '30'

    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '50', days })
      const data = await api<LogsPayload>(`/api/usage-logs?${params}`)

      const allLogs: LogEntry[] = Array.isArray(data?.logs) ? data.logs : []
      const total = data?.total ?? allLogs.length

      const logs = allLogs.filter((l) => {
        return (!modelQ || l.model.toLowerCase().includes(modelQ)) && (!statusQ || l.status === statusQ)
      })

      const totalTokens = allLogs.reduce((s, l) => s + (l.totalTokens || 0), 0)
      const totalCost = allLogs.reduce((s, l) => s + (l.costUsd || 0), 0)
      const reqEl = document.querySelector<HTMLElement>('#usage-total-requests')
      const tokEl = document.querySelector<HTMLElement>('#usage-total-tokens')
      const costEl = document.querySelector<HTMLElement>('#usage-total-cost')
      if (reqEl) reqEl.textContent = total.toLocaleString()
      if (tokEl) tokEl.textContent = totalTokens >= 1000 ? `${(totalTokens / 1000).toFixed(1)}K` : String(totalTokens)
      if (costEl) costEl.textContent = totalCost === 0 ? '$0.00' : `$${totalCost.toFixed(4)}`

      tbody.innerHTML = logs.length
        ? logs.map((l) => `
          <tr>
            <td class="usage-col-time">${formatDate(l.createdAt)}</td>
            <td><span class="usage-model-tag">${escapeHtml(l.model)}</span></td>
            <td><code class="usage-key-code">${escapeHtml(l.keyName)}</code></td>
            <td class="usage-num">${(l.promptTokens || 0).toLocaleString()}</td>
            <td class="usage-num">${(l.completionTokens || 0).toLocaleString()}</td>
            <td class="usage-num usage-num-total">${(l.totalTokens || 0).toLocaleString()}</td>
            <td class="usage-num">${formatCost(l.costUsd || 0)}</td>
            <td>${statusBadge(l.status || 'success')}</td>
            <td class="usage-num">${formatMs(l.latencyMs || 0)}</td>
          </tr>`).join('')
        : `<tr><td colspan="9" class="empty-state">No usage logs yet — start making API requests to see them here.</td></tr>`

      renderPagination({ ...data, logs: allLogs, total })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not load usage logs.'
      const tbody2 = document.querySelector<HTMLElement>('#usage-logs-body')
      if (tbody2) {
        tbody2.innerHTML = currentSession
          ? `<tr><td colspan="9" class="empty-state">${escapeHtml(msg)}</td></tr>`
          : `<tr><td colspan="9" class="empty-state">Sign in to view your usage logs.</td></tr>`
      }
    }
  }

  await hydrateUsage()

  let filterTimer: ReturnType<typeof setTimeout>
  document.querySelector('#usage-filter-model')?.addEventListener('input', () => {
    clearTimeout(filterTimer); filterTimer = setTimeout(() => { currentPage = 1; hydrateUsage() }, 300)
  })
  document.querySelector('#usage-filter-status')?.addEventListener('change', () => { currentPage = 1; hydrateUsage() })
  document.querySelector('#usage-filter-period')?.addEventListener('change', () => { currentPage = 1; hydrateUsage() })
  document.querySelector('#usage-refresh-btn')?.addEventListener('click', () => { currentPage = 1; hydrateUsage() })
}
