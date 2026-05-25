import type { SupportPage } from '../supportPages'

export const statusPage: SupportPage = {
  title: 'Status - Kiwi LLM',
  label: 'Status',
  eyebrow: 'STATUS',
  intro: 'Live production status should be backed by monitoring. This page gives users the right place to check gateway, auth, billing, and upstream model health.',
    blocks: [
      { title: 'Gateway', text: 'API health is exposed at /api/health and readiness at /api/ready for uptime monitors.' },
      { title: 'Provider routes', text: 'Model availability is loaded from the active worker, with fallback routes shown if the upstream list cannot be reached.' },
      {
        title: 'What We Monitor',
        text: 'A production status setup should monitor static app availability, API readiness, database connectivity, upstream worker health, auth provider availability, and payment confirmation flows.',
      },
      {
        title: 'Incident States',
        text: 'Incidents should be classified as investigating, identified, monitoring, or resolved so users understand whether the team is still diagnosing or already validating a fix.',
      },
      {
        title: 'User Impact',
        text: 'Status updates should call out affected endpoints, affected model routes, expected symptoms, and whether users need to retry requests or rotate credentials.',
      },
    ],
  cta: { label: 'View models', href: '/models' },
}
