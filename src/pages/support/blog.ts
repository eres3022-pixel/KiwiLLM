import type { SupportPage } from '../supportPages'

export const blogPage: SupportPage = {
  title: 'Blog - Kiwi LLM',
  label: 'Blogs',
  eyebrow: 'NOTES',
  intro: 'A place for release stories, routing notes, model comparisons, and practical guides for agent-heavy teams.',
    blocks: [
      { title: 'Launch notes', text: 'Kiwi brings model routing, key management, usage metering, playground runs, and admin credit tools into one app.' },
      { title: 'Coming articles', text: 'Planned posts include Codex setup, Claude CLI routing, credit planning, and provider fallback strategy.' },
      {
        title: 'Technical Guides',
        text: 'Guides should focus on real setup flows: configuring clients, rotating keys, choosing model routes, understanding token usage, and debugging common gateway errors.',
      },
      {
        title: 'Model Notes',
        text: 'Model articles can explain route behavior, pricing tradeoffs, latency expectations, context windows, and when to choose coding, reasoning, media, or lightweight routes.',
      },
      {
        title: 'Release Posts',
        text: 'Release posts should document what changed, who is affected, migration steps if any, and how teams can validate production behavior after deployment.',
      },
    ],
  }
