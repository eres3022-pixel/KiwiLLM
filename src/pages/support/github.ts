import type { SupportPage } from '../supportPages'

export const githubPage: SupportPage = {
  title: 'GitHub - Kiwi LLM',
  label: 'GitHub',
  eyebrow: 'SOURCE',
  intro: 'Use this page as the stable footer destination until the public GitHub organization or repository is ready.',
    blocks: [
      { title: 'Repository', text: 'Add the production GitHub URL here when source packages, SDK examples, or issue templates are published.' },
      { title: 'For now', text: 'Docs include the integration examples needed to connect Kiwi to existing clients.' },
      {
        title: 'What Belongs on GitHub',
        text: 'GitHub is the right place for SDK examples, sample apps, issue templates, changelog mirrors, client configuration snippets, and reproducible bug reports.',
      },
      {
        title: 'Issue Quality',
        text: 'A good issue should include the client, endpoint, model id, request shape, response status, expected behavior, and whether the problem reproduces with a fresh key.',
      },
      {
        title: 'Security Reports',
        text: 'Do not open public GitHub issues for vulnerabilities, leaked secrets, or account-specific abuse reports. Send those to security@kiwillm.in.',
      },
    ],
  cta: { label: 'Open docs', href: '/docs' },
}
