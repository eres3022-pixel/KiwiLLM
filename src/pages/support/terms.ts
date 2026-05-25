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
  ],
}
