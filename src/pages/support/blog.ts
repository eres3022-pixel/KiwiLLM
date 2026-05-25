import type { SupportPage } from '../supportPages'

export const blogPage: SupportPage = {
  title: 'Blog - Kiwi LLM',
  label: 'Blogs',
  eyebrow: 'NOTES',
  intro: 'A place for release stories, routing notes, model comparisons, and practical guides for agent-heavy teams.',
  blocks: [
    { title: 'Launch notes', text: 'Kiwi brings model routing, key management, usage metering, playground runs, and admin credit tools into one app.' },
    { title: 'Coming articles', text: 'Planned posts include Codex setup, Claude CLI routing, credit planning, and provider fallback strategy.' },
  ],
}
