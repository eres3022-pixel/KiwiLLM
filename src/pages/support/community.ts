import type { SupportPage } from '../supportPages'

export const communityPage: SupportPage = {
  title: 'Community - Kiwi LLM',
  label: 'Community',
  eyebrow: 'CONNECT',
  intro: 'Find product updates, setup help, and launch announcements for Kiwi builders.',
    blocks: [
      { title: 'Telegram', text: 'Join the public Telegram channel for announcements and quick support.' },
      { title: 'Discord', text: 'Discord can be linked here when the community server is ready.' },
      {
        title: 'Community Guidelines',
        text: 'Keep discussions focused on setup help, model routing, agent workflows, billing questions, and product feedback. Do not share secrets, private customer data, or full API keys.',
      },
      {
        title: 'Launch Updates',
        text: 'Community channels may announce new models, pricing changes, route availability, maintenance windows, and creator program opportunities.',
      },
      {
        title: 'Support Boundaries',
        text: 'Public community spaces are not the right place for account-specific billing, security, or credential issues. Use email support for private matters.',
      },
    ],
  cta: { label: 'Open Telegram', href: 'https://t.me/kiwillmofficial' },
}
