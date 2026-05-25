import type { SupportPage } from '../supportPages'

export const changelogPage: SupportPage = {
  title: 'Changelog - Kiwi LLM',
  label: 'Changelog',
  eyebrow: 'RELEASES',
  intro: 'Track production changes across the app, gateway, model routing, and dashboard surfaces.',
  blocks: [
    { title: 'May 2026', text: 'Added dashboard, model browser, docs, playground, admin overview, redemption codes, and API key creation.' },
    { title: 'Next', text: 'Top-up checkout, legal pages, public status, and production monitoring polish.' },
  ],
}
