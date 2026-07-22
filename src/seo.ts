import { refundPolicyTitle } from './pages/refundPolicy'
import { supportPages } from './pages/supportPages'

const siteUrl = 'https://kiwillm.in'
const defaultImage = `${siteUrl}/kiwi-logo-512.png`

type SeoConfig = {
  title: string
  description: string
  type?: 'website' | 'article'
  noindex?: boolean
}

const routeSeo: Record<string, SeoConfig> = {
  '/': {
    title: 'Kiwi LLM - One API Gateway for AI Models and Coding Agents',
    description:
      'Kiwi LLM gives builders one OpenAI-compatible API gateway for AI models, agent workflows, API keys, usage tracking, credits, and team-ready model routing.',
  },
  '/docs': {
    title: 'Kiwi LLM Docs - Connect OpenAI, Claude CLI, Codex, Cursor and More',
    description:
      'Read Kiwi LLM integration docs for OpenAI-compatible endpoints, Anthropic-style clients, Claude CLI, Codex, Cursor, Cline, Roo Code, image routes, and video routes.',
  },
  '/models': {
    title: 'AI Models - Live Kiwi LLM Model Routes',
    description:
      'Browse live Kiwi LLM model routes for text, code, reasoning, image, and video generation through one API key and one gateway.',
  },
  '/playground': {
    title: 'Kiwi LLM Playground - Test AI Model Routes',
    description:
      'Test prompts against live Kiwi LLM model routes, tune generation settings, preview request JSON, and inspect recent playground runs.',
  },
  '/dashboard': {
    title: 'Kiwi LLM Dashboard - API Keys, Credits and Usage',
    description:
      'Manage Kiwi LLM workspace credits, API keys, usage, model spend, redemption codes, and production gateway activity.',
    noindex: true,
  },
  '/admin': {
    title: 'Kiwi LLM Admin',
    description: 'Kiwi LLM internal admin workspace for monitoring usage, keys, credits, redemption codes, and audit activity.',
    noindex: true,
  },
  '/top-up': {
    title: 'Top Up Kiwi LLM Credits - AI Model API Billing',
    description:
      'Top up Kiwi LLM workspace credits for OpenAI-compatible model routing across text, code, reasoning, image, and video routes.',
  },
  '/status': {
    title: 'Kiwi LLM Status - Live Gateway Uptime & Model Latencies',
    description: 'Check real-time system status, API gateway health, response latencies, 30-day uptime bars, and operational health across all LLM models.',
  },
  '/account': {
    title: 'Account Settings - Kiwi LLM',
    description: 'Manage your Kiwi LLM account profile, display name, avatar, security, and authentication credentials.',
    noindex: true,
  },
  '/refund-policy': {
    title: refundPolicyTitle,
    description:
      'Read the Kiwi LLM refund policy for prepaid credits, billing errors, unauthorized charges, chargebacks, consumer rights, and contact information.',
    type: 'article',
  },
}

const setMeta = (selector: string, attribute: 'content' | 'href', value: string) => {
  const node = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector)
  if (node) {
    node.setAttribute(attribute, value)
  }
}

const upsertJsonLd = (id: string, data: unknown) => {
  let script = document.head.querySelector<HTMLScriptElement>(`#${id}`)
  if (!script) {
    script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(data)
}

export const getSeoForPath = (path: string): SeoConfig => {
  const supportPage = supportPages[path]
  if (supportPage) {
    return {
      title: supportPage.title,
      description: supportPage.intro,
      type: path.includes('policy') || path === '/terms' || path === '/acceptable-use' ? 'article' : 'website',
    }
  }

  return (
    routeSeo[path] || {
      title: 'Page Not Found - Kiwi LLM',
      description: 'This Kiwi LLM page could not be found. Return to docs, models, playground, or the dashboard.',
      noindex: true,
    }
  )
}

export const applySeo = (path: string) => {
  const seo = getSeoForPath(path)
  const canonical = `${siteUrl}${path === '/' ? '' : path}`
  const robots = seo.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'

  document.title = seo.title
  setMeta('meta[name="description"]', 'content', seo.description)
  setMeta('meta[name="robots"]', 'content', robots)
  setMeta('link[rel="canonical"]', 'href', canonical)
  setMeta('meta[property="og:title"]', 'content', seo.title)
  setMeta('meta[property="og:description"]', 'content', seo.description)
  setMeta('meta[property="og:url"]', 'content', canonical)
  setMeta('meta[property="og:type"]', 'content', seo.type || 'website')
  setMeta('meta[property="og:image"]', 'content', defaultImage)
  setMeta('meta[name="twitter:title"]', 'content', seo.title)
  setMeta('meta[name="twitter:description"]', 'content', seo.description)
  setMeta('meta[name="twitter:image"]', 'content', defaultImage)

  upsertJsonLd('kiwi-org-jsonld', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kiwi LLM',
    url: siteUrl,
    logo: defaultImage,
    sameAs: ['https://x.com/KIWILLM', 'https://t.me/KIWILLM'],
  })

  upsertJsonLd('kiwi-software-jsonld', {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Kiwi LLM',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url: siteUrl,
    description: routeSeo['/'].description,
    offers: {
      '@type': 'Offer',
      price: '10',
      priceCurrency: 'USD',
      category: 'Prepaid API credits',
    },
  })
}
