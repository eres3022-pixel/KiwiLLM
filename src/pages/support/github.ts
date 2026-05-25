import type { SupportPage } from '../supportPages'

export const githubPage: SupportPage = {
  title: 'GitHub - Kiwi LLM',
  label: 'GitHub',
  eyebrow: 'SOURCE',
  intro: 'Use this page as the stable footer destination until the public GitHub organization or repository is ready.',
  blocks: [
    { title: 'Repository', text: 'Add the production GitHub URL here when source packages, SDK examples, or issue templates are published.' },
    { title: 'For now', text: 'Docs include the integration examples needed to connect Kiwi to existing clients.' },
  ],
  cta: { label: 'Open docs', href: '/docs' },
}
