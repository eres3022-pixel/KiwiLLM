import type { SupportPage } from '../supportPages'

export const statusPage: SupportPage = {
  title: 'Status - Kiwi LLM',
  label: 'Status',
  eyebrow: 'STATUS',
  intro: 'Live production status should be backed by monitoring. This page gives users the right place to check gateway, auth, billing, and upstream model health.',
  blocks: [
    { title: 'Gateway', text: 'API health is exposed at /api/health and readiness at /api/ready for uptime monitors.' },
    { title: 'Provider routes', text: 'Model availability is loaded from the active worker, with fallback routes shown if the upstream list cannot be reached.' },
  ],
  cta: { label: 'View models', href: '/models' },
}
