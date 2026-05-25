import type { SupportPage } from '../supportPages'

export const changelogPage: SupportPage = {
  title: 'Changelog - Kiwi LLM',
  label: 'Changelog',
  eyebrow: 'RELEASES',
  intro: 'Track production changes across the app, gateway, model routing, and dashboard surfaces.',
    blocks: [
      { title: 'May 2026', text: 'Added dashboard, model browser, docs, playground, admin overview, redemption codes, and API key creation.' },
      { title: 'Next', text: 'Top-up checkout, legal pages, public status, and production monitoring polish.' },
      {
        title: 'Page and Navigation Work',
        text: 'Footer navigation now points to real routes, policy pages use detailed layouts, and page content is split into route-specific modules for easier maintenance.',
      },
      {
        title: 'Gateway Fixes',
        text: 'Static production assets are served outside the API CORS middleware so the built app can load JavaScript and CSS correctly from the Node server.',
      },
      {
        title: 'Release Format',
        text: 'Future changelog entries should include date, affected surfaces, user impact, migration notes, and verification steps for production deploys.',
      },
    ],
  }
