import type { SupportPage } from '../supportPages'

export const communityPage: SupportPage = {
  title: 'Community - Kiwi LLM',
  label: 'Community',
  eyebrow: 'CONNECT',
  intro: 'Find product updates, setup help, and launch announcements for Kiwi builders.',
  blocks: [
    { title: 'Telegram', text: 'Join the public Telegram channel for announcements and quick support.' },
    { title: 'Discord', text: 'Discord can be linked here when the community server is ready.' },
  ],
  cta: { label: 'Open Telegram', href: 'https://t.me/KIWILLM' },
}
