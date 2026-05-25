import type { SupportPage } from '../supportPages'

export const termsPage: SupportPage = {
  title: 'Terms - Kiwi LLM',
  label: 'Terms',
  eyebrow: 'LEGAL',
  intro: 'These production-facing terms set expectations for acceptable use, credits, API access, and service availability.',
  blocks: [
    { title: 'Use of service', text: 'Use Kiwi for lawful development and production workloads. Do not abuse upstream providers, bypass rate limits, resell access without permission, or send content that violates provider policies.' },
    {
      title: 'Credits and access',
      text: 'Credits are prepaid usage units. Model availability, pricing, and routing may change as upstream providers change.',
      items: ['Keep your Kiwi keys private.', 'You are responsible for traffic sent with keys issued to your workspace.', 'Revoked or expired keys stop working immediately.'],
    },
    {
      title: 'Accounts and Security',
      text: 'You are responsible for maintaining access to your workspace, protecting credentials, and ensuring that users invited to your workspace follow these terms.',
      items: ['Do not share admin credentials.', 'Rotate exposed API keys immediately.', 'Notify Kiwi support if you suspect unauthorized use.'],
    },
    {
      title: 'Service Changes',
      text: 'Kiwi may add, remove, rename, throttle, or replace model routes as upstream providers, costs, safety requirements, or infrastructure conditions change.',
      items: ['Model names and pricing may change.', 'Preview features may be modified or removed.', 'Enterprise commitments must be written in a separate order form.'],
    },
    {
      title: 'Limitations',
      text: 'The service is provided as available. Kiwi is not responsible for every upstream provider outage, model behavior, latency event, rejected prompt, or generated output.',
    },
  ],
}
